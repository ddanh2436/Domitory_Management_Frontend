"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RoleGuard from "../../components/RoleGuard";
import { apiClient } from "../../utils/apiClient";

interface Booking {
  _id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  createdAt: string;
  room?: { name?: string; building?: string; floor?: number };
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icons = {
  plus: <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" /></svg>,
  search: <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  doc: <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
};

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<Booking["status"], { label: string; color: string; bg: string; border: string }> = {
  PENDING:   { label: "Đang chờ duyệt", color: "#b45309", bg: "rgba(245,158,11,.1)", border: "rgba(245,158,11,.22)" },
  APPROVED:  { label: "Đã duyệt",       color: "#16a34a", bg: "rgba(34,197,94,.1)",  border: "rgba(34,197,94,.2)"  },
  REJECTED:  { label: "Bị từ chối",     color: "#dc2626", bg: "rgba(239,68,68,.1)",  border: "rgba(239,68,68,.2)"  },
  CANCELLED: { label: "Đã hủy",         color: "#64748b", bg: "rgba(100,116,139,.1)", border: "rgba(100,116,139,.2)" },
};

function StatusBadge({ status }: { status: Booking["status"] }) {
  const c = STATUS_CFG[status];
  if (!c) return null;
  return (
    <span className="bk-badge" style={{ color: c.color, background: c.bg, border: `1px solid ${c.border}` }}>
      {c.label}
    </span>
  );
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMyBookings = async () => {
    try {
      const response = await apiClient.get("/bookings/me");
      const payload = await response.json();

      if (response.ok) {
        setBookings(payload.data || payload || []);
      } else {
        setError(payload.message || "Không thể tải danh sách đơn đăng ký.");
      }
    } catch (err) {
      setError("Lỗi kết nối hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Bạn có chắc chắn muốn hủy đơn đăng ký này?")) return;

    try {
      const response = await apiClient.patch(`/bookings/${bookingId}/cancel`);
      const data = await response.json();

      if (response.ok) {
        fetchMyBookings(); // Tải lại dữ liệu
      } else {
        alert(`Lỗi: ${data.message}`);
      }
    } catch (err) {
      alert("Lỗi kết nối khi hủy đơn.");
    }
  };

  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;

  return (
    <RoleGuard allowedRoles={["STUDENT"]}>
      <div className="bk-page">
        <style>{`
          :root {
            --navy:    #0D1B2A;
            --gold:    #C9A84C;
            --gold-b:  rgba(201,168,76,0.25);
            --white:   #ffffff;
            --muted:   #8A9BAD;
            --border:  rgba(13,27,42,0.09);
          }

          /* ── HERO ── */
          .bk-hero {
            background: linear-gradient(135deg, #0D1B2A 0%, #1A2E42 100%);
            border: 1px solid var(--gold-b);
            border-radius: 18px;
            padding: 24px 28px;
            color: var(--white);
            display: flex; align-items: center; justify-content: space-between;
            gap: 16px; flex-wrap: wrap; margin-bottom: 22px;
            position: relative; overflow: hidden;
          }
          .bk-hero-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(201,168,76,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,.04) 1px,transparent 1px); background-size:40px 40px; pointer-events:none; }
          .bk-hero-left { position: relative; z-index: 1; }
          .bk-hero-title { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 700; letter-spacing: -.3px; }
          .bk-hero-sub { margin-top: 6px; color: rgba(255,255,255,.6); font-size: 13.5px; max-width: 460px; line-height: 1.6; }
          .bk-hero-btn {
            position: relative; z-index: 1;
            display: inline-flex; align-items: center; gap: 8px;
            background: var(--gold); color: var(--navy);
            border: none; padding: 11px 20px; border-radius: 10px;
            font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 13.5px;
            text-decoration: none; cursor: pointer; transition: all .18s;
          }
          .bk-hero-btn:hover { background: #D9B85C; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(201,168,76,.35); }

          /* ── ERROR ── */
          .bk-error { padding: 14px 18px; background: rgba(239,68,68,.08); color: #b91c1c; border: 1px solid rgba(239,68,68,.2); border-radius: 12px; margin-bottom: 20px; font-size: 13.5px; font-weight: 500; }

          /* ── TABLE CARD ── */
          .bk-card { background: var(--white); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(13,27,42,.04); }
          .bk-scroll { overflow-x: auto; }
          .bk-table { width: 100%; border-collapse: collapse; text-align: left; min-width: 640px; }
          .bk-table thead tr { background: #FAFAF9; border-bottom: 1px solid var(--border); }
          .bk-table th { padding: 14px 20px; font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }
          .bk-table td { padding: 16px 20px; border-bottom: 1px solid rgba(13,27,42,.05); vertical-align: middle; }
          .bk-table tbody tr:last-child td { border-bottom: none; }
          .bk-table tbody tr { transition: background .15s; }
          .bk-table tbody tr:hover { background: #FBFAF8; }
          .bk-room-name { font-family: 'Fraunces', serif; font-size: 15.5px; font-weight: 600; color: var(--navy); }
          .bk-room-loc { font-size: 12px; color: var(--muted); margin-top: 2px; }
          .bk-date { font-size: 13.5px; color: #4A6580; }
          .bk-badge { display: inline-flex; align-items: center; padding: 5px 12px; border-radius: 100px; font-size: 12px; font-weight: 600; white-space: nowrap; }

          .bk-cancel-btn { font-size: 12.5px; font-weight: 600; color: #dc2626; padding: 7px 14px; border: 1px solid rgba(239,68,68,.25); border-radius: 9px; background: var(--white); cursor: pointer; transition: all .15s; }
          .bk-cancel-btn:hover { background: rgba(239,68,68,.06); border-color: rgba(239,68,68,.4); }
          .bk-na { font-size: 12.5px; color: var(--muted); font-style: italic; }

          /* ── EMPTY ── */
          .bk-empty { padding: 60px 24px; text-align: center; }
          .bk-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: #F5F3EF; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; color: var(--muted); }
          .bk-empty-title { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 600; color: var(--navy); margin-bottom: 8px; }
          .bk-empty-sub { font-size: 13.5px; color: var(--muted); line-height: 1.6; max-width: 340px; margin: 0 auto 22px; }
          .bk-empty-link { display: inline-flex; align-items: center; gap: 7px; padding: 10px 20px; background: var(--navy); color: #fff; border-radius: 9px; text-decoration: none; font-size: 13.5px; font-weight: 500; transition: background .15s; }
          .bk-empty-link:hover { background: #1A2E42; }

          /* ── SKELETON ── */
          .bk-sk { display: inline-block; border-radius: 4px; background: linear-gradient(90deg,#EDE9E3 25%,#E4E0D8 50%,#EDE9E3 75%); background-size: 400% 100%; animation: bkShimmer 1.4s ease infinite; }
          @keyframes bkShimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }

          @media (max-width: 640px) {
            .bk-hero { flex-direction: column; align-items: flex-start; }
            .bk-hero-btn { width: 100%; justify-content: center; }
          }
        `}</style>

        {/* Hero */}
        <div className="bk-hero">
          <div className="bk-hero-grid" />
          <div className="bk-hero-left">
            <div className="bk-hero-title">Lịch sử đăng ký phòng</div>
            <div className="bk-hero-sub">Theo dõi tình trạng các đơn yêu cầu lưu trú của bạn{pendingCount > 0 ? ` — hiện có ${pendingCount} đơn đang chờ duyệt.` : "."}</div>
          </div>
          <Link href="/student/book-room" className="bk-hero-btn">
            {Icons.plus} Đặt phòng mới
          </Link>
        </div>

        {error && <div className="bk-error">{error}</div>}

        {loading ? (
          <div className="bk-card">
            <div className="bk-scroll">
              <table className="bk-table">
                <thead>
                  <tr>
                    <th>Phòng yêu cầu</th>
                    <th>Ngày tạo đơn</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map((i) => (
                    <tr key={i}>
                      <td><span className="bk-sk" style={{ width: 140, height: 16 }} /><br /><span className="bk-sk" style={{ width: 90, height: 11, marginTop: 6 }} /></td>
                      <td><span className="bk-sk" style={{ width: 120, height: 14 }} /></td>
                      <td><span className="bk-sk" style={{ width: 90, height: 24, borderRadius: 100 }} /></td>
                      <td><span className="bk-sk" style={{ width: 70, height: 30, borderRadius: 9 }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bk-card">
            <div className="bk-empty">
              <div className="bk-empty-icon">{Icons.doc}</div>
              <div className="bk-empty-title">Chưa có đơn đăng ký nào</div>
              <div className="bk-empty-sub">Bạn chưa gửi yêu cầu lưu trú nào. Hãy khám phá các phòng còn trống và đăng ký để bắt đầu.</div>
              <Link href="/student/book-room" className="bk-empty-link">{Icons.search} Tìm & Đặt phòng</Link>
            </div>
          </div>
        ) : (
          <div className="bk-card">
            <div className="bk-scroll">
              <table className="bk-table">
                <thead>
                  <tr>
                    <th>Phòng yêu cầu</th>
                    <th>Ngày tạo đơn</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking._id}>
                      <td>
                        <div className="bk-room-name">Phòng {booking.room?.name || "N/A"}</div>
                        <div className="bk-room-loc">Tòa {booking.room?.building} • Tầng {booking.room?.floor}</div>
                      </td>
                      <td className="bk-date">
                        {new Date(booking.createdAt).toLocaleString("vi-VN")}
                      </td>
                      <td>
                        <StatusBadge status={booking.status} />
                      </td>
                      <td>
                        {booking.status === "PENDING" ? (
                          <button onClick={() => handleCancelBooking(booking._id)} className="bk-cancel-btn">
                            Hủy đơn
                          </button>
                        ) : (
                          <span className="bk-na">Không khả dụng</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
