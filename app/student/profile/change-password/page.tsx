"use client";

import Link from "next/link";
import ChangePasswordForm from "../../../components/ChangePasswordForm";

export default function StudentChangePasswordPage() {
  return (
    <>
      <style>{`
        .cpp-page-body { padding: 28px 0 48px; max-width: 520px; margin: 0 auto; width: 100%; }
        .cpp-back { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--muted); text-decoration: none; margin-bottom: 14px; }
        .cpp-back:hover { color: var(--navy); }
        .cpp-page-title { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 18px; font-weight: 600; color: var(--navy); margin-bottom: 4px; }
        .cpp-page-sub { font-size: 13.5px; color: var(--muted); margin-bottom: 20px; line-height: 1.6; }
        .cpp-card { background: var(--white); border: 1px solid var(--border); border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(13,27,42,0.03); }
      `}</style>

      <div className="cpp-page-body">
        <Link href="/student/profile" className="cpp-back">← Quay lại hồ sơ cá nhân</Link>
        <div className="cpp-page-title">Đổi mật khẩu</div>
        <div className="cpp-page-sub">Nhập mật khẩu hiện tại và mật khẩu mới để cập nhật cho tài khoản của bạn.</div>
        <div className="cpp-card">
          <ChangePasswordForm />
        </div>
      </div>
    </>
  );
}
