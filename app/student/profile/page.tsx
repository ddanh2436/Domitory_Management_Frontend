"use client";

import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface StudentProfile {
  _id: string;
  fullName: string;
  mssv?: string;
  email: string;
  phone?: string;
  cccd?: string;
  avatar?: string;
  room?: { name: string; building: string };
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icons = {
  camera: (
    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [formData, setFormData] = useState({ phone: "", cccd: "", avatar: "" });
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
        setFormData({ phone: data.phone || "", cccd: data.cccd || "", avatar: data.avatar || "" });
      }
    } catch (error) {
      console.error("Lỗi tải thông tin:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  // Xử lý khi sinh viên chọn file ảnh
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

  if (loading) {
    return <div className="w-full h-64 flex items-center justify-center text-slate-500">Đang tải hồ sơ...</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto font-sans text-slate-800">
      <style>{`
        :root {
          --navy: #0D1B2A; --gold: #C9A84C; --gold-dim: rgba(201,168,76,0.18); 
          --gold-border: rgba(201,168,76,0.25); --white: #ffffff; 
          --muted: #8A9BAD; --border: rgba(13,27,42,0.09);
        }
        
        .profile-card { background: var(--white); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; display: flex; flex-direction: row; box-shadow: 0 4px 20px rgba(13,27,42,0.03); }
        .profile-left { width: 280px; background: #FAFAF9; border-right: 1px solid var(--border); padding: 40px 24px; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .avatar-wrapper { position: relative; width: 140px; height: 140px; border-radius: 50%; border: 4px solid var(--white); box-shadow: 0 8px 16px rgba(0,0,0,0.08); margin-bottom: 20px; overflow: hidden; background: var(--navy); display: flex; justify-content: center; align-items: center; cursor: pointer; }
        .avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-placeholder { font-family: 'Fraunces', serif; font-size: 56px; color: var(--gold); }
        .avatar-overlay { position: absolute; inset: 0; background: rgba(13, 27, 42, 0.6); display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; color: white; font-size: 12px; font-weight: 500; }
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
        
        .room-badge { display: inline-block; padding: 6px 12px; background: var(--gold-dim); color: #9a7b2c; border: 1px solid var(--gold-border); border-radius: 6px; font-weight: 600; font-size: 13px; margin-top: 10px; }

        @media (max-width: 768px) {
          .profile-card { flex-direction: column; }
          .profile-left { width: 100%; border-right: none; border-bottom: 1px solid var(--border); padding: 30px 20px; }
          .profile-right { padding: 30px 20px; }
          .form-grid { grid-template-columns: 1fr; gap: 16px; }
        }
      `}</style>

      {alertMsg.text && (
        <div className={`p-4 rounded-xl font-medium mb-6 border ${alertMsg.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : alertMsg.type === 'info' ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          {alertMsg.text}
        </div>
      )}

      <div className="profile-card">
        {/* CỘT TRÁI: AVATAR VÀ THÔNG TIN CHUNG */}
        <div className="profile-left">
          <label className="avatar-wrapper" title="Bấm để thay đổi ảnh">
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
          
          {profile?.room ? (
            <div className="room-badge">Phòng {profile.room.name} - Tòa {profile.room.building}</div>
          ) : (
            <div className="room-badge" style={{ background: '#f1f5f9', color: '#64748b', borderColor: '#e2e8f0' }}>Chưa xếp phòng</div>
          )}
        </div>

        {/* CỘT PHẢI: FORM CẬP NHẬT */}
        <form className="profile-right" onSubmit={handleSaveProfile}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--navy)', marginBottom: '24px' }}>Thông tin liên hệ</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Họ và Tên</label>
              <input type="text" className="form-input" value={profile?.fullName || ""} readOnly title="Không thể thay đổi tên" />
            </div>
            <div className="form-group">
              <label className="form-label">Mã số sinh viên</label>
              <input type="text" className="form-input" value={profile?.mssv || "Chưa cập nhật"} readOnly title="Không thể thay đổi MSSV" />
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
    </div>
  );
}