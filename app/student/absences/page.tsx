"use client";

import { useEffect, useState } from "react";
import { useToast } from "../../components/ToastProvider";
import { useConfirm } from "../../components/ConfirmProvider";
import { apiClient } from "../../utils/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────
type AbsenceType = "TAM_TRU" | "TAM_VANG";
type AbsenceStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

interface Absence {
  _id: string;
  type: AbsenceType;
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
  TAM_TRU: "Tạm trú (khách qua đêm)",
  TAM_VANG: "Tạm vắng qua đêm",
};

const STATUS_LABEL: Record<AbsenceStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  CANCELLED: "Đã hủy",
};

function toDateInputValue(date: Date) {
  const tz = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tz).toISOString().slice(0, 10);
}

export default function StudentAbsencesPage() {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const today = toDateInputValue(new Date());
  const [form, setForm] = useState({
    type: "TAM_VANG" as AbsenceType,
    startDate: today,
    endDate: today,
    reason: "",
    guestName: "",
    guestIdNumber: "",
  });

  const loadData = async () => {
    try {
      const res = await apiClient.get("/absences/me");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setAbsences(data);
      }
    } catch (err) {
      console.error("Lỗi tải đơn tạm trú/tạm vắng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const hasPending = absences.some((a) => a.status === "PENDING");
  const isGuestType = form.type === "TAM_TRU";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiClient.post("/absences", {
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
        ...(isGuestType ? { guestName: form.guestName, guestIdNumber: form.guestIdNumber } : {}),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Đã gửi đơn đăng ký.", "Gửi đơn thành công");
        setShowForm(false);
        setForm({ type: "TAM_VANG", startDate: today, endDate: today, reason: "", guestName: "", guestIdNumber: "" });
        void loadData();
      } else {
        toast.error(data.message || "Không gửi được đơn đăng ký.");
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (absenceId: string) => {
    const ok = await confirmDialog({
      title: "Hủy đơn đăng ký?",
      message: "Đơn đang chờ duyệt sẽ bị hủy. Bạn có thể tạo đơn mới bất cứ lúc nào.",
      confirmLabel: "Hủy đơn",
      variant: "danger",
    });
    if (!ok) return;
    try {
      const res = await apiClient.patch(`/absences/${absenceId}/cancel`);
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Đã hủy đơn.");
        void loadData();
      } else {
        toast.error(data.message || "Không hủy được đơn.");
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ.");
    }
  };

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("vi-VN");

  return (
    <div className="ab-shell">
      <style>{`
        .ab-shell { max-width: 1080px; margin: 0 auto; padding: 24px 24px 48px; font-family: 'DM Sans', sans-serif; }

        .ab-hero { background: linear-gradient(135deg, #0D1B2A 0%, #182b43 60%, #253d5d 100%); color: #fff; border-radius: 16px; padding: 26px 28px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; border: 1px solid rgba(201,168,76,0.25); margin-bottom: 24px; }
        .ab-hero-title { font-family: 'Fraunces', serif; font-size: 25px; font-weight: 700; letter-spacing: -.3px; }
        .ab-hero-sub { margin-top: 6px; color: rgba(255,255,255,.65); font-size: 13.5px; max-width: 500px; line-height: 1.6; }
        .ab-hero-btn { display: inline-flex; align-items: center; gap: 8px; background: #C9A84C; color: #0D1B2A; border: none; padding: 11px 20px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 13.5px; cursor: pointer; transition: all .18s; }
        .ab-hero-btn:hover:not(:disabled) { background: #D9B85C; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(201,168,76,.35); }
        .ab-hero-btn:disabled { opacity: .55; cursor: not-allowed; }

        .ab-note { padding: 12px 16px; border-radius: 8px; background: rgba(245,158,11,.08); border: 1px solid rgba(245,158,11,.2); color: #92600a; font-size: 13px; margin-bottom: 24px; line-height: 1.6; }

        .ab-panel { background: #fff; border: 1px solid rgba(13,27,42,.09); border-radius: 12px; overflow: hidden; margin-bottom: 24px; }
        .ab-panel-head { padding: 16px 20px; border-bottom: 1px solid rgba(13,27,42,.09); font-family: 'Fraunces', serif; font-size: 16px; font-weight: 600; color: #0D1B2A; }
        .ab-panel-body { padding: 20px; }

        .ab-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
        .ab-type-opt { display: flex; flex-direction: column; gap: 4px; padding: 13px 14px; border-radius: 8px; border: 1.5px solid rgba(13,27,42,.12); background: #fff; cursor: pointer; transition: all .15s; text-align: left; font-family: 'DM Sans', sans-serif; }
        .ab-type-opt:hover { border-color: rgba(13,27,42,.25); }
        .ab-type-opt--active { border-color: #C9A84C; background: rgba(201,168,76,.08); }
        .ab-type-name { font-size: 13.5px; font-weight: 700; color: #0D1B2A; }
        .ab-type-desc { font-size: 11.5px; color: #8A9BAD; line-height: 1.5; }

        .ab-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .ab-field-label { font-size: 12px; font-weight: 700; color: #0D1B2A; }
        .ab-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .ab-input, .ab-textarea { width: 100%; border: 1px solid rgba(13,27,42,.15); border-radius: 8px; background: #fbfaf8; color: #0D1B2A; outline: none; font-size: 13.5px; font-family: 'DM Sans', sans-serif; transition: border-color .15s, background .15s; }
        .ab-input { height: 42px; padding: 0 12px; }
        .ab-textarea { padding: 11px 12px; resize: vertical; min-height: 84px; line-height: 1.6; }
        .ab-input:focus, .ab-textarea:focus { border-color: #c9a84c; background: #fff; }

        .ab-form-actions { display: flex; gap: 10px; }
        .ab-btn-cancel { flex: 1; padding: 11px; border: 1px solid rgba(13,27,42,.15); border-radius: 8px; background: transparent; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: #0D1B2A; transition: background .15s; }
        .ab-btn-cancel:hover { background: #F5F3EF; }
        .ab-btn-submit { flex: 2; padding: 11px; background: #0D1B2A; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600; transition: all .18s; }
        .ab-btn-submit:hover:not(:disabled) { background: #1A2E42; }
        .ab-btn-submit:disabled { opacity: .55; cursor: not-allowed; }

        .ab-scroll { overflow-x: auto; }
        .ab-table { width: 100%; border-collapse: collapse; text-align: left; min-width: 780px; }
        .ab-table thead tr { background: #FAFAF9; border-bottom: 1px solid rgba(13,27,42,.09); }
        .ab-table th { padding: 13px 18px; font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: #8A9BAD; }
        .ab-table td { padding: 15px 18px; border-bottom: 1px solid rgba(13,27,42,.05); vertical-align: middle; font-size: 13.5px; color: #37485c; }
        .ab-table tbody tr:last-child td { border-bottom: none; }
        .ab-type-cell { font-weight: 700; color: #0D1B2A; }
        .ab-guest { font-size: 12px; color: #8A9BAD; margin-top: 3px; }
        .ab-reason { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; vertical-align: middle; }

        .ab-badge { display: inline-flex; align-items: center; padding: 5px 12px; border-radius: 100px; font-size: 12px; font-weight: 600; white-space: nowrap; }
        .ab-badge--pending { background: rgba(245,158,11,.12); color: #d97706; }
        .ab-badge--approved { background: rgba(34,197,94,.12); color: #16a34a; }
        .ab-badge--rejected { background: rgba(239,68,68,.12); color: #dc2626; }
        .ab-badge--cancelled { background: rgba(13,27,42,.07); color: #64748b; }

        .ab-cancel-btn { font-size: 12.5px; font-weight: 600; color: #dc2626; padding: 7px 14px; border: 1px solid rgba(239,68,68,.25); border-radius: 8px; background: #fff; cursor: pointer; transition: all .15s; }
        .ab-cancel-btn:hover { background: rgba(239,68,68,.06); border-color: rgba(239,68,68,.4); }

        .ab-empty { padding: 48px 24px; text-align: center; color: #6b7f92; font-size: 13.5px; }

        @media (max-width: 640px) { .ab-type-grid, .ab-row2 { grid-template-columns: 1fr; } }
      `}</style>

      {/* Hero */}
      <div className="ab-hero">
        <div>
          <div className="ab-hero-title">Tạm trú / Tạm vắng</div>
          <div className="ab-hero-sub">
            Đăng ký khách ở lại qua đêm (tạm trú) hoặc báo vắng mặt qua đêm (tạm vắng) để Ban quản lý nắm được tình hình lưu trú.
          </div>
        </div>
        <button
          type="button"
          className="ab-hero-btn"
          disabled={hasPending}
          onClick={() => setShowForm((v) => !v)}
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo đơn đăng ký
        </button>
      </div>

      {!loading && hasPending && (
        <div className="ab-note">
          Bạn đang có một đơn chờ duyệt. Hủy đơn đó nếu muốn tạo đơn mới.
        </div>
      )}

      {/* Form */}
      {showForm && !hasPending && (
        <div className="ab-panel">
          <div className="ab-panel-head">Tạo đơn đăng ký</div>
          <div className="ab-panel-body">
            <form onSubmit={handleSubmit}>
              <div className="ab-type-grid">
                <button
                  type="button"
                  className={`ab-type-opt ${form.type === "TAM_VANG" ? "ab-type-opt--active" : ""}`}
                  onClick={() => setForm({ ...form, type: "TAM_VANG" })}
                >
                  <span className="ab-type-name">Tạm vắng qua đêm</span>
                  <span className="ab-type-desc">Bạn sẽ không ngủ tại KTX trong khoảng thời gian đăng ký</span>
                </button>
                <button
                  type="button"
                  className={`ab-type-opt ${form.type === "TAM_TRU" ? "ab-type-opt--active" : ""}`}
                  onClick={() => setForm({ ...form, type: "TAM_TRU" })}
                >
                  <span className="ab-type-name">Tạm trú (khách qua đêm)</span>
                  <span className="ab-type-desc">Người thân/bạn bè ở lại phòng bạn qua đêm</span>
                </button>
              </div>

              <div className="ab-row2">
                <div className="ab-field">
                  <label className="ab-field-label" htmlFor="ab-start">Từ ngày</label>
                  <input
                    id="ab-start"
                    type="date"
                    className="ab-input"
                    min={today}
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="ab-field">
                  <label className="ab-field-label" htmlFor="ab-end">Đến ngày</label>
                  <input
                    id="ab-end"
                    type="date"
                    className="ab-input"
                    min={form.startDate}
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              {isGuestType && (
                <div className="ab-row2">
                  <div className="ab-field">
                    <label className="ab-field-label" htmlFor="ab-guest-name">Họ tên khách</label>
                    <input
                      id="ab-guest-name"
                      type="text"
                      className="ab-input"
                      placeholder="Nguyễn Văn A"
                      value={form.guestName}
                      onChange={(e) => setForm({ ...form, guestName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="ab-field">
                    <label className="ab-field-label" htmlFor="ab-guest-id">CCCD của khách</label>
                    <input
                      id="ab-guest-id"
                      type="text"
                      className="ab-input"
                      placeholder="0123456789xx"
                      value={form.guestIdNumber}
                      onChange={(e) => setForm({ ...form, guestIdNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="ab-field">
                <label className="ab-field-label" htmlFor="ab-reason">Lý do</label>
                <textarea
                  id="ab-reason"
                  className="ab-textarea"
                  placeholder={isGuestType ? "Ví dụ: người thân lên thăm, ở lại 1 đêm..." : "Ví dụ: về quê cuối tuần, đi thực tập..."}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  required
                />
              </div>

              <div className="ab-form-actions">
                <button type="button" className="ab-btn-cancel" onClick={() => setShowForm(false)}>
                  Đóng
                </button>
                <button type="submit" className="ab-btn-submit" disabled={submitting}>
                  {submitting ? "Đang gửi..." : "Gửi đơn đăng ký"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lịch sử */}
      <div className="ab-panel">
        <div className="ab-panel-head">Lịch sử đăng ký</div>
        {loading ? (
          <div className="ab-empty">Đang tải dữ liệu...</div>
        ) : absences.length === 0 ? (
          <div className="ab-empty">Bạn chưa có đơn tạm trú/tạm vắng nào.</div>
        ) : (
          <div className="ab-scroll">
            <table className="ab-table">
              <thead>
                <tr>
                  <th>Loại đơn</th>
                  <th>Thời gian</th>
                  <th>Lý do</th>
                  <th>Ngày gửi</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {absences.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <div className="ab-type-cell">{TYPE_LABEL[a.type]}</div>
                      {a.type === "TAM_TRU" && a.guestName && (
                        <div className="ab-guest">Khách: {a.guestName} · CCCD: {a.guestIdNumber || "—"}</div>
                      )}
                    </td>
                    <td>{fmtDate(a.startDate)} → {fmtDate(a.endDate)}</td>
                    <td><span className="ab-reason" title={a.reason}>{a.reason}</span></td>
                    <td>{fmtDate(a.createdAt)}</td>
                    <td>
                      <span className={`ab-badge ab-badge--${a.status.toLowerCase()}`}>
                        {STATUS_LABEL[a.status]}
                      </span>
                    </td>
                    <td>
                      {a.status === "PENDING" && (
                        <button type="button" className="ab-cancel-btn" onClick={() => void handleCancel(a._id)}>
                          Hủy đơn
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
