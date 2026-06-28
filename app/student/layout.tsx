"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { io, Socket } from "socket.io-client";
import RoleGuard from "../components/RoleGuard";

interface Profile {
  fullName: string;
  mssv?: string;
  email: string;
  role: string;
  avatar?: string;
  room?: {
    name: string;
    building: string;
    floor: number;
    contractEnd?: string;
  };
}

// ─── Logo: dùng ảnh PNG thật thay vì SVG vẽ tay ─────────────────────────────
// Lưu ý: cần đặt file ảnh tại /public/Dormify.png trong project.
function DormifyLogoMark({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/Dormify.png"
      alt="Dormify Logo"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}

function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const initials = name.trim().split(" ").slice(-2).map((w) => w[0].toUpperCase()).join("");
  return <div className="st-avatar" style={{ width: size, height: size, fontSize: size * 0.35 }}>{initials}</div>;
}

function NavItem({ icon, label, active = false, href = "#", badge }: { icon: React.ReactNode; label: string; active?: boolean; href?: string; badge?: number; }) {
  return (
    <Link href={href} className={`st-nav-item ${active ? "st-nav-item--active" : ""}`}>
      <span className="st-nav-icon">{icon}</span>
      <span className="st-nav-label">{label}</span>
      {badge != null && badge > 0 && <span className="st-nav-badge">{badge}</span>}
    </Link>
  );
}

const Icons = {
  home: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  search: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  doc: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  invoice: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  bell: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  wrench: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <circle cx="12" cy="12" r="3" strokeWidth={1.8} />
    </svg>
  ),
  user: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  logout: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  globe: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={1.8} />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" strokeWidth={1.8} />
    </svg>
  ),
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const [profileRes, notificationsRes] = await Promise.all([
          fetch("http://localhost:3001/api/users/profile", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3001/api/notifications/me", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (profileRes.ok) {
          setProfile(await profileRes.json());
        }

        if (notificationsRes.ok) {
          const notifications = await notificationsRes.json();

          if (Array.isArray(notifications)) {
            setUnreadNotifications(notifications.filter((item) => !item.isRead).length);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    void loadStudentData();
  }, [pathname]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    socketRef.current = io("http://localhost:3001", {
      auth: { token },
    });

    socketRef.current.on("newNotification", () => {
      setUnreadNotifications((prev) => prev + 1);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

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
        .st-shell { display: flex; min-height: 100vh; background: var(--bg); font-family: 'DM Sans', sans-serif; }
        .st-sidebar { width: var(--sidebar-w); flex-shrink: 0; background: var(--navy); min-height: 100vh; position: fixed; top: 0; left: 0; bottom: 0; border-right: 1px solid var(--gold-b); display: flex; flex-direction: column; z-index: 40; }
        .st-brand { padding: 22px 18px 18px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.06); text-decoration: none; transition: opacity 0.2s; }
        .st-brand:hover { opacity: 0.8; }
        .logo-align-up { transform: translateY(-2px); }
        .text-align-down { transform: translateY(1px); display: inline-block; }
        .st-wordmark { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
        .st-wordmark span { color: var(--gold); }
        .st-sb-profile { padding: 20px 18px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; gap: 12px; }
        .st-avatar { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, var(--gold) 0%, #E2B96A) 100%; display: flex; align-items: center; justify-content: center; font-family: 'Fraunces', serif; font-weight: 700; color: var(--navy); flex-shrink: 0; letter-spacing: -0.5px; }
        .st-sb-profile-name { font-size: 13px; font-weight: 500; color: #fff; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .st-sb-profile-role { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 2px; }
        .st-sb-section-label { padding: 14px 18px 4px; font-size: 10px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.25); }
        .st-nav { padding: 4px 10px 10px; display: flex; flex-direction: column; gap: 2px; }
        .st-nav-item { display: flex; align-items: center; gap: 11px; padding: 9px 11px; border-radius: 8px; text-decoration: none; transition: background 0.15s; cursor: pointer; }
        .st-nav-item:hover { background: rgba(255,255,255,0.05); }
        .st-nav-icon { color: var(--muted); flex-shrink: 0; display: flex; }
        .st-nav-label { font-size: 13px; font-weight: 400; color: rgba(255,255,255,0.5); flex: 1; }
        .st-nav-badge { min-width: 20px; height: 20px; border-radius: 999px; padding: 0 6px; display: inline-flex; align-items: center; justify-content: center; background: #eab308; color: var(--navy); font-size: 11px; font-weight: 700; }
        .st-nav-item--active { background: var(--gold-dim) !important; }
        .st-nav-item--active .st-nav-label { color: var(--gold) !important; font-weight: 500; }
        .st-nav-item--active .st-nav-icon  { color: var(--gold) !important; }
        .st-sb-footer { padding: 14px 10px; border-top: 1px solid rgba(255,255,255,0.06); margin-top: auto; display: flex; flex-direction: column; gap: 4px; }
        .st-btn-action { display: flex; align-items: center; gap: 11px; padding: 9px 11px; border-radius: 8px; border: none; background: transparent; cursor: pointer; width: 100%; transition: background 0.15s; text-decoration: none; }
        .st-btn-action--home:hover { background: rgba(255,255,255,0.05); }
        .st-btn-action--home .st-nav-icon { color: rgba(255,255,255,0.5); }
        .st-btn-action--home span:last-child { font-size: 13px; color: rgba(255,255,255,0.7); }
        .st-btn-action--home:hover span:last-child { color: var(--white); }
        .st-btn-action--logout:hover { background: rgba(220,50,50,0.1); }
        .st-btn-action--logout .st-nav-icon { color: rgba(240,80,80,0.65); }
        .st-btn-action--logout span:last-child { font-size: 13px; color: rgba(240,80,80,0.75); }
        .st-main { margin-left: var(--sidebar-w); flex: 1; display: flex; flex-direction: column; }
        .st-body { padding: 26px 28px 52px; }
        .st-sk { background: linear-gradient(90deg, #EDE9E3 25%, #E4E0D8 50%, #EDE9E3 75%); background-size: 400% 100%; animation: stShimmer 1.4s ease infinite; }
        @keyframes stShimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }
      `}</style>

      <div className="st-shell">
        <aside className="st-sidebar">
          <Link href="/" className="st-brand">
            <DormifyLogoMark size={48} className="logo-align-up" />
            <span className="st-wordmark text-align-down">Dorm<span>ify</span></span>
          </Link>

          <div className="st-sb-profile">
            {loading ? (
              <span className="st-sk" style={{ width: 36, height: 36, borderRadius: 10, display: "inline-block" }} />
            ) : profile?.avatar ? (
              <div className="st-avatar" style={{ padding: 0, overflow: "hidden" }}>
                <img src={profile.avatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ) : (
              <Avatar name={profile?.fullName ?? "SV"} size={36} />
            )}
            <div style={{ minWidth: 0 }}>
              <div className="st-sb-profile-name">
                {loading ? <span className="st-sk" style={{ width: 100, height: 13, display: "inline-block" }} /> : (profile?.fullName ?? "Sinh viên")}
              </div>
              <div className="st-sb-profile-role">
                {loading ? <span className="st-sk" style={{ width: 60, height: 10, display: "inline-block" }} /> : (profile?.mssv ? `MSSV: ${profile.mssv}` : "Sinh viên")}
              </div>
            </div>
          </div>

          <div className="st-sb-section-label">Dịch vụ</div>
          <nav className="st-nav">
            <NavItem icon={Icons.home} label="Tổng quan" href="/student" active={pathname === "/student"} />
            <NavItem icon={Icons.search} label="Tìm & Đặt phòng" href="/student/rooms" active={pathname.startsWith("/student/rooms")} />
            <NavItem icon={Icons.doc} label="Hợp đồng điện tử" href="/student/contracts" active={pathname.startsWith("/student/contracts")} />
            <NavItem icon={Icons.invoice} label="Hóa đơn" href="/student/invoices" active={pathname.startsWith("/student/invoices")} />
            <NavItem icon={Icons.user} label="Hồ sơ cá nhân" href="/student/profile" active={pathname.startsWith("/student/profile")} />
            <NavItem icon={Icons.bell} label="Thông báo" href="/student/notifications" active={pathname.startsWith("/student/notifications")} badge={unreadNotifications} />
            <NavItem icon={Icons.wrench} label="Yêu cầu sửa chữa" href="/student/maintenance" active={pathname.startsWith("/student/maintenance")} />
          </nav>

          <div className="st-sb-footer">
            <Link href="/" className="st-btn-action st-btn-action--home">
              <span className="st-nav-icon">{Icons.globe}</span>
              <span>Về trang chủ</span>
            </Link>
            <button className="st-btn-action st-btn-action--logout" onClick={handleLogout} type="button">
              <span className="st-nav-icon">{Icons.logout}</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        <div className="st-main">
          {/* Đã bỏ thanh topbar (header) — không gian phía trên sidebar
             được dùng hết cho nội dung trang. Truy cập hồ sơ cá nhân
             qua mục "Hồ sơ cá nhân" ở sidebar bên trái. */}
          <main className="st-body">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
