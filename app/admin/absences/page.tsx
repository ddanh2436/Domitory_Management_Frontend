"use client";

import { useEffect, useState } from "react";
import { useToast } from "../../components/ToastProvider";
import { useConfirm } from "../../components/ConfirmProvider";
import { apiClient } from "../../utils/apiClient";
import RoomFilterBar, { EMPTY_ROOM_FILTER, matchRoomFilter, type RoomFilterValue } from "../../components/RoomFilterBar";

type AbsenceType = "TAM_TRU" | "TAM_VANG";
type AbsenceStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

interface Absence {
  _id: string;
  type: AbsenceType;
  user?: { fullName?: string; mssv?: string; phone?: string };
  room?: { name: string; building: string; floor: number };
  startDate: string;
  endDate: string;
  reason: string;
  guestName?: string;
  guestIdNumber?: string;
  status: AbsenceStatus;
  createdAt: string;
}

const TYPE_LABEL: Record<AbsenceType, string> = {
  TAM_TRU: "Tạm trú",
  TAM_VANG: "Tạm vắng",
};

const STATUS_LABEL: Record<AbsenceStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  CANCELLED: "Đã hủy",
};

export default function AdminAbsencesPage() {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [roomFilter, setRoomFilter] = useState<RoomFilterValue>(EMPTY_ROOM_FILTER);
  const toast = useToast();
  const confirmDialog = useConfirm();

  const fetchAbsences = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/absences");
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) setAbsences(data);
      }
    } catch (error) {
      console.error("Lỗi tải đơn tạm trú/tạm vắng:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAbsences();
  }, []);

  const filteredAbsences = absences.filter((a) => matchRoomFilter(roomFilter, a.room));

  const handleAction = async (absenceId: string, action: "approve" | "reject") => {
    const isApprove = action === "approve";
    const ok = await confirmDialog({
      title: isApprove ? "Duyệt đơn tạm trú/tạm vắng?" : "Từ chối đơn tạm trú/tạm vắng?",
      message: isApprove
        ? "Đơn sẽ được chấp thuận và sinh viên nhận được thông báo ngay lập tức."
        : "Đơn này sẽ bị từ chối và sinh viên sẽ nhận được thông báo.",
      confirmLabel: isApprove ? "Duyệt đơn" : "Từ chối",
      variant: isApprove ? "primary" : "danger",
    });
    if (!ok) return;

    setProcessingId(absenceId);
    try {
      const response = await apiClient.patch(`/absences/${absenceId}/${action}`);
      const data = await response.json();
      if (response.ok) {
        toast.success(
          action === "approve" ? "Đã duyệt đơn và thông báo cho sinh viên." : "Đã từ chối đơn này.",
          action === "approve" ? "Đã duyệt ✅" : "Đã từ chối",
        );
        void fetchAbsences();
      } else {
        toast.error(data.message || "Không xử lý được đơn, vui lòng thử lại.");
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setProcessingId(null);
    }
  };

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("vi-VN");

  return (
    <div className="adm-page px-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700&family=DM+Sans:wght@400;500;700&display=swap');

        .adm-page { max-width: 1180px; margin: 0 auto; padding-top: 24px; padding-bottom: 48px; color: #0D1B2A; font-family: 'DM Sans', sans-serif; }
        .panel { background: #fff; border: 1px solid rgba(13,27,42,0.09); border-radius: 20px; padding: 28px 32px; box-shadow: 0 10px 24px rgba(13,27,42,0.04); overflow: hidden; }
        .panel-title { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 700; color: #0D1B2A; letter-spacing: -0.5px; }

        .adm-table { width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; }
        .adm-table th { padding: 16px 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #8A9BAD; border-bottom: 1px solid rgba(13,27,42,0.08); background: #f8fafc; }
        .adm-table th:first-child { border-top-left-radius: 12px; border-bottom-left-radius: 12px; padding-left: 24px; }
        .adm-table th:last-child { border-top-right-radius: 12px; border-bottom-right-radius: 12px; text-align: center; }
        .adm-table td { padding: 20px; border-bottom: 1px solid rgba(13,27,42,0.04); vertical-align: middle; }
        .adm-table td:first-child { padding-left: 24px; }
        .adm-table tr:last-child td { border-bottom: none; }
        .adm-table tr:hover td { background: #fcfcfb; }

        .badge { display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; }
        .badge--pending { background: rgba(245,158,11,0.12); color: #d97706; }
        .badge--approved { background: rgba(34,197,94,0.12); color: #16a34a; }
        .badge--rejected { background: rgba(239,68,68,0.12); color: #dc2626; }
        .badge--cancelled { background: rgba(13,27,42,0.07); color: #64748b; }

        .type-chip { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 700; }
        .type-chip--tam_tru { background: rgba(37,99,235,0.1); color: #2563eb; }
        .type-chip--tam_vang { background: rgba(124,58,237,0.1); color: #7c3aed; }

        .reason-cell { max-width: 180px; font-size: 13px; color: #475569; line-height: 1.5; }
        .guest-note { font-size: 12px; color: #8A9BAD; margin-top: 4px; }
      `}</style>

      <div className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="panel-title">Đơn Tạm trú / Tạm vắng</h2>
          <RoomFilterBar rooms={absences.map((a) => a.room)} value={roomFilter} onChange={setRoomFilter} />
        </div>

        <div className="overflow-x-auto">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Sinh viên</th>
                <th>Phòng</th>
                <th>Loại đơn</th>
                <th>Thời gian</th>
                <th>Lý do</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-[#8A9BAD] font-medium text-sm">Đang tải dữ liệu...</td>
                </tr>
              ) : filteredAbsences.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-[#8A9BAD] font-medium text-sm">
                    {absences.length === 0 ? "Chưa có đơn tạm trú/tạm vắng nào." : "Không có đơn nào khớp bộ lọc."}
                  </td>
                </tr>
              ) : (
                filteredAbsences.map((a) => (
                  <tr key={a._id} style={{ transition: "background-color 0.2s" }}>
                    <td>
                      <div className="font-bold text-[#0D1B2A] text-[15px]">{a.user?.fullName || "—"}</div>
                      <div className="text-[#8A9BAD] text-[13px] mt-1">MSSV: {a.user?.mssv || "—"}</div>
                    </td>
                    <td>
                      <div className="font-bold text-[#2563eb] text-[14.5px]">{a.room?.name || "—"}</div>
                      <div className="text-[#8A9BAD] text-[12.5px] mt-1">
                        {a.room ? `Tòa ${a.room.building} · Tầng ${a.room.floor}` : ""}
                      </div>
                    </td>
                    <td>
                      <span className={`type-chip type-chip--${a.type.toLowerCase()}`}>{TYPE_LABEL[a.type]}</span>
                      {a.type === "TAM_TRU" && a.guestName && (
                        <div className="guest-note">Khách: {a.guestName}<br />CCCD: {a.guestIdNumber || "—"}</div>
                      )}
                    </td>
                    <td className="text-[#334155] font-medium text-[13.5px] whitespace-nowrap">
                      {fmtDate(a.startDate)} → {fmtDate(a.endDate)}
                    </td>
                    <td><div className="reason-cell" title={a.reason}>{a.reason}</div></td>
                    <td>
                      <span className={`badge badge--${a.status.toLowerCase()}`}>{STATUS_LABEL[a.status]}</span>
                    </td>
                    <td className="text-center">
                      {a.status === "PENDING" ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleAction(a._id, "approve")}
                            disabled={processingId === a._id}
                            className="px-4 py-2 bg-[#0D1B2A] text-white rounded-lg hover:bg-[#1A2E42] font-semibold text-[13px] transition-all shadow-sm disabled:opacity-60"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => handleAction(a._id, "reject")}
                            disabled={processingId === a._id}
                            className="px-4 py-2 bg-white text-[#dc2626] rounded-lg hover:bg-red-50 font-semibold text-[13px] border border-red-200 transition-all disabled:opacity-60"
                          >
                            Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-[#8A9BAD] italic text-[13px] font-medium">Đã xử lý xong</span>
                      )}
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
