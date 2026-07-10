"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "../../utils/apiClient"; // THÊM IMPORT apiClient
import { useToast } from "../../components/ToastProvider";
import RoomFilterBar, { EMPTY_ROOM_FILTER, matchRoomFilter, type RoomFilterValue } from "../../components/RoomFilterBar";

// ─── Types ────────────────────────────────────────────────────────────────────
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type Status = "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";

interface MaintenanceRequest {
  _id: string;
  user: { _id: string; fullName: string; mssv?: string; phone?: string };
  room: { _id: string; name: string; building: string; floor?: number };
  title: string;
  description: string;
  imageUrl?: string;
  priority: Priority;
  status: Status;
  createdAt: string;
  resolvedAt?: string;
  rating?: number;
  ratedAt?: string;
}

type NextAction = {
  status: Status;
  label: string;
  variant: "accept" | "done" | "reject";
};

// ─── Config ───────────────────────────────────────────────────────────────────
const PRIORITY_CFG: Record<Priority, { label: string; color: string; bg: string; border: string; bar: string }> = {
  LOW: { label: "Thấp", color: "#64748b", bg: "rgba(100,116,139,.08)", border: "rgba(100,116,139,.2)", bar: "#94a3b8" },
  MEDIUM: { label: "Bình thường", color: "#0284c7", bg: "rgba(2,132,199,.08)", border: "rgba(2,132,199,.2)", bar: "#38bdf8" },
  HIGH: { label: "Ưu tiên cao", color: "#ea580c", bg: "rgba(234,88,12,.08)", border: "rgba(234,88,12,.2)", bar: "#fb923c" },
  URGENT: { label: "Khẩn cấp", color: "#dc2626", bg: "rgba(220,38,38,.09)", border: "rgba(220,38,38,.25)", bar: "#ef4444" },
};

const STATUS_CFG: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  PENDING: { label: "Chờ tiếp nhận", color: "#b45309", bg: "rgba(245,158,11,.1)", border: "rgba(245,158,11,.22)" },
  IN_PROGRESS: { label: "Đang sửa chữa", color: "#0284c7", bg: "rgba(14,165,233,.1)", border: "rgba(14,165,233,.2)" },
  RESOLVED: { label: "Hoàn thành", color: "#16a34a", bg: "rgba(34,197,94,.1)", border: "rgba(34,197,94,.2)" },
  REJECTED: { label: "Từ chối", color: "#dc2626", bg: "rgba(239,68,68,.1)", border: "rgba(239,68,68,.2)" },
};

const NEXT_ACTIONS: Partial<Record<Status, NextAction[]>> = {
  PENDING: [
    { status: "IN_PROGRESS", label: "Đang sửa", variant: "accept" },
    { status: "RESOLVED", label: "Đã xong", variant: "done" },
    { status: "REJECTED", label: "Từ chối", variant: "reject" },
  ],
  IN_PROGRESS: [{ status: "RESOLVED", label: "Đã xong", variant: "done" }],
};

const CONFIRM_MSG: Partial<Record<Status, string>> = {
  IN_PROGRESS: "Chuyển trạng thái yêu cầu này sang Đang sửa chữa?",
  RESOLVED: "Xác nhận đã sửa chữa xong sự cố này?",
  REJECTED: "Từ chối yêu cầu này? Hành động không thể hoàn tác.",
};

const STATUS_WEIGHT: Record<Status, number> = {
  PENDING: 1,
  IN_PROGRESS: 2,
  RESOLVED: 3,
  REJECTED: 4,
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const I = {
  wrench: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <circle cx="12" cy="12" r="3" strokeWidth={1.8} />
    </svg>
  ),
  check: (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
  ),
  x: (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
  ),
  clock: (
    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  warn: (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
  ),
  user: (
    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
  ),
  building: (
    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
  ),
  image: (
    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" /></svg>
  ),
  refresh: (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
  ),
};

// ─── Confirm Modal ────────────────────────────────────────────────────────────
interface ConfirmPayload {
  requestId: string;
  nextStatus: Status;
  message: string;
  variant: "accept" | "done" | "reject";
}

function ConfirmModal({ payload, onConfirm, onCancel, loading }: { payload: ConfirmPayload; onConfirm: () => void; onCancel: () => void; loading: boolean; }) {
  const isReject = payload.variant === "reject";
  return (
    <div className="am-overlay">
      <div className="am-modal">
        <div className={`am-modal-icon-wrap ${isReject ? "am-modal-icon-wrap--red" : "am-modal-icon-wrap--blue"}`}>
          {isReject ? I.warn : I.wrench}
        </div>
        <h3 className="am-modal-title">
          {payload.variant === "accept" ? "Chuyển trạng thái?" : payload.variant === "done" ? "Xác nhận hoàn thành?" : "Từ chối yêu cầu?"}
        </h3>
        <p className="am-modal-desc">{payload.message}</p>
        <div className="am-modal-actions">
          <button className="am-modal-btn-cancel" onClick={onCancel} disabled={loading}>Hủy bỏ</button>
          <button className={`am-modal-btn-confirm ${isReject ? "am-modal-btn-confirm--red" : "am-modal-btn-confirm--blue"}`} onClick={onConfirm} disabled={loading}>
            {loading ? "Đang xử lý…" : payload.variant === "accept" ? "Chuyển trạng thái" : payload.variant === "done" ? "Xác nhận xong" : "Từ chối"}
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent = false, valueColor }: { label: string; value: number | string; accent?: boolean; valueColor?: string; }) {
  return (
    <div className={`am-stat ${accent ? "am-stat--accent" : ""}`}>
      <div className="am-stat-label">{label}</div>
      <div className="am-stat-value" style={valueColor ? { color: valueColor } : {}}>{value}</div>
    </div>
  );
}

// ─── Hiển thị sao đánh giá (chỉ đọc) ─────────────────────────────────────────
function RatingStars({ value }: { value: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 1, alignItems: "center" }} aria-label={`${value} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ color: n <= value ? "#f59e0b" : "#d4d4d8" }}>
          <path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.4l-5.81 3.05 1.11-6.47-4.7-4.58 6.5-.95L12 2.5z" />
        </svg>
      ))}
    </span>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────
function RequestCard({ req, onAction }: { req: MaintenanceRequest; onAction: (payload: ConfirmPayload) => void; }) {
  const p = PRIORITY_CFG[req.priority];
  const s = STATUS_CFG[req.status];
  const actions = NEXT_ACTIONS[req.status] ?? [];
  const isUrgent = req.priority === "URGENT";

  return (
    <div className={`am-card ${isUrgent ? "am-card--urgent" : ""}`} style={{ borderLeftColor: p.bar }}>
      <div className="am-card-head">
        <div className="am-card-head-left">
          <div className="am-card-room">
            <span className="am-room-name">{req.room?.name}</span>
            <span className="am-room-building">{I.building} Tòa {req.room?.building}</span>
          </div>
          {isUrgent && <span className="am-urgent-chip"><span className="am-urgent-dot" />KHẨN CẤP</span>}
        </div>
        <span className="am-status-badge" style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
          {s.label}
        </span>
      </div>

      <div className="am-card-sender">
        <span className="am-sender-item">{I.user} {req.user?.fullName}</span>
        {req.user?.mssv && <span className="am-sender-mssv">MSSV: {req.user.mssv}</span>}
      </div>

      <div className="am-card-title">{req.title}</div>
      <div className="am-card-desc">{req.description}</div>

      {req.imageUrl && (
        <a className="am-card-image-link" href={req.imageUrl} target="_blank" rel="noreferrer">
          <img src={req.imageUrl} alt={`Anh su co ${req.title}`} className="am-card-image" />
          <span>{I.image} Xem ảnh hiện trường</span>
        </a>
      )}

      <div className="am-card-foot">
        <div className="am-card-foot-left">
          <span className="am-priority-pill" style={{ color: p.color, background: p.bg, border: `1px solid ${p.border}` }}>
            {isUrgent && <span className="am-p-dot" style={{ background: p.bar }} />}
            {p.label}
          </span>
          <span className="am-card-time">
            {I.clock}
            {new Date(req.createdAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
          {req.resolvedAt && (
            <span className="am-card-resolved">{I.check} {new Date(req.resolvedAt).toLocaleDateString("vi-VN")}</span>
          )}
          {req.rating ? (
            <span className="am-card-time" title={`Sinh viên đánh giá ${req.rating}/5 sao`}>
              <RatingStars value={req.rating} />
              <strong style={{ color: "#b45309", marginLeft: 3 }}>{req.rating}/5</strong>
            </span>
          ) : req.status === "RESOLVED" ? (
            <span className="am-card-time" style={{ fontStyle: "italic", opacity: 0.7 }}>Chưa đánh giá</span>
          ) : null}
        </div>

        <div className="am-card-actions">
          {actions.map((a) => (
            <button key={a.status} className={`am-action-btn am-action-btn--${a.variant}`} onClick={() => onAction({ requestId: req._id, nextStatus: a.status, message: CONFIRM_MSG[a.status] ?? "", variant: a.variant })}>
              {a.variant === "accept" && I.wrench} {a.variant === "done" && I.check} {a.variant === "reject" && I.x} {a.label}
            </button>
          ))}
          {actions.length === 0 && <span className="am-card-closed">Đã chốt sổ</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="am-sk-card">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <span className="am-sk" style={{ width: 100, height: 14 }} />
        <span className="am-sk" style={{ width: 80, height: 22, borderRadius: 100 }} />
      </div>
      <span className="am-sk" style={{ width: 160, height: 16, display: "block", marginBottom: 10 }} />
      <span className="am-sk" style={{ width: "100%", height: 48, borderRadius: 8, display: "block", marginBottom: 14 }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span className="am-sk" style={{ width: 80, height: 22, borderRadius: 100 }} />
        <span className="am-sk" style={{ width: 100, height: 30, borderRadius: 7 }} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminMaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<ConfirmPayload | null>(null);
  const [processing, setProcessing] = useState(false);
  const toast = useToast();
  const [activeFilter, setActiveFilter] = useState<"ALL" | Status>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [roomFilter, setRoomFilter] = useState<RoomFilterValue>(EMPTY_ROOM_FILTER);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      // ĐÃ SỬA: Sử dụng apiClient thay vì fetch thủ công để tránh lỗi đường dẫn /api/api
      const res = await apiClient.get("/maintenance");
      if (res.ok) {
        const payload = await res.json();
        // Xử lý trường hợp backend trả về trực tiếp mảng hoặc bọc trong { data: [...] }
        setRequests(payload.data || payload || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleConfirm = async () => {
    if (!confirm) return;
    setProcessing(true);
    try {
      // ĐÃ SỬA: Sử dụng apiClient
      const res = await apiClient.patch(`/maintenance/${confirm.requestId}/status`, {
        status: confirm.nextStatus
      });
      const data = await res.json();
      
      if (res.ok) {
        if (confirm.nextStatus === "RESOLVED") {
          toast.success("Đã đánh dấu hoàn thành và gửi thông báo cho sinh viên.", "Sửa chữa hoàn tất 🛠️");
        } else if (confirm.nextStatus === "REJECTED") {
          toast.success("Đã từ chối yêu cầu bảo trì này.", "Đã từ chối");
        } else {
          toast.success("Cập nhật tiến độ yêu cầu thành công!");
        }
        setRequests((prev) => prev.map((r) => r._id === confirm.requestId ? { ...r, status: confirm.nextStatus, resolvedAt: confirm.nextStatus === "RESOLVED" ? new Date().toISOString() : r.resolvedAt } : r ));
      } else {
        toast.error(data.message || "Có lỗi xảy ra, vui lòng thử lại.");
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setProcessing(false);
      setConfirm(null);
    }
  };

  const countByStatus = (s: Status) => requests.filter((r) => r.status === s).length;
  const urgentCount = requests.filter((r) => r.priority === "URGENT" && r.status !== "RESOLVED" && r.status !== "REJECTED").length;

  const filtered = requests.filter((r) => {
    const matchStatus = activeFilter === "ALL" || r.status === activeFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || r.title.toLowerCase().includes(q) || r.room?.name.toLowerCase().includes(q) || r.user?.fullName.toLowerCase().includes(q) || (r.user?.mssv ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch && matchRoomFilter(roomFilter, r.room);
  }).sort((a, b) => {
    // Ưu tiên xếp hạng trạng thái
    if (STATUS_WEIGHT[a.status] !== STATUS_WEIGHT[b.status]) {
      return STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status];
    }
    // Cùng trạng thái xếp theo mới nhất
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="w-full text-slate-800 font-sans relative">
      <style>{`
        :root {
          --navy:    #0D1B2A;
          --gold:    #C9A84C;
          --gold-dim:rgba(201,168,76,0.15);
          --gold-b:  rgba(201,168,76,0.25);
          --white:   #ffffff;
          --muted:   #8A9BAD;
          --border:  rgba(13,27,42,0.09);
        }

        /* ── STATS ── */
        .am-stats { display:grid; grid-template-columns:repeat(5,1fr); gap:14px; margin-bottom:24px; }
        .am-stat { background:var(--white); border:1px solid var(--border); border-radius:11px; padding:16px 20px; transition:transform .15s, box-shadow .15s; }
        .am-stat:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(13,27,42,.07); }
        .am-stat--accent { background:var(--navy); border-color:var(--gold-b); }
        .am-stat-label { font-size:10.5px; font-weight:500; letter-spacing:.09em; text-transform:uppercase; color:var(--muted); margin-bottom:8px; }
        .am-stat--accent .am-stat-label { color:rgba(255,255,255,.38); }
        .am-stat-value { font-family:'Fraunces',serif; font-size:28px; font-weight:700; color:var(--navy); letter-spacing:-.8px; line-height:1; }
        .am-stat--accent .am-stat-value { color:var(--gold); }

        /* ── TOOLBAR ── */
        .am-toolbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; flex-wrap:wrap; gap:12px; }
        .am-toolbar-left { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .am-filter-btn { padding:7px 14px; border-radius:8px; border:1px solid var(--border); background:var(--white); font-family:'DM Sans',sans-serif; font-size:12.5px; color:var(--muted); cursor:pointer; transition:all .15s; display:flex; align-items:center; gap:6px; }
        .am-filter-btn:hover { border-color:var(--navy); color:var(--navy); }
        .am-filter-btn--active { background:var(--navy); border-color:var(--navy); color:#fff; }
        .am-fc { font-size:10.5px; font-weight:600; background:rgba(255,255,255,.18); padding:1px 6px; border-radius:100px; }
        .am-filter-btn:not(.am-filter-btn--active) .am-fc { background:rgba(13,27,42,.07); color:var(--navy); }
        .am-toolbar-right { display:flex; align-items:center; gap:10px; }
        .am-search-wrap { position:relative; display:flex; align-items:center; }
        .am-search-ic { position:absolute; left:10px; color:var(--muted); display:flex; pointer-events:none; }
        .am-search-ic svg { width:13px; height:13px; stroke:currentColor; }
        .am-search { padding:8px 12px 8px 30px; border:1px solid var(--border); border-radius:8px; font-family:'DM Sans',sans-serif; font-size:12.5px; color:var(--navy); background:#F9F8F6; outline:none; width:210px; transition:border-color .15s; }
        .am-search:focus { border-color:var(--gold); background:var(--white); }
        .am-search::placeholder { color:var(--muted); }
        .am-refresh-btn { width:34px; height:34px; border-radius:8px; border:1px solid var(--border); background:var(--white); display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--muted); transition:all .15s; }
        .am-refresh-btn:hover { border-color:var(--navy); color:var(--navy); }
        .am-count-badge { padding:3px 11px; border-radius:100px; background:var(--gold-dim); border:1px solid var(--gold-b); font-size:11.5px; font-weight:500; color:var(--gold); white-space:nowrap; }

        /* ── CARDS LIST ── */
        .am-cards { display:flex; flex-direction:column; gap:14px; }

        /* ── REQUEST CARD ── */
        .am-card { background:var(--white); border:1px solid var(--border); border-radius:14px; border-left:4px solid transparent; padding:20px 22px; transition:transform .18s, box-shadow .18s; }
        .am-card:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(13,27,42,.07); }
        .am-card--urgent { background: rgba(220,38,38,.02); }
        .am-card-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; gap:10px; flex-wrap:wrap; }
        .am-card-head-left { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .am-card-room { display:flex; align-items:center; gap:8px; }
        .am-room-name { font-family:'Fraunces',serif; font-size:17px; font-weight:600; color:var(--gold); }
        .am-room-building { display:flex; align-items:center; gap:4px; font-size:12px; color:var(--muted); }
        .am-room-building svg { width:11px; height:11px; stroke:currentColor; }
        .am-urgent-chip { display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border-radius:100px; font-size:10.5px; font-weight:700; letter-spacing:.06em; background:rgba(220,38,38,.1); color:#dc2626; border:1px solid rgba(220,38,38,.25); }
        .am-urgent-dot { width:5px; height:5px; border-radius:50%; background:#ef4444; animation:amPulse 1.4s infinite; flex-shrink:0; }
        @keyframes amPulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        .am-status-badge { display:inline-flex; align-items:center; padding:4px 12px; border-radius:100px; font-size:11.5px; font-weight:500; white-space:nowrap; }
        .am-card-sender { display:flex; align-items:center; gap:12px; margin-bottom:10px; }
        .am-sender-item { display:flex; align-items:center; gap:5px; font-size:12.5px; color:#4A6580; }
        .am-sender-item svg { width:11px; height:11px; stroke:currentColor; }
        .am-sender-mssv { font-size:11.5px; font-weight:500; color:var(--gold); background:var(--gold-dim); border:1px solid var(--gold-b); border-radius:4px; padding:1px 7px; font-variant-numeric:tabular-nums; }
        .am-card-title { font-family:'Fraunces',serif; font-size:16px; font-weight:600; color:var(--navy); margin-bottom:8px; line-height:1.3; }
        .am-card-desc { font-size:13px; color:#4A6580; line-height:1.7; padding:11px 14px; background:#F9F8F6; border-radius:8px; border:1px solid rgba(13,27,42,.05); margin-bottom:16px; }
        .am-card-image-link { display:flex; align-items:center; gap:12px; margin-bottom:16px; padding:10px; border-radius:10px; border:1px solid var(--border); background:#fff; color:var(--navy); text-decoration:none; font-size:12.5px; font-weight:500; }
        .am-card-image-link:hover { border-color:var(--gold-b); color:#9a7b2c; }
        .am-card-image { width:82px; height:62px; object-fit:cover; border-radius:8px; border:1px solid var(--border); flex-shrink:0; }
        .am-card-foot { display:flex; align-items:center; justify-content:space-between; padding-top:14px; border-top:1px solid var(--border); gap:10px; flex-wrap:wrap; }
        .am-card-foot-left { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .am-priority-pill { display:inline-flex; align-items:center; gap:5px; padding:4px 11px; border-radius:100px; font-size:12px; font-weight:500; }
        .am-p-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }
        .am-card-time { display:flex; align-items:center; gap:4px; font-size:11.5px; color:var(--muted); }
        .am-card-time svg { width:11px; height:11px; stroke:currentColor; }
        .am-card-resolved { display:flex; align-items:center; gap:4px; font-size:11.5px; color:#16a34a; font-weight:500; }
        .am-card-resolved svg { width:11px; height:11px; stroke:currentColor; }
        .am-card-actions { display:flex; gap:8px; align-items:center; }
        .am-action-btn { display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:8px; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:12.5px; font-weight:500; transition:all .15s; }
        .am-action-btn svg { width:13px; height:13px; stroke:currentColor; }
        .am-action-btn--accept { background:rgba(2,132,199,.1); color:#0284c7; border:1px solid rgba(2,132,199,.2); }
        .am-action-btn--accept:hover { background:#0284c7; color:#fff; }
        .am-action-btn--done   { background:rgba(34,197,94,.1); color:#16a34a; border:1px solid rgba(34,197,94,.2); }
        .am-action-btn--done:hover   { background:#16a34a; color:#fff; }
        .am-action-btn--reject { background:transparent; color:rgba(220,38,38,.8); border:1px solid rgba(220,38,38,.2); }
        .am-action-btn--reject:hover { background:rgba(220,38,38,.08); }
        .am-card-closed { font-size:12px; color:var(--muted); font-style:italic; }

        /* ── EMPTY ── */
        .am-empty { background:var(--white); border:1px solid var(--border); border-radius:14px; padding:60px 24px; text-align:center; }
        .am-empty-icon { width:48px; height:48px; border-radius:12px; background:#F5F3EF; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; color:var(--muted); }
        .am-empty-title { font-family:'Fraunces',serif; font-size:18px; font-weight:600; color:var(--navy); margin-bottom:7px; }
        .am-empty-sub { font-size:13.5px; color:var(--muted); line-height:1.65; }

        /* ── SKELETON ── */
        .am-sk { display:inline-block; border-radius:4px; background:linear-gradient(90deg,#EDE9E3 25%,#E4E0D8 50%,#EDE9E3 75%); background-size:400% 100%; animation:amShimmer 1.4s ease infinite; }
        @keyframes amShimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
        .am-sk-card { background:var(--white); border:1px solid var(--border); border-left:4px solid #E4E0D8; border-radius:14px; padding:20px 22px; }

        /* ── CONFIRM MODAL ── */
        .am-overlay { position:fixed; inset:0; z-index:200; background:rgba(13,27,42,.58); display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(4px); }
        .am-modal { background:var(--white); border-radius:18px; padding:32px 28px; max-width:390px; width:100%; border:1px solid var(--border); box-shadow:0 24px 60px rgba(13,27,42,.18); animation:amModalIn .2s ease; }
        @keyframes amModalIn { from{opacity:0;transform:scale(.95) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .am-modal-icon-wrap { width:46px; height:46px; border-radius:12px; display:flex; align-items:center; justify-content:center; margin-bottom:18px; }
        .am-modal-icon-wrap--red  { background:rgba(239,68,68,.1); color:#ef4444; }
        .am-modal-icon-wrap--blue { background:rgba(2,132,199,.1); color:#0284c7; }
        .am-modal-title { font-family:'Fraunces',serif; font-size:19px; font-weight:700; color:var(--navy); margin-bottom:10px; }
        .am-modal-desc { font-size:13.5px; color:#4A6580; line-height:1.65; margin-bottom:24px; }
        .am-modal-actions { display:flex; gap:10px; }
        .am-modal-btn-cancel { flex:1; padding:11px; border:1px solid var(--border); border-radius:8px; background:transparent; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:13.5px; color:var(--navy); transition:background .15s; }
        .am-modal-btn-cancel:hover { background:#F5F3EF; }
        .am-modal-btn-confirm { flex:1; padding:11px; border:none; border-radius:8px; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:500; color:#fff; transition:background .15s; }
        .am-modal-btn-confirm:disabled { opacity:.6; cursor:not-allowed; }
        .am-modal-btn-confirm--blue { background:#0284c7; }
        .am-modal-btn-confirm--blue:hover { background:#0369a1; }
        .am-modal-btn-confirm--red  { background:#ef4444; }
        .am-modal-btn-confirm--red:hover  { background:#dc2626; }

        /* ── TOAST ── */
        .am-toast { position:fixed; bottom:26px; right:26px; z-index:300; display:flex; align-items:center; gap:10px; padding:12px 16px; border-radius:11px; box-shadow:0 8px 28px rgba(13,27,42,.14); animation:amToastIn .25s ease; max-width:340px; background:var(--white); }
        @keyframes amToastIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .am-toast--success { border:1px solid rgba(34,197,94,.25); }
        .am-toast--error   { border:1px solid rgba(239,68,68,.25); }
        .am-toast-icon { display:flex; flex-shrink:0; }
        .am-toast--success .am-toast-icon { color:#16a34a; }
        .am-toast--error   .am-toast-icon { color:#dc2626; }
        .am-toast-text  { flex:1; font-size:13.5px; color:var(--navy); }
        .am-toast-close { background:none; border:none; cursor:pointer; color:var(--muted); display:flex; padding:2px; }

        @media (max-width:1200px) { .am-stats { grid-template-columns:repeat(3,1fr); } }
        @media (max-width:768px)  { .am-stats { grid-template-columns:repeat(2,1fr); } }
      `}</style>

      {/* Stats */}
      <div className="am-stats">
        <StatCard label="Tổng yêu cầu" value={loading ? "—" : requests.length} accent />
        <StatCard label="Chờ tiếp nhận" value={loading ? "—" : countByStatus("PENDING")} valueColor="#b45309" />
        <StatCard label="Đang xử lý" value={loading ? "—" : countByStatus("IN_PROGRESS")} valueColor="#0284c7" />
        <StatCard label="Hoàn thành" value={loading ? "—" : countByStatus("RESOLVED")} valueColor="#16a34a" />
        <StatCard label="Khẩn cấp" value={loading ? "—" : urgentCount} valueColor="#dc2626" />
      </div>

      {/* Toolbar */}
      <div className="am-toolbar">
        <div className="am-toolbar-left">
          {(["ALL", "PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"] as const).map((f) => (
            <button key={f} className={`am-filter-btn ${activeFilter === f ? "am-filter-btn--active" : ""}`} onClick={() => setActiveFilter(f)} type="button">
              {f === "ALL" ? "Tất cả" : f === "PENDING" ? "Chờ tiếp nhận" : f === "IN_PROGRESS" ? "Đang sửa" : f === "RESOLVED" ? "Hoàn thành" : "Từ chối"}
              <span className="am-fc">{f === "ALL" ? requests.length : countByStatus(f as Status)}</span>
            </button>
          ))}
        </div>
        <div className="am-toolbar-right">
          {!loading && <span className="am-count-badge">{filtered.length} yêu cầu</span>}
          <RoomFilterBar rooms={requests.map((r) => r.room)} value={roomFilter} onChange={setRoomFilter} />
          <div className="am-search-wrap">
            <span className="am-search-ic">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input className="am-search" type="text" placeholder="Tìm phòng, tên, MSSV..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <button className="am-refresh-btn" type="button" onClick={fetchRequests} title="Tải lại">{I.refresh}</button>
        </div>
      </div>

      {/* List */}
      <div className="am-cards">
        {loading ? (
          [1, 2, 3].map((i) => <SkeletonCard key={i} />)
        ) : filtered.length === 0 ? (
          <div className="am-empty">
            <div className="am-empty-icon">{I.wrench}</div>
            <div className="am-empty-title">{searchQuery || activeFilter !== "ALL" ? "Không tìm thấy kết quả" : "Mọi thứ đang hoạt động tốt!"}</div>
            <div className="am-empty-sub">{searchQuery || activeFilter !== "ALL" ? "Thử thay đổi từ khóa hoặc bộ lọc trạng thái." : "Hiện chưa có yêu cầu sửa chữa nào từ sinh viên."}</div>
          </div>
        ) : (
          filtered.map((req) => <RequestCard key={req._id} req={req} onAction={setConfirm} />)
        )}
      </div>

      {/* Modals & Toasts */}
      {confirm && <ConfirmModal payload={confirm} onConfirm={handleConfirm} onCancel={() => setConfirm(null)} loading={processing} />}
    </div>
  );
}
