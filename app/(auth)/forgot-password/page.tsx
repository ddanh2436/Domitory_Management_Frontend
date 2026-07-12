"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/app/utils/apiClient";

// Quên mật khẩu: nhập email → backend gửi link đặt lại (hiệu lực 15 phút)
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await apiClient.post("/auth/forgot-password", { email });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Có lỗi xảy ra, vui lòng thử lại.");
      }
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi kết nối đến máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fp-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700&family=DM+Sans:wght@400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .fp-shell { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0D1B2A 0%, #182b43 60%, #253d5d 100%); padding: 20px; font-family: 'DM Sans', sans-serif; }
        .fp-card { width: 100%; max-width: 420px; background: #fff; border-radius: 12px; box-shadow: 0 24px 60px rgba(0,0,0,0.3); overflow: hidden; }
        .fp-head { padding: 26px 30px 0; }
        .fp-brand { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 700; color: #0D1B2A; }
        .fp-brand span { color: #C9A84C; }
        .fp-title { font-family: 'Fraunces', serif; font-size: 21px; font-weight: 700; color: #0D1B2A; margin-top: 20px; }
        .fp-sub { font-size: 13px; color: #64748b; line-height: 1.65; margin-top: 7px; }
        .fp-body { padding: 22px 30px 30px; }
        .fp-error { padding: 11px 14px; border-radius: 8px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); color: #b91c1c; font-size: 12.5px; margin-bottom: 16px; line-height: 1.6; }
        .fp-label { display: block; font-size: 12px; font-weight: 700; color: #0D1B2A; margin-bottom: 7px; }
        .fp-input { width: 100%; height: 44px; padding: 0 14px; border: 1px solid rgba(13,27,42,0.15); border-radius: 8px; background: #fbfaf8; color: #0D1B2A; outline: none; font-size: 13.5px; font-family: 'DM Sans', sans-serif; transition: all .15s; }
        .fp-input:focus { border-color: #C9A84C; background: #fff; box-shadow: 0 0 0 3px rgba(201,168,76,0.15); }
        .fp-btn { width: 100%; height: 46px; margin-top: 18px; border: none; border-radius: 8px; background: #0D1B2A; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: background .18s; }
        .fp-btn:hover:not(:disabled) { background: #1A2E42; }
        .fp-btn:disabled { opacity: .55; cursor: not-allowed; }
        .fp-back { display: block; width: 100%; margin-top: 14px; text-align: center; background: none; border: none; color: #64748b; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .fp-back:hover { color: #0D1B2A; }
        .fp-success { text-align: center; padding: 8px 0 4px; }
        .fp-success-icon { width: 58px; height: 58px; border-radius: 50%; background: rgba(34,197,94,0.1); color: #16a34a; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
        .fp-success-title { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 700; color: #0D1B2A; }
        .fp-success-sub { font-size: 13px; color: #64748b; line-height: 1.7; margin-top: 8px; }
        .fp-success-sub b { color: #0D1B2A; }
      `}</style>

      <div className="fp-card">
        <div className="fp-head">
          <div className="fp-brand">Dorm<span>ify</span></div>
          {!sent && (
            <>
              <div className="fp-title">Quên mật khẩu?</div>
              <div className="fp-sub">
                Nhập email đã đăng ký — chúng tôi sẽ gửi cho bạn một liên kết để đặt lại mật khẩu (hiệu lực 15 phút).
              </div>
            </>
          )}
        </div>

        <div className="fp-body">
          {sent ? (
            <div className="fp-success">
              <div className="fp-success-icon">
                <svg width="26" height="26" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="fp-success-title">Kiểm tra hộp thư của bạn</div>
              <div className="fp-success-sub">
                Nếu email <b>{email}</b> đã đăng ký, liên kết đặt lại mật khẩu vừa được gửi đến.
                <br />Nhớ kiểm tra cả mục <b>Spam</b> nhé.
              </div>
              <button type="button" className="fp-btn" style={{ marginTop: 22 }} onClick={() => router.push("/login")}>
                Về trang đăng nhập
              </button>
              <button type="button" className="fp-back" onClick={() => { setSent(false); setEmail(""); }}>
                Gửi lại với email khác
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="fp-error">{error}</div>}
              <label className="fp-label" htmlFor="fp-email">Email đã đăng ký</label>
              <input
                id="fp-email"
                type="email"
                className="fp-input"
                placeholder="Ví dụ: student@dormify.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <button type="submit" className="fp-btn" disabled={isLoading}>
                {isLoading ? "Đang gửi..." : "Gửi liên kết đặt lại"}
              </button>
              <button type="button" className="fp-back" onClick={() => router.push("/login")}>
                ← Trở về trang Đăng nhập
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
