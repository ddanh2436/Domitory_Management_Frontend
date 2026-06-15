"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RoleGuard from "../components/RoleGuard";
import NotificationBell from "../components/NotificationBell";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Student {
  _id: string;
  fullName: string;
  mssv?: string;
  email: string;
  phone?: string;
  cccd?: string;
  room?: { name: string; building: string };
  status?: string;
}

interface AdminProfile {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  cccd?: string;
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

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icons = {
  users: (
    <svg
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
      />
    </svg>
  ),
  home: (
    <svg
      width="18"
      height="18"
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
  doc: (
    <svg
      width="18"
      height="18"
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
      width="18"
      height="18"
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
      width="18"
      height="18"
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
  chart: (
    <svg
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  logout: (
    <svg
      width="18"
      height="18"
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
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  ),
  bell: (
    <svg
      width="18"
      height="18"
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
  globe: (
    <svg
      width="18"
      height="18"
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

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────
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
    <Link
      href={href}
      className={`nav-item ${active ? "nav-item--active" : ""}`}
    >
      <span className="nav-item__icon">{icon}</span>
      <span className="nav-item__label">{label}</span>
      {badge != null && badge > 0 && (
        <span className="nav-item__badge">{badge}</span>
      )}
    </Link>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string | number;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className={`stat-card ${accent ? "stat-card--accent" : ""}`}>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__sub">{sub}</div>
    </div>
  );
}

// ─── Main Dashboard Component ──────────────────────────────────────────────────
export default function AdminDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [alertMsg, setAlertMsg] = useState({ text: "", type: "" });

  // Các State xử lý cập nhật thông tin cá nhân Admin
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    cccd: "",
  });
  const [pendingMaintenance, setPendingMaintenance] = useState(0);

  // Hàm tải toàn bộ dữ liệu đồng thời từ MongoDB Atlas
  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");

      // 1. Tải hồ sơ Admin hiện tại
      const resProfile = await fetch(
        "http://localhost:3001/api/users/profile",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (resProfile.ok) {
        const profileData = await resProfile.json();
        setAdminProfile(profileData);
        setFormData({
          fullName: profileData.fullName || "",
          phone: profileData.phone || "",
          cccd: profileData.cccd || "",
        });
      }

      // 2. Tải danh sách sinh viên
      const resStudents = await fetch(
        "http://localhost:3001/api/users/students",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const studentsData = resStudents.ok ? await resStudents.json() : [];
      setStudents(studentsData);

      // 3. Tải danh sách đơn đăng ký đặt phòng
      const resBookings = await fetch("http://localhost:3001/api/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const bookingsData = resBookings.ok ? await resBookings.json() : [];
      setBookings(bookingsData);

      const resMaintenance = await fetch(
        "http://localhost:3001/api/maintenance",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (resMaintenance.ok) {
        const data = await resMaintenance.json();
        // Lọc và đếm số lượng đơn đang chờ
        setPendingMaintenance(
          data.filter((req: any) => req.status === "PENDING").length,
        );
      }
    } catch (error) {
      console.error("Lỗi đồng bộ dữ liệu từ đám mây:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Xử lý cập nhật thông tin cá nhân của Admin qua API
  const handleUpdateAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/api/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setAlertMsg({
          text: "Cập nhật hồ sơ cá nhân Quản trị viên thành công!",
          type: "success",
        });
        setIsModalOpen(false);
        loadDashboardData();
      } else {
        const err = await response.json();
        setAlertMsg({
          text: err.message || "Lỗi cập nhật hệ thống.",
          type: "error",
        });
      }
    } catch (error) {
      setAlertMsg({
        text: "Không thể kết nối đến máy chủ Backend.",
        type: "error",
      });
    }
  };

  // Xử lý Duyệt / Từ chối đơn trực tiếp tại Dashboard chính
  const handleBookingAction = async (
    bookingId: string,
    action: "approve" | "reject",
    roomName: string,
  ) => {
    const actionText = action === "approve" ? "DUYỆT CHẤP NHẬN" : "TỪ CHỐI";
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn ${actionText} đơn đăng ký vào phòng ${roomName}?`,
      )
    )
      return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3001/api/bookings/${bookingId}/${action}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      if (response.ok) {
        setAlertMsg({
          text: `Xử lý đơn thành công: Đã ${action === "approve" ? "Phê duyệt và trừ 1 giường trống tại phòng" : "Từ chối đơn vào phòng"} ${roomName}.`,
          type: "success",
        });
        loadDashboardData(); // Reload toàn bộ chỉ số thực tế từ DB
      } else {
        setAlertMsg({
          text: data.message || "Lỗi xử lý hệ thống.",
          type: "error",
        });
      }
    } catch (error) {
      setAlertMsg({
        text: "Không thể kết nối đến máy chủ Backend.",
        type: "error",
      });
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === "PENDING");
  const filteredStudents = students.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      (s.mssv ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
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
        .topbar__bell { width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--border); background: transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--muted); position: relative; transition: border-color 0.15s, background 0.15s; }
        .topbar__bell:hover { border-color: var(--gold); background: var(--gold-dim); color: var(--gold); }
        .topbar__bell-dot { position: absolute; top: 7px; right: 7px; width: 6px; height: 6px; border-radius: 50%; background: var(--gold); border: 1.5px solid var(--white); }
        .topbar__avatar { width: 36px; height: 36px; border-radius: 9px; background: var(--navy); display: flex; align-items: center; justify-content: center; font-family: 'Fraunces', serif; font-size: 14px; font-weight: 600; color: var(--gold); cursor: pointer; border: 1.5px solid var(--gold-border); transition: transform 0.1s; }
        .topbar__avatar:hover { transform: scale(1.05); border-color: var(--gold); }
        .page-body { padding: 28px 32px 48px; flex: 1; }
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
        .stat-card { background: var(--white); border: 1px solid var(--border); border-radius: 12px; padding: 22px 24px; transition: transform 0.15s, box-shadow 0.15s; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(13,27,42,0.07); }
        .stat-card--accent { background: var(--navy); border-color: var(--gold-border); }
        .stat-card__label { font-size: 11px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; }
        .stat-card--accent .stat-card__label { color: rgba(255,255,255,0.4); }
        .stat-card__value { font-family: 'Fraunces', serif; font-size: 32px; font-weight: 700; color: var(--navy); line-height: 1; letter-spacing: -1px; margin-bottom: 6px; }
        .stat-card--accent .stat-card__value { color: var(--gold); }
        .stat-card__sub { font-size: 12px; color: var(--muted); }
        .stat-card--accent .stat-card__sub { color: rgba(255,255,255,0.35); }
        .panel { background: var(--white); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; margin-bottom: 28px; }
        .panel__header { padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); }
        .panel__title { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 600; color: var(--navy); letter-spacing: -0.2px; }
        .panel__subtitle { font-size: 12.5px; color: var(--muted); }
        .panel__header-right { display: flex; align-items: center; gap: 10px; }
        .search-wrap { position: relative; display: flex; align-items: center; }
        .search-wrap__icon { position: absolute; left: 11px; color: var(--muted); pointer-events: none; display: flex; }
        .search-input { padding: 8px 12px 8px 34px; border: 1px solid var(--border); border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--navy); background: #F9F8F6; outline: none; width: 220px; transition: border-color 0.15s, background 0.15s; }
        .search-input:focus { border-color: var(--gold); background: var(--white); }
        .count-badge { display: inline-flex; align-items: center; justify-content: center; padding: 3px 10px; border-radius: 100px; background: var(--gold-dim); border: 1px solid var(--gold-border); font-size: 12px; font-weight: 500; color: var(--gold); }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table thead tr { border-bottom: 1px solid var(--border); }
        .data-table th { padding: 10px 20px; font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); text-align: left; white-space: nowrap; background: #FAFAF9; }
        .data-table tbody tr { border-bottom: 1px solid var(--border); transition: background 0.12s; }
        .data-table tbody tr:hover { background: var(--row-hover); }
        .data-table td { padding: 14px 20px; vertical-align: middle; }
        .cell-index { font-size: 12px; font-weight: 500; color: var(--muted); }
        .cell-name { font-size: 14px; font-weight: 500; color: var(--navy); }
        .cell-mssv { font-size: 13px; font-weight: 500; color: var(--gold); font-family: 'DM Sans', monospace; }
        .cell-email { font-size: 13px; color: #4A6580; }
        .cell-status span { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 100px; font-size: 11.5px; font-weight: 500; background: rgba(34,197,94,0.1); color: #16a34a; border: 1px solid rgba(34,197,94,0.2); }
        .cell-status span::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: #22c55e; }
        .skeleton { display: inline-block; border-radius: 4px; background: linear-gradient(90deg, #F0EDE8 25%, #E8E4DE 50%, #F0EDE8 75%); background-size: 400% 100%; animation: shimmer 1.4s ease infinite; }
        @keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }

        /* Styles cho Profile Modal */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(13, 27, 42, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; }
        .modal-card { background: var(--white); border-radius: 16px; border: 1px solid var(--gold-border); width: 440px; max-width: 90%; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); }
        .modal-header { padding: 20px 24px; background: var(--navy); color: var(--white); display: flex; align-items: center; justify-content: space-between; }
        .modal-title { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 600; color: var(--gold); }
        .modal-close { background: transparent; border: none; color: var(--muted); cursor: pointer; font-size: 20px; display: flex; align-items: center; }
        .modal-close:hover { color: var(--white); }
        .modal-body { padding: 24px; }
        .form-group { margin-bottom: 18px; }
        .form-label { display: block; font-size: 12px; font-weight: 500; color: var(--navy); margin-bottom: 6px; letter-spacing: 0.02em; }
        .form-input-text { width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: var(--navy); background: #F9F8F6; outline: none; transition: border-color 0.15s, background 0.15s; }
        .form-input-text:focus { border-color: var(--gold); background: var(--white); }
        .form-input-readonly { width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: var(--muted); background: #F1EFEA; cursor: not-allowed; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
        .btn-cancel { padding: 9px 16px; border-radius: 8px; border: 1px solid var(--border); background: transparent; color: var(--navy); font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.15s; }
        .btn-cancel:hover { background: #FAFAF9; }
        .btn-submit { padding: 9px 18px; border-radius: 8px; border: none; background: var(--navy); color: var(--gold); font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid var(--gold-border); transition: background 0.15s; }
        .btn-submit:hover { background: #162a3f; }
      `}</style>

      <div className="admin-shell">
        {/* ─── Sidebar ─────────────────────────────────────────────────── */}
        <aside className="sidebar">
          <Link href="/" className="sidebar__brand">
            <DormifyLogoMark size={36} />
            <span className="sidebar__wordmark">
              Dorm<span>ify</span>
            </span>
          </Link>

          <div className="sidebar__role-chip">Quản trị viên</div>
          <nav className="sidebar__nav">
            <NavItem
              href="/admin"
              icon={Icons.chart}
              label="Tổng quan"
              active
            />
            <NavItem
              href="/admin/rooms"
              icon={Icons.home}
              label="Quản lý phòng"
            />
            <NavItem
              href="/admin/students"
              icon={Icons.users}
              label="Sinh viên"
              badge={students.length}
            />
            <NavItem
              href="/admin/bookings"
              icon={Icons.doc}
              label="Duyệt đơn phòng"
              badge={pendingBookings.length}
            />
            <NavItem
              href="/admin/invoices"
              icon={Icons.invoice}
              label="Hóa đơn"
            />
            <NavItem
              href="/admin/profile"
              icon={Icons.users}
              label="Hồ sơ cá nhân"
            />
            <NavItem href="/admin/maintenance" icon={Icons.wrench} label="Bảo trì" badge={pendingMaintenance} />
          </nav>

          <div className="sidebar__footer">
            <Link
              href="/"
              className="btn-sidebar-action btn-sidebar-action--home"
            >
              <span>{Icons.globe}</span>
              <span>Về trang chủ</span>
            </Link>
            <button
              className="btn-sidebar-action btn-sidebar-action--logout"
              type="button"
              onClick={handleLogout}
            >
              <span>{Icons.logout}</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* ─── Main Content ────────────────────────────────────────────── */}
        <div className="admin-main">
          <header className="topbar">
            <div className="topbar__left">
              <div className="topbar__title">Bảng điều khiển tổng quan</div>
              <div className="topbar__breadcrumb">Dormify · Đám mây Atlas</div>
            </div>
            <div className="topbar__right">
             <NotificationBell />
              {/* CLICK VÀO AVATAR NÀY ĐỂ BẬT CỬA SỔ CẬP NHẬT HỒ SƠ ADMIN */}
              <div
                className="topbar__avatar"
                title="Bấm để sửa hồ sơ Admin"
                onClick={() => setIsModalOpen(true)}
              >
                {adminProfile?.fullName
                  ? adminProfile.fullName.charAt(0).toUpperCase()
                  : "A"}
              </div>
            </div>
          </header>

          <main className="page-body">
            {/* Hộp thông báo kết quả xử lý */}
            {alertMsg.text && (
              <div
                className={`p-4 rounded-xl font-medium mb-6 ${alertMsg.type === "success" ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"}`}
              >
                {alertMsg.text}
              </div>
            )}

            {/* Khối Chỉ số Thống kê thời gian thực */}
            <div className="stats-row">
              <StatCard
                label="Tổng sinh viên hệ thống"
                value={loading ? "—" : students.length}
                sub="Tài khoản đã kích hoạt"
                accent
              />
              <StatCard
                label="Đơn phòng chờ xử lý"
                value={loading ? "—" : pendingBookings.length}
                sub="Yêu cầu cần phê duyệt gấp"
              />
              <StatCard
                label="Tổng đơn đã đăng ký"
                value={loading ? "—" : bookings.length}
                sub="Bao gồm mọi trạng thái"
              />
              <StatCard
                label="Sự cố kỹ thuật"
                value="0"
                sub="Hệ thống ổn định"
              />
            </div>

            {/* 📍 DASHBOARD COMPONENT: DANH SÁCH YÊU CẦU CHỜ DUYỆT */}
            <div className="panel">
              <div
                className="panel__header"
                style={{ backgroundColor: "#fffbf2" }}
              >
                <div className="panel__header-left">
                  <div className="panel__title" style={{ color: "#b45309" }}>
                    ⚡ Đơn đăng ký đặt phòng chờ duyệt
                  </div>
                  <div className="panel__subtitle">
                    Sinh viên gửi yêu cầu lưu trú - Phê duyệt sẽ tự cập nhật
                    giảm số giường trống
                  </div>
                </div>
                <div className="panel__header-right">
                  <span
                    className="count-badge"
                    style={{
                      backgroundColor: "#fef3c7",
                      color: "#d97706",
                      borderColor: "#fde68a",
                    }}
                  >
                    {pendingBookings.length} yêu cầu mới
                  </span>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="px-6 py-3">Họ và Tên Sinh viên</th>
                      <th className="px-6 py-3">Phòng Đăng ký</th>
                      <th className="px-6 py-3">Ngày gửi đơn</th>
                      <th className="px-6 py-3">Trạng thái</th>
                      <th className="px-6 py-3 text-center">
                        Thao tác xử lý nhanh
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-6 text-slate-400"
                        >
                          Đang tải đơn từ database đám mây...
                        </td>
                      </tr>
                    ) : pendingBookings.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-10 text-slate-400 font-medium bg-slate-50"
                        >
                          🎉 Sạch đơn! Hiện tại không có yêu cầu nào đang chờ
                          phê duyệt.
                        </td>
                      </tr>
                    ) : (
                      pendingBookings.map((b) => (
                        <tr key={b._id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800">
                              {b.user?.fullName}
                            </div>
                            <div className="text-slate-400 text-xs mt-0.5">
                              MSSV: {b.user?.mssv || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-blue-600">
                              {b.room?.name}
                            </div>
                            <div className="text-slate-400 text-xs mt-0.5">
                              Tòa {b.room?.building} · Tầng {b.room?.floor}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-sm">
                            {new Date(b.createdAt).toLocaleDateString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              CHỜ DUYỆT
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex gap-2">
                              <button
                                onClick={() =>
                                  handleBookingAction(
                                    b._id,
                                    "approve",
                                    b.room?.name,
                                  )
                                }
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
                              >
                                Chấp nhận
                              </button>
                              <button
                                onClick={() =>
                                  handleBookingAction(
                                    b._id,
                                    "reject",
                                    b.room?.name,
                                  )
                                }
                                className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-md text-xs font-semibold border border-rose-200 transition-colors"
                              >
                                Từ chối
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* ─── MODAL CẬP NHẬT HỒ SƠ ADMIN ───────────────────────────────── */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Hồ sơ Quản trị viên</div>
              <button
                className="modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdateAdminProfile} className="modal-body">
              <div className="form-group">
                <label className="form-label">
                  Tài khoản Email (Định danh)
                </label>
                <input
                  type="text"
                  className="form-input-readonly"
                  value={adminProfile?.email || ""}
                  readOnly
                />
              </div>
              <div className="form-group">
                <label className="form-label">Họ và Tên</label>
                <input
                  type="text"
                  className="form-input-text"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                <input
                  type="text"
                  className="form-input-text"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Số CCCD / Mã cá nhân</label>
                <input
                  type="text"
                  className="form-input-text"
                  value={formData.cccd}
                  onChange={(e) =>
                    setFormData({ ...formData, cccd: e.target.value })
                  }
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-submit">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
