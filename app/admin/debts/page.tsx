"use client";

import { useEffect, useState } from "react";
import { useToast } from "../../components/ToastProvider";
import { useConfirm } from "../../components/ConfirmProvider";
import { apiClient } from "../../utils/apiClient";

interface DebtRoom {
  roomId: string;
  roomName: string;
  building: string;
  floor: number | null;
  occupants: { fullName: string; mssv?: string }[];
  totalDebt: number;
  invoiceCount: number;
  overdueCount: number;
  oldestDueDate?: string | null;
}

interface DebtSummary {
  totalDebt: number;
  roomCount: number;
  totalUnpaidInvoices: number;
  totalOverdueInvoices: number;
  rooms: DebtRoom[];
}

const vnd = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

export default function AdminDebtsPage() {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [summary, setSummary] = useState<DebtSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [remindingAll, setRemindingAll] = useState(false);

  const fetchDebts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/invoices/debts");
      if (res.ok) setSummary(await res.json());
    } catch (err) {
      console.error("Lỗi tải công nợ:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDebts();
  }, []);

  const handleRemind = async (room: DebtRoom) => {
    setRemindingId(room.roomId);
    try {
      const res = await apiClient.post(`/invoices/debts/${room.roomId}/remind`, {});
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Đã gửi nhắc nợ.", `Nhắc nợ phòng ${room.roomName} 🔔`);
      } else {
        toast.error(data.message || "Không gửi được nhắc nợ.");
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setRemindingId(null);
    }
  };

  const handleRemindAll = async () => {
    if (!summary || summary.rooms.length === 0) return;
    const ok = await confirmDialog({
      title: "Nhắc nợ tất cả các phòng?",
      message: `Thông báo nhắc nợ sẽ được gửi đến toàn bộ sinh viên của ${summary.roomCount} phòng đang có công nợ (tổng ${vnd(summary.totalDebt)}).`,
      confirmLabel: "Gửi nhắc nợ",
      variant: "primary",
    });
    if (!ok) return;

    setRemindingAll(true);
    try {
      const res = await apiClient.post("/invoices/debts/remind-all", {});
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Đã gửi nhắc nợ hàng loạt.", "Nhắc nợ hoàn tất 🔔");
      } else {
        toast.error(data.message || "Không gửi được nhắc nợ.");
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setRemindingAll(false);
    }
  };

  const rooms = summary?.rooms ?? [];

  return (
    <div className="adm-page px-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700&family=DM+Sans:wght@400;500;700&display=swap');

        .adm-page { max-width: 1180px; margin: 0 auto; padding-top: 24px; padding-bottom: 48px; color: #0D1B2A; font-family: 'DM Sans', sans-serif; }
        .panel { background: #fff; border: 1px solid rgba(13,27,42,0.09); border-radius: 20px; padding: 28px 32px; box-shadow: 0 10px 24px rgba(13,27,42,0.04); overflow: hidden; }
        .panel-title { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 24px; font-weight: 700; color: #0D1B2A; letter-spacing: -0.5px; }
        .panel-sub { font-size: 13px; color: #64748b; margin-top: 6px; }

        .dt-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .dt-remind-all { display: inline-flex; align-items: center; gap: 8px; background: #0D1B2A; color: #fff; border: none; padding: 11px 20px; border-radius: 9px; font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 13.5px; cursor: pointer; transition: all .18s; }
        .dt-remind-all:hover:not(:disabled) { background: #1A2E42; }
        .dt-remind-all:disabled { opacity: .5; cursor: not-allowed; }

        .dt-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; margin: 22px 0; }
        .dt-stat { background: #FAFAF9; border: 1px solid rgba(13,27,42,0.07); border-radius: 14px; padding: 18px 20px; }
        .dt-stat-num { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 24px; font-weight: 700; color: #0D1B2A; }
        .dt-stat-num--danger { color: #dc2626; }
        .dt-stat-label { font-size: 12px; color: #8A9BAD; font-weight: 600; margin-top: 3px; }

        .adm-table { width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; min-width: 820px; }
        .adm-table th { padding: 14px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #8A9BAD; border-bottom: 1px solid rgba(13,27,42,0.08); background: #f8fafc; }
        .adm-table th:first-child { border-top-left-radius: 12px; border-bottom-left-radius: 12px; padding-left: 20px; }
        .adm-table th:last-child { border-top-right-radius: 12px; border-bottom-right-radius: 12px; text-align: center; }
        .adm-table td { padding: 16px; border-bottom: 1px solid rgba(13,27,42,0.04); vertical-align: middle; font-size: 13.5px; color: #37485c; }
        .adm-table td:first-child { padding-left: 20px; }
        .adm-table tr:last-child td { border-bottom: none; }
        .adm-table tr:hover td { background: #fcfcfb; }

        .dt-badge { display: inline-flex; align-items: center; padding: 4px 11px; border-radius: 999px; font-size: 11px; font-weight: 800; }
        .dt-badge--overdue { background: rgba(239,68,68,.1); color: #dc2626; }
        .dt-badge--pending { background: rgba(245,158,11,.1); color: #d97706; }

        .dt-remind-btn { padding: 8px 16px; background: #fff; color: #0D1B2A; border: 1px solid rgba(13,27,42,.18); border-radius: 8px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 700; transition: all .15s; white-space: nowrap; }
        .dt-remind-btn:hover:not(:disabled) { background: #F5F3EF; border-color: #c9a84c; }
        .dt-remind-btn:disabled { opacity: .5; cursor: not-allowed; }

        .dt-occupants { font-size: 12.5px; color: #64748b; line-height: 1.55; max-width: 220px; }
        .dt-empty { text-align: center; padding: 48px 20px; color: #8A9BAD; font-size: 13.5px; }
      `}</style>

      <div className="panel">
        <div className="dt-head">
          <div>
            <h2 className="panel-title">Theo dõi công nợ</h2>
            <p className="panel-sub">
              Các phòng đang có hóa đơn chưa thanh toán hoặc quá hạn. Bấm nhắc nợ để gửi thông báo đến sinh viên trong phòng.
            </p>
          </div>
          <button
            type="button"
            className="dt-remind-all"
            disabled={loading || remindingAll || rooms.length === 0}
            onClick={() => void handleRemindAll()}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {remindingAll ? "Đang gửi..." : "Nhắc nợ tất cả"}
          </button>
        </div>

        <div className="dt-stats">
          <div className="dt-stat">
            <div className="dt-stat-num dt-stat-num--danger">{loading || !summary ? "—" : vnd(summary.totalDebt)}</div>
            <div className="dt-stat-label">Tổng công nợ</div>
          </div>
          <div className="dt-stat">
            <div className="dt-stat-num">{loading || !summary ? "—" : summary.roomCount}</div>
            <div className="dt-stat-label">Phòng đang nợ</div>
          </div>
          <div className="dt-stat">
            <div className="dt-stat-num">{loading || !summary ? "—" : summary.totalUnpaidInvoices}</div>
            <div className="dt-stat-label">Hóa đơn chưa thanh toán</div>
          </div>
          <div className="dt-stat">
            <div className="dt-stat-num dt-stat-num--danger">{loading || !summary ? "—" : summary.totalOverdueInvoices}</div>
            <div className="dt-stat-label">Hóa đơn quá hạn</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Phòng</th>
                <th>Sinh viên đang ở</th>
                <th>Số hóa đơn nợ</th>
                <th>Hạn cũ nhất</th>
                <th>Tổng nợ</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="dt-empty">Đang tải công nợ...</td></tr>
              ) : rooms.length === 0 ? (
                <tr><td colSpan={6} className="dt-empty">Không có phòng nào đang nợ — tài chính sạch sẽ! 🎉</td></tr>
              ) : (
                rooms.map((r) => (
                  <tr key={r.roomId}>
                    <td>
                      <div className="font-bold text-[#2563eb] text-[14.5px]">{r.roomName}</div>
                      <div className="text-[#8A9BAD] text-[12px] mt-0.5">
                        Tòa {r.building}{r.floor != null ? ` · Tầng ${r.floor}` : ""}
                      </div>
                    </td>
                    <td>
                      <div className="dt-occupants">
                        {r.occupants.length > 0
                          ? r.occupants.map((o) => o.fullName + (o.mssv ? ` (${o.mssv})` : "")).join(", ")
                          : <em>Phòng trống — nợ tồn đọng</em>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {r.overdueCount > 0 && (
                          <span className="dt-badge dt-badge--overdue">{r.overdueCount} quá hạn</span>
                        )}
                        {r.invoiceCount - r.overdueCount > 0 && (
                          <span className="dt-badge dt-badge--pending">{r.invoiceCount - r.overdueCount} chờ đóng</span>
                        )}
                      </div>
                    </td>
                    <td>{r.oldestDueDate ? new Date(r.oldestDueDate).toLocaleDateString("vi-VN") : "—"}</td>
                    <td className="font-bold text-[#dc2626] text-[14.5px]">{vnd(r.totalDebt)}</td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="dt-remind-btn"
                        disabled={remindingId === r.roomId || r.occupants.length === 0}
                        title={r.occupants.length === 0 ? "Phòng không còn sinh viên để nhắc" : undefined}
                        onClick={() => void handleRemind(r)}
                      >
                        {remindingId === r.roomId ? "Đang gửi..." : "🔔 Nhắc nợ"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
