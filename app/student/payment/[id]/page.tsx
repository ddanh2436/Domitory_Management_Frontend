"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../utils/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────
type PaymentMethod = "CARD" | "QR" | "EWALLET" | "BANK";

interface InvoiceData {
  _id: string;
  month: number;
  year: number;
  roomFee: number;
  electricityFee: number;
  waterFee: number;
  totalAmount: number;
  status: string;
  dueDate?: string;
  roomName?: string;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const I = {
  back:    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  lock:    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  card:    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  qr:      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 2h2m0 0h2m-2 0v2m0-2v-2m4 4h-2m2-6h-2m2 2v2m-6-2h2" /></svg>,
  wallet:  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5M18 12a2 2 0 000 4h4v-4h-4z" /></svg>,
  bank:    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 21h18M4 21V10m16 11V10M4 10l8-6 8 6M4 10h16M9 14v3m3-3v3m3-3v3" /></svg>,
  checkBig:<svg width="46" height="46" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>,
  bolt:    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  drop:    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16a4 4 0 100-8 4 4 0 000 8z" /></svg>,
  home:    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  shield:  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
};

// ─── Payment method config ────────────────────────────────────────────────────
const METHODS: { id: PaymentMethod; label: string; sub: string; icon: React.ReactNode }[] = [
  { id: "CARD",    label: "Thẻ ngân hàng",     sub: "Visa, Mastercard, JCB, Napas", icon: I.card   },
  { id: "QR",      label: "Quét mã QR",        sub: "VietQR · Tất cả app ngân hàng", icon: I.qr     },
  { id: "EWALLET", label: "Ví điện tử",        sub: "MoMo, ZaloPay, ViettelPay",     icon: I.wallet },
  { id: "BANK",    label: "Chuyển khoản",      sub: "Internet Banking trực tiếp",    icon: I.bank   },
];

const EWALLET_OPTIONS = [
  { id: "momo",    name: "MoMo",      imgSrc: "/Momo.png" },
  { id: "zalopay",  name: "ZaloPay",   imgSrc: "/ZaloPay.png" },
  { id: "viettel",  name: "ViettelPay",imgSrc: "/ViettelPay.jpg" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

function formatDateTime(value?: string) {
  if (!value) return "Chưa đặt";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCardNumber(v: string) {
  const digits = v.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(v: string) {
  const digits = v.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function detectCardBrand(num: string): "visa" | "mastercard" | "jcb" | "napas" | null {
  const d = num.replace(/\s/g, "");
  if (/^4/.test(d)) return "visa";
  if (/^5[1-5]/.test(d)) return "mastercard";
  if (/^35/.test(d)) return "jcb";
  if (d.length >= 4) return "napas";
  return null;
}

// ─── Brand badge ─────────────
function BrandBadge({ brand }: { brand: string | null }) {
  if (!brand) return null;
  const labels: Record<string, { text: string; bg: string; color: string }> = {
    visa:       { text: "VISA",  bg: "#1A1F71", color: "#fff" },
    mastercard: { text: "MC",    bg: "#EB001B", color: "#fff" },
    jcb:        { text: "JCB",   bg: "#0B4EA2", color: "#fff" },
    napas:      { text: "NAPAS", bg: "#D71920", color: "#fff" },
  };
  const cfg = labels[brand];
  if (!cfg) return null;
  return (
    <span className="pm-brand-badge" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.text}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MockPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const invoiceId = resolvedParams.id;
  const router = useRouter();

  // Data State
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // UI State
  const [method, setMethod]         = useState<PaymentMethod>("CARD");
  const [ewallet, setEwallet]       = useState("momo");
  const [isProcessing, setProcessing] = useState(false);
  const [isSuccess, setSuccess]     = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardName,   setCardName]   = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv,    setCardCvv]    = useState("");

  const brand = detectCardBrand(cardNumber);

  // FETCH DỮ LIỆU THẬT CỦA HÓA ĐƠN
  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        // 1. Lấy phòng hiện tại của Sinh viên
        const profileRes = await apiClient.get("/users/profile");
        const profile = await profileRes.json();
        const roomId = profile.room?._id || profile.room;

        if (!roomId) {
          setLoadingData(false);
          return;
        }

        // 2. Lấy tất cả hóa đơn của phòng và lọc ra đúng ID này
        const invRes = await apiClient.get(`/invoices/room/${roomId}`);
        
        if (invRes.ok) {
          const allInvoices = (await invRes.json()) as InvoiceData[];
          const targetInvoice = allInvoices.find((inv) => inv._id === invoiceId);
          
          if (targetInvoice) {
            setInvoice({
              ...targetInvoice,
              roomName: profile.room?.name || "Phòng KTX",
            });
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải hóa đơn:", err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchInvoiceData();
  }, [invoiceId]);

  const handleConfirmPayment = async () => {
    setProcessing(true);

    // Giả lập thời gian xử lý phía cổng thanh toán
    setTimeout(async () => {
      try {
        const res = await apiClient.patch(`/invoices/${invoiceId}/pay-mock`);

        if (res.ok) {
          setSuccess(true);
          setTimeout(() => {
            router.push("/student/invoices?payment=success");
          }, 2200);
        } else {
          setProcessing(false);
          alert("Lỗi khi xử lý thanh toán. Vui lòng thử lại.");
        }
      } catch {
        setProcessing(false);
        alert("Lỗi kết nối máy chủ.");
      }
    }, 1600);
  };

  const cardFormValid =
    cardNumber.replace(/\s/g, "").length >= 12 &&
    cardName.trim().length > 1 &&
    cardExpiry.length === 5 &&
    cardCvv.length >= 3;

  const canPay = method === "CARD" ? cardFormValid : true;

  if (loadingData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center font-sans text-slate-500">
        <svg className="animate-spin h-8 w-8 text-[#C9A84C] mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Đang kết nối cổng thanh toán...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="py-20 flex items-center justify-center font-sans text-slate-800">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center max-w-sm">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Không tìm thấy hóa đơn</h2>
          <p className="text-slate-500 mb-6">Mã giao dịch không hợp lệ hoặc đã bị hủy.</p>
          <Link href="/student/invoices" className="inline-block bg-[#0D1B2A] text-[#C9A84C] px-6 py-2 rounded-lg font-medium">
            Quay lại hóa đơn
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto font-sans text-slate-800">
      <style>{`
        :root {
          --navy:     #0D1B2A;
          --gold:     #C9A84C;
          --gold-dim: rgba(201,168,76,0.14);
          --gold-b:   rgba(201,168,76,0.28);
          --white:    #ffffff;
          --muted:    #8A9BAD;
          --border:   rgba(13,27,42,0.1);
          --success:  #16a34a;
          --danger:   #dc2626;
        }

        .pm-layout { display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:start; }

        /* ── LEFT: ORDER SUMMARY ── */
        .pm-summary-eyebrow { font-size:11px; font-weight:500; letter-spacing:.1em; text-transform:uppercase; color:var(--gold); margin-bottom:10px; display:block; }
        .pm-summary-title { font-family:'Fraunces',serif; font-size:26px; font-weight:700; color:var(--navy); letter-spacing:-.5px; margin-bottom:6px; }
        .pm-summary-sub { font-size:13.5px; color:var(--muted); margin-bottom:32px; }

        .pm-line-items { display:flex; flex-direction:column; gap:14px; padding-bottom:20px; border-bottom:1px dashed var(--border); margin-bottom:20px; }
        .pm-line { display:flex; align-items:center; justify-content:space-between; font-size:14px; }
        .pm-line-label { display:flex; align-items:center; gap:9px; color:#4A6580; }
        .pm-line-icon { width:26px; height:26px; border-radius:7px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .pm-line-icon--room { background:rgba(13,27,42,.06); color:var(--navy); }
        .pm-line-icon--bolt { background:rgba(217,119,6,.1); color:#d97706; }
        .pm-line-icon--water{ background:rgba(2,132,199,.1); color:#0284c7; }
        .pm-line-val { font-weight:500; color:var(--navy); font-variant-numeric:tabular-nums; }

        .pm-total-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:32px; }
        .pm-total-label { font-size:13.5px; color:var(--muted); }
        .pm-total-val { font-family:'Fraunces',serif; font-size:34px; font-weight:700; color:var(--navy); letter-spacing:-1px; }

        .pm-meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; padding:18px 20px; background:var(--white); border:1px solid var(--border); border-radius:12px; margin-bottom:20px; }
        .pm-meta-item { display:flex; flex-direction:column; gap:3px; }
        .pm-meta-label { font-size:10px; font-weight:500; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); }
        .pm-meta-val { font-size:13.5px; font-weight:500; color:var(--navy); }
        .pm-meta-val--mono { font-family:'DM Mono',monospace; font-size:12.5px; color:var(--gold); }

        .pm-secure-note { display:flex; align-items:flex-start; gap:9px; padding:14px 16px; background:var(--gold-dim); border:1px solid var(--gold-b); border-radius:10px; }
        .pm-secure-note svg { color:var(--gold); flex-shrink:0; margin-top:2px; }
        .pm-secure-text { font-size:12px; color:#7A5E1A; line-height:1.6; }

        /* ── RIGHT: PAYMENT PANEL ── */
        .pm-panel { background:var(--white); border:1px solid var(--border); border-radius:18px; padding:28px; box-shadow:0 8px 32px rgba(13,27,42,.03); }
        .pm-panel-title { font-family:'Fraunces',serif; font-size:17px; font-weight:600; color:var(--navy); margin-bottom:18px; }

        /* method tabs */
        .pm-methods { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:24px; }
        .pm-method-btn { display:flex; flex-direction:column; align-items:flex-start; gap:8px; padding:14px 14px; border-radius:8px; border:1.5px solid var(--border); background:var(--white); cursor:pointer; transition:all .15s; text-align:left; }
        .pm-method-btn:hover { border-color:rgba(13,27,42,.25); }
        .pm-method-btn--active { border-color:var(--gold); background:var(--gold-dim); }
        .pm-method-icon { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; background:rgba(13,27,42,.05); color:var(--navy); }
        .pm-method-btn--active .pm-method-icon { background:var(--gold); color:var(--navy); }
        .pm-method-label { font-size:13px; font-weight:600; color:var(--navy); }
        .pm-method-sub { font-size:10.5px; color:var(--muted); line-height:1.4; }

        /* card form */
        .pm-form { display:flex; flex-direction:column; gap:16px; }
        .pm-field { display:flex; flex-direction:column; gap:6px; }
        .pm-field-label { font-size:12px; font-weight:500; color:var(--navy); }
        .pm-input-wrap { position:relative; display:flex; align-items:center; }
        .pm-input { width:100%; padding:11px 14px; border:1px solid var(--border); border-radius:10px; font-family:'DM Mono',monospace; font-size:14px; color:var(--navy); background:#F9F8F6; outline:none; transition:border-color .15s, background .15s; letter-spacing:0.5px; }
        .pm-input--text { font-family:'DM Sans',sans-serif; letter-spacing:normal; }
        .pm-input:focus { border-color:var(--gold); background:var(--white); }
        .pm-input::placeholder { color:#B8C4CE; font-weight:400; }
        .pm-brand-badge { position:absolute; right:12px; font-size:9px; font-weight:700; letter-spacing:.03em; padding:3px 8px; border-radius:4px; }
        .pm-row2 { display:grid; grid-template-columns:1.4fr 1fr; gap:12px; }

        /* QR panel */
        .pm-qr-box { display:flex; flex-direction:column; align-items:center; padding:28px 20px; background:#F9F8F6; border-radius:14px; border:1px solid var(--border); }
        .pm-qr-frame { width:180px; height:180px; background:var(--white); border-radius:12px; border:1px solid var(--border); display:flex; align-items:center; justify-content:center; margin-bottom:16px; padding:14px; }
        .pm-qr-sub { font-size:12.5px; color:var(--muted); text-align:center; line-height:1.6; max-width:260px; }
        .pm-qr-amount { font-family:'Fraunces',serif; font-size:20px; font-weight:700; color:var(--navy); margin:10px 0; }

        /* ewallet */
        .pm-ewallet-grid { display:flex; flex-direction:column; gap:10px; }
        .pm-ewallet-opt { display:flex; align-items:center; gap:12px; padding:14px 16px; border:1.5px solid var(--border); border-radius:8px; cursor:pointer; transition:all .15s; }
        .pm-ewallet-opt:hover { border-color:rgba(13,27,42,.2); }
        .pm-ewallet-opt--active { border-color:var(--gold); background:var(--gold-dim); }
        .pm-ewallet-logo { width:36px; height:36px; border-radius:9px; object-fit:contain; border:1px solid rgba(13,27,42,0.05); flex-shrink:0; background:var(--white); }
        .pm-ewallet-name { font-size:13.5px; font-weight:500; color:var(--navy); flex:1; }
        .pm-radio-dot { width:18px; height:18px; border-radius:50%; border:2px solid var(--border); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .pm-radio-dot--active { border-color:var(--gold); }
        .pm-radio-dot--active::after { content:''; width:9px; height:9px; border-radius:50%; background:var(--gold); }

        /* bank transfer */
        .pm-bank-box { display:flex; flex-direction:column; gap:12px; padding:18px 20px; background:#F9F8F6; border-radius:12px; border:1px solid var(--border); }
        .pm-bank-row { display:flex; justify-content:space-between; align-items:center; font-size:13px; padding-bottom:10px; border-bottom:1px dashed var(--border); }
        .pm-bank-row:last-child { border-bottom:none; padding-bottom:0; }
        .pm-bank-label { color:var(--muted); }
        .pm-bank-val { font-weight:600; color:var(--navy); font-family:'DM Mono',monospace; }

        /* pay button */
        .pm-pay-btn {
          width:100%; padding:15px; margin-top:24px; border-radius:8px; border:none;
          background:var(--navy); color:#fff; font-family:'DM Sans',sans-serif;
          font-size:14.5px; font-weight:600; cursor:pointer; transition:all .18s;
          display:flex; align-items:center; justify-content:center; gap:9px;
        }
        .pm-pay-btn:hover:not(:disabled) { background:#1A2E42; box-shadow:0 8px 24px rgba(13,27,42,.25); transform:translateY(-1px); }
        .pm-pay-btn:disabled { opacity:.45; cursor:not-allowed; }
        .pm-pay-btn svg { stroke:#fff; }
        .pm-spin { animation:pmSpin 0.8s linear infinite; }
        @keyframes pmSpin { to { transform:rotate(360deg); } }

        .pm-trust-row { display:flex; align-items:center; justify-content:center; gap:18px; margin-top:18px; }
        .pm-trust-item { display:flex; align-items:center; gap:5px; font-size:11px; color:var(--muted); }
        .pm-trust-item svg { stroke:var(--muted); }

        /* ── SUCCESS STATE ── */
        .pm-success-wrap { display:flex; flex-direction:column; align-items:center; text-align:center; padding:40px 10px; }
        .pm-success-circle { width:84px; height:84px; border-radius:50%; background:rgba(34,197,94,.1); display:flex; align-items:center; justify-content:center; color:var(--success); margin-bottom:24px; animation:pmPop .4s cubic-bezier(.34,1.56,.64,1) both; }
        @keyframes pmPop { from{ transform:scale(.5); opacity:0;} to{ transform:scale(1); opacity:1;} }
        .pm-success-title { font-family:'Fraunces',serif; font-size:24px; font-weight:700; color:var(--navy); margin-bottom:8px; }
        .pm-success-sub { font-size:13.5px; color:var(--muted); margin-bottom:28px; max-width:280px; line-height:1.6; }
        .pm-success-amount { font-family:'Fraunces',serif; font-size:32px; font-weight:700; color:var(--success); margin-bottom:6px; letter-spacing:-1px; }
        .pm-success-ref { font-family:'DM Mono',monospace; font-size:11.5px; color:var(--muted); background:#F9F8F6; padding:6px 14px; border-radius:7px; border:1px solid var(--border); margin-bottom:24px; }
        .pm-success-redirect { font-size:11.5px; color:var(--muted); display:flex; align-items:center; gap:8px; }
        .pm-success-bar { width:140px; height:3px; background:var(--border); border-radius:100px; overflow:hidden; }
        .pm-success-bar-fill { height:100%; background:var(--success); border-radius:100px; animation:pmBarFill 2.2s linear forwards; }
        @keyframes pmBarFill { from{width:0%;} to{width:100%;} }

        /* ── RESPONSIVE ── */
        @media (max-width:880px) {
          .pm-layout { grid-template-columns:1fr; gap:36px; }
        }
        @media (max-width:480px) {
          .pm-methods { grid-template-columns:1fr; }
          .pm-row2 { grid-template-columns:1fr; }
          .pm-meta-grid { grid-template-columns:1fr; }
        }
      `}</style>

      {/* Back button */}
      <Link href="/student/invoices" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        {I.back} Quay lại hóa đơn
      </Link>

      <div className="pm-layout">
        {/* ── LEFT: Order Summary ── */}
        <div>
          <span className="pm-summary-eyebrow">Thanh toán hóa đơn</span>
          <div className="pm-summary-title">Tháng {invoice.month}/{invoice.year}</div>
          <div className="pm-summary-sub">Phòng {invoice.roomName} · Hóa đơn điện nước &amp; phí phòng</div>

          <div className="pm-line-items">
            <div className="pm-line">
              <span className="pm-line-label">
                <span className="pm-line-icon pm-line-icon--room">{I.home}</span>
                Phí thuê phòng
              </span>
              <span className="pm-line-val">{formatVND(invoice.roomFee)}</span>
            </div>
            <div className="pm-line">
              <span className="pm-line-label">
                <span className="pm-line-icon pm-line-icon--bolt">{I.bolt}</span>
                Tiền điện
              </span>
              <span className="pm-line-val">{formatVND(invoice.electricityFee)}</span>
            </div>
            <div className="pm-line">
              <span className="pm-line-label">
                <span className="pm-line-icon pm-line-icon--water">{I.drop}</span>
                Tiền nước
              </span>
              <span className="pm-line-val">{formatVND(invoice.waterFee)}</span>
            </div>
          </div>

          <div className="pm-total-row">
            <span className="pm-total-label">Tổng thanh toán</span>
            <span className="pm-total-val">{formatVND(invoice.totalAmount)}</span>
          </div>

          <div className="pm-meta-grid">
            <div className="pm-meta-item">
              <span className="pm-meta-label">Mã hóa đơn</span>
              <span className="pm-meta-val pm-meta-val--mono">{invoiceId.slice(0, 10).toUpperCase()}</span>
            </div>
            <div className="pm-meta-item">
              <span className="pm-meta-label">Hạn thanh toán</span>
              <span className="pm-meta-val">{formatDateTime(invoice.dueDate)}</span>
            </div>
          </div>

          <div className="pm-secure-note">
            {I.shield}
            <span className="pm-secure-text">
              Đây là môi trường thử nghiệm (sandbox). Mọi phương thức thanh toán đều được xác nhận thành công ngay lập tức, không phát sinh giao dịch thực.
            </span>
          </div>
        </div>

        {/* ── RIGHT: Payment Panel ── */}
        <div className="pm-panel">
          {isSuccess ? (
            <div className="pm-success-wrap">
              <div className="pm-success-circle">{I.checkBig}</div>
              <div className="pm-success-title">Thanh toán thành công!</div>
              <div className="pm-success-sub">Hóa đơn điện nước tháng {invoice.month}/{invoice.year} của bạn đã được gạch nợ.</div>
              <div className="pm-success-amount">{formatVND(invoice.totalAmount)}</div>
              <div className="pm-success-ref">REF: {invoiceId.slice(0, 12).toUpperCase()}</div>
              <div className="pm-success-redirect">
                <div className="pm-success-bar"><div className="pm-success-bar-fill" /></div>
                Đang chuyển về trang hóa đơn…
              </div>
            </div>
          ) : (
            <>
              <div className="pm-panel-title">Chọn phương thức thanh toán</div>

              {/* Method tabs */}
              <div className="pm-methods">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`pm-method-btn ${method === m.id ? "pm-method-btn--active" : ""}`}
                    onClick={() => setMethod(m.id)}
                  >
                    <span className="pm-method-icon">{m.icon}</span>
                    <span className="pm-method-label">{m.label}</span>
                    <span className="pm-method-sub">{m.sub}</span>
                  </button>
                ))}
              </div>

              {/* ── CARD FORM ── */}
              {method === "CARD" && (
                <div className="pm-form">
                  <div className="pm-field">
                    <label className="pm-field-label">Số thẻ</label>
                    <div className="pm-input-wrap">
                      <input
                        className="pm-input"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        inputMode="numeric"
                      />
                      <BrandBadge brand={brand} />
                    </div>
                  </div>
                  <div className="pm-field">
                    <label className="pm-field-label">Tên chủ thẻ</label>
                    <input
                      className="pm-input pm-input--text"
                      placeholder="NGUYEN VAN A"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="pm-row2">
                    <div className="pm-field">
                      <label className="pm-field-label">Ngày hết hạn</label>
                      <input
                        className="pm-input"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        inputMode="numeric"
                      />
                    </div>
                    <div className="pm-field">
                      <label className="pm-field-label">CVV</label>
                      <input
                        className="pm-input"
                        placeholder="123"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        inputMode="numeric"
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── QR ── */}
              {method === "QR" && (
                <div className="pm-qr-box">
                  <div className="pm-qr-frame">
                    <svg viewBox="0 0 100 100" width="100%" height="100%">
                      <rect width="100" height="100" fill="#fff" />
                      {Array.from({ length: 12 }).map((_, row) =>
                        Array.from({ length: 12 }).map((_, col) => {
                          const seed = (row * 12 + col * 7) % 5;
                          if (seed === 0) return null;
                          return (
                            <rect
                              key={`${row}-${col}`}
                              x={col * 8 + 2}
                              y={row * 8 + 2}
                              width={6}
                              height={6}
                              fill="#0D1B2A"
                            />
                          );
                        })
                      )}
                    </svg>
                  </div>
                  <div className="pm-qr-amount">{formatVND(invoice.totalAmount)}</div>
                  <div className="pm-qr-sub">
                    Mở app ngân hàng bất kỳ, chọn quét QR và quét mã trên để hoàn tất thanh toán.
                  </div>
                </div>
              )}

              {/* ── E-WALLET ── */}
              {method === "EWALLET" && (
                <div className="pm-ewallet-grid">
                  {EWALLET_OPTIONS.map((w) => (
                    <div
                      key={w.id}
                      className={`pm-ewallet-opt ${ewallet === w.id ? "pm-ewallet-opt--active" : ""}`}
                      onClick={() => setEwallet(w.id)}
                    >
                      <img src={w.imgSrc} alt={w.name} className="pm-ewallet-logo" />
                      <span className="pm-ewallet-name">{w.name}</span>
                      <span className={`pm-radio-dot ${ewallet === w.id ? "pm-radio-dot--active" : ""}`} />
                    </div>
                  ))}
                </div>
              )}

              {/* ── BANK TRANSFER ── */}
              {method === "BANK" && (
                <div className="pm-bank-box">
                  <div className="pm-bank-row">
                    <span className="pm-bank-label">Ngân hàng</span>
                    <span className="pm-bank-val">Vietcombank</span>
                  </div>
                  <div className="pm-bank-row">
                    <span className="pm-bank-label">Số tài khoản</span>
                    <span className="pm-bank-val">1900 8888 6666</span>
                  </div>
                  <div className="pm-bank-row">
                    <span className="pm-bank-label">Chủ tài khoản</span>
                    <span className="pm-bank-val">DORMIFY HCMUS</span>
                  </div>
                  <div className="pm-bank-row">
                    <span className="pm-bank-label">Nội dung CK</span>
                    <span className="pm-bank-val">DORMIFY {invoiceId.slice(0, 6).toUpperCase()}</span>
                  </div>
                </div>
              )}

              {/* Pay button */}
              <button
                className="pm-pay-btn"
                onClick={handleConfirmPayment}
                disabled={isProcessing || !canPay}
              >
                {isProcessing ? (
                  <>
                    <svg className="pm-spin" width="17" height="17" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Đang xử lý giao dịch…
                  </>
                ) : (
                  <>{I.lock} Thanh toán {formatVND(invoice.totalAmount)}</>
                )}
              </button>

              <div className="pm-trust-row">
                <span className="pm-trust-item">{I.shield} Mã hóa SSL 256-bit</span>
                <span className="pm-trust-item">{I.lock} PCI DSS</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}