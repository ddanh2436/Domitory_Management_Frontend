"use client";

import React, { useState } from "react";
import Link from "next/link"; // Đảm bảo đã import Link
import { useRouter } from "next/navigation";
import { GoogleLogin } from '@react-oauth/google';
import { getDashboardPath, getLoggedInUser } from "@/app/utils/auth";
import { FaUser, FaIdCard, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import "./AuthPage.css"; 

// ─── Component Logo Đã Được Căn Chỉnh Lại ──────────────────────────────────
function DormifyLogoMark({ size = 75 }: { size?: number }) {
  return (
    <img 
      src="/Dormify.png" 
      alt="Dormify Logo" 
      width={size} 
      height={size} 
      // translate-y-1 giúp dịch ảnh xuống 4px để ngang hàng với text
      className="translate-y-1" 
      style={{ objectFit: "contain" }}
    />
  );
}

export default function AuthPage() {
  const router = useRouter();
  
  // Trạng thái giao diện
  const [isRegisterActive, setIsRegisterActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ─── STATE ĐĂNG KÝ VÀ VALIDATION ───
  const [formData, setFormData] = useState({
    fullName: "",
    mssv: "",
    email: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // State lưu lỗi realtime cho các trường
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData({ ...formData, email: val });

    if (val.length > 0 && !val.includes("@")) {
      setFieldErrors(prev => ({ ...prev, email: "Email phải chứa ký tự @" }));
    } else {
      setFieldErrors(prev => ({ ...prev, email: "" }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData({ ...formData, password: val });

    if (val.length > 0 && val.length < 8) {
      setFieldErrors(prev => ({ ...prev, password: "Mật khẩu phải có ít nhất 8 ký tự" }));
    } else {
      setFieldErrors(prev => ({ ...prev, password: "" }));
    }

    if (confirmPassword.length > 0) {
      if (val !== confirmPassword) {
        setFieldErrors(prev => ({ ...prev, confirmPassword: "Mật khẩu nhập lại không khớp!" }));
      } else {
        setFieldErrors(prev => ({ ...prev, confirmPassword: "" }));
      }
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setConfirmPassword(val);

    if (val.length > 0 && val !== formData.password) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: "Mật khẩu nhập lại không khớp!" }));
    } else {
      setFieldErrors(prev => ({ ...prev, confirmPassword: "" }));
    }
  };

  // ─── STATE ĐĂNG NHẬP ───
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const toggleForm = (isRegister: boolean) => {
    setIsRegisterActive(isRegister);
    setMessage(null);
  };

  // ─── XỬ LÝ SUBMIT ĐĂNG KÝ ───
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (fieldErrors.email || fieldErrors.password || fieldErrors.confirmPassword || formData.password.length < 8 || !formData.email.includes("@")) {
      setMessage({ type: "error", text: "Vui lòng sửa các lỗi hiển thị màu đỏ trước khi tiếp tục!" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Có lỗi xảy ra từ máy chủ.");
      }

      setMessage({ type: "success", text: "Đăng ký thành công! Đang chuyển hướng..." });
      
      setTimeout(() => {
        toggleForm(false);
      }, 1500);

    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  // ─── XỬ LÝ SUBMIT ĐĂNG NHẬP ───
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Sai thông tin đăng nhập.");

      localStorage.setItem("token", data.access_token);
      
      const user = getLoggedInUser();
      if (user) {
        router.push(getDashboardPath(user.role));
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  // ─── XỬ LÝ ĐĂNG NHẬP GOOGLE ───
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("http://localhost:3001/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Lỗi đăng nhập Google từ server.");

      localStorage.setItem("token", data.access_token);
      
      const user = getLoggedInUser();
      if (user) {
        router.push(getDashboardPath(user.role));
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className={`auth-container ${isRegisterActive ? "register-active" : ""}`}>
        
        {/* ================= FORM ĐĂNG KÝ ================= */}
        <div className="form-container sign-up-container">
          <form onSubmit={handleRegisterSubmit}>
            
            {/* Logo Clickable & Align Fix */}
            <Link href="/" className="flex items-center justify-center gap-2 w-full mb-3 cursor-pointer hover:opacity-80 transition-opacity no-underline">
              <DormifyLogoMark size={75} />
              <span className="font-serif text-4xl font-bold text-black tracking-tight mt-1">
                Dorm<span className="text-[#C9A84C]">ify</span>
              </span>
            </Link>

            <h1 className="text-xl mb-2">Tạo tài khoản</h1>
            
            {message && isRegisterActive && (
              <div className={message.type === 'success' ? 'text-green-600 font-semibold mb-2 text-sm' : 'error-message api-error'}>
                {message.text}
              </div>
            )}

            <div className="input-group mt-2">
              <FaUser />
              <input
                name="fullName"
                type="text"
                required
                placeholder="Họ và tên"
                value={formData.fullName}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            
            <div className="input-group">
              <FaIdCard />
              <input
                name="mssv"
                type="text"
                placeholder="Mã số sinh viên (Tùy chọn)"
                value={formData.mssv}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            
            <div className="input-group" style={{ marginBottom: fieldErrors.email ? "5px" : "15px" }}>
              <FaEnvelope />
              <input
                name="email"
                type="email"
                required
                placeholder="Địa chỉ Email"
                value={formData.email}
                onChange={handleEmailChange}
                disabled={loading}
                className={fieldErrors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
              />
            </div>
            {fieldErrors.email && (
              <div className="text-red-500 text-xs font-semibold text-left w-full pl-2 mb-3 mt-[-5px]">
                {fieldErrors.email}
              </div>
            )}
            
            <div className="input-group" style={{ marginBottom: fieldErrors.password ? "5px" : "15px" }}>
              <FaLock />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Mật khẩu (Ít nhất 8 ký tự)"
                value={formData.password}
                onChange={handlePasswordChange}
                disabled={loading}
                className={fieldErrors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
              />
              <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {fieldErrors.password && (
              <div className="text-red-500 text-xs font-semibold text-left w-full pl-2 mb-3 mt-[-5px]">
                {fieldErrors.password}
              </div>
            )}

            <div className="input-group" style={{ marginBottom: fieldErrors.confirmPassword ? "5px" : "15px" }}>
              <FaLock />
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                placeholder="Nhập lại Mật khẩu"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                disabled={loading}
                className={fieldErrors.confirmPassword ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
              />
              <span className="eye-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {fieldErrors.confirmPassword && (
              <div className="text-red-500 text-xs font-semibold text-left w-full pl-2 mb-3 mt-[-5px]">
                {fieldErrors.confirmPassword}
              </div>
            )}
            
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? "Đang xử lý..." : "Đăng Ký"}
            </button>
          </form>
        </div>

        {/* ================= FORM ĐĂNG NHẬP ================= */}
        <div className="form-container sign-in-container">
          <form onSubmit={handleLoginSubmit}>
            
            {/* Logo Clickable & Align Fix */}
            <Link href="/" className="flex items-center justify-center gap-2 w-full mb-4 cursor-pointer hover:opacity-80 transition-opacity no-underline">
              <DormifyLogoMark size={75} />
              <span className="font-serif text-4xl font-bold text-black tracking-tight mt-1">
                Dorm<span className="text-[#C9A84C]">ify</span>
              </span>
            </Link>
            
            <h1 className="mb-4 text-2xl">Đăng nhập</h1>
            
            {message && !isRegisterActive && (
              <div className={message.type === 'success' ? 'text-green-600 font-semibold mb-2 text-sm' : 'error-message api-error'}>
                {message.text}
              </div>
            )}

            <div className="input-group mt-2">
              <FaEnvelope />
              <input
                type="email"
                placeholder="Địa chỉ Email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="input-group">
              <FaLock />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                disabled={loading}
              />
              <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            
            <a href="#" className="forgot-password">
              Quên mật khẩu?
            </a>
            
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? "Đang xử lý..." : "Đăng Nhập"}
            </button>
            
            <div className="form-separator">
              <span>Hoặc tiếp tục với</span>
            </div>
            
            <div className="social-container w-full flex justify-center mt-0">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setMessage({ type: "error", text: "Cửa sổ đăng nhập Google bị lỗi" })}
              />
            </div>
          </form>
        </div>

        {/* ================= PHẦN OVERLAY (BẢNG TRƯỢT) ================= */}
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>Chào mừng!</h1>
              <p>Để tiếp tục công việc quản lý, vui lòng đăng nhập bằng tài khoản của bạn</p>
              <button type="button" className="ghost-button" onClick={() => toggleForm(false)}>
                Đăng nhập
              </button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>Xin chào!</h1>
              <p>Trải nghiệm hệ thống quản lý ký túc xá Dormify thông minh và tiện lợi</p>
              <button type="button" className="ghost-button" onClick={() => toggleForm(true)}>
                Đăng ký ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}