"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import RoleGuard from "../components/RoleGuard";
import NotificationBell from "../components/NotificationBell";
import { ToastProvider } from "../components/ToastProvider";
import { apiClient } from "../utils/apiClient";
import { clearToken } from "../utils/auth";
import { ConfirmProvider } from "../components/ConfirmProvider";

interface AdminProfile {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  cccd?: string;
  avatar?: string;
}

interface BookingSummary {
  status: string;
}

interface MaintenanceSummary {
  status: string;
}

// ─── Đã thay Logo bằng ảnh Dormify.png ───
function DormifyLogoMark({ size = 36 }: { size?: number }) {
  return (
    <img 
      src="/Dormify.png" 
      alt="Dormify Logo" 
      style={{ width: size, height: size, objectFit: "contain" }} 
    />
  );
}

const Icons = {
  users: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  home: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  doc: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  invoice: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  wrench: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <circle cx="12" cy="12" r="3" strokeWidth={1.8} />
    </svg>
  ),
  chart: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  logout: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  transfer: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  moon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  megaphone: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  globe: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={1.8} />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" strokeWidth={1.8} />
    </svg>
  ),
};

function NavItem({
  icon,
  label,
  active = false,
  badge,
  href = "#",
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  href?: string;
}) {
  return (
    <Link href={href} className={`nav-item ${active ? "nav-item--active" : ""}`}>
      <span className="nav-item__icon">{icon}</span>
      <span className="nav-item__label">{label}</span>
      {badge != null && badge > 0 && <span className="nav-item__badge">{badge}</span>}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [studentsCount, setStudentsCount] = useState(0);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [pendingMaintenance, setPendingMaintenance] = useState(0);
  const [pendingTransfers, setPendingTransfers] = useState(0);
  const [pendingAbsences, setPendingAbsences] = useState(0);

  useEffect(() => {
    const loadLayoutData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const resProfile = await apiClient.get("/users/profile");
        if (resProfile.ok) setAdminProfile(await resProfile.json());

        const resStudents = await apiClient.get("/users/students");
        if (resStudents.ok) {
          const sData = await resStudents.json();
          setStudentsCount(sData.length);
        }

        const resBookings = await apiClient.get("/bookings");
        if (resBookings.ok) {
          const bData = (await resBookings.json()) as BookingSummary[];
          setPendingBookings(bData.filter((booking) => booking.status === "PENDING").length);
        }

        const resTransfers = await apiClient.get("/transfers");
        if (resTransfers.ok) {
          const tData = (await resTransfers.json()) as BookingSummary[];
          setPendingTransfers(tData.filter((transfer) => transfer.status === "PENDING").length);
        }

        const resAbsences = await apiClient.get("/absences");
        if (resAbsences.ok) {
          const aData = (await resAbsences.json()) as BookingSummary[];
          setPendingAbsences(aData.filter((absence) => absence.status === "PENDING").length);
        }

        const resMaintenance = await apiClient.get("/maintenance");
        if (resMaintenance.ok) {
          const mData = (await resMaintenance.json()) as MaintenanceSummary[];
          setPendingMaintenance(mData.filter((req) => req.status === "PENDING").length);
        }
      } catch (error) {
        console.error("Lỗi đồng bộ dữ liệu Layout Admin:", error);
      }
    };

    loadLayoutData();
  }, [pathname]);

  const handleLogout = () => {
    clearToken();
    window.location.href = "/login";
  };

  return (
    <RoleGuard allowedRoles={["ADMIN", "DORMITORY_MANAGER", "FLOOR_MANAGER", "MAINTENANCE_STAFF"]}>
      <ToastProvider>
      <ConfirmProvider>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,700;1,9..144,400&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --navy:        #0D1B2A;
          --gold:        #C9A84C;
          --gold-dim:    rgba(201,168,76,0.18);
          --gold-border: rgba(201,168,76,0.25);
          --white:       #ffffff;
          --muted:       #8A9BAD;
          --border:      rgba(13,27,42,0.09);
          --row-hover:   rgba(201,168,76,0.04);
          --sidebar-w:   240px;
        }
        .admin-shell { display: flex; min-height: 100vh; background: #F0EDE8; font-family: 'DM Sans', sans-serif; }
        .sidebar { width: var(--sidebar-w); min-height: 100vh; background: var(--navy); display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; border-right: 1px solid var(--gold-border); z-index: 40; }
        .sidebar__brand { padding: 24px 20px 20px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid rgba(255,255,255,0.06); text-decoration: none; transition: opacity 0.2s; }
        .sidebar__brand:hover { opacity: 0.8; }
        .sidebar__wordmark { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 600; color: var(--white); letter-spacing: -0.2px; }
        .sidebar__wordmark span { color: var(--gold); }
        .sidebar__role-chip { margin: 16px 20px 4px; font-size: 10px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.3); }
        .sidebar__nav { flex: 1; padding: 4px 12px 16px; display: flex; flex-direction: column; gap: 2px; }
        .sidebar__footer { padding: 16px 12px; border-top: 1px solid rgba(255,255,255,0.06); }
        .nav-item { width: 100%; display: flex; align-items: center; gap: 11px; padding: 9px 12px; border-radius: 8px; border: none; background: transparent; cursor: pointer; transition: background 0.15s, color 0.15s; text-align: left; text-decoration: none; }
        .nav-item__icon { color: var(--muted); flex-shrink: 0; display: flex; }
        .nav-item__label { font-size: 13.5px; font-weight: 400; color: rgba(255,255,255,0.55); flex: 1; }
        .nav-item__badge { font-size: 10px; font-weight: 600; background: #eab308; color: var(--navy); border-radius: 100px; padding: 1px 7px; min-width: 20px; text-align: center; }
        .nav-item:hover .nav-item__label { color: var(--white); }
        .nav-item:hover .nav-item__icon  { color: rgba(255,255,255,0.7); }
        .nav-item:hover { background: rgba(255,255,255,0.05); }
        .nav-item--active { background: var(--gold-dim) !important; }
        .nav-item--active .nav-item__label { color: var(--gold) !important; font-weight: 500; }
        .nav-item--active .nav-item__icon  { color: var(--gold) !important; }
        .btn-sidebar-action { width: 100%; display: flex; align-items: center; gap: 11px; padding: 9px 12px; border-radius: 8px; border: none; background: transparent; cursor: pointer; text-align: left; transition: background 0.15s; text-decoration: none; margin-bottom: 4px; }
        .btn-sidebar-action--home:hover { background: rgba(255,255,255,0.05); }
        .btn-sidebar-action--home span:first-child { color: rgba(255,255,255,0.5); display: flex; }
        .btn-sidebar-action--home span:last-child  { font-size: 13.5px; color: rgba(255,255,255,0.7); transition: color 0.15s; }
        .btn-sidebar-action--home:hover span:last-child { color: var(--white); }
        .btn-sidebar-action--logout:hover { background: rgba(220,50,50,0.12); }
        .btn-sidebar-action--logout span:first-child { color: rgba(240,80,80,0.7); display: flex; }
        .btn-sidebar-action--logout span:last-child  { font-size: 13.5px; color: rgba(240,80,80,0.8); }
        .admin-main { margin-left: var(--sidebar-w); flex: 1; display: flex; flex-direction: column; min-height: 100vh; }
        .topbar { background: var(--white); border-bottom: 1px solid var(--border); padding: 0 32px; height: 60px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 30; }
        .topbar__title { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 600; color: var(--navy); line-height: 1.2; letter-spacing: -0.2px; }
        .topbar__breadcrumb { font-size: 11.5px; color: var(--muted); margin-top: 1px; }
        .topbar__right { display: flex; align-items: center; gap: 12px; }
        .topbar__avatar { width: 36px; height: 36px; border-radius: 9px; background: var(--navy); display: flex; align-items: center; justify-content: center; font-family: 'Fraunces', serif; font-size: 14px; font-weight: 600; color: var(--gold); cursor: pointer; border: 1.5px solid var(--gold-border); transition: transform 0.1s; overflow: hidden; }
        .topbar__avatar:hover { transform: scale(1.05); border-color: var(--gold); }
        .page-body { padding: 32px; flex: 1; }
      `}</style>

      <div className="admin-shell">
        <aside className="sidebar">
          <Link href="/" className="sidebar__brand">
            <DormifyLogoMark size={36} />
            <span className="sidebar__wordmark">Dorm<span>ify</span></span>
          </Link>
          <div className="sidebar__role-chip">Quản trị viên</div>
          <nav className="sidebar__nav">
            <NavItem href="/admin" icon={Icons.chart} label="Tổng quan" active={pathname === "/admin"} />
            <NavItem href="/admin/rooms" icon={Icons.home} label="Quản lý phòng" active={pathname.startsWith("/admin/rooms")} />
            <NavItem href="/admin/students" icon={Icons.users} label="Sinh viên" badge={studentsCount} active={pathname.startsWith("/admin/students")} />
            <NavItem href="/admin/permissions" icon={Icons.users} label="Phân quyền tài khoản" active={pathname.startsWith("/admin/permissions")} />
            <NavItem href="/admin/bookings" icon={Icons.doc} label="Duyệt đơn phòng" badge={pendingBookings} active={pathname.startsWith("/admin/bookings")} />
            <NavItem href="/admin/transfers" icon={Icons.transfer} label="Duyệt đổi phòng" badge={pendingTransfers} active={pathname.startsWith("/admin/transfers")} />
            <NavItem href="/admin/absences" icon={Icons.moon} label="Tạm trú / Tạm vắng" badge={pendingAbsences} active={pathname.startsWith("/admin/absences")} />
            <NavItem href="/admin/announcements" icon={Icons.megaphone} label="Gửi thông báo" active={pathname.startsWith("/admin/announcements")} />
            <NavItem href="/admin/invoices" icon={Icons.invoice} label="Hóa đơn" active={pathname.startsWith("/admin/invoices")} />
            <NavItem href="/admin/profile" icon={Icons.users} label="Hồ sơ cá nhân" active={pathname.startsWith("/admin/profile")} />
            <NavItem href="/admin/maintenance" icon={Icons.wrench} label="Bảo trì" badge={pendingMaintenance} active={pathname.startsWith("/admin/maintenance")} />
          </nav>
          <div className="sidebar__footer">
            <Link href="/" className="btn-sidebar-action btn-sidebar-action--home">
              <span>{Icons.globe}</span>
              <span>Về trang chủ</span>
            </Link>
            <button className="btn-sidebar-action btn-sidebar-action--logout" type="button" onClick={handleLogout}>
              <span>{Icons.logout}</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        <div className="admin-main">
          <header className="topbar">
            <div className="topbar__left">
              <div className="topbar__title">
                {pathname === "/admin" && "Bảng điều khiển tổng quan"}
                {pathname.includes("/rooms") && "Quản lý phòng ở"}
                {pathname.includes("/students") && "Quản lý danh sách sinh viên"}
                {pathname.includes("/permissions") && "Phân quyền tài khoản quản trị"}
                {pathname.includes("/bookings") && "Duyệt đơn lưu trú"}
                {pathname.includes("/invoices") && "Hệ thống hóa đơn"}
                {pathname.includes("/profile") && "Hồ sơ cá nhân Admin"}
                {pathname.includes("/maintenance") && "Quản lý yêu cầu bảo trì"}
              </div>
              <div className="topbar__breadcrumb">Dormify · Đám mây Atlas</div>
            </div>
            <div className="topbar__right">
              <NotificationBell />
              <div className="topbar__avatar" title="Bấm để xem/sửa hồ sơ" onClick={() => router.push('/admin/profile')}>
                {adminProfile?.avatar ? (
                  <img src={adminProfile.avatar} alt="Admin Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  adminProfile?.fullName ? adminProfile.fullName.charAt(0).toUpperCase() : "A"
                )}
              </div>
            </div>
          </header>

          {/* Thêm các class p-6 (padding trên mobile) và md:p-8 lg:p-10 (padding lớn hơn trên màn hình máy tính) 
              cùng max-w-screen-2xl để giới hạn chiều rộng tối đa, tránh nội dung bị dàn trải quá mức trên màn hình cực to */}
          <main className="page-body p-6 md:p-8 lg:p-10 max-w-screen-2xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
      </ConfirmProvider>
      </ToastProvider>
    </RoleGuard>
  );
}