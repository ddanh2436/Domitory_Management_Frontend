"use client";

import { useEffect, useState } from "react";
import { apiClient } from "../../utils/apiClient";
import AvatarLightbox from "../../components/AvatarLightbox";

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
  name?: string; // Tên phòng trên database (nếu có)
  roomType: string;
  building: string;
  floor: number;
  capacity: number;
  currentOccupancy: number;
  price: number;
  status: "AVAILABLE" | "FULL" | "MAINTENANCE";
  availabilityStatus: string;
  facilities: string[];
  occupants?: Occupant[];
  _id?: string;
}

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // States cho tính năng Thêm phòng
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: "",
    building: "",
    floor: 1,
    capacity: 4,
    price: 0,
    facilities: "", // Chuỗi cách nhau bằng dấu phẩy
  });

  const fetchRooms = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get("/rooms");
      const payload = await response.json();

      if (response.ok) {
        setRooms(payload.data || []);
        // Nếu không có phòng nào được chọn, tự động chọn phòng đầu tiên
        if (!selectedRoomId && payload.data?.length > 0) {
           const firstRoomId = payload.data[0].roomId || payload.data[0]._id;
           setSelectedRoomId(firstRoomId);
        }
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
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Xử lý logic Thêm Phòng
  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Tách chuỗi tiện ích thành mảng
      const facilitiesArray = newRoom.facilities
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);

      const payload = {
        name: newRoom.name,
        building: newRoom.building,
        floor: Number(newRoom.floor),
        capacity: Number(newRoom.capacity),
        price: Number(newRoom.price),
        status: "AVAILABLE",
        facilities: facilitiesArray,
      };

      const response = await apiClient.post("/rooms", payload);
      
      if (response.ok) {
        setIsAddModalOpen(false);
        setNewRoom({ name: "", building: "", floor: 1, capacity: 4, price: 0, facilities: "" });
        await fetchRooms(); // Tải lại danh sách
      } else {
        const errorData = await response.json();
        alert(`Lỗi thêm phòng: ${errorData.message}`);
      }
    } catch (err) {
      alert("Đã xảy ra lỗi khi kết nối với server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý logic Xóa Phòng
  const handleDeleteRoom = async () => {
    if (!selectedRoomId) return;
    const roomToDelete = rooms.find(r => (r.roomId || r._id) === selectedRoomId);
    const roomName = roomToDelete?.roomNumber || roomToDelete?.name || "này";

    if (!confirm(`Bạn có chắc chắn muốn xóa phòng ${roomName}? Hành động này không thể hoàn tác.`)) return;

    try {
      const response = await apiClient.delete(`/rooms/${selectedRoomId}`);
      if (response.ok) {
        alert("Đã xóa phòng thành công!");
        setSelectedRoomId(null); // Xóa selection
        fetchRooms(); // Tải lại danh sách
      } else {
        const errorData = await response.json();
        alert(`Lỗi xóa phòng: ${errorData.message}`);
      }
    } catch (err) {
      alert("Đã xảy ra lỗi khi kết nối với server.");
    }
  };

  const selectedRoom = rooms.find((room) => (room.roomId || room._id) === selectedRoomId) || rooms[0] || null;

  return (
    <div className="w-full space-y-6 text-slate-800 font-sans relative">
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
        .occupant-identity { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .occ-stack { display: flex; align-items: center; margin-top: 12px; }
        .occ-stack__more { margin-left: -8px; width: 28px; height: 28px; border-radius: 50%; background: rgba(13,27,42,0.06); color: #334155; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 2px #fff; }
        .occ-stack__empty { font-size: 12px; color: #94a3b8; font-style: italic; }
        .occupant-name { font-size: 16px; font-weight: 700; color: #0D1B2A; }
        .occupant-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 10px; font-size: 13px; color: #334155; }
        .occupant-meta strong { color: #0D1B2A; }
        .muted-box { background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; border-radius: 16px; padding: 16px; font-size: 13px; line-height: 1.6; }
        
        /* Modal Styles */
        .modal-overlay { position: fixed; inset: 0; background: rgba(13,27,42,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(4px); padding: 20px;}
        .modal-content { background: #fff; border-radius: 20px; width: 100%; max-width: 500px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-height: 90vh; overflow-y: auto;}
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px; }
        .form-control { width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 12px; font-size: 14px; color: #0D1B2A; outline: none; transition: border-color 0.2s; }
        .form-control:focus { border-color: #0D1B2A; }
        
        @media (max-width: 1000px) { .rooms-layout { grid-template-columns: 1fr; } }
        @media (max-width: 640px) { .detail-grid, .occupant-meta { grid-template-columns: 1fr; } }
      `}</style>

      <div className="rooms-hero">
        <div className="text-xs uppercase tracking-[0.2em] text-white/55 font-semibold">Quản trị phòng ở</div>
        <h1 className="text-3xl font-bold mt-3">Toàn bộ phòng và cư dân trong hệ thống</h1>
        <p className="text-sm text-white/75 mt-2 max-w-3xl">Màn hình này cho phép quản trị viên xem, thêm và xóa các phòng. Quản lý danh sách occupants và thông tin chi tiết.</p>
      </div>

      {error && <div className="p-4 rounded-xl bg-red-100 text-red-800 border border-red-200 font-medium">{error}</div>}

      {loading ? (
        <div className="rooms-panel p-8 text-center text-slate-500">Đang tải dữ liệu phòng...</div>
      ) : (
        <div className="rooms-layout">
          {/* CỘT TRÁI: DANH SÁCH PHÒNG */}
          <section className="rooms-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#0D1B2A]">Danh sách phòng</h2>
              <div className="flex gap-2">
                <button onClick={() => setIsAddModalOpen(true)} className="px-3 py-2 rounded-lg bg-[#0D1B2A] text-white hover:bg-[#1a365d] text-sm font-semibold transition-colors">
                  + Thêm phòng
                </button>
                <button onClick={fetchRooms} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors">
                  Tải lại
                </button>
              </div>
            </div>

            <div className="rooms-list">
              {rooms.map((room, index) => {
                const safeId = room.roomId || room._id || `room-${index}`;
                const isSelected = selectedRoomId === safeId;

                return (
                  <button key={safeId} type="button" onClick={() => setSelectedRoomId(safeId)} className={`room-card text-left ${isSelected ? "room-card--active" : ""}`}>
                    <div className="room-card__top">
                      <div>
                        <div className="room-name">Phòng {room.roomNumber || room.name}</div>
                        <div className="room-sub">Tòa {room.building} · Tầng {room.floor} · {room.roomType || "Tiêu chuẩn"}</div>
                      </div>
                      <span className={`tag ${room.status === "AVAILABLE" ? "tag--available" : room.status === "FULL" ? "tag--full" : "tag--maintenance"}`}>{room.availabilityStatus || room.status}</span>
                    </div>
                    <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
                      <span>Sức chứa: <strong>{room.currentOccupancy} / {room.capacity}</strong></span>
                      <span>Giá: <strong>{room.price.toLocaleString("vi-VN")} đ</strong></span>
                    </div>
                    <div className="chip-row">
                      {room.facilities.slice(0, 4).map((facility) => <span key={facility} className="chip">{facility}</span>)}
                    </div>
                    {/* Cụm avatar sinh viên đang ở trong phòng */}
                    <div className="occ-stack">
                      {room.occupants && room.occupants.length > 0 ? (
                        <>
                          {room.occupants.slice(0, 5).map((occ, i) => (
                            <AvatarLightbox
                              key={occ.userId || occ.mssv || i}
                              name={occ.fullName}
                              avatar={occ.avatar}
                              size={28}
                              style={{ marginLeft: i === 0 ? 0 : -8, boxShadow: "0 0 0 2px #fff" }}
                            />
                          ))}
                          {room.occupants.length > 5 && (
                            <span className="occ-stack__more">+{room.occupants.length - 5}</span>
                          )}
                        </>
                      ) : (
                        <span className="occ-stack__empty">Chưa có sinh viên</span>
                      )}
                    </div>
                  </button>
                );
              })}
              {rooms.length === 0 && <div className="text-center text-sm text-slate-500 py-6">Chưa có phòng nào trong hệ thống.</div>}
            </div>
          </section>

          {/* CỘT PHẢI: CHI TIẾT PHÒNG ĐƯỢC CHỌN */}
          <aside className="rooms-panel p-5">
            {selectedRoom ? (
              <>
                <div className="flex items-start justify-between gap-4 mb-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#0D1B2A]">Phòng {selectedRoom.roomNumber || selectedRoom.name}</h2>
                    <p className="text-sm text-slate-500 mt-1">Chi tiết phòng và toàn bộ cư dân đang được gắn với phòng này.</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`tag ${selectedRoom.status === "AVAILABLE" ? "tag--available" : selectedRoom.status === "FULL" ? "tag--full" : "tag--maintenance"}`}>{selectedRoom.availabilityStatus || selectedRoom.status}</span>
                    {/* NÚT XÓA PHÒNG NẰM Ở ĐÂY */}
                    <button onClick={handleDeleteRoom} className="text-xs px-2 py-1 bg-red-50 text-red-600 font-semibold border border-red-200 rounded-md hover:bg-red-100 transition-colors">
                      Xóa phòng
                    </button>
                  </div>
                </div>

                <div className="detail-grid">
                  <div className="detail-item"><span>Loại phòng</span><span>{selectedRoom.roomType || "Tiêu chuẩn"}</span></div>
                  <div className="detail-item"><span>Hệ thống</span><span>Tòa {selectedRoom.building} / Tầng {selectedRoom.floor}</span></div>
                  <div className="detail-item"><span>Sức chứa</span><span>{selectedRoom.currentOccupancy} / {selectedRoom.capacity}</span></div>
                  <div className="detail-item"><span>Trạng thái</span><span>{selectedRoom.status}</span></div>
                  <div className="detail-item"><span>Giá thuê</span><span>{selectedRoom.price.toLocaleString("vi-VN")} đ/tháng</span></div>
                  <div className="detail-item"><span>Tiện ích</span><span>{selectedRoom.facilities.length} món</span></div>
                </div>

                <div className="mt-5">
                  <div className="text-lg font-bold text-[#0D1B2A] mb-3">Danh sách Occupants</div>
                  {selectedRoom.occupants && selectedRoom.occupants.length > 0 ? (
                    selectedRoom.occupants.map((occupant, idx) => (
                      <div key={occupant.userId || occupant.mssv || idx} className="occupant">
                        <div className="occupant-head">
                          <div className="occupant-identity">
                            <AvatarLightbox name={occupant.fullName} avatar={occupant.avatar} size={46} />
                            <div style={{ minWidth: 0 }}>
                              <div className="occupant-name">{occupant.fullName}</div>
                              <div className="text-sm text-slate-500">MSSV: {occupant.mssv}</div>
                            </div>
                          </div>
                          <span className={`tag ${occupant.roomStatus === "CONFIRMED" ? "tag--available" : "tag--maintenance"}`}>{occupant.roomStatus || "CONFIRMED"}</span>
                        </div>
                        <div className="occupant-meta">
                          <div><strong>Ngày sinh:</strong> {occupant.dateOfBirth ? new Date(occupant.dateOfBirth).toLocaleDateString("vi-VN") : "N/A"}</div>
                          <div><strong>Check-in:</strong> {occupant.checkInDate ? new Date(occupant.checkInDate).toLocaleDateString("vi-VN") : "N/A"}</div>
                          <div><strong>Email:</strong> {occupant.contactInfo?.email || "Không công khai"}</div>
                          <div><strong>Điện thoại:</strong> {occupant.contactInfo?.phone || "Không công khai"}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-500 italic px-4 py-6 border border-dashed border-slate-300 rounded-xl bg-slate-50">
                      Chưa có cư dân nào được phân bổ vào phòng này.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-500">Chưa chọn phòng nào.</div>
            )}
          </aside>
        </div>
      )}

      {/* MODAL THÊM PHÒNG */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text-xl font-bold text-[#0D1B2A] mb-4">Thêm phòng mới</h2>
            <form onSubmit={handleAddRoom}>
              <div className="form-group">
                <label>Tên / Số phòng (*)</label>
                <input required placeholder="VD: P101" type="text" className="form-control" value={newRoom.name} onChange={e => setNewRoom({...newRoom, name: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Tòa nhà (*)</label>
                  <input required placeholder="VD: A1" type="text" className="form-control" value={newRoom.building} onChange={e => setNewRoom({...newRoom, building: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Tầng (*)</label>
                  <input required type="number" min="1" className="form-control" value={newRoom.floor} onChange={e => setNewRoom({...newRoom, floor: parseInt(e.target.value)})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Sức chứa tối đa (*)</label>
                  <input required type="number" min="1" className="form-control" value={newRoom.capacity} onChange={e => setNewRoom({...newRoom, capacity: parseInt(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Giá thuê (VNĐ) (*)</label>
                  <input required type="number" min="0" className="form-control" value={newRoom.price} onChange={e => setNewRoom({...newRoom, price: parseInt(e.target.value)})} />
                </div>
              </div>

              <div className="form-group">
                <label>Tiện ích (Các món cách nhau bằng dấu phẩy)</label>
                <input placeholder="VD: Máy lạnh, Tủ lạnh, Tủ đồ cá nhân" type="text" className="form-control" value={newRoom.facilities} onChange={e => setNewRoom({...newRoom, facilities: e.target.value})} />
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-lg font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200">
                  Hủy
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg font-semibold text-white bg-[#0D1B2A] hover:bg-[#1a365d] disabled:opacity-50">
                  {isSubmitting ? "Đang xử lý..." : "Lưu phòng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}