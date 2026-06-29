"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { apiClient } from "../utils/apiClient"; // Bắt buộc dùng apiClient

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
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

    // Sử dụng apiClient chuẩn để fetch
    apiClient
      .get("/notifications/me")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setNotifications(data);
          setUnreadCount(data.filter((n) => !n.isRead).length);
        }
      })
      .catch((err) => console.error("Lỗi gọi API thông báo:", err));

    // Lấy URL động cho Socket.IO tránh hardcode
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const socketUrl = rawApiUrl.replace(/\/api$/, "");

    socketRef.current = io(socketUrl, {
      auth: { token },
    });

    socketRef.current.on("connect", () => {
      console.log("Socket.IO đã kết nối thành công mảng Real-time!");
    });

    socketRef.current.on("newNotification", (newNotif: Notification) => {
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

  // TÍNH NĂNG HOVER TO READ
  const handleHoverRead = async (notifId: string, isRead: boolean) => {
    if (isRead) return;

    // Optimistic UI: Cập nhật giao diện ngay lập tức cho người dùng
    setNotifications((prev) =>
      prev.map((n) => (n._id === notifId ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // Gọi API ngầm để lưu trạng thái
    try {
      await apiClient.patch(`/notifications/${notifId}/read`);
    } catch (err) {
      console.error("Lỗi đánh dấu đã đọc:", err);
    }
  };

  const handleClickNotif = (link?: string) => {
    setIsOpen(false);
    if (link) router.push(link);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 border shadow-sm ${
          isOpen
            ? "bg-amber-50 text-amber-600 border-amber-200"
            : "bg-white text-slate-500 hover:bg-slate-50 border-slate-200"
        }`}
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
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold h-[18px] min-w-[18px] rounded-full flex items-center justify-center px-1 border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-[50px] right-0 w-[340px] bg-white rounded-2xl border border-slate-100 shadow-[0_10px_40px_rgba(13,27,42,0.12)] z-[99999] overflow-hidden">
          <div className="px-4 py-3.5 border-b border-slate-100 bg-white flex justify-between items-center">
            <span className="font-bold text-[15px] text-slate-900">Thông báo</span>
            {unreadCount > 0 && (
              <span className="text-[12px] text-amber-600 font-semibold">{unreadCount} chưa đọc</span>
            )}
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-[13px]">
                Không có thông báo nào.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onMouseEnter={() => handleHoverRead(notif._id, notif.isRead)}
                  onClick={() => handleClickNotif(notif.link)}
                  className={`px-4 py-3.5 border-b border-slate-50 cursor-pointer flex gap-3 transition-colors duration-200 ${
                    !notif.isRead ? "bg-sky-50/50" : "bg-white hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 transition-colors duration-200 ${
                      !notif.isRead ? "bg-sky-600" : "bg-transparent"
                    }`}
                  />
                  <div className="flex-1">
                    <div
                      className={`text-[13.5px] leading-snug text-slate-900 ${
                        !notif.isRead ? "font-bold" : "font-medium"
                      }`}
                    >
                      {notif.title}
                    </div>
                    <div className="text-[12.5px] text-slate-500 mt-1 leading-relaxed">
                      {notif.message}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2 font-medium">
                      {new Date(notif.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}