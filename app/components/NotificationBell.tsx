"use client";

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

function TrashIcon() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M3 6h18m-2 0l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m4 0V4a2 2 0 012-2h2a2 2 0 012 2v2m-6 5v6m4-6v6"
      />
    </svg>
  );
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:3001/api/notifications/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          console.log("Da tai danh sach thong bao tu DB:", data);
          setNotifications(data);
          setUnreadCount(data.filter((n) => !n.isRead).length);
        }
      })
      .catch((err) => console.error("Loi goi API thong bao:", err));

    socketRef.current = io("http://localhost:3001", {
      auth: { token },
    });

    socketRef.current.on("connect", () => {
      console.log("Socket.IO da ket noi thanh cong mang Real-time!");
    });

    socketRef.current.on("newNotification", (newNotif: Notification) => {
      console.log("Nhan duoc 1 thong bao REAL-TIME moi:", newNotif);
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      socketRef.current?.disconnect();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleHoverRead = (notifId: string, isRead: boolean) => {
    if (isRead) return;

    const token = localStorage.getItem("token");
    fetch(`http://localhost:3001/api/notifications/${notifId}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }).catch((err) => console.error("Loi danh dau da doc:", err));

    setNotifications((prev) =>
      prev.map((n) => (n._id === notifId ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleClickNotif = (link?: string) => {
    setIsOpen(false);
    if (link) router.push(link);
  };

  const handleDeleteNotification = async (
    e: ReactMouseEvent<HTMLButtonElement>,
    notifId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:3001/api/notifications/${notifId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Delete notification failed");
      }

      setNotifications((prev) => {
        const next = prev.filter((n) => n._id !== notifId);
        setUnreadCount(next.filter((n) => !n.isRead).length);
        return next;
      });
    } catch (err) {
      console.error("Loi xoa thong bao:", err);
    }
  };

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button
        onClick={() => {
          console.log("Trang thai bam chuong hien tai:", !isOpen);
          setIsOpen(!isOpen);
        }}
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          border: "1px solid rgba(13,27,42,0.15)",
          background: isOpen ? "#F5F3EF" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: isOpen ? "#C9A84C" : "#8A9BAD",
          padding: "8px",
          position: "relative",
        }}
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "#ef4444",
              color: "white",
              fontSize: "10px",
              fontWeight: "bold",
              height: "16px",
              minWidth: "16px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              border: "2px solid white",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "45px",
            right: "0",
            width: "320px",
            background: "white",
            borderRadius: "12px",
            border: "1px solid rgba(0,0,0,0.1)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            zIndex: 99999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #f1f5f9",
              fontWeight: "bold",
              fontSize: "14px",
              background: "#f8fafc",
              color: "#0F172A",
            }}
          >
            Thông báo mới nhận
          </div>
          <div style={{ maxHeight: "320px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: "30px 20px",
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                Không có thông báo nào.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onMouseEnter={() => handleHoverRead(notif._id, notif.isRead)}
                  onClick={() => handleClickNotif(notif.link)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f8fafc",
                    cursor: "pointer",
                    background: !notif.isRead ? "rgba(2,132,199,0.05)" : "transparent",
                    display: "flex",
                    gap: "10px",
                    transition: "background 0.2s",
                  }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: !notif.isRead ? "#0284c7" : "transparent",
                      marginTop: "6px",
                      transition: "background 0.2s",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: !notif.isRead ? "700" : "500",
                        color: "#1E293B",
                      }}
                    >
                      {notif.title}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                      {notif.message}
                    </div>
                    <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "6px" }}>
                      {new Date(notif.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                  <button
                    type="button"
                    title="Xoa thong bao"
                    aria-label="Xoa thong bao"
                    onClick={(e) => void handleDeleteNotification(e, notif._id)}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      border: "1px solid transparent",
                      background: "transparent",
                      color: "#94a3b8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(239,68,68,0.08)";
                      e.currentTarget.style.borderColor = "rgba(239,68,68,0.16)";
                      e.currentTarget.style.color = "#dc2626";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.borderColor = "transparent";
                      e.currentTarget.style.color = "#94a3b8";
                    }}
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
