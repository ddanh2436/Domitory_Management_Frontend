"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RoleGuard from "../../components/RoleGuard";
import NotificationBell from "../../components/NotificationBell";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MaintenanceRequest {
  _id: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  createdAt: string;
  resolvedAt?: string;
}

type Priority = MaintenanceRequest["priority"];
type Status   = MaintenanceRequest["status"];

// ─── Logo ─────────────────────────────────────────────────────────────────────
function DormifyLogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 42 42" fill="none">
      <rect width="42" height="42" rx="10" fill="#1A2E42" />
      <rect x="10" y="8" width="4" height="26" rx="1" fill="#C9A84C" />
      <path d="M14 8 Q28 8 28 21 Q28 34 14 34" stroke="#C9A84C" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <rect x="18" y="12" width="4" height="4" rx="1" fill="rgba(201,168,76,0.45)" />
      <rect x="18" y="19" width="4" height="4" rx="1" fill="rgba(201,168,76,0.45)" />
      <rect x="18" y="26" width="4" height="4" rx="1" fill="rgba(201,168,76,0.45)" />
      <line x1="10" y1="6" x2="26" y2="6" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icons = {
  home:    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  search:  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  doc:     <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  invoice: <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  wrench:  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" strokeWidth={1.8} /></svg>,
  logout:  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  bell:    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  lock:    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  plus:    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" /></svg>,
  x:       <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>,
  check:   <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>,
  clock:   <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  alert:   <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  building:<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
};

// ─── Priority config ──────────────────────────────────────────────────────────
const PRIORITY_CONFIG: Record<Priority, {
  label: string; color: string; bg: string; border: string; barColor: string;
}> = {
  LOW:    { label: "Thấp",       color: "#64748b", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.2)", barColor: "#94a3b8" },
  MEDIUM: { label: "Bình thường",color: "#0284c7", bg: "rgba(2,132,199,0.08)",   border: "rgba(2,132,199,0.2)",   barColor: "#38bdf8" },
  HIGH:   { label: "Ưu tiên cao",color: "#ea580c", bg: "rgba(234,88,12,0.08)",   border: "rgba(234,88,12,0.2)",   barColor: "#fb923c" },
  URGENT: { label: "Khẩn cấp",   color: "#dc2626", bg: "rgba(220,38,38,0.09)",   border: "rgba(220,38,38,0.25)",  barColor: "#ef4444" },
};

const STATUS_CONFIG: Record<Status, {
  label: string; color: string; bg: string; border: string; icon: React.ReactNode;
}> = {
  PENDING:     { label: "Chờ tiếp nhận",  color: "#b45309", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.22)", icon: Icons.clock },
  IN_PROGRESS: { label: "Đang sửa chữa", color: "#0284c7", bg: "rgba(14,165,233,0.1)", border: "rgba(14,165,233,0.2)",  icon: Icons.wrench },
  RESOLVED:    { label: "Đã hoàn thành", color: "#16a34a", bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.2)",   icon: Icons.check },
  REJECTED:    { label: "Bị từ chối",    color: "#dc2626", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.2)",   icon: Icons.x },
};

// ─── Nav Item ─────────────────────────────────────────────────────────────────
function NavItem({ icon, label, active = false, href = "#", locked = false }: {
  icon: React.ReactNode; label: string; active?: boolean; href?: string; locked?: boolean;
}) {
  return (
    <a href={locked ? undefined : href} className={`mn-nav-item ${active ? "mn-nav-item--active" : ""} ${locked ? "mn-nav-item--locked" : ""}`}>
      <span className="mn-nav-icon">{icon}</span>
      <span className="mn-nav-label">{label}</span>
      {locked && <span className="mn-nav-lock">{Icons.lock}</span>}
    </a>
  );
}

// ─── Priority Pill ────────────────────────────────────────────────────────────
function PriorityPill({ priority }: { priority: Priority }) {
  const c = PRIORITY_CONFIG[priority];
  return (
    <span className="mn-priority-pill" style={{ color: c.color, background: c.bg, border: `1px solid ${c.border}` }}>
      {priority === "URGENT" && <span className="mn-priority-dot" style={{ background: c.barColor }} />}
      {c.label}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Status }) {
  const c = STATUS_CONFIG[status];
  return (
    <span className="mn-status-badge" style={{ color: c.color, background: c.bg, border: `1px solid ${c.border}` }}>
      <span className="mn-status-icon">{c.icon}</span>
      {c.label}
    </span>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────
function RequestCard({ req }: { req: MaintenanceRequest }) {
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

      <div className="mn-card-foot">
        <PriorityPill priority={req.priority} />
        {req.resolvedAt && (
          <span className="mn-card-resolved">
            {Icons.check} Xử lý xong: {new Date(req.resolvedAt).toLocaleDateString("vi-VN")}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ type, text, onClose }: { type: "success" | "error"; text: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`mn-toast mn-toast--${type}`}>
      <span className="mn-toast-icon">{type === "success" ? Icons.check : Icons.alert}</span>
      <span className="mn-toast-text">{text}</span>
      <button className="mn-toast-close" onClick={onClose}>{Icons.x}</button>
    </div>
  );
}

// ─── Priority Option ──────────────────────────────────────────────────────────
function PriorityOption({ value, selected, onClick }: {
  value: Priority; selected: boolean; onClick: () => void;
}) {
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
  const [requests,    setRequests]    = useState<MaintenanceRequest[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [hasRoom,     setHasRoom]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [toast,       setToast]       = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeFilter, setActiveFilter] = useState<"ALL" | Status>("ALL");

  const [form, setForm] = useState<{ title: string; description: string; priority: Priority }>({
    title: "", description: "", priority: "MEDIUM",
  });

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const profileRes = await fetch("http://localhost:3001/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profile = await profileRes.json();

      if (!profile.room) { setHasRoom(false); setLoading(false); return; }

      const res = await fetch("http://localhost:3001/api/maintenance/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setRequests(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: "success", text: "Đã gửi báo cáo sự cố thành công!" });
        setForm({ title: "", description: "", priority: "MEDIUM" });
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const filtered = activeFilter === "ALL"
    ? requests
    : requests.filter(r => r.status === activeFilter);

  const countByStatus = (s: Status) => requests.filter(r => r.status === s).length;

  return (
    <RoleGuard allowedRoles={["STUDENT"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;1,9..144,400&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --navy:    #0D1B2A;
          --navy-md: #1A2E42;
          --gold:    #C9A84C;
          --gold-dim:rgba(201,168,76,0.15);
          --gold-b:  rgba(201,168,76,0.25);
          --white:   #ffffff;
          --muted:   #8A9BAD;
          --border:  rgba(13,27,42,0.09);
          --bg:      #F2EFE9;
          --sw: 240px;
        }

        .mn-shell { display:flex; min-height:100vh; background:var(--bg); font-family:'DM Sans',sans-serif; }

        /* ── SIDEBAR ── */
        .mn-sidebar {
          width:var(--sw); flex-shrink:0; background:var(--navy);
          min-height:100vh; position:fixed; top:0; left:0; bottom:0;
          border-right:1px solid var(--gold-b); display:flex; flex-direction:column; z-index:40;
        }
        .mn-brand { padding:22px 18px 18px; display:flex; align-items:center; gap:11px; border-bottom:1px solid rgba(255,255,255,.06); }
        .mn-wordmark { font-family:'Fraunces',serif; font-size:20px; font-weight:600; color:#fff; }
        .mn-wordmark span { color:var(--gold); }
        .mn-sb-profile { padding:16px 18px 14px; border-bottom:1px solid rgba(255,255,255,.06); display:flex; align-items:center; gap:11px; }
        .mn-sb-av { width:34px; height:34px; border-radius:9px; background:linear-gradient(135deg,var(--gold),#E2B96A); display:flex; align-items:center; justify-content:center; font-family:'Fraunces',serif; font-weight:700; font-size:13px; color:var(--navy); flex-shrink:0; }
        .mn-sb-name { font-size:12.5px; font-weight:500; color:#fff; line-height:1.3; }
        .mn-sb-role { font-size:10.5px; color:rgba(255,255,255,.3); margin-top:1px; }
        .mn-sb-section { padding:12px 18px 3px; font-size:10px; font-weight:500; letter-spacing:.12em; text-transform:uppercase; color:rgba(255,255,255,.25); }
        .mn-nav { padding:4px 10px 10px; display:flex; flex-direction:column; gap:2px; flex:1; }
        .mn-nav-item { display:flex; align-items:center; gap:11px; padding:9px 11px; border-radius:8px; text-decoration:none; transition:background .15s; }
        .mn-nav-item:hover { background:rgba(255,255,255,.05); }
        .mn-nav-icon  { color:var(--muted); flex-shrink:0; display:flex; }
        .mn-nav-label { font-size:13px; font-weight:400; color:rgba(255,255,255,.5); flex:1; }
        .mn-nav-lock  { color:rgba(255,255,255,.2); display:flex; }
        .mn-nav-item--active { background:var(--gold-dim) !important; }
        .mn-nav-item--active .mn-nav-label { color:var(--gold) !important; font-weight:500; }
        .mn-nav-item--active .mn-nav-icon  { color:var(--gold) !important; }
        .mn-nav-item--locked { cursor:default; opacity:.45; pointer-events:none; }
        .mn-sb-footer { padding:14px 10px; border-top:1px solid rgba(255,255,255,.06); }
        .mn-btn-logout { display:flex; align-items:center; gap:11px; padding:9px 11px; border-radius:8px; border:none; background:transparent; cursor:pointer; width:100%; transition:background .15s; }
        .mn-btn-logout:hover { background:rgba(220,50,50,.1); }
        .mn-btn-logout .mn-nav-icon { color:rgba(240,80,80,.65); }
        .mn-btn-logout span { font-size:13px; color:rgba(240,80,80,.75); }

        /* ── MAIN ── */
        .mn-main { margin-left:var(--sw); flex:1; display:flex; flex-direction:column; }

        /* ── TOPBAR ── */
        .mn-topbar { background:var(--white); border-bottom:1px solid var(--border); padding:0 28px; height:60px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:30; }
        .mn-tb-title { font-family:'Fraunces',serif; font-size:17px; font-weight:600; color:var(--navy); letter-spacing:-.2px; }
        .mn-tb-sub { font-size:11px; color:var(--muted); margin-top:1px; }
        .mn-tb-right { display:flex; align-items:center; gap:10px; }
        .mn-tb-bell { width:34px; height:34px; border-radius:8px; border:1px solid var(--border); background:transparent; display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--muted); position:relative; transition:all .15s; }
        .mn-tb-bell:hover { border-color:var(--gold); color:var(--gold); background:var(--gold-dim); }
        .mn-bell-dot { position:absolute; top:7px; right:7px; width:5px; height:5px; border-radius:50%; background:var(--gold); border:1.5px solid var(--white); }
        .mn-tb-av { width:34px; height:34px; border-radius:9px; background:var(--navy); border:1.5px solid var(--gold-b); display:flex; align-items:center; justify-content:center; font-family:'Fraunces',serif; font-size:12px; font-weight:600; color:var(--gold); cursor:pointer; }

        /* ── PAGE BODY ── */
        .mn-body { padding:26px 28px 52px; }

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
          border:none; padding:10px 20px; border-radius:9px;
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
        .mn-card-head-left {}
        .mn-card-title { font-family:'Fraunces',serif; font-size:17px; font-weight:600; color:var(--navy); margin-bottom:6px; line-height:1.3; }
        .mn-card-meta { display:flex; align-items:center; gap:14px; }
        .mn-card-meta-item { display:flex; align-items:center; gap:5px; font-size:12px; color:var(--muted); }
        .mn-card-meta-item svg { width:12px; height:12px; stroke:currentColor; }
        .mn-card-desc { font-size:13.5px; color:#4A6580; line-height:1.7; margin-bottom:18px; padding:12px 16px; background:#F9F8F6; border-radius:8px; border:1px solid rgba(13,27,42,.05); }
        .mn-card-foot { display:flex; align-items:center; justify-content:space-between; padding-top:16px; border-top:1px solid var(--border); }
        .mn-card-resolved { display:flex; align-items:center; gap:6px; font-size:12.5px; color:#16a34a; font-weight:500; }
        .mn-card-resolved svg { width:13px; height:13px; stroke:currentColor; }

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
        .mn-modal { background:var(--white); border-radius:18px; width:100%; max-width:520px; overflow:hidden; box-shadow:0 28px 60px rgba(13,27,42,.22); animation:mnModalIn .22s ease; }
        @keyframes mnModalIn { from{opacity:0;transform:scale(.96) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }

        .mn-modal-head { padding:20px 24px 18px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
        .mn-modal-head-left { display:flex; align-items:center; gap:12px; }
        .mn-modal-icon { width:38px; height:38px; border-radius:9px; background:var(--gold-dim); border:1px solid var(--gold-b); display:flex; align-items:center; justify-content:center; color:var(--gold); }
        .mn-modal-icon svg { width:18px; height:18px; stroke:currentColor; }
        .mn-modal-title { font-family:'Fraunces',serif; font-size:18px; font-weight:700; color:var(--navy); }
        .mn-modal-sub { font-size:12px; color:var(--muted); margin-top:2px; }
        .mn-modal-close { width:32px; height:32px; border-radius:8px; border:1px solid var(--border); background:transparent; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--muted); transition:all .15s; }
        .mn-modal-close:hover { background:#F5F3EF; color:var(--navy); border-color:var(--navy); }

        .mn-modal-body { padding:22px 24px; display:flex; flex-direction:column; gap:18px; }

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

        /* priority picker */
        .mn-priority-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
        .mn-priority-opt {
          display:flex; flex-direction:column; align-items:center; gap:7px;
          padding:10px 6px; border-radius:9px; border:1px solid var(--border);
          background:transparent; cursor:pointer; transition:all .15s;
        }
        .mn-priority-opt:hover { border-color:rgba(13,27,42,.2); background:#F9F8F6; }
        .mn-priority-opt--selected { box-shadow:0 2px 8px rgba(0,0,0,.06); }
        .mn-priority-bar { width:28px; height:4px; border-radius:2px; }
        .mn-priority-opt-label { font-size:11px; font-weight:500; color:var(--navy); text-align:center; line-height:1.3; }

        /* modal footer */
        .mn-modal-foot { display:flex; gap:10px; padding:0 24px 22px; }
        .mn-btn-cancel {
          flex:1; padding:11px; border:1px solid var(--border); border-radius:9px;
          background:transparent; cursor:pointer; font-family:'DM Sans',sans-serif;
          font-size:13.5px; color:var(--navy); transition:background .15s;
        }
        .mn-btn-cancel:hover { background:#F5F3EF; }
        .mn-btn-submit {
          flex:2; padding:11px; background:var(--navy); color:#fff;
          border:none; border-radius:9px; cursor:pointer; font-family:'DM Sans',sans-serif;
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
        @media (max-width:768px) { .mn-sidebar { transform:translateX(-100%); } .mn-main { margin-left:0; } .mn-body { padding:16px 14px 40px; } }
      `}</style>

      <div className="mn-shell">

        {/* ─── Sidebar ──────────────────────────────────────────────── */}
        <aside className="mn-sidebar">
          <div className="mn-brand">
            <DormifyLogoMark size={36} />
            <span className="mn-wordmark">Dorm<span>ify</span></span>
          </div>
          <div className="mn-sb-profile">
            <div className="mn-sb-av">SV</div>
            <div>
              <div className="mn-sb-name">Sinh viên</div>
              <div className="mn-sb-role">Không gian cá nhân</div>
            </div>
          </div>
          <div className="mn-sb-section">Dịch vụ</div>
          <nav className="mn-nav">
            <NavItem icon={Icons.home}    label="Tổng quan"        href="/student" />
            <NavItem icon={Icons.search}  label="Tìm & Đặt phòng" href="/student/rooms" />
            <NavItem icon={Icons.doc}     label="Hợp đồng"    href= "/student/contracts"      />
            <NavItem icon={Icons.invoice} label="Hóa đơn"        href="/student/invoices"   />
            <NavItem icon={Icons.wrench}  label="Yêu cầu sửa chữa" href="/student/maintenance" active />
          </nav>
          <div className="mn-sb-footer">
            <button className="mn-btn-logout" type="button" onClick={handleLogout}>
              <span className="mn-nav-icon">{Icons.logout}</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* ─── Main ─────────────────────────────────────────────────── */}
        <div className="mn-main">
          <header className="mn-topbar">
            <div>
              <div className="mn-tb-title">Yêu cầu sửa chữa</div>
              <div className="mn-tb-sub">Dormify · Sinh viên · Bảo trì</div>
            </div>
            <div className="mn-tb-right">
              <NotificationBell />
              <div className="mn-tb-av">SV</div>
            </div>
          </header>

          <main className="mn-body">

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
                {filtered.map((req) => <RequestCard key={req._id} req={req} />)}
              </div>
            )}

          </main>
        </div>
      </div>

      {/* ─── Modal ──────────────────────────────────────────────────── */}
      {showModal && (
        <div className="mn-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="mn-modal">
            <div className="mn-modal-head">
              <div className="mn-modal-head-left">
                <div className="mn-modal-icon">{Icons.wrench}</div>
                <div>
                  <div className="mn-modal-title">Báo cáo sự cố</div>
                  <div className="mn-modal-sub">Mô tả rõ để kỹ thuật viên chuẩn bị đúng vật tư</div>
                </div>
              </div>
              <button className="mn-modal-close" type="button" onClick={() => setShowModal(false)}>
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

              </div>

              <div className="mn-modal-foot">
                <button type="button" className="mn-btn-cancel" onClick={() => setShowModal(false)}>
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

      {/* ─── Toast ──────────────────────────────────────────────────── */}
      {toast && (
        <Toast type={toast.type} text={toast.text} onClose={() => setToast(null)} />
      )}
    </RoleGuard>
  );
}