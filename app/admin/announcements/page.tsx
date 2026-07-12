"use client";

import { useEffect, useState } from "react";
import { useToast } from "../../components/ToastProvider";
import { useConfirm } from "../../components/ConfirmProvider";
import { apiClient } from "../../utils/apiClient";

interface AnnouncementRecord {
  _id: string;
  title: string;
  message: string;
  sentBy?: { fullName?: string };
  sentCount: number;
  createdAt: string;
}

// Trang soạn thông báo chung gửi đến TOÀN BỘ sinh viên (realtime qua socket)
export default function AdminAnnouncementsPage() {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [lastSent, setLastSent] = useState<{ title: string; sent: number; at: Date } | null>(null);
  const [history, setHistory] = useState<AnnouncementRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const loadHistory = async () => {
    try {
      const res = await apiClient.get("/notifications/broadcast/history");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setHistory(data);
      }
    } catch (err) {
      console.error("Lỗi tải lịch sử thông báo:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await confirmDialog({
      title: "Gửi thông báo toàn sinh viên?",
      message: `Thông báo "${title}" sẽ được gửi đến toàn bộ sinh viên đang hoạt động và không thể thu hồi.`,
      confirmLabel: "Gửi ngay",
    });
    if (!ok) return;

    setSending(true);
    try {
      const res = await apiClient.post("/notifications/broadcast", { title, message });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Đã gửi thông báo.", "Gửi thành công 📣");
        setLastSent({ title, sent: data.sent ?? 0, at: new Date() });
        setTitle("");
        setMessage("");
        void loadHistory();
      } else {
        toast.error(data.message || "Không gửi được thông báo.");
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="an-page px-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700&family=DM+Sans:wght@400;500;700&display=swap');

        .an-page { max-width: 860px; margin: 0 auto; padding-top: 24px; padding-bottom: 48px; color: #0D1B2A; font-family: 'DM Sans', sans-serif; }

        .an-hero { background: linear-gradient(135deg, #0D1B2A 0%, #182b43 60%, #253d5d 100%); color: #fff; border-radius: 16px; padding: 26px 28px; border: 1px solid rgba(201,168,76,0.25); margin-bottom: 24px; }
        .an-hero-title { font-family: 'Fraunces', serif; font-size: 25px; font-weight: 700; letter-spacing: -.3px; }
        .an-hero-sub { margin-top: 6px; color: rgba(255,255,255,.65); font-size: 13.5px; max-width: 560px; line-height: 1.6; }

        .an-panel { background: #fff; border: 1px solid rgba(13,27,42,.09); border-radius: 12px; overflow: hidden; }
        .an-panel-head { padding: 16px 20px; border-bottom: 1px solid rgba(13,27,42,.09); font-family: 'Fraunces', serif; font-size: 16px; font-weight: 600; color: #0D1B2A; }
        .an-panel-body { padding: 22px; }

        .an-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .an-label { font-size: 12px; font-weight: 700; color: #0D1B2A; }
        .an-hint { font-size: 11.5px; color: #8A9BAD; font-weight: 400; }
        .an-input, .an-textarea { width: 100%; border: 1px solid rgba(13,27,42,.15); border-radius: 8px; background: #fbfaf8; color: #0D1B2A; outline: none; font-size: 13.5px; font-family: 'DM Sans', sans-serif; transition: border-color .15s, background .15s; }
        .an-input { height: 44px; padding: 0 14px; }
        .an-textarea { padding: 12px 14px; resize: vertical; min-height: 130px; line-height: 1.7; }
        .an-input:focus, .an-textarea:focus { border-color: #c9a84c; background: #fff; }

        .an-count { font-size: 11.5px; color: #8A9BAD; text-align: right; }

        .an-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 6px; flex-wrap: wrap; }
        .an-warn { font-size: 12.5px; color: #92600a; display: flex; align-items: center; gap: 7px; }
        .an-send { display: inline-flex; align-items: center; gap: 8px; padding: 11px 26px; background: #0D1B2A; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600; transition: all .18s; }
        .an-send:hover:not(:disabled) { background: #1A2E42; }
        .an-send:disabled { opacity: .55; cursor: not-allowed; }

        .an-last { margin-top: 18px; padding: 13px 16px; border-radius: 8px; background: rgba(34,197,94,.08); border: 1px solid rgba(34,197,94,.22); font-size: 13px; color: #15803d; line-height: 1.6; }

        .an-preview { margin-top: 22px; }
        .an-preview-label { font-size: 12px; font-weight: 700; color: #8A9BAD; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 10px; }
        .an-preview-card { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; border: 1px solid rgba(13,27,42,.09); border-radius: 10px; background: #f2f7ff; }
        .an-preview-icon { width: 40px; height: 40px; border-radius: 8px; background: #e2e8f0; color: #0D1B2A; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .an-preview-title { font-size: 13.5px; font-weight: 700; color: #0D1B2A; }
        .an-preview-msg { font-size: 12.5px; color: #64748b; margin-top: 3px; line-height: 1.6; white-space: pre-wrap; }
        .an-preview-time { font-size: 11.5px; color: #2563eb; font-weight: 600; margin-top: 5px; }

        .an-history { margin-top: 22px; }
        .an-history-item { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; padding: 14px 16px; border: 1px solid rgba(13,27,42,.08); border-radius: 10px; margin-bottom: 10px; background: #fff; }
        .an-history-item:last-child { margin-bottom: 0; }
        .an-history-title { font-size: 13.5px; font-weight: 700; color: #0D1B2A; }
        .an-history-msg { font-size: 12.5px; color: #64748b; margin-top: 4px; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .an-history-meta { font-size: 11.5px; color: #8A9BAD; margin-top: 7px; font-weight: 500; }
        .an-history-count { flex-shrink: 0; text-align: center; padding: 8px 14px; border-radius: 8px; background: rgba(201,168,76,.1); border: 1px solid rgba(201,168,76,.25); }
        .an-history-count-num { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; color: #9a7b2c; }
        .an-history-count-label { font-size: 10px; color: #8A9BAD; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
        .an-history-empty { padding: 30px 20px; text-align: center; color: #8A9BAD; font-size: 13px; border: 1px dashed rgba(13,27,42,.15); border-radius: 10px; }
      `}</style>

      <div className="an-hero">
        <div className="an-hero-title">Gửi thông báo toàn sinh viên</div>
        <div className="an-hero-sub">
          Thông báo sẽ được lưu vào hộp thông báo của từng sinh viên và đổ chuông realtime ngay lập tức — dùng cho lịch cắt điện/nước, họp KTX, thông báo khẩn...
        </div>
      </div>

      <div className="an-panel">
        <div className="an-panel-head">Soạn thông báo</div>
        <div className="an-panel-body">
          <form onSubmit={handleSubmit}>
            <div className="an-field">
              <label className="an-label" htmlFor="an-title">
                Tiêu đề <span className="an-hint">(ngắn gọn, tối đa 100 ký tự)</span>
              </label>
              <input
                id="an-title"
                type="text"
                className="an-input"
                maxLength={100}
                placeholder="Ví dụ: Lịch cắt nước tòa A ngày 15/07"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="an-field">
              <label className="an-label" htmlFor="an-message">Nội dung</label>
              <textarea
                id="an-message"
                className="an-textarea"
                maxLength={1000}
                placeholder="Nội dung chi tiết của thông báo..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
              <div className="an-count">{message.length}/1000</div>
            </div>

            <div className="an-foot">
              <span className="an-warn">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A2 2 0 004 21h16a2 2 0 001.89-2.96L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                Gửi cho toàn bộ sinh viên đang hoạt động — không thể thu hồi.
              </span>
              <button type="submit" className="an-send" disabled={sending || !title.trim() || !message.trim()}>
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                {sending ? "Đang gửi..." : "Gửi thông báo"}
              </button>
            </div>
          </form>

          {lastSent && (
            <div className="an-last">
              ✅ Đã gửi &ldquo;{lastSent.title}&rdquo; đến <b>{lastSent.sent}</b> sinh viên lúc{" "}
              {lastSent.at.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}.
            </div>
          )}

          {(title || message) && (
            <div className="an-preview an-preview-block">
              <div className="an-preview-label">Xem trước trên chuông thông báo</div>
              <div className="an-preview-card">
                <div className="an-preview-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.25A6.75 6.75 0 005.25 9v.75a8.22 8.22 0 01-2.12 5.52.75.75 0 00.3 1.2c1.54.58 3.16 1 4.83 1.25a3.75 3.75 0 007.48 0 24.6 24.6 0 004.83-1.25.75.75 0 00.3-1.2 8.22 8.22 0 01-2.12-5.52V9A6.75 6.75 0 0012 2.25zM9.75 18a2.25 2.25 0 004.5 0 24.9 24.9 0 01-4.5 0z" />
                  </svg>
                </div>
                <div>
                  <div className="an-preview-title">{title || "Tiêu đề thông báo"}</div>
                  <div className="an-preview-msg">{message || "Nội dung thông báo..."}</div>
                  <div className="an-preview-time">Vừa xong</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lịch sử thông báo đã gửi */}
      <div className="an-panel an-history">
        <div className="an-panel-head">Lịch sử đã gửi ({history.length})</div>
        <div className="an-panel-body">
          {historyLoading ? (
            <div className="an-history-empty">Đang tải lịch sử...</div>
          ) : history.length === 0 ? (
            <div className="an-history-empty">Chưa có thông báo chung nào được gửi.</div>
          ) : (
            history.map((item) => (
              <div key={item._id} className="an-history-item">
                <div style={{ minWidth: 0 }}>
                  <div className="an-history-title">{item.title}</div>
                  <div className="an-history-msg">{item.message}</div>
                  <div className="an-history-meta">
                    {item.sentBy?.fullName ? `Gửi bởi ${item.sentBy.fullName} · ` : ""}
                    {new Date(item.createdAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <div className="an-history-count">
                  <div className="an-history-count-num">{item.sentCount}</div>
                  <div className="an-history-count-label">SV nhận</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
