'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordSandbox() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Vui lòng nhập Email.');
      return;
    }
    
    // Sandbox: Chuyển thẳng sang bước nhập mật khẩu mới
    setStep(2);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/sandbox-reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      }
      
      setMessage('Đổi mật khẩu thành công! Hệ thống đang chuyển hướng...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 bg-cover bg-center" style={{ backgroundImage: "url('/auth_bg.jpg')" }}>
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md bg-opacity-95">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Khôi phục mật khẩu</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">{message}</span>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleVerifyEmail}>
            <p className="text-sm text-gray-600 mb-6 text-center">
              <span className="font-bold text-blue-600">[Sandbox Mode]</span> Tính năng phục hồi mật khẩu mô phỏng không cần gửi mã qua Email.
            </p>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email đã đăng ký
              </label>
              <input
                id="email"
                type="email"
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ví dụ: student@dormify.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded hover:bg-blue-700 transition duration-200"
            >
              Tiếp tục
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword}>
             <p className="text-sm text-gray-600 mb-4 text-center bg-gray-100 p-3 rounded">
              Tài khoản cần khôi phục: <br/><strong>{email}</strong>
            </p>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Mật khẩu mới
              </label>
              <input
                id="password"
                type="password"
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tối thiểu 6 ký tự"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full text-white font-bold py-3 px-4 rounded transition duration-200 mb-3 ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isLoading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
            </button>
            <button 
              type="button" 
              onClick={() => setStep(1)}
              className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded hover:bg-gray-300 transition duration-200"
            >
              Quay lại
            </button>
          </form>
        )}
        
        <div className="mt-6 text-center">
          <button 
            onClick={() => router.push('/login')} 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Trở về trang Đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
}