"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "../../utils/apiClient";
import { useToast } from "../../components/ToastProvider";
import { useConfirm } from "../../components/ConfirmProvider";

type Status = "ACTIVE" | "APPEAL_PENDING" | "REVOKED" | "APPEAL_REJECTED";

interface Violation {
  _id: string;
  student?: { _id: string; fullName: string; mssv?: string; behaviorScore?: number };
  reason: string;
  points: number;
  scoreAfter?: number;
  status: Status;
  appealReason?: string;
  appealedAt?: string;
  reviewNote?: string;
  markedBy?: { fullName?: string };
  createdAt: string;
}

const STATUS_CFG: Record<Status, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: "Đang hiệu lực", color: "#b45309", bg: "rgba(245,158,11,0.12)" },
  APPEAL_PENDING: { label: "Đang khiếu nại", color: "#0284c7", bg: "rgba(2,132,199,0.12)" },
  REVOKED: { label: "Đã thu hồi", color: "#16a34a", bg: "rgba(34,197,94,0.12)" },
  APPEAL_REJECTED: { label: "Khiếu nại bị từ chối", color: "#dc2626", bg: "rgba(239,68,68,0.12)" },
};

type FilterKey = "ALL" | Status;
const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "APPEAL_PENDING", label: "Đang chờ duyệt" },
  { key: "ACTIVE", label: "Đang hiệu lực" },
  { key: "REVOKED", label: "Đã thu hồi" },
  { key: "APPEAL_REJECTED", label: "Đã từ chối KN" },
];

export default function AdminViolationsPage() {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [items, setItems] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("APPEAL_PENDING");
  const [processingId, setProcessingId] = useState<string | null>(null);
  // Modal từ chối khiếu nại (nhập ghi chú)
  const [rejectTarget, setRejectTarget] = useState<Violation | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      const res = await apiClient.get("/violations");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setItems(data);
      }
    } catch (err) {
      console.error("Lỗi tải vi phạm:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  // Vi phạm cũ (trước tính năng này) có thể chưa có trường status → coi như ACTIVE
  const normStatus = (v: Violation): Status => (v.status ?? "ACTIVE") as Status;
  const countBy = (s: Status) => items.filter((v) => normStatus(v) === s).length;

  const filtered = useMemo(
    () => (filter === "ALL" ? items : items.filter((v) => normStatus(v) === filter)),
    [items, filter],
  );

  const accept = async (v: Violation) => {
    const ok = await confirmDialog({
      title: "Chấp nhận khiếu nại?",
      message: `Vi phạm "${v.reason}" sẽ được thu hồi và hoàn lại ${v.points} điểm hành vi cho ${v.student?.fullName ?? "sinh viên"}.`,
      confirmLabel: "Chấp nhận & hoàn điểm",
    });
    if (!ok) return;
    await review(v, "ACCEPT");
  };

  const review = async (v: Violation, decision: "ACCEPT" | "REJECT", note?: string) => {
    setProcessingId(v._id);
    try {
      const res = await apiClient.patch(`/violations/${v._id}/review`, { decision, reviewNote: note });
      const data = await res.json();
      if (res.ok) {
        toast.success(decision === "ACCEPT" ? "Đã chấp nhận và hoàn điểm." : "Đã từ chối khiếu nại.");
        setRejectTarget(null);
        setReviewNote("");
        void fetchAll();
      } else {
        toast.error(data.message || "Không xử lý được, vui lòng thử lại.");
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setProcessingId(null);
    }
  };

  const revoke = async (v: Violation) => {
    const ok = await confirmDialog({
      title: "Thu hồi vi phạm?",
      message: `Thu hồi vi phạm "${v.reason}" và hoàn lại ${v.points} điểm hành vi. Dùng khi ghi nhầm.`,
      confirmLabel: "Thu hồi & hoàn điểm",
    });
    if (!ok) return;
    setProcessingId(v._id);
    try {
      const res = await apiClient.delete(`/violations/${v._id}`);
      const data = await res.json();
      if (res.ok) {
        toast.success("Đã thu hồi vi phạm và hoàn điểm.");
        void fetchAll();
      } else {
        toast.error(data.message || "Không thu hồi được.");
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setProcessingId(null);
    }
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    await review(rejectTarget, "REJECT", reviewNote.trim() || undefined);
  };

  return (
    <div>
      <style>{`
        .av-hero { background: linear-gradient(135deg,#0D1B2A 0%,#182b43 60%,#253d5d 100%); color:#fff; border-radius:16px; padding:24px 26px; border:1px solid rgba(201,168,76,0.25); margin-bottom:22px; }
        .av-hero-title { font-family:'Fraunces',serif; font-size:23px; font-weight:700; }
        .av-hero-sub { margin-top:5px; color:rgba(255,255,255,.65); font-size:13px; }
        .av-stats { display:flex; gap:12px; margin-top:16px; flex-wrap:wrap; }
        .av-stat { background:rgba(255,255,255,0.06); border:1px solid rgba(201,168,76,0.2); border-radius:10px; padding:10px 16px; min-width:110px; }
        .av-stat-num { font-family:'Fraunces',serif; font-size:20px; font-weight:700; }
        .av-stat-label { font-size:11px; color:rgba(255,255,255,0.6); margin-top:1px; }

        .av-tabs { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:16px; }
        .av-tab { padding:8px 15px; border-radius:100px; border:1px solid rgba(13,27,42,0.13); background:#fff; color:#5c6f82; font-family:'DM Sans',sans-serif; font-size:12.5px; font-weight:600; cursor:pointer; transition:all .15s; }
        .av-tab:hover { border-color:#C9A84C; color:#0D1B2A; }
        .av-tab--active { background:#0D1B2A; border-color:#0D1B2A; color:#fff; }

        .av-cards { display:flex; flex-direction:column; gap:12px; }
        .av-card { background:#fff; border:1px solid rgba(13,27,42,0.09); border-radius:12px; padding:18px 20px; }
        .av-card-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
        .av-student { font-family:'Fraunces',serif; font-size:15.5px; font-weight:700; color:#0D1B2A; }
        .av-student-sub { font-size:12px; color:#8A9BAD; margin-left:8px; }
        .av-chip { display:inline-flex; align-items:center; padding:4px 11px; border-radius:100px; font-size:11.5px; font-weight:700; white-space:nowrap; }
        .av-reason { font-size:14px; font-weight:600; color:#0D1B2A; margin-top:10px; }
        .av-meta { font-size:12px; color:#8A9BAD; margin-top:4px; }
        .av-points { color:#dc2626; font-weight:700; }
        .av-appeal { margin-top:12px; padding:10px 14px; border-radius:9px; background:rgba(2,132,199,0.06); border:1px solid rgba(2,132,199,0.18); }
        .av-appeal-label { font-size:11.5px; font-weight:700; color:#0284c7; }
        .av-appeal-text { font-size:13px; color:#3f4a57; line-height:1.6; margin-top:3px; }
        .av-note { margin-top:8px; font-size:12.5px; color:#5c6f82; font-style:italic; }
        .av-actions { display:flex; gap:10px; margin-top:14px; padding-top:14px; border-top:1px solid rgba(13,27,42,0.06); flex-wrap:wrap; }
        .av-btn { padding:9px 16px; border-radius:8px; border:none; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; }
        .av-btn:disabled { opacity:.55; cursor:not-allowed; }
        .av-btn--accept { background:#16a34a; color:#fff; }
        .av-btn--reject { background:rgba(220,38,38,0.1); color:#b91c1c; border:1px solid rgba(220,38,38,0.28); }
        .av-btn--revoke { background:#fff; color:#5c6f82; border:1px solid rgba(13,27,42,0.15); margin-left:auto; }
        .av-empty { background:#fff; border:1px dashed rgba(13,27,42,0.15); border-radius:12px; padding:44px 24px; text-align:center; color:#8A9BAD; font-size:13.5px; }

        .av-overlay { position:fixed; inset:0; z-index:200; background:rgba(13,27,42,.6); display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(3px); }
        .av-modal { background:#fff; border-radius:14px; width:100%; max-width:460px; box-shadow:0 24px 56px rgba(13,27,42,.24); overflow:hidden; }
        .av-modal-head { padding:18px 22px; border-bottom:1px solid rgba(13,27,42,.08); }
        .av-modal-title { font-family:'Fraunces',serif; font-size:17px; font-weight:700; color:#0D1B2A; }
        .av-modal-body { padding:18px 22px; }
        .av-textarea { width:100%; min-height:88px; padding:11px 13px; border:1px solid rgba(13,27,42,.15); border-radius:9px; font-family:'DM Sans',sans-serif; font-size:13.5px; color:#0D1B2A; outline:none; resize:vertical; }
        .av-textarea:focus { border-color:#C9A84C; }
        .av-modal-foot { display:flex; gap:10px; padding:0 22px 20px; }
        .av-modal-cancel { flex:1; padding:11px; border:1px solid rgba(13,27,42,.15); border-radius:8px; background:#fff; cursor:pointer; font-size:13.5px; }
        .av-modal-confirm { flex:2; padding:11px; border:none; border-radius:8px; background:#dc2626; color:#fff; font-weight:600; cursor:pointer; font-size:13.5px; }
        .av-modal-confirm:disabled { opacity:.6; cursor:not-allowed; }
      `}</style>

      <div className="av-hero">
        <div className="av-hero-title">Vi phạm và khiếu nại nề nếp</div>
        <div className="av-hero-sub">Duyệt khiếu nại của sinh viên, thu hồi vi phạm ghi nhầm và hoàn điểm hành vi.</div>
        <div className="av-stats">
          <div className="av-stat"><div className="av-stat-num" style={{ color: "#38bdf8" }}>{loading ? "—" : countBy("APPEAL_PENDING")}</div><div className="av-stat-label">Chờ duyệt</div></div>
          <div className="av-stat"><div className="av-stat-num" style={{ color: "#fbbf24" }}>{loading ? "—" : countBy("ACTIVE")}</div><div className="av-stat-label">Đang hiệu lực</div></div>
          <div className="av-stat"><div className="av-stat-num" style={{ color: "#4ade80" }}>{loading ? "—" : countBy("REVOKED")}</div><div className="av-stat-label">Đã thu hồi</div></div>
          <div className="av-stat"><div className="av-stat-num">{loading ? "—" : items.length}</div><div className="av-stat-label">Tổng</div></div>
        </div>
      </div>

      <div className="av-tabs">
        {FILTER_TABS.map((t) => (
          <button key={t.key} type="button" className={`av-tab ${filter === t.key ? "av-tab--active" : ""}`} onClick={() => setFilter(t.key)}>
            {t.label}{t.key !== "ALL" && !loading ? ` (${countBy(t.key as Status)})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="av-empty">Đang tải danh sách vi phạm…</div>
      ) : filtered.length === 0 ? (
        <div className="av-empty">Không có vi phạm nào ở mục này.</div>
      ) : (
        <div className="av-cards">
          {filtered.map((v) => {
            const status = normStatus(v);
            const sc = STATUS_CFG[status] ?? STATUS_CFG.ACTIVE;
            return (
              <div key={v._id} className="av-card">
                <div className="av-card-head">
                  <div>
                    <span className="av-student">{v.student?.fullName ?? "—"}</span>
                    <span className="av-student-sub">
                      {v.student?.mssv ? `MSSV ${v.student.mssv}` : ""}
                      {typeof v.student?.behaviorScore === "number" ? ` · Điểm hiện tại ${v.student.behaviorScore}/100` : ""}
                    </span>
                  </div>
                  <span className="av-chip" style={{ color: sc.color, background: sc.bg }}>{sc.label}</span>
                </div>

                <div className="av-reason">{v.reason} <span className="av-points">(−{v.points} điểm)</span></div>
                <div className="av-meta">
                  Ghi nhận: {new Date(v.createdAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  {v.markedBy?.fullName ? ` · bởi ${v.markedBy.fullName}` : ""}
                </div>

                {v.appealReason && (
                  <div className="av-appeal">
                    <div className="av-appeal-label">Lý do khiếu nại của sinh viên</div>
                    <div className="av-appeal-text">{v.appealReason}</div>
                  </div>
                )}
                {status === "APPEAL_REJECTED" && v.reviewNote && (
                  <div className="av-note">Ghi chú từ chối: {v.reviewNote}</div>
                )}

                <div className="av-actions">
                  {status === "APPEAL_PENDING" && (
                    <>
                      <button type="button" className="av-btn av-btn--accept" disabled={processingId === v._id} onClick={() => void accept(v)}>✓ Chấp nhận</button>
                      <button type="button" className="av-btn av-btn--reject" disabled={processingId === v._id} onClick={() => { setRejectTarget(v); setReviewNote(""); }}>✕ Từ chối</button>
                    </>
                  )}
                  {status !== "REVOKED" && (
                    <button type="button" className="av-btn av-btn--revoke" disabled={processingId === v._id} onClick={() => void revoke(v)}>Thu hồi (ghi nhầm)</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal từ chối khiếu nại */}
      {rejectTarget && (
        <div className="av-overlay" onClick={(e) => { if (e.target === e.currentTarget) setRejectTarget(null); }}>
          <div className="av-modal">
            <div className="av-modal-head">
              <div className="av-modal-title">Từ chối khiếu nại</div>
            </div>
            <div className="av-modal-body">
              <textarea
                className="av-textarea"
                maxLength={500}
                autoFocus
                placeholder="Ghi chú lý do từ chối (tùy chọn) để sinh viên hiểu…"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
              />
            </div>
            <div className="av-modal-foot">
              <button type="button" className="av-modal-cancel" onClick={() => setRejectTarget(null)}>Hủy</button>
              <button type="button" className="av-modal-confirm" disabled={processingId === rejectTarget._id} onClick={() => void submitReject()}>Xác nhận từ chối</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
