"use client";

import { useEffect, useState } from "react";
import { useToast } from "../../components/ToastProvider";
import { useConfirm } from "../../components/ConfirmProvider";
import { apiClient } from "../../utils/apiClient";
import RoomFilterBar, { EMPTY_ROOM_FILTER, matchRoomFilter, type RoomFilterValue } from "../../components/RoomFilterBar";

interface Booking {
  _id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  user?: { fullName?: string; mssv?: string };
  room?: { name?: string; building?: string; floor?: number };
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomFilter, setRoomFilter] = useState<RoomFilterValue>(EMPTY_ROOM_FILTER);
  const toast = useToast();
  const confirmDialog = useConfirm();

  const filteredBookings = bookings.filter((b) => matchRoomFilter(roomFilter, b.room));

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/bookings");
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
    const isApprove = action === 'approve';
    const ok = await confirmDialog({
      title: isApprove ? "Duyệt đơn đăng ký?" : "Từ chối đơn đăng ký?",
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
        if (action === 'approve') {
          toast.success("Đơn đăng ký đã được duyệt, hợp đồng đã được tạo cho sinh viên.", "Đã duyệt đơn 🎉");
        } else {
          toast.success("Đã từ chối đơn đăng ký lưu trú này.", "Đã từ chối");
        }
        fetchBookings();
      } else {
        toast.error(data.message || "Không xử lý được đơn, vui lòng thử lại.");
      }
    } catch (error) {
      toast.error("Không thể kết nối đến máy chủ.");
    }
  };

  return (
    <div className="adm-page px-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700&family=DM+Sans:wght@400;500;700&display=swap');
        
        .adm-page { 
          max-width: 1180px; 
          margin: 0 auto; 
          padding-top: 24px;
          padding-bottom: 48px;
          color: #0D1B2A; 
          font-family: 'DM Sans', sans-serif; 
        }
        
        .panel { 
          background: #fff; 
          border: 1px solid rgba(13,27,42,0.09); 
          border-radius: 20px; 
          padding: 28px 32px; 
          box-shadow: 0 10px 24px rgba(13,27,42,0.04); 
          overflow: hidden; 
        }
        
        .panel-title { 
          font-family: 'FrauncesAmp', 'Fraunces', serif; 
          font-size: 24px; 
          font-weight: 700; 
          color: #0D1B2A; 
          margin-bottom: 24px; 
          letter-spacing: -0.5px; 
        }
        
        .adm-table { 
          width: 100%; 
          border-collapse: separate; 
          border-spacing: 0; 
          text-align: left; 
        }
        
        .adm-table th { 
          padding: 16px 20px; 
          font-size: 11px; 
          font-weight: 700; 
          text-transform: uppercase; 
          letter-spacing: 0.08em; 
          color: #8A9BAD; 
          border-bottom: 1px solid rgba(13,27,42,0.08); 
          background: #f8fafc; 
        }
        
        .adm-table th:first-child { 
          border-top-left-radius: 12px; 
          border-bottom-left-radius: 12px; 
          padding-left: 24px;
        }
        
        .adm-table th:last-child { 
          border-top-right-radius: 12px; 
          border-bottom-right-radius: 12px; 
          text-align: center; 
        }
        
        .adm-table td { 
          padding: 20px; 
          border-bottom: 1px solid rgba(13,27,42,0.04); 
          vertical-align: middle; 
        }
        
        .adm-table td:first-child {
          padding-left: 24px;
        }
        
        .adm-table tr:last-child td { 
          border-bottom: none; 
        }
        
        .adm-table tr:hover td { 
          background: #fcfcfb; 
        }
        
        .badge { 
          display: inline-flex; 
          align-items: center; 
          padding: 6px 12px; 
          border-radius: 999px; 
          font-size: 11px; 
          font-weight: 800; 
          letter-spacing: 0.04em; 
          text-transform: uppercase; 
        }
        
        .badge--pending { background: rgba(245,158,11,0.12); color: #d97706; }
        .badge--approved { background: rgba(34,197,94,0.12); color: #16a34a; }
        .badge--rejected { background: rgba(239,68,68,0.12); color: #dc2626; }
      `}</style>

      <div className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="panel-title" style={{ marginBottom: 0 }}>Danh sách Đơn đăng ký lưu trú</h2>
          <RoomFilterBar rooms={bookings.map((b) => b.room)} value={roomFilter} onChange={setRoomFilter} />
        </div>

        <div className="overflow-x-auto">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Sinh viên</th>
                <th>Phòng đăng ký</th>
                <th>Ngày gửi</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-[#8A9BAD] font-medium text-sm">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-[#8A9BAD] font-medium text-sm">
                    {bookings.length === 0 ? "Chưa có đơn đăng ký nào." : "Không có đơn nào khớp bộ lọc."}
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b._id} style={{ transition: 'background-color 0.2s' }}>
                    <td>
                      <div className="font-bold text-[#0D1B2A] text-[15px]">{b.user?.fullName}</div>
                      <div className="text-[#8A9BAD] text-[13px] mt-1">MSSV: {b.user?.mssv || '—'}</div>
                    </td>
                    <td>
                      <div className="font-bold text-[#2563eb] text-[15px]">{b.room?.name}</div>
                      <div className="text-[#8A9BAD] text-[13px] mt-1">Tòa {b.room?.building}</div>
                    </td>
                    <td className="text-[#334155] font-medium text-[14px]">
                      {new Date(b.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td>
                      <span className={`badge ${
                        b.status === 'PENDING' ? 'badge--pending' :
                        b.status === 'APPROVED' ? 'badge--approved' : 'badge--rejected'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="text-center space-x-2">
                      {b.status === 'PENDING' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleAction(b._id, 'approve')} 
                            className="px-4 py-2 bg-[#0D1B2A] text-white rounded-lg hover:bg-[#1A2E42] font-semibold text-[13px] transition-all shadow-sm"
                          >
                            Duyệt
                          </button>
                          <button 
                            onClick={() => handleAction(b._id, 'reject')} 
                            className="px-4 py-2 bg-white text-[#dc2626] rounded-lg hover:bg-red-50 font-semibold text-[13px] border border-red-200 transition-all"
                          >
                            Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-[#8A9BAD] italic text-[13px] font-medium">Đã xử lý xong</span>
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