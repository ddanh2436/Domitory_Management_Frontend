"use client";

import { useState } from "react";
import { useToast } from "./ToastProvider";
import { apiClient } from "../utils/apiClient";

// Form đổi mật khẩu dùng chung cho student/staff/admin — mỗi khu vực chỉ cần
// bọc component này trong layout/card riêng của mình.
export default function ChangePasswordForm() {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới nhập lại không khớp.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.patch("/users/change-password", {
        currentPassword,
        newPassword,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Đổi mật khẩu thành công.");
        resetForm();
      } else {
        toast.error(data.message || "Không đổi được mật khẩu.");
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        .cpf-field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
        .cpf-label { font-size: 12.5px; font-weight: 500; color: var(--muted, #8A9BAD); text-transform: uppercase; letter-spacing: 0.05em; }
        .cpf-input { padding: 12px 16px; border: 1px solid var(--border, rgba(13,27,42,0.09)); border-radius: 8px; font-family: inherit; font-size: 14px; color: var(--navy, #0D1B2A); background: #F9F8F6; outline: none; transition: all 0.2s; }
        .cpf-input:focus { border-color: var(--gold, #C9A84C); background: var(--white, #ffffff); box-shadow: 0 0 0 3px var(--gold-dim, rgba(201,168,76,0.15)); }
        .cpf-hint { font-size: 12px; color: var(--muted, #8A9BAD); margin-top: -4px; }
        .cpf-submit { padding: 12px 24px; background: var(--navy, #0D1B2A); color: var(--gold, #C9A84C); font-size: 14px; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; transition: background 0.2s; width: 100%; }
        .cpf-submit:hover:not(:disabled) { background: #162a3f; }
        .cpf-submit:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
      <form onSubmit={handleSubmit}>
        <div className="cpf-field">
          <label className="cpf-label" htmlFor="cpf-current">Mật khẩu hiện tại</label>
          <input
            id="cpf-current"
            type="password"
            className="cpf-input"
            placeholder="Nhập mật khẩu hiện tại"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <div className="cpf-field">
          <label className="cpf-label" htmlFor="cpf-new">Mật khẩu mới</label>
          <input
            id="cpf-new"
            type="password"
            className="cpf-input"
            placeholder="Tối thiểu 6 ký tự"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>
        <div className="cpf-field">
          <label className="cpf-label" htmlFor="cpf-confirm">Nhập lại mật khẩu mới</label>
          <input
            id="cpf-confirm"
            type="password"
            className="cpf-input"
            placeholder="Nhập lại để xác nhận"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
          <div className="cpf-hint">Sau khi đổi thành công, hãy dùng mật khẩu mới ở lần đăng nhập tiếp theo.</div>
        </div>
        <button type="submit" className="cpf-submit" disabled={submitting}>
          {submitting ? "Đang xử lý..." : "Đổi mật khẩu"}
        </button>
      </form>
    </>
  );
}
