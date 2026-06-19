"use client";

import { useEffect, useState } from "react";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState({ text: "", type: "" });

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/api/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setBookings(await response.json());
      }
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleAction = async (bookingId: string, action: 'approve' | 'reject') => {
    if (!confirm(`Bạn chắc chắn muốn ${action === 'approve' ? 'DUYỆT' : 'TỪ CHỐI'} đơn này?`)) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3001/api/bookings/${bookingId}/${action}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      if (response.ok) {
        setActionMsg({ text: `Đã ${action === 'approve' ? 'duyệt' : 'từ chối'} đơn thành công!`, type: "success" });
        fetchBookings(); // Tải lại danh sách
      } else {
        setActionMsg({ text: data.message, type: "error" });
      }
    } catch (error) {
      setActionMsg({ text: "Lỗi kết nối máy chủ", type: "error" });
    }
  };

  return (
    <div className="w-full space-y-6 text-slate-800 font-sans">
      {actionMsg.text && (
        <div className={`p-4 rounded-lg font-medium ${actionMsg.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {actionMsg.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-slate-600">Sinh viên</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-600">Phòng đăng ký</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-600">Ngày gửi</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-600">Trạng thái</th>
                <th className="px-6 py-4 text-center font-semibold text-slate-600">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Đang tải dữ liệu...</td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Chưa có đơn đăng ký nào.</td></tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{b.user?.fullName}</div>
                      <div className="text-slate-500 text-xs mt-1">MSSV: {b.user?.mssv || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-blue-600">{b.room?.name}</div>
                      <div className="text-slate-500 text-xs mt-1">Tòa {b.room?.building}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(b.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        b.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                        b.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center space-x-2">
                      {b.status === 'PENDING' ? (
                        <>
                          <button onClick={() => handleAction(b._id, 'approve')} className="px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium transition-colors">Duyệt</button>
                          <button onClick={() => handleAction(b._id, 'reject')} className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded hover:bg-rose-100 font-medium border border-rose-200 transition-colors">Từ chối</button>
                        </>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}