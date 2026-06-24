"use client";

import { useEffect, useState } from "react";
import { apiClient } from "../../utils/apiClient";

interface Occupant {
  userId: string;
  fullName: string;
  mssv: string;
  dateOfBirth: string;
  avatar?: string;
  contactInfo?: { phone?: string; email?: string } | null;
  checkInDate: string;
  roomStatus: string;
  bookingHistory: { bookingId: string; roomNumber: string; requestedAt: string; status: string }[];
  contractInfo: { contractNumber: string; startDate: string; endDate: string; rentalFee: number; status: string };
  currentRoomAssignment: { roomId: string; roomNumber: string; roomType: string; building: string; floor: number };
}

interface Room {
  roomId: string;
  roomNumber: string;
  roomType: string;
  building: string;
  floor: number;
  capacity: number;
  currentOccupancy: number;
  price: number;
  status: "AVAILABLE" | "FULL" | "MAINTENANCE";
  availabilityStatus: string;
  facilities: string[];
  occupants: Occupant[];
}

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchRooms = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get("/rooms");
      const payload = await response.json();

      if (response.ok) {
        setRooms(payload.data || []);
        setSelectedRoomId((current) => current ?? payload.data?.[0]?.roomId ?? null);
      } else {
        setRooms([]);
        setError(payload.message || "Không thể tải danh sách phòng.");
      }
    } catch (requestError) {
      console.error(requestError);
      setError("Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRooms();
  }, []);

  const selectedRoom = rooms.find((room) => room.roomId === selectedRoomId) || rooms[0] || null;

  return (
    <div className="w-full space-y-6 text-slate-800 font-sans">
      <style>{`
        .rooms-hero { background: linear-gradient(135deg, #0D1B2A 0%, #182b43 60%, #253d5d 100%); color: #fff; border-radius: 24px; padding: 28px; border: 1px solid rgba(201,168,76,0.25); }
        .rooms-layout { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 20px; }
        .rooms-panel { background: #fff; border: 1px solid rgba(13,27,42,0.09); border-radius: 20px; box-shadow: 0 10px 24px rgba(13,27,42,0.04); overflow: hidden; }
        .rooms-list { display: grid; gap: 12px; }
        .room-card { border: 1px solid rgba(13,27,42,0.08); border-radius: 18px; padding: 16px; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s; background: linear-gradient(180deg, #fff, #fbfbfa); }
        .room-card:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(13,27,42,0.06); }
        .room-card--active { border-color: rgba(201,168,76,0.45); box-shadow: 0 12px 24px rgba(201,168,76,0.08); }
        .room-card__top { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
        .room-name { font-size: 18px; font-weight: 700; color: #0D1B2A; }
        .room-sub { color: #64748b; font-size: 13px; margin-top: 4px; }
        .tag { display: inline-flex; align-items: center; padding: 6px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }
        .tag--available { background: rgba(34,197,94,0.12); color: #16a34a; }
        .tag--full { background: rgba(239,68,68,0.12); color: #dc2626; }
        .tag--maintenance { background: rgba(245,158,11,0.12); color: #d97706; }
        .chip-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .chip { padding: 6px 10px; border-radius: 999px; background: rgba(13,27,42,0.04); border: 1px solid rgba(13,27,42,0.08); font-size: 12px; color: #334155; font-weight: 600; }
        .detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .detail-item { padding: 14px 16px; border-radius: 14px; background: #f8fafc; border: 1px solid rgba(13,27,42,0.08); display: flex; justify-content: space-between; gap: 12px; }
        .detail-item span:first-child { color: #64748b; }
        .detail-item span:last-child { color: #0D1B2A; font-weight: 700; text-align: right; }
        .occupant { border: 1px solid rgba(13,27,42,0.08); border-radius: 18px; padding: 16px; margin-top: 14px; }
        .occupant-head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
        .occupant-name { font-size: 16px; font-weight: 700; color: #0D1B2A; }
        .occupant-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 10px; font-size: 13px; color: #334155; }
        .occupant-meta strong { color: #0D1B2A; }
        .muted-box { background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; border-radius: 16px; padding: 16px; font-size: 13px; line-height: 1.6; }
        @media (max-width: 1000px) { .rooms-layout { grid-template-columns: 1fr; } }
        @media (max-width: 640px) { .detail-grid, .occupant-meta { grid-template-columns: 1fr; } }
      `}</style>

      <div className="rooms-hero">
        <div className="text-xs uppercase tracking-[0.2em] text-white/55 font-semibold">Quản trị phòng ở</div>
        <h1 className="text-3xl font-bold mt-3">Toàn bộ phòng và cư dân trong hệ thống</h1>
        <p className="text-sm text-white/75 mt-2 max-w-3xl">Màn hình này cho phép quản trị viên xem toàn bộ phòng, danh sách occupants của từng phòng và thông tin cư dân chi tiết để phục vụ vận hành, hỗ trợ và kiểm tra nội bộ.</p>
      </div>

      {error && <div className="p-4 rounded-xl bg-red-100 text-red-800 border border-red-200 font-medium">{error}</div>}

      {loading ? (
        <div className="rooms-panel p-8 text-center text-slate-500">Đang tải dữ liệu phòng...</div>
      ) : (
        <div className="rooms-layout">
          <section className="rooms-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#0D1B2A]">Danh sách phòng</h2>
              <button onClick={fetchRooms} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-semibold transition-colors">Tải lại</button>
            </div>

            <div className="rooms-list">
              {rooms.map((room) => (
                <button key={room.roomId} type="button" onClick={() => setSelectedRoomId(room.roomId)} className={`room-card text-left ${selectedRoom?.roomId === room.roomId ? "room-card--active" : ""}`}>
                  <div className="room-card__top">
                    <div>
                      <div className="room-name">Phòng {room.roomNumber}</div>
                      <div className="room-sub">Tòa {room.building} · Tầng {room.floor} · {room.roomType}</div>
                    </div>
                    <span className={`tag ${room.status === "AVAILABLE" ? "tag--available" : room.status === "FULL" ? "tag--full" : "tag--maintenance"}`}>{room.availabilityStatus}</span>
                  </div>
                  <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
                    <span>Sức chứa: <strong>{room.currentOccupancy} / {room.capacity}</strong></span>
                    <span>Giá: <strong>{room.price.toLocaleString("vi-VN")} đ</strong></span>
                  </div>
                  <div className="chip-row">
                    {room.facilities.slice(0, 4).map((facility) => <span key={facility} className="chip">{facility}</span>)}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <aside className="rooms-panel p-5">
            {selectedRoom ? (
              <>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#0D1B2A]">Phòng {selectedRoom.roomNumber}</h2>
                    <p className="text-sm text-slate-500 mt-1">Chi tiết phòng và toàn bộ cư dân đang được gắn với phòng này.</p>
                  </div>
                  <span className={`tag ${selectedRoom.status === "AVAILABLE" ? "tag--available" : selectedRoom.status === "FULL" ? "tag--full" : "tag--maintenance"}`}>{selectedRoom.availabilityStatus}</span>
                </div>

                <div className="detail-grid">
                  <div className="detail-item"><span>Loại phòng</span><span>{selectedRoom.roomType}</span></div>
                  <div className="detail-item"><span>Hệ thống</span><span>{selectedRoom.building} / {selectedRoom.floor}</span></div>
                  <div className="detail-item"><span>Sức chứa</span><span>{selectedRoom.currentOccupancy} / {selectedRoom.capacity}</span></div>
                  <div className="detail-item"><span>Trạng thái</span><span>{selectedRoom.status}</span></div>
                  <div className="detail-item"><span>Giá thuê</span><span>{selectedRoom.price.toLocaleString("vi-VN")} đ/tháng</span></div>
                  <div className="detail-item"><span>Tiện ích</span><span>{selectedRoom.facilities.length}</span></div>
                </div>

                <div className="mt-5">
                  <div className="text-lg font-bold text-[#0D1B2A] mb-3">Occupants</div>
                  {selectedRoom.occupants.map((occupant) => (
                    <div key={occupant.userId} className="occupant">
                      <div className="occupant-head">
                        <div>
                          <div className="occupant-name">{occupant.fullName}</div>
                          <div className="text-sm text-slate-500">MSSV: {occupant.mssv}</div>
                        </div>
                        <span className={`tag ${occupant.roomStatus === "CONFIRMED" ? "tag--available" : "tag--maintenance"}`}>{occupant.roomStatus}</span>
                      </div>
                      <div className="occupant-meta">
                        <div><strong>Ngày sinh:</strong> {new Date(occupant.dateOfBirth).toLocaleDateString("vi-VN")}</div>
                        <div><strong>Check-in:</strong> {new Date(occupant.checkInDate).toLocaleDateString("vi-VN")}</div>
                        <div><strong>Email:</strong> {occupant.contactInfo?.email || "Không công khai"}</div>
                        <div><strong>Điện thoại:</strong> {occupant.contactInfo?.phone || "Không công khai"}</div>
                        <div><strong>Hợp đồng:</strong> {occupant.contractInfo.contractNumber}</div>
                        <div><strong>Phòng hiện tại:</strong> {occupant.currentRoomAssignment.roomNumber}</div>
                      </div>

                      <div className="mt-4">
                        <div className="text-sm font-semibold text-slate-700 mb-2">Booking history</div>
                        <div className="space-y-2">
                          {occupant.bookingHistory.map((booking) => (
                            <div key={booking.bookingId} className="flex items-center justify-between gap-3 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                              <span>{booking.roomNumber}</span>
                              <span>{new Date(booking.requestedAt).toLocaleString("vi-VN")}</span>
                              <span>{booking.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 muted-box">
                  Trạng thái truy cập và log bảo mật được xử lý ở API nội bộ. Nếu sinh viên cố xem ngoài phạm vi phòng được phân, hệ thống sẽ trả lỗi và ghi nhận sự kiện.
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-500">Chưa chọn phòng nào.</div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}