// app/components/RoleGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLoggedInUser } from "../utils/auth";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('ADMIN' | 'STUDENT' | 'MAINTENANCE')[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const user = getLoggedInUser();

    // 1. Nếu chưa đăng nhập -> đá về trang login
    if (!user) {
      router.push("/login");
      return;
    }

    // 2. Nếu đã đăng nhập nhưng sai Role -> đá về đúng trang của Role đó
    if (!allowedRoles.includes(user.role)) {
      if (user.role === "ADMIN") {
        router.push("/admin");
      } else if (user.role === "STUDENT") {
        router.push("/student");
      } else {
        router.push("/login");
      }
      return;
    }

    // 3. Đúng quyền -> Cho phép hiển thị trang
    setIsAuthorized(true);
  }, [router, allowedRoles]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}