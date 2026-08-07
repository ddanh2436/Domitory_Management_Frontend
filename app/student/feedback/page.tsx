"use client";

import { useEffect, useState } from "react";
import { useToast } from "../../components/ToastProvider";
import { apiClient } from "../../utils/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────
type FeedbackType = "COMPLAINT" | "SUGGESTION";
type FeedbackCategory = "FACILITY" | "STAFF_CONDUCT" | "BILLING" | "OTHER";
type FeedbackStatus = "PENDING" | "RESOLVED" | "CLOSED";

interface Feedback {
  _id: string;
  type: FeedbackType;
  category: FeedbackCategory;
  message: string;
  status: FeedbackStatus;
  response?: string;
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

const STATUS_LABEL: Record<FeedbackStatus, string> = {
  PENDING: "Chờ xử lý",
  RESOLVED: "Đã xử lý",
  CLOSED: "Đã đóng",
};

const MESSAGE_MAX = 1000;

export default function StudentFeedbackPage() {
  const toast = useToast();
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    type: "COMPLAINT" as FeedbackType,
    category: "FACILITY" as FeedbackCategory,
    message: "",
  });

  const loadData = async () => {
    try {
      const res = await apiClient.get("/feedback/me");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setItems(data);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách góp ý/khiếu nại:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.message.trim()) {
      toast.error("Vui lòng nhập nội dung.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.post("/feedback", form);
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Đã gửi góp ý/khiếu nại.", "Gửi thành công");
        setShowForm(false);
        setForm({ type: "COMPLAINT", category: "FACILITY", message: "" });
        void loadData();
      } else {
        toast.error(data.message || "Không gửi được, vui lòng thử lại.");
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setSubmitting(false);
    }
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="fb-shell">
      <style>{`
        .fb-shell { max-width: 1080px; margin: 0 auto; padding: 24px 24px 48px; font-family: 'DM Sans', sans-serif; }

        .fb-hero { background: linear-gradient(135deg, #0D1B2A 0%, #182b43 60%, #253d5d 100%); color: #fff; border-radius: 16px; padding: 26px 28px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; border: 1px solid rgba(201,168,76,0.25); margin-bottom: 24px; }
        .fb-hero-title { font-family: 'Fraunces', serif; font-size: 25px; font-weight: 700; letter-spacing: -.3px; }
        .fb-hero-sub { margin-top: 6px; color: rgba(255,255,255,.65); font-size: 13.5px; max-width: 520px; line-height: 1.6; }
        .fb-hero-btn { display: inline-flex; align-items: center; gap: 8px; background: #C9A84C; color: #0D1B2A; border: none; padding: 11px 20px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 13.5px; cursor: pointer; transition: all .18s; }
        .fb-hero-btn:hover { background: #D9B85C; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(201,168,76,.35); }

        .fb-panel { background: #fff; border: 1px solid rgba(13,27,42,.09); border-radius: 12px; overflow: hidden; margin-bottom: 24px; }
        .fb-panel-head { padding: 16px 20px; border-bottom: 1px solid rgba(13,27,42,.09); font-family: 'Fraunces', serif; font-size: 16px; font-weight: 600; color: #0D1B2A; }
        .fb-panel-body { padding: 20px; }

        .fb-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
        .fb-type-opt { display: flex; flex-direction: column; gap: 4px; padding: 13px 14px; border-radius: 8px; border: 1.5px solid rgba(13,27,42,.12); background: #fff; cursor: pointer; transition: all .15s; text-align: left; font-family: 'DM Sans', sans-serif; }
        .fb-type-opt:hover { border-color: rgba(13,27,42,.25); }
        .fb-type-opt--active { border-color: #C9A84C; background: rgba(201,168,76,.08); }
        .fb-type-name { font-size: 13.5px; font-weight: 700; color: #0D1B2A; }
        .fb-type-desc { font-size: 11.5px; color: #8A9BAD; line-height: 1.5; }

        .fb-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .fb-field-label { font-size: 12px; font-weight: 700; color: #0D1B2A; }
        .fb-select, .fb-textarea { width: 100%; border: 1px solid rgba(13,27,42,.15); border-radius: 8px; background: #fbfaf8; color: #0D1B2A; outline: none; font-size: 13.5px; font-family: 'DM Sans', sans-serif; transition: border-color .15s, background .15s; }
        .fb-select { height: 42px; padding: 0 12px; }
        .fb-textarea { padding: 11px 12px; resize: vertical; min-height: 110px; line-height: 1.6; }
        .fb-select:focus, .fb-textarea:focus { border-color: #c9a84c; background: #fff; }
        .fb-count { text-align: right; font-size: 11px; color: #8A9BAD; margin-top: 4px; }

        .fb-form-actions { display: flex; gap: 10px; }
        .fb-btn-cancel { flex: 1; padding: 11px; border: 1px solid rgba(13,27,42,.15); border-radius: 8px; background: transparent; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: #0D1B2A; transition: background .15s; }
        .fb-btn-cancel:hover { background: #F5F3EF; }
        .fb-btn-submit { flex: 2; padding: 11px; background: #0D1B2A; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600; transition: all .18s; }
        .fb-btn-submit:hover:not(:disabled) { background: #1A2E42; }
        .fb-btn-submit:disabled { opacity: .55; cursor: not-allowed; }

        .fb-cards { display: flex; flex-direction: column; gap: 12px; padding: 16px 20px 20px; }
        .fb-card { border: 1px solid rgba(13,27,42,.09); border-radius: 10px; padding: 16px 18px; }
        .fb-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .fb-card-tags { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .fb-tag { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 100px; background: rgba(13,27,42,.06); color: #37485c; }
        .fb-tag--complaint { background: rgba(220,38,38,.1); color: #b91c1c; }
        .fb-tag--suggestion { background: rgba(2,132,199,.1); color: #0369a1; }
        .fb-date { font-size: 11.5px; color: #8A9BAD; }
        .fb-message { margin-top: 10px; font-size: 13.5px; color: #37485c; line-height: 1.6; white-space: pre-wrap; }

        .fb-badge { display: inline-flex; align-items: center; padding: 5px 12px; border-radius: 100px; font-size: 12px; font-weight: 600; white-space: nowrap; }
        .fb-badge--pending { background: rgba(245,158,11,.12); color: #d97706; }
        .fb-badge--resolved { background: rgba(34,197,94,.12); color: #16a34a; }
        .fb-badge--closed { background: rgba(13,27,42,.07); color: #64748b; }

        .fb-response { margin-top: 12px; padding: 12px 14px; border-radius: 9px; background: rgba(34,197,94,.06); border: 1px solid rgba(34,197,94,.18); }
        .fb-response-label { font-size: 11.5px; font-weight: 700; color: #16a34a; }
        .fb-response-text { font-size: 13px; color: #3f4a57; line-height: 1.6; margin-top: 3px; white-space: pre-wrap; }

        .fb-empty { padding: 48px 24px; text-align: center; color: #6b7f92; font-size: 13.5px; }

        @media (max-width: 640px) { .fb-type-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* Hero */}
      <div className="fb-hero">
        <div>
          <div className="fb-hero-title">Góp ý &amp; Khiếu nại</div>
          <div className="fb-hero-sub">
            Gửi phản ánh hoặc đề xuất tới ban quản lý ký túc xá về cơ sở vật chất, thái độ nhân viên, hoá đơn, hoặc bất kỳ vấn đề nào khác.
          </div>
        </div>
        <button type="button" className="fb-hero-btn" onClick={() => setShowForm((v) => !v)}>
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Gửi góp ý / khiếu nại
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="fb-panel">
          <div className="fb-panel-head">Nội dung gửi tới ban quản lý</div>
          <div className="fb-panel-body">
            <form onSubmit={handleSubmit}>
              <div className="fb-type-grid">
                <button
                  type="button"
                  className={`fb-type-opt ${form.type === "COMPLAINT" ? "fb-type-opt--active" : ""}`}
                  onClick={() => setForm({ ...form, type: "COMPLAINT" })}
                >
                  <span className="fb-type-name">Khiếu nại</span>
                  <span className="fb-type-desc">Phản ánh một vấn đề cần ban quản lý xử lý</span>
                </button>
                <button
                  type="button"
                  className={`fb-type-opt ${form.type === "SUGGESTION" ? "fb-type-opt--active" : ""}`}
                  onClick={() => setForm({ ...form, type: "SUGGESTION" })}
                >
                  <span className="fb-type-name">Góp ý</span>
                  <span className="fb-type-desc">Đề xuất cải thiện đời sống ký túc xá</span>
                </button>
              </div>

              <div className="fb-field">
                <label className="fb-field-label" htmlFor="fb-category">Danh mục</label>
                <select
                  id="fb-category"
                  className="fb-select"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as FeedbackCategory })}
                >
                  {(Object.keys(CATEGORY_LABEL) as FeedbackCategory[]).map((key) => (
                    <option key={key} value={key}>{CATEGORY_LABEL[key]}</option>
                  ))}
                </select>
              </div>

              <div className="fb-field">
                <label className="fb-field-label" htmlFor="fb-message">Nội dung</label>
                <textarea
                  id="fb-message"
                  className="fb-textarea"
                  placeholder="Mô tả chi tiết vấn đề hoặc đề xuất của bạn..."
                  maxLength={MESSAGE_MAX}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                />
                <div className="fb-count">{form.message.length}/{MESSAGE_MAX}</div>
              </div>

              <div className="fb-form-actions">
                <button type="button" className="fb-btn-cancel" onClick={() => setShowForm(false)}>
                  Đóng
                </button>
                <button type="submit" className="fb-btn-submit" disabled={submitting}>
                  {submitting ? "Đang gửi..." : "Gửi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lịch sử */}
      <div className="fb-panel">
        <div className="fb-panel-head">Lịch sử của tôi</div>
        {loading ? (
          <div className="fb-empty">Đang tải dữ liệu...</div>
        ) : items.length === 0 ? (
          <div className="fb-empty">Bạn chưa gửi góp ý/khiếu nại nào.</div>
        ) : (
          <div className="fb-cards">
            {items.map((f) => (
              <div key={f._id} className="fb-card">
                <div className="fb-card-head">
                  <div className="fb-card-tags">
                    <span className={`fb-tag ${f.type === "COMPLAINT" ? "fb-tag--complaint" : "fb-tag--suggestion"}`}>
                      {TYPE_LABEL[f.type]}
                    </span>
                    <span className="fb-tag">{CATEGORY_LABEL[f.category]}</span>
                    <span className="fb-date">{fmtDate(f.createdAt)}</span>
                  </div>
                  <span className={`fb-badge fb-badge--${f.status.toLowerCase()}`}>{STATUS_LABEL[f.status]}</span>
                </div>
                <div className="fb-message">{f.message}</div>
                {f.response && (
                  <div className="fb-response">
                    <div className="fb-response-label">Phản hồi từ ban quản lý</div>
                    <div className="fb-response-text">{f.response}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
