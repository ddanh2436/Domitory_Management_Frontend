"use client";

import { useEffect, useState } from "react";
import { useToast } from "../../components/ToastProvider";
import { apiClient } from "../../utils/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdminProfile {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  cccd?: string;
  avatar?: string;
  role?: string;
  accessStatus?: string;
  createdAt?: string;
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Quản trị viên",
  DORMITORY_MANAGER: "Quản lý ký túc xá",
  FLOOR_MANAGER: "Quản lý tầng",
  MAINTENANCE_STAFF: "Nhân viên bảo trì",
  STUDENT: "Sinh viên",
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icons = {
  camera: (
    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AdminProfilePage() {
  const toast = useToast();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [formData, setFormData] = useState({ fullName: "", phone: "", cccd: "", avatar: "" });
  const [loading, setLoading] = useState(true);
  // Cầu nối sang toast dùng chung (giữ nguyên các lệnh setAlertMsg sẵn có)
  const setAlertMsg = ({ text, type }: { text: string; type: string }) => {
    if (!text) return;
    if (type === "success") toast.success(text);
    else if (type === "info") toast.info(text);
    else toast.error(text);
  };

  const loadProfile = async () => {
    try {
      const res = await apiClient.get("/users/profile");
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProfile();
  }, []);

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
      const response = await apiClient.patch("/users/profile", formData);

      if (response.ok) {
        setAlertMsg({ text: "Cập nhật hồ sơ thành công!", type: "success" });
        loadProfile(); // Refresh dữ liệu
      } else {
        const err = await response.json();
        setAlertMsg({ text: err.message || "Lỗi cập nhật.", type: "error" });
      }
    } catch {
      setAlertMsg({ text: "Không thể kết nối đến server.", type: "error" });
    }
  };

  if (loading) {
    return <div className="w-full h-64 flex items-center justify-center text-slate-500">Đang tải hồ sơ...</div>;
  }

  const roleLabel = ROLE_LABEL[profile?.role ?? ""] ?? "Quản trị viên";
  const joinedAt = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—";
  const isLocked = profile?.accessStatus === "LOCKED";

  return (
    <div className="w-full max-w-5xl mx-auto font-sans text-slate-800">
      <style>{`
        .pf-hero { position: relative; background: linear-gradient(135deg, #0D1B2A 0%, #182b43 60%, #253d5d 100%); border: 1px solid rgba(201,168,76,0.25); border-radius: 16px; padding: 28px 32px; display: flex; align-items: center; gap: 24px; flex-wrap: wrap; margin-bottom: 24px; overflow: hidden; }
        .pf-hero::after { content: ''; position: absolute; right: -60px; top: -60px; width: 220px; height: 220px; border-radius: 50%; background: rgba(201,168,76,0.08); pointer-events: none; }

        .avatar-wrapper { position: relative; width: 96px; height: 96px; border-radius: 50%; border: 3px solid rgba(201,168,76,0.5); box-shadow: 0 8px 20px rgba(0,0,0,0.25); overflow: hidden; background: #0D1B2A; display: flex; justify-content: center; align-items: center; cursor: pointer; flex-shrink: 0; }
        .avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-placeholder { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 40px; color: #C9A84C; }
        .avatar-overlay { position: absolute; inset: 0; background: rgba(13, 27, 42, 0.65); display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; color: white; font-size: 11px; font-weight: 500; }
        .avatar-wrapper:hover .avatar-overlay { opacity: 1; }
        .hidden-input { display: none; }

        .pf-hero-name { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 24px; font-weight: 700; color: #fff; letter-spacing: -0.3px; }
        .pf-hero-email { margin-top: 4px; color: rgba(255,255,255,0.65); font-size: 13.5px; }
        .pf-chips { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
        .pf-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px; font-size: 11.5px; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase; }
        .pf-chip--role { background: rgba(201,168,76,0.15); color: #C9A84C; border: 1px solid rgba(201,168,76,0.35); }
        .pf-chip--active { background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.3); }
        .pf-chip--locked { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
        .pf-chip-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

        .pf-grid { display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: start; }

        .pf-panel { background: #ffffff; border: 1px solid rgba(13,27,42,0.09); border-radius: 12px; overflow: hidden; }
        .pf-panel-head { padding: 18px 24px; border-bottom: 1px solid rgba(13,27,42,0.09); }
        .pf-panel-title { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 16px; font-weight: 600; color: #0D1B2A; }
        .pf-panel-sub { margin-top: 3px; font-size: 12.5px; color: #8A9BAD; }
        .pf-panel-body { padding: 24px; }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .form-group { display: flex; flex-direction: column; gap: 7px; }
        .form-group--full { grid-column: 1 / -1; }
        .form-label { font-size: 12px; font-weight: 700; color: #0D1B2A; }
        .form-hint { font-size: 11.5px; color: #8A9BAD; font-weight: 400; }
        .form-input { padding: 11px 14px; border: 1px solid rgba(13,27,42,0.15); border-radius: 8px; font-family: inherit; font-size: 13.5px; color: #0D1B2A; background: #fbfaf8; outline: none; transition: all 0.2s; }
        .form-input:focus { border-color: #C9A84C; background: #ffffff; box-shadow: 0 0 0 3px rgba(201,168,76,0.18); }
        .form-input:read-only { background: #f1f0ee; color: #8A9BAD; cursor: not-allowed; }

        .pf-form-foot { display: flex; justify-content: flex-end; margin-top: 22px; padding-top: 18px; border-top: 1px solid rgba(13,27,42,0.07); }
        .btn-save { padding: 11px 28px; background: #0D1B2A; color: #C9A84C; font-size: 13.5px; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; transition: background 0.2s; }
        .btn-save:hover { background: #162a3f; }

        .pf-meta-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 0; border-bottom: 1px solid rgba(13,27,42,0.06); }
        .pf-meta-row:last-child { border-bottom: none; }
        .pf-meta-label { font-size: 12.5px; color: #8A9BAD; font-weight: 600; }
        .pf-meta-value { font-size: 13.5px; color: #0D1B2A; font-weight: 600; text-align: right; word-break: break-all; }
        .pf-note { margin-top: 16px; padding: 12px 14px; border-radius: 8px; background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.22); font-size: 12.5px; color: #7a6023; line-height: 1.6; }

        @media (max-width: 900px) {
          .pf-grid { grid-template-columns: 1fr; }
          .form-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* HERO: AVATAR + ĐỊNH DANH */}
      <div className="pf-hero">
        <label className="avatar-wrapper" title="Bấm để thay đổi ảnh">
          {formData.avatar ? (
            <img src={formData.avatar} alt="Avatar" className="avatar-img" />
          ) : (
            <div className="avatar-placeholder">{profile?.fullName?.charAt(0).toUpperCase()}</div>
          )}
          <div className="avatar-overlay">
            {Icons.camera}
            <span style={{ marginTop: "4px" }}>Đổi ảnh</span>
          </div>
          <input type="file" accept="image/*" className="hidden-input" onChange={handleImageUpload} />
        </label>

        <div>
          <div className="pf-hero-name">{profile?.fullName}</div>
          <div className="pf-hero-email">{profile?.email}</div>
          <div className="pf-chips">
            <span className="pf-chip pf-chip--role">{roleLabel}</span>
            <span className={`pf-chip ${isLocked ? "pf-chip--locked" : "pf-chip--active"}`}>
              <span className="pf-chip-dot" />
              {isLocked ? "Đã khóa" : "Đang hoạt động"}
            </span>
          </div>
        </div>
      </div>

      <div className="pf-grid">
        {/* FORM CẬP NHẬT THÔNG TIN LIÊN HỆ */}
        <form className="pf-panel" onSubmit={handleSaveProfile}>
          <div className="pf-panel-head">
            <div className="pf-panel-title">Thông tin liên hệ</div>
            <div className="pf-panel-sub">Cập nhật họ tên, số điện thoại và giấy tờ tùy thân của bạn</div>
          </div>
          <div className="pf-panel-body">
            <div className="form-grid">
              <div className="form-group form-group--full">
                <label className="form-label">
                  Tài khoản Email <span className="form-hint">(không thể thay đổi)</span>
                </label>
                <input type="text" className="form-input" value={profile?.email || ""} readOnly />
              </div>
              <div className="form-group form-group--full">
                <label className="form-label">Họ và Tên</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập họ và tên..."
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập số điện thoại..."
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Căn cước công dân</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập số CCCD..."
                  value={formData.cccd}
                  onChange={(e) => setFormData({ ...formData, cccd: e.target.value })}
                />
              </div>
            </div>

            <div className="pf-form-foot">
              <button type="submit" className="btn-save">Cập nhật thay đổi</button>
            </div>
          </div>
        </form>

        {/* THÔNG TIN TÀI KHOẢN */}
        <div className="pf-panel">
          <div className="pf-panel-head">
            <div className="pf-panel-title">Thông tin tài khoản</div>
          </div>
          <div className="pf-panel-body" style={{ paddingTop: 10, paddingBottom: 10 }}>
            <div className="pf-meta-row">
              <span className="pf-meta-label">Vai trò</span>
              <span className="pf-meta-value">{roleLabel}</span>
            </div>
            <div className="pf-meta-row">
              <span className="pf-meta-label">Trạng thái</span>
              <span className="pf-meta-value" style={{ color: isLocked ? "#dc2626" : "#16a34a" }}>
                {isLocked ? "Đã khóa" : "Đang hoạt động"}
              </span>
            </div>
            <div className="pf-meta-row">
              <span className="pf-meta-label">Số điện thoại</span>
              <span className="pf-meta-value">{profile?.phone || "Chưa cập nhật"}</span>
            </div>
            <div className="pf-meta-row">
              <span className="pf-meta-label">Ngày tham gia</span>
              <span className="pf-meta-value">{joinedAt}</span>
            </div>
            <div className="pf-note">
              Ảnh đại diện và thông tin liên hệ sẽ hiển thị với sinh viên trong các thông báo và trang quản lý.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}