"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import RoleGuard from "../components/RoleGuard";
import NotificationBell from "../components/NotificationBell";
import { ToastProvider } from "../components/ToastProvider";
import { ConfirmProvider } from "../components/ConfirmProvider";
import { apiClient } from "../utils/apiClient";
import { clearToken } from "../utils/auth";

interface StaffProfile {
  fullName: string;
  avatar?: string;
}

// Khu vực làm việc của NHÂN VIÊN BẢO TRÌ — layout tối giản: topbar + nội dung
export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    apiClient.get("/users/profile").then(async (res) => {
      if (res.ok) setProfile(await res.json());
    }).catch(() => {});
  }, []);

  // Đóng menu avatar khi bấm ra ngoài
  useEffect(() => {
    if (!avatarMenuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [avatarMenuOpen]);

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
        .sf-brand-name { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 17px; font-weight: 700; color: #fff; }
        .sf-brand-role { font-size: 10.5px; color: rgba(255,255,255,0.55); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }
        .sf-topbar-right { display: flex; align-items: center; gap: 10px; }
        .sf-nav { display: flex; align-items: center; gap: 6px; }
        .sf-nav-item { display: inline-flex; align-items: center; gap: 7px; padding: 9px 15px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.6); text-decoration: none; transition: all .15s; border: 1px solid transparent; }
        .sf-nav-item:hover { color: #fff; background: rgba(255,255,255,0.06); }
        .sf-nav-item--active { color: #C9A84C; background: rgba(201,168,76,0.12); border-color: rgba(201,168,76,0.3); }
        .sf-main { max-width: 1020px; margin: 0 auto; padding: 28px 24px 56px; }

        /* Avatar + menu thả xuống (Hồ sơ / Đổi mật khẩu / Đăng xuất) — đồng bộ với Admin/Student */
        .avatar-menu-wrap { position: relative; }
        .sf-avatar { width: 36px; height: 36px; border-radius: 9px; background: #0D1B2A; display: flex; align-items: center; justify-content: center; font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 14px; font-weight: 600; color: #C9A84C; cursor: pointer; border: 1.5px solid rgba(201,168,76,0.35); transition: transform 0.1s; overflow: hidden; }
        .sf-avatar:hover { transform: scale(1.05); border-color: #C9A84C; }
        .avatar-menu { position: absolute; top: calc(100% + 8px); right: 0; min-width: 200px; background: #fff; border: 1px solid rgba(13,27,42,0.09); border-radius: 12px; box-shadow: 0 12px 32px rgba(13,27,42,0.12); padding: 6px; z-index: 50; }
        .avatar-menu__item { width: 100%; display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 8px; border: none; background: transparent; cursor: pointer; text-align: left; font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: #0D1B2A; text-decoration: none; transition: background 0.15s; }
        .avatar-menu__item:hover { background: rgba(13,27,42,0.05); }
        .avatar-menu__item svg { flex-shrink: 0; color: #8A9BAD; }
        .avatar-menu__item--logout { color: #dc2626; }
        .avatar-menu__item--logout svg { color: #dc2626; }
        .avatar-menu__item--logout:hover { background: rgba(220,38,38,0.07); }
        .avatar-menu__divider { height: 1px; background: rgba(13,27,42,0.09); margin: 5px 6px; }
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
            <div className="avatar-menu-wrap" ref={avatarMenuRef}>
              <div className="sf-avatar" title="Tài khoản" onClick={() => setAvatarMenuOpen((v) => !v)}>
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : "N"
                )}
              </div>
              {avatarMenuOpen && (
                <div className="avatar-menu">
                  <button
                    type="button"
                    className="avatar-menu__item"
                    onClick={() => { setAvatarMenuOpen(false); router.push("/staff/profile"); }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Hồ sơ cá nhân
                  </button>
                  <button
                    type="button"
                    className="avatar-menu__item"
                    onClick={() => { setAvatarMenuOpen(false); router.push("/staff/profile/change-password"); }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.5 12l1.8 1.8L15 10" />
                    </svg>
                    Đổi mật khẩu
                  </button>
                  <div className="avatar-menu__divider" />
                  <button type="button" className="avatar-menu__item avatar-menu__item--logout" onClick={handleLogout}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="sf-main">{children}</main>
      </div>
      </ConfirmProvider>
      </ToastProvider>
    </RoleGuard>
  );
}
