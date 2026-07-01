"use client";
import { useEffect, useState, useCallback } from "react";
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

type ToastKind = "success" | "error";
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  variant: "default" | "danger";
  onConfirm: () => void;
}

// ─── Toast Notifications ───────────────────────────────────────────────────
function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 print:hidden" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 min-w-[280px] max-w-sm rounded-2xl px-5 py-4 shadow-xl border animate-[toast-in_0.25s_ease-out] ${
            t.kind === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <span className="mt-0.5 flex-shrink-0">
            {t.kind === "success" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 3l9 16H3L12 3z" />
              </svg>
            )}
          </span>
          <p className="text-[13.5px] font-semibold leading-snug flex-1">{t.message}</p>
          <button
            onClick={() => onDismiss(t.id)}
            aria-label="Đóng thông báo"
            className="text-current opacity-50 hover:opacity-100 transition-opacity"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <style jsx>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
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

// ─── Component Con Dấu ────────────────────────────────────────────────────────
function Seal({ label, type }: { label: string; type: "success" | "gold" }) {
  const color = type === "success" ? "#0D6E4E" : "#A9812E";
  return (
    <div className="inline-flex flex-col items-center -rotate-6 select-none">
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
      className={`rounded-2xl px-5 py-4 border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
        highlight ? "bg-amber-50/80 border-amber-200 shadow-sm" : "bg-slate-50/60 border-slate-100 shadow-sm"
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

// ─── Dòng thời hạn hợp đồng với thanh tiến trình ─────────────────────────────
function ContractTimeline({ startDate, endDate, active }: { startDate: string; endDate: string; active: boolean }) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const totalMs = Math.max(end - start, 1);
  const elapsedMs = Math.min(Math.max(now - start, 0), totalMs);
  const percent = Math.round((elapsedMs / totalMs) * 100);
  const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

  const fmt = (d: string) => new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="rounded-2xl px-5 py-4 border bg-slate-50/60 border-slate-100 shadow-sm sm:col-span-3">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Thời hạn hiệu lực</p>
        {active && (
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${daysLeft <= 30 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700"}`}>
            {daysLeft > 0 ? `Còn ${daysLeft} ngày` : "Đã hết hạn"}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between text-[15px] font-semibold text-slate-800 mb-3">
        <span>{fmt(startDate)}</span>
        <span className="text-slate-300">→</span>
        <span>{fmt(endDate)}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200/70 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${active ? "bg-amber-500" : "bg-slate-300"}`}
          style={{ width: `${Math.min(Math.max(percent, 2), 100)}%` }}
        />
      </div>
    </div>
  );
}

// ─── Trạng thái tải trang (skeleton) ─────────────────────────────────────────
function DocumentSkeleton() {
  return (
    <div className="w-full max-w-[900px] animate-pulse space-y-8">
      <div className="h-5 w-32 bg-slate-200/70 rounded-full" />
      <div className="bg-white rounded-[2rem] border border-slate-200/80 p-8 sm:p-14 md:p-16 space-y-8">
        <div className="space-y-3 flex flex-col items-center">
          <div className="h-4 w-72 bg-slate-200/70 rounded-full" />
          <div className="h-4 w-56 bg-slate-200/70 rounded-full" />
          <div className="h-9 w-96 max-w-full bg-slate-200/70 rounded-xl mt-6" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-2xl" />
          ))}
        </div>
        <div className="h-32 bg-slate-100 rounded-2xl" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentContractPage() {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

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
    <div className={`${body.className} w-full min-h-screen bg-slate-50/60 py-10 px-4 print:p-0 print:bg-white flex flex-col items-center`}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
      <ConfirmDialog state={confirmState} busy={actionBusy} onCancel={closeConfirm} />

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

        {loading ? (
          <DocumentSkeleton />
        ) : loadError ? (
          <div className="bg-white border border-slate-200 rounded-[2rem] p-16 text-center shadow-sm max-w-2xl mx-auto mt-4 w-full">
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
              className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : contract ? (
          <div className="space-y-8 w-full">
            {/* ── TỜ GIẤY HỢP ĐỒNG ── */}
            <div className="relative bg-white rounded-[2rem] border border-slate-200/80 shadow-[0_30px_80px_-20px_rgba(13,27,42,0.1)] overflow-hidden print:border-none print:shadow-none print:rounded-none w-full">
              <div className="h-[8px] bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 print:hidden" />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.025] print:opacity-[0.05]">
                <span className={`${display.className} text-[150px] font-black -rotate-12 text-slate-900 tracking-tighter`}>
                  DORMIFY
                </span>
              </div>

              <div className="relative z-10 p-8 sm:p-14 md:p-16 space-y-10">
                {contract.status === "TERMINATED" && (
                  <div className="flex items-center justify-center gap-3 bg-red-50 text-red-700 border border-red-100 p-4 rounded-2xl text-center font-bold text-sm tracking-wider mb-4">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    HỢP ĐỒNG NÀY ĐÃ ĐƯỢC THANH LÝ HỦY BỎ
                  </div>
                )}

                <div className="text-center space-y-2">
                  <h3 className="uppercase text-[15px] sm:text-[17px] font-extrabold tracking-wider text-slate-900">
                    Cộng hòa xã hội chủ nghĩa Việt Nam
                  </h3>
                  <p className="text-[13px] font-bold uppercase text-slate-700 tracking-widest inline-block px-4 border-t border-b border-slate-200 py-1">
                    Độc lập - Tự do - Hạnh phúc
                  </p>

                  <div className="pt-8">
                    <h2 className={`${display.className} text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug`}>
                      Hợp đồng điện tử thuê phòng ký túc xá
                    </h2>
                    <div className="flex justify-center gap-4 mt-6 text-[12px] font-bold flex-wrap">
                      <span className="font-mono text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-1.5 shadow-sm">
                        Số định danh: {contract.contractNumber}
                      </span>
                      <span
                        className={`px-3.5 py-1.5 rounded-lg uppercase tracking-wider border shadow-sm ${
                          contract.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
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
                    <ContractTimeline startDate={contract.startDate} endDate={contract.endDate} active={contract.status === "ACTIVE"} />
                  </div>
                </div>

                <div>
                  <SectionTitle>Điều khoản trách nhiệm &amp; nghĩa vụ</SectionTitle>
                  <div className="bg-slate-50/60 border border-slate-100 p-6 rounded-2xl text-[14px] whitespace-pre-line leading-loose text-slate-700 font-medium">
                    {contract.terms}
                  </div>
                </div>

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
                className="flex-1 py-4 px-6 flex items-center justify-center gap-3 bg-slate-900 text-amber-400 rounded-2xl font-bold text-[15px] hover:bg-slate-800 transition-all duration-300 active:scale-[0.98] hover:-translate-y-1 shadow-lg shadow-slate-900/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
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
                    className="flex-1 py-4 px-5 flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-[15px] transition-all duration-300 active:scale-[0.98] hover:-translate-y-1 shadow-lg shadow-blue-600/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Gia hạn
                  </button>
                  <button
                    onClick={handleTerminate}
                    className="flex-1 py-4 px-5 flex items-center justify-center gap-2.5 bg-rose-50 hover:bg-red-50 text-rose-600 border-2 border-rose-200 hover:border-rose-300 font-bold rounded-2xl text-[15px] transition-all duration-300 active:scale-[0.98] hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
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