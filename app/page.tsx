import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-4">
          Hệ thống Quản lý Ký túc xá
        </h1>
        <p className="text-lg text-slate-600 mb-8">
          Nền tảng quản lý lưu trú, hợp đồng và dịch vụ sinh viên nội trú tập trung, minh bạch và hiệu quả.
        </p>
        
        <Link 
          href="/login" 
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all"
        >
          Đăng nhập hệ thống
        </Link>
      </div>
    </main>
  );
}