"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Playfair_Display, Inter } from "next/font/google";

/**
 * Quan trọng: dùng next/font với subset "vietnamese" để đảm bảo các ký tự
 * có dấu tổ hợp (ồ, ề, ặ, ữ...) hiển thị đúng — font hệ thống mặc định của
 * Tailwind (font-serif → Georgia/Times) KHÔNG hỗ trợ đầy đủ bộ dấu tiếng Việt,
 * đó là lý do "HỢP ĐỒNG" / "ĐIỀU KHOẢN" từng bị vỡ chữ ở bản trước.
 */
const display = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700"],
  display: "swap",
});

const body = Inter({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

interface Contract {
  contractNumber: string;
  startDate: string;
  endDate: string;
  rentalFee: number;
  status: string;
  terms: string;
  user: { fullName: string; mssv?: string; email: string; phone?: string; cccd?: string };
  room: { name: string; building: string; floor: number };
}

function Seal({ label }: { label: string }) {
  return (
    <div className="inline-flex flex-col items-center -rotate-6 select-none">
      <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
        <circle cx="34" cy="34" r="31" stroke="#C9A84C" strokeWidth="2" />
        <circle cx="34" cy="34" r="25" stroke="#0D1B2A" strokeWidth="1" strokeDasharray="2 3" />
        <path d="M22 34.5L30.5 43L46 25" stroke="#0D6E4E" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#0D6E4E] text-center max-w-[110px] leading-tight">
        {label}
      </p>
    </div>
  );
}

function Field({ caption, value, highlight = false }: { caption: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl px-4 py-3 border ${
        highlight
          ? "bg-[#FBF3DC] border-[#E9D08F]"
          : "bg-white border-[rgba(13,27,42,0.06)] shadow-[0_1px_2px_rgba(13,27,42,0.04)]"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8A9BAD] mb-1">{caption}</p>
      <p className={`text-[15px] break-words ${highlight ? "text-[#8a6d23] font-bold" : "text-[#0D1B2A] font-medium"}`}>
        {value}
      </p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4
      className={`${display.className} text-[#0D1B2A] border-l-[3px] border-[#C9A84C] pl-3 text-[17px] font-semibold tracking-tight mt-9 mb-3`}
    >
      {children}
    </h4>
  );
}

export default function StudentContractPage() {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchContract = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contracts/my-contract`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const text = await res.text();
        if (text) {
          setContract(JSON.parse(text));
        } else {
          setContract(null);
        }
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
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contracts/extend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ months: 6 }),
      });
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
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contracts/terminate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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
      <div className={`${body.className} flex flex-col items-center justify-center gap-3 py-24`}>
        <span className="h-9 w-9 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" />
        <p className="text-[#8A9BAD] text-xs font-semibold uppercase tracking-wider">Đang đồng bộ hợp đồng…</p>
      </div>
    );
  }

  return (
    <div className={`${body.className} max-w-[800px] mx-auto print:bg-white print:text-black`}>
      <Link
        href="/student"
        className="text-[#C9A84C] no-underline text-sm font-medium inline-flex items-center gap-1.5 mb-5 print:hidden hover:gap-2 transition-all"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Trở về Tổng quan
      </Link>

      {contract ? (
        <div className="relative bg-[#FBFAF7] rounded-2xl border border-[rgba(13,27,42,0.08)] shadow-[0_24px_60px_-24px_rgba(13,27,42,0.2)] print:border-none print:shadow-none print:bg-white">
          {/* Dải vàng letterhead phía trên, bo theo góc thẻ */}
          <div className="h-[5px] rounded-t-2xl bg-gradient-to-r from-[#C9A84C] via-[#EFDBA1] to-[#C9A84C] print:hidden" />

          <div className="relative p-7 sm:p-10 md:p-12">
            {/* Góc khung trang trí kiểu chứng chỉ */}
            <span className="hidden sm:block absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#C9A84C] rounded-tl-sm print:hidden" />
            <span className="hidden sm:block absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#C9A84C] rounded-tr-sm print:hidden" />
            <span className="hidden sm:block absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#C9A84C] rounded-bl-sm print:hidden" />
            <span className="hidden sm:block absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#C9A84C] rounded-br-sm print:hidden" />

            {/* Cảnh báo thanh lý */}
            {contract.status === "TERMINATED" && (
              <div className="flex items-center justify-center gap-2 bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg text-center mb-8 font-semibold text-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9 9l6 6M15 9l-6 6" strokeLinecap="round" />
                </svg>
                HỢP ĐỒNG NÀY ĐÃ ĐƯỢC THANH LÝ
              </div>
            )}

            {/* Tiêu ngữ + tiêu đề hợp đồng */}
            <div className="text-center mb-9">
              <h3 className="uppercase text-[15px] sm:text-base font-bold m-0 tracking-wide text-black">
                Cộng hòa xã hội chủ nghĩa Việt Nam
              </h3>
              <p className="text-sm font-semibold uppercase mt-2 mb-6 text-black border-b-2 border-black inline-block pb-1 px-3">
                Độc lập - Tự do - Hạnh phúc
              </p>

              <h2 className={`${display.className} text-[26px] sm:text-3xl font-bold text-[#0D1B2A] leading-snug px-2`}>
                Hợp đồng điện tử thuê phòng ký túc xá
              </h2>

              <div className="flex flex-col items-center gap-1 mt-4 mb-5">
                <span className="h-[2px] w-16 bg-[#C9A84C] rounded-full" />
                <span className="h-px w-10 bg-[rgba(13,27,42,0.18)]" />
              </div>

              <div className="inline-flex flex-wrap items-center justify-center gap-2">
                <span className="font-mono text-[11px] sm:text-xs text-[#6b7a8a] bg-white border border-[rgba(13,27,42,0.1)] rounded-full px-3 py-1.5">
                  Mã số định danh: {contract.contractNumber}
                </span>
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider rounded-full px-3 py-1.5 border ${
                    contract.status === "ACTIVE"
                      ? "bg-[#FBF3DC] text-[#8a6d23] border-[#E9D08F]"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}
                >
                  ● {contract.status === "ACTIVE" ? "Đang hiệu lực" : "Đã kết thúc"}
                </span>
              </div>
            </div>

            {/* Bên A */}
            <SectionTitle>Bên A: Ban quản lý ký túc xá Dormify</SectionTitle>
            <p className="text-sm m-0 ml-4 text-[#334155]">Đại diện ban điều hành hạ tầng nội trú thông minh.</p>

            {/* Bên B */}
            <SectionTitle>Bên B: Sinh viên đăng ký lưu trú</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-0 sm:ml-4">
              <Field caption="Họ và tên" value={contract.user?.fullName} />
              <Field caption="Mã số sinh viên" value={contract.user?.mssv || "—"} />
              <Field caption="Số CCCD/CMND" value={contract.user?.cccd || "—"} />
              <Field caption="Số điện thoại" value={contract.user?.phone || "—"} />
              <div className="sm:col-span-2">
                <Field caption="Email liên hệ" value={contract.user?.email} />
              </div>
            </div>

            {/* Nội dung thỏa thuận */}
            <SectionTitle>Nội dung thỏa thuận chỗ ở</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 ml-0 sm:ml-4">
              <Field
                caption="Phòng được phân"
                value={`Phòng ${contract.room?.name} · Tòa ${contract.room?.building} · Tầng ${contract.room?.floor}`}
              />
              <Field caption="Phí nội trú / tháng" value={`${contract.rentalFee?.toLocaleString("vi-VN")} VND`} highlight />
              <Field
                caption="Thời hạn hợp đồng"
                value={`${new Date(contract.startDate).toLocaleDateString("vi-VN")} → ${new Date(contract.endDate).toLocaleDateString("vi-VN")}`}
              />
            </div>

            {/* Điều khoản */}
            <SectionTitle>Điều khoản trách nhiệm &amp; nghĩa vụ</SectionTitle>
            <div className="ml-0 sm:ml-4 bg-white border border-[rgba(13,27,42,0.06)] p-5 rounded-xl text-sm whitespace-pre-line leading-relaxed text-[#475569]">
              {contract.terms}
            </div>

            {/* Ký xác nhận */}
            <div className="grid grid-cols-2 mt-12 text-center text-sm">
              <div className="flex flex-col items-center">
                <strong className={`${display.className} text-[#0D1B2A] block mb-3`}>Đại diện Bên A</strong>
                <Seal label="Đã ký số hệ thống" />
              </div>
              <div className="flex flex-col items-center">
                <strong className={`${display.className} text-[#0D1B2A] block mb-3`}>Đại diện Bên B</strong>
                <Seal label="Xác thực điện tử" />
              </div>
            </div>

            {/* Action Buttons — ẩn khi in */}
            <div className="mt-12 flex flex-col gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="w-full p-3.5 flex items-center justify-center gap-2 bg-[#0D1B2A] text-[#C9A84C] border-none rounded-xl cursor-pointer font-semibold text-sm hover:bg-[#16263a] transition-colors shadow-[0_8px_20px_-8px_rgba(13,27,42,0.5)]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path
                    d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                In hoặc tải file hợp đồng (PDF)
              </button>

              {contract.status === "ACTIVE" && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleExtend}
                    className="flex-1 p-3.5 flex items-center justify-center gap-2 bg-[#1E3A5F] text-white border-none rounded-xl cursor-pointer font-semibold text-sm hover:bg-[#152a45] transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                    Gia hạn hợp đồng (+6 tháng)
                  </button>
                  <button
                    onClick={handleTerminate}
                    className="flex-1 p-3.5 flex items-center justify-center gap-2 bg-[#8B2635] text-white border-none rounded-xl cursor-pointer font-semibold text-sm hover:bg-[#6e1e2b] transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                    </svg>
                    Thanh lý hợp đồng
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#FBFAF7] p-12 text-center rounded-2xl border border-[rgba(13,27,42,0.08)]">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.6" className="mx-auto mb-4">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 13h6M9 17h6" strokeLinecap="round" />
          </svg>
          <p className="text-[#8A9BAD] text-sm max-w-[360px] mx-auto">
            Hợp đồng điện tử sẽ tự động xuất hiện tại đây ngay khi đơn xin đăng ký chỗ ở của bạn được Quản trị viên phê duyệt thành công.
          </p>
        </div>
      )}
    </div>
  );
}
