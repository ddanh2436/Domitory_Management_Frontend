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
  capacity?: number;
  currentOccupancy?: number;
}

interface Transfer {
  _id: string;
  fromRoom?: RoomInfo;
  toRoom?: RoomInfo;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  createdAt: string;
  processedAt?: string;
}

interface Profile {
  fullName: string;
  room?: RoomInfo & { contractEnd?: string };
}

const STATUS_LABEL: Record<Transfer["status"], string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  CANCELLED: "Đã hủy",
};

export default function StudentTransfersPage() {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [availableRooms, setAvailableRooms] = useState<RoomInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toRoomId, setToRoomId] = useState("");
  const [reason, setReason] = useState("");

  const loadData = async () => {
    try {
      const [profileRes, transfersRes, roomsRes] = await Promise.all([
        apiClient.get("/users/profile"),
        apiClient.get("/transfers/me"),
        apiClient.get("/rooms?status=AVAILABLE"),
      ]);

      if (profileRes.ok) setProfile(await profileRes.json());
      if (transfersRes.ok) {
        const data = await transfersRes.json();
        if (Array.isArray(data)) setTransfers(data);
      }
      if (roomsRes.ok) {
        const payload = await roomsRes.json();
        const rooms = payload.data || payload;
        if (Array.isArray(rooms)) setAvailableRooms(rooms);
      }
    } catch (err) {
      console.error("Lỗi tải dữ liệu đổi phòng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const currentRoomId = profile?.room?._id;
  const selectableRooms = availableRooms.filter((r) => r._id !== currentRoomId);
  const hasPending = transfers.some((t) => t.status === "PENDING");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toRoomId) {
      toast.error("Vui lòng chọn phòng muốn chuyển đến.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.post("/transfers", { toRoomId, reason });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Đã gửi yêu cầu đổi phòng.", "Gửi yêu cầu thành công");
        setShowForm(false);
        setToRoomId("");
        setReason("");
        void loadData();
      } else {
        toast.error(data.message || "Không gửi được yêu cầu đổi phòng.");
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (transferId: string) => {
    const ok = await confirmDialog({
      title: "Hủy yêu cầu đổi phòng?",
      message: "Yêu cầu đang chờ duyệt sẽ bị hủy. Bạn có thể tạo yêu cầu mới bất cứ lúc nào.",
      confirmLabel: "Hủy yêu cầu",
      variant: "danger",
    });
    if (!ok) return;
    try {
      const res = await apiClient.patch(`/transfers/${transferId}/cancel`);
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

  return (
    <div className="tf-shell">
      <style>{`
        .tf-shell { max-width: 1080px; margin: 0 auto; padding: 24px 24px 48px; font-family: 'DM Sans', sans-serif; }

        .tf-hero { background: linear-gradient(135deg, #0D1B2A 0%, #182b43 60%, #253d5d 100%); color: #fff; border-radius: 16px; padding: 26px 28px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; border: 1px solid rgba(201,168,76,0.25); margin-bottom: 24px; }
        .tf-hero-title { font-family: 'Fraunces', serif; font-size: 25px; font-weight: 700; letter-spacing: -.3px; }
        .tf-hero-sub { margin-top: 6px; color: rgba(255,255,255,.65); font-size: 13.5px; max-width: 480px; line-height: 1.6; }
        .tf-hero-btn { display: inline-flex; align-items: center; gap: 8px; background: var(--gold, #C9A84C); color: #0D1B2A; border: none; padding: 11px 20px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 13.5px; cursor: pointer; transition: all .18s; }
        .tf-hero-btn:hover:not(:disabled) { background: #D9B85C; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(201,168,76,.35); }
        .tf-hero-btn:disabled { opacity: .55; cursor: not-allowed; }

        .tf-current { display: flex; align-items: center; gap: 14px; background: #fff; border: 1px solid rgba(13,27,42,.09); border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; }
        .tf-current-icon { width: 40px; height: 40px; border-radius: 8px; background: rgba(201,168,76,.15); color: #9a7b2c; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .tf-current-label { font-size: 12px; color: #8A9BAD; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
        .tf-current-room { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 600; color: #0D1B2A; margin-top: 2px; }

        .tf-panel { background: #fff; border: 1px solid rgba(13,27,42,.09); border-radius: 12px; overflow: hidden; margin-bottom: 24px; }
        .tf-panel-head { padding: 16px 20px; border-bottom: 1px solid rgba(13,27,42,.09); font-family: 'Fraunces', serif; font-size: 16px; font-weight: 600; color: #0D1B2A; }
        .tf-panel-body { padding: 20px; }

        .tf-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .tf-field-label { font-size: 12px; font-weight: 700; color: #0D1B2A; }
        .tf-select, .tf-textarea { width: 100%; border: 1px solid rgba(13,27,42,.15); border-radius: 8px; background: #fbfaf8; color: #0D1B2A; outline: none; font-size: 13.5px; font-family: 'DM Sans', sans-serif; transition: border-color .15s, background .15s; }
        .tf-select { height: 42px; padding: 0 12px; }
        .tf-textarea { padding: 11px 12px; resize: vertical; min-height: 90px; line-height: 1.6; }
        .tf-select:focus, .tf-textarea:focus { border-color: #c9a84c; background: #fff; }

        .tf-form-actions { display: flex; gap: 10px; }
        .tf-btn-cancel { flex: 1; padding: 11px; border: 1px solid rgba(13,27,42,.15); border-radius: 8px; background: transparent; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: #0D1B2A; transition: background .15s; }
        .tf-btn-cancel:hover { background: #F5F3EF; }
        .tf-btn-submit { flex: 2; padding: 11px; background: #0D1B2A; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600; transition: all .18s; }
        .tf-btn-submit:hover:not(:disabled) { background: #1A2E42; }
        .tf-btn-submit:disabled { opacity: .55; cursor: not-allowed; }

        .tf-scroll { overflow-x: auto; }
        .tf-table { width: 100%; border-collapse: collapse; text-align: left; min-width: 720px; }
        .tf-table thead tr { background: #FAFAF9; border-bottom: 1px solid rgba(13,27,42,.09); }
        .tf-table th { padding: 13px 18px; font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: #8A9BAD; }
        .tf-table td { padding: 15px 18px; border-bottom: 1px solid rgba(13,27,42,.05); vertical-align: middle; font-size: 13.5px; color: #37485c; }
        .tf-table tbody tr:last-child td { border-bottom: none; }
        .tf-room-name { font-weight: 600; color: #0D1B2A; }
        .tf-reason { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .tf-badge { display: inline-flex; align-items: center; padding: 5px 12px; border-radius: 100px; font-size: 12px; font-weight: 600; white-space: nowrap; }
        .tf-badge--pending { background: rgba(245,158,11,.12); color: #d97706; }
        .tf-badge--approved { background: rgba(34,197,94,.12); color: #16a34a; }
        .tf-badge--rejected { background: rgba(239,68,68,.12); color: #dc2626; }
        .tf-badge--cancelled { background: rgba(13,27,42,.07); color: #64748b; }

        .tf-cancel-btn { font-size: 12.5px; font-weight: 600; color: #dc2626; padding: 7px 14px; border: 1px solid rgba(239,68,68,.25); border-radius: 8px; background: #fff; cursor: pointer; transition: all .15s; }
        .tf-cancel-btn:hover { background: rgba(239,68,68,.06); border-color: rgba(239,68,68,.4); }

        .tf-empty { padding: 48px 24px; text-align: center; color: #6b7f92; font-size: 13.5px; }
        .tf-note { padding: 12px 16px; border-radius: 8px; background: rgba(245,158,11,.08); border: 1px solid rgba(245,158,11,.2); color: #92600a; font-size: 13px; margin-bottom: 24px; line-height: 1.6; }
      `}</style>

      {/* Hero */}
      <div className="tf-hero">
        <div>
          <div className="tf-hero-title">Đổi phòng</div>
          <div className="tf-hero-sub">
            Gửi yêu cầu chuyển sang phòng khác còn chỗ trống. Ban quản lý sẽ xem xét và phản hồi qua thông báo.
          </div>
        </div>
        <button
          type="button"
          className="tf-hero-btn"
          disabled={!profile?.room || hasPending}
          onClick={() => setShowForm((v) => !v)}
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Yêu cầu đổi phòng
        </button>
      </div>

      {/* Trạng thái chặn */}
      {!loading && !profile?.room && (
        <div className="tf-note">
          Bạn chưa được xếp phòng nên chưa thể yêu cầu đổi phòng. Hãy đăng ký phòng trước nhé.
        </div>
      )}
      {!loading && hasPending && (
        <div className="tf-note">
          Bạn đang có một yêu cầu đổi phòng chờ duyệt. Hủy yêu cầu đó nếu muốn tạo yêu cầu mới.
        </div>
      )}

      {/* Phòng hiện tại */}
      {profile?.room && (
        <div className="tf-current">
          <div className="tf-current-icon">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <div className="tf-current-label">Phòng hiện tại</div>
            <div className="tf-current-room">{roomLabel(profile.room)}</div>
          </div>
        </div>
      )}

      {/* Form yêu cầu */}
      {showForm && profile?.room && !hasPending && (
        <div className="tf-panel">
          <div className="tf-panel-head">Tạo yêu cầu đổi phòng</div>
          <div className="tf-panel-body">
            <form onSubmit={handleSubmit}>
              <div className="tf-field">
                <label className="tf-field-label" htmlFor="tf-room">Phòng muốn chuyển đến</label>
                <select
                  id="tf-room"
                  className="tf-select"
                  value={toRoomId}
                  onChange={(e) => setToRoomId(e.target.value)}
                  required
                >
                  <option value="">— Chọn phòng còn chỗ trống —</option>
                  {selectableRooms.map((room) => (
                    <option key={room._id} value={room._id}>
                      {room.name} · Tòa {room.building} · Tầng {room.floor} · {room.price.toLocaleString("vi-VN")}đ/tháng
                      {room.capacity != null && room.currentOccupancy != null
                        ? ` (còn ${room.capacity - room.currentOccupancy} chỗ)`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="tf-field">
                <label className="tf-field-label" htmlFor="tf-reason">Lý do đổi phòng</label>
                <textarea
                  id="tf-reason"
                  className="tf-textarea"
                  placeholder="Ví dụ: muốn ở cùng tòa với bạn học, phòng hiện tại quá ồn..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>
              <div className="tf-form-actions">
                <button type="button" className="tf-btn-cancel" onClick={() => setShowForm(false)}>
                  Đóng
                </button>
                <button type="submit" className="tf-btn-submit" disabled={submitting}>
                  {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lịch sử yêu cầu */}
      <div className="tf-panel">
        <div className="tf-panel-head">Lịch sử yêu cầu</div>
        {loading ? (
          <div className="tf-empty">Đang tải dữ liệu...</div>
        ) : transfers.length === 0 ? (
          <div className="tf-empty">Bạn chưa có yêu cầu đổi phòng nào.</div>
        ) : (
          <div className="tf-scroll">
            <table className="tf-table">
              <thead>
                <tr>
                  <th>Từ phòng</th>
                  <th>Đến phòng</th>
                  <th>Lý do</th>
                  <th>Ngày gửi</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t._id}>
                    <td className="tf-room-name">{roomLabel(t.fromRoom)}</td>
                    <td className="tf-room-name">{roomLabel(t.toRoom)}</td>
                    <td><span className="tf-reason" title={t.reason}>{t.reason}</span></td>
                    <td>{new Date(t.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td>
                      <span className={`tf-badge tf-badge--${t.status.toLowerCase()}`}>
                        {STATUS_LABEL[t.status]}
                      </span>
                    </td>
                    <td>
                      {t.status === "PENDING" && (
                        <button type="button" className="tf-cancel-btn" onClick={() => void handleCancel(t._id)}>
                          Hủy yêu cầu
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
