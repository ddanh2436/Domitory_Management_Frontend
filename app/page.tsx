"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLoggedInUser } from "./utils/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const user = getLoggedInUser();

    if (!user) {
      // 1. Chưa đăng nhập hoặc hết hạn session -> Đưa về trang Login ngay lập tức
      router.push("/login");
    } else {
      // 2. Đã đăng nhập hợp lệ -> Đưa về đúng không gian làm việc theo Role
      if (user.role === "ADMIN") {
        router.push("/admin");
      } else if (user.role === "STUDENT") {
        router.push("/student");
      } else {
        router.push("/login");
      }
    }
  }, [router]);

  // Hiển thị giao diện chờ trong lúc hệ thống kiểm tra và điều hướng
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600 font-medium">Đang xác thực và điều hướng hệ thống...</p>
      </div>
    </div>
  );
}