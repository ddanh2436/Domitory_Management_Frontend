"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "../../../utils/apiClient";
import RoleGuard from "../../../components/RoleGuard";
import { useConfirm } from "../../../components/ConfirmProvider";
import { useToast } from "../../../components/ToastProvider";
import { 
  ArrowLeft, MapPin, CheckCircle2, Shield, 
  Wifi, Wind, Bed, Zap, Clock, Info, ShieldCheck, Sparkles
} from "lucide-react";

interface RoomData {
  _id: string;
  name?: string;
  roomNumber?: string;
  building: string;
  floor: number;
  capacity: number;
  currentOccupancy: number;
  price: number;
  status?: string;
}

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const confirmDialog = useConfirm();
  const toast = useToast();
  
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPendingBooking, setHasPendingBooking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true);

      // Handle "me" as special case - redirect to main rooms page
      if (params.id === "me") {
        router.replace("/student/rooms");
        return;
      }

      try {
        const response = await apiClient.get(`/rooms/${params.id}`);
        
        if (response.ok) {
          const data = await response.json();
          setRoom(data.data || data);
        } else {
          setRoom(null);
        }
      } catch (error) {
        console.error("Lỗi:", error);
        setRoom(null);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchRoom();
  }, [params.id]);

  const handleBooking = async () => {
    if (hasPendingBooking || isSubmitting || !room) return;
    const ok = await confirmDialog({
      title: "Gửi yêu cầu đăng ký phòng?",
      message: "Đơn đăng ký sẽ được gửi đến Ban quản lý phê duyệt. Bạn chưa phải thanh toán lúc này.",
      confirmLabel: "Gửi yêu cầu",
    });
    if (!ok) return;

    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/bookings', { roomId: room._id });
      if (res.ok) {
        toast.success("Ban Quản Lý sẽ sớm phê duyệt đơn của bạn.", "Đặt phòng thành công 🎉");
        router.push("/student");
      } else {
        const data = await res.json();
        toast.error(data.message || "Đã xảy ra lỗi khi đặt phòng.");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={["STUDENT"]}>
        <div className="min-h-screen bg-white max-w-7xl mx-auto px-4 sm:px-6 py-12 animate-pulse">
          <div className="h-10 bg-slate-100 rounded-xl w-1/3 mb-8"></div>
          <div className="h-[400px] bg-slate-100 rounded-3xl mb-16"></div>
          <div className="grid lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2 space-y-8">
              <div className="h-12 bg-slate-100 rounded-xl w-3/4"></div>
              <div className="h-6 bg-slate-100 rounded-lg w-1/2"></div>
              <div className="h-48 bg-slate-100 rounded-2xl mt-10"></div>
            </div>
            <div className="h-[450px] bg-slate-100 rounded-3xl"></div>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (!room) {
    return (
      <RoleGuard allowedRoles={["STUDENT"]}>
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
          <div className="p-8 bg-white rounded-3xl shadow-sm border border-slate-100 text-center max-w-sm">
            <Info className="w-14 h-14 text-slate-300 mx-auto mb-5" />
            <h2 className="text-xl font-bold text-slate-800">Không tìm thấy phòng</h2>
            <p className="text-slate-500 text-[15px] leading-relaxed mt-2 mb-8">Căn phòng này có thể đã bị xóa hoặc tạm thời không có sẵn trên hệ thống.</p>
            <button onClick={() => router.back()} className="w-full py-3 bg-[#0D1B2A] hover:bg-[#1A2E42] text-white rounded-lg font-semibold transition-colors">Quay lại danh sách</button>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["STUDENT"]}>
      <div className="min-h-screen bg-white pb-24 font-sans">
        <style>{`
          .rd-serif { font-family: 'FrauncesAmp', 'Fraunces', serif; }
        `}</style>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6">
          <button
            onClick={() => router.back()}
            className="group inline-flex items-center text-sm font-semibold text-slate-500 hover:text-[#0D1B2A] transition-colors"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-slate-200 mr-3 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </span>
            Trở về tìm kiếm
          </button>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <h1 className="rd-serif text-3xl sm:text-[40px] font-bold text-[#0D1B2A] tracking-tight leading-tight mb-4">
              {room.name || room.roomNumber} <span className="font-light text-slate-400">|</span> Ký túc xá Tiêu chuẩn
            </h1>
            <div className="flex items-center text-slate-600 font-medium text-[15px]">
              <MapPin className="w-5 h-5 mr-2 text-[#C9A84C]" />
              Tòa <span className="text-[#0D1B2A] font-bold mx-1">{room.building}</span>,
              Tầng <span className="text-[#0D1B2A] font-bold mx-1">{room.floor}</span>
              <span className="mx-3 text-slate-300">|</span>
              <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md text-sm font-bold">
                Đang có {room.currentOccupancy || 0}/{room.capacity} sinh viên
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-[420px] mb-16 rounded-3xl overflow-hidden">
            <div className="md:col-span-2 bg-slate-200 hover:brightness-95 transition-all cursor-pointer">
              <img src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=1000" alt="Main" className="w-full h-full object-cover" />
            </div>
            <div className="hidden md:grid grid-rows-2 gap-3">
              <div className="bg-slate-200 hover:brightness-95 transition-all cursor-pointer">
                <img src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=500" alt="Detail 1" className="w-full h-full object-cover" />
              </div>
              <div className="bg-slate-200 hover:brightness-95 transition-all cursor-pointer">
                <img src="https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=500" alt="Detail 2" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="hidden md:grid grid-rows-2 gap-3">
              <div className="bg-slate-200 hover:brightness-95 transition-all cursor-pointer">
                <img src="https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=500" alt="Detail 3" className="w-full h-full object-cover" />
              </div>
              <div className="bg-slate-200 hover:brightness-95 transition-all cursor-pointer relative">
                <img src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=500" alt="Detail 4" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white font-bold tracking-wide cursor-pointer hover:bg-black/40 transition-colors">
                  Khám phá ảnh
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 relative">
            <div className="lg:col-span-7 space-y-12">
              <div className="pb-10 border-b border-slate-200">
                <h2 className="rd-serif text-2xl font-bold text-[#0D1B2A] mb-8 tracking-tight">Tiện nghi có sẵn</h2>
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <div className="flex items-center text-slate-700 font-medium text-[15px]"><Bed className="w-6 h-6 mr-4 text-slate-400 stroke-[1.5px]"/> Giường tầng cao cấp</div>
                  <div className="flex items-center text-slate-700 font-medium text-[15px]"><Wind className="w-6 h-6 mr-4 text-slate-400 stroke-[1.5px]"/> Máy lạnh Inverter</div>
                  <div className="flex items-center text-slate-700 font-medium text-[15px]"><Wifi className="w-6 h-6 mr-4 text-slate-400 stroke-[1.5px]"/> Wifi băng thông rộng</div>
                  <div className="flex items-center text-slate-700 font-medium text-[15px]"><Zap className="w-6 h-6 mr-4 text-slate-400 stroke-[1.5px]"/> Điện nước tiêu chuẩn</div>
                  <div className="flex items-center text-slate-700 font-medium text-[15px]"><Shield className="w-6 h-6 mr-4 text-slate-400 stroke-[1.5px]"/> Hệ thống An ninh 24/7</div>
                  <div className="flex items-center text-slate-700 font-medium text-[15px]"><Clock className="w-6 h-6 mr-4 text-slate-400 stroke-[1.5px]"/> Giờ giấc linh hoạt</div>
                </div>
              </div>

              <div className="pb-10">
                <h2 className="rd-serif text-2xl font-bold text-[#0D1B2A] mb-6 tracking-tight">Giới thiệu về không gian</h2>
                <div className="text-[16px] text-slate-600 leading-9 space-y-6 tracking-[0.015em]">
                  <p>
                    Chào mừng bạn đến với hệ thống Ký túc xá Dormify. Phòng <strong className="text-slate-900 font-bold">{room.name || room.roomNumber}</strong> được thiết kế theo tiêu chuẩn hiện đại nhất, nhằm tối ưu hóa trọn vẹn không gian sinh hoạt và học tập cho sinh viên.
                  </p>
                  <p>
                    Vị trí đắc địa nằm tại tòa <strong className="text-slate-900 font-bold">{room.building}</strong> giúp bạn dễ dàng di chuyển tiếp cận các khu vực trọng yếu như căn tin, thư viện và bến xe buýt trung tâm. Môi trường sống văn minh, thân thiện cùng hệ thống an ninh chặt chẽ đảm bảo mang lại sự an tâm tuyệt đối trong suốt quá trình lưu trú.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="sticky top-8 bg-white border border-slate-200 rounded-3xl p-8 shadow-[0_12px_40px_-15px_rgba(0,0,0,0.1)]">
                <div className="flex items-baseline mb-8 pb-8 border-b border-slate-100">
                  <span className="rd-serif text-4xl font-bold text-[#0D1B2A] tracking-tight">
                    {new Intl.NumberFormat('vi-VN').format(room.price || 1500000)}<span className="text-2xl">đ</span>
                  </span>
                  <span className="text-slate-500 font-medium ml-2 text-lg">/ tháng</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Hiện trạng</span>
                    <span className="text-[15px] font-bold text-slate-800">{room.currentOccupancy || 0} / {room.capacity} Khách</span>
                  </div>
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                    <span className="block text-[11px] font-extrabold text-emerald-600/80 uppercase tracking-widest mb-1">Trạng thái</span>
                    <span className="text-[15px] font-bold text-emerald-700">Sẵn sàng đón tiếp</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <ShieldCheck className="w-5 h-5 mr-3 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-[14px] text-slate-600 font-medium leading-relaxed tracking-wide">Bảo mật thông tin & Xử lý duyệt đơn nhanh chóng.</span>
                  </li>
                  <li className="flex items-start">
                    <Sparkles className="w-5 h-5 mr-3 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-[14px] text-slate-600 font-medium leading-relaxed tracking-wide">Không phát sinh bất kỳ khoản phí môi giới nào.</span>
                  </li>
                </ul>

                {hasPendingBooking && (
                  <div className="mb-6 bg-rose-50 text-rose-700 text-sm font-semibold p-4 rounded-xl border border-rose-100 flex items-start">
                    <Info className="w-5 h-5 mr-2 shrink-0" />
                    Bạn đang có đơn chờ duyệt. Vui lòng hoàn tất hoặc hủy đơn cũ trước.
                  </div>
                )}

                <button
                  onClick={handleBooking}
                  disabled={hasPendingBooking || isSubmitting}
                  className={`w-full py-4 rounded-lg font-bold text-[16px] tracking-wide transition-all duration-200 ${
                    hasPendingBooking
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-[#0D1B2A] hover:bg-[#1A2E42] text-white shadow-lg shadow-[#0D1B2A]/25 active:scale-[0.98]"
                  }`}
                >
                  {isSubmitting ? "HỆ THỐNG ĐANG XỬ LÝ..." : "GỬI ĐƠN ĐĂNG KÝ NGAY"}
                </button>

                <div className="text-center text-slate-400 text-[13px] font-medium mt-5 tracking-wide">
                  Bạn chưa phải thanh toán lúc này.
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}