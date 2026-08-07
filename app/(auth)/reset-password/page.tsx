"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/app/utils/apiClient";

// Trang đích của link trong email: nhập mật khẩu mới với token trên URL
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Giữ token trong state rồi xóa khỏi URL ngay — token không nằm lại
  // trong lịch sử trình duyệt / thanh địa chỉ sau khi trang đã tải.
  const [token] = useState(() => searchParams.get("token") || "");

  useEffect(() => {
    if (searchParams.get("token")) {
      router.replace("/reset-password", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post("/auth/reset-password", { token, newPassword });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Có lỗi xảy ra, vui lòng thử lại.");
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi kết nối đến máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rp-card">
      <div className="rp-head">
        <div className="rp-brand">Dorm<span>ify</span></div>
        <div className="rp-title">{success ? "Hoàn tất!" : "Đặt lại mật khẩu"}</div>
        {!success && (
          <div className="rp-sub">Nhập mật khẩu mới cho tài khoản của bạn (tối thiểu 6 ký tự).</div>
        )}
      </div>

      <div className="rp-body">
        {success ? (
          <div className="rp-success">
            <div className="rp-success-icon">
              <svg width="26" height="26" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="rp-success-sub">
              Mật khẩu đã được đặt lại thành công!<br />Đang chuyển về trang đăng nhập...
            </div>
          </div>
        ) : !token ? (
          <div className="rp-error">
            Liên kết không hợp lệ — thiếu mã đặt lại mật khẩu. Vui lòng dùng đúng liên kết trong email, hoặc{" "}
            <button type="button" className="rp-link" onClick={() => router.push("/forgot-password")}>
              yêu cầu liên kết mới
            </button>.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="rp-error">{error}</div>}
            <label className="rp-label" htmlFor="rp-pass">Mật khẩu mới</label>
            <input
              id="rp-pass"
              type="password"
              className="rp-input"
              placeholder="Tối thiểu 6 ký tự"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              autoFocus
            />
            <label className="rp-label" htmlFor="rp-confirm" style={{ marginTop: 15 }}>Nhập lại mật khẩu mới</label>
            <input
              id="rp-confirm"
              type="password"
              className="rp-input"
              placeholder="Nhập lại để xác nhận"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
            <button type="submit" className="rp-btn" disabled={isLoading}>
              {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </button>
            <button type="button" className="rp-back" onClick={() => router.push("/login")}>
              ← Trở về trang Đăng nhập
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="rp-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700&family=DM+Sans:wght@400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .rp-shell { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0D1B2A 0%, #182b43 60%, #253d5d 100%); padding: 20px; font-family: 'DM Sans', sans-serif; }
        .rp-card { width: 100%; max-width: 420px; background: #fff; border-radius: 12px; box-shadow: 0 24px 60px rgba(0,0,0,0.3); overflow: hidden; }
        .rp-head { padding: 26px 30px 0; }
        .rp-brand { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 20px; font-weight: 700; color: #0D1B2A; }
        .rp-brand span { color: #C9A84C; }
        .rp-title { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 21px; font-weight: 700; color: #0D1B2A; margin-top: 20px; }
        .rp-sub { font-size: 13px; color: #64748b; line-height: 1.65; margin-top: 7px; }
        .rp-body { padding: 22px 30px 30px; }
        .rp-error { padding: 11px 14px; border-radius: 8px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); color: #b91c1c; font-size: 12.5px; margin-bottom: 16px; line-height: 1.7; }
        .rp-link { background: none; border: none; color: #2563eb; font-size: 12.5px; font-weight: 600; cursor: pointer; padding: 0; font-family: inherit; text-decoration: underline; }
        .rp-label { display: block; font-size: 12px; font-weight: 700; color: #0D1B2A; margin-bottom: 7px; }
        .rp-input { width: 100%; height: 44px; padding: 0 14px; border: 1px solid rgba(13,27,42,0.15); border-radius: 8px; background: #fbfaf8; color: #0D1B2A; outline: none; font-size: 13.5px; font-family: 'DM Sans', sans-serif; transition: all .15s; }
        .rp-input:focus { border-color: #C9A84C; background: #fff; box-shadow: 0 0 0 3px rgba(201,168,76,0.15); }
        .rp-btn { width: 100%; height: 46px; margin-top: 20px; border: none; border-radius: 8px; background: #0D1B2A; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: background .18s; }
        .rp-btn:hover:not(:disabled) { background: #1A2E42; }
        .rp-btn:disabled { opacity: .55; cursor: not-allowed; }
        .rp-back { display: block; width: 100%; margin-top: 14px; text-align: center; background: none; border: none; color: #64748b; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .rp-back:hover { color: #0D1B2A; }
        .rp-success { text-align: center; padding: 10px 0 6px; }
        .rp-success-icon { width: 58px; height: 58px; border-radius: 50%; background: rgba(34,197,94,0.1); color: #16a34a; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
        .rp-success-sub { font-size: 13.5px; color: #475569; line-height: 1.8; }
      `}</style>
      <Suspense fallback={<div className="rp-card"><div className="rp-body" style={{ textAlign: "center", color: "#64748b", fontSize: 13.5 }}>Đang tải...</div></div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
