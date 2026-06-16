"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RoleGuard from "../../components/RoleGuard";
import NotificationBell from "../../components/NotificationBell";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Invoice {
  _id: string;
  month: number;
  year: number;
  roomFee: number;
  electricityFee: number;
  waterFee: number;
  totalAmount: number;
  status: "PENDING" | "PAID" | "OVERDUE";
  createdAt: string;
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
const I = {
  home:    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  search:  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  doc:     <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  invoice: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  wrench:  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" strokeWidth={1.8} /></svg>,
  logout:  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  lock:    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  bolt:    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  water:   <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16a4 4 0 100-8 4 4 0 000 8z" /></svg>,
  building:<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
};

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<Invoice["status"], { label: string; color: string; bg: string; border: string }> = {
  PAID:    { label: "Đã thanh toán",   color: "#16a34a", bg: "rgba(34,197,94,.1)",  border: "rgba(34,197,94,.2)"  },
  PENDING: { label: "Chưa thanh toán", color: "#b45309", bg: "rgba(245,158,11,.1)", border: "rgba(245,158,11,.22)" },
  OVERDUE: { label: "Quá hạn",         color: "#dc2626", bg: "rgba(239,68,68,.1)",  border: "rgba(239,68,68,.2)"  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

const MONTH_NAMES_SHORT = ["", "Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"];

// ─── Nav Item ─────────────────────────────────────────────────────────────────
function NavItem({ icon, label, active = false, href = "#", locked = false }: {
  icon: React.ReactNode; label: string; active?: boolean; href?: string; locked?: boolean;
}) {
  return (
    <a href={locked ? undefined : href} className={`iv-nav-item ${active ? "iv-nav-item--active" : ""} ${locked ? "iv-nav-item--locked" : ""}`}>
      <span className="iv-nav-icon">{icon}</span>
      <span className="iv-nav-label">{label}</span>
      {locked && <span className="iv-nav-lock">{I.lock}</span>}
    </a>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonInvoiceCard() {
  return (
    <div className="iv-card">
      <div className="iv-header">
        <span className="iv-sk" style={{ width: 160, height: 20 }} />
        <span className="iv-sk" style={{ width: 100, height: 22, borderRadius: 100 }} />
      </div>
      <div className="iv-details">
        <span className="iv-sk" style={{ width: "100%", height: 16 }} />
        <span className="iv-sk" style={{ width: "100%", height: 16 }} />
        <span className="iv-sk" style={{ width: "100%", height: 16 }} />
      </div>
      <span className="iv-sk" style={{ width: "100%", height: 56, borderRadius: 12, display: "block", marginBottom: 20 }} />
      <span className="iv-sk" style={{ width: "100%", height: 46, borderRadius: 10, display: "block" }} />
    </div>
  );
}

// ─── Invoice Card ─────────────────────────────────────────────────────────────
function InvoiceCard({ inv, onPay }: { inv: Invoice; onPay: (id: string) => void }) {
  const s = STATUS_CFG[inv.status];
  const monthLabel = MONTH_NAMES_SHORT[inv.month] ?? `Tháng ${inv.month}`;

  return (
    <div className={`iv-card ${inv.status === "OVERDUE" ? "iv-card--overdue" : ""}`}>
      <div className="iv-header">
        <div className="iv-month">
          <span className="iv-month-icon">{I.invoice}</span>
          Kỳ thu: Tháng {inv.month}/{inv.year}
        </div>
        <span className="iv-status-badge" style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
          {s.label}
        </span>
      </div>

      <div className="iv-details">
        <div className="iv-row">
          <span className="iv-row-label">
            <span className="iv-row-icon iv-row-icon--room">{I.building}</span>
            Phí thuê phòng
          </span>
          <span className="iv-row-val">{formatCurrency(inv.roomFee)}</span>
        </div>
        <div className="iv-row">
          <span className="iv-row-label">
            <span className="iv-row-icon iv-row-icon--bolt">{I.bolt}</span>
            Tiền điện
          </span>
          <span className="iv-row-val">{formatCurrency(inv.electricityFee)}</span>
        </div>
        <div className="iv-row">
          <span className="iv-row-label">
            <span className="iv-row-icon iv-row-icon--water">{I.water}</span>
            Tiền nước
          </span>
          <span className="iv-row-val">{formatCurrency(inv.waterFee)}</span>
        </div>
      </div>

      <div className="iv-total">
        <span className="iv-total-label">Tổng thanh toán</span>
        <span className="iv-total-amount">{formatCurrency(inv.totalAmount)}</span>
      </div>

      {inv.status !== "PAID" && (
        <button
          onClick={() => onPay(inv._id)}
          className={`iv-btn-pay ${inv.status === "OVERDUE" ? "iv-btn-pay--overdue" : "iv-btn-pay--active"}`}
        >
          {inv.status === "OVERDUE" ? "Thanh toán ngay (đã trễ hạn)" : "Thanh toán hóa đơn"}
        </button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading]   = useState(true);
  const [hasRoom, setHasRoom]   = useState(true);
  const [activeFilter, setActiveFilter] = useState<"ALL" | Invoice["status"]>("ALL");

  useEffect(() => {
    const fetchMyInvoices = async () => {
      try {
        const token = localStorage.getItem("token");

        // 1. Lấy thông tin cá nhân để biết sinh viên đang ở phòng nào (lấy _id của phòng)
        const profileRes = await fetch("http://localhost:3001/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profile = await profileRes.json();

        // Nếu sinh viên chưa có phòng (chưa đăng ký hoặc chưa được duyệt)
        if (!profile.room || !profile.room._id) {
          setHasRoom(false);
          setLoading(false);
          return;
        }

        // 2. Gọi API lấy danh sách hóa đơn theo ID phòng đó
        const invoiceRes = await fetch(`http://localhost:3001/api/invoices/room/${profile.room._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (invoiceRes.ok) {
          const data = await invoiceRes.json();
          setInvoices(data); // Backend trả về thẳng mảng
        }
      } catch (error) {
        console.error("Lỗi lấy hóa đơn:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyInvoices();
  }, []);

  const handlePayment = (invoiceId: string) => {
    window.location.href = `/student/payment/${invoiceId}`;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const countByStatus = (s: Invoice["status"]) => invoices.filter((i) => i.status === s).length;
  const totalUnpaid = invoices
    .filter((i) => i.status !== "PAID")
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const filtered = activeFilter === "ALL" ? invoices : invoices.filter((i) => i.status === activeFilter);

  return (
    <RoleGuard allowedRoles={["STUDENT"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;1,9..144,400&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --navy:     #0D1B2A;
          --navy-md:  #1A2E42;
          --gold:     #C9A84C;
          --gold-dim: rgba(201,168,76,0.15);
          --gold-b:   rgba(201,168,76,0.25);
          --white:    #ffffff;
          --muted:    #8A9BAD;
          --border:   rgba(13,27,42,0.09);
          --bg:       #F2EFE9;
          --sw:       240px;
        }

        .iv-shell { display:flex; min-height:100vh; background:var(--bg); font-family:'DM Sans',sans-serif; }

        /* ── SIDEBAR ── */
        .iv-sidebar { width:var(--sw); flex-shrink:0; background:var(--navy); min-height:100vh; position:fixed; top:0; left:0; bottom:0; border-right:1px solid var(--gold-b); display:flex; flex-direction:column; z-index:40; }
        .iv-brand { padding:22px 18px 18px; display:flex; align-items:center; gap:11px; border-bottom:1px solid rgba(255,255,255,.06); }
        .iv-wordmark { font-family:'Fraunces',serif; font-size:20px; font-weight:600; color:#fff; }
        .iv-wordmark span { color:var(--gold); }
        .iv-sb-section { padding:16px 18px 4px; font-size:10px; font-weight:500; letter-spacing:.12em; text-transform:uppercase; color:rgba(255,255,255,.25); }
        .iv-nav { padding:4px 10px 10px; display:flex; flex-direction:column; gap:2px; flex:1; }
        .iv-nav-item { display:flex; align-items:center; gap:11px; padding:9px 11px; border-radius:8px; text-decoration:none; transition:background .15s; }
        .iv-nav-item:hover { background:rgba(255,255,255,.05); }
        .iv-nav-icon  { color:var(--muted); flex-shrink:0; display:flex; }
        .iv-nav-label { font-size:13px; font-weight:400; color:rgba(255,255,255,.5); flex:1; }
        .iv-nav-lock  { color:rgba(255,255,255,.2); display:flex; }
        .iv-nav-item--active { background:var(--gold-dim) !important; }
        .iv-nav-item--active .iv-nav-label { color:var(--gold) !important; font-weight:500; }
        .iv-nav-item--active .iv-nav-icon  { color:var(--gold) !important; }
        .iv-nav-item--locked { cursor:default; opacity:.45; pointer-events:none; }
        .iv-sb-footer { padding:14px 10px; border-top:1px solid rgba(255,255,255,.06); }
        .iv-btn-logout { display:flex; align-items:center; gap:11px; padding:9px 11px; border-radius:8px; border:none; background:transparent; cursor:pointer; width:100%; transition:background .15s; }
        .iv-btn-logout:hover { background:rgba(220,50,50,.1); }
        .iv-btn-logout .iv-nav-icon { color:rgba(240,80,80,.65); }
        .iv-btn-logout span { font-size:13px; color:rgba(240,80,80,.75); }

        /* ── MAIN ── */
        .iv-main { margin-left:var(--sw); flex:1; display:flex; flex-direction:column; }

        /* ── TOPBAR ── */
        .iv-topbar { background:var(--white); border-bottom:1px solid var(--border); padding:0 28px; height:60px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:30; }
        .iv-tb-title { font-family:'Fraunces',serif; font-size:17px; font-weight:600; color:var(--navy); letter-spacing:-.2px; }
        .iv-tb-sub { font-size:11px; color:var(--muted); margin-top:1px; }

        /* ── BODY ── */
        .iv-body { padding:26px 28px 52px; }

        /* ── STATS ── */
        .iv-stats { display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:14px; margin-bottom:24px; max-width:920px; }
        .iv-stat { background:var(--white); border:1px solid var(--border); border-radius:11px; padding:16px 18px; transition:transform .15s, box-shadow .15s; }
        .iv-stat:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(13,27,42,.07); }
        .iv-stat--accent { background:var(--navy); border-color:var(--gold-b); }
        .iv-stat-label { font-size:10.5px; font-weight:500; letter-spacing:.09em; text-transform:uppercase; color:var(--muted); margin-bottom:8px; }
        .iv-stat--accent .iv-stat-label { color:rgba(255,255,255,.38); }
        .iv-stat-value { font-family:'Fraunces',serif; font-size:24px; font-weight:700; color:var(--navy); letter-spacing:-.6px; line-height:1; }
        .iv-stat--accent .iv-stat-value { color:var(--gold); }

        /* ── FILTER TOOLBAR ── */
        .iv-toolbar { display:flex; gap:6px; margin-bottom:20px; flex-wrap:wrap; max-width:920px; }
        .iv-filter-btn { padding:7px 14px; border-radius:8px; border:1px solid var(--border); background:var(--white); font-family:'DM Sans',sans-serif; font-size:12.5px; color:var(--muted); cursor:pointer; transition:all .15s; display:flex; align-items:center; gap:6px; }
        .iv-filter-btn:hover { border-color:var(--navy); color:var(--navy); }
        .iv-filter-btn--active { background:var(--navy); border-color:var(--navy); color:#fff; }
        .iv-fc { font-size:10.5px; font-weight:600; background:rgba(255,255,255,.18); padding:1px 6px; border-radius:100px; }
        .iv-filter-btn:not(.iv-filter-btn--active) .iv-fc { background:rgba(13,27,42,.07); color:var(--navy); }

        /* ── INVOICE LIST ── */
        .iv-list { display:grid; grid-template-columns:repeat(auto-fill, minmax(420px, 1fr)); gap:18px; align-items:start; max-width:920px; }

        /* ── INVOICE CARD ── */
        .iv-card { background:var(--white); border:1px solid var(--border); border-radius:16px; padding:24px; display:flex; flex-direction:column; position:relative; overflow:hidden; transition:transform .18s, box-shadow .18s; }
        .iv-card:hover { transform:translateY(-2px); box-shadow:0 10px 28px rgba(13,27,42,.07); }
        .iv-card--overdue { border-color:rgba(239,68,68,.3); }
        .iv-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; border-bottom:1px dashed var(--border); padding-bottom:20px; gap:10px; flex-wrap:wrap; }
        .iv-month { font-family:'Fraunces',serif; font-size:18px; font-weight:600; color:var(--navy); display:flex; align-items:center; gap:10px; }
        .iv-month-icon { color:var(--gold); display:flex; }
        .iv-status-badge { padding:4px 12px; border-radius:100px; font-size:11px; font-weight:600; white-space:nowrap; }

        .iv-details { display:flex; flex-direction:column; gap:12px; margin-bottom:24px; }
        .iv-row { display:flex; justify-content:space-between; align-items:center; font-size:14px; color:#4A6580; }
        .iv-row-label { display:flex; align-items:center; gap:9px; }
        .iv-row-icon { width:22px; height:22px; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .iv-row-icon--room { background:rgba(13,27,42,.06); color:var(--navy); }
        .iv-row-icon--bolt { background:rgba(217,119,6,.1); color:#d97706; }
        .iv-row-icon--water{ background:rgba(2,132,199,.1); color:#0284c7; }
        .iv-row-val { font-weight:500; color:var(--navy); font-variant-numeric:tabular-nums; }

        .iv-total { display:flex; justify-content:space-between; align-items:center; padding:16px 18px; background:#F9F8F6; border-radius:12px; margin-bottom:20px; }
        .iv-total-label { font-size:13.5px; color:var(--muted); }
        .iv-total-amount { font-family:'Fraunces',serif; font-size:23px; font-weight:700; color:var(--navy); letter-spacing:-.5px; }

        .iv-btn-pay { width:100%; padding:13px; border-radius:10px; font-family:'DM Sans',sans-serif; font-size:14.5px; font-weight:600; text-align:center; border:none; cursor:pointer; transition:all .18s; }
        .iv-btn-pay--active { background:var(--navy); color:var(--white); }
        .iv-btn-pay--active:hover { background:#1a334d; box-shadow:0 6px 18px rgba(13,27,42,.18); transform:translateY(-1px); }
        .iv-btn-pay--overdue { background:#dc2626; color:#fff; }
        .iv-btn-pay--overdue:hover { background:#b91c1c; box-shadow:0 6px 18px rgba(220,38,38,.22); transform:translateY(-1px); }

        /* ── EMPTY STATE ── */
        .iv-empty { text-align:center; padding:60px 24px; background:var(--white); border-radius:16px; border:1px solid var(--border); max-width:920px; }
        .iv-empty--dashed { border-style:dashed; }
        .iv-empty-icon { color:var(--muted); margin-bottom:14px; display:flex; justify-content:center; }
        .iv-empty-title { font-weight:600; font-size:16px; color:var(--navy); }
        .iv-empty-sub { font-size:13.5px; color:var(--muted); margin-top:6px; line-height:1.6; }
        .iv-empty-link { display:inline-flex; align-items:center; gap:7px; padding:10px 20px; background:var(--navy); color:#fff; border-radius:8px; text-decoration:none; font-size:13.5px; font-weight:500; margin-top:18px; transition:background .15s; }
        .iv-empty-link:hover { background:#1A2E42; }

        /* ── SKELETON ── */
        .iv-sk { display:inline-block; border-radius:4px; background:linear-gradient(90deg,#EDE9E3 25%,#E4E0D8 50%,#EDE9E3 75%); background-size:400% 100%; animation:ivShimmer 1.4s ease infinite; }
        @keyframes ivShimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }

        /* ── RESPONSIVE ── */
        @media (max-width:1024px) { .iv-stats { grid-template-columns:repeat(2,1fr); } }
        @media (max-width:768px)  { .iv-sidebar { transform:translateX(-100%); } .iv-main { margin-left:0; } .iv-body { padding:18px 14px 40px; } }
      `}</style>

      <div className="iv-shell">

        {/* ─── Sidebar ──────────────────────────────────────────────── */}
        <aside className="iv-sidebar">
          <div className="iv-brand">
            <DormifyLogoMark size={36} />
            <span className="iv-wordmark">Dorm<span>ify</span></span>
          </div>
          <div className="iv-sb-section">Dịch vụ</div>
          <nav className="iv-nav">
            <NavItem icon={I.home}    label="Tổng quan"        href="/student" />
            <NavItem icon={I.search}  label="Tìm & Đặt phòng" href="/student/rooms" />
            <NavItem icon={I.doc}     label="Hợp đồng"         locked />
            <NavItem icon={I.invoice} label="Hóa đơn"          href="/student/invoices" active />
            <NavItem icon={I.wrench}  label="Yêu cầu sửa chữa" href="/student/maintenance" />
          </nav>
          <div className="iv-sb-footer">
            <button className="iv-btn-logout" type="button" onClick={handleLogout}>
              <span className="iv-nav-icon">{I.logout}</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* ─── Main ─────────────────────────────────────────────────── */}
        <div className="iv-main">
          <header className="iv-topbar">
            <div>
              <div className="iv-tb-title">Hóa đơn điện nước</div>
              <div className="iv-tb-sub">Dormify · Sinh viên · Quản lý chi phí sinh hoạt</div>
            </div>
            <NotificationBell />
          </header>

          <main className="iv-body">

            {!loading && hasRoom && invoices.length > 0 && (
              <div className="iv-stats">
                <div className="iv-stat iv-stat--accent">
                  <div className="iv-stat-label">Tổng hóa đơn</div>
                  <div className="iv-stat-value">{invoices.length}</div>
                </div>
                <div className="iv-stat">
                  <div className="iv-stat-label">Chưa thanh toán</div>
                  <div className="iv-stat-value" style={{ color: "#b45309" }}>{countByStatus("PENDING")}</div>
                </div>
                <div className="iv-stat">
                  <div className="iv-stat-label">Quá hạn</div>
                  <div className="iv-stat-value" style={{ color: "#dc2626" }}>{countByStatus("OVERDUE")}</div>
                </div>
                <div className="iv-stat">
                  <div className="iv-stat-label">Cần thanh toán</div>
                  <div className="iv-stat-value" style={{ fontSize: 17 }}>{formatCurrency(totalUnpaid)}</div>
                </div>
              </div>
            )}

            {!loading && hasRoom && invoices.length > 0 && (
              <div className="iv-toolbar">
                {(["ALL", "PENDING", "OVERDUE", "PAID"] as const).map((f) => (
                  <button
                    key={f}
                    className={`iv-filter-btn ${activeFilter === f ? "iv-filter-btn--active" : ""}`}
                    onClick={() => setActiveFilter(f)}
                    type="button"
                  >
                    {f === "ALL" ? "Tất cả" :
                     f === "PENDING" ? "Chưa thanh toán" :
                     f === "OVERDUE" ? "Quá hạn" : "Đã thanh toán"}
                    <span className="iv-fc">
                      {f === "ALL" ? invoices.length : countByStatus(f as Invoice["status"])}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="iv-list">
                {[1, 2].map((i) => <SkeletonInvoiceCard key={i} />)}
              </div>
            ) : !hasRoom ? (
              <div className="iv-empty">
                <div className="iv-empty-title">Bạn chưa có phòng lưu trú</div>
                <div className="iv-empty-sub">Vui lòng đăng ký phòng để có thể nhận hóa đơn hàng tháng.</div>
                <Link href="/student/rooms" className="iv-empty-link">{I.search} Tìm phòng ngay</Link>
              </div>
            ) : invoices.length === 0 ? (
              <div className="iv-empty iv-empty--dashed">
                <div className="iv-empty-icon">{I.invoice}</div>
                <div className="iv-empty-title">Chưa có hóa đơn nào</div>
                <div className="iv-empty-sub">Tháng này phòng bạn chưa có thông báo thu tiền.</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="iv-empty">
                <div className="iv-empty-title">Không có hóa đơn nào ở trạng thái này</div>
                <div className="iv-empty-sub">Thử chọn bộ lọc khác để xem các hóa đơn còn lại.</div>
              </div>
            ) : (
              <div className="iv-list">
                {filtered.map((inv) => (
                  <InvoiceCard key={inv._id} inv={inv} onPay={handlePayment} />
                ))}
              </div>
            )}

          </main>
        </div>
      </div>
    </RoleGuard>
  );
}