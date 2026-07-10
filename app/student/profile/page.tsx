"use client";

import { useEffect, useState } from "react";
import { useToast } from "../../components/ToastProvider";
import { apiClient } from "../../utils/apiClient";

interface StudentProfile {
  _id: string;
  fullName: string;
  mssv?: string;
  email: string;
  phone?: string;
  cccd?: string;
  avatar?: string;
  behaviorScore?: number;
  room?: { name: string; building: string };
}

interface Violation {
  _id: string;
  reason: string;
  points: number;
  scoreAfter?: number;
  createdAt: string;
}

const CameraIcon = (
  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [formData, setFormData] = useState({ phone: "", cccd: "", avatar: "" });
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  // Cầu nối sang toast dùng chung (giữ nguyên các lệnh setAlertMsg sẵn có)
  const setAlertMsg = ({ text, type }: { text: string; type: string }) => {
    if (!text) return;
    if (type === "success") toast.success(text);
    else if (type === "info") toast.info(text);
    else toast.error(text);
  };

  const loadProfile = async () => {
    try {
      const [res, violRes] = await Promise.all([
        apiClient.get("/users/profile"),
        apiClient.get("/violations/me"),
      ]);

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFormData({ phone: data.phone || "", cccd: data.cccd || "", avatar: data.avatar || "" });
      }

      if (violRes.ok) {
        const vData = await violRes.json();
        if (Array.isArray(vData)) setViolations(vData);
      }
    } catch (error) {
      console.error("Lỗi tải thông tin:", error);
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
      setAlertMsg({ text: "Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 2MB.", type: "error" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, avatar: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMsg({ text: "Đang lưu...", type: "info" });
    try {
      const response = await apiClient.patch("/users/profile", formData);

      if (response.ok) {
        setAlertMsg({ text: "Cập nhật hồ sơ thành công!", type: "success" });
        loadProfile();
      } else {
        const err = await response.json();
        setAlertMsg({ text: err.message || "Lỗi cập nhật.", type: "error" });
      }
    } catch (error) {
      setAlertMsg({ text: "Không thể kết nối đến server.", type: "error" });
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-500">Đang tải hồ sơ...</div>;
  }

  return (
    <>
      <style>{`
        .profile-page-body { padding: 28px 0 48px; max-width: 900px; margin: 0 auto; width: 100%; }
        .profile-page-title { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 600; color: var(--navy); margin-bottom: 20px; }
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
        .room-badge { display: inline-block; padding: 6px 12px; background: var(--gold-dim); color: #9a7b2c; border: 1px solid var(--gold-b); border-radius: 6px; font-weight: 600; font-size: 13px; margin-top: 10px; }

        .profile-alert { padding: 14px 18px; border-radius: 12px; font-size: 13.5px; font-weight: 500; margin-bottom: 24px; border: 1px solid; }
        .profile-alert--success { background: rgba(34,197,94,.08); color: #16a34a; border-color: rgba(34,197,94,.22); }
        .profile-alert--info    { background: var(--gold-dim); color: #7A5E1A; border-color: var(--gold-b); }
        .profile-alert--error   { background: rgba(239,68,68,.08); color: #b91c1c; border-color: rgba(239,68,68,.22); }

        .behavior-card { background: var(--white); border: 1px solid var(--border); border-radius: 16px; padding: 28px; margin-top: 24px; box-shadow: 0 4px 20px rgba(13,27,42,0.03); }
        .behavior-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
        .behavior-title { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 600; color: var(--navy); }
        .behavior-sub { font-size: 13px; color: var(--muted); margin-top: 4px; max-width: 480px; line-height: 1.6; }
        .behavior-score { font-family: 'Fraunces', serif; font-size: 42px; font-weight: 700; line-height: 1; letter-spacing: -1px; white-space: nowrap; }
        .behavior-score-max { font-size: 16px; color: var(--muted); font-weight: 400; margin-left: 2px; }
        .behavior-bar { height: 10px; border-radius: 100px; background: #EDEBE6; overflow: hidden; }
        .behavior-bar-fill { height: 100%; border-radius: 100px; transition: width 0.5s ease; }
        .behavior-tier { display: inline-block; margin-top: 12px; padding: 4px 12px; border-radius: 100px; font-size: 12.5px; font-weight: 600; }
        .behavior-warning { margin-top: 18px; display: flex; align-items: flex-start; gap: 10px; padding: 14px 16px; border-radius: 12px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.22); color: #b91c1c; font-size: 13px; line-height: 1.6; }
        .behavior-warning svg { flex-shrink: 0; margin-top: 1px; }
        .behavior-list-title { margin-top: 24px; margin-bottom: 12px; font-size: 13px; font-weight: 600; color: var(--navy); text-transform: uppercase; letter-spacing: 0.04em; }
        .behavior-empty { padding: 20px; text-align: center; font-size: 13.5px; color: var(--muted); background: #F9F8F6; border: 1px dashed var(--border); border-radius: 12px; }
        .behavior-list { display: flex; flex-direction: column; gap: 10px; }
        .behavior-item { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 14px 16px; border: 1px solid var(--border); border-radius: 12px; background: #FCFBF9; }
        .behavior-item-reason { font-size: 14px; font-weight: 500; color: var(--navy); line-height: 1.4; }
        .behavior-item-time { font-size: 11.5px; color: var(--muted); margin-top: 4px; }
        .behavior-item-points { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 700; color: #dc2626; white-space: nowrap; }

        @media (max-width: 760px) {
          .profile-card { flex-direction: column; }
          .profile-left { width: 100%; border-right: none; border-bottom: 1px solid var(--border); padding: 32px 24px; }
          .profile-right { padding: 28px 24px; }
          .form-grid { grid-template-columns: 1fr; gap: 18px; }
        }
      `}</style>

      <div className="profile-page-body">
        <div className="profile-page-title">Hồ sơ cá nhân</div>

        <div className="profile-card">
          <div className="profile-left">
            <label className="avatar-wrapper">
              {formData.avatar ? (
                <img src={formData.avatar} alt="Avatar" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">{profile?.fullName?.charAt(0).toUpperCase()}</div>
              )}
              <div className="avatar-overlay">
                {CameraIcon}
                <span style={{ marginTop: "4px" }}>Đổi ảnh</span>
              </div>
              <input type="file" accept="image/*" className="hidden-input" onChange={handleImageUpload} />
            </label>

            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "20px", color: "var(--navy)", marginBottom: "4px" }}>
              {profile?.fullName}
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "16px" }}>{profile?.email}</p>

            {profile?.room ? (
              <div className="room-badge">Phòng {profile.room.name} - Tòa {profile.room.building}</div>
            ) : (
              <div className="room-badge" style={{ background: "#f1f5f9", color: "#64748b", borderColor: "#e2e8f0" }}>Chưa xếp phòng</div>
            )}
          </div>

          <form className="profile-right" onSubmit={handleSaveProfile}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--navy)", marginBottom: "24px" }}>Thông tin liên hệ</h3>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Họ và Tên</label>
                <input type="text" className="form-input" value={profile?.fullName || ""} readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">Mã số sinh viên</label>
                <input type="text" className="form-input" value={profile?.mssv || "Chưa cập nhật"} readOnly />
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

            <button type="submit" className="btn-save">Cập nhật thay đổi</button>
          </form>
        </div>

        {/* ─── ĐIỂM HÀNH VI / NỀ NẾP ─────────────────────────────── */}
        {(() => {
          const score = profile?.behaviorScore ?? 100;
          const tier =
            score >= 80
              ? { label: "Tốt", color: "#16a34a", bg: "rgba(34,197,94,0.1)" }
              : score >= 60
              ? { label: "Khá", color: "#C9A84C", bg: "rgba(201,168,76,0.14)" }
              : { label: "Cần cải thiện", color: "#dc2626", bg: "rgba(239,68,68,0.1)" };
          return (
            <div className="behavior-card">
              <div className="behavior-head">
                <div>
                  <div className="behavior-title">Điểm hành vi &amp; nề nếp</div>
                  <div className="behavior-sub">
                    Điểm khởi đầu 100. Ban quản lý sẽ trừ điểm khi bạn vi phạm nội quy ký túc xá.
                  </div>
                </div>
                <div className="behavior-score" style={{ color: tier.color }}>
                  {score}
                  <span className="behavior-score-max">/100</span>
                </div>
              </div>

              <div className="behavior-bar">
                <div
                  className="behavior-bar-fill"
                  style={{ width: `${score}%`, background: tier.color }}
                />
              </div>
              <div className="behavior-tier" style={{ color: tier.color, background: tier.bg }}>
                Xếp loại: {tier.label}
              </div>

              {score < 60 && (
                <div className="behavior-warning">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>
                    <strong>Cảnh báo:</strong> Điểm hành vi của bạn đang dưới 60. Vui lòng chấp hành nghiêm nội quy để tránh bị xử lý kỷ luật hoặc chấm dứt hợp đồng lưu trú.
                  </span>
                </div>
              )}

              <div className="behavior-list-title">Lịch sử vi phạm</div>
              {violations.length === 0 ? (
                <div className="behavior-empty">Bạn chưa có vi phạm nào. Hãy tiếp tục giữ vững nề nếp! 🎉</div>
              ) : (
                <div className="behavior-list">
                  {violations.map((v) => (
                    <div key={v._id} className="behavior-item">
                      <div className="behavior-item-main">
                        <div className="behavior-item-reason">{v.reason}</div>
                        <div className="behavior-item-time">
                          {new Date(v.createdAt).toLocaleString("vi-VN", {
                            day: "2-digit", month: "2-digit", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                          {typeof v.scoreAfter === "number" && ` · Còn ${v.scoreAfter}/100`}
                        </div>
                      </div>
                      <div className="behavior-item-points">-{v.points}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </>
  );
}