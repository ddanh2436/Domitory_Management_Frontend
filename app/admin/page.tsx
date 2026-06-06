"use client";

import { useEffect, useState } from "react";
import RoleGuard from "../components/RoleGuard";

export default function AdminDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:3001/api/users/students", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setStudents(data);
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách sinh viên:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md border border-slate-100 p-6">
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Bảng Điều Khiển Quản Trị</h1>
              <p className="text-sm text-slate-500 mt-1">Quản lý danh sách toàn bộ sinh viên trong ký túc xá</p>
            </div>
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium">
              Đăng xuất
            </button>
          </div>

          {loading ? (
            <p className="text-slate-500 text-center py-4">Đang tải danh sách...</p>
          ) : students.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
                <thead className="bg-slate-50 text-left font-medium text-slate-600">
                  <tr>
                    <th className="px-4 py-3">STT</th>
                    <th className="px-4 py-3">Họ và Tên</th>
                    <th className="px-4 py-3">MSSV</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {students.map((student, index) => (
                    <tr key={student._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{student.fullName}</td>
                      <td className="px-4 py-3 font-mono text-blue-600 font-medium">{student.mssv || "N/A"}</td>
                      <td className="px-4 py-3">{student.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">Hiện chưa có sinh viên nào đăng ký hệ thống.</p>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}