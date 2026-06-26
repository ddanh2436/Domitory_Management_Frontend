"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RoleGuard from "../../components/RoleGuard";
import { apiClient } from "../../utils/apiClient";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMyBookings = async () => {
    try {
      const response = await apiClient.get("/bookings/me");
      const payload = await response.json();
      
      if (response.ok) {
        setBookings(payload.data || payload || []);
      } else {
        setError(payload.message || "Không thể tải danh sách đơn đăng ký.");
      }
    } catch (err) {
      setError("Lỗi kết nối hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Bạn có chắc chắn muốn hủy đơn đăng ký này?")) return;

    try {
      const response = await apiClient.patch(`/bookings/${bookingId}/cancel`);
      const data = await response.json();

      if (response.ok) {
        alert("Hủy đơn thành công.");
        fetchMyBookings(); // Tải lại dữ liệu
      } else {
        alert(`Lỗi: ${data.message}`);
      }
    } catch (err) {
      alert("Lỗi kết nối khi hủy đơn.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Đang chờ duyệt</span>;
      case "APPROVED": return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Đã duyệt</span>;
      case "REJECTED": return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Bị từ chối</span>;
      case "CANCELLED": return <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-xs font-bold">Đã hủy</span>;
      default: return null;
    }
  };

  return (
    <RoleGuard allowedRoles={["STUDENT"]}>
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Lịch sử đăng ký phòng</h1>
            <p className="text-slate-500 mt-1">Theo dõi tình trạng các đơn yêu cầu lưu trú của bạn.</p>
          </div>
          <Link href="/student/book-room" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition">
            + Đặt phòng mới
          </Link>
        </div>

        {error && <div className="p-4 bg-red-100 text-red-700 rounded-xl mb-6">{error}</div>}

        {loading ? (
          <div className="text-center py-12 text-slate-500">Đang tải dữ liệu...</div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                    <th className="p-4 font-semibold">Phòng yêu cầu</th>
                    <th className="p-4 font-semibold">Ngày tạo đơn</th>
                    <th className="p-4 font-semibold">Trạng thái</th>
                    <th className="p-4 font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length > 0 ? (
                    bookings.map((booking) => (
                      <tr key={booking._id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="p-4">
                          <div className="font-bold text-slate-800">Phòng {booking.room?.name || "N/A"}</div>
                          <div className="text-xs text-slate-500">Tòa {booking.room?.building} • Tầng {booking.room?.floor}</div>
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          {new Date(booking.createdAt).toLocaleString("vi-VN")}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(booking.status)}
                        </td>
                        <td className="p-4">
                          {booking.status === "PENDING" ? (
                            <button 
                              onClick={() => handleCancelBooking(booking._id)}
                              className="text-sm text-red-600 hover:text-red-800 font-semibold px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition"
                            >
                              Hủy đơn
                            </button>
                          ) : (
                            <span className="text-sm text-slate-400 italic">Không khả dụng</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">
                        Bạn chưa có đơn đăng ký phòng nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}