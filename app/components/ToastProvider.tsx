"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  text: string;
  title?: string;
}

interface ToastApi {
  show: (text: string, type?: ToastType, title?: string) => void;
  success: (text: string, title?: string) => void;
  error: (text: string, title?: string) => void;
  info: (text: string, title?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

// Hook dùng ở bất kỳ trang admin nào: const toast = useToast(); toast.success("...")
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast phải được dùng bên trong <ToastProvider>");
  }
  return ctx;
}

const DURATION = 4200; // ms trước khi tự đóng

const TYPE_META: Record<
  ToastType,
  { accent: string; tint: string; defaultTitle: string; icon: ReactNode }
> = {
  success: {
    accent: "#16a34a",
    tint: "rgba(34,197,94,0.12)",
    defaultTitle: "Thành công",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    accent: "#dc2626",
    tint: "rgba(239,68,68,0.12)",
    defaultTitle: "Có lỗi xảy ra",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8v5m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
  },
  info: {
    accent: "#C9A84C",
    tint: "rgba(201,168,76,0.16)",
    defaultTitle: "Thông báo",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 16v-5m0-3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

function ToastViewport({
  toasts,
  onClose,
}: {
  toasts: ToastItem[];
  onClose: (id: number) => void;
}) {
  return (
    <div className="adm-toast-viewport" aria-live="polite" aria-atomic="false">
      <style>{`
        .adm-toast-viewport {
          position: fixed; bottom: 24px; right: 24px; z-index: 100000;
          display: flex; flex-direction: column; gap: 12px;
          max-width: 380px; width: calc(100vw - 48px); pointer-events: none;
        }
        .adm-toast {
          pointer-events: auto;
          display: flex; align-items: flex-start; gap: 13px;
          background: #ffffff; border-radius: 14px;
          padding: 14px 14px 14px 16px;
          box-shadow: 0 12px 40px rgba(13,27,42,0.18), 0 2px 8px rgba(13,27,42,0.08);
          border: 1px solid rgba(13,27,42,0.06);
          position: relative; overflow: hidden;
          animation: admToastIn 0.34s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes admToastIn {
          0%   { opacity: 0; transform: translateX(40px) scale(0.96); }
          100% { opacity: 1; transform: translateX(0)    scale(1);    }
        }
        .adm-toast::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
          background: var(--adm-toast-accent);
        }
        .adm-toast-icon {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: var(--adm-toast-tint); color: var(--adm-toast-accent);
        }
        .adm-toast-body { flex: 1; min-width: 0; padding-top: 1px; }
        .adm-toast-title { font-size: 13.5px; font-weight: 700; color: #0D1B2A; line-height: 1.3; }
        .adm-toast-text { font-size: 12.5px; color: #52627a; line-height: 1.5; margin-top: 3px; word-break: break-word; }
        .adm-toast-close {
          flex-shrink: 0; width: 24px; height: 24px; border-radius: 7px; border: none;
          background: transparent; color: #94a3b8; cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: background 0.15s, color 0.15s;
        }
        .adm-toast-close:hover { background: rgba(13,27,42,0.06); color: #0D1B2A; }
        .adm-toast-progress {
          position: absolute; left: 0; bottom: 0; height: 3px;
          background: var(--adm-toast-accent); opacity: 0.55;
          animation: admToastProgress ${DURATION}ms linear forwards;
        }
        @keyframes admToastProgress { from { width: 100%; } to { width: 0%; } }
        @media (prefers-reduced-motion: reduce) {
          .adm-toast { animation: none; }
          .adm-toast-progress { animation: none; }
        }
      `}</style>

      {toasts.map((t) => {
        const meta = TYPE_META[t.type];
        return (
          <div
            key={t.id}
            className="adm-toast"
            role="status"
            style={
              {
                ["--adm-toast-accent" as string]: meta.accent,
                ["--adm-toast-tint" as string]: meta.tint,
              } as React.CSSProperties
            }
          >
            <div className="adm-toast-icon">{meta.icon}</div>
            <div className="adm-toast-body">
              <div className="adm-toast-title">{t.title || meta.defaultTitle}</div>
              <div className="adm-toast-text">{t.text}</div>
            </div>
            <button
              type="button"
              className="adm-toast-close"
              aria-label="Đóng"
              onClick={() => onClose(t.id)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <span className="adm-toast-progress" />
          </div>
        );
      })}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (text: string, type: ToastType = "success", title?: string) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev.slice(-3), { id, type, text, title }]); // giữ tối đa 4 toast
      setTimeout(() => remove(id), DURATION);
    },
    [remove],
  );

  // show đã ổn định qua useCallback nên api cũng ổn định — không tái tạo mỗi lần render
  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (text, title) => show(text, "success", title),
      error: (text, title) => show(text, "error", title),
      info: (text, title) => show(text, "info", title),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onClose={remove} />
    </ToastContext.Provider>
  );
}
