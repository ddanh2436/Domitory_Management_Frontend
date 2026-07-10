"use client";

import { useEffect, useState } from "react";
import { useToast } from "../../components/ToastProvider";
import { useConfirm } from "../../components/ConfirmProvider";
import { apiClient } from "../../utils/apiClient";

interface RoomInfo {
  _id: string;
  name: string;
  building: string;
  floor: number;
  price: number;
}

interface Transfer {
  _id: string;
  user?: { fullName?: string; mssv?: string; email?: string };
  fromRoom?: RoomInfo;
  toRoom?: RoomInfo;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  createdAt: string;
  processedAt?: string;
}

const STATUS_LABEL: Record<Transfer["status"], string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  CANCELLED: "Đã hủy",
};

export default function AdminTransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const toast = useToast();
  const confirmDialog = useConfirm();

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/transfers");
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) setTransfers(data);
      }
    } catch (error) {
      console.error("Lỗi tải yêu cầu đổi phòng:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTransfers();
  }, []);

  const handleAction = async (transferId: string, action: "approve" | "reject") => {
    const isApprove = action === "approve";
    const ok = await confirmDialog({
      title: isApprove ? "Duyệt yêu cầu đổi phòng?" : "Từ chối yêu cầu đổi phòng?",
      message: isApprove
        ? "Sinh viên sẽ được chuyển sang phòng mới ngay lập tức và hợp đồng được cập nhật theo giá phòng mới."
        : "Yêu cầu đổi phòng này sẽ bị từ chối và sinh viên sẽ nhận được thông báo.",
      confirmLabel: isApprove ? "Duyệt yêu cầu" : "Từ chối",
      variant: isApprove ? "primary" : "danger",
    });
    if (!ok) return;

    setProcessingId(transferId);
    try {
      const response = await apiClient.patch(`/transfers/${transferId}/${action}`);
      const data = await response.json();
      if (response.ok) {
        if (action === "approve") {
          toast.success("Sinh viên đã được chuyển sang phòng mới, hợp đồng đã cập nhật theo.", "Đã duyệt đổi phòng 🎉");
        } else {
          toast.success("Đã từ chối yêu cầu đổi phòng này.", "Đã từ chối");
        }
        void fetchTransfers();
      } else {
        toast.error(data.message || "Không xử lý được yêu cầu, vui lòng thử lại.");
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setProcessingId(null);
    }
  };

  const roomLabel = (room?: RoomInfo) =>
    room ? (
      <>
        <div className="font-bold text-[#2563eb] text-[14.5px]">{room.name}</div>
        <div className="text-[#8A9BAD] text-[12.5px] mt-1">Tòa {room.building} · Tầng {room.floor}</div>
      </>
    ) : (
      <span className="text-[#8A9BAD] italic text-[13px]">—</span>
    );

  return (
    <div className="adm-page px-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700&family=DM+Sans:wght@400;500;700&display=swap');

        .adm-page {
          max-width: 1180px;
          margin: 0 auto;
          padding-top: 24px;
          padding-bottom: 48px;
          color: #0D1B2A;
          font-family: 'DM Sans', sans-serif;
        }

        .panel {
          background: #fff;
          border: 1px solid rgba(13,27,42,0.09);
          border-radius: 20px;
          padding: 28px 32px;
          box-shadow: 0 10px 24px rgba(13,27,42,0.04);
          overflow: hidden;
        }

        .panel-title {
          font-family: 'Fraunces', serif;
          font-size: 24px;
          font-weight: 700;
          color: #0D1B2A;
          margin-bottom: 24px;
          letter-spacing: -0.5px;
        }

        .adm-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          text-align: left;
        }

        .adm-table th {
          padding: 16px 20px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #8A9BAD;
          border-bottom: 1px solid rgba(13,27,42,0.08);
          background: #f8fafc;
        }

        .adm-table th:first-child {
          border-top-left-radius: 12px;
          border-bottom-left-radius: 12px;
          padding-left: 24px;
        }

        .adm-table th:last-child {
          border-top-right-radius: 12px;
          border-bottom-right-radius: 12px;
          text-align: center;
        }

        .adm-table td {
          padding: 20px;
          border-bottom: 1px solid rgba(13,27,42,0.04);
          vertical-align: middle;
        }

        .adm-table td:first-child {
          padding-left: 24px;
        }

        .adm-table tr:last-child td {
          border-bottom: none;
        }

        .adm-table tr:hover td {
          background: #fcfcfb;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .badge--pending { background: rgba(245,158,11,0.12); color: #d97706; }
        .badge--approved { background: rgba(34,197,94,0.12); color: #16a34a; }
        .badge--rejected { background: rgba(239,68,68,0.12); color: #dc2626; }
        .badge--cancelled { background: rgba(13,27,42,0.07); color: #64748b; }

        .reason-cell { max-width: 200px; font-size: 13px; color: #475569; line-height: 1.5; }
      `}</style>

      <div className="panel">
        <h2 className="panel-title">Yêu cầu đổi phòng</h2>

        <div className="overflow-x-auto">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Sinh viên</th>
                <th>Từ phòng</th>
                <th>Đến phòng</th>
                <th>Lý do</th>
                <th>Ngày gửi</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-[#8A9BAD] font-medium text-sm">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-[#8A9BAD] font-medium text-sm">
                    Chưa có yêu cầu đổi phòng nào.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t._id} style={{ transition: "background-color 0.2s" }}>
                    <td>
                      <div className="font-bold text-[#0D1B2A] text-[15px]">{t.user?.fullName || "—"}</div>
                      <div className="text-[#8A9BAD] text-[13px] mt-1">MSSV: {t.user?.mssv || "—"}</div>
                    </td>
                    <td>{roomLabel(t.fromRoom)}</td>
                    <td>{roomLabel(t.toRoom)}</td>
                    <td>
                      <div className="reason-cell" title={t.reason}>{t.reason}</div>
                    </td>
                    <td className="text-[#334155] font-medium text-[14px]">
                      {new Date(t.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td>
                      <span className={`badge badge--${t.status.toLowerCase()}`}>
                        {STATUS_LABEL[t.status]}
                      </span>
                    </td>
                    <td className="text-center">
                      {t.status === "PENDING" ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleAction(t._id, "approve")}
                            disabled={processingId === t._id}
                            className="px-4 py-2 bg-[#0D1B2A] text-white rounded-lg hover:bg-[#1A2E42] font-semibold text-[13px] transition-all shadow-sm disabled:opacity-60"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => handleAction(t._id, "reject")}
                            disabled={processingId === t._id}
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
