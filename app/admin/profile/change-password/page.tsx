"use client";

import Link from "next/link";
import ChangePasswordForm from "../../../components/ChangePasswordForm";

export default function AdminChangePasswordPage() {
  return (
    <div className="w-full max-w-xl mx-auto font-sans text-slate-800">
      <style>{`
        .cpp-back { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #8A9BAD; text-decoration: none; margin-bottom: 14px; }
        .cpp-back:hover { color: #0D1B2A; }
        .cpp-page-title { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 20px; font-weight: 700; color: #0D1B2A; margin-bottom: 4px; }
        .cpp-page-sub { font-size: 13.5px; color: #8A9BAD; margin-bottom: 20px; line-height: 1.6; }
        .cpp-card { background: #ffffff; border: 1px solid rgba(13,27,42,0.09); border-radius: 12px; padding: 28px; }
      `}</style>

      <Link href="/admin/profile" className="cpp-back">← Quay lại hồ sơ cá nhân</Link>
      <div className="cpp-page-title">Đổi mật khẩu</div>
      <div className="cpp-page-sub">Nhập mật khẩu hiện tại và mật khẩu mới để cập nhật cho tài khoản của bạn.</div>
      <div className="cpp-card">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
