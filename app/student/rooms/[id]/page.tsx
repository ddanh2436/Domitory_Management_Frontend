"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import RoleGuard from "../../../components/RoleGuard";
import { apiClient } from "../../../utils/apiClient";

interface Occupant {
  userId: string;
  fullName: string;
  mssv: string;
  avatar?: string;
  contactInfo?: { phone?: string; email?: string } | null;
  checkInDate: string;
  roomStatus: string;
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
  status: 'AVAILABLE' | 'FULL' | 'MAINTENANCE';
  availabilityStatus: string;
  facilities: string[];
  occupants: Occupant[];
}

export default function RoomDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRoomDetail = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await apiClient.get(`/rooms/${id}`);
        const result = await response.json();

        if (response.ok) {
          setRoom(result.data);
        } else {
          setRoom(null);
          setError(result.message || "Bạn không có quyền xem phòng này.");
        }
      } catch (error) {
        console.error(error);
        setError("Không thể kết nối đến máy chủ.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchRoomDetail();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 font-medium bg-[#F5F3EF]">Đang tải thông tin phòng của bạn...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F3EF]">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Không thể hiển thị phòng</h2>
        <p className="text-slate-500 mb-4">{error}</p>
        <Link href="/student/rooms" className="text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>
    );
  }

  if (!room) {
    return null;
  }

  return (
    <RoleGuard allowedRoles={["STUDENT"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700&family=DM+Sans:wght@400;500;700&display=swap');
        .room-detail { max-width: 1180px; margin: 0 auto; padding: 24px 0 8px; color: #0D1B2A; }
        .room-header { background: #0D1B2A; color: #fff; border-radius: 24px; padding: 28px; margin-bottom: 24px; border: 1px solid rgba(201,168,76,0.25); }
        .room-header__title { font-family: 'Fraunces', serif; font-size: 32px; margin: 8px 0 10px; }
        .room-layout { display: grid; grid-template-columns: 1.25fr 0.75fr; gap: 20px; }
        .panel { background: #fff; border: 1px solid rgba(13,27,42,0.09); border-radius: 20px; padding: 24px; box-shadow: 0 10px 24px rgba(13,27,42,0.04); }
        .panel-title { font-family: 'Fraunces', serif; font-size: 20px; margin-bottom: 16px; }
        .occupant { border: 1px solid rgba(13,27,42,0.08); border-radius: 18px; padding: 16px; display: grid; grid-template-columns: auto 1fr; gap: 14px; margin-top: 14px; }
        .avatar { width: 58px; height: 58px; border-radius: 18px; overflow: hidden; background: linear-gradient(135deg, #0D1B2A, #284766); color: #C9A84C; display: flex; align-items: center; justify-content: center; font-family: 'Fraunces', serif; font-weight: 700; font-size: 22px; }
        .status { display: inline-flex; align-items: center; padding: 6px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; }
        .status--active { background: rgba(34,197,94,0.12); color: #16a34a; }
        .status--warning { background: rgba(245,158,11,0.12); color: #d97706; }
        .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .meta-item { padding: 14px 16px; border-radius: 14px; background: #f8fafc; border: 1px solid rgba(13,27,42,0.08); display: flex; justify-content: space-between; gap: 12px; }
        .meta-item span:first-child { color: #64748b; }
        .meta-item span:last-child { color: #0D1B2A; font-weight: 700; text-align: right; }
        .side-line { display: flex; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(13,27,42,0.08); font-size: 14px; }
        .side-line:last-child { border-bottom: 0; padding-bottom: 0; }
        .side-line span:first-child { color: #64748b; }
        .side-line span:last-child { color: #0D1B2A; font-weight: 700; text-align: right; }
        .occupant-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; font-size: 13px; color: #334155; margin-top: 10px; }
        @media (max-width: 960px) { .room-layout { grid-template-columns: 1fr; } .meta, .occupant-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 640px) { .room-detail { padding-top: 12px; } .room-header__title { font-size: 26px; } .meta, .occupant-grid { grid-template-columns: 1fr; } .panel { padding: 18px; } }
      `}</style>

      <div className="room-detail">
        <div className="room-header">
          <Link href="/student/rooms" className="text-white/80 hover:text-white text-sm font-semibold" style={{ textDecoration: "none" }}>← Quay lại danh sách</Link>
          <div className="room-header__title">Phòng {room.roomNumber}</div>
          <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 14 }}>Thông tin chỉ hiển thị cho phòng của bạn.</div>
        </div>

        <div className="room-layout">
          <section className="panel">
            <div className="panel-title">Tổng quan chi tiết</div>
            <div className="meta">
              <div className="meta-item"><span>Loại phòng</span><span>{room.roomType}</span></div>
              <div className="meta-item"><span>Trạng thái</span><span>{room.availabilityStatus}</span></div>
              <div className="meta-item"><span>Tòa nhà</span><span>{room.building}</span></div>
              <div className="meta-item"><span>Tầng</span><span>{room.floor}</span></div>
              <div className="meta-item"><span>Sức chứa</span><span>{room.currentOccupancy} / {room.capacity}</span></div>
              <div className="meta-item"><span>Giá</span><span>{room.price.toLocaleString("vi-VN")} đ/tháng</span></div>
            </div>

            <div style={{ marginTop: 22 }}>
              <div className="panel-title" style={{ marginBottom: 12 }}>Tiện ích</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {room.facilities.map((facility) => (
                  <span key={facility} style={{ padding: "8px 12px", borderRadius: 999, background: "rgba(13,27,42,0.04)", border: "1px solid rgba(13,27,42,0.08)", fontSize: 13, fontWeight: 600 }}>
                    {facility}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <div className="panel-title">Cư dân cùng phòng</div>
              {room.occupants.map((occupant) => (
                <div key={occupant.userId} className="occupant">
                  <div className="avatar">
                    {occupant.avatar ? <img src={occupant.avatar} alt={occupant.fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : occupant.fullName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 700 }}>{occupant.fullName}</div>
                        <div style={{ color: "#64748b", fontSize: 13 }}>MSSV: {occupant.mssv}</div>
                      </div>
                      <span className={`status ${occupant.roomStatus === "CONFIRMED" ? "status--active" : "status--warning"}`}>{occupant.roomStatus}</span>
                    </div>
                    <div className="occupant-grid">
                      <div><strong>Check-in:</strong> {new Date(occupant.checkInDate).toLocaleDateString("vi-VN")}</div>
                      <div><strong>Email:</strong> {occupant.contactInfo?.email || "Không công khai"}</div>
                      <div><strong>Điện thoại:</strong> {occupant.contactInfo?.phone || "Không công khai"}</div>
                      <div><strong>Phòng:</strong> {room.roomNumber}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="panel">
            <div className="panel-title">Ghi chú quyền riêng tư</div>
            <div className="side-line"><span>Phạm vi truy cập</span><span>Chỉ occupants của phòng này</span></div>
            <div className="side-line"><span>Contact</span><span>Chỉ khi cho phép</span></div>
            <div className="side-line"><span>Kiểm tra quyền</span><span>API nội bộ</span></div>
            <div className="side-line"><span>Log bảo mật</span><span>Đã bật</span></div>
            <div style={{ marginTop: 18, padding: 16, borderRadius: 16, background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412", fontSize: 13, lineHeight: 1.6 }}>
              Nếu bạn mở một phòng khác không thuộc quyền, hệ thống sẽ từ chối ngay tại lớp API và ghi nhận hành vi truy cập không hợp lệ.
            </div>
          </aside>
        </div>
      </div>
    </RoleGuard>
  );
}