"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Playfair_Display, Inter } from "next/font/google";
import { apiClient } from "../../utils/apiClient";

const display = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const body = Inter({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

interface Contract {
  _id: string;
  contractNumber: string;
  startDate: string;
  endDate: string;
  rentalFee: number;
  status: string;
  terms: string;
  user: { fullName: string; mssv?: string; email: string; phone?: string; cccd?: string };
  room: { name: string; building: string; floor: number };
}

// ─── Component Con Dấu ────────────────────────────────────────────────────────
function Seal({ label, type }: { label: string; type: "success" | "gold" }) {
  const color = type === "success" ? "#0D6E4E" : "#C9A84C";
  return (
    <div className="inline-flex flex-col items-center -rotate-6 select-none" style={{ animation: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}>
      <svg width="90" height="90" viewBox="0 0 80 80" fill="none" style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.08))" }}>
        <circle cx="40" cy="40" r="36" stroke={color} strokeWidth="1.5" />
        <circle cx="40" cy="40" r="31" stroke={color} strokeWidth="1" strokeDasharray="3 3" />
        <path d="M26 40.5L35 49L52 30" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-center max-w-[110px] leading-tight" style={{ color }}>
        {label}
      </p>
    </div>
  );
}

// ─── Component Ô Thông Tin ───────────────────────────────────────────────────
function Field({ caption, value, highlight = false }: { caption: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div
      className={`rounded-2xl px-5 py-4 border transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${
        highlight
          ? "bg-amber-50/80 border-amber-200 shadow-sm"
          : "bg-slate-50/60 border-slate-100 shadow-sm"
      }`}
    >
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">{caption}</p>
      <p className={`text-[15px] break-words leading-relaxed ${highlight ? "text-amber-900 font-bold text-lg" : "text-slate-800 font-semibold"}`}>
        {value}
      </p>
    </div>
  );
}

// ─── Component Tiêu Đề Mục ────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mt-10 mb-6">
      <h4 className={`${display.className} text-slate-900 text-[18px] font-bold tracking-tight whitespace-nowrap flex items-center gap-2.5`}>
        <span className="w-2 h-5 bg-amber-500 rounded-full inline-block" />
        {children}
      </h4>
      <div className="flex-1 border-b-2 border-dashed border-slate-200/80"></div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentContractPage() {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchContract = async () => {
    try {
      const res = await apiClient.get("/contracts/my-contract");
      if (res.ok) {
        const text = await res.text();
        if (text) {
          setContract(JSON.parse(text));
        } else {
          setContract(null);
        }
      } else {
        setContract(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContract();
  }, []);

  const handleExtend = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn gia hạn hợp đồng thêm 6 tháng?")) return;
    try {
      const res = await apiClient.post("/contracts/extend", { months: 6 });
      if (res.ok) {
        alert("Gia hạn hợp đồng thành công!");
        fetchContract();
      } else {
        alert("Có lỗi xảy ra khi gia hạn hợp đồng.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleTerminate = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn thanh lý hợp đồng ngay bây giờ? Việc này không thể hoàn tác.")) return;
    try {
      const res = await apiClient.post("/contracts/terminate", {});
      if (res.ok) {
        alert("Thanh lý hợp đồng thành công!");
        fetchContract();
      } else {
        alert("Có lỗi xảy ra khi thanh lý hợp đồng.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className={`${body.className} flex flex-col items-center justify-center gap-4 py-32 bg-slate-50/50 min-h-screen`}>
        <span className="h-10 w-10 rounded-full border-4 border-slate-900 border-t-transparent animate-spin" />
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">Đang tải tài liệu điện tử…</p>
      </div>
    );
  }

  return (
    <div className={`${body.className} w-full min-h-screen bg-slate-50/60 py-10 px-4 print:p-0 print:bg-white flex flex-col items-center`}>
      
      {/* ── Mở rộng tối đa container lên 900px ── */}
      <div className="w-full max-w-[900px] flex flex-col">
        
        <Link
          href="/student"
          className="text-slate-500 no-underline text-sm font-semibold inline-flex items-center gap-2 mb-8 print:hidden hover:text-slate-900 transition-colors group self-start"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transform group-hover:-translate-x-1 transition-transform">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Trở về Tổng quan
        </Link>

        {contract ? (
          <div className="space-y-8 w-full">
            
            {/* ── TỜ GIẤY HỢP ĐỒNG ── */}
            <div className="relative bg-white rounded-[2rem] border border-slate-200/80 shadow-[0_30px_80px_-20px_rgba(13,27,42,0.1)] overflow-hidden print:border-none print:shadow-none print:rounded-none w-full">
              <div className="h-[8px] bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 print:hidden" />

              {/* Watermark lớn hơn */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.025] print:opacity-[0.05]">
                <span className={`${display.className} text-[150px] font-black -rotate-12 text-slate-900 tracking-tighter`}>
                  DORMIFY
                </span>
              </div>

              {/* Tăng padding của nội dung tờ giấy */}
              <div className="relative z-10 p-8 sm:p-14 md:p-16 space-y-10">
                
                {contract.status === "TERMINATED" && (
                  <div className="flex items-center justify-center gap-3 bg-red-50 text-red-700 border border-red-100 p-4 rounded-2xl text-center font-bold text-sm tracking-wider animate-pulse mb-4">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    HỢP ĐỒNG NÀY ĐÃ ĐƯỢC THANH LÝ HỦY BỎ
                  </div>
                )}

                {/* Phần Tiêu Ngữ Quốc Gia */}
                <div className="text-center space-y-2">
                  <h3 className="uppercase text-[15px] sm:text-[17px] font-extrabold tracking-wider text-slate-900">
                    Cộng hòa xã hội chủ nghĩa Việt Nam
                  </h3>
                  <p className="text-[13px] font-bold uppercase text-slate-700 tracking-widest inline-block px-4">
                    Độc lập - Tự do - Hạnh phúc
                  </p>
                  <p className="text-slate-300 text-sm font-bold tracking-widest mt-1">-----o0o-----</p>
                  
                  <div className="pt-8">
                    <h2 className={`${display.className} text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug`}>
                      Hợp đồng điện tử thuê phòng ký túc xá
                    </h2>
                    <div className="flex justify-center gap-4 mt-6 text-[12px] font-bold flex-wrap">
                      <span className="font-mono text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-1.5 shadow-sm">
                        Số định danh: {contract.contractNumber}
                      </span>
                      <span className={`px-3.5 py-1.5 rounded-lg uppercase tracking-wider border shadow-sm ${contract.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                        {contract.status === "ACTIVE" ? "● Đang hiệu lực" : "● Đã thanh lý"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <SectionTitle>Bên A: Ban quản lý ký túc xá Dormify</SectionTitle>
                  <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-5 text-[15px] text-slate-600 font-medium leading-relaxed">
                    Đại diện ban điều hành và quản lý hạ tầng nội trú sinh viên thông minh.
                  </div>
                </div>

                <div>
                  <SectionTitle>Bên B: Sinh viên đăng ký lưu trú</SectionTitle>
                  {/* Chuyển grid thành khoảng cách rộng hơn */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field caption="Họ và tên" value={contract.user?.fullName} />
                    <Field caption="Mã số sinh viên" value={contract.user?.mssv || "—"} />
                    <Field caption="Số CCCD/CMND" value={contract.user?.cccd || "—"} />
                    <Field caption="Số điện thoại" value={contract.user?.phone || "—"} />
                    <div className="sm:col-span-2">
                      <Field caption="Email liên hệ" value={contract.user?.email} />
                    </div>
                  </div>
                </div>

                <div>
                  <SectionTitle>Nội dung thỏa thuận chỗ ở</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="sm:col-span-2">
                      <Field caption="Phòng được phân bổ" value={`Phòng ${contract.room?.name} · Tòa ${contract.room?.building} (Tầng ${contract.room?.floor})`} />
                    </div>
                    <Field caption="Phí nội trú hàng tháng" value={`${contract.rentalFee?.toLocaleString("vi-VN")} ₫`} highlight />
                    <div className="sm:col-span-3">
                      <Field caption="Thời hạn hiệu lực của hợp đồng" value={`${new Date(contract.startDate).toLocaleDateString("vi-VN")} — đến hết ngày — ${new Date(contract.endDate).toLocaleDateString("vi-VN")}`} />
                    </div>
                  </div>
                </div>

                <div>
                  <SectionTitle>Điều khoản trách nhiệm &amp; nghĩa vụ</SectionTitle>
                  <div className="bg-slate-50/60 border border-slate-100 p-6 rounded-2xl text-[14px] whitespace-pre-line leading-loose text-slate-700 font-medium">
                    {contract.terms}
                  </div>
                </div>

                {/* Phần Chữ Ký */}
                <div className="grid grid-cols-2 pt-12 border-t-2 border-dashed border-slate-100 text-center gap-4 mt-8">
                  <div className="flex flex-col items-center space-y-5">
                    <strong className="text-slate-800 text-[15px] block font-extrabold tracking-wide uppercase">Đại diện Ban Quản Lý</strong>
                    <Seal label="Đã ký số hệ thống" type="gold" />
                  </div>
                  <div className="flex flex-col items-center space-y-5">
                    <strong className="text-slate-800 text-[15px] block font-extrabold tracking-wide uppercase">Sinh viên xác nhận</strong>
                    <Seal label="Xác thực sinh viên" type="success" />
                  </div>
                </div>

              </div>
            </div>

            {/* ── KHỐI CÁC NÚT BUTTON ── */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row gap-5 print:hidden w-full">
              <button
                onClick={() => window.print()}
                className="flex-1 py-4 px-6 flex items-center justify-center gap-3 bg-slate-900 text-amber-400 rounded-2xl font-bold text-[15px] hover:bg-slate-800 transition-all duration-300 active:scale-[0.98] hover:-translate-y-1 shadow-lg shadow-slate-900/15"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H7a2 2 0 00-2 2v4h12z" />
                </svg>
                In / Xuất file hợp đồng (PDF)
              </button>

              {contract.status === "ACTIVE" && (
                <div className="flex flex-1 gap-4">
                  <button
                    onClick={handleExtend}
                    className="flex-1 py-4 px-5 flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-[15px] transition-all duration-300 active:scale-[0.98] hover:-translate-y-1 shadow-lg shadow-blue-600/20"
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Gia hạn
                  </button>
                  <button
                    onClick={handleTerminate}
                    className="flex-1 py-4 px-5 flex items-center justify-center gap-2.5 bg-rose-50 hover:bg-red-50 text-rose-600 border-2 border-rose-200 hover:border-rose-300 font-bold rounded-2xl text-[15px] transition-all duration-300 active:scale-[0.98] hover:-translate-y-1"
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Thanh lý
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-[2rem] p-20 text-center shadow-sm max-w-2xl mx-auto mt-12 w-full">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8 text-amber-500">
              <svg width="36" height="36" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h2 className={`${display.className} text-2xl font-bold text-slate-900 mb-3`}>Chưa ghi nhận hợp đồng điện tử</h2>
            <p className="text-slate-500 text-[15px] leading-relaxed">
              Hợp đồng pháp lý số sẽ được tự động đồng bộ và xuất bản tại không gian này ngay khi đơn đăng ký phòng của bạn được phê duyệt hoàn tất.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}