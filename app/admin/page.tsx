"use client";

import { useEffect, useState } from "react";
import RoleGuard from "../components/RoleGuard";
import { apiClient } from "../utils/apiClient";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from "recharts";

interface Student {
  _id: string;
  fullName: string;
  mssv?: string;
  email: string;
}

const COLORS = ["#EF4444", "#F59E0B", "#10B981"];

function StatCard({ label, value, sub, accent = false }: { label: string; value: string | number; sub: string; accent?: boolean }) {
  return (
    <div className={`stat-card ${accent ? "stat-card--accent" : ""}`}>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__sub">{sub}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [maintenanceCount, setMaintenanceCount] = useState(0);
  const [revenueData, setRevenueData] = useState([]);
  const [maintenanceData, setMaintenanceData] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState({ text: "", type: "" });

  const loadDashboardData = async () => {
    try {
      // CODE CŨ: Phải tự get token, tự nhét header, hardcode link cho từng cái API
      // CODE MỚI: Chỉ cần gọi apiClient.get('/duong-dan') cực kỳ ngắn gọn!
      const [resStudents, resBookings, resMaint, revStatsRes, maintStatsRes] = await Promise.all([
        apiClient.get('/users/students'),
        apiClient.get('/bookings'),
        apiClient.get('/maintenance'),
        apiClient.get('/invoices/stats/revenue'),
        apiClient.get('/maintenance/stats/status')
      ]);

      if (resStudents.ok) setStudents(await resStudents.json());
      if (resBookings.ok) setBookings(await resBookings.json());
      if (resMaint.ok) {
        const maintList = await resMaint.json();
        setMaintenanceCount(maintList.filter((m: any) => m.status !== "RESOLVED").length);
      }
      if (revStatsRes.ok) setRevenueData(await revStatsRes.json());
      if (maintStatsRes.ok) setMaintenanceData(await maintStatsRes.json());

    } catch (error) {
      console.error("Lỗi đồng bộ dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleBookingAction = async (bookingId: string, action: "approve" | "reject", roomName: string) => {
    const actionText = action === "approve" ? "DUYỆT CHẤP NHẬN" : "TỪ CHỐI";
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} đơn vào phòng ${roomName}?`)) return;

    try {
      // Dùng apiClient.patch thay vì viết fetch dài dòng
      const response = await apiClient.patch(`/bookings/${bookingId}/${action}`);
      const data = await response.json();
      
      if (response.ok) {
        setAlertMsg({ text: `Đã xử lý xong đơn phòng ${roomName}.`, type: "success" });
        loadDashboardData(); 
      } else {
        setAlertMsg({ text: data.message || "Lỗi xử lý.", type: "error" });
      }
    } catch (error) {
      setAlertMsg({ text: "Lỗi kết nối máy chủ.", type: "error" });
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === "PENDING");

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      {/* KHÔNG CÒN THẺ <style> Ở ĐÂY NỮA VÌ ĐÃ CHUYỂN SANG globals.css */}
      <div className="dashboard-wrapper">
        <h1 className="page-title">Tổng quan hệ thống</h1>
        <p className="page-subtitle">Báo cáo số liệu và quản lý các yêu cầu đang chờ xử lý</p>

        {alertMsg.text && (
          <div className={`p-4 rounded-xl font-medium mb-6 ${alertMsg.type === "success" ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"} border`}>
            {alertMsg.text}
          </div>
        )}

        <div className="stats-row">
          <StatCard label="Tổng sinh viên" value={loading ? "..." : students.length} sub="Đã kích hoạt" accent />
          <StatCard label="Đơn phòng chờ duyệt" value={loading ? "..." : pendingBookings.length} sub="Cần phê duyệt" />
          <StatCard label="Tổng đơn phòng" value={loading ? "..." : bookings.length} sub="Mọi trạng thái" />
          <StatCard label="Sự cố kỹ thuật" value={loading ? "..." : maintenanceCount} sub={maintenanceCount === 0 ? "Ổn định" : "Cần sửa chữa"} />
        </div>

        {!loading && (
          <div className="db-charts-section">
            <div className="chart-box">
              <h2 className="chart-title">Doanh thu phát sinh (6 tháng)</h2>
              <div style={{ width: "100%", height: 300, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fill: "#8A9BAD", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#8A9BAD", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value))} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />
                    <Bar dataKey="Phòng" fill="#0D1B2A" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Điện" fill="#C9A84C" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Nước" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-box">
              <h2 className="chart-title">Tỷ lệ xử lý đơn sự cố</h2>
              <div style={{ width: "100%", height: 300, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                {maintenanceData.length === 0 ? (
                  <div style={{ color: "#8A9BAD", fontSize: 13 }}>Chưa có dữ liệu</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={maintenanceData} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                        {maintenanceData.map((entry: any, index) => {
                          let color = "#64748b";
                          if (entry.name === "Chưa xử lý") color = COLORS[0];
                          if (entry.name === "Đang sửa chữa") color = COLORS[1];
                          if (entry.name === "Đã hoàn thành") color = COLORS[2];
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Pie>
                      <Tooltip formatter={(v) => `${v} đơn`} />
                      <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="panel">
          <div className="panel__header" style={{ backgroundColor: "#fffbf2" }}>
            <div className="panel__header-left">
              <div className="panel__title" style={{ color: "#b45309" }}>⚡ Đơn đăng ký đặt phòng chờ duyệt</div>
            </div>
            <div className="panel__header-right">
              <span className="count-badge" style={{ backgroundColor: "#fef3c7", color: "#d97706", borderColor: "#fde68a" }}>
                {pendingBookings.length} yêu cầu mới
              </span>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th className="px-6 py-3">Sinh viên</th>
                  <th className="px-6 py-3">Phòng</th>
                  <th className="px-6 py-3">Ngày gửi</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-6 text-slate-400">Đang tải...</td></tr>
                ) : pendingBookings.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-slate-400 font-medium bg-slate-50">Sạch đơn!</td></tr>
                ) : (
                  pendingBookings.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{b.user?.fullName}</div>
                        <div className="text-slate-400 text-xs mt-0.5">MSSV: {b.user?.mssv || "—"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-blue-600">{b.room?.name}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        {new Date(b.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">CHỜ DUYỆT</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex gap-2">
                          <button onClick={() => handleBookingAction(b._id, "approve", b.room?.name)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-sm transition-colors">Duyệt</button>
                          <button onClick={() => handleBookingAction(b._id, "reject", b.room?.name)} className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-md text-xs font-semibold border border-rose-200 transition-colors">Từ chối</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}