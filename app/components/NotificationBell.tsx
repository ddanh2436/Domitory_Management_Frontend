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

// ─── Biểu tượng dạng khối (solid) cho từng loại thông báo — thân thiện như Facebook ───
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

const TYPE_COLOR: Record<string, { solid: string; soft: string }> = {
  BOOKING: { solid: "#2563eb", soft: "#dbeafe" },
  INVOICE: { solid: "#16a34a", soft: "#dcfce7" },
  MAINTENANCE: { solid: "#ea580c", soft: "#ffedd5" },
  SYSTEM: { solid: "#0D1B2A", soft: "#e2e8f0" },
};

function getType(type: string) {
  const key = type?.toUpperCase?.() as keyof typeof TYPE_COLOR;
  return {
    icon: ICONS[key] ?? ICONS.SYSTEM,
    color: TYPE_COLOR[key] ?? TYPE_COLOR.SYSTEM,
  };
}

// ─── Thời gian tương đối kiểu "5 phút" (rút gọn như Facebook) ───
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

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
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await Promise.all(unread.map((n) => apiClient.patch(`/notifications/${n._id}/read`)));
    } catch (err) {
      console.error("Lỗi đánh dấu tất cả đã đọc:", err);
    }
  };

  const handleClickNotif = (notif: Notification) => {
    void markRead(notif._id, notif.isRead);
    setIsOpen(false);
    if (notif.link) router.push(notif.link);
  };

  const handleDelete = async (e: ReactMouseEvent<HTMLButtonElement>, notifId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await apiClient.delete(`/notifications/${notifId}`);
      if (!res.ok) throw new Error("Delete notification failed");
      setNotifications((prev) => {
        const next = prev.filter((n) => n._id !== notifId);
        setUnreadCount(next.filter((n) => !n.isRead).length);
        return next;
      });
    } catch (err) {
      console.error("Loi xoa thong bao:", err);
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
          75%  { transform: scale(2);   opacity: 0;   }
          100% { transform: scale(2);   opacity: 0;   }
        }
        .nb-panel { animation: nb-pop 0.15s cubic-bezier(0.22, 1, 0.36, 1); transform-origin: top right; }
        .nb-ping  { animation: nb-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .nb-scroll::-webkit-scrollbar { width: 8px; }
        .nb-scroll::-webkit-scrollbar-thumb { background: rgba(13,27,42,0.16); border-radius: 999px; border: 2px solid #fff; }
        .nb-scroll::-webkit-scrollbar-track { background: transparent; }
        .nb-clamp2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

      {/* Nút chuông */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Thông báo"
        title="Thông báo"
        className={`relative w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${
          isOpen
            ? "bg-[#0D1B2A] text-[#C9A84C]"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`}
      >
        <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.25A6.75 6.75 0 005.25 9v.75a8.22 8.22 0 01-2.12 5.52.75.75 0 00.3 1.2c1.54.58 3.16 1 4.83 1.25a3.75 3.75 0 007.48 0 24.6 24.6 0 004.83-1.25.75.75 0 00.3-1.2 8.22 8.22 0 01-2.12-5.52V9A6.75 6.75 0 0012 2.25zM9.75 18a2.25 2.25 0 004.5 0 24.9 24.9 0 01-4.5 0z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center">
            {!isOpen && <span className="nb-ping absolute inline-flex h-full w-full rounded-full bg-red-500" />}
            <span className="relative bg-red-500 text-white text-[10px] font-bold h-[18px] min-w-[18px] rounded-full flex items-center justify-center px-1 border-2 border-white">
              {badgeLabel}
            </span>
          </span>
        )}
      </button>

      {/* Bảng thông báo kiểu Facebook */}
      {isOpen && (
        <div className="nb-panel absolute top-[52px] right-0 w-[368px] bg-white rounded-2xl shadow-[0_12px_48px_rgba(13,27,42,0.22)] ring-1 ring-black/5 z-[99999] overflow-hidden">
          {/* Tiêu đề */}
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <h3 className="text-[20px] font-extrabold text-slate-900 tracking-tight">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[13px] font-semibold text-[#2563eb] hover:underline cursor-pointer"
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          {/* Danh sách */}
          <div className="nb-scroll max-h-[440px] overflow-y-auto px-1.5 pb-1.5">
            {notifications.length === 0 ? (
              <div className="px-6 py-12 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-3">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.25A6.75 6.75 0 005.25 9v.75a8.22 8.22 0 01-2.12 5.52.75.75 0 00.3 1.2c1.54.58 3.16 1 4.83 1.25a3.75 3.75 0 007.48 0 24.6 24.6 0 004.83-1.25.75.75 0 00.3-1.2 8.22 8.22 0 01-2.12-5.52V9A6.75 6.75 0 0012 2.25zM9.75 18a2.25 2.25 0 004.5 0 24.9 24.9 0 01-4.5 0z" />
                  </svg>
                </div>
                <div className="text-[14px] font-semibold text-slate-600">Chưa có thông báo</div>
                <div className="text-[12.5px] text-slate-400 mt-1 leading-relaxed">
                  Cập nhật về phòng, hóa đơn và bảo trì sẽ hiện ở đây.
                </div>
              </div>
            ) : (
              notifications.map((notif) => {
                const t = getType(notif.type);
                return (
                  <div
                    key={notif._id}
                    onClick={() => handleClickNotif(notif)}
                    className="group relative flex items-center gap-3 px-2.5 py-2 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    {/* Ảnh đại diện tròn + huy hiệu loại ở góc */}
                    <div className="relative shrink-0">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center p-3.5"
                        style={{ background: t.color.soft, color: t.color.solid }}
                      >
                        {t.icon}
                      </div>
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center border-[2.5px] border-white p-1 text-white"
                        style={{ background: t.color.solid }}
                      >
                        {t.icon}
                      </div>
                    </div>

                    {/* Nội dung */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="nb-clamp2 text-[13.5px] leading-snug text-slate-800">
                        <span className={notif.isRead ? "font-semibold text-slate-900" : "font-bold text-slate-900"}>
                          {notif.title}
                        </span>{" "}
                        <span className={notif.isRead ? "text-slate-500" : "text-slate-600"}>{notif.message}</span>
                      </div>
                      <div
                        className={`text-[12px] mt-1 font-semibold ${
                          notif.isRead ? "text-slate-400" : "text-[#2563eb]"
                        }`}
                      >
                        {timeAgo(notif.createdAt)}
                      </div>
                    </div>

                    {/* Chấm chưa đọc */}
                    {!notif.isRead && (
                      <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-[#2563eb] group-hover:opacity-0 transition-opacity" />
                    )}

                    {/* Nút xóa hiện khi hover */}
                    <button
                      type="button"
                      title="Xóa thông báo"
                      aria-label="Xóa thông báo"
                      onClick={(e) => void handleDelete(e, notif._id)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-md text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-slate-100 hover:text-red-600 transition-all"
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
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push(allNotificationsHref);
              }}
              className="w-full px-4 py-3 text-center text-[13px] font-semibold text-[#2563eb] hover:bg-slate-50 border-t border-slate-100 transition-colors cursor-pointer"
            >
              Xem tất cả
            </button>
          )}
        </div>
      )}
    </div>
  );
}
