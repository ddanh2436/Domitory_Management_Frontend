"use client";

import { useEffect, useState } from "react";

interface Student {
  _id: string;
  fullName: string;
  mssv?: string;
  email: string;
  phone?: string;
  cccd?: string;
  room?: { name: string; building: string };
  status?: string;
}

function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string | number;
  sub: string;
  accent?: boolean;
}) {
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
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState({ text: "", type: "" });

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");

      const resStudents = await fetch("http://localhost:3001/api/users/students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const studentsData = resStudents.ok ? await resStudents.json() : [];
      setStudents(studentsData);

      const resBookings = await fetch("http://localhost:3001/api/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const bookingsData = resBookings.ok ? await resBookings.json() : [];
      setBookings(bookingsData);
    } catch (error) {
      console.error("Lỗi đồng bộ dữ liệu từ đám mây:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleBookingAction = async (bookingId: string, action: "approve" | "reject", roomName: string) => {
    const actionText = action === "approve" ? "DUYỆT CHẤP NHẬN" : "TỪ CHỐI";
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} đơn đăng ký vào phòng ${roomName}?`)) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3001/api/bookings/${bookingId}/${action}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        setAlertMsg({
          text: `Xử lý đơn thành công: Đã ${action === "approve" ? "Phê duyệt và trừ 1 giường trống tại phòng" : "Từ chối đơn vào phòng"} ${roomName}.`,
          type: "success",
        });
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
    <>
      <style>{`
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
        .panel { background: #ffffff; border: 1px solid rgba(13,27,42,0.09); border-radius: 14px; overflow: hidden; margin-bottom: 28px; }
        .panel__header { padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(13,27,42,0.09); }
        .panel__title { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 600; color: #0D1B2A; letter-spacing: -0.2px; }
        .panel__subtitle { font-size: 12.5px; color: #8A9BAD; }
        .panel__header-right { display: flex; align-items: center; gap: 10px; }
        .count-badge { display: inline-flex; align-items: center; justify-content: center; padding: 3px 10px; border-radius: 100px; background: rgba(201,168,76,0.18); border: 1px solid rgba(201,168,76,0.25); font-size: 12px; font-weight: 500; color: #C9A84C; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table thead tr { border-bottom: 1px solid rgba(13,27,42,0.09); }
        .data-table th { padding: 10px 20px; font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: #8A9BAD; text-align: left; white-space: nowrap; background: #FAFAF9; }
        .data-table tbody tr { border-bottom: 1px solid rgba(13,27,42,0.09); transition: background 0.12s; }
        .data-table tbody tr:hover { background: rgba(201,168,76,0.04); }
        .data-table td { padding: 14px 20px; vertical-align: middle; }
      `}</style>

      {alertMsg.text && (
        <div className={`p-4 rounded-xl font-medium mb-6 ${alertMsg.type === "success" ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"}`}>
          {alertMsg.text}
        </div>
      )}

      <div className="stats-row">
        <StatCard label="Tổng sinh viên hệ thống" value={loading ? "—" : students.length} sub="Tài khoản đã kích hoạt" accent />
        <StatCard label="Đơn phòng chờ xử lý" value={loading ? "—" : pendingBookings.length} sub="Yêu cầu cần phê duyệt gấp" />
        <StatCard label="Tổng đơn đã đăng ký" value={loading ? "—" : bookings.length} sub="Bao gồm mọi trạng thái" />
        <StatCard label="Sự cố kỹ thuật" value="0" sub="Hệ thống ổn định" />
      </div>

      <div className="panel">
        <div className="panel__header" style={{ backgroundColor: "#fffbf2" }}>
          <div className="panel__header-left">
            <div className="panel__title" style={{ color: "#b45309" }}>⚡ Đơn đăng ký đặt phòng chờ duyệt</div>
            <div className="panel__subtitle">Sinh viên gửi yêu cầu lưu trú - Phê duyệt sẽ tự cập nhật giảm số giường trống</div>
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
                <th className="px-6 py-3">Họ và Tên Sinh viên</th>
                <th className="px-6 py-3">Phòng Đăng ký</th>
                <th className="px-6 py-3">Ngày gửi đơn</th>
                <th className="px-6 py-3">Trạng thái</th>
                <th className="px-6 py-3 text-center">Thao tác xử lý nhanh</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-6 text-slate-400">Đang tải đơn từ database đám mây...</td></tr>
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
                      <div className="text-slate-400 text-xs mt-0.5">Tòa {b.room?.building} · Tầng {b.room?.floor}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {new Date(b.createdAt).toLocaleDateString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">CHỜ DUYỆT</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex gap-2">
                        <button onClick={() => handleBookingAction(b._id, "approve", b.room?.name)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-sm transition-colors">Chấp nhận</button>
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
    </>
  );
}