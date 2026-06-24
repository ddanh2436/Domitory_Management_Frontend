"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";
import { getDashboardPath, getLoggedInUser } from "@/app/utils/auth";
import { FaUser, FaIdCard, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

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

// ─── Field Component ──────────────────────────────────────────────────────────
function Field({
  label, icon, error, children,
}: {
  label: string; icon: React.ReactNode; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="ap-field">
      <label className="ap-field-label">{label}</label>
      <div className="ap-field-wrap">
        <span className="ap-field-icon">{icon}</span>
        {children}
      </div>
      {error && <span className="ap-field-error">{error}</span>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const router = useRouter();

  // ── UI state ──
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ── Register form state ──
  const [formData, setFormData] = useState({ fullName: "", mssv: "", email: "", password: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "", confirmPassword: "" });

  // ── Login form state ──
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const switchTab = (t: "login" | "register") => {
    setTab(t);
    setMessage(null);
  };

  // ── Register field handlers (same logic as original) ──
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData({ ...formData, email: val });
    setFieldErrors((p) => ({
      ...p,
      email: val.length > 0 && !val.includes("@") ? "Email phải chứa ký tự @" : "",
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData({ ...formData, password: val });
    setFieldErrors((p) => ({
      ...p,
      password: val.length > 0 && val.length < 8 ? "Mật khẩu phải có ít nhất 8 ký tự" : "",
      confirmPassword:
        confirmPassword.length > 0
          ? val !== confirmPassword ? "Mật khẩu nhập lại không khớp!" : ""
          : p.confirmPassword,
    }));
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setConfirmPassword(val);
    setFieldErrors((p) => ({
      ...p,
      confirmPassword: val.length > 0 && val !== formData.password ? "Mật khẩu nhập lại không khớp!" : "",
    }));
  };

  // ── Register submit (same logic as original) ──
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fieldErrors.email || fieldErrors.password || fieldErrors.confirmPassword ||
      formData.password.length < 8 || !formData.email.includes("@")) {
      setMessage({ type: "error", text: "Vui lòng sửa các lỗi hiển thị trước khi tiếp tục!" });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Có lỗi xảy ra từ máy chủ.");
      setMessage({ type: "success", text: "Đăng ký thành công! Đang chuyển hướng..." });
      setTimeout(() => switchTab("login"), 1500);
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Có lỗi xảy ra." });
    } finally {
      setLoading(false);
    }
  };

  // ── Login submit (same logic as original) ──
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Sai thông tin đăng nhập.");
      localStorage.setItem("token", data.access_token);
      const user = getLoggedInUser();
      if (user) router.push(getDashboardPath(user.role));
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Sai thông tin đăng nhập." });
    } finally {
      setLoading(false);
    }
  };

  // ── Google login (same logic as original) ──
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setMessage({ type: "error", text: "Không nhận được thông tin xác thực từ Google." });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("http://localhost:3001/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi đăng nhập Google từ server.");
      localStorage.setItem("token", data.access_token);
      const user = getLoggedInUser();
      if (user) router.push(getDashboardPath(user.role));
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Lỗi đăng nhập Google." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;1,9..144,400&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --navy:     #0D1B2A;
          --navy-md:  #1A2E42;
          --gold:     #C9A84C;
          --gold-dim: rgba(201,168,76,0.15);
          --gold-b:   rgba(201,168,76,0.22);
          --white:    #ffffff;
          --muted:    #8A9BAD;
          --border:   rgba(13,27,42,0.1);
          --bg-input: #FAFAF9;
          --field-gap:14px;
        }

        /* ── PAGE ── */
        .ap-page {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          font-family: 'DM Sans', sans-serif;
          padding: 24px;
          position: relative; overflow: hidden;
        }
        .ap-page::before {
          content: '';
          position: absolute; inset: 0; z-index: 0;
          background-image: url('/auth_bg.jpg');
          background-size: cover; background-position: center;
          filter: blur(8px) brightness(0.55);
          transform: scale(1.06);
        }

        /* ── CARD ── */
        .ap-card {
          position: relative; z-index: 1;
          display: flex; align-items: stretch;
          background: var(--white);
          border-radius: 22px;
          overflow: hidden;
          width: 900px; max-width: 100%;
          min-height: 600px;
          box-shadow: 0 28px 64px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.2);
        }

        /* ── LEFT PANEL ── */
        .ap-left {
          width: 46%; flex-shrink: 0;
          background: var(--navy);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 48px 36px;
          position: relative; overflow: hidden;
        }
        .ap-left-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(201,168,76,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,.04) 1px, transparent 1px);
          background-size: 44px 44px;
          pointer-events: none;
        }
        .ap-left-glow {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 90% 60% at 50% 105%, rgba(201,168,76,.14) 0%, transparent 65%);
          pointer-events: none;
        }
        .ap-left-content { position: relative; z-index: 1; text-align: center; width: 100%; }

        .ap-left-brand {
          display: flex; align-items: center; gap: 10px; justify-content: center;
          margin-bottom: 36px; text-decoration: none;
        }
        .ap-left-wordmark {
          font-family: 'Fraunces', serif;
          font-size: 28px; font-weight: 700; color: var(--white); letter-spacing: -0.3px;
        }
        .ap-left-wordmark span { color: var(--gold); }

        .ap-left-headline {
          font-family: 'Fraunces', serif;
          font-size: 24px; font-weight: 700; color: var(--white);
          line-height: 1.25; margin-bottom: 14px; letter-spacing: -0.3px;
        }
        .ap-left-headline em { color: var(--gold); font-style: italic; }
        .ap-left-sub {
          font-size: 13px; font-weight: 300;
          color: rgba(255,255,255,.45); line-height: 1.7;
          margin-bottom: 32px; max-width: 280px; margin-left: auto; margin-right: auto;
        }

        .ap-features { display: flex; flex-direction: column; gap: 10px; }
        .ap-feature {
          display: flex; align-items: center; gap: 11px;
          background: rgba(255,255,255,.05);
          border: 1px solid var(--gold-b);
          border-radius: 11px; padding: 12px 16px; text-align: left;
        }
        .ap-feature-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(201,168,76,.15);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; color: var(--gold); font-size: 14px;
        }
        .ap-feature-text { font-size: 12.5px; color: rgba(255,255,255,.6); }

        /* ── RIGHT PANEL ── */
        .ap-right {
          flex: 1; padding: 44px 40px;
          display: flex; flex-direction: column; justify-content: center;
          overflow-y: auto;
        }

        /* ── TAB SWITCHER ── */
        .ap-tabs {
          display: flex; gap: 0;
          background: #F5F3EF; border-radius: 11px; padding: 4px;
          margin-bottom: 28px;
        }
        .ap-tab {
          flex: 1; text-align: center; padding: 9px 12px;
          border-radius: 8px; font-size: 13.5px; font-weight: 500;
          cursor: pointer; color: var(--muted);
          transition: all .2s; border: none; background: transparent;
          font-family: 'DM Sans', sans-serif;
        }
        .ap-tab:hover { color: var(--navy); }
        .ap-tab--active {
          background: var(--white); color: var(--navy);
          box-shadow: 0 1px 6px rgba(13,27,42,.1);
        }

        .ap-form-title {
          font-family: 'Fraunces', serif;
          font-size: 22px; font-weight: 700; color: var(--navy);
          letter-spacing: -0.3px; margin-bottom: 5px;
        }
        .ap-form-sub { font-size: 13px; color: var(--muted); margin-bottom: 22px; }

        /* ── MESSAGE ── */
        .ap-message {
          padding: 10px 14px; border-radius: 9px;
          font-size: 13px; font-weight: 500;
          margin-bottom: 16px; display: flex; align-items: flex-start; gap: 8px;
        }
        .ap-message--success { background: rgba(34,197,94,.1); color: #16a34a; border: 1px solid rgba(34,197,94,.2); }
        .ap-message--error   { background: rgba(220,38,38,.08); color: #b91c1c; border: 1px solid rgba(220,38,38,.18); }

        /* ── FIELDS ── */
        .ap-field { margin-bottom: var(--field-gap); }
        .ap-field-label {
          display: block; font-size: 12px; font-weight: 500;
          color: var(--navy); margin-bottom: 5px; letter-spacing: .01em;
        }
        .ap-field-wrap { position: relative; display: flex; align-items: center; }
        .ap-field-icon {
          position: absolute; left: 13px; color: #B0BCC8;
          display: flex; align-items: center; font-size: 14px; pointer-events: none;
        }
        .ap-field-wrap input {
          width: 100%; padding: 10px 14px 10px 38px;
          border: 1px solid var(--border); border-radius: 9px;
          font-family: 'DM Sans', sans-serif; font-size: 13.5px;
          color: var(--navy); background: var(--bg-input); outline: none;
          transition: border-color .15s, background .15s;
        }
        .ap-field-wrap input:focus { border-color: var(--gold); background: var(--white); }
        .ap-field-wrap input::placeholder { color: #C2CDD6; }
        .ap-field-wrap input.ap-input--error { border-color: #ef4444; }
        .ap-field-error { font-size: 11.5px; color: #dc2626; font-weight: 500; margin-top: 4px; display: block; }
        .ap-eye {
          position: absolute; right: 13px; color: #B0BCC8;
          cursor: pointer; display: flex; padding: 4px; font-size: 14px;
          transition: color .15s;
        }
        .ap-eye:hover { color: var(--navy); }

        /* ── 2-COL GRID ── */
        .ap-field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        /* ── FORGOT ── */
        .ap-forgot {
          display: block; text-align: right;
          font-size: 12.5px; color: var(--muted);
          text-decoration: none; margin-top: -8px; margin-bottom: 18px;
          transition: color .15s;
        }
        .ap-forgot:hover { color: var(--gold); }

        /* ── SUBMIT BUTTON ── */
        .ap-btn {
          width: 100%; padding: 12px;
          background: var(--navy); color: var(--white);
          border: none; border-radius: 10px; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
          transition: background .18s, transform .1s, box-shadow .18s;
          display: flex; align-items: center; justify-content: center; gap: 7px;
        }
        .ap-btn:hover { background: var(--navy-md); box-shadow: 0 6px 18px rgba(13,27,42,.22); transform: translateY(-1px); }
        .ap-btn:active { transform: scale(.98); }
        .ap-btn:disabled { opacity: .55; cursor: not-allowed; transform: none; box-shadow: none; }

        /* ── SEPARATOR ── */
        .ap-sep {
          display: flex; align-items: center; gap: 12px;
          margin: 18px 0 16px;
        }
        .ap-sep hr { flex: 1; border: none; border-top: 1px solid var(--border); }
        .ap-sep span { font-size: 12px; color: #B0BCC8; white-space: nowrap; }

        /* ── GOOGLE ── */
        .ap-google-wrap { display: flex; justify-content: center; }

        /* ── RESPONSIVE ── */
        @media (max-width: 760px) {
          .ap-card { flex-direction: column; min-height: unset; }
          .ap-left { width: 100%; padding: 36px 28px; }
          .ap-left-headline { font-size: 20px; }
          .ap-features { display: none; }
          .ap-right { padding: 28px 24px; }
          .ap-field-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .ap-page { padding: 12px; }
          .ap-card { border-radius: 16px; }
        }
      `}</style>

      <div className="ap-page">
        <div className="ap-card">

          {/* ── Left Panel ─────────────────────────────────────────────── */}
          <div className="ap-left">
            <div className="ap-left-grid" />
            <div className="ap-left-glow" />
            <div className="ap-left-content">

              <Link href="/" className="ap-left-brand">
                <DormifyLogoMark size={34} />
                <span className="ap-left-wordmark">
                  Dorm<span>ify</span>
                </span>
              </Link>

              <h2 className="ap-left-headline">
                Hệ thống lưu trú<br />
                <em>thế hệ mới</em>
              </h2>
              <p className="ap-left-sub">
                Nền tảng quản lý ký túc xá toàn diện dành cho sinh viên HCMUS — từ đặt phòng đến thanh toán.
              </p>

              <div className="ap-features">
                <div className="ap-feature">
                  <div className="ap-feature-icon">🏠</div>
                  <span className="ap-feature-text">Đặt phòng trực tuyến nhanh chóng</span>
                </div>
                <div className="ap-feature">
                  <div className="ap-feature-icon">💡</div>
                  <span className="ap-feature-text">Theo dõi hóa đơn điện nước minh bạch</span>
                </div>
                <div className="ap-feature">
                  <div className="ap-feature-icon">🔧</div>
                  <span className="ap-feature-text">Hỗ trợ bảo trì &amp; sửa chữa 24/7</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Panel ────────────────────────────────────────────── */}
          <div className="ap-right">

            {/* Tab switcher */}
            <div className="ap-tabs">
              <button
                type="button"
                className={`ap-tab ${tab === "login" ? "ap-tab--active" : ""}`}
                onClick={() => switchTab("login")}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                className={`ap-tab ${tab === "register" ? "ap-tab--active" : ""}`}
                onClick={() => switchTab("register")}
              >
                Đăng ký
              </button>
            </div>

            {/* ── LOGIN FORM ────────────────────────────────────────── */}
            {tab === "login" && (
              <form onSubmit={handleLoginSubmit}>
                <div className="ap-form-title">Chào mừng trở lại!</div>
                <div className="ap-form-sub">Nhập thông tin để truy cập tài khoản Dormify</div>

                {message && (
                  <div className={`ap-message ap-message--${message.type}`}>{message.text}</div>
                )}

                <div className="ap-field">
                  <label className="ap-field-label">Địa chỉ email</label>
                  <div className="ap-field-wrap">
                    <span className="ap-field-icon"><FaEnvelope /></span>
                    <input
                      type="email" required placeholder="example@hcmus.edu.vn"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="ap-field">
                  <label className="ap-field-label">Mật khẩu</label>
                  <div className="ap-field-wrap">
                    <span className="ap-field-icon"><FaLock /></span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required placeholder="Nhập mật khẩu"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={loading}
                    />
                    <span className="ap-eye" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                </div>

                <a href="#" className="ap-forgot">Quên mật khẩu?</a>

                <button type="submit" className="ap-btn" disabled={loading}>
                  {loading ? "Đang xử lý…" : "Đăng nhập"}
                </button>

                <div className="ap-sep">
                  <hr /><span>Hoặc tiếp tục với</span><hr />
                </div>

                <div className="ap-google-wrap">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setMessage({ type: "error", text: "Cửa sổ đăng nhập Google bị lỗi" })}
                  />
                </div>
              </form>
            )}

            {/* ── REGISTER FORM ─────────────────────────────────────── */}
            {tab === "register" && (
              <form onSubmit={handleRegisterSubmit}>
                <div className="ap-form-title">Tạo tài khoản mới</div>
                <div className="ap-form-sub">Điền thông tin để đăng ký lưu trú tại Dormify</div>

                {message && (
                  <div className={`ap-message ap-message--${message.type}`}>{message.text}</div>
                )}

                {/* Row 1: Họ tên + MSSV */}
                <div className="ap-field-grid">
                  <div className="ap-field">
                    <label className="ap-field-label">Họ và tên</label>
                    <div className="ap-field-wrap">
                      <span className="ap-field-icon"><FaUser /></span>
                      <input
                        name="fullName" type="text" required placeholder="Nguyễn Văn A"
                        value={formData.fullName} onChange={handleChange} disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="ap-field">
                    <label className="ap-field-label">MSSV (Tùy chọn)</label>
                    <div className="ap-field-wrap">
                      <span className="ap-field-icon"><FaIdCard /></span>
                      <input
                        name="mssv" type="text" placeholder="22120001"
                        value={formData.mssv} onChange={handleChange} disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="ap-field">
                  <label className="ap-field-label">Địa chỉ email</label>
                  <div className="ap-field-wrap">
                    <span className="ap-field-icon"><FaEnvelope /></span>
                    <input
                      name="email" type="email" required placeholder="example@hcmus.edu.vn"
                      value={formData.email} onChange={handleEmailChange} disabled={loading}
                      className={fieldErrors.email ? "ap-input--error" : ""}
                    />
                  </div>
                  {fieldErrors.email && <span className="ap-field-error">{fieldErrors.email}</span>}
                </div>

                {/* Row 2: Password + Confirm */}
                <div className="ap-field-grid">
                  <div className="ap-field">
                    <label className="ap-field-label">Mật khẩu</label>
                    <div className="ap-field-wrap">
                      <span className="ap-field-icon"><FaLock /></span>
                      <input
                        name="password" type={showPassword ? "text" : "password"}
                        required placeholder="Ít nhất 8 ký tự"
                        value={formData.password} onChange={handlePasswordChange} disabled={loading}
                        className={fieldErrors.password ? "ap-input--error" : ""}
                      />
                      <span className="ap-eye" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </span>
                    </div>
                    {fieldErrors.password && <span className="ap-field-error">{fieldErrors.password}</span>}
                  </div>
                  <div className="ap-field">
                    <label className="ap-field-label">Nhập lại mật khẩu</label>
                    <div className="ap-field-wrap">
                      <span className="ap-field-icon"><FaLock /></span>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required placeholder="Nhập lại"
                        value={confirmPassword} onChange={handleConfirmPasswordChange} disabled={loading}
                        className={fieldErrors.confirmPassword ? "ap-input--error" : ""}
                      />
                      <span className="ap-eye" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </span>
                    </div>
                    {fieldErrors.confirmPassword && <span className="ap-field-error">{fieldErrors.confirmPassword}</span>}
                  </div>
                </div>

                <button type="submit" className="ap-btn" disabled={loading} style={{ marginTop: 4 }}>
                  {loading ? "Đang xử lý…" : "Tạo tài khoản"}
                </button>

                <div className="ap-sep">
                  <hr /><span>Hoặc tiếp tục với</span><hr />
                </div>

                <div className="ap-google-wrap">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setMessage({ type: "error", text: "Cửa sổ đăng nhập Google bị lỗi" })}
                  />
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    </>
  );
}