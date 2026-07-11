"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "../../utils/apiClient"; // ĐÃ THÊM IMPORT apiClient
import { useToast } from "../../components/ToastProvider";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MaintenanceRequest {
  _id: string;
  title: string;
  description: string;
  imageUrl?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  createdAt: string;
  resolvedAt?: string;
  rating?: number;
  ratedAt?: string;
}

type Priority = MaintenanceRequest["priority"];
type Status   = MaintenanceRequest["status"];

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icons = {
  search:  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  wrench:  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" strokeWidth={1.8} /></svg>,
  plus:    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" /></svg>,
  x:       <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>,
  check:   <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>,
  clock:   <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  alert:   <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  building:<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  image:   <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" /></svg>,
};

// ─── Priority & Status Config ────────────────────────────────────────────────
const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; border: string; barColor: string; }> = {
  LOW:    { label: "Thấp",       color: "#64748b", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.2)", barColor: "#94a3b8" },
  MEDIUM: { label: "Bình thường",color: "#0284c7", bg: "rgba(2,132,199,0.08)",   border: "rgba(2,132,199,0.2)",   barColor: "#38bdf8" },
  HIGH:   { label: "Ưu tiên cao",color: "#ea580c", bg: "rgba(234,88,12,0.08)",   border: "rgba(234,88,12,0.2)",   barColor: "#fb923c" },
  URGENT: { label: "Khẩn cấp",   color: "#dc2626", bg: "rgba(220,38,38,0.09)",   border: "rgba(220,38,38,0.25)",  barColor: "#ef4444" },
};

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; border: string; icon: React.ReactNode; }> = {
  PENDING:     { label: "Chờ tiếp nhận",  color: "#b45309", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.22)", icon: Icons.clock },
  IN_PROGRESS: { label: "Đang sửa chữa", color: "#0284c7", bg: "rgba(14,165,233,0.1)", border: "rgba(14,165,233,0.2)",  icon: Icons.wrench },
  RESOLVED:    { label: "Đã hoàn thành", color: "#16a34a", bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.2)",   icon: Icons.check },
  REJECTED:    { label: "Bị từ chối",    color: "#dc2626", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.2)",   icon: Icons.x },
};

const STATUS_WEIGHT: Record<Status, number> = {
  PENDING: 1,
  IN_PROGRESS: 2,
  RESOLVED: 3,
  REJECTED: 4,
};

// ─── Subcomponents ────────────────────────────────────────────────────────────
function PriorityPill({ priority }: { priority: Priority }) {
  const c = PRIORITY_CONFIG[priority];
  return (
    <span className="mn-priority-pill" style={{ color: c.color, background: c.bg, border: `1px solid ${c.border}` }}>
      {priority === "URGENT" && <span className="mn-priority-dot" style={{ background: c.barColor }} />}
      {c.label}
    </span>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const c = STATUS_CONFIG[status];
  return (
    <span className="mn-status-badge" style={{ color: c.color, background: c.bg, border: `1px solid ${c.border}` }}>
      <span className="mn-status-icon">{c.icon}</span>
      {c.label}
    </span>
  );
}

function StarRating({
  value = 0,
  readOnly = false,
  onRate,
}: {
  value?: number;
  readOnly?: boolean;
  onRate?: (n: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className="mn-stars" role="radiogroup" aria-label="Đánh giá sao">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          className={`mn-star ${n <= active ? "mn-star--on" : ""} ${readOnly ? "mn-star--ro" : ""}`}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => !readOnly && onRate?.(n)}
          aria-label={`${n} sao`}
          title={`${n} sao`}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.4l-5.81 3.05 1.11-6.47-4.7-4.58 6.5-.95L12 2.5z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function RequestCard({
  req,
  onRate,
}: {
  req: MaintenanceRequest;
  onRate: (id: string, rating: number) => void;
}) {
  const p = PRIORITY_CONFIG[req.priority];
  return (
    <div className="mn-card" style={{ borderLeftColor: p.barColor }}>
      <div className="mn-card-head">
        <div className="mn-card-head-left">
          <div className="mn-card-title">{req.title}</div>
          <div className="mn-card-meta">
            <span className="mn-card-meta-item">
              {Icons.clock}
              {new Date(req.createdAt).toLocaleString("vi-VN", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </span>
          </div>
        </div>
        <StatusBadge status={req.status} />
      </div>

      <p className="mn-card-desc">{req.description}</p>

      {req.imageUrl && (
        <a className="mn-card-image-link" href={req.imageUrl} target="_blank" rel="noreferrer">
          <img src={req.imageUrl} alt={`Anh su co ${req.title}`} className="mn-card-image" />
          <span>{Icons.image} Xem anh dinh kem</span>
        </a>
      )}

      <div className="mn-card-foot">
        <PriorityPill priority={req.priority} />
        {req.resolvedAt && (
          <span className="mn-card-resolved">
            {Icons.check} Xử lý xong: {new Date(req.resolvedAt).toLocaleDateString("vi-VN")}
          </span>
        )}
      </div>

      {/* Đánh giá sao — chỉ hiện khi yêu cầu đã hoàn thành sửa chữa */}
      {req.status === "RESOLVED" && (
        <div className="mn-rating-box">
          {req.rating ? (
            <div className="mn-rating-row">
              <span className="mn-rating-label">Đánh giá của bạn</span>
              <StarRating value={req.rating} readOnly />
            </div>
          ) : (
            <div className="mn-rating-row">
              <span className="mn-rating-label">Bạn hài lòng với lần sửa chữa này chứ? Chấm sao nhé:</span>
              <StarRating onRate={(n) => onRate(req._id, n)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function PriorityOption({ value, selected, onClick }: { value: Priority; selected: boolean; onClick: () => void; }) {
  const c = PRIORITY_CONFIG[value];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mn-priority-opt ${selected ? "mn-priority-opt--selected" : ""}`}
      style={selected ? { borderColor: c.color, background: c.bg } : {}}
    >
      <span className="mn-priority-bar" style={{ background: c.barColor }} />
      <span className="mn-priority-opt-label" style={selected ? { color: c.color } : {}}>{c.label}</span>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentMaintenancePage() {
  const [requests,     setRequests]    = useState<MaintenanceRequest[]>([]);
  const [loading,      setLoading]     = useState(true);
  const [hasRoom,      setHasRoom]     = useState(true);
  const [showModal,    setShowModal]   = useState(false);
  const [submitting,   setSubmitting]  = useState(false);
  const notify = useToast();
  // Cầu nối: giữ nguyên các lệnh setToast({type,text}) sẵn có, chuyển sang toast dùng chung
  const setToast = (t: { type: "success" | "error"; text: string }) =>
    t.type === "success" ? notify.success(t.text) : notify.error(t.text);
  const [activeFilter, setActiveFilter] = useState<"ALL" | Status>("ALL");
  const [imageFile,    setImageFile]   = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [form, setForm] = useState<{ title: string; description: string; priority: Priority }>({
    title: "", description: "", priority: "MEDIUM",
  });

  const fetchRequests = async () => {
    try {
      // ĐÃ SỬA: Dùng apiClient thay vì fetch thủ công để tránh lỗi duplicate URL
      const profileRes = await apiClient.get("/users/profile");
      const profilePayload = await profileRes.json();
      const profile = profilePayload.data || profilePayload;

      if (!profile.room) { 
        setHasRoom(false); 
        setLoading(false); 
        return; 
      } else {
        setHasRoom(true);
      }

      const res = await apiClient.get("/maintenance/me");
      if (res.ok) {
        const payload = await res.json();
        setRequests(payload.data || payload || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRequests();
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  const handleImageChange = (file?: File) => {
    if (!file) {
      setImageFile(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setToast({ type: "error", text: "Chi duoc dinh kem file anh." });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({ type: "error", text: "Anh dinh kem khong duoc vuot qua 5MB." });
      return;
    }

    setImageFile(file);
  };

  const closeModal = () => {
    setShowModal(false);
    setImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("title", form.title);
      payload.append("description", form.description);
      payload.append("priority", form.priority);
      if (imageFile) payload.append("image", imageFile);

      const res = await apiClient.postForm("/maintenance", payload);
      const data = await res.json();
      
      if (res.ok) {
        setToast({ type: "success", text: "Đã gửi báo cáo sự cố thành công!" });
        setForm({ title: "", description: "", priority: "MEDIUM" });
        setImageFile(null);
        setShowModal(false);
        fetchRequests();
      } else {
        setToast({ type: "error", text: data.message || "Có lỗi xảy ra" });
      }
    } catch {
      setToast({ type: "error", text: "Lỗi kết nối máy chủ" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRate = async (id: string, rating: number) => {
    // Optimistic UI: hiện sao ngay, nếu lỗi thì hoàn lại
    setRequests((prev) =>
      prev.map((r) => (r._id === id ? { ...r, rating, ratedAt: new Date().toISOString() } : r)),
    );
    try {
      const res = await apiClient.patch(`/maintenance/${id}/rate`, { rating });
      if (res.ok) {
        setToast({ type: "success", text: "Cảm ơn bạn đã đánh giá!" });
      } else {
        const data = await res.json().catch(() => ({}));
        setToast({ type: "error", text: data.message || "Không gửi được đánh giá" });
        setRequests((prev) =>
          prev.map((r) => (r._id === id ? { ...r, rating: undefined, ratedAt: undefined } : r)),
        );
      }
    } catch {
      setToast({ type: "error", text: "Lỗi kết nối máy chủ" });
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, rating: undefined, ratedAt: undefined } : r)),
      );
    }
  };

  const countByStatus = (s: Status) => requests.filter(r => r.status === s).length;
  
  const filtered = (activeFilter === "ALL" ? requests : requests.filter(r => r.status === activeFilter)).sort((a, b) => {
    // Ưu tiên xếp hạng trạng thái
    if (STATUS_WEIGHT[a.status] !== STATUS_WEIGHT[b.status]) {
      return STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status];
    }
    // Cùng trạng thái xếp theo thời gian mới nhất
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="w-full text-slate-800 font-sans relative">
      <style>{`
        :root {
          --navy:    #0D1B2A;
          --gold:    #C9A84C;
          --gold-b:  rgba(201,168,76,0.25);
          --white:   #ffffff;
          --muted:   #8A9BAD;
          --border:  rgba(13,27,42,0.09);
        }

        /* ── BANNER ── */
        .mn-banner {
          background:var(--navy); border-radius:16px; padding:24px 28px;
          margin-bottom:24px; display:flex; align-items:center; justify-content:space-between;
          border:1px solid var(--gold-b); position:relative; overflow:hidden;
        }
        .mn-banner-bg {
          position:absolute; inset:0;
          background:radial-gradient(ellipse 55% 80% at 100% 50%, rgba(201,168,76,.1) 0%, transparent 60%);
          pointer-events:none;
        }
        .mn-banner-grid {
          position:absolute; inset:0;
          background-image:linear-gradient(rgba(201,168,76,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,.04) 1px,transparent 1px);
          background-size:36px 36px; pointer-events:none;
        }
        .mn-banner-left { position:relative; z-index:1; }
        .mn-banner-eyebrow { font-size:10px; font-weight:500; letter-spacing:.12em; text-transform:uppercase; color:var(--gold); margin-bottom:8px; display:block; }
        .mn-banner-title { font-family:'Fraunces',serif; font-size:24px; font-weight:700; color:#fff; letter-spacing:-.3px; margin-bottom:8px; line-height:1.2; }
        .mn-banner-title em { color:var(--gold); font-style:italic; }
        .mn-banner-sub { font-size:13px; font-weight:300; color:rgba(255,255,255,.45); max-width:380px; line-height:1.65; }
        .mn-banner-right { position:relative; z-index:1; display:flex; gap:12px; align-items:stretch; }

        /* banner stat cards */
        .mn-bstat { background:rgba(255,255,255,.06); border:1px solid rgba(201,168,76,.2); border-radius:12px; padding:14px 18px; text-align:center; min-width:80px; }
        .mn-bstat-val { font-family:'Fraunces',serif; font-size:28px; font-weight:700; color:var(--gold); letter-spacing:-.5px; line-height:1; }
        .mn-bstat-label { font-size:10px; color:rgba(255,255,255,.35); margin-top:4px; letter-spacing:.04em; }

        /* ── TOOLBAR ── */
        .mn-toolbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
        .mn-filters { display:flex; gap:6px; flex-wrap:wrap; }
        .mn-filter-btn {
          padding:7px 14px; border-radius:8px; border:1px solid var(--border);
          background:var(--white); font-family:'DM Sans',sans-serif; font-size:12.5px;
          color:var(--muted); cursor:pointer; transition:all .15s;
          display:flex; align-items:center; gap:6px;
        }
        .mn-filter-btn:hover { border-color:var(--navy); color:var(--navy); }
        .mn-filter-btn--active { background:var(--navy); border-color:var(--navy); color:#fff; }
        .mn-filter-count { font-size:10.5px; font-weight:600; background:rgba(255,255,255,.18); padding:1px 6px; border-radius:100px; }
        .mn-filter-btn:not(.mn-filter-btn--active) .mn-filter-count { background:rgba(13,27,42,.07); color:var(--navy); }

        /* new request btn */
        .mn-btn-new {
          display:flex; align-items:center; gap:8px;
          background:var(--gold); color:var(--navy);
          border:none; padding:10px 20px; border-radius:8px;
          font-family:'DM Sans',sans-serif; font-weight:500; font-size:13.5px;
          cursor:pointer; transition:all .18s;
        }
        .mn-btn-new:hover { background:#D9B85C; transform:translateY(-1px); box-shadow:0 6px 18px rgba(201,168,76,.35); }
        .mn-btn-new:disabled { opacity:.55; cursor:not-allowed; transform:none; box-shadow:none; }

        /* ── REQUEST CARDS ── */
        .mn-cards { display:flex; flex-direction:column; gap:14px; }
        .mn-card {
          background:var(--white); border:1px solid var(--border); border-radius:14px;
          border-left:4px solid transparent;
          padding:22px 24px; transition:transform .18s, box-shadow .18s;
        }
        .mn-card:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(13,27,42,.07); }
        .mn-card-head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; gap:12px; }
        .mn-card-title { font-family:'Fraunces',serif; font-size:17px; font-weight:600; color:var(--navy); margin-bottom:6px; line-height:1.3; }
        .mn-card-meta { display:flex; align-items:center; gap:14px; }
        .mn-card-meta-item { display:flex; align-items:center; gap:5px; font-size:12px; color:var(--muted); }
        .mn-card-meta-item svg { width:12px; height:12px; stroke:currentColor; }
        .mn-card-desc { font-size:13.5px; color:#4A6580; line-height:1.7; margin-bottom:18px; padding:12px 16px; background:#F9F8F6; border-radius:8px; border:1px solid rgba(13,27,42,.05); }
        .mn-card-image-link { display:flex; align-items:center; gap:12px; margin-bottom:18px; padding:10px; border-radius:10px; border:1px solid var(--border); background:#fff; color:var(--navy); text-decoration:none; font-size:12.5px; font-weight:500; }
        .mn-card-image-link:hover { border-color:var(--gold-b); color:#9a7b2c; }
        .mn-card-image { width:72px; height:54px; object-fit:cover; border-radius:8px; border:1px solid var(--border); flex-shrink:0; }
        .mn-card-foot { display:flex; align-items:center; justify-content:space-between; padding-top:16px; border-top:1px solid var(--border); }
        .mn-card-resolved { display:flex; align-items:center; gap:6px; font-size:12.5px; color:#16a34a; font-weight:500; }
        .mn-card-resolved svg { width:13px; height:13px; stroke:currentColor; }

        /* ── ĐÁNH GIÁ SAO ── */
        .mn-rating-box { margin-top:16px; padding-top:16px; border-top:1px dashed var(--border); }
        .mn-rating-row { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
        .mn-rating-label { font-size:13px; color:#4A6580; font-weight:500; }
        .mn-stars { display:flex; gap:2px; }
        .mn-star { background:none; border:none; padding:2px; cursor:pointer; color:#d4d4d8; display:flex; transition:color .12s, transform .12s; }
        .mn-star--on { color:#f59e0b; }
        .mn-star:not(.mn-star--ro):hover { transform:scale(1.18); }
        .mn-star--ro { cursor:default; }
        .mn-star svg { width:26px; height:26px; }

        /* badges */
        .mn-status-badge { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:100px; font-size:12px; font-weight:500; white-space:nowrap; flex-shrink:0; }
        .mn-status-icon { display:flex; align-items:center; }
        .mn-status-icon svg { width:12px; height:12px; stroke:currentColor; }
        .mn-priority-pill { display:inline-flex; align-items:center; gap:6px; padding:4px 11px; border-radius:100px; font-size:12px; font-weight:500; }
        .mn-priority-dot { width:6px; height:6px; border-radius:50%; animation:mnPulse 1.5s infinite; flex-shrink:0; }
        @keyframes mnPulse { 0%,100%{opacity:1;} 50%{opacity:.3;} }

        /* ── EMPTY / NO ROOM ── */
        .mn-empty { background:var(--white); border:1px solid var(--border); border-radius:14px; padding:60px 24px; text-align:center; }
        .mn-empty-icon { width:52px; height:52px; border-radius:14px; background:#F5F3EF; display:flex; align-items:center; justify-content:center; margin:0 auto 18px; color:var(--muted); }
        .mn-empty-icon svg { width:24px; height:24px; stroke:currentColor; }
        .mn-empty-title { font-family:'Fraunces',serif; font-size:18px; font-weight:600; color:var(--navy); margin-bottom:8px; }
        .mn-empty-sub { font-size:13.5px; color:var(--muted); line-height:1.6; max-width:320px; margin:0 auto 24px; }
        .mn-empty-link { display:inline-flex; align-items:center; gap:7px; padding:10px 20px; background:var(--navy); color:#fff; border-radius:8px; text-decoration:none; font-size:13.5px; font-weight:500; transition:background .15s; }
        .mn-empty-link:hover { background:#1A2E42; }

        /* ── LOADING SKELETON ── */
        .mn-sk { display:inline-block; border-radius:4px; background:linear-gradient(90deg,#EDE9E3 25%,#E4E0D8 50%,#EDE9E3 75%); background-size:400% 100%; animation:mnShimmer 1.4s ease infinite; }
        @keyframes mnShimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
        .mn-sk-card { background:var(--white); border:1px solid var(--border); border-left:4px solid #E4E0D8; border-radius:14px; padding:22px 24px; }

        /* ── MODAL ── */
        .mn-overlay { position:fixed; inset:0; z-index:200; background:rgba(13,27,42,.6); display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(4px); }
        /* max-height + flex để form dài (có ảnh preview) tự cuộn phần thân thay vì tràn khỏi màn hình */
        .mn-modal { background:var(--white); border-radius:18px; width:100%; max-width:520px; max-height:90vh; overflow:hidden; box-shadow:0 28px 60px rgba(13,27,42,.22); animation:mnModalIn .22s ease; display:flex; flex-direction:column; }
        .mn-modal-head { flex-shrink:0; }
        .mn-modal form { display:flex; flex-direction:column; min-height:0; flex:1; }
        @keyframes mnModalIn { from{opacity:0;transform:scale(.96) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }

        .mn-modal-head { padding:20px 24px 18px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
        .mn-modal-head-left { display:flex; align-items:center; gap:12px; }
        .mn-modal-icon { width:38px; height:38px; border-radius:9px; background:var(--gold-dim); border:1px solid var(--gold-b); display:flex; align-items:center; justify-content:center; color:var(--gold); }
        .mn-modal-icon svg { width:18px; height:18px; stroke:currentColor; }
        .mn-modal-title { font-family:'Fraunces',serif; font-size:18px; font-weight:700; color:var(--navy); }
        .mn-modal-sub { font-size:12px; color:var(--muted); margin-top:2px; }
        .mn-modal-close { width:32px; height:32px; border-radius:8px; border:1px solid var(--border); background:transparent; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--muted); transition:all .15s; }
        .mn-modal-close:hover { background:#F5F3EF; color:var(--navy); border-color:var(--navy); }

        .mn-modal-body { padding:22px 24px; display:flex; flex-direction:column; gap:18px; overflow-y:auto; flex:1; min-height:0; }

        /* form field */
        .mn-field { display:flex; flex-direction:column; gap:5px; }
        .mn-field-label { font-size:12px; font-weight:500; color:var(--navy); letter-spacing:.01em; }
        .mn-field-hint  { font-size:11px; color:var(--muted); }
        .mn-input, .mn-textarea {
          padding:10px 13px; border:1px solid var(--border); border-radius:9px;
          font-family:'DM Sans',sans-serif; font-size:13.5px; color:var(--navy);
          background:#F9F8F6; outline:none; transition:border-color .15s, background .15s;
          width:100%;
        }
        .mn-input:focus, .mn-textarea:focus { border-color:var(--gold); background:var(--white); }
        .mn-input::placeholder, .mn-textarea::placeholder { color:var(--muted); }
        .mn-textarea { resize:vertical; min-height:96px; line-height:1.6; }

        .mn-file-control { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px; border:1px dashed rgba(13,27,42,.18); border-radius:10px; background:#F9F8F6; }
        .mn-file-btn { display:inline-flex; align-items:center; gap:8px; padding:9px 13px; border-radius:8px; border:1px solid var(--border); background:#fff; color:var(--navy); font-size:12.5px; font-weight:500; cursor:pointer; transition:all .15s; }
        .mn-file-btn:hover { border-color:var(--gold); color:#9a7b2c; }
        .mn-file-name { flex:1; min-width:0; color:var(--muted); font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .mn-file-clear { border:none; background:transparent; color:#dc2626; cursor:pointer; font-size:12px; font-weight:500; }
        .mn-image-preview { margin-top:10px; width:100%; max-height:180px; object-fit:cover; border-radius:10px; border:1px solid var(--border); }

        /* priority picker */
        .mn-priority-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
        .mn-priority-opt {
          display:flex; flex-direction:column; align-items:center; gap:7px;
          padding:10px 6px; border-radius:8px; border:1px solid var(--border);
          background:transparent; cursor:pointer; transition:all .15s;
        }
        .mn-priority-opt:hover { border-color:rgba(13,27,42,.2); background:#F9F8F6; }
        .mn-priority-opt--selected { box-shadow:0 2px 8px rgba(0,0,0,.06); }
        .mn-priority-bar { width:28px; height:4px; border-radius:2px; }
        .mn-priority-opt-label { font-size:11px; font-weight:500; color:var(--navy); text-align:center; line-height:1.3; }

        /* modal footer */
        .mn-modal-foot { display:flex; gap:10px; padding:14px 24px 22px; flex-shrink:0; border-top:1px solid var(--border); }
        .mn-btn-cancel {
          flex:1; padding:11px; border:1px solid var(--border); border-radius:8px;
          background:transparent; cursor:pointer; font-family:'DM Sans',sans-serif;
          font-size:13.5px; color:var(--navy); transition:background .15s;
        }
        .mn-btn-cancel:hover { background:#F5F3EF; }
        .mn-btn-submit {
          flex:2; padding:11px; background:var(--navy); color:#fff;
          border:none; border-radius:8px; cursor:pointer; font-family:'DM Sans',sans-serif;
          font-size:13.5px; font-weight:500; display:flex; align-items:center; justify-content:center; gap:7px;
          transition:all .15s;
        }
        .mn-btn-submit:hover { background:#1A2E42; }
        .mn-btn-submit:disabled { opacity:.6; cursor:not-allowed; }

        /* ── TOAST ── */
        .mn-toast { position:fixed; bottom:26px; right:26px; z-index:300; display:flex; align-items:center; gap:10px; padding:12px 16px; border-radius:11px; box-shadow:0 8px 28px rgba(13,27,42,.14); animation:mnToastIn .25s ease; max-width:340px; background:var(--white); }
        @keyframes mnToastIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .mn-toast--success { border:1px solid rgba(34,197,94,.25); }
        .mn-toast--error   { border:1px solid rgba(239,68,68,.25); }
        .mn-toast-icon { display:flex; flex-shrink:0; }
        .mn-toast--success .mn-toast-icon { color:#16a34a; }
        .mn-toast--error   .mn-toast-icon { color:#dc2626; }
        .mn-toast-text { flex:1; font-size:13.5px; color:var(--navy); }
        .mn-toast-close { background:none; border:none; cursor:pointer; color:var(--muted); display:flex; padding:2px; }

        /* ── RESPONSIVE ── */
        @media (max-width:900px) { .mn-banner { flex-direction:column; align-items:flex-start; gap:16px; } .mn-banner-right { width:100%; } }
      `}</style>

      {/* Banner */}
      <div className="mn-banner">
        <div className="mn-banner-bg" />
        <div className="mn-banner-grid" />
        <div className="mn-banner-left">
          <span className="mn-banner-eyebrow">Hỗ trợ kỹ thuật</span>
          <div className="mn-banner-title">
            Sự cố? Báo ngay —<br />
            chúng tôi <em>xử lý nhanh</em>.
          </div>
          <div className="mn-banner-sub">
            Gửi yêu cầu sửa chữa, ban kỹ thuật sẽ tiếp nhận và phản hồi trong vòng 24 giờ.
          </div>
        </div>
        {!loading && (
          <div className="mn-banner-right">
            <div className="mn-bstat">
              <div className="mn-bstat-val">{requests.length}</div>
              <div className="mn-bstat-label">Tổng đơn</div>
            </div>
            <div className="mn-bstat">
              <div className="mn-bstat-val" style={{ color: "#f59e0b" }}>{countByStatus("PENDING")}</div>
              <div className="mn-bstat-label">Chờ duyệt</div>
            </div>
            <div className="mn-bstat">
              <div className="mn-bstat-val" style={{ color: "#22c55e" }}>{countByStatus("RESOLVED")}</div>
              <div className="mn-bstat-label">Đã xong</div>
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="mn-toolbar">
        <div className="mn-filters">
          {(["ALL", "PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"] as const).map((f) => (
            <button
              key={f}
              className={`mn-filter-btn ${activeFilter === f ? "mn-filter-btn--active" : ""}`}
              onClick={() => setActiveFilter(f)}
              type="button"
            >
              {f === "ALL" ? "Tất cả" :
                f === "PENDING" ? "Chờ tiếp nhận" :
                f === "IN_PROGRESS" ? "Đang sửa" :
                f === "RESOLVED" ? "Hoàn thành" : "Từ chối"}
              <span className="mn-filter-count">
                {f === "ALL" ? requests.length : countByStatus(f as Status)}
              </span>
            </button>
          ))}
        </div>
        <button
          className="mn-btn-new"
          type="button"
          onClick={() => setShowModal(true)}
          disabled={!hasRoom}
          title={!hasRoom ? "Bạn cần có phòng để báo cáo sự cố" : ""}
        >
          {Icons.plus} Tạo báo cáo mới
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="mn-cards">
          {[1, 2, 3].map((i) => (
            <div key={i} className="mn-sk-card">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <span className="mn-sk" style={{ width: 200, height: 17, display: "block", marginBottom: 8 }} />
                  <span className="mn-sk" style={{ width: 120, height: 12, display: "block" }} />
                </div>
                <span className="mn-sk" style={{ width: 90, height: 26, borderRadius: 100 }} />
              </div>
              <span className="mn-sk" style={{ width: "100%", height: 56, borderRadius: 8, display: "block", marginBottom: 16 }} />
              <span className="mn-sk" style={{ width: 80, height: 22, borderRadius: 100 }} />
            </div>
          ))}
        </div>
      ) : !hasRoom ? (
        <div className="mn-empty">
          <div className="mn-empty-icon">{Icons.building}</div>
          <div className="mn-empty-title">Bạn chưa có phòng lưu trú</div>
          <div className="mn-empty-sub">
            Bạn cần có phòng trước khi có thể gửi yêu cầu sửa chữa. Hãy tìm và đặt phòng trước nhé.
          </div>
          <Link href="/student/rooms" className="mn-empty-link">
            {Icons.search} Tìm phòng ngay
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mn-empty">
          <div className="mn-empty-icon">{Icons.wrench}</div>
          <div className="mn-empty-title">
            {activeFilter === "ALL" ? "Phòng bạn đang hoạt động tốt!" : "Không có yêu cầu nào ở trạng thái này"}
          </div>
          <div className="mn-empty-sub">
            {activeFilter === "ALL"
              ? "Chưa có yêu cầu sửa chữa nào. Nếu có sự cố, hãy bấm nút Tạo báo cáo mới."
              : "Thử chọn bộ lọc khác để xem các yêu cầu còn lại."}
          </div>
        </div>
      ) : (
        <div className="mn-cards">
          {filtered.map((req) => <RequestCard key={req._id} req={req} onRate={handleRate} />)}
        </div>
      )}

      {/* ─── Modal ──────────────────────────────────────────────────── */}
      {showModal && (
        <div className="mn-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="mn-modal">
            <div className="mn-modal-head">
              <div className="mn-modal-head-left">
                <div className="mn-modal-icon">{Icons.wrench}</div>
                <div>
                  <div className="mn-modal-title">Báo cáo sự cố</div>
                  <div className="mn-modal-sub">Mô tả rõ để kỹ thuật viên chuẩn bị đúng vật tư</div>
                </div>
              </div>
              <button className="mn-modal-close" type="button" onClick={closeModal}>
                {Icons.x}
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mn-modal-body">

                <div className="mn-field">
                  <label className="mn-field-label">Tóm tắt sự cố</label>
                  <span className="mn-field-hint">Một câu ngắn gọn mô tả vấn đề</span>
                  <input
                    className="mn-input"
                    type="text"
                    required
                    placeholder="VD: Hỏng bóng đèn nhà vệ sinh, Vòi nước rò rỉ..."
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="mn-field">
                  <label className="mn-field-label">Mô tả chi tiết</label>
                  <span className="mn-field-hint">Vị trí cụ thể và tình trạng hư hỏng để kỹ thuật viên chuẩn bị trước</span>
                  <textarea
                    className="mn-textarea"
                    required
                    placeholder="VD: Bóng đèn ở góc trái nhà vệ sinh bị cháy hoàn toàn từ tối qua, gây tối trong khu vực..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="mn-field">
                  <label className="mn-field-label">Mức độ ảnh hưởng</label>
                  <span className="mn-field-hint">Chọn mức độ phù hợp để ban quản lý ưu tiên xử lý</span>
                  <div className="mn-priority-grid">
                    {(["LOW", "MEDIUM", "HIGH", "URGENT"] as Priority[]).map((p) => (
                      <PriorityOption
                        key={p}
                        value={p}
                        selected={form.priority === p}
                        onClick={() => setForm({ ...form, priority: p })}
                      />
                    ))}
                  </div>
                </div>

                <div className="mn-field">
                  <label className="mn-field-label">Ảnh thực tế</label>
                  <span className="mn-field-hint">Đính kèm ảnh rõ khu vực hư hỏng để ban quản lý đánh giá nhanh hơn</span>
                  <div className="mn-file-control">
                    <label className="mn-file-btn">
                      {Icons.image} Đính kèm ảnh
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => handleImageChange(e.target.files?.[0])}
                      />
                    </label>
                    <span className="mn-file-name">{imageFile ? imageFile.name : "Chưa chọn ảnh"}</span>
                    {imageFile && (
                      <button type="button" className="mn-file-clear" onClick={() => setImageFile(null)}>
                        Xóa
                      </button>
                    )}
                  </div>
                  {imagePreview && (
                    <img src={imagePreview} alt="Xem truoc anh su co" className="mn-image-preview" />
                  )}
                </div>

              </div>

              <div className="mn-modal-foot">
                <button type="button" className="mn-btn-cancel" onClick={closeModal}>
                  Hủy bỏ
                </button>
                <button type="submit" className="mn-btn-submit" disabled={submitting}>
                  {submitting ? "Đang gửi…" : <>{Icons.plus} Gửi yêu cầu</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
