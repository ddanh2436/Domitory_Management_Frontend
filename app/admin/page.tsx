"use client";

import { useEffect, useState } from "react";
import RoleGuard from "../components/RoleGuard";
import { apiClient } from "../utils/apiClient";
import { useConfirm } from "../components/ConfirmProvider";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from "recharts";

interface Student {
  _id: string;
  fullName: string;
  mssv?: string;
  email: string;
  phone?: string;
  cccd?: string;
  room?: { _id: string; name: string; building: string };
  status?: string;
}

interface Booking {
  _id: string;
  status: string;
  createdAt: string;
  user?: { fullName: string; mssv?: string };
  room?: { _id: string; name: string; building: string; floor?: string };
}

interface Room {
  _id: string;
  name: string;
  capacity: number;
  occupiedBeds?: number;
}

const COLORS = ["#EF4444", "#F59E0B", "#10B981"]; 

function StatCard({ label, value, sub, accent = false }: { label: string; value: string | number; sub: string; accent?: boolean; }) {
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [maintenanceCount, setMaintenanceCount] = useState(0);
  
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [maintenanceData, setMaintenanceData] = useState<any[]>([]);
  
  // State lưu data thống kê cho TỪNG PHÒNG
  const [roomStatusData, setRoomStatusData] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState({ text: "", type: "" });
  const confirmDialog = useConfirm();

  const loadDashboardData = async () => {
    try {
      const [resStudents, resBookings, resMaint, revStatsRes, maintStatsRes, resRooms] = await Promise.all([
        apiClient.get('/users/students'),
        apiClient.get('/bookings'),
        apiClient.get('/maintenance'),
        apiClient.get('/invoices/stats/revenue'),
        apiClient.get('/maintenance/stats/status'),
        apiClient.get('/rooms') 
      ]);

      // Hàm trích xuất mảng an toàn (phòng hờ Backend trả về { data: [...] } thay vì Array)
      const extractArray = (data: any): any[] => {
        if (Array.isArray(data)) return data;
        if (data?.data && Array.isArray(data.data)) return data.data;
        if (data?.items && Array.isArray(data.items)) return data.items;
        return [];
      };

      let bList: Booking[] = [];
      let studentList: Student[] = [];

      if (resStudents.ok) {
        studentList = extractArray(await resStudents.json());
        setStudents(studentList);
      }
      if (resBookings.ok) {
        bList = extractArray(await resBookings.json());
        setBookings(bList);
      }
      if (resMaint.ok) {
        const mList = extractArray(await resMaint.json());
        setMaintenanceCount(mList.filter((m: { status: string }) => m.status !== "RESOLVED").length);
      }
      if (revStatsRes.ok) setRevenueData(extractArray(await revStatsRes.json()));
      if (maintStatsRes.ok) setMaintenanceData(extractArray(await maintStatsRes.json()));

      // ─── TÍNH TOÁN SỨC CHỨA TỪNG PHÒNG CHÍNH XÁC 100% ───
      if (resRooms.ok) {
        const rooms: Room[] = extractArray(await resRooms.json());
        
        const formattedRoomStats = rooms.map(room => {
          // 1. Đếm đơn Đang chờ duyệt: Đối chiếu linh hoạt dù room là ID hay Object
          const pendingForRoom = bList.filter(b => 
            b.status === "PENDING" && 
            (b.room?._id === room._id || b.room?.name === room.name || (b.room as any) === room._id)
          ).length;

          // 2. Đếm số người đang THỰC TẾ Ở (Quét từ danh sách Student)
          const occupied = studentList.filter(s => 
            s.room?._id === room._id || s.room?.name === room.name || (s.room as any) === room._id
          ).length;

          // 3. Ép kiểu capacity cẩn thận
          const cap = Number(room.capacity) || 0;
          
          // 4. Tính chỗ trống (đảm bảo không bị âm)
          const empty = Math.max(0, cap - occupied - pendingForRoom);
          
          return {
            name: room.name ? `Phòng ${room.name}` : "Phòng (Lỗi Tên)",
            pending: pendingForRoom,
            occupied: occupied,
            empty: empty,
          };
        });

        setRoomStatusData(formattedRoomStats.filter(r => r.pending > 0 || r.occupied > 0 || r.empty > 0));
      }

    } catch (error: unknown) {
      console.error("Lỗi đồng bộ dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleBookingAction = async (bookingId: string, action: "approve" | "reject", roomName: string) => {
    const isApprove = action === "approve";
    const ok = await confirmDialog({
      title: isApprove ? `Duyệt đơn vào phòng ${roomName}?` : `Từ chối đơn vào phòng ${roomName}?`,
      message: isApprove
        ? "Sinh viên sẽ được xếp vào phòng và hệ thống tự động tạo hợp đồng lưu trú."
        : "Đơn đăng ký này sẽ bị từ chối. Sinh viên có thể đăng ký phòng khác sau đó.",
      confirmLabel: isApprove ? "Duyệt đơn" : "Từ chối",
      variant: isApprove ? "primary" : "danger",
    });
    if (!ok) return;

    try {
      const response = await apiClient.patch(`/bookings/${bookingId}/${action}`);
      const data = await response.json();
      
      if (response.ok) {
        setAlertMsg({ text: `Xử lý đơn thành công!`, type: "success" });
        loadDashboardData(); 
      } else {
        setAlertMsg({ text: data.message || "Lỗi xử lý hệ thống.", type: "error" });
      }
    } catch (error) {
      setAlertMsg({ text: "Không thể kết nối đến máy chủ Backend.", type: "error" });
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === "PENDING");

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <style>{`
        .dashboard-wrapper { padding: 32px; max-width: 1280px; margin: 0 auto; }
        .page-title { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 700; color: #0D1B2A; margin-bottom: 6px; }
        .page-subtitle { font-size: 14px; color: #8A9BAD; margin-bottom: 28px; }

        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
        .stat-card { background: #ffffff; border: 1px solid rgba(13,27,42,0.09); border-radius: 12px; padding: 22px 24px; transition: transform 0.15s, box-shadow 0.15s; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(13,27,42,0.07); }
        .stat-card--accent { background: #0D1B2A; border-color: rgba(201,168,76,0.25); }
        .stat-card__label { font-size: 11px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; color: #8A9BAD; margin-bottom: 10px; }
        .stat-card--accent .stat-card__label { color: rgba(255,255,255,0.4); }
        .stat-card__value { font-family: 'Fraunces', serif; font-size: 32px; font-weight: 700; color: #0D1B2A; line-height: 1; letter-spacing: -1px; margin-bottom: 6px; }
        .stat-card--accent .stat-card__value { color: #C9A84C; }
        .stat-card__sub { font-size: 12px; color: #8A9BAD; }
        .stat-card--accent .stat-card__sub { color: rgba(255,255,255,0.35); }
        
        /* Chỉnh lại Grid hiển thị biểu đồ hàng trên */
        .db-charts-section { display: grid; grid-template-columns: 1.6fr 1fr; gap: 24px; margin-bottom: 28px; }
        .chart-box { background: white; border: 1px solid rgba(13,27,42,0.09); border-radius: 14px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.01); min-width: 0; }
        .chart-title { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 600; color: #0D1B2A; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; }
        
        @media (max-width: 1024px) { 
          .db-charts-section { grid-template-columns: 1fr; } 
        }

        .panel { background: #ffffff; border: 1px solid rgba(13,27,42,0.09); border-radius: 14px; overflow: hidden; margin-bottom: 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.01); }
        .panel__header { padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(13,27,42,0.09); }
        .panel__title { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 600; color: #0D1B2A; letter-spacing: -0.2px; }
        .panel__subtitle { font-size: 12.5px; color: #8A9BAD; margin-top: 2px; }
        .panel__header-right { display: flex; align-items: center; gap: 10px; }
        .count-badge { display: inline-flex; align-items: center; justify-content: center; padding: 4px 12px; border-radius: 100px; background: rgba(201,168,76,0.18); border: 1px solid rgba(201,168,76,0.25); font-size: 12px; font-weight: 600; color: #C9A84C; }
        
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table thead tr { border-bottom: 1px solid rgba(13,27,42,0.09); }
        .data-table th { padding: 12px 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #8A9BAD; text-align: left; white-space: nowrap; background: #FAFAF9; }
        .data-table tbody tr { border-bottom: 1px solid rgba(13,27,42,0.09); transition: background 0.12s; }
        .data-table tbody tr:hover { background: rgba(201,168,76,0.04); }
        .data-table td { padding: 14px 20px; vertical-align: middle; }
      `}</style>

      <div className="dashboard-wrapper">
        <h1 className="page-title">Tổng quan hệ thống</h1>
        <p className="page-subtitle">Báo cáo số liệu và quản lý các yêu cầu đang chờ xử lý</p>

        {alertMsg.text && (
          <div className={`p-4 rounded-xl font-medium mb-6 ${alertMsg.type === "success" ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"}`}>
            {alertMsg.text}
          </div>
        )}

        <div className="stats-row">
          <StatCard label="Tổng sinh viên hệ thống" value={loading ? "..." : students.length} sub="Tài khoản đã kích hoạt" accent />
          <StatCard label="Đơn phòng chờ xử lý" value={loading ? "..." : pendingBookings.length} sub="Yêu cầu cần phê duyệt gấp" />
          <StatCard label="Tổng đơn đã đăng ký" value={loading ? "..." : bookings.length} sub="Bao gồm mọi trạng thái" />
          <StatCard label="Sự cố kỹ thuật" value={loading ? "..." : maintenanceCount} sub={maintenanceCount === 0 ? "Hệ thống ổn định" : "Cần phân công sửa chữa"} />
        </div>

        {!loading && (
          <>
            {/* ROW 1: DOANH THU & SỰ CỐ */}
            <div className="db-charts-section">
              <div className="chart-box">
                <h2 className="chart-title">Phân tích doanh thu phát sinh (6 tháng gần nhất)</h2>
                <div className="w-full h-[300px] min-w-0">
                  <ResponsiveContainer width="100%" height={300} minWidth={0}>
                    <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fill: "#8A9BAD", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#8A9BAD", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                      <RechartsTooltip formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value))} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />
                      <Bar dataKey="Phòng" fill="#0D1B2A" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Điện" fill="#C9A84C" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Nước" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-box">
                <h2 className="chart-title">Tỷ lệ xử lý đơn sự cố vật chất</h2>
                <div className="w-full h-[300px] min-w-0 flex flex-col items-center justify-center">
                  {maintenanceData.length === 0 ? (
                    <div className="text-slate-400 text-sm">Chưa có dữ liệu báo cáo sự cố</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300} minWidth={0}>
                      <PieChart>
                        <Pie
                          data={maintenanceData}
                          cx="50%"
                          cy="45%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {maintenanceData.map((entry: { name: string; value: number }, index) => {
                            let color = "#64748b";
                            if (entry.name === "Chưa xử lý") color = COLORS[0];
                            if (entry.name === "Đang sửa chữa") color = COLORS[1];
                            if (entry.name === "Đã hoàn thành") color = COLORS[2];
                            return <Cell key={`cell-${index}`} fill={color} />;
                          })}
                        </Pie>
                        <RechartsTooltip formatter={(v) => `${v} đơn sự cố`} />
                        <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* ROW 2: TÌNH TRẠNG LẤP ĐẦY TỪNG PHÒNG (BIỂU ĐỒ CỘT GROUP) */}
            <div className="chart-box mb-7">
              <h2 className="chart-title">Phân tích tình trạng sức chứa theo TỪNG PHÒNG</h2>
              <div className="w-full h-[350px] min-w-0">
                {roomStatusData.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                    Chưa có dữ liệu phòng hoặc các phòng chưa thiết lập sức chứa.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={350} minWidth={0}>
                    <BarChart
                      data={roomStatusData}
                      margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fill: "#8A9BAD", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#8A9BAD", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <RechartsTooltip cursor={{fill: 'rgba(13, 27, 42, 0.04)'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />
                      
                      {/* Đã tách riêng thành 3 cột, màu chỗ trống đổi thành màu xanh dương và bo tròn góc */}
                      <Bar name="Đăng ký vào phòng" dataKey="pending" fill="#F59E0B" maxBarSize={40} radius={[4, 4, 0, 0]} />
                      <Bar name="Đã được xác nhận" dataKey="occupied" fill="#10B981" maxBarSize={40} radius={[4, 4, 0, 0]} />
                      <Bar name="Chỗ trống" dataKey="empty" fill="#3B82F6" maxBarSize={40} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </>
        )}

        <div className="panel">
          <div className="panel__header bg-amber-50">
            <div className="panel__header-left">
              <div className="panel__title text-amber-700">⚡ Đơn đăng ký đặt phòng chờ duyệt</div>
              <div className="panel__subtitle">Sinh viên gửi yêu cầu lưu trú - Phê duyệt sẽ tự cập nhật giảm số giường trống</div>
            </div>
            <div className="panel__header-right">
              <span className="count-badge bg-amber-100 text-amber-600 border-amber-200">
                {pendingBookings.length} yêu cầu mới
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="px-6 py-3">Họ và Tên Sinh viên</th>
                  <th className="px-6 py-3">Phòng Đăng ký</th>
                  <th className="px-6 py-3">Ngày gửi đơn</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3 text-center">Thao tác xử lý nhanh</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-6 text-slate-400">Đang tải đơn từ database...</td></tr>
                ) : pendingBookings.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-slate-400 font-medium bg-slate-50">🎉 Sạch đơn! Hiện tại không có yêu cầu nào đang chờ phê duyệt.</td></tr>
                ) : (
                  pendingBookings.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{b.user?.fullName}</div>
                        <div className="text-slate-400 text-xs mt-0.5">MSSV: {b.user?.mssv || "—"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-blue-600">{b.room?.name}</div>
                        <div className="text-slate-400 text-xs mt-0.5">Tòa {b.room?.building} · Tầng {b.room?.floor || "—"}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        {new Date(b.createdAt).toLocaleDateString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">CHỜ DUYỆT</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex gap-2">
                           <button onClick={() => handleBookingAction(b._id, "approve", b.room?.name || "")} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-sm transition-colors">Chấp nhận</button>
                           <button onClick={() => handleBookingAction(b._id, "reject", b.room?.name || "")} className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-md text-xs font-semibold border border-rose-200 transition-colors">Từ chối</button>
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