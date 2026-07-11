"use client";

import { useEffect, useState } from "react";
import { useToast } from "../components/ToastProvider";
import { useConfirm } from "../components/ConfirmProvider";
import { apiClient } from "../utils/apiClient";

type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type Status = "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";

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

export default function StaffDashboardPage() {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [requests, setRequests] = useState<AssignedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

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

  const handleUpdateStatus = async (req: AssignedRequest, nextStatus: Status) => {
    const isDone = nextStatus === "RESOLVED";
    const ok = await confirmDialog({
      title: isDone ? "Xác nhận hoàn thành sửa chữa?" : "Tiếp nhận công việc này?",
      message: isDone
        ? `Sự cố "${req.title}" sẽ được đánh dấu hoàn thành và sinh viên nhận được thông báo để đánh giá chất lượng.`
        : `Yêu cầu "${req.title}" sẽ chuyển sang trạng thái "Đang sửa chữa".`,
      confirmLabel: isDone ? "Hoàn thành" : "Tiếp nhận",
    });
    if (!ok) return;

    setProcessingId(req._id);
    try {
      const res = await apiClient.patch(`/maintenance/${req._id}/status`, { status: nextStatus });
      const data = await res.json();
      if (res.ok) {
        toast.success(isDone ? "Đã đánh dấu hoàn thành. Cảm ơn bạn!" : "Đã tiếp nhận công việc.", "Cập nhật thành công");
        void fetchAssigned();
      } else {
        toast.error(data.message || "Không cập nhật được trạng thái.");
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setProcessingId(null);
    }
  };

  const countByStatus = (s: Status) => requests.filter((r) => r.status === s).length;
  const active = requests.filter((r) => r.status === "PENDING" || r.status === "IN_PROGRESS");
  const done = requests.filter((r) => r.status === "RESOLVED" || r.status === "REJECTED");

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

        {(req.status === "PENDING" || req.status === "IN_PROGRESS") && (
          <div className="sf-actions">
            {req.status === "PENDING" && (
              <button
                type="button"
                className="sf-btn sf-btn--accept"
                disabled={processingId === req._id}
                onClick={() => void handleUpdateStatus(req, "IN_PROGRESS")}
              >
                🔧 Tiếp nhận sửa chữa
              </button>
            )}
            {req.status === "IN_PROGRESS" && (
              <button
                type="button"
                className="sf-btn sf-btn--done"
                disabled={processingId === req._id}
                onClick={() => void handleUpdateStatus(req, "RESOLVED")}
              >
                ✓ Hoàn thành
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <style>{`
        .sf-hero { background: linear-gradient(135deg, #0D1B2A 0%, #182b43 60%, #253d5d 100%); color: #fff; border-radius: 16px; padding: 24px 26px; border: 1px solid rgba(201,168,76,0.25); margin-bottom: 22px; }
        .sf-hero-title { font-family: 'Fraunces', serif; font-size: 23px; font-weight: 700; letter-spacing: -.3px; }
        .sf-hero-sub { margin-top: 5px; color: rgba(255,255,255,.65); font-size: 13px; line-height: 1.6; }
        .sf-hero-stats { display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
        .sf-stat { background: rgba(255,255,255,0.06); border: 1px solid rgba(201,168,76,0.2); border-radius: 10px; padding: 10px 16px; min-width: 100px; }
        .sf-stat-num { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 700; }
        .sf-stat-label { font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 1px; }

        .sf-section { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 600; color: #0D1B2A; margin: 22px 0 12px; }
        .sf-cards { display: flex; flex-direction: column; gap: 12px; }
        .sf-card { background: #fff; border: 1px solid rgba(13,27,42,0.09); border-left: 4px solid transparent; border-radius: 10px; padding: 18px 20px; }
        .sf-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
        .sf-room { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 700; color: #0D1B2A; margin-right: 10px; }
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

        .sf-empty { background: #fff; border: 1px dashed rgba(13,27,42,0.15); border-radius: 12px; padding: 44px 24px; text-align: center; color: #8A9BAD; font-size: 13.5px; }
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
        </div>
      </div>

      {loading ? (
        <div className="sf-empty">Đang tải công việc được giao...</div>
      ) : requests.length === 0 ? (
        <div className="sf-empty">
          Bạn chưa được phân công công việc nào.<br />Khi Ban quản lý giao việc, thông báo sẽ đổ chuông và công việc hiện ở đây.
        </div>
      ) : (
        <>
          <div className="sf-section">Cần xử lý ({active.length})</div>
          <div className="sf-cards">
            {active.length > 0 ? active.map(renderCard) : <div className="sf-empty">Không còn việc nào đang chờ — tuyệt vời! 🎉</div>}
          </div>

          {done.length > 0 && (
            <>
              <div className="sf-section">Đã xong ({done.length})</div>
              <div className="sf-cards">{done.map(renderCard)}</div>
            </>
          )}
        </>
      )}
    </div>
  );
}
