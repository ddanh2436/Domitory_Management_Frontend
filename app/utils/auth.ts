export interface JwtPayload {
  sub: string;
  email: string;
  role: 'ADMIN' | 'STUDENT' | 'MAINTENANCE';
  exp: number;
}

// Hàm giải mã JWT token ngay tại client-side
export function getLoggedInUser(): JwtPayload | null {
  if (typeof window === "undefined") return null;
  
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    localStorage.removeItem("token");
    return null;
  }
}