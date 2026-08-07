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

interface DamageItem {
  itemName: string;
  fee: number;
  note?: string;
}

interface Checkout {
  _id: string;
  user?: { fullName?: string; mssv?: string; email?: string; phone?: string };
  room?: RoomInfo;
  contract?: { contractNumber?: string; rentalFee?: number };
  reason: string;
  expectedDate: string;
  status: "PENDING" | "COMPLETED" | "REJECTED" | "CANCELLED";
  damages?: DamageItem[];
  depositAmount: number;
  compensationAmount?: number;
  refundAmount?: number;
  adminNote?: string;
  createdAt: string;
  processedAt?: string;
}

// Dòng nhập liệu hạng mục hư hỏng trong modal (fee giữ dạng chuỗi để gõ tự do)
interface DamageRow {
  itemName: string;
  fee: string;
  note: string;
}

const STATUS_LABEL: Record<Checkout["status"], string> = {
  PENDING: "Chờ xử lý",
  COMPLETED: "Đã hoàn tất",
  REJECTED: "Từ chối",
  CANCELLED: "Đã hủy",
};

const vnd = (n?: number) => (n != null ? `${n.toLocaleString("vi-VN")}đ` : "—");

export default function AdminCheckoutsPage() {
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const toast = useToast();
  const confirmDialog = useConfirm();

  // Modal kiểm tra tài sản & hoàn tất
  const [inspecting, setInspecting] = useState<Checkout | null>(null);
  const [damageRows, setDamageRows] = useState<DamageRow[]>([]);
  const [depositInput, setDepositInput] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Modal xem chi tiết yêu cầu đã hoàn tất
  const [detail, setDetail] = useState<Checkout | null>(null);

  const fetchCheckouts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/checkouts");
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) setCheckouts(data);
      }
    } catch (error) {
      console.error("Lỗi tải yêu cầu trả phòng:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCheckouts();
  }, []);

  const openInspect = (c: Checkout) => {
    setInspecting(c);
    setDamageRows([]);
    setDepositInput(String(c.depositAmount ?? 0));
    setAdminNote("");
  };

  const closeInspect = () => {
    if (submitting) return;
    setInspecting(null);
  };

  const addDamageRow = () =>
    setDamageRows((rows) => [...rows, { itemName: "", fee: "", note: "" }]);

  const updateDamageRow = (index: number, patch: Partial<DamageRow>) =>
    setDamageRows((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const removeDamageRow = (index: number) =>
    setDamageRows((rows) => rows.filter((_, i) => i !== index));

  const depositAmount = Math.max(0, Math.floor(Number(depositInput) || 0));
  const compensationAmount = damageRows.reduce(
    (sum, r) => sum + Math.max(0, Math.floor(Number(r.fee) || 0)),
    0,
  );
  const refundAmount = Math.max(0, depositAmount - compensationAmount);

  const handleComplete = async () => {
    if (!inspecting) return;

    for (const row of damageRows) {
      if (!row.itemName.trim()) {
        toast.error("Vui lòng nhập tên tài sản cho tất cả hạng mục hư hỏng.");
        return;
      }
      if (row.fee === "" || Number.isNaN(Number(row.fee)) || Number(row.fee) < 0) {
        toast.error(`Phí bồi thường của "${row.itemName.trim()}" không hợp lệ.`);
        return;
      }
    }

    const ok = await confirmDialog({
      title: "Hoàn tất trả phòng?",
      message: `Hợp đồng sẽ bị thanh lý, sinh viên rời khỏi phòng và phòng được trả lại 1 chỗ trống. Tiền cọc hoàn lại: ${vnd(refundAmount)}.`,
      confirmLabel: "Hoàn tất trả phòng",
      variant: "primary",
    });
    if (!ok) return;

    setSubmitting(true);
    try {
      const response = await apiClient.patch(`/checkouts/${inspecting._id}/complete`, {
        damages: damageRows.map((r) => ({
          itemName: r.itemName.trim(),
          fee: Math.max(0, Math.floor(Number(r.fee) || 0)),
          ...(r.note.trim() ? { note: r.note.trim() } : {}),
        })),
        depositAmount,
        ...(adminNote.trim() ? { adminNote: adminNote.trim() } : {}),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(
          `Hoàn cọc ${vnd(data.refundAmount)} cho sinh viên. Hợp đồng đã được thanh lý.`,
          "Trả phòng hoàn tất ✅",
        );
        setInspecting(null);
        void fetchCheckouts();
      } else {
        toast.error(data.message || "Không hoàn tất được yêu cầu, vui lòng thử lại.");
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (c: Checkout) => {
    const ok = await confirmDialog({
      title: "Từ chối yêu cầu trả phòng?",
      message: "Yêu cầu trả phòng này sẽ bị từ chối và sinh viên sẽ nhận được thông báo.",
      confirmLabel: "Từ chối",
      variant: "danger",
    });
    if (!ok) return;

    setProcessingId(c._id);
    try {
      const response = await apiClient.patch(`/checkouts/${c._id}/reject`);
      const data = await response.json();
      if (response.ok) {
        toast.success("Đã từ chối yêu cầu trả phòng này.", "Đã từ chối");
        void fetchCheckouts();
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
          font-family: 'FrauncesAmp', 'Fraunces', serif;
          font-size: 24px;
          font-weight: 700;
          color: #0D1B2A;
          margin-bottom: 24px;
          letter-spacing: -0.5px;
        }

        .adm-table { width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; }
        .adm-table th {
          padding: 16px 20px; font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; color: #8A9BAD; border-bottom: 1px solid rgba(13,27,42,0.08); background: #f8fafc;
        }
        .adm-table th:first-child { border-top-left-radius: 12px; border-bottom-left-radius: 12px; padding-left: 24px; }
        .adm-table th:last-child { border-top-right-radius: 12px; border-bottom-right-radius: 12px; text-align: center; }
        .adm-table td { padding: 20px; border-bottom: 1px solid rgba(13,27,42,0.04); vertical-align: middle; }
        .adm-table td:first-child { padding-left: 24px; }
        .adm-table tr:last-child td { border-bottom: none; }
        .adm-table tr:hover td { background: #fcfcfb; }

        .badge {
          display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 999px;
          font-size: 11px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase;
        }
        .badge--pending { background: rgba(245,158,11,0.12); color: #d97706; }
        .badge--completed { background: rgba(34,197,94,0.12); color: #16a34a; }
        .badge--rejected { background: rgba(239,68,68,0.12); color: #dc2626; }
        .badge--cancelled { background: rgba(13,27,42,0.07); color: #64748b; }

        .reason-cell { max-width: 180px; font-size: 13px; color: #475569; line-height: 1.5; }

        .ck-overlay { position: fixed; inset: 0; background: rgba(13,27,42,.55); display: flex; align-items: center; justify-content: center; z-index: 60; padding: 20px; }
        .ck-modal { background: #fff; border-radius: 16px; width: 100%; max-width: 640px; max-height: 88vh; overflow-y: auto; }
        .ck-modal-head { padding: 20px 24px; border-bottom: 1px solid rgba(13,27,42,.09); display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; background: #fff; z-index: 1; }
        .ck-modal-title { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 19px; font-weight: 700; color: #0D1B2A; }
        .ck-modal-sub { font-size: 12.5px; color: #8A9BAD; margin-top: 3px; }
        .ck-modal-close { border: none; background: transparent; cursor: pointer; color: #8A9BAD; font-size: 22px; line-height: 1; }
        .ck-modal-body { padding: 20px 24px 24px; }

        .ck-section-label { font-size: 12px; font-weight: 700; color: #8A9BAD; text-transform: uppercase; letter-spacing: .05em; margin: 18px 0 10px; }
        .ck-section-label:first-child { margin-top: 0; }

        .ck-damage-row { display: grid; grid-template-columns: 1.4fr 1fr 1.2fr auto; gap: 8px; margin-bottom: 8px; align-items: center; }
        .ck-input {
          width: 100%; height: 40px; padding: 0 12px; border: 1px solid rgba(13,27,42,.15); border-radius: 8px;
          background: #fbfaf8; color: #0D1B2A; outline: none; font-size: 13px; font-family: 'DM Sans', sans-serif;
          transition: border-color .15s, background .15s;
        }
        .ck-input:focus { border-color: #c9a84c; background: #fff; }
        .ck-textarea {
          width: 100%; padding: 10px 12px; border: 1px solid rgba(13,27,42,.15); border-radius: 8px;
          background: #fbfaf8; color: #0D1B2A; outline: none; font-size: 13px; font-family: 'DM Sans', sans-serif;
          resize: vertical; min-height: 70px; line-height: 1.6;
        }
        .ck-textarea:focus { border-color: #c9a84c; background: #fff; }
        .ck-remove-btn { border: 1px solid rgba(239,68,68,.25); background: #fff; color: #dc2626; width: 34px; height: 34px; border-radius: 8px; cursor: pointer; font-size: 16px; line-height: 1; transition: all .15s; }
        .ck-remove-btn:hover { background: rgba(239,68,68,.06); }
        .ck-add-btn { display: inline-flex; align-items: center; gap: 6px; border: 1px dashed rgba(13,27,42,.25); background: transparent; color: #37485c; padding: 9px 14px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif; transition: all .15s; }
        .ck-add-btn:hover { border-color: #c9a84c; color: #9a7b2c; background: rgba(201,168,76,.05); }
        .ck-no-damage { font-size: 13px; color: #6b7f92; padding: 12px 14px; background: #FAFAF9; border: 1px solid rgba(13,27,42,.06); border-radius: 8px; margin-bottom: 10px; }

        .ck-money { background: #FAFAF9; border: 1px solid rgba(13,27,42,.07); border-radius: 12px; padding: 14px 18px; margin-top: 18px; }
        .ck-money-row { display: flex; justify-content: space-between; padding: 7px 0; font-size: 13.5px; color: #37485c; }
        .ck-money-row strong { color: #0D1B2A; }
        .ck-money-row--total { border-top: 1px dashed rgba(13,27,42,.15); margin-top: 6px; padding-top: 12px; font-size: 15px; }
        .ck-money-row--total strong { color: #16a34a; }

        .ck-actions { display: flex; gap: 10px; margin-top: 20px; }
        .ck-btn-secondary { flex: 1; padding: 12px; border: 1px solid rgba(13,27,42,.15); border-radius: 8px; background: transparent; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: #0D1B2A; transition: background .15s; }
        .ck-btn-secondary:hover { background: #F5F3EF; }
        .ck-btn-primary { flex: 2; padding: 12px; background: #0D1B2A; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600; transition: all .18s; }
        .ck-btn-primary:hover:not(:disabled) { background: #1A2E42; }
        .ck-btn-primary:disabled { opacity: .55; cursor: not-allowed; }

        .ck-damage-view { display: flex; justify-content: space-between; gap: 12px; padding: 8px 12px; background: #FAFAF9; border: 1px solid rgba(13,27,42,.06); border-radius: 8px; margin-bottom: 6px; font-size: 13px; }
        .ck-damage-view-note { color: #8A9BAD; font-size: 12px; margin-top: 2px; }
      `}</style>

      <div className="panel">
        <h2 className="panel-title">Yêu cầu trả phòng</h2>

        <div className="overflow-x-auto">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Sinh viên</th>
                <th>Phòng</th>
                <th>Lý do</th>
                <th>Ngày rời dự kiến</th>
                <th>Trạng thái</th>
                <th>Hoàn cọc</th>
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
              ) : checkouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-[#8A9BAD] font-medium text-sm">
                    Chưa có yêu cầu trả phòng nào.
                  </td>
                </tr>
              ) : (
                checkouts.map((c) => (
                  <tr key={c._id} style={{ transition: "background-color 0.2s" }}>
                    <td>
                      <div className="font-bold text-[#0D1B2A] text-[15px]">{c.user?.fullName || "—"}</div>
                      <div className="text-[#8A9BAD] text-[13px] mt-1">MSSV: {c.user?.mssv || "—"}</div>
                    </td>
                    <td>{roomLabel(c.room)}</td>
                    <td>
                      <div className="reason-cell" title={c.reason}>{c.reason}</div>
                    </td>
                    <td className="text-[#334155] font-medium text-[14px]">
                      {new Date(c.expectedDate).toLocaleDateString("vi-VN")}
                    </td>
                    <td>
                      <span className={`badge badge--${c.status.toLowerCase()}`}>
                        {STATUS_LABEL[c.status]}
                      </span>
                    </td>
                    <td className="text-[#0D1B2A] font-bold text-[14px]">
                      {c.status === "COMPLETED" ? vnd(c.refundAmount) : "—"}
                    </td>
                    <td className="text-center">
                      {c.status === "PENDING" ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openInspect(c)}
                            disabled={processingId === c._id}
                            className="px-4 py-2 bg-[#0D1B2A] text-white rounded-lg hover:bg-[#1A2E42] font-semibold text-[13px] transition-all shadow-sm disabled:opacity-60"
                          >
                            Kiểm tra & hoàn tất
                          </button>
                          <button
                            onClick={() => void handleReject(c)}
                            disabled={processingId === c._id}
                            className="px-4 py-2 bg-white text-[#dc2626] rounded-lg hover:bg-red-50 font-semibold text-[13px] border border-red-200 transition-all disabled:opacity-60"
                          >
                            Từ chối
                          </button>
                        </div>
                      ) : c.status === "COMPLETED" ? (
                        <button
                          onClick={() => setDetail(c)}
                          className="px-4 py-2 bg-white text-[#0D1B2A] rounded-lg hover:bg-[#F5F3EF] font-semibold text-[13px] border border-[rgba(13,27,42,0.15)] transition-all"
                        >
                          Chi tiết
                        </button>
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

      {/* Modal kiểm tra tài sản & hoàn tất (FR19 + FR20 + FR21) */}
      {inspecting && (
        <div className="ck-overlay" onClick={closeInspect}>
          <div className="ck-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ck-modal-head">
              <div>
                <div className="ck-modal-title">Kiểm tra tài sản &amp; hoàn tất trả phòng</div>
                <div className="ck-modal-sub">
                  {inspecting.user?.fullName || "—"} · Phòng {inspecting.room?.name || "—"} · HĐ {inspecting.contract?.contractNumber || "—"}
                </div>
              </div>
              <button type="button" className="ck-modal-close" onClick={closeInspect}>×</button>
            </div>
            <div className="ck-modal-body">
              <div className="ck-section-label">Hạng mục hư hỏng (nếu có)</div>
              {damageRows.length === 0 && (
                <div className="ck-no-damage">
                  Chưa ghi nhận hư hỏng nào — nếu tài sản nguyên vẹn, bấm hoàn tất để hoàn toàn bộ tiền cọc.
                </div>
              )}
              {damageRows.map((row, i) => (
                <div key={i} className="ck-damage-row">
                  <input
                    className="ck-input"
                    placeholder="Tài sản (VD: Bàn học)"
                    value={row.itemName}
                    onChange={(e) => updateDamageRow(i, { itemName: e.target.value })}
                  />
                  <input
                    className="ck-input"
                    type="number"
                    min={0}
                    step={1000}
                    placeholder="Phí (VNĐ)"
                    value={row.fee}
                    onChange={(e) => updateDamageRow(i, { fee: e.target.value })}
                  />
                  <input
                    className="ck-input"
                    placeholder="Ghi chú (VD: gãy chân)"
                    value={row.note}
                    onChange={(e) => updateDamageRow(i, { note: e.target.value })}
                  />
                  <button type="button" className="ck-remove-btn" onClick={() => removeDamageRow(i)} title="Xóa hạng mục">
                    ×
                  </button>
                </div>
              ))}
              <button type="button" className="ck-add-btn" onClick={addDamageRow}>
                + Thêm hạng mục hư hỏng
              </button>

              <div className="ck-section-label">Tiền cọc thực tế (VNĐ)</div>
              <input
                className="ck-input"
                type="number"
                min={0}
                step={1000}
                value={depositInput}
                onChange={(e) => setDepositInput(e.target.value)}
              />

              <div className="ck-section-label">Ghi chú (tùy chọn)</div>
              <textarea
                className="ck-textarea"
                placeholder="Ghi chú thêm cho biên bản trả phòng..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />

              <div className="ck-money">
                <div className="ck-money-row">
                  <span>Tiền cọc</span>
                  <strong>{vnd(depositAmount)}</strong>
                </div>
                <div className="ck-money-row">
                  <span>Phí bồi thường ({damageRows.length} hạng mục)</span>
                  <strong style={{ color: compensationAmount > 0 ? "#dc2626" : undefined }}>
                    −{vnd(compensationAmount)}
                  </strong>
                </div>
                <div className="ck-money-row ck-money-row--total">
                  <span>Tiền cọc hoàn lại cho sinh viên</span>
                  <strong>{vnd(refundAmount)}</strong>
                </div>
              </div>

              <div className="ck-actions">
                <button type="button" className="ck-btn-secondary" onClick={closeInspect}>
                  Đóng
                </button>
                <button type="button" className="ck-btn-primary" disabled={submitting} onClick={() => void handleComplete()}>
                  {submitting ? "Đang xử lý..." : "Hoàn tất trả phòng & hoàn cọc"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal chi tiết yêu cầu đã hoàn tất */}
      {detail && (
        <div className="ck-overlay" onClick={() => setDetail(null)}>
          <div className="ck-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="ck-modal-head">
              <div>
                <div className="ck-modal-title">Biên bản trả phòng</div>
                <div className="ck-modal-sub">
                  {detail.user?.fullName || "—"} · Phòng {detail.room?.name || "—"} · Hoàn tất{" "}
                  {detail.processedAt ? new Date(detail.processedAt).toLocaleDateString("vi-VN") : "—"}
                </div>
              </div>
              <button type="button" className="ck-modal-close" onClick={() => setDetail(null)}>×</button>
            </div>
            <div className="ck-modal-body">
              {(detail.damages?.length ?? 0) > 0 ? (
                <>
                  <div className="ck-section-label">Hạng mục hư hỏng ghi nhận</div>
                  {detail.damages!.map((d, i) => (
                    <div key={i} className="ck-damage-view">
                      <div>
                        <div>{d.itemName}</div>
                        {d.note && <div className="ck-damage-view-note">{d.note}</div>}
                      </div>
                      <strong>{vnd(d.fee)}</strong>
                    </div>
                  ))}
                </>
              ) : (
                <div className="ck-no-damage">Không ghi nhận hư hỏng tài sản.</div>
              )}

              <div className="ck-money">
                <div className="ck-money-row">
                  <span>Tiền cọc</span>
                  <strong>{vnd(detail.depositAmount)}</strong>
                </div>
                <div className="ck-money-row">
                  <span>Phí bồi thường</span>
                  <strong style={{ color: (detail.compensationAmount ?? 0) > 0 ? "#dc2626" : undefined }}>
                    −{vnd(detail.compensationAmount ?? 0)}
                  </strong>
                </div>
                <div className="ck-money-row ck-money-row--total">
                  <span>Đã hoàn lại</span>
                  <strong>{vnd(detail.refundAmount)}</strong>
                </div>
              </div>

              {detail.adminNote && (
                <>
                  <div className="ck-section-label">Ghi chú</div>
                  <p style={{ fontSize: 13.5, color: "#37485c", lineHeight: 1.6 }}>{detail.adminNote}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
