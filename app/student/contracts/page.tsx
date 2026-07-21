"use client";
import { useEffect, useState, useCallback, CSSProperties } from "react";
import Link from "next/link";
import { Archivo } from "next/font/google";
import { apiClient } from "../../utils/apiClient";
import { useToast } from "../../components/ToastProvider";
import { exportContractPdf } from "../../utils/exportPdf";

const archivo = Archivo({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "800"],
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

// ─── Modernist design tokens (shared with the rest of the redesign) ──────────
const tokens = {
  "--color-bg": "#f3f2f2",
  "--color-surface": "#eae9e9",
  "--color-text": "#201e1d",
  "--color-accent": "#ec3013",
  "--color-accent-100": "#fff2ef",
  "--color-accent-700": "#ae1800",
  "--color-neutral-600": "#7d7979",
  "--color-neutral-700": "#605d5d",
  "--color-neutral-800": "#444141",
  "--color-neutral-900": "#2d2b2b",
  "--color-divider": "color-mix(in srgb, #201e1d 40%, transparent)",
  "--shadow-lg": "0 12px 32px color-mix(in srgb, #2d2b2b 22%, transparent)",
} as CSSProperties;

const kicker: CSSProperties = {
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--color-neutral-600)",
  marginBottom: 4,
};
const metaValue: CSSProperties = { fontWeight: 800, fontSize: 15 };
const cellLabel: CSSProperties = {
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.09em",
  color: "var(--color-neutral-600)",
  marginBottom: 4,
};
const cellValue: CSSProperties = { fontWeight: 600, fontSize: 15 };
const articleNo: CSSProperties = {
  fontWeight: 800,
  fontSize: 13,
  color: "var(--color-accent)",
  letterSpacing: "0.06em",
};

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
        <path id={id} d="M64 64 m-46 0 a46 46 0 1 1 92 0" />
      </defs>
      <circle cx="64" cy="64" r="58" fill="none" stroke={color} strokeWidth="2.5" />
      <circle cx="64" cy="64" r="48" fill="none" stroke={color} strokeWidth="1" strokeDasharray="2 3" />
      <text fontFamily="Archivo, sans-serif" fontWeight="800" fontSize="9.5" letterSpacing="1.3" fill={color}>
        <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
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
        background: "color-mix(in srgb, var(--color-neutral-900) 50%, transparent)",
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
              fontWeight: 800,
              fontSize: 14,
              cursor: busy ? "not-allowed" : "pointer",
              color: "var(--color-text)",
              background: "transparent",
              border: "1px solid var(--color-divider)",
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
              fontWeight: 800,
              fontSize: 14,
              cursor: busy ? "not-allowed" : "pointer",
              color: "var(--color-bg)",
              background: "var(--color-accent)",
              border: "1px solid var(--color-accent)",
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
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function DocumentSkeleton() {
  return (
    <div style={{ width: "100%", maxWidth: 860 }}>
      <div style={{ background: "#fff", border: "2px solid var(--color-text)", boxShadow: "var(--shadow-lg)", padding: "60px 68px", minHeight: 600, display: "flex", flexDirection: "column", gap: 24 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ height: 16, background: "var(--color-surface)", width: `${90 - i * 6}%`, animation: "pulse 1.4s ease-in-out infinite" }} />
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
            fontWeight: 800,
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 18,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Trở về Tổng quan
        </Link>

        {loading ? (
          <DocumentSkeleton />
        ) : loadError ? (
          <div style={{ background: "#fff", border: "2px solid var(--color-text)", boxShadow: "var(--shadow-lg)", padding: "64px 40px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, background: "var(--color-accent-100)", color: "var(--color-accent-700)", display: "grid", placeItems: "center", margin: "0 auto 22px" }}>
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
              style={{ padding: "12px 24px", background: "var(--color-accent)", color: "var(--color-bg)", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer" }}
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
                border: "2px solid var(--color-text)",
                boxShadow: "var(--shadow-lg)",
                padding: "60px 68px 56px",
                overflow: "hidden",
              }}
            >
              {terminated && (
                <div aria-hidden="true" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none", zIndex: 2 }}>
                  <div style={{ transform: "rotate(-16deg)", fontWeight: 800, fontSize: 110, letterSpacing: "0.04em", color: "var(--color-accent)", opacity: 0.11, whiteSpace: "nowrap" }}>
                    ĐÃ THANH LÝ
                  </div>
                </div>
              )}

              {/* Letterhead */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: "none", width: 36, height: 36, background: "var(--color-accent)", color: "#fff", fontWeight: 800, fontSize: 20, display: "grid", placeItems: "center" }}>D</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 19, letterSpacing: "0.04em", lineHeight: 1 }}>DORMIFY</div>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--color-neutral-600)", marginTop: 3 }}>Hệ thống ký túc xá thông minh</div>
                  </div>
                </div>
                {terminated ? (
                  <span style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: 7, background: "var(--color-accent)", color: "#fff", fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", padding: "6px 12px" }}>
                    <span style={{ width: 7, height: 7, background: "#fff" }} />
                    Đã thanh lý
                  </span>
                ) : (
                  <span style={{ flex: "none", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 7, border: "1.5px solid var(--color-accent)", color: "var(--color-accent-700)", fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", padding: "5px 11px" }}>
                    <span style={{ width: 7, height: 7, background: "var(--color-accent)" }} />
                    Đang hiệu lực
                  </span>
                )}
              </div>

              <hr style={{ height: 2, border: 0, background: "var(--color-text)", margin: "20px 0 26px" }} />

              {/* Quốc hiệu */}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 800, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.02em" }}>Cộng hòa xã hội chủ nghĩa Việt Nam</div>
                <div style={{ display: "inline-block", fontWeight: 600, fontSize: 14, borderBottom: "1.5px solid var(--color-text)", paddingBottom: 2, marginTop: 4 }}>Độc lập – Tự do – Hạnh phúc</div>
              </div>

              {/* Title */}
              <h1 style={{ fontWeight: 800, fontSize: 42, lineHeight: 1.02, letterSpacing: "-0.02em", textTransform: "uppercase", margin: "34px 0 0", maxWidth: "11ch" }}>Hợp đồng thuê phòng ký túc xá</h1>

              {/* Meta strip */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 36, borderTop: "1px solid var(--color-divider)", borderBottom: "1px solid var(--color-divider)", padding: "14px 0", marginTop: 24 }}>
                <div>
                  <div style={kicker}>Số hợp đồng</div>
                  <div style={metaValue}>{contract.contractNumber} / HĐ-DORMIFY</div>
                </div>
                <div>
                  <div style={kicker}>Ngày lập</div>
                  <div style={metaValue}>{formatDate(today.toISOString())}</div>
                </div>
                <div>
                  <div style={kicker}>Hiệu lực đến</div>
                  <div style={metaValue}>{formatDate(contract.endDate)}</div>
                </div>
              </div>

              <p style={{ fontSize: 14, color: "var(--color-neutral-700)", margin: "22px 0 0" }}>
                Hôm nay, ngày {today.getDate()} tháng {today.getMonth() + 1} năm {today.getFullYear()}, chúng tôi gồm có:
              </p>

              {/* Parties */}
              <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 20 }}>
                <div style={{ display: "flex", gap: 18 }}>
                  <div style={{ flex: "none", width: 42, height: 42, background: "var(--color-text)", color: "#fff", fontWeight: 800, fontSize: 20, display: "grid", placeItems: "center" }}>A</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--color-neutral-600)" }}>Bên cho thuê — Bên A</div>
                    <div style={{ fontWeight: 800, fontSize: 18, marginTop: 2 }}>Ban Quản Lý KTX Dormify</div>
                    <div style={{ fontSize: 14, lineHeight: 1.65, color: "var(--color-neutral-800)", marginTop: 4 }}>
                      Đại diện ban điều hành và quản lý hạ tầng nội trú sinh viên thông minh.
                      <br />
                      Địa chỉ: Khu đô thị Đại học Quốc gia TP.HCM.
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 18 }}>
                  <div style={{ flex: "none", width: 42, height: 42, background: "var(--color-accent)", color: "#fff", fontWeight: 800, fontSize: 20, display: "grid", placeItems: "center" }}>B</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--color-neutral-600)" }}>Bên thuê — Bên B</div>
                    <div style={{ fontWeight: 800, fontSize: 18, marginTop: 2 }}>Sinh viên đăng ký lưu trú</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "2px solid var(--color-text)", marginTop: 12 }}>
                      <div style={{ padding: "11px 16px 11px 0", borderBottom: "1px solid var(--color-divider)", borderRight: "1px solid var(--color-divider)" }}>
                        <div style={cellLabel}>Họ và tên</div>
                        <div style={cellValue}>{contract.user?.fullName}</div>
                      </div>
                      <div style={{ padding: "11px 0 11px 16px", borderBottom: "1px solid var(--color-divider)" }}>
                        <div style={cellLabel}>Mã số sinh viên</div>
                        <div style={cellValue}>{contract.user?.mssv || "Không có"}</div>
                      </div>
                      <div style={{ padding: "11px 16px 11px 0", borderBottom: "1px solid var(--color-divider)", borderRight: "1px solid var(--color-divider)" }}>
                        <div style={cellLabel}>Số CCCD / CMND</div>
                        <div style={cellValue}>{contract.user?.cccd || "Không có"}</div>
                      </div>
                      <div style={{ padding: "11px 0 11px 16px", borderBottom: "1px solid var(--color-divider)" }}>
                        <div style={cellLabel}>Số điện thoại</div>
                        <div style={{ ...cellValue, color: contract.user?.phone ? undefined : "var(--color-neutral-600)" }}>{contract.user?.phone || "Không có"}</div>
                      </div>
                      <div style={{ gridColumn: "1 / -1", padding: "11px 0", borderBottom: "1px solid var(--color-divider)" }}>
                        <div style={cellLabel}>Email</div>
                        <div style={cellValue}>{contract.user?.email}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 14, fontStyle: "italic", color: "var(--color-neutral-700)", margin: "24px 0 0" }}>Hai bên cùng thống nhất ký kết Hợp đồng thuê phòng với các điều khoản sau đây:</p>

              {/* Điều 1 */}
              <div style={{ marginTop: 30 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 14, borderBottom: "2px solid var(--color-text)", paddingBottom: 8 }}>
                  <span style={articleNo}>ĐIỀU 1</span>
                  <h2 style={{ fontWeight: 800, fontSize: 17, textTransform: "uppercase", letterSpacing: "0.01em", margin: 0 }}>Nội dung thỏa thuận &amp; chi phí</h2>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "190px 1fr", marginTop: 6 }}>
                  <div style={{ padding: "12px 16px 12px 0", borderBottom: "1px solid var(--color-divider)", fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em" }}>Tài sản cho thuê</div>
                  <div style={{ padding: "12px 0", borderBottom: "1px solid var(--color-divider)", fontSize: 15 }}>
                    Bên A đồng ý cho Bên B thuê một vị trí giường tại Phòng <strong>{contract.room?.name}</strong>, Tòa nhà <strong>{contract.room?.building}</strong> (Tầng {contract.room?.floor}).
                  </div>
                  <div style={{ padding: "12px 16px 12px 0", borderBottom: "1px solid var(--color-divider)", fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em" }}>Phí nội trú</div>
                  <div style={{ padding: "12px 0", borderBottom: "1px solid var(--color-divider)", fontSize: 15 }}>
                    <strong>{contract.rentalFee?.toLocaleString("vi-VN")} VNĐ</strong> / tháng.
                  </div>
                  <div style={{ padding: "12px 16px 12px 0", borderBottom: "1px solid var(--color-divider)", fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em" }}>Thời hạn hợp đồng</div>
                  <div style={{ padding: "12px 0", borderBottom: "1px solid var(--color-divider)", fontSize: 15 }}>
                    Có hiệu lực kể từ ngày <strong>{formatDate(contract.startDate)}</strong> đến hết ngày <strong>{formatDate(contract.endDate)}</strong>.
                  </div>
                </div>
              </div>

              {/* Điều 2 */}
              <div style={{ marginTop: 28 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 14, borderBottom: "2px solid var(--color-text)", paddingBottom: 8 }}>
                  <span style={articleNo}>ĐIỀU 2</span>
                  <h2 style={{ fontWeight: 800, fontSize: 17, textTransform: "uppercase", letterSpacing: "0.01em", margin: 0 }}>Trách nhiệm &amp; nghĩa vụ</h2>
                </div>
                {termLines.length > 0 ? (
                  <ol style={{ listStyle: "none", margin: "14px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                    {termLines.map((line, i) => (
                      <li key={i} style={{ display: "flex", gap: 14, fontSize: 15, lineHeight: 1.6 }}>
                        <span style={{ flex: "none", fontWeight: 800, fontSize: 13, color: "var(--color-accent)", minWidth: 20 }}>{String(i + 1).padStart(2, "0")}</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p style={{ marginTop: 14, fontSize: 15, color: "var(--color-neutral-700)" }}>Không có điều khoản bổ sung.</p>
                )}
              </div>

              {/* Signatures */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", marginTop: 44, borderTop: "2px solid var(--color-text)", breakInside: "avoid" }}>
                <div style={{ textAlign: "center", padding: "24px 16px 8px", borderRight: "1px solid var(--color-divider)" }}>
                  <div style={{ fontWeight: 800, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Đại diện Bên A</div>
                  <div style={{ fontSize: 12.5, fontStyle: "italic", color: "var(--color-neutral-600)", marginTop: 3 }}>(Ký, ghi rõ họ tên và đóng dấu)</div>
                  <div style={{ display: "flex", justifyContent: "center", margin: "14px 0 6px" }}>
                    <Seal id="seal-a" color="var(--color-accent)" arc="★ BAN QUẢN LÝ KTX DORMIFY ★" bottom="ĐÃ XÁC THỰC" rotate={-7} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>Ban Quản Lý</div>
                </div>
                <div style={{ textAlign: "center", padding: "24px 16px 8px" }}>
                  <div style={{ fontWeight: 800, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Đại diện Bên B</div>
                  <div style={{ fontSize: 12.5, fontStyle: "italic", color: "var(--color-neutral-600)", marginTop: 3 }}>(Ký, ghi rõ họ tên)</div>
                  <div style={{ display: "flex", justifyContent: "center", margin: "14px 0 6px" }}>
                    <Seal id="seal-b" color="var(--color-text)" arc="★ SINH VIÊN LƯU TRÚ ★" bottom="CHỮ KÝ SỐ" rotate={6} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{contract.user?.fullName}</div>
                </div>
              </div>
            </div>

            {/* ── ACTION BAR ── */}
            <div className="no-print" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
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
                style={{ flex: 1, minWidth: 200, display: "inline-flex", alignItems: "center", justifyContent: "flex-start", gap: 8, padding: "12px 16px", fontWeight: 800, fontSize: 14, color: "var(--color-text)", background: "transparent", border: "1px solid var(--color-divider)", cursor: "pointer" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9V2h12v7" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                In PDF / Tải xuống
              </button>

              {active && (
                <>
                  <button
                    onClick={handleExtend}
                    style={{ flex: 1, minWidth: 150, display: "inline-flex", alignItems: "center", justifyContent: "flex-start", padding: "12px 16px", fontWeight: 800, fontSize: 14, color: "var(--color-bg)", background: "var(--color-accent)", border: "1px solid var(--color-accent)", cursor: "pointer" }}
                  >
                    Gia hạn hợp đồng
                  </button>
                  <button
                    onClick={handleTerminate}
                    style={{ flex: 1, minWidth: 120, display: "inline-flex", alignItems: "center", justifyContent: "flex-start", padding: "12px 16px", fontWeight: 800, fontSize: 14, color: "var(--color-accent)", background: "transparent", border: "1px solid var(--color-accent)", cursor: "pointer" }}
                  >
                    Thanh lý
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div style={{ background: "#fff", border: "2px solid var(--color-text)", boxShadow: "var(--shadow-lg)", padding: "80px 40px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, background: "var(--color-accent-100)", color: "var(--color-accent-700)", display: "grid", placeItems: "center", margin: "0 auto 22px" }}>
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
