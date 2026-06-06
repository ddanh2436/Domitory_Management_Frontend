"use client";

import RoleGuard from "../components/RoleGuard";

export default function AdminDashboard() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-slate-100 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Trang Quản Trị (Admin Dashboard)</h1>
            <button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Đăng xuất
            </button>
          </div>
          <p className="text-slate-600">Chào mừng Admin! Chỉ tài khoản có quyền ADMIN mới có thể nhìn thấy nội dung này.</p>
        </div>
      </div>
    </RoleGuard>
  );
}