"use client";

import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useRouter } from "next/navigation";

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

const Icons = {
  bell: (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  ),
  trash: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M3 6h18m-2 0l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m4 0V4a2 2 0 012-2h2a2 2 0 012 2v2m-6 5v6m4-6v6"
      />
    </svg>
  ),
};

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch("http://localhost:3001/api/notifications/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          setNotifications(await res.json());
        }
      } catch (error) {
        console.error("Loi tai thong bao:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchNotifications();
  }, []);

  const handleOpenNotification = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      const token = localStorage.getItem("token");

      try {
        await fetch(`http://localhost:3001/api/notifications/${notification._id}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });

        setNotifications((prev) =>
          prev.map((item) =>
            item._id === notification._id ? { ...item, isRead: true } : item,
          ),
        );
      } catch (error) {
        console.error("Loi cap nhat thong bao:", error);
      }
    }

    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleDeleteNotification = async (
    event: ReactMouseEvent<HTMLButtonElement>,
    notificationId: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3001/api/notifications/${notificationId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Delete notification failed");
      }

      setNotifications((prev) => prev.filter((item) => item._id !== notificationId));
    } catch (error) {
      console.error("Loi xoa thong bao:", error);
    }
  };

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <div className="nf-shell">
      <style>{`
        :root {
          --navy: #0D1B2A;
          --gold: #C9A84C;
          --border: rgba(13,27,42,0.09);
          --muted: #64748b;
          --white: #ffffff;
        }

        .nf-hero {
          background: linear-gradient(135deg, #0D1B2A 0%, #1A2E42 100%);
          border: 1px solid rgba(201,168,76,0.18);
          border-radius: 18px;
          padding: 24px 28px;
          color: var(--white);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
        }

        .nf-hero-title {
          font-family: 'Fraunces', serif;
          font-size: 28px;
          font-weight: 600;
          letter-spacing: -0.02em;
        }

        .nf-hero-sub {
          margin-top: 6px;
          color: rgba(255,255,255,0.72);
          font-size: 14px;
        }

        .nf-badge {
          min-width: 56px;
          height: 56px;
          padding: 0 16px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          color: #F8D97A;
          font-weight: 700;
        }

        .nf-list {
          display: grid;
          gap: 14px;
        }

        .nf-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 18px 20px;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
          box-shadow: 0 8px 24px rgba(13,27,42,0.04);
        }

        .nf-card:hover {
          transform: translateY(-1px);
          border-color: rgba(201,168,76,0.25);
          box-shadow: 0 12px 28px rgba(13,27,42,0.08);
        }

        .nf-card--unread {
          background: linear-gradient(180deg, rgba(2,132,199,0.05) 0%, #ffffff 100%);
        }

        .nf-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .nf-card-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 16px;
          font-weight: 700;
          color: var(--navy);
        }

        .nf-card-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #0284c7;
          display: inline-block;
          flex-shrink: 0;
        }

        .nf-card-time {
          color: var(--muted);
          font-size: 12px;
          white-space: nowrap;
        }

        .nf-card-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .nf-delete-btn {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid transparent;
          background: transparent;
          color: #94a3b8;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }

        .nf-delete-btn:hover {
          background: rgba(239,68,68,0.08);
          border-color: rgba(239,68,68,0.16);
          color: #dc2626;
        }

        .nf-card-message {
          margin-top: 10px;
          color: #334155;
          line-height: 1.6;
          font-size: 14px;
        }

        .nf-card-link {
          margin-top: 12px;
          color: #9a7b2c;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .nf-empty,
        .nf-loading {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 36px 24px;
          text-align: center;
          color: var(--muted);
          box-shadow: 0 8px 24px rgba(13,27,42,0.04);
        }
      `}</style>

      <section className="nf-hero">
        <div>
          <div className="nf-hero-title">Thông báo của bạn</div>
          <div className="nf-hero-sub">Xem cập nhật mới nhất về hóa đơn, hợp đồng và các thay đổi liên quan đến lưu trú.</div>
        </div>
        <div className="nf-badge">
          {Icons.bell}
          <span>{unreadCount}</span>
        </div>
      </section>

      {loading ? (
        <div className="nf-loading">Dang tai danh sach thong bao...</div>
      ) : notifications.length === 0 ? (
        <div className="nf-empty">Ban chua co thong bao nao.</div>
      ) : (
        <div className="nf-list">
          {notifications.map((notification) => (
            <article
              key={notification._id}
              className={`nf-card ${notification.isRead ? "" : "nf-card--unread"}`}
              onClick={() => void handleOpenNotification(notification)}
            >
              <div className="nf-card-top">
                <div className="nf-card-title">
                  {!notification.isRead && <span className="nf-card-dot" />}
                  <span>{notification.title}</span>
                </div>
                <div className="nf-card-actions">
                  <span className="nf-card-time">
                    {new Date(notification.createdAt).toLocaleString("vi-VN")}
                  </span>
                  <button
                    className="nf-delete-btn"
                    type="button"
                    title="Xoa thong bao"
                    aria-label="Xoa thong bao"
                    onClick={(event) => void handleDeleteNotification(event, notification._id)}
                  >
                    {Icons.trash}
                  </button>
                </div>
              </div>

              <div className="nf-card-message">{notification.message}</div>

              {notification.link && <div className="nf-card-link">Mo chi tiet</div>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
