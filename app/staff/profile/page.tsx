"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "../../components/ToastProvider";
import { apiClient } from "../../utils/apiClient";

interface StaffProfile {
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

const Icons = {
  camera: (
    <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

export default function StaffProfilePage() {
  const toast = useToast();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [formData, setFormData] = useState({ fullName: "", phone: "", cccd: "", avatar: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
          avatar: data.avatar || "",
        });
      }
    } catch (error) {
      console.error("Lỗi tải hồ sơ:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, avatar: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiClient.patch("/users/profile", formData);
      if (res.ok) {
        toast.success("Đã lưu thay đổi hồ sơ.", "Cập nhật thành công");
        void loadProfile();
      } else {
        const err = await res.json();
        toast.error(err.message || "Lỗi cập nhật hồ sơ.");
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setSaving(false);
    }
  };

  const joinedAt = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("vi-VN")
    : "—";

  if (loading) {
    return <div style={{ padding: 60, textAlign: "center", color: "#8A9BAD", fontSize: 13.5 }}>Đang tải hồ sơ...</div>;
  }

  return (
    <div>
      <style>{`
        .sp-hero { position: relative; background: linear-gradient(135deg, #0D1B2A 0%, #182b43 60%, #253d5d 100%); border: 1px solid rgba(201,168,76,0.25); border-radius: 16px; padding: 26px 28px; display: flex; align-items: center; gap: 22px; flex-wrap: wrap; margin-bottom: 20px; overflow: hidden; }
        .sp-avatar { position: relative; width: 88px; height: 88px; border-radius: 50%; border: 3px solid rgba(201,168,76,0.5); overflow: hidden; background: #0D1B2A; display: flex; justify-content: center; align-items: center; cursor: pointer; flex-shrink: 0; }
        .sp-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .sp-avatar-placeholder { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 36px; color: #C9A84C; }
        .sp-avatar-overlay { position: absolute; inset: 0; background: rgba(13,27,42,0.65); display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; transition: opacity .2s; color: #fff; font-size: 10.5px; font-weight: 500; }
        .sp-avatar:hover .sp-avatar-overlay { opacity: 1; }
        .sp-hidden-input { display: none; }
        .sp-name { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 22px; font-weight: 700; color: #fff; }
        .sp-email { margin-top: 3px; color: rgba(255,255,255,0.65); font-size: 13px; }
        .sp-chip { display: inline-flex; align-items: center; gap: 6px; margin-top: 10px; padding: 5px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase; background: rgba(201,168,76,0.15); color: #C9A84C; border: 1px solid rgba(201,168,76,0.35); }

        .sp-grid { display: grid; grid-template-columns: 1fr 300px; gap: 18px; align-items: start; }
        .sp-panel { background: #fff; border: 1px solid rgba(13,27,42,0.09); border-radius: 12px; overflow: hidden; }
        .sp-panel-head { padding: 16px 22px; border-bottom: 1px solid rgba(13,27,42,0.09); font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 15.5px; font-weight: 600; color: #0D1B2A; }
        .sp-panel-body { padding: 22px; }

        .sp-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 15px; }
        .sp-label { font-size: 12px; font-weight: 700; color: #0D1B2A; }
        .sp-label small { font-weight: 500; color: #8A9BAD; }
        .sp-input { width: 100%; height: 42px; padding: 0 13px; border: 1px solid rgba(13,27,42,0.15); border-radius: 8px; background: #fbfaf8; color: #0D1B2A; outline: none; font-size: 13.5px; font-family: 'DM Sans', sans-serif; transition: all .15s; }
        .sp-input:focus { border-color: #C9A84C; background: #fff; box-shadow: 0 0 0 3px rgba(201,168,76,0.15); }
        .sp-input:read-only { background: #f1f0ee; color: #8A9BAD; cursor: not-allowed; }
        .sp-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .sp-foot { display: flex; justify-content: flex-end; margin-top: 18px; padding-top: 16px; border-top: 1px solid rgba(13,27,42,0.07); }
        .sp-save { padding: 11px 26px; background: #0D1B2A; color: #C9A84C; font-size: 13.5px; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background .2s; }
        .sp-save:hover:not(:disabled) { background: #1A2E42; }
        .sp-save:disabled { opacity: .55; cursor: not-allowed; }

        .sp-meta-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(13,27,42,0.06); }
        .sp-meta-row:last-child { border-bottom: none; }
        .sp-meta-label { font-size: 12.5px; color: #8A9BAD; font-weight: 600; }
        .sp-meta-value { font-size: 13px; color: #0D1B2A; font-weight: 600; text-align: right; }

        @media (max-width: 860px) { .sp-grid { grid-template-columns: 1fr; } .sp-row2 { grid-template-columns: 1fr; } }
      `}</style>

      <div className="sp-hero">
        <label className="sp-avatar" title="Bấm để thay đổi ảnh">
          {formData.avatar ? (
            <img src={formData.avatar} alt="Avatar" />
          ) : (
            <div className="sp-avatar-placeholder">{profile?.fullName?.charAt(0).toUpperCase()}</div>
          )}
          <div className="sp-avatar-overlay">
            {Icons.camera}
            <span style={{ marginTop: 3 }}>Đổi ảnh</span>
          </div>
          <input type="file" accept="image/*" className="sp-hidden-input" onChange={handleImageUpload} />
        </label>
        <div>
          <div className="sp-name">{profile?.fullName}</div>
          <div className="sp-email">{profile?.email}</div>
          <div className="sp-chip">🔧 Nhân viên bảo trì</div>
        </div>
      </div>

      <div className="sp-grid">
        <form className="sp-panel" onSubmit={handleSave}>
          <div className="sp-panel-head">Thông tin liên hệ</div>
          <div className="sp-panel-body">
            <div className="sp-field">
              <label className="sp-label">
                Tài khoản Email <small>(không thể thay đổi)</small>
              </label>
              <input type="text" className="sp-input" value={profile?.email || ""} readOnly />
            </div>
            <div className="sp-field">
              <label className="sp-label">Họ và Tên</label>
              <input
                type="text"
                className="sp-input"
                placeholder="Nhập họ và tên..."
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div className="sp-row2">
              <div className="sp-field">
                <label className="sp-label">Số điện thoại</label>
                <input
                  type="text"
                  className="sp-input"
                  placeholder="Nhập số điện thoại..."
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="sp-field">
                <label className="sp-label">Căn cước công dân</label>
                <input
                  type="text"
                  className="sp-input"
                  placeholder="Nhập số CCCD..."
                  value={formData.cccd}
                  onChange={(e) => setFormData({ ...formData, cccd: e.target.value })}
                />
              </div>
            </div>
            <div className="sp-foot" style={{ gap: 12 }}>
              <Link
                href="/staff/profile/change-password"
                style={{ padding: "11px 22px", border: "1px solid rgba(13,27,42,0.15)", borderRadius: 8, fontSize: "13.5px", fontWeight: 600, color: "#0D1B2A", textDecoration: "none" }}
              >
                Đổi mật khẩu
              </Link>
              <button type="submit" className="sp-save" disabled={saving}>
                {saving ? "Đang lưu..." : "Cập nhật thay đổi"}
              </button>
            </div>
          </div>
        </form>

        <div className="sp-panel">
          <div className="sp-panel-head">Thông tin tài khoản</div>
          <div className="sp-panel-body" style={{ paddingTop: 8, paddingBottom: 8 }}>
            <div className="sp-meta-row">
              <span className="sp-meta-label">Vai trò</span>
              <span className="sp-meta-value">Nhân viên bảo trì</span>
            </div>
            <div className="sp-meta-row">
              <span className="sp-meta-label">Trạng thái</span>
              <span className="sp-meta-value" style={{ color: "#16a34a" }}>Đang hoạt động</span>
            </div>
            <div className="sp-meta-row">
              <span className="sp-meta-label">Số điện thoại</span>
              <span className="sp-meta-value">{profile?.phone || "Chưa cập nhật"}</span>
            </div>
            <div className="sp-meta-row">
              <span className="sp-meta-label">Ngày tham gia</span>
              <span className="sp-meta-value">{joinedAt}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
