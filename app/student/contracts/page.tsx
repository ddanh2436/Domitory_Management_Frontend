"use client";
import { useEffect, useState, useCallback, CSSProperties } from "react";
import Link from "next/link";
import { Archivo } from "next/font/google";
import { apiClient } from "../../utils/apiClient";
import { useToast } from "../../components/ToastProvider";
import { exportContractPdf } from "../../utils/exportPdf";

const archivo = Archivo({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
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

// ─── Design tokens (Đã đồng bộ với dự án Navy / Gold) ──────────
const tokens = {
  "--color-bg": "#F9F8F6",
  "--color-surface": "#ffffff",
  "--color-text": "#0D1B2A",       // Navy
  "--color-accent": "#C9A84C",     // Gold
  "--color-accent-100": "rgba(201,168,76,0.14)",
  "--color-accent-700": "#7A5E1A",
  "--color-neutral-600": "#8A9BAD",
  "--color-neutral-700": "#4A6580",
  "--color-neutral-800": "#1e293b",
  "--color-neutral-900": "#0f172a",
  "--color-divider": "rgba(13,27,42,0.15)",
  "--shadow-lg": "0 12px 32px rgba(13,27,42,0.08)",
} as CSSProperties;

// ─── Con dấu / chữ ký số ─────────────────────────────────────────────────────
function Seal({
  id,
  color,
  arc,
  bottom,
  rotate,
}: {
  id: string;
  color: string;
  arc: string;
  bottom: string;
  rotate: number;
}) {
  return (
    <svg width="128" height="128" viewBox="0 0 128 128" style={{ transform: `rotate(${rotate}deg)` }}>
      <defs>
        {/* Đã sửa path: Vẽ 1 vòng tròn hoàn chỉnh để chữ không bị cắt */}
        <path id={id} d="M 18, 64 a 46,46 0 1,1 92,0 a 46,46 0 1,1 -92,0" />
      </defs>
      <circle cx="64" cy="64" r="58" fill="none" stroke={color} strokeWidth="2.5" />
      <circle cx="64" cy="64" r="48" fill="none" stroke={color} strokeWidth="1" strokeDasharray="2 3" />
      
      {/* Giảm nhẹ fontSize và điều chỉnh startOffset về 25% (đỉnh vòng tròn) */}
      <text fontFamily="Archivo, sans-serif" fontWeight="800" fontSize="8.5" letterSpacing="1.2" fill={color}>
        <textPath href={`#${id}`} startOffset="25%" textAnchor="middle">
          {arc}
        </textPath>
      </text>
      
      <path d="M46 66 L58 78 L83 50" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      
      <text x="64" y="98" fontFamily="Archivo, sans-serif" fontWeight="800" fontSize="8.5" letterSpacing="1.5" fill={color} textAnchor="middle">
        {bottom}
      </text>
    </svg>
  );
}

// ─── Confirm Dialog ─────────────────────────────────────────────────────────
function ConfirmDialog({ state, busy, onCancel }: { state: ConfirmState | null; busy: boolean; onCancel: () => void }) {
  if (!state) return null;
  return (
    <div
      className="print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        display: "grid",
        placeItems: "center",
        padding: 16,
        background: "rgba(13,27,42,0.5)", // Nền mờ Navy
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        style={{
          width: "min(440px, 100%)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: 24,
          background: "#fff",
          border: "2px solid var(--color-text)",
          boxShadow: "var(--shadow-lg)",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            display: "grid",
            placeItems: "center",
            background: "var(--color-accent-100)",
            color: "var(--color-accent-700)",
            borderRadius: 8,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86l-8.18 14.18A2 2 0 0 0 4 21h16a2 2 0 0 0 1.89-2.96L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div id="confirm-title" style={{ fontWeight: 800, fontSize: 20 }}>
          {state.title}
        </div>
        <div style={{ fontSize: 14, opacity: 0.85, lineHeight: 1.55 }}>{state.message}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
          <button
            onClick={onCancel}
            disabled={busy}
            style={{
              padding: "10px 16px",
              fontWeight: 700,
              fontSize: 14,
              cursor: busy ? "not-allowed" : "pointer",
              color: "var(--color-text)",
              background: "transparent",
              border: "1px solid var(--color-divider)",
              borderRadius: 6,
              opacity: busy ? 0.5 : 1,
            }}
          >
            Hủy bỏ
          </button>
          <button
            onClick={state.onConfirm}
            disabled={busy}
            style={{
              padding: "10px 16px",
              fontWeight: 700,
              fontSize: 14,
              cursor: busy ? "not-allowed" : "pointer",
              color: state.variant === "danger" ? "#fff" : "var(--color-bg)",
              background: state.variant === "danger" ? "#dc2626" : "var(--color-text)",
              border: `1px solid ${state.variant === "danger" ? "#dc2626" : "var(--color-text)"}`,
              borderRadius: 6,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy && <span style={{ height: 16, width: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />}
            {state.confirmLabel}
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function DocumentSkeleton() {
  return (
    <div style={{ width: "100%", maxWidth: 860 }}>
      <div style={{ background: "#fff", border: "1px solid var(--color-divider)", borderRadius: 12, boxShadow: "var(--shadow-lg)", padding: "60px 68px", minHeight: 600, display: "flex", flexDirection: "column", gap: 24 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ height: 16, background: "var(--color-bg)", width: `${90 - i * 6}%`, animation: "pulse 1.4s ease-in-out infinite", borderRadius: 4 }} />
        ))}
      </div>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>
    </div>
  );
}

// ─── Formatter ────────────────────────────────────────────────────────────────
const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentContractPage() {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const notify = useToast();

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

  const closeConfirm = () => {
    if (!actionBusy) setConfirmState(null);
  };

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
        runAction(() => apiClient.post("/contracts/extend", { months: 6 }), "Gia hạn hợp đồng thành công!", "Có lỗi xảy ra khi gia hạn hợp đồng."),
    });
  };

  const handleTerminate = () => {
    setConfirmState({
      title: "Thanh lý hợp đồng",
      message: "Hành động này sẽ chấm dứt hợp đồng ngay lập tức và không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?",
      confirmLabel: "Thanh lý ngay",
      variant: "danger",
      onConfirm: () =>
        runAction(() => apiClient.post("/contracts/terminate", {}), "Thanh lý hợp đồng thành công!", "Có lỗi xảy ra khi thanh lý hợp đồng."),
    });
  };

  const today = new Date();
  const terminated = contract?.status === "TERMINATED";
  const active = contract?.status === "ACTIVE";
  const termLines = contract?.terms
    ? contract.terms.split("\n").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div
      className={archivo.className}
      style={{
        ...tokens,
        width: "100%",
        minHeight: "100vh",
        background: "var(--color-bg)",
        color: "var(--color-text)",
        padding: "40px 20px 64px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <ConfirmDialog state={confirmState} busy={actionBusy} onCancel={closeConfirm} />

      <div style={{ width: "100%", maxWidth: 860 }}>
        <Link
          href="/student"
          className="no-print"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
            color: "var(--color-neutral-700)",
            fontWeight: 700,
            fontSize: 14,
            marginBottom: 20,
            transition: "color 0.2s"
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Quay lại
        </Link>

        {loading ? (
          <DocumentSkeleton />
        ) : loadError ? (
          <div style={{ background: "#fff", border: "1px solid var(--color-divider)", borderRadius: 12, boxShadow: "var(--shadow-lg)", padding: "64px 40px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, background: "var(--color-accent-100)", color: "var(--color-accent-700)", borderRadius: 12, display: "grid", placeItems: "center", margin: "0 auto 22px" }}>
              <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-2.99L13.73 4.99c-.77-1.33-2.69-1.33-3.46 0L3.34 16.01C2.57 17.33 3.53 19 5.07 19z" />
              </svg>
            </div>
            <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Không thể tải hợp đồng</h2>
            <p style={{ color: "var(--color-neutral-700)", fontSize: 14.5, lineHeight: 1.6, marginBottom: 24 }}>
              Đã có lỗi khi kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.
            </p>
            <button
              onClick={() => {
                setLoading(true);
                fetchContract();
              }}
              style={{ padding: "12px 24px", background: "var(--color-text)", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", borderRadius: 8, cursor: "pointer" }}
            >
              Thử lại
            </button>
          </div>
        ) : contract ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* ── TỜ HỢP ĐỒNG ── */}
            <div
              id="printable-contract"
              style={{
                position: "relative",
                background: "#fff",
                border: "1px solid var(--color-divider)",
                borderRadius: 12,
                boxShadow: "var(--shadow-lg)",
                padding: "60px 68px",
                overflow: "hidden",
                fontFamily: '"Times New Roman", Times, serif', // Ép font Serif chuẩn pháp lý
                color: "#000", // Đen tuyền in ấn
                lineHeight: 1.6
              }}
            >
              {terminated && (
                <div aria-hidden="true" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none", zIndex: 2 }}>
                  <div style={{ transform: "rotate(-16deg)", fontWeight: 800, fontSize: 110, letterSpacing: "0.04em", color: "#dc2626", opacity: 0.1, whiteSpace: "nowrap" }}>
                    ĐÃ THANH LÝ
                  </div>
                </div>
              )}

              {/* Header: Logo Dormify & Mã hợp đồng */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 30 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <img src="/Dormify.png" alt="Dormify Logo" style={{ height: 48, width: "auto", objectFit: "contain" }} />
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: 16, color: "var(--color-text)", fontFamily: "Archivo, sans-serif" }}>DORMIFY HCMUS</div>
                    <div style={{ fontSize: 11, color: "var(--color-neutral-600)", fontFamily: "Archivo, sans-serif" }}>Hệ thống quản lý Ký túc xá</div>
                  </div>
                </div>
                <div style={{ textAlign: "right", fontFamily: "Archivo, sans-serif" }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text)" }}>Mã HĐ: {contract.contractNumber}</div>
                  <div style={{ fontSize: 12, color: terminated ? "#dc2626" : "var(--color-accent)", fontWeight: 600 }}>
                    Trạng thái: {terminated ? "Đã thanh lý" : "Đang hiệu lực"}
                  </div>
                </div>
              </div>

              {/* Quốc hiệu - Tiêu ngữ */}
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <h1 style={{ fontSize: 18, fontWeight: "bold", textTransform: "uppercase", margin: 0 }}>
                  Cộng hòa xã hội chủ nghĩa Việt Nam
                </h1>
                <h2 style={{ fontSize: 16, fontWeight: "bold", margin: "4px 0 0" }}>
                  Độc lập - Tự do - Hạnh phúc
                </h2>
                <div style={{ width: 120, height: 1, background: "#000", margin: "10px auto 24px" }}></div>
                <h1 style={{ fontSize: 20, fontWeight: "bold", textTransform: "uppercase", margin: 0 }}>
                  HỢP ĐỒNG THUÊ CHỖ Ở KÝ TÚC XÁ
                </h1>
              </div>

              <p style={{ fontSize: 15, marginBottom: 16, fontStyle: "italic" }}>
                Hôm nay, ngày {today.getDate()} tháng {today.getMonth() + 1} năm {today.getFullYear()}, tại Ban Quản lý Ký túc xá, chúng tôi gồm có:
              </p>

              {/* Các Bên (A & B) */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontWeight: "bold", fontSize: 15, marginBottom: 8 }}>BÊN CHO THUÊ (BÊN A): BAN QUẢN LÝ KÝ TÚC XÁ DORMIFY HCMUS</h3>
                <p style={{ fontSize: 15, marginBottom: 4 }}><strong>Đại diện:</strong> Ông/Bà Nguyễn Văn Đại Diện</p>
                <p style={{ fontSize: 15, marginBottom: 4 }}><strong>Chức vụ:</strong> Trưởng Ban Quản lý Ký túc xá</p>
                <p style={{ fontSize: 15, marginBottom: 4 }}><strong>Địa chỉ:</strong> Khu đô thị ĐHQG-HCM, Thủ Đức, TP. Hồ Chí Minh</p>
                <p style={{ fontSize: 15, marginBottom: 4 }}><strong>Điện thoại:</strong> 028 3896 6666</p>
              </div>

              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontWeight: "bold", fontSize: 15, marginBottom: 8 }}>BÊN THUÊ (BÊN B): SINH VIÊN LƯU TRÚ</h3>
                <p style={{ fontSize: 15, marginBottom: 4 }}><strong>Họ và tên:</strong> {contract.user?.fullName}</p>
                <p style={{ fontSize: 15, marginBottom: 4 }}><strong>Mã số sinh viên:</strong> {contract.user?.mssv || "Không có"}</p>
                <p style={{ fontSize: 15, marginBottom: 4 }}>
                  <strong>CCCD/CMND số:</strong> {contract.user?.cccd || "Không có"} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <strong>Số điện thoại:</strong> {contract.user?.phone || "Không có"}
                </p>
                <p style={{ fontSize: 15, marginBottom: 4 }}><strong>Email:</strong> {contract.user?.email}</p>
              </div>

              <p style={{ fontSize: 15, marginBottom: 16 }}>
                Hai bên cùng thỏa thuận và thống nhất ký kết Hợp đồng thuê chỗ ở nội trú với các điều khoản sau đây:
              </p>

              {/* Điều khoản 1 */}
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontWeight: "bold", fontSize: 15, marginBottom: 8 }}>Điều 1: Đối tượng hợp đồng và Thời hạn</h3>
                <p style={{ fontSize: 15, marginBottom: 4 }}>1. Bên A đồng ý cho Bên B thuê 01 chỗ ở tại <strong>Phòng {contract.room?.name}</strong>, Tòa nhà <strong>{contract.room?.building}</strong> (Tầng {contract.room?.floor}) thuộc Ký túc xá Dormify HCMUS.</p>
                <p style={{ fontSize: 15, marginBottom: 4 }}>2. Thời hạn thuê: Có hiệu lực kể từ ngày <strong>{formatDate(contract.startDate)}</strong> đến ngày <strong>{formatDate(contract.endDate)}</strong>.</p>
              </div>

              {/* Điều khoản 2 */}
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontWeight: "bold", fontSize: 15, marginBottom: 8 }}>Điều 2: Giá thuê và Phương thức thanh toán</h3>
                <p style={{ fontSize: 15, marginBottom: 4 }}>1. Tiền thuê chỗ ở: <strong>{contract.rentalFee?.toLocaleString("vi-VN")} VNĐ/tháng</strong> (Giá này không bao gồm các chi phí phụ trội như điện, nước, internet...).</p>
                <p style={{ fontSize: 15, marginBottom: 4 }}>2. Phương thức thanh toán: Bên B có trách nhiệm thanh toán định kỳ hàng tháng qua cổng thanh toán trực tuyến của hệ thống Dormify trước ngày 05 hàng tháng.</p>
              </div>

              {/* Điều khoản 3 */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontWeight: "bold", fontSize: 15, marginBottom: 8 }}>Điều 3: Quyền và Nghĩa vụ của các bên</h3>
                {termLines.length > 0 ? (
                  <ul style={{ listStyleType: "disc", paddingLeft: 24, margin: 0, fontSize: 15 }}>
                    {termLines.map((line, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <>
                    <p style={{ fontSize: 15, marginBottom: 4 }}>1. <strong>Bên A:</strong> Đảm bảo cơ sở vật chất, an ninh trật tự; Hướng dẫn và kiểm tra Bên B thực hiện đúng Nội quy Ký túc xá.</p>
                    <p style={{ fontSize: 15, marginBottom: 4 }}>2. <strong>Bên B:</strong> Sử dụng trang thiết bị đúng mục đích; Đóng phí đầy đủ, đúng hạn; Chấp hành nghiêm chỉnh quy định pháp luật và Nội quy Ký túc xá sinh viên.</p>
                  </>
                )}
              </div>

              <p style={{ fontSize: 15, marginBottom: 32 }}>Hợp đồng này được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản. Hợp đồng điện tử lưu trữ trên hệ thống có giá trị tương đương bản gốc.</p>

              {/* Signatures */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", breakInside: "avoid" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: "bold", fontSize: 15 }}>ĐẠI DIỆN BÊN A</div>
                  <div style={{ fontSize: 14, fontStyle: "italic", marginBottom: 16 }}>(Ký, ghi rõ họ tên và đóng dấu)</div>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                    {/* Dùng màu đỏ cho con dấu pháp lý bên A */}
                    <Seal id="seal-a" color="#dc2626" arc="★ BAN QUẢN LÝ KTX DORMIFY ★" bottom="ĐÃ KÝ ĐÓNG DẤU" rotate={-7} />
                  </div>
                  <div style={{ fontWeight: "bold", fontSize: 15 }}>Ban Quản Lý</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: "bold", fontSize: 15 }}>ĐẠI DIỆN BÊN B</div>
                  <div style={{ fontSize: 14, fontStyle: "italic", marginBottom: 16 }}>(Chữ ký số điện tử)</div>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                    {/* Dùng màu xanh biển cho con dấu điện tử bên B */}
                    <Seal id="seal-b" color="#2563eb" arc="★ SINH VIÊN LƯU TRÚ ★" bottom="ĐÃ XÁC THỰC KÝ SỐ" rotate={6} />
                  </div>
                  <div style={{ fontWeight: "bold", fontSize: 15 }}>{contract.user?.fullName}</div>
                </div>
              </div>
            </div>

            {/* ── ACTION BAR ── */}
            <div className="no-print" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
              <button
                onClick={() =>
                  exportContractPdf({
                    contractNumber: contract.contractNumber,
                    studentName: contract.user?.fullName,
                    mssv: contract.user?.mssv,
                    email: contract.user?.email,
                    phone: contract.user?.phone,
                    cccd: contract.user?.cccd,
                    roomName: contract.room?.name,
                    building: contract.room?.building,
                    floor: contract.room?.floor,
                    startDate: contract.startDate,
                    endDate: contract.endDate,
                    rentalFee: contract.rentalFee,
                    status: contract.status,
                    terms: contract.terms,
                  })
                }
                style={{ flex: 1, minWidth: 200, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 16px", fontWeight: 700, fontSize: 14, color: "var(--color-text)", background: "#fff", border: "1px solid var(--color-divider)", borderRadius: 8, cursor: "pointer", transition: "all 0.2s" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9V2h12v7" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                In / Tải PDF Hợp đồng
              </button>

              {active && (
                <>
                  <button
                    onClick={handleExtend}
                    style={{ flex: 1, minWidth: 150, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "12px 16px", fontWeight: 700, fontSize: 14, color: "#fff", background: "var(--color-text)", border: "1px solid var(--color-text)", borderRadius: 8, cursor: "pointer", transition: "all 0.2s" }}
                  >
                    Gia hạn hợp đồng
                  </button>
                  <button
                    onClick={handleTerminate}
                    style={{ flex: 1, minWidth: 120, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "12px 16px", fontWeight: 700, fontSize: 14, color: "#dc2626", background: "transparent", border: "1px solid #dc2626", borderRadius: 8, cursor: "pointer", transition: "all 0.2s" }}
                  >
                    Thanh lý
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid var(--color-divider)", borderRadius: 12, boxShadow: "var(--shadow-lg)", padding: "80px 40px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, background: "var(--color-accent-100)", color: "var(--color-accent-700)", borderRadius: 12, display: "grid", placeItems: "center", margin: "0 auto 22px" }}>
              <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Chưa ghi nhận hợp đồng điện tử</h2>
            <p style={{ color: "var(--color-neutral-700)", fontSize: 15, lineHeight: 1.6, maxWidth: 520, margin: "0 auto" }}>
              Hợp đồng pháp lý sẽ được tự động tạo và xuất bản tại không gian này ngay khi đơn đăng ký phòng của bạn được ban quản lý phê duyệt.
            </p>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #fff !important;
          }
          #printable-contract {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}