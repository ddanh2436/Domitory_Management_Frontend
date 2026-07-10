import { NextRequest, NextResponse } from "next/server";

// ─── Bảo vệ route phía server (Next 16: proxy, trước đây là middleware) ──────
// Đọc JWT từ cookie "token" (được set khi đăng nhập — xem app/utils/auth.ts).
// Proxy chỉ decode payload để gating route (chưa xác minh chữ ký vì secret
// nằm ở backend NestJS); mọi request dữ liệu vẫn được backend xác thực đầy đủ
// qua Bearer token. RoleGuard phía client giữ vai trò dự phòng UX.

interface TokenPayload {
  role?: string;
  exp?: number;
}

function decodeTokenPayload(token: string): TokenPayload | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as TokenPayload;
  } catch {
    return null;
  }
}

const ADMIN_ROLES = ["ADMIN", "DORMITORY_MANAGER", "FLOOR_MANAGER", "MAINTENANCE_STAFF"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const payload = token ? decodeTokenPayload(token) : null;
  const isExpired = !payload?.exp || payload.exp * 1000 < Date.now();

  // Chưa đăng nhập hoặc token hết hạn → về trang login (kèm xóa cookie hỏng)
  if (!payload || isExpired) {
    const loginUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    if (token) response.cookies.delete("token");
    return response;
  }

  // Sai khu vực theo vai trò → đưa về dashboard đúng của họ
  if (pathname.startsWith("/admin") && !ADMIN_ROLES.includes(payload.role ?? "")) {
    return NextResponse.redirect(new URL("/student", request.url));
  }
  if (pathname.startsWith("/student") && payload.role !== "STUDENT") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin", "/student/:path*", "/student"],
};
