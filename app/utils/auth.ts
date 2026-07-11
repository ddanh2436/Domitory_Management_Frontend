export type UserRole = 'ADMIN' | 'STUDENT' | 'MAINTENANCE' | 'DORMITORY_MANAGER' | 'FLOOR_MANAGER' | 'MAINTENANCE_STAFF';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  exp: number; 
}

// Đây chính là hàm bị thiếu gây ra lỗi đỏ của bạn
export function getDashboardPath(role: UserRole) {
  if (role === 'STUDENT') return '/student';
  if (role === 'MAINTENANCE_STAFF') return '/staff';
  return '/admin';
}

// Lưu token vào localStorage (cho apiClient/socket) và cookie (cho middleware.ts
// kiểm tra phía server). Cookie không phải httpOnly vì được set từ JS — middleware
// chỉ dùng nó để gating route; xác thực thật vẫn do backend kiểm tra Bearer token.
export function persistToken(token: string) {
  localStorage.setItem("token", token);
  document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearToken() {
  localStorage.removeItem("token");
  document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
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
      clearToken(); // Xóa token đã hết hạn khỏi bộ nhớ
      return null;
    }

    return decoded;
  } catch {
    clearToken();
    return null;
  }
}