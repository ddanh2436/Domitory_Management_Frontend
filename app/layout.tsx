import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// Bổ sung import này
import { GoogleOAuthProvider } from '@react-oauth/google';
import ChatbotWidget from './components/ChatbotWidget';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Quản lý Ký túc xá",
  description: "Hệ thống quản lý ký túc xá sinh viên",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      {/* Thêm suppressHydrationWarning vào đây để bỏ qua lỗi do Extension */}
      <body className={inter.className} suppressHydrationWarning>
        <GoogleOAuthProvider clientId="554498848939-6lfe3dqvl8ca1uaudvk9hqs0rm5irt26.apps.googleusercontent.com">
          {children}
        </GoogleOAuthProvider>
        <ChatbotWidget />
      </body>
    </html>
  );
}