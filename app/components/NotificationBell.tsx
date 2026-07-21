"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
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

// ─── Biểu tượng dạng khối (solid) cho từng loại thông báo ───
const ICONS: Record<string, React.ReactNode> = {
  BOOKING: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 11-1.06 1.06l-.44-.43v6.09A1.75 1.75 0 0118 21h-3.25a.75.75 0 01-.75-.75V16.5a1 1 0 00-1-1h-2a1 1 0 00-1 1v3.75a.75.75 0 01-.75.75H6a1.75 1.75 0 01-1.75-1.75v-6.09l-.44.43a.75.75 0 01-1.06-1.06l8.72-8.69z" />
    </svg>
  ),
  INVOICE: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M5.25 2.25a.75.75 0 00-.75.75v18a.75.75 0 001.14.64L9 20.16l3.36 1.48a.75.75 0 00.6 0l3.36-1.48 2.36 1.48A.75.75 0 0021 21V3a.75.75 0 00-.75-.75H5.25zM8.25 6.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5zm0 3.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5zm0 3.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 010-1.5z" />
    </svg>
  ),
  MAINTENANCE: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 6.75a5.25 5.25 0 016.775-5.025.75.75 0 01.313 1.248l-3.32 3.319c.063.475.276.934.641 1.299.365.365.824.578 1.3.64l3.318-3.319a.75.75 0 011.248.313 5.25 5.25 0 01-5.472 6.756c-1.018-.086-1.87.1-2.309.634L7.344 21.3A3.298 3.298 0 112.7 16.657l8.684-7.151c.533-.44.72-1.291.634-2.309A5.342 5.342 0 0112 6.75z" />
    </svg>
  ),
  SYSTEM: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 2.25A6.75 6.75 0 005.25 9v.75a8.22 8.22 0 01-2.12 5.52.75.75 0 00.3 1.2c1.54.58 3.16 1 4.83 1.25a3.75 3.75 0 007.48 0 24.6 24.6 0 004.83-1.25.75.75 0 00.3-1.2 8.22 8.22 0 01-2.12-5.52V9A6.75 6.75 0 0012 2.25zM9.75 18a2.25 2.25 0 004.5 0 24.9 24.9 0 01-4.5 0z" />
    </svg>
  ),
};

// ─── Đã đồng bộ màu theo Navy/Gold Dormify ───
const TYPE_COLOR: Record<string, { solid: string; soft: string }> = {
  BOOKING: { solid: "#0D1B2A", soft: "rgba(13,27,42,0.08)" },     // Navy
  INVOICE: { solid: "#C9A84C", soft: "rgba(201,168,76,0.15)" },   // Gold
  MAINTENANCE: { solid: "#dc2626", soft: "rgba(220,38,38,0.1)" }, // Red
  SYSTEM: { solid: "#4A6580", soft: "#f1f5f9" },                  // Slate
};

function getType(type: string) {
  const key = type?.toUpperCase?.() as keyof typeof TYPE_COLOR;
  return {
    icon: ICONS[key] ?? ICONS.SYSTEM,
    color: TYPE_COLOR[key] ?? TYPE_COLOR.SYSTEM,
  };
}

// ─── Thời gian tương đối ───
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return "Vừa xong";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} phút`;
  const hour = Math.round(min / 60);
  if (hour < 24) return `${hour} giờ`;
  const day = Math.round(hour / 24);
  if (day < 7) return `${day} ngày`;
  const week = Math.round(day / 7);
  if (week < 5) return `${week} tuần`;
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const allNotificationsHref = pathname?.startsWith("/student") ? "/student/notifications" : null;

  // Chuỗi font chuẩn VN để chống gãy dấu
  const safeSerifFont = "'Playfair Display', 'Lora', 'Times New Roman', serif";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    apiClient
      .get("/notifications/me?page=1&limit=15")
      .then((res) => res.json())
      .then((payload) => {
        const list = Array.isArray(payload) ? payload : payload?.data;
        if (Array.isArray(list)) {
          setNotifications(list);
          setUnreadCount(
            typeof payload?.unreadCount === "number"
              ? payload.unreadCount
              : list.filter((n: Notification) => !n.isRead).length,
          );
        }
      })
      .catch((err) => console.error("Lỗi gọi API thông báo:", err));

    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const socketUrl = rawApiUrl.replace(/\/api$/, "");

    socketRef.current = io(socketUrl, { auth: { token } });

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

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  const hoverTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const timers = hoverTimers.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      Object.values(hoverTimers.current).forEach(clearTimeout);
      hoverTimers.current = {};
    }
  }, [isOpen]);

  const scheduleHoverRead = (notif: Notification) => {
    if (notif.isRead || hoverTimers.current[notif._id]) return;
    hoverTimers.current[notif._id] = setTimeout(() => {
      delete hoverTimers.current[notif._id];
      void markRead(notif._id, false);
    }, 500);
  };

  const cancelHoverRead = (notifId: string) => {
    const timer = hoverTimers.current[notifId];
    if (timer) {
      clearTimeout(timer);
      delete hoverTimers.current[notifId];
    }
  };

  const markRead = async (notifId: string, isRead: boolean) => {
    if (isRead) return;
    setNotifications((prev) => prev.map((n) => (n._id === notifId ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await apiClient.patch(`/notifications/${notifId}/read`);
    } catch (err) {
      console.error("Lỗi đánh dấu đã đọc:", err);
    }
  };

  const handleMarkAllRead = async (e?: ReactMouseEvent) => {
    e?.stopPropagation();
    if (unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await apiClient.patch("/notifications/read-all");
    } catch (err) {
      console.error("Lỗi đánh dấu tất cả đã đọc:", err);
    }
  };

  const handleClickNotif = (notif: Notification) => {
    cancelHoverRead(notif._id);
    void markRead(notif._id, notif.isRead);
    setIsOpen(false);
    if (notif.link) router.push(notif.link);
  };

  const handleDelete = async (e: ReactMouseEvent<HTMLButtonElement>, notifId: string) => {
    e.preventDefault();
    e.stopPropagation();
    cancelHoverRead(notifId);
    try {
      const res = await apiClient.delete(`/notifications/${notifId}`);
      if (!res.ok) throw new Error("Delete notification failed");
      const wasUnread = notifications.some((n) => n._id === notifId && !n.isRead);
      setNotifications((prev) => prev.filter((n) => n._id !== notifId));
      if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Lỗi xóa thông báo:", err);
    }
  };

  const badgeLabel = useMemo(() => (unreadCount > 9 ? "9+" : String(unreadCount)), [unreadCount]);

  return (
    <div className="relative" ref={dropdownRef}>
      <style>{`
        @keyframes nb-pop {
          0%   { opacity: 0; transform: translateY(-6px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes nb-ping {
          0%   { transform: scale(1);   opacity: 0.5; }
          75%  { transform: scale(2.2); opacity: 0;   }
          100% { transform: scale(2.2); opacity: 0;   }
        }
        .nb-panel { animation: nb-pop 0.2s cubic-bezier(0.22, 1, 0.36, 1); transform-origin: top right; }
        .nb-ping  { animation: nb-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .nb-scroll::-webkit-scrollbar { width: 6px; }
        .nb-scroll::-webkit-scrollbar-thumb { background: rgba(13,27,42,0.15); border-radius: 999px; }
        .nb-scroll::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      {/* Nút chuông */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Thông báo"
        title="Thông báo"
        className={`relative w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 ${
          isOpen
            ? "bg-[#0D1B2A] text-[#C9A84C]"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`}
      >
        <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.25A6.75 6.75 0 005.25 9v.75a8.22 8.22 0 01-2.12 5.52.75.75 0 00.3 1.2c1.54.58 3.16 1 4.83 1.25a3.75 3.75 0 007.48 0 24.6 24.6 0 004.83-1.25.75.75 0 00.3-1.2 8.22 8.22 0 01-2.12-5.52V9A6.75 6.75 0 0012 2.25zM9.75 18a2.25 2.25 0 004.5 0 24.9 24.9 0 01-4.5 0z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center">
            {!isOpen && <span className="nb-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A84C]" />}
            <span className="relative bg-[#C9A84C] text-[#0D1B2A] text-[10px] font-extrabold h-[18px] min-w-[18px] rounded-full flex items-center justify-center px-1 border-2 border-white shadow-sm font-sans">
              {badgeLabel}
            </span>
          </span>
        )}
      </button>

      {/* Bảng thông báo */}
      {isOpen && (
        <div className="nb-panel absolute top-[52px] right-0 w-[440px] bg-white border border-[#0D1B2A]/10 rounded-xl shadow-[0_12px_40px_rgba(13,27,42,0.12)] z-[99999] overflow-hidden">
          
          {/* Tiêu đề Panel */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-[#0D1B2A]/10 bg-slate-50/50">
            {/* SỬ DỤNG FONT AN TOÀN ĐỂ KHÔNG RỚT DẤU */}
            <h3 
              className="text-[18px] font-bold text-[#0D1B2A] flex items-center tracking-tight"
              style={{ fontFamily: safeSerifFont }}
            >
              Thông báo
              {unreadCount > 0 && (
                <span className="ml-2.5 bg-[#C9A84C]/15 text-[#7A5E1A] py-0.5 px-2.5 rounded-full text-[11px] font-bold font-sans" style={{ fontFamily: "inherit" }}>
                  {badgeLabel}
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[13px] font-sans font-medium text-[#C9A84C] hover:text-[#0D1B2A] transition-colors cursor-pointer"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* Danh sách */}
          <div className="nb-scroll max-h-[460px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-6 py-14 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.25A6.75 6.75 0 005.25 9v.75a8.22 8.22 0 01-2.12 5.52.75.75 0 00.3 1.2c1.54.58 3.16 1 4.83 1.25a3.75 3.75 0 007.48 0 24.6 24.6 0 004.83-1.25.75.75 0 00.3-1.2 8.22 8.22 0 01-2.12-5.52V9A6.75 6.75 0 0012 2.25zM9.75 18a2.25 2.25 0 004.5 0 24.9 24.9 0 01-4.5 0z" />
                  </svg>
                </div>
                <h4 
                  className="text-[16px] font-bold text-[#0D1B2A]"
                  style={{ fontFamily: safeSerifFont }}
                >
                  Chưa có thông báo
                </h4>
                <p className="text-[13.5px] font-sans text-slate-500 mt-1.5 leading-relaxed">
                  Cập nhật về phòng, hóa đơn và bảo trì sẽ hiện ở đây.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const t = getType(notif.type);
                return (
                  <div
                    key={notif._id}
                    onClick={() => handleClickNotif(notif)}
                    onMouseEnter={() => scheduleHoverRead(notif)}
                    onMouseLeave={() => cancelHoverRead(notif._id)}
                    className={`group relative flex items-start gap-4 px-5 py-4 cursor-pointer border-b border-[#0D1B2A]/5 transition-colors ${
                      notif.isRead ? "bg-transparent hover:bg-slate-50/80" : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    {/* Chấm chưa đọc */}
                    {!notif.isRead && (
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#C9A84C] group-hover:opacity-0 transition-opacity" />
                    )}

                    {/* Icon loại thông báo */}
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: t.color.soft, color: t.color.solid }}
                    >
                      <span className="w-5 h-5 flex">{t.icon}</span>
                    </div>

                    {/* Nội dung */}
                    <div className="flex-1 min-w-0 pr-8">
                      {/* TIÊU ĐỀ DÙNG FONT AN TOÀN */}
                      <h4
                        className={`text-[15px] leading-tight mb-1 truncate ${
                          notif.isRead ? "font-semibold text-[#0D1B2A] opacity-90" : "font-bold text-[#0D1B2A]"
                        }`}
                        style={{ fontFamily: safeSerifFont }}
                      >
                        {notif.title}
                      </h4>
                      {/* MÔ TẢ DÙNG FONT-SANS ĐỂ DỄ ĐỌC CHỮ NHỎ */}
                      <p className="line-clamp-2 text-[13.5px] font-sans leading-relaxed text-slate-500">
                        {notif.message}
                      </p>
                      <span
                        className={`text-[12px] font-sans mt-2 block ${
                          notif.isRead ? "font-medium text-slate-400" : "font-semibold text-[#C9A84C]"
                        }`}
                      >
                        {timeAgo(notif.createdAt)}
                      </span>
                    </div>

                    {/* Nút xóa hiện khi hover */}
                    <button
                      type="button"
                      title="Xóa thông báo"
                      aria-label="Xóa thông báo"
                      onClick={(e) => void handleDelete(e, notif._id)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                    >
                      <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 6h18m-2 0l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m4 0V4a2 2 0 012-2h2a2 2 0 012 2v2m-6 5v6m4-6v6" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Chân bảng */}
          {allNotificationsHref && notifications.length > 0 && (
            <div className="px-5 py-3.5 text-center border-t border-[#0D1B2A]/10 bg-slate-50/50">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push(allNotificationsHref);
                }}
                className="text-[14px] font-bold text-[#0D1B2A] hover:text-[#C9A84C] transition-colors cursor-pointer w-full"
                style={{ fontFamily: safeSerifFont }}
              >
                Xem tất cả
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}