"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// ─── Hộp thoại xác nhận dùng chung, thay cho window.confirm ──────────────────
// Cách dùng:
//   const confirmDialog = useConfirm();
//   const ok = await confirmDialog({ title: "...", message: "...", variant: "danger" });
//   if (!ok) return;

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** primary: điều hướng/duyệt (navy) · danger: xóa/từ chối/khóa (đỏ) */
  variant?: "primary" | "danger";
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm phải được dùng bên trong <ConfirmProvider>.");
  }
  return ctx;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  const settle = useCallback(
    (value: boolean) => {
      if (!pending) return;
      pending.resolve(value);
      setPending(null);
    },
    [pending],
  );

  // ESC để hủy, focus vào nút xác nhận khi mở
  useEffect(() => {
    if (!pending) return;
    confirmBtnRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") settle(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [pending, settle]);

  const isDanger = pending?.variant === "danger";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {pending && (
        <div
          className="cfd-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cfd-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) settle(false);
          }}
        >
          <style>{`
            @keyframes cfd-in {
              from { opacity: 0; transform: scale(0.96) translateY(6px); }
              to   { opacity: 1; transform: scale(1) translateY(0); }
            }
            .cfd-overlay { position: fixed; inset: 0; z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(13,27,42,0.45); backdrop-filter: blur(3px); }
            .cfd-modal { width: 100%; max-width: 400px; background: #fff; border-radius: 12px; box-shadow: 0 24px 60px rgba(13,27,42,0.3); padding: 26px 26px 22px; animation: cfd-in .18s cubic-bezier(.22,1,.36,1); font-family: 'DM Sans', sans-serif; }
            .cfd-icon { width: 46px; height: 46px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
            .cfd-icon--primary { background: rgba(13,27,42,0.07); color: #0D1B2A; }
            .cfd-icon--danger  { background: rgba(239,68,68,0.1); color: #dc2626; }
            .cfd-title { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 700; color: #0D1B2A; letter-spacing: -0.2px; }
            .cfd-message { margin-top: 8px; font-size: 13.5px; color: #5c6f82; line-height: 1.65; white-space: pre-line; }
            .cfd-actions { display: flex; gap: 10px; margin-top: 22px; }
            .cfd-btn { flex: 1; height: 42px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: all .15s; }
            .cfd-btn-cancel { border: 1px solid rgba(13,27,42,0.15); background: #fff; color: #0D1B2A; }
            .cfd-btn-cancel:hover { background: #F5F3EF; }
            .cfd-btn-confirm { border: none; color: #fff; }
            .cfd-btn-confirm--primary { background: #0D1B2A; }
            .cfd-btn-confirm--primary:hover { background: #1A2E42; }
            .cfd-btn-confirm--danger { background: #dc2626; }
            .cfd-btn-confirm--danger:hover { background: #b91c1c; }
            .cfd-btn:focus-visible { outline: 2px solid #C9A84C; outline-offset: 2px; }
          `}</style>

          <div className="cfd-modal">
            <div className={`cfd-icon ${isDanger ? "cfd-icon--danger" : "cfd-icon--primary"}`}>
              {isDanger ? (
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A2 2 0 004 21h16a2 2 0 001.89-2.96L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              ) : (
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            <h3 id="cfd-title" className="cfd-title">{pending.title}</h3>
            <p className="cfd-message">{pending.message}</p>

            <div className="cfd-actions">
              <button type="button" className="cfd-btn cfd-btn-cancel" onClick={() => settle(false)}>
                {pending.cancelLabel || "Hủy bỏ"}
              </button>
              <button
                type="button"
                ref={confirmBtnRef}
                className={`cfd-btn cfd-btn-confirm ${isDanger ? "cfd-btn-confirm--danger" : "cfd-btn-confirm--primary"}`}
                onClick={() => settle(true)}
              >
                {pending.confirmLabel || "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
