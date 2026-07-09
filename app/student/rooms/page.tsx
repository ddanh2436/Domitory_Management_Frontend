"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RoleGuard from "../../components/RoleGuard";
import { apiClient } from "../../utils/apiClient";

interface Occupant {
  userId: string;
  fullName: string;
  mssv: string;
  avatar?: string;
  contactInfo?: { phone?: string; email?: string } | null;
  checkInDate: string;
  roomStatus: string;
}

interface RoomData {
  roomId: string;
  roomNumber: string;
  roomType: string;
  building: string;
  floor: number;
  capacity: number;
  currentOccupancy: number;
  status: "AVAILABLE" | "FULL" | "MAINTENANCE";
  availabilityStatus: string;
  price: number;
  facilities: string[];
  occupants: Occupant[];
}

const Icons = {
  back: (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  room: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 21V7a2 2 0 012-2h14a2 2 0 012 2v14M7 21v-8h10v8M7 7h10" />
    </svg>
  ),
  users: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  shield: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3l8 4v5c0 5-3.5 8.7-8 9-4.5-.3-8-4-8-9V7l8-4z" />
    </svg>
  ),
};

export default function StudentRoomsPage() {
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasNoRoom, setHasNoRoom] = useState(false); 

  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true);
      setError("");
      setHasNoRoom(false);

      try {
        const response = await apiClient.get("/rooms/me");
        const payload = await response.json();

        if (!response.ok) {
          if (response.status === 404) {
            setHasNoRoom(true);
          } else {
            setError(payload.message || "Không thể tải thông tin phòng của bạn.");
          }
          setRoom(null);
          return;
        }

        setRoom(payload.data || payload);
      } catch (requestError) {
        console.error(requestError);
        setError("Không thể kết nối đến máy chủ.");
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, []);

  return (
    <RoleGuard allowedRoles={["STUDENT"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700&family=DM+Sans:wght@400;500;700&display=swap');
        .room-page { max-width: 1180px; margin: 0 auto; padding: 24px 0 8px; color: #0D1B2A; }
        .room-hero { background: linear-gradient(135deg, #0D1B2A 0%, #13233a 45%, #1f3653 100%); color: #fff; border-radius: 24px; padding: 28px; position: relative; overflow: hidden; border: 1px solid rgba(201,168,76,0.25); margin-bottom: 24px; }
        .room-hero::after { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at top right, rgba(201,168,76,0.18), transparent 32%), radial-gradient(circle at bottom left, rgba(255,255,255,0.08), transparent 26%); pointer-events: none; }
        .room-hero__grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px); background-size: 48px 48px; opacity: 0.2; pointer-events: none; }
        .room-hero__inner { position: relative; z-index: 1; display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; align-items: flex-start; }
        .room-title { font-family: 'Fraunces', serif; font-size: 34px; line-height: 1.05; margin: 8px 0 10px; letter-spacing: -0.6px; }
        .room-subtitle { max-width: 700px; color: rgba(255,255,255,0.72); font-size: 14px; line-height: 1.6; }
        .room-chip { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 999px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); font-size: 12px; font-weight: 700; letter-spacing: 0.02em; }
        
        /* Đã gỡ bỏ chia cột cho room-layout để tràn toàn màn hình */
        .room-layout { display: block; }
        
        .panel { background: #fff; border: 1px solid rgba(13,27,42,0.09); border-radius: 20px; padding: 24px; box-shadow: 0 10px 24px rgba(13,27,42,0.04); }
        .panel-title { font-family: 'Fraunces', serif; font-size: 20px; margin-bottom: 18px; color: #0D1B2A; }
        
        /* Cấu hình lại các stat-grid và room-meta chia 4 cột giãn đều full bề ngang */
        .stat-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; margin-bottom: 20px; }
        .stat { background: #f8fafc; border: 1px solid rgba(13,27,42,0.08); border-radius: 16px; padding: 16px; }
        .stat__label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #8A9BAD; margin-bottom: 6px; }
        .stat__value { font-size: 18px; font-weight: 700; color: #0D1B2A; }
        
        .room-meta { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; margin-top: 8px; }
        .meta-item { padding: 14px 16px; border-radius: 14px; background: #fffdf8; border: 1px solid rgba(201,168,76,0.18); display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 8px; text-align: center; }
        .meta-item span:first-child { color: #64748b; font-size: 13px; }
        .meta-item span:last-child { color: #0D1B2A; font-weight: 700; font-size: 16px; }
        
        .chips { display: flex; flex-wrap: wrap; gap: 10px; }
        .chip { padding: 8px 12px; border-radius: 999px; background: rgba(13,27,42,0.04); border: 1px solid rgba(13,27,42,0.08); color: #334155; font-size: 13px; font-weight: 600; }
        
        /* Chia lại danh sách người ở thành 2 cột cho đẹp do đã có không gian rộng */
        .occupant-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
        .occupant { border: 1px solid rgba(13,27,42,0.08); border-radius: 18px; padding: 16px; display: grid; grid-template-columns: auto 1fr; gap: 14px; background: linear-gradient(180deg, #fff, #fcfcfb); }
        .avatar { width: 58px; height: 58px; border-radius: 18px; overflow: hidden; background: linear-gradient(135deg, #0D1B2A, #284766); color: #C9A84C; display: flex; align-items: center; justify-content: center; font-family: 'Fraunces', serif; font-weight: 700; font-size: 22px; }
        .occupant-name { font-size: 17px; font-weight: 700; margin-bottom: 4px; }
        .occupant-id { color: #64748b; font-size: 13px; margin-bottom: 10px; }
        .occupant-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; font-size: 13px; color: #334155; }
        .occupant-grid strong { color: #0D1B2A; }
        .status { display: inline-flex; align-items: center; padding: 6px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; }
        .status--active { background: rgba(34,197,94,0.12); color: #16a34a; }
        .status--warning { background: rgba(245,158,11,0.12); color: #d97706; }
        .error-box { background: #fff; border: 1px solid rgba(239,68,68,0.18); color: #b91c1c; border-radius: 16px; padding: 18px; }
        .loading-box { padding: 54px; text-align: center; color: #64748b; }
        
        /* Responsive để tự động rớt dòng khi co nhỏ màn hình */
        @media (max-width: 960px) { 
          .stat-grid, .room-meta, .occupant-list { grid-template-columns: repeat(2, minmax(0, 1fr)); } 
          .occupant-grid { grid-template-columns: 1fr; } 
        }
        @media (max-width: 640px) { 
          .room-page { padding-top: 12px; } 
          .room-title { font-size: 26px; } 
          .stat-grid, .room-meta, .occupant-list, .occupant-grid { grid-template-columns: 1fr; } 
          .room-hero { border-radius: 20px; padding: 22px; } 
          .panel { padding: 18px; } 
        }
      `}</style>

      <div className="room-page">
        <div className="room-hero">
          <div className="room-hero__grid" />
          <div className="room-hero__inner">
            <div>
              <Link href="/student" className="room-chip" style={{ textDecoration: "none", color: "#fff" }}>
                {Icons.back} Về tổng quan
              </Link>
              <h1 className="room-title">Phòng của tôi</h1>
              <p className="room-subtitle">Chỉ hiển thị thôngত্তি tin phòng mà bạn đang được phân. Danh sách bên dưới là các cư dân cùng phòng với quyền riêng tư được giữ đúng theo chính sách.</p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div className="room-chip">{Icons.room} Bảo mật theo vai trò</div>
              <div className="room-chip">{Icons.users} Ở chung an toàn</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="panel loading-box">Đang tải thông tin phòng và danh sách người ở cùng...</div>
        ) : hasNoRoom ? (
          <div className="panel flex flex-col items-center text-center py-16 px-6">
            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-6">
              <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Bạn chưa được phân phòng</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
              Bạn chưa có thông tin phòng ở trong hệ thống. Hãy xem danh sách các phòng đang còn trống và đăng ký để bắt đầu trải nghiệm lưu trú nhé!
            </p>
            <div className="flex gap-4">
              <Link 
                href="/student/book-room" 
                className="px-6 py-3 bg-[#0D1B2A] hover:bg-[#1f3b5c] text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-900/20"
              >
                Khám phá & Đặt phòng
              </Link>
              <Link 
                href="/student/bookings" 
                className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors"
              >
                Xem lịch sử đơn
              </Link>
            </div>
          </div>
        ) : error ? (
          <div className="error-box">{error}</div>
        ) : room ? (
          <div className="room-layout">
            <section className="panel">
              <h2 className="panel-title">Tổng quan phòng</h2>
              <div className="stat-grid">
                <div className="stat"><div className="stat__label">Phòng</div><div className="stat__value">{room.roomNumber}</div></div>
                <div className="stat"><div className="stat__label">Loại phòng</div><div className="stat__value">{room.roomType}</div></div>
                <div className="stat"><div className="stat__label">Sức chứa</div><div className="stat__value">{room.currentOccupancy} / {room.capacity}</div></div>
                <div className="stat"><div className="stat__label">Trạng thái</div><div className="stat__value">{room.availabilityStatus}</div></div>
              </div>

              <div className="room-meta">
                <div className="meta-item"><span>Tòa nhà</span><span>{room.building}</span></div>
                <div className="meta-item"><span>Tầng</span><span>{room.floor}</span></div>
                <div className="meta-item"><span>Giá thuê</span><span>{room.price.toLocaleString("vi-VN")} đ/tháng</span></div>
                <div className="meta-item"><span>Hệ thống kiểm soát</span><span>{room.status === "MAINTENANCE" ? "Bảo trì" : "Hoạt động"}</span></div>
              </div>

              <div style={{ marginTop: 24 }}>
                <div className="panel-title" style={{ marginBottom: 12 }}>Tiện ích</div>
                <div className="chips">
                  {room.facilities.map((facility) => <span key={facility} className="chip">{facility}</span>)}
                </div>
              </div>

              <div style={{ marginTop: 32 }}>
                <div className="panel-title" style={{ marginBottom: 12 }}>Danh sách cư dân cùng phòng</div>
                <div className="occupant-list">
                  {room.occupants.map((occupant, index) => (
                    <article key={occupant.userId || (occupant as any)._id || occupant.mssv || `occupant-${index}`} className="occupant">
                      <div className="avatar">
                        {occupant.avatar ? <img src={occupant.avatar} alt={occupant.fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : occupant.fullName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                          <div>
                            <div className="occupant-name">{occupant.fullName}</div>
                            <div className="occupant-id">MSSV: {occupant.mssv}</div>
                          </div>
                          <span className={`status ${occupant.roomStatus === "CONFIRMED" ? "status--active" : "status--warning"}`}>{occupant.roomStatus || "CONFIRMED"}</span>
                        </div>
                        <div className="occupant-grid">
                          <div><strong>Ngày check-in:</strong> {occupant.checkInDate ? new Date(occupant.checkInDate).toLocaleDateString("vi-VN") : "N/A"}</div>
                          <div><strong>Email:</strong> {occupant.contactInfo?.email || "Không công khai"}</div>
                          <div><strong>Điện thoại:</strong> {occupant.contactInfo?.phone || "Không công khai"}</div>
                          <div><strong>Phòng:</strong> {room.roomNumber}</div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </RoleGuard>
  );
}