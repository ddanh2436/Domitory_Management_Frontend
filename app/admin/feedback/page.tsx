"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "../../utils/apiClient";
import { useToast } from "../../components/ToastProvider";

type FeedbackType = "COMPLAINT" | "SUGGESTION";
type FeedbackCategory = "FACILITY" | "STAFF_CONDUCT" | "BILLING" | "OTHER";
type FeedbackStatus = "PENDING" | "RESOLVED" | "CLOSED";

interface Feedback {
  _id: string;
  student?: { _id: string; fullName: string; mssv?: string; email?: string };
  type: FeedbackType;
  category: FeedbackCategory;
  message: string;
  status: FeedbackStatus;
  response?: string;
  respondedBy?: { fullName?: string };
  respondedAt?: string;
  createdAt: string;
}

const TYPE_LABEL: Record<FeedbackType, string> = {
  COMPLAINT: "Khiếu nại",
  SUGGESTION: "Góp ý",
};

const CATEGORY_LABEL: Record<FeedbackCategory, string> = {
  FACILITY: "Cơ sở vật chất",
  STAFF_CONDUCT: "Thái độ nhân viên",
  BILLING: "Hoá đơn / thanh toán",
  OTHER: "Khác",
};

const STATUS_CFG: Record<FeedbackStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Chờ xử lý", color: "#b45309", bg: "rgba(245,158,11,0.12)" },
  RESOLVED: { label: "Đã xử lý", color: "#16a34a", bg: "rgba(34,197,94,0.12)" },
  CLOSED: { label: "Đã đóng", color: "#64748b", bg: "rgba(13,27,42,0.07)" },
};

type FilterKey = "ALL" | FeedbackStatus;
const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "PENDING", label: "Chờ xử lý" },
  { key: "RESOLVED", label: "Đã xử lý" },
  { key: "CLOSED", label: "Đã đóng" },
  { key: "ALL", label: "Tất cả" },
];

const MESSAGE_MAX = 1000;

export default function AdminFeedbackPage() {
  const toast = useToast();
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("PENDING");
  const [typeFilter, setTypeFilter] = useState<"ALL" | FeedbackType>("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [respondTarget, setRespondTarget] = useState<Feedback | null>(null);
  const [responseText, setResponseText] = useState("");
  const [finalStatus, setFinalStatus] = useState<"RESOLVED" | "CLOSED">("RESOLVED");

  const fetchAll = useCallback(async () => {
    try {
      const res = await apiClient.get("/feedback");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setItems(data);
      }
    } catch (err) {
      console.error("Lỗi tải góp ý/khiếu nại:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const countBy = (s: FeedbackStatus) => items.filter((f) => f.status === s).length;

  const filtered = useMemo(() => {
    let list = filter === "ALL" ? items : items.filter((f) => f.status === filter);
    if (typeFilter !== "ALL") list = list.filter((f) => f.type === typeFilter);
    return list;
  }, [items, filter, typeFilter]);

  const openRespond = (f: Feedback) => {
    setRespondTarget(f);
    setResponseText("");
    setFinalStatus("RESOLVED");
  };

  const submitRespond = async () => {
    if (!respondTarget) return;
    if (!responseText.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi.");
      return;
    }
    setProcessingId(respondTarget._id);
    try {
      const res = await apiClient.patch(`/feedback/${respondTarget._id}/respond`, {
        response: responseText.trim(),
        status: finalStatus,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Đã phản hồi.");
        setRespondTarget(null);
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

  return (
    <div>
      <style>{`
        .fbadm-hero { background: linear-gradient(135deg,#0D1B2A 0%,#182b43 60%,#253d5d 100%); color:#fff; border-radius:16px; padding:24px 26px; border:1px solid rgba(201,168,76,0.25); margin-bottom:22px; }
        .fbadm-hero-title { font-family:'FrauncesAmp','Fraunces',serif; font-size:23px; font-weight:700; }
        .fbadm-hero-sub { margin-top:5px; color:rgba(255,255,255,.65); font-size:13px; }
        .fbadm-stats { display:flex; gap:12px; margin-top:16px; flex-wrap:wrap; }
        .fbadm-stat { background:rgba(255,255,255,0.06); border:1px solid rgba(201,168,76,0.2); border-radius:10px; padding:10px 16px; min-width:110px; }
        .fbadm-stat-num { font-family:'FrauncesAmp','Fraunces',serif; font-size:20px; font-weight:700; }
        .fbadm-stat-label { font-size:11px; color:rgba(255,255,255,0.6); margin-top:1px; }

        .fbadm-filters { display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:16px; }
        .fbadm-tabs { display:flex; gap:6px; flex-wrap:wrap; }
        .fbadm-tab { padding:8px 15px; border-radius:100px; border:1px solid rgba(13,27,42,0.13); background:#fff; color:#5c6f82; font-family:'DM Sans',sans-serif; font-size:12.5px; font-weight:600; cursor:pointer; transition:all .15s; }
        .fbadm-tab:hover { border-color:#C9A84C; color:#0D1B2A; }
        .fbadm-tab--active { background:#0D1B2A; border-color:#0D1B2A; color:#fff; }
        .fbadm-type-select { height:36px; padding:0 12px; border-radius:100px; border:1px solid rgba(13,27,42,0.13); background:#fff; color:#0D1B2A; font-family:'DM Sans',sans-serif; font-size:12.5px; font-weight:600; }

        .fbadm-cards { display:flex; flex-direction:column; gap:12px; }
        .fbadm-card { background:#fff; border:1px solid rgba(13,27,42,0.09); border-radius:12px; padding:18px 20px; }
        .fbadm-card-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap: wrap; }
        .fbadm-student { font-family:'FrauncesAmp','Fraunces',serif; font-size:15.5px; font-weight:700; color:#0D1B2A; }
        .fbadm-student-sub { font-size:12px; color:#8A9BAD; margin-left:8px; }
        .fbadm-tags { display:flex; gap:8px; margin-top:8px; flex-wrap:wrap; }
        .fbadm-tag { font-size:11px; font-weight:700; padding:3px 10px; border-radius:100px; background:rgba(13,27,42,.06); color:#37485c; }
        .fbadm-tag--complaint { background: rgba(220,38,38,.1); color: #b91c1c; }
        .fbadm-tag--suggestion { background: rgba(2,132,199,.1); color: #0369a1; }
        .fbadm-chip { display:inline-flex; align-items:center; padding:4px 11px; border-radius:100px; font-size:11.5px; font-weight:700; white-space:nowrap; }
        .fbadm-message { font-size:14px; color:#37485c; margin-top:10px; line-height:1.6; white-space:pre-wrap; }
        .fbadm-meta { font-size:12px; color:#8A9BAD; margin-top:6px; }
        .fbadm-response { margin-top:12px; padding:10px 14px; border-radius:9px; background:rgba(34,197,94,.06); border:1px solid rgba(34,197,94,.18); }
        .fbadm-response-label { font-size:11.5px; font-weight:700; color:#16a34a; }
        .fbadm-response-text { font-size:13px; color:#3f4a57; line-height:1.6; margin-top:3px; white-space:pre-wrap; }
        .fbadm-actions { display:flex; gap:10px; margin-top:14px; padding-top:14px; border-top:1px solid rgba(13,27,42,0.06); flex-wrap:wrap; }
        .fbadm-btn { padding:9px 16px; border-radius:8px; border:none; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; }
        .fbadm-btn:disabled { opacity:.55; cursor:not-allowed; }
        .fbadm-btn--respond { background:#0D1B2A; color:#fff; }
        .fbadm-empty { background:#fff; border:1px dashed rgba(13,27,42,0.15); border-radius:12px; padding:44px 24px; text-align:center; color:#8A9BAD; font-size:13.5px; }

        .fbadm-overlay { position:fixed; inset:0; z-index:200; background:rgba(13,27,42,.6); display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(3px); }
        .fbadm-modal { background:#fff; border-radius:14px; width:100%; max-width:480px; box-shadow:0 24px 56px rgba(13,27,42,.24); overflow:hidden; }
        .fbadm-modal-head { padding:18px 22px; border-bottom:1px solid rgba(13,27,42,.08); }
        .fbadm-modal-title { font-family:'FrauncesAmp','Fraunces',serif; font-size:17px; font-weight:700; color:#0D1B2A; }
        .fbadm-modal-body { padding:18px 22px; display:flex; flex-direction:column; gap:14px; }
        .fbadm-modal-message { font-size:13px; color:#5c6f82; background:#FAFAF9; border-radius:8px; padding:10px 12px; line-height:1.6; white-space:pre-wrap; }
        .fbadm-textarea { width:100%; min-height:100px; padding:11px 13px; border:1px solid rgba(13,27,42,.15); border-radius:9px; font-family:'DM Sans',sans-serif; font-size:13.5px; color:#0D1B2A; outline:none; resize:vertical; }
        .fbadm-textarea:focus { border-color:#C9A84C; }
        .fbadm-status-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .fbadm-status-opt { padding:10px; border-radius:8px; border:1.5px solid rgba(13,27,42,.12); background:#fff; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#0D1B2A; text-align:center; }
        .fbadm-status-opt--active { border-color:#C9A84C; background:rgba(201,168,76,.08); }
        .fbadm-modal-foot { display:flex; gap:10px; padding:0 22px 20px; }
        .fbadm-modal-cancel { flex:1; padding:11px; border:1px solid rgba(13,27,42,.15); border-radius:8px; background:#fff; cursor:pointer; font-size:13.5px; }
        .fbadm-modal-confirm { flex:2; padding:11px; border:none; border-radius:8px; background:#0D1B2A; color:#fff; font-weight:600; cursor:pointer; font-size:13.5px; }
        .fbadm-modal-confirm:disabled { opacity:.6; cursor:not-allowed; }
      `}</style>

      <div className="fbadm-hero">
        <div className="fbadm-hero-title">Góp ý và khiếu nại</div>
        <div className="fbadm-hero-sub">Xem, lọc và phản hồi góp ý/khiếu nại do sinh viên gửi.</div>
        <div className="fbadm-stats">
          <div className="fbadm-stat"><div className="fbadm-stat-num" style={{ color: "#fbbf24" }}>{loading ? "—" : countBy("PENDING")}</div><div className="fbadm-stat-label">Chờ xử lý</div></div>
          <div className="fbadm-stat"><div className="fbadm-stat-num" style={{ color: "#4ade80" }}>{loading ? "—" : countBy("RESOLVED")}</div><div className="fbadm-stat-label">Đã xử lý</div></div>
          <div className="fbadm-stat"><div className="fbadm-stat-num" style={{ color: "#94a3b8" }}>{loading ? "—" : countBy("CLOSED")}</div><div className="fbadm-stat-label">Đã đóng</div></div>
          <div className="fbadm-stat"><div className="fbadm-stat-num">{loading ? "—" : items.length}</div><div className="fbadm-stat-label">Tổng</div></div>
        </div>
      </div>

      <div className="fbadm-filters">
        <div className="fbadm-tabs">
          {FILTER_TABS.map((t) => (
            <button key={t.key} type="button" className={`fbadm-tab ${filter === t.key ? "fbadm-tab--active" : ""}`} onClick={() => setFilter(t.key)}>
              {t.label}{t.key !== "ALL" && !loading ? ` (${countBy(t.key as FeedbackStatus)})` : ""}
            </button>
          ))}
        </div>
        <select className="fbadm-type-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as "ALL" | FeedbackType)}>
          <option value="ALL">Tất cả loại</option>
          <option value="COMPLAINT">Chỉ khiếu nại</option>
          <option value="SUGGESTION">Chỉ góp ý</option>
        </select>
      </div>

      {loading ? (
        <div className="fbadm-empty">Đang tải danh sách…</div>
      ) : filtered.length === 0 ? (
        <div className="fbadm-empty">Không có mục nào ở bộ lọc này.</div>
      ) : (
        <div className="fbadm-cards">
          {filtered.map((f) => {
            const sc = STATUS_CFG[f.status];
            return (
              <div key={f._id} className="fbadm-card">
                <div className="fbadm-card-head">
                  <div>
                    <span className="fbadm-student">{f.student?.fullName ?? "—"}</span>
                    <span className="fbadm-student-sub">
                      {f.student?.mssv ? `MSSV ${f.student.mssv}` : f.student?.email ?? ""}
                    </span>
                    <div className="fbadm-tags">
                      <span className={`fbadm-tag ${f.type === "COMPLAINT" ? "fbadm-tag--complaint" : "fbadm-tag--suggestion"}`}>{TYPE_LABEL[f.type]}</span>
                      <span className="fbadm-tag">{CATEGORY_LABEL[f.category]}</span>
                    </div>
                  </div>
                  <span className="fbadm-chip" style={{ color: sc.color, background: sc.bg }}>{sc.label}</span>
                </div>

                <div className="fbadm-message">{f.message}</div>
                <div className="fbadm-meta">
                  Gửi lúc: {new Date(f.createdAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>

                {f.response && (
                  <div className="fbadm-response">
                    <div className="fbadm-response-label">
                      Phản hồi{f.respondedBy?.fullName ? ` của ${f.respondedBy.fullName}` : ""}
                    </div>
                    <div className="fbadm-response-text">{f.response}</div>
                  </div>
                )}

                {f.status === "PENDING" && (
                  <div className="fbadm-actions">
                    <button type="button" className="fbadm-btn fbadm-btn--respond" disabled={processingId === f._id} onClick={() => openRespond(f)}>
                      Phản hồi
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal phản hồi */}
      {respondTarget && (
        <div className="fbadm-overlay" onClick={(e) => { if (e.target === e.currentTarget) setRespondTarget(null); }}>
          <div className="fbadm-modal">
            <div className="fbadm-modal-head">
              <div className="fbadm-modal-title">Phản hồi góp ý/khiếu nại</div>
            </div>
            <div className="fbadm-modal-body">
              <div className="fbadm-modal-message">{respondTarget.message}</div>
              <textarea
                className="fbadm-textarea"
                maxLength={MESSAGE_MAX}
                autoFocus
                placeholder="Nhập nội dung phản hồi cho sinh viên…"
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
              />
              <div className="fbadm-status-grid">
                <button
                  type="button"
                  className={`fbadm-status-opt ${finalStatus === "RESOLVED" ? "fbadm-status-opt--active" : ""}`}
                  onClick={() => setFinalStatus("RESOLVED")}
                >
                  ✓ Đánh dấu đã xử lý
                </button>
                <button
                  type="button"
                  className={`fbadm-status-opt ${finalStatus === "CLOSED" ? "fbadm-status-opt--active" : ""}`}
                  onClick={() => setFinalStatus("CLOSED")}
                >
                  Đóng mục này
                </button>
              </div>
            </div>
            <div className="fbadm-modal-foot">
              <button type="button" className="fbadm-modal-cancel" onClick={() => setRespondTarget(null)}>Hủy</button>
              <button type="button" className="fbadm-modal-confirm" disabled={processingId === respondTarget._id} onClick={() => void submitRespond()}>
                Xác nhận phản hồi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
