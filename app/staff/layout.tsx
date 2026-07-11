"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import RoleGuard from "../components/RoleGuard";
import NotificationBell from "../components/NotificationBell";
import { ToastProvider } from "../components/ToastProvider";
import { ConfirmProvider } from "../components/ConfirmProvider";
import { clearToken } from "../utils/auth";

// Khu vực làm việc của NHÂN VIÊN BẢO TRÌ — layout tối giản: topbar + nội dung
export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const handleLogout = () => {
    clearToken();
    window.location.href = "/login";
  };

  return (
    <RoleGuard allowedRoles={["MAINTENANCE_STAFF"]}>
      <ToastProvider>
      <ConfirmProvider>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700&family=DM+Sans:wght@400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .sf-shell { min-height: 100vh; background: #F0EDE8; font-family: 'DM Sans', sans-serif; }
        .sf-topbar { position: sticky; top: 0; z-index: 50; background: #0D1B2A; border-bottom: 1px solid rgba(201,168,76,0.25); padding: 0 24px; height: 62px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .sf-brand { display: flex; align-items: center; gap: 11px; }
        .sf-brand-mark { width: 34px; height: 34px; border-radius: 8px; background: rgba(201,168,76,0.15); border: 1px solid rgba(201,168,76,0.35); color: #C9A84C; display: flex; align-items: center; justify-content: center; }
        .sf-brand-name { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; color: #fff; }
        .sf-brand-role { font-size: 10.5px; color: rgba(255,255,255,0.55); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }
        .sf-topbar-right { display: flex; align-items: center; gap: 10px; }
        .sf-nav { display: flex; align-items: center; gap: 6px; }
        .sf-nav-item { display: inline-flex; align-items: center; gap: 7px; padding: 9px 15px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.6); text-decoration: none; transition: all .15s; border: 1px solid transparent; }
        .sf-nav-item:hover { color: #fff; background: rgba(255,255,255,0.06); }
        .sf-nav-item--active { color: #C9A84C; background: rgba(201,168,76,0.12); border-color: rgba(201,168,76,0.3); }
        .sf-logout { display: inline-flex; align-items: center; gap: 7px; padding: 9px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: transparent; color: rgba(255,255,255,0.75); font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 600; cursor: pointer; transition: all .15s; }
        .sf-logout:hover { border-color: rgba(239,68,68,0.5); color: #f87171; }
        .sf-main { max-width: 1020px; margin: 0 auto; padding: 28px 24px 56px; }
      `}</style>

      <div className="sf-shell">
        <header className="sf-topbar">
          <Link href="/staff" className="sf-brand" style={{ textDecoration: "none" }}>
            <div className="sf-brand-mark">
              <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <circle cx="12" cy="12" r="3" strokeWidth={1.8} />
              </svg>
            </div>
            <div>
              <div className="sf-brand-name">Dormify</div>
              <div className="sf-brand-role">Nhân viên bảo trì</div>
            </div>
          </Link>
          <nav className="sf-nav">
            <Link href="/staff" className={`sf-nav-item ${pathname === "/staff" ? "sf-nav-item--active" : ""}`}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Công việc
            </Link>
            <Link href="/staff/profile" className={`sf-nav-item ${pathname.startsWith("/staff/profile") ? "sf-nav-item--active" : ""}`}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Hồ sơ
            </Link>
          </nav>
          <div className="sf-topbar-right">
            <NotificationBell />
            <button type="button" className="sf-logout" onClick={handleLogout}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Đăng xuất
            </button>
          </div>
        </header>
        <main className="sf-main">{children}</main>
      </div>
      </ConfirmProvider>
      </ToastProvider>
    </RoleGuard>
  );
}
