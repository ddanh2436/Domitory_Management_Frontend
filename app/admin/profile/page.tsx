"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RoleGuard from "../../components/RoleGuard";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdminProfile {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  cccd?: string;
  avatar?: string;
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
  chart: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  home: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  users: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
  doc: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  invoice: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  user: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  wrench: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" strokeWidth={1.8} /></svg>,
  globe: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={1.8}/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" strokeWidth={1.8}/></svg>,
  logout: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  camera: <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
};

function NavItem({ icon, label, active = false, badge, href = "#" }: { icon: React.ReactNode; label: string; active?: boolean; badge?: number; href?: string; }) {
  return (
    <Link href={href} className={`nav-item ${active ? "nav-item--active" : ""}`}>
      <span className="nav-item__icon">{icon}</span>
      <span className="nav-item__label">{label}</span>
      {badge != null && badge > 0 && <span className="nav-item__badge">{badge}</span>}
    </Link>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AdminProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [formData, setFormData] = useState({ fullName: "", phone: "", cccd: "", avatar: "" });
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState({ text: "", type: "" });

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFormData({ 
          fullName: data.fullName || "", 
          phone: data.phone || "", 
          cccd: data.cccd || "", 
          avatar: data.avatar || "" 
        });
      }
    } catch (error) {
      console.error("Lỗi tải thông tin:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  // Xử lý khi Admin chọn file ảnh
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // Giới hạn ảnh 2MB
      setAlertMsg({ text: "Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 2MB.", type: "error" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, avatar: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Cập nhật lên server
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMsg({ text: "Đang lưu...", type: "info" });
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setAlertMsg({ text: "Cập nhật hồ sơ thành công!", type: "success" });
        loadProfile(); // Refresh dữ liệu
      } else {
        const err = await response.json();
        setAlertMsg({ text: err.message || "Lỗi cập nhật.", type: "error" });
      }
    } catch (error) {
      setAlertMsg({ text: "Không thể kết nối đến server.", type: "error" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  if (loading) return <div className="admin-shell"><div className="m-auto text-slate-500">Đang tải hồ sơ...</div></div>;

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <style>{`
        /* CSS dùng chung (Giữ nguyên style như Admin) */
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,700;1,9..144,400&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --navy: #0D1B2A; --gold: #C9A84C; --gold-dim: rgba(201,168,76,0.18); --gold-border: rgba(201,168,76,0.25); --white: #ffffff; --muted: #8A9BAD; --border: rgba(13,27,42,0.09); --row-hover: rgba(201,168,76,0.04); --sidebar-w: 240px; }
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
        .nav-item:hover { background: rgba(255,255,255,0.05); }
        .nav-item:hover .nav-item__label { color: var(--white); }
        .nav-item:hover .nav-item__icon { color: rgba(255,255,255,0.7); }
        .nav-item--active { background: var(--gold-dim) !important; }
        .nav-item--active .nav-item__label, .nav-item--active .nav-item__icon { color: var(--gold) !important; font-weight: 500; }
        
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
        .topbar__title { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 600; color: var(--navy); }
        .page-body { padding: 28px 32px 48px; flex: 1; max-width: 900px; margin: 0 auto; width: 100%; }

        /* Styles riêng cho trang Profile */
        .profile-card { background: var(--white); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; display: flex; flex-direction: row; box-shadow: 0 4px 20px rgba(13,27,42,0.03); }
        .profile-left { width: 280px; background: #FAFAF9; border-right: 1px solid var(--border); padding: 40px 24px; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .avatar-wrapper { position: relative; width: 140px; height: 140px; border-radius: 50%; border: 4px solid var(--white); box-shadow: 0 8px 16px rgba(0,0,0,0.08); margin-bottom: 20px; overflow: hidden; background: var(--navy); display: flex; justify-content: center; align-items: center; }
        .avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-placeholder { font-family: 'Fraunces', serif; font-size: 56px; color: var(--gold); }
        .avatar-overlay { position: absolute; inset: 0; background: rgba(13, 27, 42, 0.6); display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; cursor: pointer; color: white; font-size: 12px; font-weight: 500; }
        .avatar-wrapper:hover .avatar-overlay { opacity: 1; }
        .hidden-input { display: none; }
        .profile-right { flex: 1; padding: 40px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-label { font-size: 12.5px; font-weight: 500; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .form-input { padding: 12px 16px; border: 1px solid var(--border); border-radius: 8px; font-family: inherit; font-size: 14px; color: var(--navy); background: #F9F8F6; outline: none; transition: all 0.2s; }
        .form-input:focus { border-color: var(--gold); background: var(--white); box-shadow: 0 0 0 3px var(--gold-dim); }
        .form-input:read-only { background: #f1f0ee; color: var(--muted); cursor: not-allowed; }
        .btn-save { padding: 12px 24px; background: var(--navy); color: var(--gold); font-size: 14px; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; transition: background 0.2s; width: 100%; }
        .btn-save:hover { background: #162a3f; }
        .role-badge { display: inline-block; padding: 6px 12px; background: var(--navy); color: var(--gold); border: 1px solid var(--gold-border); border-radius: 6px; font-weight: 600; font-size: 13px; margin-top: 10px; text-transform: uppercase; }
      `}</style>

      <div className="admin-shell">
        {/* ─── Sidebar ─────────────────────────────────────────────────── */}
        <aside className="sidebar">
          <Link href="/" className="sidebar__brand">
            <DormifyLogoMark size={36} />
            <span className="sidebar__wordmark">Dorm<span>ify</span></span>
          </Link>

          <div className="sidebar__role-chip">Quản trị viên</div>
          <nav className="sidebar__nav">
            <NavItem href="/admin"       icon={Icons.chart}   label="Tổng quan" />
            <NavItem href="/admin/rooms" icon={Icons.home}    label="Quản lý phòng" />
            <NavItem href="/admin/students" icon={Icons.users} label="Sinh viên" />
            <NavItem href="/admin/bookings" icon={Icons.doc}  label="Duyệt đơn phòng" />
            <NavItem href="/admin/invoices" icon={Icons.invoice} label="Hóa đơn" />
            <NavItem href="/admin/profile" icon={Icons.user} label="Hồ sơ cá nhân" active />
            <NavItem href="#"            icon={Icons.wrench}  label="Bảo trì" />
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
            <div className="topbar__title">Hồ sơ Quản trị viên</div>
          </header>

          <main className="page-body">
            {alertMsg.text && (
              <div className={`p-4 rounded-xl font-medium mb-6 border ${alertMsg.type === 'success' ? 'bg-green-100 text-green-800 border-green-200' : alertMsg.type === 'info' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                {alertMsg.text}
              </div>
            )}

            <div className="profile-card">
              {/* CỘT TRÁI: AVATAR VÀ THÔNG TIN CHUNG */}
              <div className="profile-left">
                <label className="avatar-wrapper">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" className="avatar-img" />
                  ) : (
                    <div className="avatar-placeholder">{profile?.fullName?.charAt(0).toUpperCase()}</div>
                  )}
                  <div className="avatar-overlay">
                    {Icons.camera}
                    <span style={{ marginTop: '4px' }}>Đổi ảnh</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden-input" onChange={handleImageUpload} />
                </label>
                
                <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', color: 'var(--navy)', marginBottom: '4px' }}>
                  {profile?.fullName}
                </h2>
                <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '16px' }}>{profile?.email}</p>
                
                <div className="role-badge">Tài khoản Admin</div>
              </div>

              {/* CỘT PHẢI: FORM CẬP NHẬT */}
              <form className="profile-right" onSubmit={handleSaveProfile}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--navy)', marginBottom: '24px' }}>Thông tin liên hệ</h3>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Tài khoản Email</label>
                    <input type="text" className="form-input" value={profile?.email || ""} readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Họ và Tên</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Nhập họ và tên..."
                      value={formData.fullName} 
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Số điện thoại</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Nhập số điện thoại..."
                      value={formData.phone} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Căn cước công dân</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Nhập số CCCD..."
                      value={formData.cccd} 
                      onChange={(e) => setFormData({...formData, cccd: e.target.value})} 
                    />
                  </div>
                </div>

                <button type="submit" className="btn-save">Cập nhật thay đổi</button>
              </form>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}