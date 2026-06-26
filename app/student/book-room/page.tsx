"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RoleGuard from "../../components/RoleGuard";
import { apiClient } from "../../utils/apiClient";

interface Room {
  roomId: string;
  _id: string;
  roomNumber: string;
  name: string;
  roomType: string;
  building: string;
  floor: number;
  capacity: number;
  currentOccupancy: number;
  price: number;
  facilities: string[];
}

export default function BookRoomPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAvailableRooms = async () => {
      try {
        // Chỉ lấy các phòng có trạng thái AVAILABLE
        const response = await apiClient.get("/rooms?status=AVAILABLE");
        const payload = await response.json();
        
        if (response.ok) {
          setRooms(payload.data || payload);
        } else {
          setError(payload.message || "Không thể tải danh sách phòng.");
        }
      } catch (err) {
        setError("Lỗi kết nối đến máy chủ.");
      } finally {
        setLoading(false);
      }
    };
    fetchAvailableRooms();
  }, []);

  const handleBookRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn gửi yêu cầu đặt phòng ${roomName}?`)) return;

    setSubmitting(true);
    try {
      const response = await apiClient.post("/bookings", { roomId });
      const data = await response.json();

      if (response.ok) {
        alert("🎉 Đặt phòng thành công! Vui lòng chờ Ban quản lý phê duyệt.");
        // Chuyển hướng sang trang lịch sử đơn
        window.location.href = "/student/bookings";
      } else {
        alert(`❌ Lỗi: ${data.message}`);
      }
    } catch (err) {
      alert("Đã xảy ra lỗi hệ thống, vui lòng thử lại sau.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["STUDENT"]}>
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 mb-8 shadow-xl">
          <Link href="/student" className="inline-flex items-center text-sm text-slate-300 hover:text-white mb-4">
            ← Quay lại tổng quan
          </Link>
          <h1 className="text-3xl font-bold mb-2">Đăng ký phòng ở</h1>
          <p className="text-slate-400">Danh sách các phòng hiện đang còn trống trong hệ thống.</p>
        </div>

        {error && <div className="p-4 bg-red-100 text-red-700 rounded-xl mb-6">{error}</div>}

        {loading ? (
          <div className="text-center py-12 text-slate-500">Đang tìm kiếm phòng trống...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.length > 0 ? (
              rooms.map((room) => {
                const id = room._id || room.roomId;
                return (
                  <div key={id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition hover:shadow-md">
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-800">Phòng {room.name || room.roomNumber}</h3>
                          <p className="text-sm text-slate-500">Tòa {room.building} • Tầng {room.floor}</p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                          Còn trống
                        </span>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Loại phòng:</span>
                          <span className="font-semibold text-slate-700">{room.roomType || "Tiêu chuẩn"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Sức chứa:</span>
                          <span className="font-semibold text-slate-700">{room.currentOccupancy} / {room.capacity} người</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Đơn giá:</span>
                          <span className="font-bold text-blue-600">{room.price?.toLocaleString("vi-VN")} ₫/tháng</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {room.facilities?.slice(0, 3).map((fac, i) => (
                          <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs">{fac}</span>
                        ))}
                        {room.facilities?.length > 3 && <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs">+{room.facilities.length - 3}</span>}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                      <button 
                        onClick={() => handleBookRoom(id, room.name || room.roomNumber)}
                        disabled={submitting}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition disabled:opacity-50"
                      >
                        {submitting ? "Đang xử lý..." : "Đăng ký phòng này"}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <p className="text-slate-500">Hiện tại Ký túc xá đã hết phòng trống.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}