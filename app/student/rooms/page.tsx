"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Room {
  _id: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  currentOccupancy: number;
  price: number;
  status: 'AVAILABLE' | 'FULL' | 'MAINTENANCE';
  facilities: string[];
}

const Icons = {
  back: (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  search: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  building: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  users: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  wallet: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // State xử lý Booking
  const [message, setMessage] = useState({ roomId: "", text: "", type: "" });
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:3001/api/rooms", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const result = await response.json();
          setRooms(result.data);
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách phòng:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  // Hàm xử lý gọi API Đặt phòng
  const handleBookRoom = async (roomId: string, roomName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn gửi yêu cầu đăng ký phòng ${roomName}?`)) return;
    
    setProcessingId(roomId);
    setMessage({ roomId: "", text: "", type: "" });

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomId }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ roomId, text: "Đăng ký thành công! Vui lòng chờ Ban quản lý duyệt.", type: "success" });
      } else {
        setMessage({ roomId, text: data.message || "Có lỗi xảy ra", type: "error" });
      }
    } catch (error) {
      setMessage({ roomId, text: "Lỗi kết nối đến máy chủ.", type: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRooms = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.building.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-[1100px] mx-auto font-sans">
      <style>{`
        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 40px; flex-wrap: wrap; gap: 20px; }
        .header-left { display: flex; align-items: center; gap: 16px; }
        .btn-back {
          width: 40px; height: 40px; border-radius: 10px; border: 1px solid rgba(13,27,42,0.09);
          background: #ffffff; display: flex; align-items: center; justify-content: center;
          color: #0D1B2A; cursor: pointer; transition: all 0.2s; text-decoration: none;
        }
        .btn-back:hover { background: #0D1B2A; color: #ffffff; border-color: #0D1B2A; }
        
        .page-title { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 700; color: #0D1B2A; letter-spacing: -0.5px; }
        .page-subtitle { font-size: 14px; color: #8A9BAD; margin-top: 4px; }

        /* ── SEARCH BAR ── */
        .search-box {
          display: flex; align-items: center; background: #ffffff;
          border: 1px solid rgba(13,27,42,0.09); border-radius: 12px; padding: 12px 16px;
          width: 320px; transition: border-color 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }
        .search-box:focus-within { border-color: #C9A84C; }
        .search-box input { border: none; outline: none; background: transparent; font-family: 'DM Sans', sans-serif; font-size: 14.5px; margin-left: 10px; width: 100%; color: #0D1B2A; }
        .search-box input::placeholder { color: #A0B0C0; }

        /* ── ROOM GRID ── */
        .room-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }

        /* ── ROOM CARD ── */
        .room-card {
          background: #ffffff; border: 1px solid rgba(13,27,42,0.09); border-radius: 16px;
          padding: 24px; display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s;
          position: relative; overflow: hidden;
        }
        .room-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(13,27,42,0.06); }
        
        .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .room-name { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 700; color: #0D1B2A; }
        
        .status-badge {
          padding: 4px 12px; border-radius: 100px; font-size: 11.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
        }
        .status--available { background: rgba(34,197,94,0.1); color: #16a34a; border: 1px solid rgba(34,197,94,0.2); }
        .status--full { background: rgba(239,68,68,0.1); color: #dc2626; border: 1px solid rgba(239,68,68,0.2); }
        .status--maintenance { background: rgba(245,158,11,0.1); color: #d97706; border: 1px solid rgba(245,158,11,0.2); }

        .info-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
        .info-item { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #4A6580; }
        .info-item span { font-weight: 500; color: #0D1B2A; }

        .facilities { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; flex: 1; }
        .facility-chip {
          background: #F8F9FA; border: 1px solid rgba(13,27,42,0.09); color: #5C738A;
          padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500;
        }

        .btn-book {
          width: 100%; padding: 14px; border-radius: 10px; font-family: 'DM Sans', sans-serif;
          font-size: 15px; font-weight: 600; text-align: center; border: none; cursor: pointer;
          transition: all 0.2s;
        }
        .btn-book--active { background: #0D1B2A; color: #ffffff; }
        .btn-book--active:hover { background: #1a334d; box-shadow: 0 4px 12px rgba(13,27,42,0.15); }
        .btn-book--disabled { background: #E2E8F0; color: #94A3B8; cursor: not-allowed; }

        @media (max-width: 640px) {
          .header { flex-direction: column; align-items: flex-start; }
          .search-box { width: 100%; }
        }
      `}</style>

      {/* ── Header & Search ── */}
      <header className="header">
        <div className="header-left">
          <Link href="/student" className="btn-back" title="Quay lại">
            {Icons.back}
          </Link>
          <div>
            <h1 className="page-title">Tìm kiếm phòng</h1>
            <p className="page-subtitle">Khám phá và đăng ký không gian lưu trú của bạn</p>
          </div>
        </div>
        
        <div className="search-box">
          <span style={{ color: "#8A9BAD" }}>{Icons.search}</span>
          <input 
            type="text" 
            placeholder="Tìm theo tòa nhà hoặc tên phòng..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      {/* ── Room List ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#8A9BAD" }}>
          <p>Đang tải danh sách phòng...</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", background: "#ffffff", borderRadius: "16px", border: "1px solid rgba(13,27,42,0.09)" }}>
          <div style={{ color: "#8A9BAD", marginBottom: "12px", display: "flex", justifyContent: "center" }}>{Icons.search}</div>
          <p style={{ fontWeight: 600, fontSize: "16px" }}>Không tìm thấy phòng phù hợp</p>
          <p style={{ fontSize: "14px", color: "#8A9BAD", marginTop: "4px" }}>Thử thay đổi từ khóa tìm kiếm của bạn.</p>
        </div>
      ) : (
        <div className="room-grid">
          {filteredRooms.map((room) => (
            <div key={room._id} className="room-card">
              
              {/* Tên & Trạng thái */}
              <div className="card-header">
                <div className="room-name">{room.name}</div>
                <div className={`status-badge ${
                  room.status === 'AVAILABLE' ? 'status--available' : 
                  room.status === 'FULL' ? 'status--full' : 'status--maintenance'
                }`}>
                  {room.status === 'AVAILABLE' ? 'Còn trống' : 
                   room.status === 'FULL' ? 'Đã đầy' : 'Bảo trì'}
                </div>
              </div>

              {/* Thông tin cơ bản */}
              <div className="info-list">
                <div className="info-item">
                  {Icons.building} Tòa nhà <span>{room.building}</span> — Tầng <span>{room.floor}</span>
                </div>
                <div className="info-item">
                  {Icons.users} Sức chứa <span>{room.currentOccupancy} / {room.capacity}</span> người
                </div>
                <div className="info-item">
                  {Icons.wallet} Giá: <span style={{ color: "#C9A84C", fontSize: "16px", fontWeight: "bold" }}>{room.price.toLocaleString('vi-VN')} đ/tháng</span>
                </div>
              </div>

              {/* Tiện ích */}
              <div className="facilities">
                {room.facilities && room.facilities.length > 0 ? (
                  room.facilities.map((fac, idx) => (
                    <span key={idx} className="facility-chip">{fac}</span>
                  ))
                ) : (
                  <span className="facility-chip" style={{ opacity: 0.5 }}>Chưa cập nhật tiện ích</span>
                )}
              </div>

              {/* Hiển thị thông báo ngay trên nút bấm cho từng phòng cụ thể */}
              {message.roomId === room._id && message.text && (
                <div style={{ 
                  padding: '10px', 
                  marginBottom: '16px', 
                  borderRadius: '8px', 
                  fontSize: '13px', 
                  backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2', 
                  color: message.type === 'success' ? '#166534' : '#991b1b', 
                  textAlign: 'center' 
                }}>
                  {message.text}
                </div>
              )}

              {/* Nút hành động */}
              {room.status === 'AVAILABLE' ? (
                <button 
                  className={`btn-book ${processingId === room._id ? 'btn-book--disabled' : 'btn-book--active'}`}
                  onClick={() => handleBookRoom(room._id, room.name)}
                  disabled={processingId === room._id}
                >
                  {processingId === room._id ? 'Đang xử lý...' : 'Đăng ký phòng này'}
                </button>
              ) : (
                <button className="btn-book btn-book--disabled" disabled>
                  {room.status === 'FULL' ? 'Phòng đã kín chỗ' : 'Phòng đang bảo trì'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}