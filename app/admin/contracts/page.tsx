"use client";

import { useEffect, useState } from "react";
import { apiClient } from "../../utils/apiClient";
import { exportContractPdf } from "../../utils/exportPdf";
import RoomFilterBar, { EMPTY_ROOM_FILTER, matchRoomFilter, type RoomFilterValue } from "../../components/RoomFilterBar";

type ContractStatus = "ACTIVE" | "EXPIRED" | "TERMINATED";

interface Contract {
  _id: string;
  contractNumber: string;
  user?: { fullName?: string; mssv?: string; email?: string; phone?: string };
  room?: { name: string; building: string; floor: number; price?: number };
  startDate: string;
  endDate: string;
  rentalFee: number;
  status: ContractStatus;
  terms?: string;
  createdAt: string;
}

const STATUS_LABEL: Record<ContractStatus, string> = {
  ACTIVE: "Đang hiệu lực",
  EXPIRED: "Hết hạn",
  TERMINATED: "Đã thanh lý",
};

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export default function AdminContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | ContractStatus>("ALL");
  const [roomFilter, setRoomFilter] = useState<RoomFilterValue>(EMPTY_ROOM_FILTER);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const res = await apiClient.get("/contracts");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setContracts(data);
        }
      } catch (error) {
        console.error("Lỗi tải hợp đồng:", error);
      } finally {
        setLoading(false);
      }
    };
    void fetchContracts();
  }, []);

  const countByStatus = (s: ContractStatus) => contracts.filter((c) => c.status === s).length;
  const expiringSoon = contracts.filter((c) => c.status === "ACTIVE" && daysUntil(c.endDate) <= 30 && daysUntil(c.endDate) > 0).length;

  const filtered = contracts.filter((c) => {
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    return matchRoomFilter(roomFilter, c.room);
  });

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("vi-VN");

  return (
    <div className="adm-page px-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700&family=DM+Sans:wght@400;500;700&display=swap');

        .adm-page { max-width: 1180px; margin: 0 auto; padding-top: 24px; padding-bottom: 48px; color: #0D1B2A; font-family: 'DM Sans', sans-serif; }

        .ct-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
        .ct-stat { background: #fff; border: 1px solid rgba(13,27,42,0.09); border-radius: 12px; padding: 16px 20px; }
        .ct-stat-num { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 24px; font-weight: 700; color: #0D1B2A; }
        .ct-stat-label { font-size: 12px; color: #8A9BAD; margin-top: 2px; font-weight: 600; }

        .panel { background: #fff; border: 1px solid rgba(13,27,42,0.09); border-radius: 20px; padding: 28px 32px; box-shadow: 0 10px 24px rgba(13,27,42,0.04); overflow: hidden; }
        .panel-title { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 24px; font-weight: 700; color: #0D1B2A; letter-spacing: -0.5px; }

        .ct-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
        .ct-tab { padding: 8px 14px; border-radius: 8px; border: 1px solid rgba(13,27,42,0.12); background: #fff; font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 600; color: #5c6f82; cursor: pointer; transition: all .15s; }
        .ct-tab:hover { border-color: rgba(13,27,42,0.25); }
        .ct-tab--active { background: #0D1B2A; border-color: #0D1B2A; color: #fff; }

        .adm-table { width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; }
        .adm-table th { padding: 16px 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #8A9BAD; border-bottom: 1px solid rgba(13,27,42,0.08); background: #f8fafc; }
        .adm-table th:first-child { border-top-left-radius: 12px; border-bottom-left-radius: 12px; padding-left: 24px; }
        .adm-table th:last-child { border-top-right-radius: 12px; border-bottom-right-radius: 12px; }
        .adm-table td { padding: 18px 20px; border-bottom: 1px solid rgba(13,27,42,0.04); vertical-align: middle; }
        .adm-table td:first-child { padding-left: 24px; }
        .adm-table tr:last-child td { border-bottom: none; }
        .adm-table tr:hover td { background: #fcfcfb; }

        .badge { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; white-space: nowrap; }
        .badge-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
        .badge--active { background: rgba(34,197,94,0.12); color: #16a34a; }
        .badge--expired { background: rgba(13,27,42,0.07); color: #64748b; }
        .badge--terminated { background: rgba(239,68,68,0.12); color: #dc2626; }

        .ct-expiry { font-size: 11.5px; font-weight: 700; margin-top: 5px; }
        .ct-expiry--warn { color: #d97706; }
        .ct-expiry--danger { color: #dc2626; }
      `}</style>

      {/* THỐNG KÊ */}
      <div className="ct-stats">
        <div className="ct-stat">
          <div className="ct-stat-num">{loading ? "—" : contracts.length}</div>
          <div className="ct-stat-label">Tổng hợp đồng</div>
        </div>
        <div className="ct-stat">
          <div className="ct-stat-num" style={{ color: "#16a34a" }}>{loading ? "—" : countByStatus("ACTIVE")}</div>
          <div className="ct-stat-label">Đang hiệu lực</div>
        </div>
        <div className="ct-stat">
          <div className="ct-stat-num" style={{ color: "#d97706" }}>{loading ? "—" : expiringSoon}</div>
          <div className="ct-stat-label">Sắp hết hạn (≤30 ngày)</div>
        </div>
        <div className="ct-stat">
          <div className="ct-stat-num" style={{ color: "#dc2626" }}>{loading ? "—" : countByStatus("TERMINATED")}</div>
          <div className="ct-stat-label">Đã thanh lý</div>
        </div>
      </div>

      <div className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="panel-title">Quản lý Hợp đồng lưu trú</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="ct-tabs">
              {(["ALL", "ACTIVE", "EXPIRED", "TERMINATED"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`ct-tab ${statusFilter === s ? "ct-tab--active" : ""}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === "ALL" ? `Tất cả (${contracts.length})` : `${STATUS_LABEL[s]} (${countByStatus(s)})`}
                </button>
              ))}
            </div>
            <RoomFilterBar rooms={contracts.map((c) => c.room)} value={roomFilter} onChange={setRoomFilter} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Số hợp đồng</th>
                <th>Sinh viên</th>
                <th>Phòng</th>
                <th>Thời hạn</th>
                <th>Giá thuê</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16 text-[#8A9BAD] font-medium text-sm">Đang tải dữ liệu...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-[#8A9BAD] font-medium text-sm">
                    {contracts.length === 0 ? "Chưa có hợp đồng nào trong hệ thống." : "Không có hợp đồng nào khớp bộ lọc."}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const daysLeft = daysUntil(c.endDate);
                  const showExpiry = c.status === "ACTIVE" && daysLeft <= 30;
                  return (
                    <tr key={c._id} style={{ transition: "background-color 0.2s" }}>
                      <td>
                        <div className="font-bold text-[#0D1B2A] text-[14px] font-mono">{c.contractNumber}</div>
                        <div className="text-[#8A9BAD] text-[12px] mt-1">Ký ngày {fmtDate(c.createdAt)}</div>
                      </td>
                      <td>
                        <div className="font-bold text-[#0D1B2A] text-[14.5px]">{c.user?.fullName || "—"}</div>
                        <div className="text-[#8A9BAD] text-[12.5px] mt-1">MSSV: {c.user?.mssv || "—"}</div>
                      </td>
                      <td>
                        <div className="font-bold text-[#2563eb] text-[14px]">{c.room?.name || "—"}</div>
                        <div className="text-[#8A9BAD] text-[12.5px] mt-1">
                          {c.room ? `Tòa ${c.room.building} · Tầng ${c.room.floor}` : ""}
                        </div>
                      </td>
                      <td className="whitespace-nowrap">
                        <div className="text-[#334155] font-medium text-[13.5px]">{fmtDate(c.startDate)} → {fmtDate(c.endDate)}</div>
                        {showExpiry && (
                          <div className={`ct-expiry ${daysLeft <= 7 ? "ct-expiry--danger" : "ct-expiry--warn"}`}>
                            {daysLeft > 0 ? `⏳ Còn ${daysLeft} ngày` : "Hết hạn hôm nay"}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap font-bold text-[#0D1B2A] text-[14px]">
                        {c.rentalFee.toLocaleString("vi-VN")} đ<span className="text-[#8A9BAD] font-medium text-[12px]">/tháng</span>
                      </td>
                      <td>
                        <span className={`badge badge--${c.status.toLowerCase()}`}>
                          <span className="badge-dot" />
                          {STATUS_LABEL[c.status] || c.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">
                        <button
                          type="button"
                          title="Xuất hợp đồng PDF"
                          onClick={() =>
                            exportContractPdf({
                              contractNumber: c.contractNumber,
                              studentName: c.user?.fullName,
                              mssv: c.user?.mssv,
                              email: c.user?.email,
                              phone: c.user?.phone,
                              roomName: c.room?.name,
                              building: c.room?.building,
                              floor: c.room?.floor,
                              startDate: c.startDate,
                              endDate: c.endDate,
                              rentalFee: c.rentalFee,
                              status: c.status,
                              terms: c.terms,
                            })
                          }
                          className="px-3 py-2 bg-white text-slate-600 hover:text-[#0D1B2A] hover:border-[#C9A84C] border border-slate-200 rounded font-bold transition-colors text-[12.5px]"
                        >
                          📄 PDF
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
