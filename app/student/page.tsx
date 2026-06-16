"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RoleGuard from "../components/RoleGuard";
import NotificationBell from "../components/NotificationBell";
// ─── Types ────────────────────────────────────────────────────────────────────
interface Profile {
  fullName: string;
  mssv?: string;
  email: string;
  role: string;
  avatar?: string; // Đã thêm trường avatar
  room?: {
    name: string;
    building: string;
    floor: number;
    contractEnd?: string;
  };
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
function DormifyLogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 42 42" fill="none">
      <rect width="42" height="42" rx="10" fill="#1A2E42" />
      <rect x="10" y="8" width="4" height="26" rx="1" fill="#C9A84C" />
      <path
        d="M14 8 Q28 8 28 21 Q28 34 14 34"
        stroke="#C9A84C"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      <rect
        x="18"
        y="12"
        width="4"
        height="4"
        rx="1"
        fill="rgba(201,168,76,0.45)"
      />
      <rect
        x="18"
        y="19"
        width="4"
        height="4"
        rx="1"
        fill="rgba(201,168,76,0.45)"
      />
      <rect
        x="18"
        y="26"
        width="4"
        height="4"
        rx="1"
        fill="rgba(201,168,76,0.45)"
      />
      <line
        x1="10"
        y1="6"
        x2="26"
        y2="6"
        stroke="#C9A84C"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Initials Avatar ─────────────────────────────────────────────────────────
function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const initials = name
    .trim()
    .split(" ")
    .slice(-2)
    .map((w) => w[0].toUpperCase())
    .join("");
  return (
    <div
      className="st-avatar"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

// ─── Nav Item ────────────────────────────────────────────────────────────────
function NavItem({
  icon,
  label,
  active = false,
  href = "#",
  locked = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  href?: string;
  locked?: boolean;
}) {
  const content = (
    <>
      <span className="st-nav-icon">{icon}</span>
      <span className="st-nav-label">{label}</span>
      {locked && <span className="st-nav-lock">{Icons.lock}</span>}
    </>
  );

  if (locked) {
    return <div className={`st-nav-item st-nav-item--locked`}>{content}</div>;
  }

  return (
    <Link
      href={href}
      className={`st-nav-item ${active ? "st-nav-item--active" : ""}`}
    >
      {content}
    </Link>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({
  icon,
  title,
  desc,
  href,
  locked = false,
  color = "gold",
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  href?: string;
  locked?: boolean;
  color?: "gold" | "teal" | "rose" | "violet";
}) {
  const content = (
    <div
      className={`st-feat-card st-feat-card--${color} ${locked ? "st-feat-card--locked" : ""}`}
    >
      <div className="st-feat-icon">{icon}</div>
      <div className="st-feat-body">
        <div className="st-feat-title">{title}</div>
        <div className="st-feat-desc">{desc}</div>
      </div>
      {!locked && <span className="st-feat-arrow">{Icons.arrowRight}</span>}
      {locked && <span className="st-feat-soon">Sắp ra mắt</span>}
    </div>
  );
  return locked ? (
    <div>{content}</div>
  ) : (
    <Link href={href ?? "#"} style={{ textDecoration: "none" }}>
      {content}
    </Link>
  );
}

// ─── Activity Row ─────────────────────────────────────────────────────────────
function ActivityItem({
  icon,
  title,
  time,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  time: string;
  color: string;
}) {
  return (
    <div className="st-activity-item">
      <div className={`st-activity-dot st-activity-dot--${color}`}>{icon}</div>
      <div className="st-activity-content">
        <span className="st-activity-title">{title}</span>
        <span className="st-activity-time">{time}</span>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({
  w,
  h,
  r = 4,
}: {
  w: number | string;
  h: number;
  r?: number;
}) {
  return (
    <span
      className="st-sk"
      style={{ width: w, height: h, borderRadius: r, display: "inline-block" }}
    />
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icons = {
  home: (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  ),
  search: (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  ),
  doc: (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  invoice: (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  ),
  wrench: (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <circle cx="12" cy="12" r="3" strokeWidth={1.8} />
    </svg>
  ),
  user: (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  logout: (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  ),
  bell: (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  ),
  lock: (
    <svg
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  ),
  arrowRight: (
    <svg
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  ),
  building: (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  ),
  calendar: (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  ),
  check: (
    <svg
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M5 13l4 4L19 7"
      />
    </svg>
  ),
  info: (
    <svg
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  coin: (
    <svg
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08-.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  globe: (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" strokeWidth={1.8} />
      <path
        d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"
        strokeWidth={1.8}
      />
    </svg>
  ),
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3001/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setProfile(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const firstName = profile?.fullName?.split(" ").pop() ?? "bạn";

  return (
    <RoleGuard allowedRoles={["STUDENT"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;1,9..144,400&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --navy:     #0D1B2A;
          --navy-mid: #1A2E42;
          --navy-lt:  #243B55;
          --gold:     #C9A84C;
          --gold-dim: rgba(201,168,76,0.15);
          --gold-b:   rgba(201,168,76,0.25);
          --cream:    #FAF7F0;
          --white:    #ffffff;
          --muted:    #8A9BAD;
          --border:   rgba(13,27,42,0.09);
          --bg:       #F2EFE9;
          --sidebar-w: 240px;
        }

        .st-shell {
          display: flex; min-height: 100vh;
          background: var(--bg);
          font-family: 'DM Sans', sans-serif;
        }

        /* ── SIDEBAR ── */
        .st-sidebar {
          width: var(--sidebar-w); flex-shrink: 0;
          background: var(--navy); min-height: 100vh;
          position: fixed; top: 0; left: 0; bottom: 0;
          border-right: 1px solid var(--gold-b);
          display: flex; flex-direction: column; z-index: 40;
        }
        .st-brand {
          padding: 22px 18px 18px;
          display: flex; align-items: center; gap: 11px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .st-brand:hover { opacity: 0.8; }
        .st-wordmark {
          font-family: 'Fraunces', serif;
          font-size: 20px; font-weight: 600; color: #fff;
        }
        .st-wordmark span { color: var(--gold); }

        /* sidebar profile */
        .st-sb-profile {
          padding: 20px 18px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; gap: 12px;
        }
        .st-avatar {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--gold) 0%, #E2B96A 100%);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Fraunces', serif; font-weight: 700;
          color: var(--navy); flex-shrink: 0; letter-spacing: -0.5px;
        }
        .st-sb-profile-name {
          font-size: 13px; font-weight: 500; color: #fff;
          line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .st-sb-profile-role {
          font-size: 11px; color: rgba(255,255,255,0.35);
          margin-top: 2px;
        }

        .st-sb-section-label {
          padding: 14px 18px 4px;
          font-size: 10px; font-weight: 500; letter-spacing: 0.12em;
          text-transform: uppercase; color: rgba(255,255,255,0.25);
        }
        .st-nav { padding: 4px 10px 10px; display: flex; flex-direction: column; gap: 2px; }
        .st-nav-item {
          display: flex; align-items: center; gap: 11px;
          padding: 9px 11px; border-radius: 8px;
          text-decoration: none; transition: background 0.15s; cursor: pointer;
        }
        .st-nav-item:hover { background: rgba(255,255,255,0.05); }
        .st-nav-icon { color: var(--muted); flex-shrink: 0; display: flex; }
        .st-nav-label { font-size: 13px; font-weight: 400; color: rgba(255,255,255,0.5); flex: 1; }
        .st-nav-lock { color: rgba(255,255,255,0.2); display: flex; }
        .st-nav-item--active { background: var(--gold-dim) !important; }
        .st-nav-item--active .st-nav-label { color: var(--gold) !important; font-weight: 500; }
        .st-nav-item--active .st-nav-icon  { color: var(--gold) !important; }
        .st-nav-item--locked { cursor: default; opacity: 0.5; }
        .st-nav-item--locked:hover { background: transparent !important; }

        .st-sb-footer { padding: 14px 10px; border-top: 1px solid rgba(255,255,255,0.06); margin-top: auto; display: flex; flex-direction: column; gap: 4px;}
        .st-btn-action {
          display: flex; align-items: center; gap: 11px;
          padding: 9px 11px; border-radius: 8px; border: none;
          background: transparent; cursor: pointer; width: 100%; transition: background 0.15s; text-decoration: none;
        }
        .st-btn-action--home:hover { background: rgba(255,255,255,0.05); }
        .st-btn-action--home .st-nav-icon { color: rgba(255,255,255,0.5); }
        .st-btn-action--home span:last-child { font-size: 13px; color: rgba(255,255,255,0.7); }
        .st-btn-action--home:hover span:last-child { color: var(--white); }

        .st-btn-action--logout:hover { background: rgba(220,50,50,0.1); }
        .st-btn-action--logout .st-nav-icon { color: rgba(240,80,80,0.65); }
        .st-btn-action--logout span:last-child { font-size: 13px; color: rgba(240,80,80,0.75); }

        /* ── MAIN ── */
        .st-main { margin-left: var(--sidebar-w); flex: 1; display: flex; flex-direction: column; }

        /* ── TOPBAR ── */
        .st-topbar {
          background: var(--white); border-bottom: 1px solid var(--border);
          padding: 0 28px; height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 30;
        }
        .st-tb-left {}
        .st-tb-title {
          font-family: 'Fraunces', serif;
          font-size: 17px; font-weight: 600; color: var(--navy); letter-spacing: -0.2px;
        }
        .st-tb-sub { font-size: 11px; color: var(--muted); margin-top: 1px; }
        .st-tb-right { display: flex; align-items: center; gap: 10px; }
        .st-tb-bell {
          width: 34px; height: 34px; border-radius: 8px;
          border: 1px solid var(--border); background: transparent;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--muted); position: relative;
          transition: all 0.15s;
        }
        .st-tb-bell:hover { border-color: var(--gold); color: var(--gold); background: var(--gold-dim); }
        .st-bell-dot {
          position: absolute; top: 7px; right: 7px;
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--gold); border: 1.5px solid var(--white);
        }
        .st-tb-avatar-sm {
          width: 34px; height: 34px; border-radius: 9px;
          background: var(--navy); border: 1.5px solid var(--gold-b);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Fraunces', serif; font-size: 12px; font-weight: 600;
          color: var(--gold); cursor: pointer; text-decoration: none; overflow: hidden;
          transition: transform 0.15s, border-color 0.15s;
        }
        .st-tb-avatar-sm:hover {
          transform: scale(1.05); border-color: var(--gold);
        }

        /* ── PAGE BODY ── */
        .st-body { padding: 26px 28px 52px; }

        /* ── WELCOME BANNER ── */
        .st-welcome {
          background: var(--navy);
          border-radius: 16px;
          padding: 28px 32px;
          margin-bottom: 24px;
          display: flex; align-items: center; justify-content: space-between;
          position: relative; overflow: hidden;
          border: 1px solid var(--gold-b);
        }
        .st-welcome-bg {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 60% 80% at 100% 50%, rgba(201,168,76,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 30% 60% at 0% 100%, rgba(36,59,85,0.6) 0%, transparent 70%);
          pointer-events: none;
        }
        .st-welcome-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }
        .st-welcome-left { position: relative; z-index: 1; }
        .st-welcome-eyebrow {
          font-size: 11px; font-weight: 500; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--gold);
          margin-bottom: 8px; display: block;
        }
        .st-welcome-name {
          font-family: 'Fraunces', serif;
          font-size: clamp(22px, 3vw, 30px); font-weight: 700;
          color: var(--white); line-height: 1.2;
          letter-spacing: -0.5px; margin-bottom: 10px;
        }
        .st-welcome-name em { color: var(--gold); font-style: italic; }
        .st-welcome-sub {
          font-size: 13.5px; font-weight: 300;
          color: rgba(255,255,255,0.5); max-width: 380px; line-height: 1.6;
        }
        .st-welcome-right { position: relative; z-index: 1; }
        .st-room-card {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(201,168,76,0.25);
          border-radius: 12px; padding: 18px 22px;
          min-width: 220px;
        }
        .st-room-card-label {
          font-size: 10px; font-weight: 500; letter-spacing: 0.1em;
          text-transform: uppercase; color: rgba(255,255,255,0.35);
          margin-bottom: 10px;
        }
        .st-room-card-name {
          font-family: 'Fraunces', serif;
          font-size: 26px; font-weight: 700;
          color: var(--gold); letter-spacing: -0.5px; line-height: 1;
          margin-bottom: 8px;
        }
        .st-room-card-detail {
          font-size: 12.5px; color: rgba(255,255,255,0.5);
          display: flex; align-items: center; gap: 6px; margin-bottom: 4px;
        }
        .st-room-card-detail svg { width: 12px; height: 12px; stroke: var(--gold); opacity: 0.7; }
        .st-room-no-room {
          font-size: 13px; color: rgba(255,255,255,0.4);
          font-style: italic;
        }

        /* ── BODY GRID ── */
        .st-grid { display: grid; grid-template-columns: 260px 1fr; gap: 20px; }

        /* ── PANEL ── */
        .st-panel {
          background: var(--white); border: 1px solid var(--border);
          border-radius: 14px; overflow: hidden;
        }
        .st-panel-head {
          padding: 16px 20px; border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
        }
        .st-panel-title {
          font-family: 'Fraunces', serif;
          font-size: 15px; font-weight: 600; color: var(--navy); letter-spacing: -0.2px;
        }
        .st-panel-sub { font-size: 11.5px; color: var(--muted); margin-top: 2px; }
        .st-panel-body { padding: 18px 20px; }

        /* ── PROFILE LIST ── */
        .st-profile-rows { display: flex; flex-direction: column; gap: 14px; }
        .st-profile-row {}
        .st-prow-label {
          font-size: 10px; font-weight: 500; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--muted); margin-bottom: 3px;
        }
        .st-prow-value {
          font-size: 14px; font-weight: 500; color: var(--navy);
        }
        .st-prow-value--mono {
          font-size: 14px; font-weight: 600; color: var(--gold);
          font-variant-numeric: tabular-nums; letter-spacing: 0.02em;
        }
        .st-prow-value--email {
          font-size: 13px; color: #4A6580; word-break: break-all;
        }
        .st-status-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px; border-radius: 100px;
          font-size: 11.5px; font-weight: 500;
          background: rgba(34,197,94,0.1); color: #16a34a;
          border: 1px solid rgba(34,197,94,0.2);
        }
        .st-status-badge::before {
          content: ''; width: 5px; height: 5px; border-radius: 50%;
          background: #22c55e;
        }
        .st-profile-divider {
          height: 1px; background: var(--border); margin: 2px 0;
        }

        /* ── RIGHT COLUMN ── */
        .st-right { display: flex; flex-direction: column; gap: 20px; }

        /* ── FEATURE CARDS ── */
        .st-feats-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
          padding: 16px 18px;
        }
        .st-feat-card {
          border: 1px solid var(--border); border-radius: 12px;
          padding: 16px 18px;
          display: flex; flex-direction: column;
          gap: 10px; transition: all 0.2s; cursor: pointer;
          background: var(--white); text-decoration: none;
          position: relative; overflow: hidden;
        }
        .st-feat-card::before {
          content: ''; position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.25s ease;
        }
        .st-feat-card--gold::before { background: var(--gold); }
        .st-feat-card--teal::before { background: #0E9E85; }
        .st-feat-card--rose::before { background: #E05A6A; }
        .st-feat-card--violet::before { background: #7C5CBF; }
        .st-feat-card:not(.st-feat-card--locked):hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(13,27,42,0.08); }
        .st-feat-card:not(.st-feat-card--locked):hover::before { transform: scaleX(1); }
        .st-feat-card--locked { opacity: 0.55; cursor: default; }
        .st-feat-card--locked:hover { transform: none !important; box-shadow: none !important; }
        .st-feat-icon {
          width: 38px; height: 38px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .st-feat-card--gold    .st-feat-icon { background: rgba(201,168,76,0.12); color: var(--gold); }
        .st-feat-card--teal    .st-feat-icon { background: rgba(14,158,133,0.1); color: #0E9E85; }
        .st-feat-card--rose    .st-feat-icon { background: rgba(224,90,106,0.1); color: #E05A6A; }
        .st-feat-card--violet  .st-feat-icon { background: rgba(124,92,191,0.1); color: #7C5CBF; }
        .st-feat-body { flex: 1; }
        .st-feat-title {
          font-family: 'Fraunces', serif;
          font-size: 14px; font-weight: 600; color: var(--navy);
          margin-bottom: 5px; line-height: 1.3;
        }
        .st-feat-desc { font-size: 12px; color: var(--muted); line-height: 1.6; }
        .st-feat-arrow { display: flex; align-items: center; color: var(--muted); margin-top: auto; }
        .st-feat-soon {
          font-size: 10.5px; font-weight: 500; letter-spacing: 0.06em;
          padding: 2px 8px; border-radius: 100px;
          background: rgba(13,27,42,0.06); color: var(--muted);
          border: 1px solid var(--border);
          margin-top: auto; width: fit-content;
        }
        a .st-feat-card { display: flex; }

        /* ── ACTIVITY ── */
        .st-activity-list { display: flex; flex-direction: column; }
        .st-activity-item {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 12px 20px; border-bottom: 1px solid var(--border);
        }
        .st-activity-item:last-child { border-bottom: none; }
        .st-activity-dot {
          width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .st-activity-dot--green  { background: rgba(34,197,94,0.1); color: #16a34a; }
        .st-activity-dot--gold   { background: rgba(201,168,76,0.12); color: var(--gold); }
        .st-activity-dot--blue   { background: rgba(59,130,246,0.1); color: #3b82f6; }
        .st-activity-dot--muted  { background: rgba(13,27,42,0.06); color: var(--muted); }
        .st-activity-content { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .st-activity-title { font-size: 13px; font-weight: 400; color: var(--navy); }
        .st-activity-time { font-size: 11.5px; color: var(--muted); }

        /* ── NOTICE BANNER ── */
        .st-notice {
          margin: 0 18px 16px;
          padding: 12px 16px;
          border-radius: 10px;
          background: rgba(201,168,76,0.1);
          border: 1px solid rgba(201,168,76,0.25);
          display: flex; align-items: center; gap: 10px;
          font-size: 12.5px; color: #7A5E1A;
        }
        .st-notice svg { width: 15px; height: 15px; stroke: var(--gold); flex-shrink: 0; }

        /* ── SKELETON ── */
        .st-sk {
          background: linear-gradient(90deg, #EDE9E3 25%, #E4E0D8 50%, #EDE9E3 75%);
          background-size: 400% 100%;
          animation: stShimmer 1.4s ease infinite;
        }
        @keyframes stShimmer {
          0%   { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .st-grid { grid-template-columns: 1fr; }
          .st-welcome { flex-direction: column; align-items: flex-start; gap: 20px; }
          .st-room-card { min-width: unset; width: 100%; }
        }
        @media (max-width: 768px) {
          .st-sidebar { transform: translateX(-100%); }
          .st-main { margin-left: 0; }
          .st-body { padding: 16px 14px 40px; }
          .st-feats-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="st-shell">
        {/* ─── Sidebar ───────────────────────────────────────────────── */}
        <aside className="st-sidebar">
          <Link
            href="/"
            className="st-brand"
            style={{ textDecoration: "none" }}
          >
            <DormifyLogoMark size={36} />
            <span className="st-wordmark">
              Dorm<span>ify</span>
            </span>
          </Link>

          {/* Profile in sidebar */}
          <div className="st-sb-profile">
            {loading ? (
              <Skeleton w={36} h={36} r={10} />
            ) : profile?.avatar ? (
              <div
                className="st-avatar"
                style={{ padding: 0, overflow: "hidden" }}
              >
                <img
                  src={profile.avatar}
                  alt="Avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ) : (
              <Avatar name={profile?.fullName ?? "SV"} size={36} />
            )}
            <div style={{ minWidth: 0 }}>
              <div className="st-sb-profile-name">
                {loading ? (
                  <Skeleton w={100} h={13} />
                ) : (
                  (profile?.fullName ?? "Sinh viên")
                )}
              </div>
              <div className="st-sb-profile-role">
                {loading ? (
                  <Skeleton w={60} h={10} />
                ) : profile?.mssv ? (
                  `MSSV: ${profile.mssv}`
                ) : (
                  "Sinh viên"
                )}
              </div>
            </div>
          </div>

          <div className="st-sb-section-label">Dịch vụ</div>
          <nav className="st-nav">
            <NavItem
              icon={Icons.home}
              label="Tổng quan"
              active
              href="/student"
            />
            <NavItem
              icon={Icons.search}
              label="Tìm & Đặt phòng"
              href="/student/rooms"
            />
            <NavItem
              icon={Icons.doc}
              label="Hợp đồng điện tử"
              href="/student/contracts"
            />
            <NavItem
              icon={Icons.invoice}
              label="Hóa đơn"
              href="/student/invoices"
            />

            {/* ── ĐÃ THÊM MỤC HỒ SƠ CÁ NHÂN VÀO ĐÂY ── */}
            <NavItem
              icon={Icons.user}
              label="Hồ sơ cá nhân"
              href="/student/profile"
            />
            <NavItem
              icon={Icons.wrench}
              label="Yêu cầu sửa chữa"
              href="/student/maintenance"
            />
          </nav>

          <div className="st-sb-footer">
            <Link href="/" className="st-btn-action st-btn-action--home">
              <span className="st-nav-icon">{Icons.globe}</span>
              <span>Về trang chủ</span>
            </Link>
            <button
              className="st-btn-action st-btn-action--logout"
              onClick={handleLogout}
              type="button"
            >
              <span className="st-nav-icon">{Icons.logout}</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* ─── Main ──────────────────────────────────────────────────── */}
        <div className="st-main">
          {/* Topbar */}
          <header className="st-topbar">
            <div className="st-tb-left">
              <div className="st-tb-title">Không gian cá nhân</div>
              <div className="st-tb-sub">Dormify · Sinh viên</div>
            </div>
            <div className="st-tb-right">
             <NotificationBell />
              {/* ── ĐÃ SỬA: BIẾN AVATAR THÀNH LINK VÀ HIỂN THỊ ẢNH AVATAR ── */}
              {loading ? (
                <Skeleton w={34} h={34} r={9} />
              ) : profile?.avatar ? (
                <Link
                  href="/student/profile"
                  className="st-tb-avatar-sm"
                  style={{ padding: 0 }}
                  title="Hồ sơ cá nhân"
                >
                  <img
                    src={profile.avatar}
                    alt="Avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Link>
              ) : (
                <Link
                  href="/student/profile"
                  className="st-tb-avatar-sm"
                  title="Hồ sơ cá nhân"
                >
                  {(profile?.fullName ?? "SV")
                    .trim()
                    .split(" ")
                    .pop()?.[0]
                    ?.toUpperCase() ?? "S"}
                </Link>
              )}
            </div>
          </header>

          {/* Body */}
          <main className="st-body">
            {/* Welcome Banner */}
            <div className="st-welcome">
              <div className="st-welcome-bg" />
              <div className="st-welcome-grid" />
              <div className="st-welcome-left">
                <span className="st-welcome-eyebrow">Chào mừng trở lại</span>
                <div className="st-welcome-name">
                  {loading ? (
                    <Skeleton w={220} h={30} r={6} />
                  ) : (
                    <>
                      Xin chào, <em>{firstName}</em>!
                    </>
                  )}
                </div>
                <div className="st-welcome-sub">
                  Đây là không gian cá nhân của bạn tại Dormify — theo dõi phòng
                  ở, hóa đơn và các dịch vụ lưu trú ngay tại đây.
                </div>
              </div>
              <div className="st-welcome-right">
                <div className="st-room-card">
                  <div className="st-room-card-label">Phòng hiện tại</div>
                  {loading ? (
                    <>
                      <Skeleton w={80} h={26} r={4} />
                      <div style={{ marginTop: 10 }}>
                        <Skeleton w={140} h={12} r={3} />
                      </div>
                    </>
                  ) : profile?.room ? (
                    <>
                      <div className="st-room-card-name">
                        {profile.room.name}
                      </div>
                      <div className="st-room-card-detail">
                        {Icons.building} Tòa {profile.room.building} — Tầng{" "}
                        {profile.room.floor}
                      </div>
                      {profile.room.contractEnd && (
                        <div className="st-room-card-detail">
                          {Icons.calendar} Hết hạn: {profile.room.contractEnd}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="st-room-no-room">
                      Chưa có phòng — hãy tìm và đặt phòng của bạn.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Body Grid */}
            <div className="st-grid">
              {/* ─ Left: Profile ─ */}
              <div>
                <div className="st-panel">
                  <div className="st-panel-head">
                    <div>
                      <div className="st-panel-title">Thông tin cá nhân</div>
                      <div className="st-panel-sub">
                        Hồ sơ tài khoản của bạn
                      </div>
                    </div>
                  </div>
                  <div className="st-panel-body">
                    {loading ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 18,
                        }}
                      >
                        {[120, 90, 160, 80].map((w, i) => (
                          <div key={i}>
                            <Skeleton w={60} h={10} r={3} />
                            <div style={{ marginTop: 5 }}>
                              <Skeleton w={w} h={14} r={3} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : profile ? (
                      <div className="st-profile-rows">
                        <div className="st-profile-row">
                          <div className="st-prow-label">Họ và tên</div>
                          <div className="st-prow-value">
                            {profile.fullName}
                          </div>
                        </div>
                        <div className="st-profile-divider" />
                        <div className="st-profile-row">
                          <div className="st-prow-label">Mã số sinh viên</div>
                          <div className="st-prow-value--mono">
                            {profile.mssv || "—"}
                          </div>
                        </div>
                        <div className="st-profile-divider" />
                        <div className="st-profile-row">
                          <div className="st-prow-label">Email liên hệ</div>
                          <div className="st-prow-value--email">
                            {profile.email}
                          </div>
                        </div>
                        <div className="st-profile-divider" />
                        <div className="st-profile-row">
                          <div className="st-prow-label">
                            Trạng thái tài khoản
                          </div>
                          <div style={{ marginTop: 4 }}>
                            <span className="st-status-badge">
                              Đang hoạt động
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "24px 0",
                          fontSize: 13,
                          color: "var(--muted)",
                        }}
                      >
                        Không thể tải hồ sơ.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ─ Right ─ */}
              <div className="st-right">
                {/* Feature Cards */}
                <div className="st-panel">
                  <div className="st-panel-head">
                    <div>
                      <div className="st-panel-title">Dịch vụ lưu trú</div>
                      <div className="st-panel-sub">
                        Các tính năng dành cho bạn
                      </div>
                    </div>
                  </div>

                  {!profile?.room && !loading && (
                    <div className="st-notice">
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Bạn chưa có phòng. Hãy tìm và gửi yêu cầu đặt phòng để bắt
                      đầu lưu trú.
                    </div>
                  )}

                  <div className="st-feats-grid">
                    <FeatureCard
                      icon={Icons.search}
                      title="Tìm & Đặt phòng"
                      color="gold"
                      desc="Xem phòng trống, kiểm tra tiện nghi và gửi yêu cầu lưu trú trực tuyến."
                      href="/student/rooms"
                    />
                    <FeatureCard
                      icon={Icons.doc}
                      title="Hợp đồng điện tử"
                      color="teal"
                      desc="Xem hợp đồng thuê phòng, thời hạn lưu trú và thực hiện gia hạn."
                      href="/student/contracts"
                    />
                    <FeatureCard
                      icon={Icons.invoice}
                      title="Hóa đơn điện nước"
                      color="violet"
                      desc="Theo dõi chi phí phòng, điện nước và lịch sử thanh toán hàng tháng."
                      href="/student/invoices"
                    />
                    <FeatureCard
                      icon={Icons.wrench}
                      title="Yêu cầu sửa chữa"
                      color="rose"
                      desc="Phản ánh hỏng hóc thiết bị, điện, nước để ban quản lý xử lý kịp thời."
                      href="/student/maintenance"
                    />
                  </div>
                </div>

                {/* Activity */}
                <div className="st-panel">
                  <div className="st-panel-head">
                    <div>
                      <div className="st-panel-title">Hoạt động gần đây</div>
                      <div className="st-panel-sub">
                        Lịch sử tương tác của bạn
                      </div>
                    </div>
                  </div>
                  <div className="st-activity-list">
                    <ActivityItem
                      icon={Icons.check}
                      color="green"
                      title="Tài khoản đã được kích hoạt thành công"
                      time="Hôm nay"
                    />
                    <ActivityItem
                      icon={Icons.info}
                      color="blue"
                      title="Hồ sơ sinh viên đã được xác minh"
                      time="Hôm nay"
                    />

                    {/* Chỉ báo "Chưa có phòng" nếu sinh viên thực sự chưa có phòng */}
                    {!profile?.room && !loading && (
                      <ActivityItem
                        icon={Icons.building}
                        color="muted"
                        title="Chưa có phòng — tìm và đặt phòng để bắt đầu"
                        time="—"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
