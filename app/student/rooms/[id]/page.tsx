"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import RoleGuard from "../../../components/RoleGuard";

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

export default function RoomDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  // State của Phòng
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: string } | null>(null);

  // State của Profile (dành cho Header)
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Lấy chi tiết phòng
  useEffect(() => {
    const fetchRoomDetail = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:3001/api/rooms", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const result = await response.json();
          const foundRoom = result.data.find((r: Room) => r._id === id);
          setRoom(foundRoom || null);
        }
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRoomDetail();
  }, [id]);

  // Lấy thông tin Profile cho Header
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3001/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setProfile(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  // Xử lý nút Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleBookRoom = async () => {
    if (!room || !window.confirm(`Bạn có chắc chắn muốn đăng ký phòng ${room.name}?`)) return;
    setProcessing(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ roomId: room._id }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage({ text: "Gửi yêu cầu đăng ký thành công! Vui lòng chờ duyệt.", type: "success" });
      } else {
        setMessage({ text: data.message || "Có lỗi xảy ra", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Lỗi kết nối đến máy chủ.", type: "error" });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 font-medium bg-[#F5F3EF]">Đang tải thông tin chi tiết...</div>;
  }

  if (!room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F3EF]">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Không tìm thấy phòng</h2>
        <Link href="/student/rooms" className="text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["STUDENT"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
        body { background: #f8f9fa; font-family: 'DM Sans', sans-serif; color: #1e293b; }
      `}</style>

      {/* ── THANH ĐIỀU HƯỚNG TRÊN CÙNG (CẬP NHẬT HEADER) ── */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Nút Quay lại */}
          <Link href="/student/rooms" className="flex items-center text-slate-600 hover:text-slate-900 font-medium text-sm gap-2 transition-colors">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Về trang tìm kiếm
          </Link>

          {/* Nhóm Nút Đăng Xuất + Avatar */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-[#E05A6A] bg-[#E05A6A]/10 hover:bg-[#E05A6A]/20 border border-[#E05A6A]/30 transition-all"
              type="button"
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Đăng xuất
            </button>

            {loadingProfile ? (
              <div className="w-9 h-9 rounded-[9px] bg-slate-200 animate-pulse"></div>
            ) : profile?.avatar ? (
              <Link
                href="/student/profile"
                className="block w-9 h-9 rounded-[9px] border-[1.5px] border-[#C9A84C] overflow-hidden hover:scale-105 transition-transform"
                title="Hồ sơ cá nhân"
              >
                <img
                  src={profile.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </Link>
            ) : (
              <Link
                href="/student/profile"
                className="flex items-center justify-center w-9 h-9 rounded-[9px] bg-[#0D1B2A] border-[1.5px] border-[#C9A84C] text-[#C9A84C] font-serif font-bold text-xs hover:scale-105 transition-transform"
                title="Hồ sơ cá nhân"
              >
                {(profile?.fullName ?? "SV").trim().split(" ").pop()?.[0]?.toUpperCase() ?? "S"}
              </Link>
            )}
          </div>

        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Dòng Breadcrumb */}
        <div className="text-sm text-slate-500 mb-6 uppercase tracking-wide font-semibold">
          TRANG CHỦ / TÒA NHÀ {room.building} / <span className="text-green-600">PHÒNG {room.name}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* ── CỘT TRÁI: NỘI DUNG CHÍNH ── */}
          <div className="lg:w-2/3">
            
            {/* Khung Ảnh Lớn */}
            <div className="w-full aspect-[16/9] bg-slate-200 rounded-2xl overflow-hidden mb-8 relative shadow-sm border border-slate-200">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/auth-bg.jpg')" }}></div>
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                1/6 hình ảnh
              </div>
            </div>

            {/* Tiêu đề & Địa chỉ */}
            <h1 className="text-3xl font-bold text-slate-900 mb-4">{`Phòng Ký túc xá chất lượng cao ${room.name} - Tòa ${room.building}`}</h1>
            <div className="flex items-center gap-2 text-slate-600 mb-8 border-b border-slate-200 pb-6">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Khu Ký túc xá sinh viên, Tầng {room.floor}, Tòa nhà {room.building}
            </div>

            {/* Đặc điểm & Tiện ích */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2 border-l-4 border-[#C9A84C] pl-3">ĐẶC ĐIỂM NỔI BẬT</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {room.facilities && room.facilities.length > 0 ? (
                  room.facilities.map((fac, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-700">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {fac}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic text-sm">Chưa cập nhật thông tin tiện ích</p>
                )}
              </div>
            </div>

            {/* Thông tin Mô tả */}
            <div className="mb-8 bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-l-4 border-blue-500 pl-3">THÔNG TIN MÔ TẢ</h3>
                <button className="flex items-center gap-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Sao chép nội dung
                </button>
              </div>
              <div className="text-slate-700 leading-relaxed space-y-4">
                <p><strong>Dormify hân hạnh mang đến cho bạn không gian sống lý tưởng tại phòng {room.name}.</strong></p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Phòng được thiết kế rộng rãi, thoáng mát tại tầng {room.floor}.</li>
                  <li>Mức giá siêu tiết kiệm chỉ với <strong>{room.price.toLocaleString('vi-VN')} đồng/tháng</strong>.</li>
                  <li>Không gian chia sẻ tối đa cho {room.capacity} sinh viên, hiện tại đang có {room.currentOccupancy} bạn đang lưu trú.</li>
                  <li>Giờ giấc tự do, bảo vệ 24/7 an ninh tuyệt đối.</li>
                  <li>Gần trạm xe buýt và các khu vực tiện ích siêu thị, chợ sinh viên.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ── CỘT PHẢI: KHUNG ĐẶT PHÒNG (STICKY) ── */}
          <div className="lg:w-1/3">
            <div className="sticky top-24 bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
              
              {/* Profile Giả lập */}
              <div className="flex flex-col items-center border-b border-slate-100 pb-6 mb-6">
                <div className="w-20 h-20 rounded-full bg-blue-100 border-4 border-white shadow-md flex items-center justify-center mb-3">
                  <span className="text-3xl">👨‍💼</span>
                </div>
                <h4 className="font-bold text-lg text-slate-900">Ban Quản Lý KTX</h4>
                <div className="flex items-center gap-1.5 text-green-600 text-sm font-semibold mt-1">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  Đã được chứng thực
                </div>
              </div>

              {/* Thông số Giá & Chỗ */}
              <div className="mb-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Giá thuê:</span>
                  <span className="text-2xl font-bold text-[#C9A84C]">{room.price.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Hiện trạng:</span>
                  <span className="font-bold text-slate-800">{room.currentOccupancy} / {room.capacity} người</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Trạng thái:</span>
                  <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${room.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : room.status === 'FULL' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {room.status === 'AVAILABLE' ? 'CÒN CHỖ' : room.status === 'FULL' ? 'HẾT CHỖ' : 'BẢO TRÌ'}
                  </span>
                </div>
              </div>

              {/* Thông báo thao tác */}
              {message && (
                <div className={`p-3 mb-5 rounded-xl text-sm font-bold text-center ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                  {message.text}
                </div>
              )}

              {/* Nút Hành Động */}
              <div className="flex flex-col gap-3">
                {room.status === 'AVAILABLE' ? (
                  <button 
                    onClick={handleBookRoom}
                    disabled={processing}
                    className="w-full bg-[#0D1B2A] hover:bg-slate-800 text-white font-bold text-lg py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {processing ? 'Đang gửi...' : 'ĐĂNG KÝ PHÒNG NÀY'}
                  </button>
                ) : (
                   <button disabled className="w-full bg-slate-200 text-slate-400 font-bold text-lg py-4 rounded-xl cursor-not-allowed">
                    {room.status === 'FULL' ? 'PHÒNG ĐÃ KÍN' : 'ĐANG BẢO TRÌ'}
                  </button>
                )}
                
                <div className="flex gap-3">
                  <button className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold py-3 rounded-xl border border-blue-200 flex items-center justify-center gap-2 transition-colors">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 5.8 2 10.5c0 2.7 1.48 5.1 3.8 6.64-.17 1.48-.84 3.12-.89 3.23a.5.5 0 00.67.62c1.4-.49 2.94-1.25 4.12-2.11.75.14 1.53.22 2.3.22 5.52 0 10-3.8 10-8.5S17.52 2 12 2zm-3.5 9a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3.5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3.5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" /></svg>
                    Zalo
                  </button>
                  <button className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-600 font-semibold py-3 rounded-xl border border-amber-200 flex items-center justify-center gap-2 transition-colors">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    Gọi điện
                  </button>
                </div>
              </div>

              {/* Dòng chữ cảnh báo nhỏ */}
              <div className="mt-6 bg-[#fff7ed] p-4 rounded-xl border border-orange-200 text-xs text-orange-800 text-justify leading-relaxed">
                Phản hồi cho chúng tôi biết nếu thông tin không đúng. Chúng tôi sẽ xác minh và có biện pháp xử lý kịp thời. Xin cảm ơn các bạn!
              </div>

            </div>
          </div>

        </div>
      </main>
    </RoleGuard>
  );
}