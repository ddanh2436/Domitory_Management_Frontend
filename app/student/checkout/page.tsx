"use client";

import { useEffect, useState } from "react";
import { useToast } from "../../components/ToastProvider";
import { useConfirm } from "../../components/ConfirmProvider";
import { apiClient } from "../../utils/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────
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
  room?: RoomInfo;
  contract?: { contractNumber?: string };
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

interface Profile {
  fullName: string;
  room?: RoomInfo;
}

const STATUS_LABEL: Record<Checkout["status"], string> = {
  PENDING: "Chờ xử lý",
  COMPLETED: "Đã hoàn tất",
  REJECTED: "Từ chối",
  CANCELLED: "Đã hủy",
};

const vnd = (n?: number) =>
  n != null ? `${n.toLocaleString("vi-VN")}đ` : "—";

export default function StudentCheckoutPage() {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [detail, setDetail] = useState<Checkout | null>(null);

  const loadData = async () => {
    try {
      const [profileRes, checkoutsRes] = await Promise.all([
        apiClient.get("/users/profile"),
        apiClient.get("/checkouts/me"),
      ]);

      if (profileRes.ok) setProfile(await profileRes.json());
      if (checkoutsRes.ok) {
        const data = await checkoutsRes.json();
        if (Array.isArray(data)) setCheckouts(data);
      }
    } catch (err) {
      console.error("Lỗi tải dữ liệu trả phòng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const hasPending = checkouts.some((c) => c.status === "PENDING");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expectedDate) {
      toast.error("Vui lòng chọn ngày dự kiến trả phòng.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.post("/checkouts", { reason, expectedDate });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Đã gửi yêu cầu trả phòng.", "Gửi yêu cầu thành công");
        setShowForm(false);
        setReason("");
        setExpectedDate("");
        void loadData();
      } else {
        toast.error(data.message || "Không gửi được yêu cầu trả phòng.");
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (checkoutId: string) => {
    const ok = await confirmDialog({
      title: "Hủy yêu cầu trả phòng?",
      message: "Yêu cầu đang chờ xử lý sẽ bị hủy. Bạn có thể tạo yêu cầu mới bất cứ lúc nào.",
      confirmLabel: "Hủy yêu cầu",
      variant: "danger",
    });
    if (!ok) return;
    try {
      const res = await apiClient.patch(`/checkouts/${checkoutId}/cancel`);
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Đã hủy yêu cầu.");
        void loadData();
      } else {
        toast.error(data.message || "Không hủy được yêu cầu.");
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ.");
    }
  };

  const roomLabel = (room?: RoomInfo) =>
    room ? `${room.name} · Tòa ${room.building} · Tầng ${room.floor}` : "—";

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="co-shell">
      <style>{`
        .co-shell { max-width: 1080px; margin: 0 auto; padding: 24px 24px 48px; font-family: 'DM Sans', sans-serif; }

        .co-hero { background: linear-gradient(135deg, #0D1B2A 0%, #182b43 60%, #253d5d 100%); color: #fff; border-radius: 16px; padding: 26px 28px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; border: 1px solid rgba(201,168,76,0.25); margin-bottom: 24px; }
        .co-hero-title { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 25px; font-weight: 700; letter-spacing: -.3px; }
        .co-hero-sub { margin-top: 6px; color: rgba(255,255,255,.65); font-size: 13.5px; max-width: 520px; line-height: 1.6; }
        .co-hero-btn { display: inline-flex; align-items: center; gap: 8px; background: var(--gold, #C9A84C); color: #0D1B2A; border: none; padding: 11px 20px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 13.5px; cursor: pointer; transition: all .18s; }
        .co-hero-btn:hover:not(:disabled) { background: #D9B85C; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(201,168,76,.35); }
        .co-hero-btn:disabled { opacity: .55; cursor: not-allowed; }

        .co-current { display: flex; align-items: center; gap: 14px; background: #fff; border: 1px solid rgba(13,27,42,.09); border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; }
        .co-current-icon { width: 40px; height: 40px; border-radius: 8px; background: rgba(201,168,76,.15); color: #9a7b2c; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .co-current-label { font-size: 12px; color: #8A9BAD; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
        .co-current-room { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 17px; font-weight: 600; color: #0D1B2A; margin-top: 2px; }

        .co-panel { background: #fff; border: 1px solid rgba(13,27,42,.09); border-radius: 12px; overflow: hidden; margin-bottom: 24px; }
        .co-panel-head { padding: 16px 20px; border-bottom: 1px solid rgba(13,27,42,.09); font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 16px; font-weight: 600; color: #0D1B2A; }
        .co-panel-body { padding: 20px; }

        .co-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .co-field-label { font-size: 12px; font-weight: 700; color: #0D1B2A; }
        .co-input, .co-textarea { width: 100%; border: 1px solid rgba(13,27,42,.15); border-radius: 8px; background: #fbfaf8; color: #0D1B2A; outline: none; font-size: 13.5px; font-family: 'DM Sans', sans-serif; transition: border-color .15s, background .15s; }
        .co-input { height: 42px; padding: 0 12px; }
        .co-textarea { padding: 11px 12px; resize: vertical; min-height: 90px; line-height: 1.6; }
        .co-input:focus, .co-textarea:focus { border-color: #c9a84c; background: #fff; }

        .co-form-actions { display: flex; gap: 10px; }
        .co-btn-cancel { flex: 1; padding: 11px; border: 1px solid rgba(13,27,42,.15); border-radius: 8px; background: transparent; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: #0D1B2A; transition: background .15s; }
        .co-btn-cancel:hover { background: #F5F3EF; }
        .co-btn-submit { flex: 2; padding: 11px; background: #0D1B2A; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600; transition: all .18s; }
        .co-btn-submit:hover:not(:disabled) { background: #1A2E42; }
        .co-btn-submit:disabled { opacity: .55; cursor: not-allowed; }

        .co-scroll { overflow-x: auto; }
        .co-table { width: 100%; border-collapse: collapse; text-align: left; min-width: 760px; }
        .co-table thead tr { background: #FAFAF9; border-bottom: 1px solid rgba(13,27,42,.09); }
        .co-table th { padding: 13px 18px; font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: #8A9BAD; }
        .co-table td { padding: 15px 18px; border-bottom: 1px solid rgba(13,27,42,.05); vertical-align: middle; font-size: 13.5px; color: #37485c; }
        .co-table tbody tr:last-child td { border-bottom: none; }
        .co-room-name { font-weight: 600; color: #0D1B2A; }
        .co-reason { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; vertical-align: middle; }

        .co-badge { display: inline-flex; align-items: center; padding: 5px 12px; border-radius: 100px; font-size: 12px; font-weight: 600; white-space: nowrap; }
        .co-badge--pending { background: rgba(245,158,11,.12); color: #d97706; }
        .co-badge--completed { background: rgba(34,197,94,.12); color: #16a34a; }
        .co-badge--rejected { background: rgba(239,68,68,.12); color: #dc2626; }
        .co-badge--cancelled { background: rgba(13,27,42,.07); color: #64748b; }

        .co-cancel-btn { font-size: 12.5px; font-weight: 600; color: #dc2626; padding: 7px 14px; border: 1px solid rgba(239,68,68,.25); border-radius: 8px; background: #fff; cursor: pointer; transition: all .15s; }
        .co-cancel-btn:hover { background: rgba(239,68,68,.06); border-color: rgba(239,68,68,.4); }
        .co-detail-btn { font-size: 12.5px; font-weight: 600; color: #0D1B2A; padding: 7px 14px; border: 1px solid rgba(13,27,42,.15); border-radius: 8px; background: #fff; cursor: pointer; transition: all .15s; }
        .co-detail-btn:hover { background: #F5F3EF; }

        .co-empty { padding: 48px 24px; text-align: center; color: #6b7f92; font-size: 13.5px; }
        .co-note { padding: 12px 16px; border-radius: 8px; background: rgba(245,158,11,.08); border: 1px solid rgba(245,158,11,.2); color: #92600a; font-size: 13px; margin-bottom: 24px; line-height: 1.6; }

        .co-overlay { position: fixed; inset: 0; background: rgba(13,27,42,.55); display: flex; align-items: center; justify-content: center; z-index: 60; padding: 20px; }
        .co-modal { background: #fff; border-radius: 14px; width: 100%; max-width: 520px; max-height: 85vh; overflow-y: auto; }
        .co-modal-head { padding: 18px 22px; border-bottom: 1px solid rgba(13,27,42,.09); font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 17px; font-weight: 700; color: #0D1B2A; display: flex; align-items: center; justify-content: space-between; }
        .co-modal-close { border: none; background: transparent; cursor: pointer; color: #8A9BAD; font-size: 20px; line-height: 1; }
        .co-modal-body { padding: 20px 22px; }
        .co-money-row { display: flex; justify-content: space-between; padding: 9px 0; font-size: 13.5px; color: #37485c; border-bottom: 1px dashed rgba(13,27,42,.08); }
        .co-money-row strong { color: #0D1B2A; }
        .co-money-row--total { border-bottom: none; padding-top: 12px; font-size: 15px; }
        .co-money-row--total strong { color: #16a34a; }
        .co-damage-list { margin: 10px 0 0; padding: 0; list-style: none; }
        .co-damage-item { display: flex; justify-content: space-between; gap: 12px; padding: 8px 12px; background: #FAFAF9; border: 1px solid rgba(13,27,42,.06); border-radius: 8px; margin-bottom: 6px; font-size: 13px; }
        .co-damage-note { color: #8A9BAD; font-size: 12px; margin-top: 2px; }
        .co-section-label { font-size: 12px; font-weight: 700; color: #8A9BAD; text-transform: uppercase; letter-spacing: .05em; margin-top: 16px; }
      `}</style>

      {/* Hero */}
      <div className="co-hero">
        <div>
          <div className="co-hero-title">Trả phòng</div>
          <div className="co-hero-sub">
            Gửi yêu cầu trả phòng khi kết thúc lưu trú. Ban quản lý sẽ kiểm tra tài sản trong phòng,
            tính phí bồi thường (nếu có hư hỏng) trừ vào tiền cọc và hoàn lại số tiền còn lại cho bạn.
          </div>
        </div>
        <button
          type="button"
          className="co-hero-btn"
          disabled={!profile?.room || hasPending}
          onClick={() => setShowForm((v) => !v)}
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Yêu cầu trả phòng
        </button>
      </div>

      {/* Trạng thái chặn */}
      {!loading && !profile?.room && (
        <div className="co-note">
          Bạn hiện không ở phòng nào nên không thể yêu cầu trả phòng.
        </div>
      )}
      {!loading && hasPending && (
        <div className="co-note">
          Bạn đang có một yêu cầu trả phòng chờ xử lý. Hủy yêu cầu đó nếu muốn tạo yêu cầu mới.
        </div>
      )}

      {/* Phòng hiện tại */}
      {profile?.room && (
        <div className="co-current">
          <div className="co-current-icon">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <div className="co-current-label">Phòng hiện tại</div>
            <div className="co-current-room">{roomLabel(profile.room)}</div>
          </div>
        </div>
      )}

      {/* Form yêu cầu */}
      {showForm && profile?.room && !hasPending && (
        <div className="co-panel">
          <div className="co-panel-head">Tạo yêu cầu trả phòng</div>
          <div className="co-panel-body">
            <form onSubmit={handleSubmit}>
              <div className="co-field">
                <label className="co-field-label" htmlFor="co-date">Ngày dự kiến rời phòng</label>
                <input
                  id="co-date"
                  type="date"
                  className="co-input"
                  min={todayStr}
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  required
                />
              </div>
              <div className="co-field">
                <label className="co-field-label" htmlFor="co-reason">Lý do trả phòng</label>
                <textarea
                  id="co-reason"
                  className="co-textarea"
                  placeholder="Ví dụ: tốt nghiệp, chuyển ra ngoài ở, kết thúc học kỳ..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>
              <div className="co-form-actions">
                <button type="button" className="co-btn-cancel" onClick={() => setShowForm(false)}>
                  Đóng
                </button>
                <button type="submit" className="co-btn-submit" disabled={submitting}>
                  {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lịch sử yêu cầu */}
      <div className="co-panel">
        <div className="co-panel-head">Lịch sử yêu cầu trả phòng</div>
        {loading ? (
          <div className="co-empty">Đang tải dữ liệu...</div>
        ) : checkouts.length === 0 ? (
          <div className="co-empty">Bạn chưa có yêu cầu trả phòng nào.</div>
        ) : (
          <div className="co-scroll">
            <table className="co-table">
              <thead>
                <tr>
                  <th>Phòng</th>
                  <th>Lý do</th>
                  <th>Ngày rời dự kiến</th>
                  <th>Ngày gửi</th>
                  <th>Trạng thái</th>
                  <th>Hoàn cọc</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {checkouts.map((c) => (
                  <tr key={c._id}>
                    <td className="co-room-name">{roomLabel(c.room)}</td>
                    <td><span className="co-reason" title={c.reason}>{c.reason}</span></td>
                    <td>{new Date(c.expectedDate).toLocaleDateString("vi-VN")}</td>
                    <td>{new Date(c.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td>
                      <span className={`co-badge co-badge--${c.status.toLowerCase()}`}>
                        {STATUS_LABEL[c.status]}
                      </span>
                    </td>
                    <td className="co-room-name">
                      {c.status === "COMPLETED" ? vnd(c.refundAmount) : "—"}
                    </td>
                    <td>
                      {c.status === "PENDING" ? (
                        <button type="button" className="co-cancel-btn" onClick={() => void handleCancel(c._id)}>
                          Hủy yêu cầu
                        </button>
                      ) : c.status === "COMPLETED" ? (
                        <button type="button" className="co-detail-btn" onClick={() => setDetail(c)}>
                          Chi tiết
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal chi tiết quyết toán */}
      {detail && (
        <div className="co-overlay" onClick={() => setDetail(null)}>
          <div className="co-modal" onClick={(e) => e.stopPropagation()}>
            <div className="co-modal-head">
              Quyết toán trả phòng
              <button type="button" className="co-modal-close" onClick={() => setDetail(null)}>×</button>
            </div>
            <div className="co-modal-body">
              <div className="co-money-row">
                <span>Phòng</span>
                <strong>{roomLabel(detail.room)}</strong>
              </div>
              <div className="co-money-row">
                <span>Ngày hoàn tất</span>
                <strong>{detail.processedAt ? new Date(detail.processedAt).toLocaleDateString("vi-VN") : "—"}</strong>
              </div>
              <div className="co-money-row">
                <span>Tiền cọc</span>
                <strong>{vnd(detail.depositAmount)}</strong>
              </div>
              <div className="co-money-row">
                <span>Phí bồi thường hư hỏng</span>
                <strong style={{ color: (detail.compensationAmount ?? 0) > 0 ? "#dc2626" : undefined }}>
                  −{vnd(detail.compensationAmount ?? 0)}
                </strong>
              </div>
              <div className="co-money-row co-money-row--total">
                <span>Tiền cọc hoàn lại</span>
                <strong>{vnd(detail.refundAmount)}</strong>
              </div>

              {(detail.damages?.length ?? 0) > 0 && (
                <>
                  <div className="co-section-label">Hạng mục hư hỏng ghi nhận</div>
                  <ul className="co-damage-list">
                    {detail.damages!.map((d, i) => (
                      <li key={i} className="co-damage-item">
                        <div>
                          <div>{d.itemName}</div>
                          {d.note && <div className="co-damage-note">{d.note}</div>}
                        </div>
                        <strong>{vnd(d.fee)}</strong>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {detail.adminNote && (
                <>
                  <div className="co-section-label">Ghi chú của Ban quản lý</div>
                  <p style={{ fontSize: 13.5, color: "#37485c", lineHeight: 1.6, marginTop: 6 }}>{detail.adminNote}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
