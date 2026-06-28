export type UserRole = 'ADMIN' | 'STUDENT' | 'MAINTENANCE' | 'DORMITORY_MANAGER' | 'FLOOR_MANAGER' | 'MAINTENANCE_STAFF';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  exp: number; 
}

// Đây chính là hàm bị thiếu gây ra lỗi đỏ của bạn
export function getDashboardPath(role: UserRole) {
  return role === 'STUDENT' ? '/student' : '/admin';
}

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
    
    const decoded: JwtPayload = JSON.parse(jsonPayload);
    
    if (decoded.exp * 1000 < Date.now()) {
      console.warn("Session đã hết hạn! Tự động đăng xuất.");
      localStorage.removeItem("token"); // Xóa token đã hết hạn khỏi bộ nhớ
      return null;
    }
    
    return decoded;
  } catch {
    localStorage.removeItem("token");
    return null;
  }
}