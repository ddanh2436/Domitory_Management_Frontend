"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useToast } from "../components/ToastProvider";
import { useConfirm } from "../components/ConfirmProvider";
import { apiClient } from "../utils/apiClient";

type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type Status = "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";

interface StatusHistoryEntry {
  status: Status;
  note?: string;
  changedByName?: string;
  changedByRole?: string;
  at: string;
}

interface AssignedRequest {
  _id: string;
  user?: { fullName?: string; mssv?: string; phone?: string };
  room?: { name: string; building: string; floor: number };
  title: string;
  description: string;
  imageUrl?: string;
  priority: Priority;
  status: Status;
  createdAt: string;
  resolvedAt?: string;
  rating?: number;
  rejectionReason?: string;
  resolutionNote?: string;
  statusHistory?: StatusHistoryEntry[];
}

const PRIORITY_CFG: Record<Priority, { label: string; color: string; bg: string }> = {
  LOW: { label: "Thấp", color: "#64748b", bg: "rgba(100,116,139,.1)" },
  MEDIUM: { label: "Bình thường", color: "#0284c7", bg: "rgba(2,132,199,.1)" },
  HIGH: { label: "Ưu tiên cao", color: "#ea580c", bg: "rgba(234,88,12,.1)" },
  URGENT: { label: "Khẩn cấp", color: "#dc2626", bg: "rgba(220,38,38,.1)" },
};

const STATUS_CFG: Record<Status, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Chờ xử lý", color: "#b45309", bg: "rgba(245,158,11,.1)" },
  IN_PROGRESS: { label: "Đang sửa chữa", color: "#0284c7", bg: "rgba(14,165,233,.1)" },
  RESOLVED: { label: "Hoàn thành", color: "#16a34a", bg: "rgba(34,197,94,.1)" },
  REJECTED: { label: "Từ chối", color: "#dc2626", bg: "rgba(220,38,38,.1)" },
};

type FilterKey = "ALL" | Status;

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "Chờ xử lý" },
  { key: "IN_PROGRESS", label: "Đang sửa" },
  { key: "RESOLVED", label: "Hoàn thành" },
  { key: "REJECTED", label: "Từ chối" },
];

export default function StaffDashboardPage() {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [requests, setRequests] = useState<AssignedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [search, setSearch] = useState("");
  // Modal nhập ghi chú: REJECT = lý do từ chối (bắt buộc), RESOLVE = nội dung xử lý (tùy chọn)
  const [actionModal, setActionModal] = useState<{ req: AssignedRequest; type: "REJECT" | "RESOLVE" } | null>(null);
  const [noteText, setNoteText] = useState("");
  const socketRef = useRef<Socket | null>(null);

  // Không setLoading(true) ở đây: lần đầu state đã là true, còn refetch sau
  // hành động thì giữ danh sách cũ hiển thị cho mượt thay vì nháy skeleton.
  const fetchAssigned = async () => {
    try {
      const res = await apiClient.get("/maintenance/assigned/me");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setRequests(data);
      }
    } catch (error) {
      console.error("Lỗi tải công việc:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAssigned();
  }, []);

  // Realtime: khi được phân công việc mới (thông báo MAINTENANCE), tự tải lại danh sách
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const socketUrl = rawApiUrl.replace(/\/api$/, "");
    socketRef.current = io(socketUrl, { auth: { token } });

    socketRef.current.on("newNotification", (n: { type?: string }) => {
      if ((n?.type || "").toUpperCase() === "MAINTENANCE") {
        void fetchAssigned();
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gọi API đổi trạng thái (kèm lý do/ghi chú nếu có). Không tự confirm — caller quyết định.
  const performUpdate = async (
    req: AssignedRequest,
    nextStatus: Status,
    extra?: { rejectionReason?: string; note?: string },
  ) => {
    setProcessingId(req._id);
    try {
      const res = await apiClient.patch(`/maintenance/${req._id}/status`, {
        status: nextStatus,
        ...extra,
      });
      const data = await res.json();
      if (res.ok) {
        const msg =
          nextStatus === "RESOLVED"
            ? "Đã đánh dấu hoàn thành. Cảm ơn bạn!"
            : nextStatus === "REJECTED"
              ? "Đã từ chối yêu cầu và gửi lý do cho sinh viên."
              : "Đã tiếp nhận công việc.";
        toast.success(msg, "Cập nhật thành công");
        void fetchAssigned();
        return true;
      }
      toast.error(data.message || "Không cập nhật được trạng thái.");
      return false;
    } catch {
      toast.error("Không thể kết nối đến máy chủ.");
      return false;
    } finally {
      setProcessingId(null);
    }
  };

  // Tiếp nhận (PENDING -> IN_PROGRESS): xác nhận đơn giản, không cần ghi chú
  const handleAccept = async (req: AssignedRequest) => {
    const ok = await confirmDialog({
      title: "Tiếp nhận công việc này?",
      message: `Yêu cầu "${req.title}" sẽ chuyển sang trạng thái "Đang sửa chữa".`,
      confirmLabel: "Tiếp nhận",
    });
    if (!ok) return;
    await performUpdate(req, "IN_PROGRESS");
  };

  // Mở modal nhập ghi chú cho Hoàn thành / Từ chối
  const openActionModal = (req: AssignedRequest, type: "REJECT" | "RESOLVE") => {
    setNoteText("");
    setActionModal({ req, type });
  };

  const submitActionModal = async () => {
    if (!actionModal) return;
    const { req, type } = actionModal;
    if (type === "REJECT") {
      if (!noteText.trim()) {
        toast.error("Vui lòng nhập lý do từ chối.");
        return;
      }
      const ok = await performUpdate(req, "REJECTED", { rejectionReason: noteText.trim() });
      if (ok) setActionModal(null);
    } else {
      const ok = await performUpdate(req, "RESOLVED", { note: noteText.trim() || undefined });
      if (ok) setActionModal(null);
    }
  };

  const countByStatus = (s: Status) => requests.filter((r) => r.status === s).length;

  // Điểm đánh giá trung bình từ các việc đã hoàn thành được sinh viên chấm sao
  const rated = requests.filter((r) => r.status === "RESOLVED" && r.rating);
  const avgRating = rated.length > 0
    ? (rated.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rated.length).toFixed(1)
    : null;

  // Áp bộ lọc trạng thái + từ khóa tìm kiếm (tiêu đề, mô tả, tên phòng)
  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (filter !== "ALL" && r.status !== filter) return false;
      if (!kw) return true;
      return (
        r.title.toLowerCase().includes(kw) ||
        r.description.toLowerCase().includes(kw) ||
        (r.room?.name ?? "").toLowerCase().includes(kw)
      );
    });
  }, [requests, filter, search]);

  const active = filtered.filter((r) => r.status === "PENDING" || r.status === "IN_PROGRESS");
  const done = filtered.filter((r) => r.status === "RESOLVED" || r.status === "REJECTED");

  const renderCard = (req: AssignedRequest) => {
    const p = PRIORITY_CFG[req.priority];
    const s = STATUS_CFG[req.status];
    return (
      <div key={req._id} className="sf-card" style={{ borderLeftColor: p.color }}>
        <div className="sf-card-head">
          <div>
            <span className="sf-room">{req.room?.name || "—"}</span>
            <span className="sf-room-sub">Tòa {req.room?.building} · Tầng {req.room?.floor}</span>
          </div>
          <span className="sf-chip" style={{ color: s.color, background: s.bg }}>{s.label}</span>
        </div>

        <div className="sf-title">{req.title}</div>
        <div className="sf-desc">{req.description}</div>

        {req.imageUrl && (
          <a className="sf-image-link" href={req.imageUrl} target="_blank" rel="noreferrer">
            📷 Xem ảnh hiện trường
          </a>
        )}

        <div className="sf-meta">
          <span className="sf-chip" style={{ color: p.color, background: p.bg }}>{p.label}</span>
          <span className="sf-meta-item">👤 {req.user?.fullName || "—"}{req.user?.phone ? ` · ${req.user.phone}` : ""}</span>
          <span className="sf-meta-item">🕒 {new Date(req.createdAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
          {req.rating ? <span className="sf-meta-item">⭐ {req.rating}/5</span> : null}
        </div>

        {/* Lý do từ chối / nội dung đã xử lý / nhật ký */}
        {req.status === "REJECTED" && req.rejectionReason && (
          <div className="sf-note sf-note--reject">
            <span className="sf-note-label">✕ Lý do từ chối</span>
            <span className="sf-note-text">{req.rejectionReason}</span>
          </div>
        )}
        {req.status === "RESOLVED" && req.resolutionNote && (
          <div className="sf-note sf-note--done">
            <span className="sf-note-label">✓ Đã xử lý</span>
            <span className="sf-note-text">{req.resolutionNote}</span>
          </div>
        )}
        {req.statusHistory && req.statusHistory.length > 0 && (
          <details className="sf-history">
            <summary>Nhật ký xử lý ({req.statusHistory.length})</summary>
            <ul className="sf-history-list">
              {req.statusHistory.map((h, i) => (
                <li key={i} className="sf-history-item">
                  <span className="sf-chip" style={{ color: STATUS_CFG[h.status].color, background: STATUS_CFG[h.status].bg }}>
                    {STATUS_CFG[h.status].label}
                  </span>
                  <span className="sf-history-meta">
                    {new Date(h.at).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    {h.changedByName ? ` · ${h.changedByName}` : ""}
                  </span>
                  {h.note && <span className="sf-history-note">“{h.note}”</span>}
                </li>
              ))}
            </ul>
          </details>
        )}

        {(req.status === "PENDING" || req.status === "IN_PROGRESS") && (
          <div className="sf-actions">
            {req.status === "PENDING" && (
              <button
                type="button"
                className="sf-btn sf-btn--accept"
                disabled={processingId === req._id}
                onClick={() => void handleAccept(req)}
              >
                🔧 Tiếp nhận sửa chữa
              </button>
            )}
            {req.status === "IN_PROGRESS" && (
              <button
                type="button"
                className="sf-btn sf-btn--done"
                disabled={processingId === req._id}
                onClick={() => openActionModal(req, "RESOLVE")}
              >
                ✓ Hoàn thành
              </button>
            )}
            <button
              type="button"
              className="sf-btn sf-btn--reject"
              disabled={processingId === req._id}
              onClick={() => openActionModal(req, "REJECT")}
            >
              ✕ Từ chối
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <style>{`
        .sf-hero { background: linear-gradient(135deg, #0D1B2A 0%, #182b43 60%, #253d5d 100%); color: #fff; border-radius: 16px; padding: 24px 26px; border: 1px solid rgba(201,168,76,0.25); margin-bottom: 22px; }
        .sf-hero-title { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 23px; font-weight: 700; letter-spacing: -.3px; }
        .sf-hero-sub { margin-top: 5px; color: rgba(255,255,255,.65); font-size: 13px; line-height: 1.6; }
        .sf-hero-stats { display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
        .sf-stat { background: rgba(255,255,255,0.06); border: 1px solid rgba(201,168,76,0.2); border-radius: 10px; padding: 10px 16px; min-width: 100px; }
        .sf-stat-num { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 20px; font-weight: 700; }
        .sf-stat-label { font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 1px; }

        .sf-section { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 16px; font-weight: 600; color: #0D1B2A; margin: 22px 0 12px; }
        .sf-cards { display: flex; flex-direction: column; gap: 12px; }
        .sf-card { background: #fff; border: 1px solid rgba(13,27,42,0.09); border-left: 4px solid transparent; border-radius: 10px; padding: 18px 20px; }
        .sf-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
        .sf-room { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 16px; font-weight: 700; color: #0D1B2A; margin-right: 10px; }
        .sf-room-sub { font-size: 12px; color: #8A9BAD; }
        .sf-chip { display: inline-flex; align-items: center; padding: 4px 11px; border-radius: 100px; font-size: 11.5px; font-weight: 700; white-space: nowrap; }
        .sf-title { font-size: 14.5px; font-weight: 700; color: #0D1B2A; }
        .sf-desc { font-size: 13px; color: #5c6f82; line-height: 1.65; margin-top: 5px; }
        .sf-image-link { display: inline-block; margin-top: 10px; font-size: 12.5px; color: #2563eb; font-weight: 600; text-decoration: none; }
        .sf-image-link:hover { text-decoration: underline; }
        .sf-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 12px; }
        .sf-meta-item { font-size: 12px; color: #8A9BAD; font-weight: 500; }
        .sf-actions { display: flex; gap: 10px; margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(13,27,42,0.06); }
        .sf-btn { padding: 10px 18px; border-radius: 8px; border: none; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s; }
        .sf-btn:disabled { opacity: .55; cursor: not-allowed; }
        .sf-btn--accept { background: #0D1B2A; color: #fff; }
        .sf-btn--accept:hover:not(:disabled) { background: #1A2E42; }
        .sf-btn--done { background: rgba(34,197,94,0.12); color: #15803d; border: 1px solid rgba(34,197,94,0.3); }
        .sf-btn--done:hover:not(:disabled) { background: rgba(34,197,94,0.2); }
        .sf-btn--reject { background: rgba(220,38,38,0.08); color: #b91c1c; border: 1px solid rgba(220,38,38,0.28); margin-left: auto; }
        .sf-btn--reject:hover:not(:disabled) { background: rgba(220,38,38,0.16); }

        /* ghi chú (lý do từ chối / nội dung xử lý) */
        .sf-note { margin-top: 12px; padding: 10px 14px; border-radius: 9px; display: flex; flex-direction: column; gap: 3px; }
        .sf-note--reject { background: rgba(220,38,38,0.06); border: 1px solid rgba(220,38,38,0.18); }
        .sf-note--done { background: rgba(34,197,94,0.06); border: 1px solid rgba(34,197,94,0.18); }
        .sf-note-label { font-size: 11.5px; font-weight: 700; letter-spacing: .02em; }
        .sf-note--reject .sf-note-label { color: #b91c1c; }
        .sf-note--done .sf-note-label { color: #15803d; }
        .sf-note-text { font-size: 13px; color: #3f4a57; line-height: 1.6; }

        /* nhật ký xử lý */
        .sf-history { margin-top: 12px; }
        .sf-history summary { cursor: pointer; font-size: 12.5px; font-weight: 600; color: #5c6f82; padding: 4px 0; }
        .sf-history summary:hover { color: #0D1B2A; }
        .sf-history-list { list-style: none; margin: 8px 0 0; padding: 0 0 0 4px; display: flex; flex-direction: column; gap: 8px; }
        .sf-history-item { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .sf-history-meta { font-size: 11.5px; color: #8A9BAD; }
        .sf-history-note { font-size: 12px; color: #3f4a57; font-style: italic; width: 100%; }

        /* modal ghi chú */
        .sf-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(13,27,42,.6); display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(3px); }
        .sf-modal { background: #fff; border-radius: 14px; width: 100%; max-width: 460px; box-shadow: 0 24px 56px rgba(13,27,42,.24); overflow: hidden; }
        .sf-modal-head { padding: 18px 22px; border-bottom: 1px solid rgba(13,27,42,.08); }
        .sf-modal-title { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 17px; font-weight: 700; color: #0D1B2A; }
        .sf-modal-sub { font-size: 12.5px; color: #8A9BAD; margin-top: 3px; }
        .sf-modal-body { padding: 18px 22px; }
        .sf-modal-textarea { width: 100%; min-height: 92px; padding: 11px 13px; border: 1px solid rgba(13,27,42,.15); border-radius: 9px; font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: #0D1B2A; outline: none; resize: vertical; line-height: 1.6; }
        .sf-modal-textarea:focus { border-color: #C9A84C; }
        .sf-modal-count { text-align: right; font-size: 11px; color: #8A9BAD; margin-top: 4px; }
        .sf-modal-foot { display: flex; gap: 10px; padding: 0 22px 20px; }
        .sf-modal-cancel { flex: 1; padding: 11px; border: 1px solid rgba(13,27,42,.15); border-radius: 8px; background: #fff; color: #0D1B2A; font-family: 'DM Sans', sans-serif; font-size: 13.5px; cursor: pointer; }
        .sf-modal-cancel:hover { background: #F5F3EF; }
        .sf-modal-confirm { flex: 2; padding: 11px; border: none; border-radius: 8px; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600; cursor: pointer; }
        .sf-modal-confirm:disabled { opacity: .6; cursor: not-allowed; }
        .sf-modal-confirm--reject { background: #dc2626; }
        .sf-modal-confirm--reject:hover:not(:disabled) { background: #b91c1c; }
        .sf-modal-confirm--done { background: #16a34a; }
        .sf-modal-confirm--done:hover:not(:disabled) { background: #15803d; }

        .sf-empty { background: #fff; border: 1px dashed rgba(13,27,42,0.15); border-radius: 12px; padding: 44px 24px; text-align: center; color: #8A9BAD; font-size: 13.5px; }

        .sf-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 4px; }
        .sf-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
        .sf-tab { padding: 8px 15px; border-radius: 100px; border: 1px solid rgba(13,27,42,0.13); background: #fff; color: #5c6f82; font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 600; cursor: pointer; transition: all .15s; }
        .sf-tab:hover { border-color: #C9A84C; color: #0D1B2A; }
        .sf-tab--active { background: #0D1B2A; border-color: #0D1B2A; color: #fff; }
        .sf-search { min-width: 240px; height: 40px; padding: 0 14px; border: 1px solid rgba(13,27,42,0.13); border-radius: 9px; background: #fff; color: #0D1B2A; outline: none; font-size: 13px; font-family: 'DM Sans', sans-serif; transition: border-color .15s; }
        .sf-search:focus { border-color: #C9A84C; }
      `}</style>

      <div className="sf-hero">
        <div className="sf-hero-title">Công việc của tôi</div>
        <div className="sf-hero-sub">Các yêu cầu bảo trì được Ban quản lý phân công cho bạn. Tiếp nhận và cập nhật tiến độ tại đây.</div>
        <div className="sf-hero-stats">
          <div className="sf-stat">
            <div className="sf-stat-num">{loading ? "—" : requests.length}</div>
            <div className="sf-stat-label">Tổng được giao</div>
          </div>
          <div className="sf-stat">
            <div className="sf-stat-num" style={{ color: "#fbbf24" }}>{loading ? "—" : countByStatus("PENDING")}</div>
            <div className="sf-stat-label">Chờ xử lý</div>
          </div>
          <div className="sf-stat">
            <div className="sf-stat-num" style={{ color: "#38bdf8" }}>{loading ? "—" : countByStatus("IN_PROGRESS")}</div>
            <div className="sf-stat-label">Đang sửa</div>
          </div>
          <div className="sf-stat">
            <div className="sf-stat-num" style={{ color: "#4ade80" }}>{loading ? "—" : countByStatus("RESOLVED")}</div>
            <div className="sf-stat-label">Hoàn thành</div>
          </div>
          <div className="sf-stat">
            <div className="sf-stat-num" style={{ color: "#C9A84C" }}>{loading ? "—" : avgRating ? `${avgRating}★` : "—"}</div>
            <div className="sf-stat-label">Đánh giá trung bình{rated.length > 0 ? ` (${rated.length} lượt)` : ""}</div>
          </div>
        </div>
      </div>

      {/* Bộ lọc + tìm kiếm */}
      <div className="sf-toolbar">
        <div className="sf-tabs">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`sf-tab ${filter === tab.key ? "sf-tab--active" : ""}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
              {tab.key !== "ALL" && !loading ? ` (${countByStatus(tab.key)})` : ""}
            </button>
          ))}
        </div>
        <input
          className="sf-search"
          placeholder="Tìm theo tiêu đề, mô tả, phòng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="sf-empty">Đang tải công việc được giao...</div>
      ) : requests.length === 0 ? (
        <div className="sf-empty">
          Bạn chưa được phân công công việc nào.<br />Khi Ban quản lý giao việc, thông báo sẽ đổ chuông và công việc hiện ở đây.
        </div>
      ) : filtered.length === 0 ? (
        <div className="sf-empty">Không có công việc nào khớp bộ lọc / từ khóa hiện tại.</div>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <div className="sf-section">Cần xử lý ({active.length})</div>
              <div className="sf-cards">{active.map(renderCard)}</div>
            </>
          )}
          {active.length === 0 && filter === "ALL" && !search.trim() && (
            <div className="sf-empty" style={{ marginTop: 8 }}>Không còn việc nào đang chờ — tuyệt vời! 🎉</div>
          )}

          {done.length > 0 && (
            <>
              <div className="sf-section">Đã xong ({done.length})</div>
              <div className="sf-cards">{done.map(renderCard)}</div>
            </>
          )}
        </>
      )}

      {/* Modal nhập lý do từ chối / nội dung đã xử lý */}
      {actionModal && (
        <div className="sf-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActionModal(null); }}>
          <div className="sf-modal">
            <div className="sf-modal-head">
              <div className="sf-modal-title">
                {actionModal.type === "REJECT" ? "Từ chối yêu cầu" : "Hoàn thành sửa chữa"}
              </div>
              <div className="sf-modal-sub">
                {actionModal.type === "REJECT"
                  ? `Nêu rõ lý do để sinh viên hiểu vì sao "${actionModal.req.title}" bị từ chối.`
                  : `Ghi ngắn gọn nội dung đã xử lý cho "${actionModal.req.title}" (tùy chọn).`}
              </div>
            </div>
            <div className="sf-modal-body">
              <textarea
                className="sf-modal-textarea"
                maxLength={500}
                autoFocus
                placeholder={
                  actionModal.type === "REJECT"
                    ? "VD: Báo sai, thiết bị vẫn hoạt động bình thường…"
                    : "VD: Đã thay bóng đèn LED 9W, kiểm tra lại công tắc…"
                }
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <div className="sf-modal-count">{noteText.length}/500</div>
            </div>
            <div className="sf-modal-foot">
              <button type="button" className="sf-modal-cancel" onClick={() => setActionModal(null)}>
                Hủy bỏ
              </button>
              <button
                type="button"
                className={`sf-modal-confirm ${actionModal.type === "REJECT" ? "sf-modal-confirm--reject" : "sf-modal-confirm--done"}`}
                disabled={processingId === actionModal.req._id || (actionModal.type === "REJECT" && !noteText.trim())}
                onClick={() => void submitActionModal()}
              >
                {actionModal.type === "REJECT" ? "Xác nhận từ chối" : "Xác nhận hoàn thành"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
