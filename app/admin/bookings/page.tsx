"use client";

import { useEffect, useState } from "react";

interface Booking {
  _id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  user?: { fullName?: string; mssv?: string };
  room?: { name?: string; building?: string };
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
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
        fetchBookings(); 
      } else {
        setActionMsg({ text: data.message, type: "error" });
      }
    } catch (error) {
      setActionMsg({ text: "Lỗi kết nối máy chủ", type: "error" });
    }
  };

  return (
    <div className="w-full space-y-8 text-slate-800 font-sans p-6 md:p-8">
      {actionMsg.text && (
        <div className={`p-5 rounded-2xl font-bold text-base ${actionMsg.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {actionMsg.text}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 py-6 sm:py-10">
        
        <div className="flex items-center justify-between mb-8">
           {/* Ép thụt lề tiêu đề sang phải */}
           <h2 className="text-2xl font-bold text-slate-800" style={{ paddingLeft: '32px' }}>
             Danh sách Đơn đăng ký lưu trú
           </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-base">
            <thead className="bg-slate-50">
              <tr>
                {/* Ép thụt lề tên cột đầu tiên sang phải */}
                <th className="py-5 text-left font-bold text-slate-600 rounded-tl-2xl" style={{ paddingLeft: '32px', paddingRight: '32px' }}>Sinh viên</th>
                <th className="px-8 py-5 text-left font-bold text-slate-600">Phòng đăng ký</th>
                <th className="px-8 py-5 text-left font-bold text-slate-600">Ngày gửi</th>
                <th className="px-8 py-5 text-left font-bold text-slate-600">Trạng thái</th>
                <th className="px-8 py-5 text-center font-bold text-slate-600 rounded-tr-2xl">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-500 text-lg">Đang tải dữ liệu...</td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-500 text-lg">Chưa có đơn đăng ký nào.</td></tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50 transition-colors">
                    {/* Ép thụt lề dữ liệu cột đầu tiên sang phải */}
                    <td className="py-6" style={{ paddingLeft: '32px', paddingRight: '32px' }}>
                      <div className="font-bold text-slate-800 text-[17px]">{b.user?.fullName}</div>
                      <div className="text-slate-500 text-sm mt-1">MSSV: {b.user?.mssv || '—'}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-bold text-blue-600 text-[17px]">{b.room?.name}</div>
                      <div className="text-slate-500 text-sm mt-1">Tòa {b.room?.building}</div>
                    </td>
                    <td className="px-8 py-6 text-slate-600 font-medium">
                      {new Date(b.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${
                        b.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                        b.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center space-x-3">
                      {b.status === 'PENDING' ? (
                        <>
                          <button onClick={() => handleAction(b._id, 'approve')} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold transition-colors shadow-sm">Duyệt đơn</button>
                          <button onClick={() => handleAction(b._id, 'reject')} className="px-5 py-2.5 bg-rose-50 text-rose-700 rounded-xl hover:bg-rose-100 font-bold border border-rose-200 transition-colors">Từ chối</button>
                        </>
                      ) : (
                        <span className="text-slate-400 italic text-sm font-medium">Đã xử lý xong</span>
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