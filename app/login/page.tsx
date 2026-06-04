export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      {/* Khung Form Đăng nhập */}
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        
        {/* Tiêu đề */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">Đăng nhập</h2>
          <p className="text-slate-500 mt-2 text-sm">
            Vui lòng nhập thông tin tài khoản của bạn
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5">
          {/* Input Email/Username */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tên đăng nhập / Email
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900"
              placeholder="MSSV hoặc Email"
              required
            />
          </div>

          {/* Input Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Ghi nhớ & Quên mật khẩu */}
          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
              />
              <span className="ml-2 text-sm text-slate-600">Ghi nhớ tài khoản</span>
            </label>
            <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline">
              Quên mật khẩu?
            </a>
          </div>

          {/* Nút Submit */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            Đăng nhập
          </button>
        </form>

        {/* Chuyển hướng Đăng ký (Dành cho Sinh viên mới) */}
        <div className="text-center text-sm text-slate-600 pt-4 border-t border-slate-100">
          Chưa có tài khoản lưu trú?{' '}
          <a href="#" className="text-blue-600 hover:text-blue-500 font-semibold hover:underline">
            Gửi yêu cầu thuê phòng
          </a>
        </div>

      </div>
    </div>
  );
}