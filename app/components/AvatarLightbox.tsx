"use client";

import { useEffect, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";

interface AvatarLightboxProps {
  name?: string;
  avatar?: string;
  size?: number;
  /** Style bổ sung, gộp lên trên style mặc định (dùng cho hiệu ứng xếp chồng…) */
  style?: CSSProperties;
}

/**
 * Avatar bấm được để phóng to.
 * - Có ảnh: hiện ảnh, con trỏ "zoom-in", bấm mở lightbox toàn màn hình.
 * - Không có ảnh: hiện chữ cái đầu của tên (không mở lightbox vì không có gì để phóng to).
 *
 * Overlay được render bằng portal ra <body> để không bị dính vào phần tử cha có
 * transform (thẻ phòng dùng transform khi hover) làm hỏng position: fixed.
 */
export default function AvatarLightbox({ name, avatar, size = 46, style }: AvatarLightboxProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);

    // Khóa cuộn nền khi đang mở lightbox
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const baseDim: CSSProperties = { width: size, height: size };

  const handleOpen = (e: ReactMouseEvent) => {
    // Chặn nổi bọt để không kích hoạt click của thẻ phòng / hàng bảng bên ngoài
    e.stopPropagation();
    if (avatar) setOpen(true);
  };

  return (
    <>
      {avatar ? (
        <img
          src={avatar}
          alt={name || "avatar"}
          title="Bấm để phóng to ảnh"
          onClick={handleOpen}
          style={{
            ...baseDim,
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid rgba(201,168,76,0.45)",
            background: "#f1f5f9",
            cursor: "zoom-in",
            ...style,
          }}
        />
      ) : (
        <div
          title={name}
          style={{
            ...baseDim,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0D1B2A",
            color: "#C9A84C",
            fontWeight: 700,
            fontFamily: "'Fraunces', serif",
            fontSize: Math.round(size * 0.4),
            ...style,
          }}
        >
          {name ? name.charAt(0).toUpperCase() : "S"}
        </div>
      )}

      {open &&
        avatar &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(13,27,42,0.82)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10000,
              padding: 24,
              animation: "avatarLightboxFade 0.15s ease",
            }}
          >
            <style>{`
              @keyframes avatarLightboxFade { from { opacity: 0; } to { opacity: 1; } }
              @keyframes avatarLightboxPop { from { transform: scale(0.94); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>

            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                animation: "avatarLightboxPop 0.18s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng"
                title="Đóng (Esc)"
                style={{
                  position: "absolute",
                  top: -14,
                  right: -14,
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "none",
                  background: "#fff",
                  color: "#0D1B2A",
                  fontSize: 20,
                  lineHeight: 1,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
                }}
              >
                ×
              </button>

              <img
                src={avatar}
                alt={name || "avatar"}
                style={{
                  maxWidth: "min(90vw, 520px)",
                  maxHeight: "80vh",
                  borderRadius: 18,
                  objectFit: "contain",
                  boxShadow: "0 24px 70px rgba(0,0,0,0.5)",
                  border: "3px solid rgba(201,168,76,0.5)",
                }}
              />

              {name && (
                <div style={{ color: "#fff", fontWeight: 600, fontSize: 15, textAlign: "center" }}>
                  {name}
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
