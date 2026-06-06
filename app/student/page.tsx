"use client";

import { useEffect, useState } from "react";
import RoleGuard from "../components/RoleGuard";

export default function StudentDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:3001/api/users/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (error) {
        console.error("Lỗi lấy thông tin profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <RoleGuard allowedRoles={["STUDENT"]}>
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md border border-slate-100 p-6">
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Thông tin Cá nhân Sinh viên</h1>
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium">
              Đăng xuất
            </button>
          </div>

          {loading ? (
            <p className="text-slate-500 text-center">Đang tải thông tin...</p>
          ) : profile ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 border-b border-slate-100 pb-3">
                <span className="text-sm font-medium text-slate-500">Họ và tên:</span>
                <span className="text-sm font-semibold text-slate-800 col-span-2">{profile.fullName}</span>
              </div>
              <div className="grid grid-cols-3 border-b border-slate-100 pb-3">
                <span className="text-sm font-medium text-slate-500">Mã số sinh viên (MSSV):</span>
                <span className="text-sm font-mono font-semibold text-blue-600 col-span-2">{profile.mssv || "Chưa cập nhật"}</span>
              </div>
              <div className="grid grid-cols-3 border-b border-slate-100 pb-3">
                <span className="text-sm font-medium text-slate-500">Địa chỉ Email:</span>
                <span className="text-sm text-slate-800 col-span-2">{profile.email}</span>
              </div>
              <div className="grid grid-cols-3 border-b border-slate-100 pb-3">
                <span className="text-sm font-medium text-slate-500">Vai trò tài khoản:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 w-max">
                  {profile.role}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-red-500 text-center">Không thể tải thông tin tài khoản.</p>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}