"use client";

import { useEffect, useState } from "react";
import RoleGuard from "../../components/RoleGuard";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Room {
  _id: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  currentOccupancy: number;
  price: number;
  status: "AVAILABLE" | "FULL" | "MAINTENANCE";
  facilities?: string[];
}

interface FormData {
  name: string;
  building: string;
  floor: string;
  capacity: string;
  price: string;
  facilities: string;
}

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
  chart: <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  home: <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  users: <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
  doc: <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  invoice: <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  wrench: <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" strokeWidth={1.8} /></svg>,
  logout: <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  bell: <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  plus: <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" /></svg>,
  trash: <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  check: <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>,
  x: <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>,
  warn: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
};

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────
function NavItem({ icon, label, active = false, badge, href = "#" }: {
  icon: React.ReactNode; label: string; active?: boolean; badge?: number; href?: string;
}) {
  return (
    <a href={href} className={`rm-nav-item ${active ? "rm-nav-item--active" : ""}`}>
      <span className="rm-nav-icon">{icon}</span>
      <span className="rm-nav-label">{label}</span>
      {badge != null && <span className="rm-nav-badge">{badge}</span>}
    </a>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ room, onConfirm, onCancel, loading }: {
  room: Room; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="rm-overlay">
      <div className="rm-modal">
        <div className="rm-modal__icon-wrap">
          <span className="rm-modal__icon">{Icons.warn}</span>
        </div>
        <h3 className="rm-modal__title">Xóa phòng này?</h3>
        <p className="rm-modal__desc">
          Bạn sắp xóa phòng <strong>{room.name}</strong> — Tòa {room.building}, Tầng {room.floor}.
          Hành động này không thể hoàn tác.
        </p>
        <div className="rm-modal__actions">
          <button className="rm-btn-cancel" onClick={onCancel} disabled={loading}>Hủy</button>
          <button className="rm-btn-delete-confirm" onClick={onConfirm} disabled={loading}>
            {loading ? "Đang xóa…" : "Xóa phòng"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Room["status"] }) {
  const map = {
    AVAILABLE: { label: "Còn trống", cls: "rm-badge--green" },
    FULL:      { label: "Đã đầy",   cls: "rm-badge--red" },
    MAINTENANCE: { label: "Bảo trì", cls: "rm-badge--amber" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "rm-badge--gray" };
  return <span className={`rm-badge ${cls}`}>{label}</span>;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ type, text, onClose }: { type: "success" | "error"; text: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`rm-toast rm-toast--${type}`}>
      <span className="rm-toast__icon">{type === "success" ? Icons.check : Icons.x}</span>
      <span className="rm-toast__text">{text}</span>
      <button className="rm-toast__close" onClick={onClose}>{Icons.x}</button>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rm-field">
      <label className="rm-field__label">{label}</label>
      {hint && <span className="rm-field__hint">{hint}</span>}
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | Room["status"]>("ALL");

  const [formData, setFormData] = useState<FormData>({
    name: "", building: "", floor: "", capacity: "", price: "", facilities: "",
  });

  // ── fetch rooms ──
  const fetchRooms = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/api/rooms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setRooms(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  // ── submit new room ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation for instant feedback on duplicate room names
    const isDuplicate = rooms.some(
      (r) => r.name.trim().toLowerCase() === formData.name.trim().toLowerCase()
    );
    if (isDuplicate) {
      setToast({ type: "error", text: 'Giá trị "name" này đã tồn tại trong cơ sở dữ liệu' });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        name: formData.name,
        building: formData.building,
        floor: parseInt(formData.floor),
        capacity: parseInt(formData.capacity),
        price: parseInt(formData.price),
        facilities: formData.facilities.split(",").map((s) => s.trim()).filter(Boolean),
      };
      const res = await fetch("http://localhost:3001/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi khi tạo phòng");
      setToast({ type: "success", text: `Tạo phòng "${formData.name}" thành công!` });
      setFormData({ name: "", building: "", floor: "", capacity: "", price: "", facilities: "" });
      fetchRooms();
    } catch (err: any) {
      setToast({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // ── delete room ──
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget._id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3001/api/rooms/${deleteTarget._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Lỗi khi xóa phòng");
      }
      setToast({ type: "success", text: `Đã xóa phòng "${deleteTarget.name}"` });
      setRooms((prev) => prev.filter((r) => r._id !== deleteTarget._id));
    } catch (err: any) {
      setToast({ type: "error", text: err.message });
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  // ── filtered list ──
  const filtered = rooms.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.building.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const countByStatus = (s: Room["status"]) => rooms.filter((r) => r.status === s).length;

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;1,9..144,400&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --navy:     #0D1B2A;
          --navy-mid: #1A2E42;
          --navy-lt:  #243B55;
          --gold:     #C9A84C;
          --gold-dim: rgba(201,168,76,0.16);
          --gold-b:   rgba(201,168,76,0.25);
          --cream:    #FAF7F0;
          --white:    #ffffff;
          --muted:    #8A9BAD;
          --border:   rgba(13,27,42,0.09);
          --bg:       #F0EDE8;
          --sidebar-w: 240px;
        }

        .rm-shell {
          display: flex; min-height: 100vh;
          background: var(--bg);
          font-family: 'DM Sans', sans-serif;
        }

        /* ── SIDEBAR ── */
        .rm-sidebar {
          width: var(--sidebar-w); flex-shrink: 0;
          background: var(--navy); min-height: 100vh;
          position: fixed; top: 0; left: 0; bottom: 0;
          border-right: 1px solid var(--gold-b);
          display: flex; flex-direction: column; z-index: 40;
        }
        .rm-brand {
          padding: 22px 18px 18px;
          display: flex; align-items: center; gap: 11px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .rm-wordmark {
          font-family: 'Fraunces', serif;
          font-size: 20px; font-weight: 600; color: #fff; letter-spacing: -0.2px;
        }
        .rm-wordmark span { color: var(--gold); }
        .rm-role-chip {
          padding: 14px 18px 4px;
          font-size: 10px; font-weight: 500; letter-spacing: 0.12em;
          text-transform: uppercase; color: rgba(255,255,255,0.28);
        }
        .rm-nav { flex: 1; padding: 4px 10px 16px; display: flex; flex-direction: column; gap: 2px; }
        .rm-nav-item {
          display: flex; align-items: center; gap: 11px;
          padding: 9px 11px; border-radius: 8px;
          text-decoration: none; transition: background 0.15s;
        }
        .rm-nav-item:hover { background: rgba(255,255,255,0.05); }
        .rm-nav-icon { color: var(--muted); flex-shrink: 0; display: flex; }
        .rm-nav-label { font-size: 13px; font-weight: 400; color: rgba(255,255,255,0.5); flex: 1; }
        .rm-nav-badge {
          font-size: 10px; font-weight: 600;
          background: var(--gold); color: var(--navy);
          border-radius: 100px; padding: 1px 7px;
        }
        .rm-nav-item--active { background: var(--gold-dim) !important; }
        .rm-nav-item--active .rm-nav-label { color: var(--gold) !important; font-weight: 500; }
        .rm-nav-item--active .rm-nav-icon  { color: var(--gold) !important; }
        .rm-sidebar-footer { padding: 14px 10px; border-top: 1px solid rgba(255,255,255,0.06); }
        .rm-btn-logout {
          display: flex; align-items: center; gap: 11px;
          padding: 9px 11px; border-radius: 8px; border: none;
          background: transparent; cursor: pointer; width: 100%;
          transition: background 0.15s;
        }
        .rm-btn-logout:hover { background: rgba(220,50,50,0.1); }
        .rm-btn-logout .rm-nav-icon { color: rgba(240,80,80,0.65); }
        .rm-btn-logout span { font-size: 13px; color: rgba(240,80,80,0.75); }

        /* ── MAIN ── */
        .rm-main { margin-left: var(--sidebar-w); flex: 1; display: flex; flex-direction: column; }

        /* ── TOPBAR ── */
        .rm-topbar {
          background: var(--white); border-bottom: 1px solid var(--border);
          padding: 0 28px; height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 30;
        }
        .rm-tb-left {}
        .rm-tb-title {
          font-family: 'Fraunces', serif;
          font-size: 17px; font-weight: 600; color: var(--navy); letter-spacing: -0.2px;
        }
        .rm-tb-bread { font-size: 11px; color: var(--muted); margin-top: 1px; }
        .rm-tb-right { display: flex; align-items: center; gap: 10px; }
        .rm-tb-bell {
          width: 34px; height: 34px; border-radius: 8px;
          border: 1px solid var(--border); background: transparent;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--muted); position: relative;
        }
        .rm-tb-bell:hover { border-color: var(--gold); color: var(--gold); background: var(--gold-dim); }
        .rm-tb-dot {
          position: absolute; top: 7px; right: 7px;
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--gold); border: 1.5px solid var(--white);
        }
        .rm-tb-avatar {
          width: 34px; height: 34px; border-radius: 9px;
          background: var(--navy); border: 1.5px solid var(--gold-b);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Fraunces', serif; font-size: 13px; font-weight: 600;
          color: var(--gold); cursor: pointer;
        }

        /* ── PAGE BODY ── */
        .rm-body { padding: 26px 28px 52px; }

        /* ── STAT ROW ── */
        .rm-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 24px; }
        .rm-stat {
          background: var(--white); border: 1px solid var(--border);
          border-radius: 11px; padding: 18px 20px;
          transition: transform .15s, box-shadow .15s;
        }
        .rm-stat:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(13,27,42,0.07); }
        .rm-stat--accent { background: var(--navy); border-color: var(--gold-b); }
        .rm-stat__lbl {
          font-size: 10.5px; font-weight: 500; letter-spacing: .09em;
          text-transform: uppercase; color: var(--muted); margin-bottom: 8px;
        }
        .rm-stat--accent .rm-stat__lbl { color: rgba(255,255,255,.38); }
        .rm-stat__val {
          font-family: 'Fraunces', serif;
          font-size: 30px; font-weight: 700; color: var(--navy);
          letter-spacing: -0.8px; line-height: 1; margin-bottom: 4px;
        }
        .rm-stat--accent .rm-stat__val { color: var(--gold); }
        .rm-stat__sub { font-size: 11px; color: var(--muted); }
        .rm-stat--accent .rm-stat__sub { color: rgba(255,255,255,.28); }

        /* ── GRID LAYOUT ── */
        .rm-grid { display: grid; grid-template-columns: 300px 1fr; gap: 20px; align-items: start; }

        /* ── PANEL ── */
        .rm-panel {
          background: var(--white); border: 1px solid var(--border);
          border-radius: 14px; overflow: hidden;
        }
        .rm-panel__head {
          padding: 18px 22px 16px;
          border-bottom: 1px solid var(--border);
        }
        .rm-panel__title {
          font-family: 'Fraunces', serif;
          font-size: 16px; font-weight: 600; color: var(--navy); letter-spacing: -0.2px;
        }
        .rm-panel__sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
        .rm-panel__body { padding: 20px 22px; }

        /* ── FORM ── */
        .rm-field { display: flex; flex-direction: column; gap: 4px; }
        .rm-field__label {
          font-size: 12px; font-weight: 500; color: var(--navy); letter-spacing: .01em;
        }
        .rm-field__hint { font-size: 11px; color: var(--muted); margin-top: -2px; }
        .rm-input {
          padding: 9px 12px;
          border: 1px solid var(--border); border-radius: 8px;
          font-family: 'DM Sans', sans-serif; font-size: 13px;
          color: var(--navy); background: #F9F8F6; outline: none;
          transition: border-color .15s, background .15s;
          width: 100%;
        }
        .rm-input:focus { border-color: var(--gold); background: var(--white); }
        .rm-input::placeholder { color: var(--muted); }
        .rm-form-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .rm-form-rows { display: flex; flex-direction: column; gap: 14px; }

        /* ── FORM TOAST (inline) ── */
        .rm-inline-msg {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 12px; border-radius: 8px; font-size: 12.5px;
          margin-bottom: 14px;
        }
        .rm-inline-msg--success {
          background: rgba(34,197,94,.1); color: #15803d;
          border: 1px solid rgba(34,197,94,.2);
        }
        .rm-inline-msg--error {
          background: rgba(239,68,68,.08); color: #b91c1c;
          border: 1px solid rgba(239,68,68,.18);
        }

        /* ── SUBMIT BTN ── */
        .rm-btn-submit {
          width: 100%; padding: 10px;
          background: var(--gold); color: var(--navy);
          border: none; border-radius: 8px; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px; font-weight: 500;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          transition: background .15s, transform .1s;
          margin-top: 4px;
        }
        .rm-btn-submit:hover { background: #D9B85C; }
        .rm-btn-submit:active { transform: scale(.98); }
        .rm-btn-submit:disabled { opacity: .6; cursor: not-allowed; }

        /* ── TABLE PANEL ── */
        .rm-table-head {
          padding: 16px 22px;
          display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid var(--border);
          gap: 12px; flex-wrap: wrap;
        }
        .rm-table-head-l { display: flex; flex-direction: column; gap: 2px; }
        .rm-table-head-r { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

        .rm-search-wrap { position: relative; display: flex; align-items: center; }
        .rm-search-ic { position: absolute; left: 10px; color: var(--muted); display: flex; pointer-events: none; }
        .rm-search-ic svg { width: 13px; height: 13px; stroke: currentColor; }
        .rm-search {
          padding: 7px 10px 7px 30px;
          border: 1px solid var(--border); border-radius: 7px;
          font-family: 'DM Sans', sans-serif; font-size: 12.5px;
          color: var(--navy); background: #F9F8F6; outline: none; width: 200px;
          transition: border-color .15s;
        }
        .rm-search:focus { border-color: var(--gold); background: var(--white); }
        .rm-search::placeholder { color: var(--muted); }

        .rm-filter-select {
          padding: 7px 10px;
          border: 1px solid var(--border); border-radius: 7px;
          font-family: 'DM Sans', sans-serif; font-size: 12.5px;
          color: var(--navy); background: #F9F8F6; outline: none; cursor: pointer;
        }
        .rm-filter-select:focus { border-color: var(--gold); }

        .rm-count-badge {
          padding: 3px 10px; border-radius: 100px;
          background: var(--gold-dim); border: 1px solid var(--gold-b);
          font-size: 11.5px; font-weight: 500; color: var(--gold);
          white-space: nowrap;
        }

        /* ── DATA TABLE ── */
        .rm-table { width: 100%; border-collapse: collapse; }
        .rm-table thead tr { border-bottom: 1px solid var(--border); }
        .rm-table th {
          padding: 9px 18px; font-size: 10.5px; font-weight: 500;
          letter-spacing: .08em; text-transform: uppercase;
          color: var(--muted); text-align: left; background: #FAFAF9;
          white-space: nowrap;
        }
        .rm-table tbody tr {
          border-bottom: 1px solid var(--border);
          transition: background .1s;
        }
        .rm-table tbody tr:last-child { border-bottom: none; }
        .rm-table tbody tr:hover { background: rgba(201,168,76,.04); }
        .rm-table td { padding: 13px 18px; vertical-align: middle; }

        .rm-cell-name {
          font-family: 'Fraunces', serif;
          font-size: 14px; font-weight: 600; color: var(--gold);
        }
        .rm-cell-build { font-size: 13px; color: var(--navy); }
        .rm-cell-build span { color: var(--muted); font-size: 11.5px; }
        .rm-cell-cap { font-size: 13px; color: var(--navy); }
        .rm-cell-price { font-size: 13px; font-weight: 500; color: var(--navy); }
        .rm-cell-fac { display: flex; flex-wrap: wrap; gap: 4px; }
        .rm-fac-tag {
          font-size: 10.5px; color: var(--muted);
          border: 1px solid var(--border); border-radius: 4px;
          padding: 1px 7px; background: #F9F8F6;
        }

        /* ── STATUS BADGE ── */
        .rm-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px; border-radius: 100px;
          font-size: 11.5px; font-weight: 500; white-space: nowrap;
        }
        .rm-badge::before {
          content: ''; width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
        }
        .rm-badge--green  { background: rgba(34,197,94,.1);  color: #16a34a; border: 1px solid rgba(34,197,94,.2);  }
        .rm-badge--green::before  { background: #22c55e; }
        .rm-badge--red    { background: rgba(239,68,68,.09); color: #b91c1c; border: 1px solid rgba(239,68,68,.18); }
        .rm-badge--red::before    { background: #ef4444; }
        .rm-badge--amber  { background: rgba(217,119,6,.1);  color: #92400e; border: 1px solid rgba(217,119,6,.2);  }
        .rm-badge--amber::before  { background: #f59e0b; }

        /* ── DELETE BTN ── */
        .rm-btn-del {
          display: flex; align-items: center; gap: 5px;
          padding: 5px 11px; border-radius: 6px; border: none;
          background: transparent; cursor: pointer; font-family: 'DM Sans', sans-serif;
          font-size: 12px; color: var(--muted);
          transition: background .15s, color .15s;
        }
        .rm-btn-del:hover {
          background: rgba(239,68,68,.09);
          color: #b91c1c;
        }
        .rm-btn-del:hover svg { stroke: #b91c1c; }

        /* ── EMPTY / LOADING ── */
        .rm-empty {
          padding: 56px 20px; text-align: center;
        }
        .rm-empty__icon {
          width: 44px; height: 44px; border-radius: 10px;
          background: #F5F3EF; display: flex; align-items: center;
          justify-content: center; margin: 0 auto 14px; color: var(--muted);
        }
        .rm-empty__title {
          font-family: 'Fraunces', serif;
          font-size: 16px; font-weight: 600; color: var(--navy); margin-bottom: 5px;
        }
        .rm-empty__sub { font-size: 13px; color: var(--muted); }

        /* ── SKELETON ── */
        .rm-sk {
          display: inline-block; border-radius: 4px;
          background: linear-gradient(90deg, #F0EDE8 25%, #E8E4DE 50%, #F0EDE8 75%);
          background-size: 400% 100%;
          animation: rmShimmer 1.4s ease infinite;
        }
        @keyframes rmShimmer {
          0%   { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }

        /* ── MODAL OVERLAY ── */
        .rm-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(13,27,42,.55);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          backdrop-filter: blur(3px);
        }
        .rm-modal {
          background: var(--white); border-radius: 16px;
          padding: 32px 28px; max-width: 380px; width: 100%;
          border: 1px solid var(--border);
          box-shadow: 0 24px 60px rgba(13,27,42,.18);
          animation: rmModalIn .2s ease;
        }
        @keyframes rmModalIn {
          from { opacity: 0; transform: scale(.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1)  translateY(0); }
        }
        .rm-modal__icon-wrap {
          width: 44px; height: 44px; border-radius: 10px;
          background: rgba(239,68,68,.08); display: flex; align-items: center;
          justify-content: center; margin-bottom: 16px; color: #ef4444;
        }
        .rm-modal__title {
          font-family: 'Fraunces', serif;
          font-size: 19px; font-weight: 700; color: var(--navy); margin-bottom: 10px;
        }
        .rm-modal__desc { font-size: 13.5px; color: #4A6580; line-height: 1.65; margin-bottom: 24px; }
        .rm-modal__desc strong { color: var(--navy); }
        .rm-modal__actions { display: flex; gap: 10px; }
        .rm-btn-cancel {
          flex: 1; padding: 10px;
          border: 1px solid var(--border); border-radius: 8px;
          background: transparent; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 13.5px;
          color: var(--navy); transition: background .15s;
        }
        .rm-btn-cancel:hover { background: #F5F3EF; }
        .rm-btn-delete-confirm {
          flex: 1; padding: 10px;
          background: #ef4444; border: none; border-radius: 8px; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 500;
          color: #fff; transition: background .15s;
        }
        .rm-btn-delete-confirm:hover { background: #dc2626; }
        .rm-btn-delete-confirm:disabled { opacity: .6; cursor: not-allowed; }

        /* ── GLOBAL TOAST ── */
        .rm-toast {
          position: fixed; bottom: 28px; right: 28px; z-index: 300;
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px; border-radius: 10px;
          font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 400;
          box-shadow: 0 8px 28px rgba(13,27,42,.15);
          animation: rmToastIn .25s ease;
          max-width: 340px;
        }
        @keyframes rmToastIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rm-toast--success { background: #fff; color: #15803d; border: 1px solid rgba(34,197,94,.25); }
        .rm-toast--error   { background: #fff; color: #b91c1c; border: 1px solid rgba(239,68,68,.25);  }
        .rm-toast__icon { display: flex; flex-shrink: 0; }
        .rm-toast__text { flex: 1; color: var(--navy); }
        .rm-toast__close {
          display: flex; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer; color: var(--muted); padding: 2px;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1100px) {
          .rm-grid { grid-template-columns: 1fr; }
          .rm-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .rm-sidebar { transform: translateX(-100%); }
          .rm-main { margin-left: 0; }
          .rm-body { padding: 18px 14px 40px; }
        }
        @media (max-width: 480px) {
          .rm-stats { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="rm-shell">

        {/* ─── Sidebar ────────────────────────────────────────────────────── */}
        <aside className="rm-sidebar">
          <div className="rm-brand">
            <DormifyLogoMark size={36} />
            <span className="rm-wordmark">Dorm<span>ify</span></span>
          </div>
          <div className="rm-role-chip">Quản trị viên</div>
          <nav className="rm-nav">
            <NavItem icon={Icons.chart}   label="Tổng quan"     href="/admin" />
            <NavItem icon={Icons.home}    label="Quản lý phòng" href="/admin/rooms" active />
            <NavItem icon={Icons.users}   label="Sinh viên"     href="/admin/students" />
            <NavItem icon={Icons.doc}     label="Hợp đồng"      href="/admin/contracts" />
            <NavItem icon={Icons.invoice} label="Hóa đơn"       href="/admin/invoices" />
            <NavItem href="/admin/profile" icon={Icons.users} label="Hồ sơ cá nhân" />
            <NavItem icon={Icons.wrench}  label="Bảo trì"       href="/admin/maintenance" badge={3} />
          </nav>
          <div className="rm-sidebar-footer">
            <button className="rm-btn-logout" type="button" onClick={handleLogout}>
              <span className="rm-nav-icon">{Icons.logout}</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* ─── Main ───────────────────────────────────────────────────────── */}
        <div className="rm-main">

          {/* Topbar */}
          <header className="rm-topbar">
            <div className="rm-tb-left">
              <div className="rm-tb-title">Quản lý Phòng</div>
              <div className="rm-tb-bread">Dormify · Admin · Phòng</div>
            </div>
            <div className="rm-tb-right">
              <button className="rm-tb-bell" type="button" aria-label="Thông báo">
                {Icons.bell}
                <span className="rm-tb-dot" />
              </button>
              <div className="rm-tb-avatar">A</div>
            </div>
          </header>

          {/* Body */}
          <main className="rm-body">

            {/* Stats */}
            <div className="rm-stats">
              <div className="rm-stat rm-stat--accent">
                <div className="rm-stat__lbl">Tổng số phòng</div>
                <div className="rm-stat__val">{loading ? "—" : rooms.length}</div>
                <div className="rm-stat__sub">Trong hệ thống</div>
              </div>
              <div className="rm-stat">
                <div className="rm-stat__lbl">Còn trống</div>
                <div className="rm-stat__val">{loading ? "—" : countByStatus("AVAILABLE")}</div>
                <div className="rm-stat__sub">Sẵn sàng nhận sinh viên</div>
              </div>
              <div className="rm-stat">
                <div className="rm-stat__lbl">Đã đầy</div>
                <div className="rm-stat__val">{loading ? "—" : countByStatus("FULL")}</div>
                <div className="rm-stat__sub">Không còn chỗ trống</div>
              </div>
              <div className="rm-stat">
                <div className="rm-stat__lbl">Đang bảo trì</div>
                <div className="rm-stat__val">{loading ? "—" : countByStatus("MAINTENANCE")}</div>
                <div className="rm-stat__sub">Tạm ngừng hoạt động</div>
              </div>
            </div>

            {/* Grid: Form + Table */}
            <div className="rm-grid">

              {/* ─ Form ─ */}
              <div className="rm-panel">
                <div className="rm-panel__head">
                  <div className="rm-panel__title">Thêm phòng mới</div>
                  <div className="rm-panel__sub">Điền thông tin để tạo phòng trong hệ thống</div>
                </div>
                <div className="rm-panel__body">
                  <form onSubmit={handleSubmit}>
                    <div className="rm-form-rows">
                      <Field label="Tên phòng" hint="Ví dụ: A1-101">
                        <input
                          className="rm-input" required
                          name="name" value={formData.name}
                          placeholder="A1-101"
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </Field>

                      <div className="rm-form-grid2">
                        <Field label="Tòa nhà">
                          <input
                            className="rm-input" required
                            name="building" value={formData.building}
                            placeholder="VD: A1"
                            onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                          />
                        </Field>
                        <Field label="Tầng">
                          <input
                            className="rm-input" required type="number" min="1"
                            name="floor" value={formData.floor}
                            placeholder="1"
                            onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                          />
                        </Field>
                      </div>

                      <div className="rm-form-grid2">
                        <Field label="Sức chứa" hint="Số người">
                          <input
                            className="rm-input" required type="number" min="1"
                            name="capacity" value={formData.capacity}
                            placeholder="4"
                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                          />
                        </Field>
                        <Field label="Giá thuê" hint="VNĐ / tháng">
                          <input
                            className="rm-input" required type="number" min="0"
                            name="price" value={formData.price}
                            placeholder="500000"
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          />
                        </Field>
                      </div>

                      <Field label="Cơ sở vật chất" hint="Cách nhau bằng dấu phẩy">
                        <input
                          className="rm-input"
                          name="facilities" value={formData.facilities}
                          placeholder="Điều hòa, Máy lạnh, Tủ lạnh"
                          onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                        />
                      </Field>

                      <button className="rm-btn-submit" type="submit" disabled={submitting}>
                        {Icons.plus}
                        {submitting ? "Đang tạo…" : "Tạo phòng mới"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* ─ Table ─ */}
              <div className="rm-panel">
                <div className="rm-table-head">
                  <div className="rm-table-head-l">
                    <div className="rm-panel__title">Danh sách phòng</div>
                    {!loading && (
                      <div className="rm-panel__sub">{filtered.length} / {rooms.length} phòng</div>
                    )}
                  </div>
                  <div className="rm-table-head-r">
                    <span className="rm-count-badge">{loading ? "—" : rooms.length} phòng</span>
                    <select
                      className="rm-filter-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                    >
                      <option value="ALL">Tất cả</option>
                      <option value="AVAILABLE">Còn trống</option>
                      <option value="FULL">Đã đầy</option>
                      <option value="MAINTENANCE">Bảo trì</option>
                    </select>
                    <div className="rm-search-wrap">
                      <span className="rm-search-ic">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </span>
                      <input
                        type="text" className="rm-search"
                        placeholder="Tìm tên, tòa nhà…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table className="rm-table">
                    <thead>
                      <tr>
                        <th>Phòng</th>
                        <th>Tòa / Tầng</th>
                        <th>Sức chứa</th>
                        <th>Giá / tháng</th>
                        <th>Tiện nghi</th>
                        <th>Trạng thái</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        [1,2,3,4].map((i) => (
                          <tr key={i}>
                            <td><span className="rm-sk" style={{ width: 64,  height: 14 }} /></td>
                            <td><span className="rm-sk" style={{ width: 80,  height: 14 }} /></td>
                            <td><span className="rm-sk" style={{ width: 48,  height: 14 }} /></td>
                            <td><span className="rm-sk" style={{ width: 90,  height: 14 }} /></td>
                            <td><span className="rm-sk" style={{ width: 120, height: 14 }} /></td>
                            <td><span className="rm-sk" style={{ width: 70,  height: 20, borderRadius: 100 }} /></td>
                            <td></td>
                          </tr>
                        ))
                      ) : filtered.length > 0 ? (
                        filtered.map((room) => (
                          <tr key={room._id}>
                            <td className="rm-cell-name">{room.name}</td>
                            <td className="rm-cell-build">
                              {room.building} <span>· Tầng {room.floor}</span>
                            </td>
                            <td className="rm-cell-cap">
                              {room.currentOccupancy} <span style={{ color: "var(--muted)", fontSize: 12 }}>/ {room.capacity}</span>
                            </td>
                            <td className="rm-cell-price">
                              {room.price.toLocaleString("vi-VN")}
                              <span style={{ color: "var(--muted)", fontSize: 11, fontWeight: 400 }}>đ</span>
                            </td>
                            <td>
                              <div className="rm-cell-fac">
                                {(room.facilities ?? []).slice(0, 2).map((f) => (
                                  <span key={f} className="rm-fac-tag">{f}</span>
                                ))}
                                {(room.facilities ?? []).length > 2 && (
                                  <span className="rm-fac-tag">+{room.facilities!.length - 2}</span>
                                )}
                              </div>
                            </td>
                            <td><StatusBadge status={room.status} /></td>
                            <td>
                              <button
                                className="rm-btn-del"
                                type="button"
                                onClick={() => setDeleteTarget(room)}
                                disabled={deletingId === room._id}
                              >
                                {Icons.trash}
                                Xóa
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7}>
                            <div className="rm-empty">
                              <div className="rm-empty__icon">{Icons.home}</div>
                              <div className="rm-empty__title">
                                {search || statusFilter !== "ALL" ? "Không tìm thấy kết quả" : "Chưa có phòng nào"}
                              </div>
                              <div className="rm-empty__sub">
                                {search || statusFilter !== "ALL"
                                  ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
                                  : "Hãy thêm phòng đầu tiên bằng form bên trái."}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* ─── Delete Modal ───────────────────────────────────────────────── */}
      {deleteTarget && (
        <DeleteModal
          room={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={deletingId === deleteTarget._id}
        />
      )}

      {/* ─── Global Toast ────────────────────────────────────────────────── */}
      {toast && (
        <Toast
          type={toast.type}
          text={toast.text}
          onClose={() => setToast(null)}
        />
      )}
    </RoleGuard>
  );
}