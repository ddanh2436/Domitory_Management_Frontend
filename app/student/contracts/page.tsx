"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Playfair_Display, Inter } from "next/font/google";
import { apiClient } from "../../utils/apiClient";
import { useToast } from "../../components/ToastProvider";

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

type ToastKind = "success" | "error";

interface ConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  variant: "default" | "danger";
  onConfirm: () => void;
}

// ─── Confirm Dialog ─────────────────────────────────────────────────────────
function ConfirmDialog({ state, busy, onCancel }: { state: ConfirmState | null; busy: boolean; onCancel: () => void }) {
  if (!state) return null;
  const isDanger = state.variant === "danger";
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 space-y-5 animate-[dialog-in_0.2s_ease-out]">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            isDanger ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A2 2 0 004 21h16a2 2 0 001.89-2.96L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h3 id="confirm-title" className={`${display.className} text-xl font-bold text-slate-900`}>
            {state.title}
          </h3>
          <p className="text-slate-500 text-[14.5px] leading-relaxed">{state.message}</p>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 py-3 rounded-xl font-bold text-[14px] text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            onClick={state.onConfirm}
            disabled={busy}
            className={`flex-1 py-3 rounded-xl font-bold text-[14px] text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2 ${
              isDanger ? "bg-rose-600 hover:bg-rose-700" : "bg-slate-900 hover:bg-slate-800"
            }`}
          >
            {busy && <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
            {state.confirmLabel}
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes dialog-in {
          from { opacity: 0; transform: scale(0.96) translateY(4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Component Con Dấu Mộc Điển Tử ─────────────────────────────────────────────
function Seal({ label, type }: { label: string; type: "red" | "blue" }) {
  const color = type === "red" ? "#dc2626" : "#2563eb"; // Đỏ đô hoặc Xanh dương đậm
  return (
    <div className="inline-flex flex-col items-center -rotate-12 select-none opacity-90 mix-blend-multiply">
      <svg width="100" height="100" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="36" stroke={color} strokeWidth="2" />
        <circle cx="40" cy="40" r="32" stroke={color} strokeWidth="1" strokeDasharray="2 2" />
        <path d="M25 40L35 50L55 30" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-center max-w-[120px] leading-tight" style={{ color }}>
        {label}
      </p>
    </div>
  );
}

// ─── Trạng thái tải trang (skeleton) ─────────────────────────────────────────
function DocumentSkeleton() {
  return (
    <div className="w-full max-w-[850px] animate-pulse space-y-8">
      <div className="h-5 w-32 bg-slate-200/70 rounded-full" />
      <div className="bg-white rounded border border-slate-200 p-8 sm:p-16 space-y-8 min-h-[600px]">
        <div className="space-y-4 flex flex-col items-center">
          <div className="h-4 w-64 bg-slate-200/70 rounded-full" />
          <div className="h-4 w-48 bg-slate-200/70 rounded-full" />
          <div className="h-8 w-80 bg-slate-200/70 rounded-md mt-8" />
        </div>
        <div className="space-y-4 pt-12">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 bg-slate-100 rounded-full w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Formatter ────────────────────────────────────────────────────────────────
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentContractPage() {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const notify = useToast();

  // Chuyển pushToast sang hệ thống toast dùng chung (giữ nguyên chữ ký gọi sẵn có)
  const pushToast = useCallback(
    (kind: ToastKind, message: string) => {
      if (kind === "success") notify.success(message);
      else notify.error(message);
    },
    [notify],
  );

  const fetchContract = useCallback(async () => {
    try {
      const res = await apiClient.get("/contracts/my-contract");
      if (res.ok) {
        const text = await res.text();
        setContract(text ? JSON.parse(text) : null);
        setLoadError(false);
      } else {
        setContract(null);
      }
    } catch (err) {
      console.error(err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  const closeConfirm = () => { if (!actionBusy) setConfirmState(null); };

  const runAction = async (action: () => Promise<Response>, successMsg: string, errorMsg: string) => {
    setActionBusy(true);
    try {
      const res = await action();
      if (res.ok) {
        pushToast("success", successMsg);
        setConfirmState(null);
        await fetchContract();
      } else {
        pushToast("error", errorMsg);
      }
    } catch (error) {
      console.error(error);
      pushToast("error", errorMsg);
    } finally {
      setActionBusy(false);
    }
  };

  const handleExtend = () => {
    setConfirmState({
      title: "Gia hạn hợp đồng",
      message: "Hợp đồng sẽ được gia hạn thêm 6 tháng kể từ ngày hết hạn hiện tại. Bạn có muốn tiếp tục?",
      confirmLabel: "Gia hạn 6 tháng",
      variant: "default",
      onConfirm: () =>
        runAction(
          () => apiClient.post("/contracts/extend", { months: 6 }),
          "Gia hạn hợp đồng thành công!",
          "Có lỗi xảy ra khi gia hạn hợp đồng."
        ),
    });
  };

  const handleTerminate = () => {
    setConfirmState({
      title: "Thanh lý hợp đồng",
      message: "Hành động này sẽ chấm dứt hợp đồng ngay lập tức và không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?",
      confirmLabel: "Thanh lý ngay",
      variant: "danger",
      onConfirm: () =>
        runAction(
          () => apiClient.post("/contracts/terminate", {}),
          "Thanh lý hợp đồng thành công!",
          "Có lỗi xảy ra khi thanh lý hợp đồng."
        ),
    });
  };

  return (
    <div className={`${body.className} w-full min-h-screen bg-slate-100 py-10 px-4 print:p-0 print:bg-white flex flex-col items-center`}>
      <ConfirmDialog state={confirmState} busy={actionBusy} onCancel={closeConfirm} />

      <div className="w-full max-w-[850px] flex flex-col">
        <Link
          href="/student"
          className="text-slate-500 no-underline text-sm font-semibold inline-flex items-center gap-2 mb-6 print:hidden hover:text-slate-900 transition-colors group self-start"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transform group-hover:-translate-x-1 transition-transform">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Trở về Tổng quan
        </Link>

        {loading ? (
          <DocumentSkeleton />
        ) : loadError ? (
          <div className="bg-white border border-slate-200 p-16 text-center shadow-sm w-full">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
              <svg width="30" height="30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-2.99L13.73 4.99c-.77-1.33-2.69-1.33-3.46 0L3.34 16.01C2.57 17.33 3.53 19 5.07 19z" />
              </svg>
            </div>
            <h2 className={`${display.className} text-xl font-bold text-slate-900 mb-2`}>Không thể tải hợp đồng</h2>
            <p className="text-slate-500 text-[14.5px] leading-relaxed mb-6">
              Đã có lỗi khi kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.
            </p>
            <button
              onClick={() => { setLoading(true); fetchContract(); }}
              className="px-6 py-3 bg-slate-900 text-white rounded font-bold text-sm hover:bg-slate-800 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : contract ? (
          <div className="space-y-6 w-full">
            
            {/* ── TỜ GIẤY HỢP ĐỒNG (KHỔ A4) ── */}
            <div 
              id="printable-contract" 
              className="bg-white p-10 md:p-16 lg:p-20 shadow-xl border border-slate-300 text-black mx-auto print:shadow-none print:border-none print:m-0 print:p-0 print:w-full"
              style={{ minHeight: "297mm", maxWidth: "210mm" }}
            >
              {contract.status === "TERMINATED" && (
                <div className="flex items-center justify-center gap-2 bg-red-50 text-red-700 border border-red-200 p-3 mb-8 text-center font-bold text-sm tracking-widest uppercase print:hidden">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Hợp đồng này đã được thanh lý
                </div>
              )}

              {/* Header Quốc hiệu */}
              <div className="text-center mb-12">
                <h3 className="uppercase text-[15px] font-bold">
                  Cộng hòa xã hội chủ nghĩa Việt Nam
                </h3>
                <p className="text-[14px] font-bold underline underline-offset-4 mt-1 mb-8">
                  Độc lập - Tự do - Hạnh phúc
                </p>

                <h2 className={`${display.className} text-2xl md:text-3xl font-bold uppercase mt-12 mb-2`}>
                  Hợp đồng thuê phòng ký túc xá
                </h2>
                <p className="italic text-sm text-gray-600">
                  Số: {contract.contractNumber} / HĐ-DORMIFY
                </p>
                <div className="mt-2 text-sm italic">
                  Hôm nay, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}, chúng tôi gồm có:
                </div>
              </div>

              {/* Phần thông tin các bên */}
              <div className="space-y-6 text-[15px] leading-relaxed text-justify">
                <div>
                  <h4 className="font-bold text-base uppercase mb-2">Bên Cho Thuê (Bên A): Ban Quản Lý KTX Dormify</h4>
                  <p>- Đại diện ban điều hành và quản lý hạ tầng nội trú sinh viên thông minh.</p>
                  <p>- Địa chỉ: Khu đô thị Đại học Quốc gia TP.HCM.</p>
                </div>

                <div>
                  <h4 className="font-bold text-base uppercase mb-2">Bên Thuê (Bên B): Sinh Viên Đăng Ký Lưu Trú</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2">
                    <p>- <strong>Họ và tên:</strong> {contract.user?.fullName}</p>
                    <p>- <strong>Mã số sinh viên:</strong> {contract.user?.mssv || "Không có"}</p>
                    <p>- <strong>Số CCCD/CMND:</strong> {contract.user?.cccd || "Không có"}</p>
                    <p>- <strong>Số điện thoại:</strong> {contract.user?.phone || "Không có"}</p>
                    <p className="md:col-span-2">- <strong>Email:</strong> {contract.user?.email}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="italic">Hai bên cùng thống nhất ký kết Hợp đồng thuê phòng với các điều khoản sau đây:</p>
                </div>

                {/* Các Điều khoản */}
                <div className="space-y-4 pt-4">
                  <h4 className="font-bold text-base uppercase">Điều 1: Nội dung thỏa thuận và Chi phí</h4>
                  <ul className="list-disc list-inside space-y-2 pl-2">
                    <li>
                      <strong>Tài sản cho thuê:</strong> Bên A đồng ý cho Bên B thuê một vị trí giường tại Phòng {contract.room?.name}, Tòa nhà {contract.room?.building} (Tầng {contract.room?.floor}).
                    </li>
                    <li>
                      <strong>Phí nội trú:</strong> {contract.rentalFee?.toLocaleString("vi-VN")} VNĐ/tháng.
                    </li>
                    <li>
                      <strong>Thời hạn hợp đồng:</strong> Có hiệu lực kể từ ngày {formatDate(contract.startDate)} đến hết ngày {formatDate(contract.endDate)}.
                    </li>
                  </ul>

                  <h4 className="font-bold text-base uppercase pt-4">Điều 2: Điều khoản trách nhiệm & nghĩa vụ</h4>
                  <div className="pl-2 whitespace-pre-line">
                    {contract.terms}
                  </div>
                </div>
              </div>

              {/* Chữ ký */}
              <div className="grid grid-cols-2 text-center mt-16 pt-8 break-inside-avoid">
                <div className="flex flex-col items-center">
                  <strong className="block uppercase text-[15px] mb-1">Đại Diện Bên A</strong>
                  <p className="italic text-sm text-gray-500 mb-6">(Ký, ghi rõ họ tên và đóng dấu)</p>
                  <Seal label="Dormify Verified" type="red" />
                  <p className="mt-8 font-bold">Ban Quản Lý</p>
                </div>
                <div className="flex flex-col items-center">
                  <strong className="block uppercase text-[15px] mb-1">Đại Diện Bên B</strong>
                  <p className="italic text-sm text-gray-500 mb-6">(Ký, ghi rõ họ tên)</p>
                  <Seal label="Digital Signature" type="blue" />
                  <p className="mt-8 font-bold">{contract.user?.fullName}</p>
                </div>
              </div>
            </div>

            {/* ── KHỐI CÁC NÚT BUTTON (Nằm ngoài khung giấy A4) ── */}
            <div className="bg-white border border-slate-200 rounded p-4 shadow-sm flex flex-col sm:flex-row gap-4 print:hidden w-full max-w-[850px] mx-auto">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 px-6 flex items-center justify-center gap-2 bg-slate-100 text-slate-800 border border-slate-300 rounded font-bold text-[14px] hover:bg-slate-200 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H7a2 2 0 00-2 2v4h12z" />
                </svg>
                In PDF / Tải xuống
              </button>

              {contract.status === "ACTIVE" && (
                <div className="flex flex-1 gap-4">
                  <button
                    onClick={handleExtend}
                    className="flex-1 py-3 px-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[14px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Gia hạn hợp đồng
                  </button>
                  <button
                    onClick={handleTerminate}
                    className="flex-1 py-3 px-4 flex items-center justify-center gap-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 font-bold rounded text-[14px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
                  >
                    Thanh lý
                  </button>
                </div>
              )}
            </div>
            
          </div>
        ) : (
          <div className="bg-white border border-slate-200 p-20 text-center shadow-sm w-full">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500">
              <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h2 className={`${display.className} text-xl font-bold text-slate-900 mb-2`}>Chưa ghi nhận hợp đồng điện tử</h2>
            <p className="text-slate-500 text-[15px] leading-relaxed">
              Hợp đồng pháp lý sẽ được tự động tạo và xuất bản tại không gian này ngay khi đơn đăng ký phòng của bạn được ban quản lý phê duyệt.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}