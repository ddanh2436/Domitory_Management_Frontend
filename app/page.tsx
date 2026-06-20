"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboardPath, getLoggedInUser, JwtPayload } from "./utils/auth";

// ─── Logo Component Đã Cập Nhật (Sử dụng Ảnh và Căn chỉnh) ────────────────────
function DormifyLogoMark({ size = 75, className = "" }: { size?: number; className?: string }) {
  return (
    <img 
      src="/Dormify.png" 
      alt="Dormify Logo" 
      width={size} 
      height={size} 
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({
  num,
  title,
  desc,
  icon,
}: {
  num: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <div className="feature-num">{num}</div>
      <div className="feature-title">{title}</div>
      <div className="feature-desc">{desc}</div>
    </div>
  );
}

// ─── Role Card ────────────────────────────────────────────────────────────────
function RoleCard({
  emoji,
  name,
  desc,
  perms,
  avatarClass,
}: {
  emoji: string;
  name: string;
  desc: string;
  perms: string[];
  avatarClass: string;
}) {
  return (
    <div className="role-card">
      <div className={`role-avatar ${avatarClass}`}>{emoji}</div>
      <div className="role-name">{name}</div>
      <div className="role-desc">{desc}</div>
      <ul className="role-perms">
        {perms.map((p) => (
          <li key={p}>
            <span className="perm-dot" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setUser(getLoggedInUser());
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const dashboardHref = user ? getDashboardPath(user.role) : "/student";

  return (
    <>
      {/* ─── Global Styles ─── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --navy: #0D1B2A;
          --navy-mid: #1A2E42;
          --navy-light: #243B55;
          --gold: #C9A84C;
          --gold-light: #E2C97E;
          --gold-pale: #F5EDD5;
          --cream: #FAF7F0;
          --text-muted: #8A9BAD;
          --white: #ffffff;
        }

        html { scroll-behavior: smooth; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: var(--cream);
          color: var(--navy);
          overflow-x: hidden;
        }

        /* ── NAVBAR ── */
        .dormify-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: rgba(13, 27, 42, 0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(201,168,76,0.2);
          padding: 0 5vw;
          height: 100px;
          display: flex; align-items: center; justify-content: space-between;
          animation: slideDown 0.6s ease both;
        }
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }

        .nav-links { display: flex; align-items: center; gap: 32px; }
        .nav-link {
          font-size: 14px; font-weight: 400;
          color: rgba(255,255,255,0.65);
          text-decoration: none; letter-spacing: 0.02em; transition: color 0.2s;
        }
        .nav-link:hover { color: var(--gold-light); }

        .btn-nav {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 600;
          padding: 12px 26px; border-radius: 8px;
          text-decoration: none; cursor: pointer; transition: all 0.2s;
          letter-spacing: 0.03em; border: none;
        }
        .btn-gold { background: var(--gold); color: var(--navy); }
        .btn-gold:hover { background: var(--gold-light); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(201,168,76,0.3); }

        /* ── HERO ── */
        .hero {
          min-height: 100vh; background: var(--navy);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center; padding: 150px 5vw 80px;
          position: relative; overflow: hidden;
        }
        .hero-bg {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 50% 0%,  rgba(201,168,76,0.13) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 80% 80%, rgba(201,168,76,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 30% 30% at 20% 70%, rgba(36,59,85,0.8)   0%, transparent 70%);
        }
        .hero-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .hero-content { position: relative; z-index: 2; max-width: 780px; }

        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 16px;
          border: 1px solid rgba(201,168,76,0.4); border-radius: 100px;
          font-size: 12px; font-weight: 500; color: var(--gold);
          letter-spacing: 0.08em; text-transform: uppercase;
          margin-bottom: 36px;
          animation: fadeUp 0.7s 0.2s ease both;
        }
        .hero-badge::before {
          content: ''; width: 6px; height: 6px; border-radius: 50%;
          background: var(--gold); animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

        .hero-headline {
          font-family: 'Fraunces', serif;
          font-size: clamp(42px, 7vw, 72px); font-weight: 700;
          line-height: 1.1; color: var(--white);
          margin-bottom: 28px;
          animation: fadeUp 0.7s 0.35s ease both;
          letter-spacing: -1.5px;
        }
        .hero-headline .gold { color: var(--gold); font-style: italic; }

        .hero-sub {
          font-size: 17px; font-weight: 300;
          color: rgba(255,255,255,0.6); line-height: 1.75;
          max-width: 540px; margin: 0 auto 48px;
          animation: fadeUp 0.7s 0.5s ease both;
        }

        .hero-actions {
          display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;
          animation: fadeUp 0.7s 0.65s ease both;
        }
        .btn-hero-primary {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px; font-weight: 500; padding: 14px 32px;
          background: var(--gold); color: var(--navy);
          border-radius: 8px; border: none; text-decoration: none; cursor: pointer;
          transition: all 0.2s; letter-spacing: 0.01em; display: inline-block;
        }
        .btn-hero-primary:hover {
          background: var(--gold-light); transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(201,168,76,0.35);
        }
        .btn-hero-secondary {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px; font-weight: 400; padding: 14px 32px;
          border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.8);
          border-radius: 8px; text-decoration: none; cursor: pointer;
          transition: all 0.2s; display: inline-block;
        }
        .btn-hero-secondary:hover {
          background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.35);
        }

        .hero-stats {
          position: relative; z-index: 2;
          display: flex; gap: 0; margin-top: 80px;
          border: 1px solid rgba(201,168,76,0.2); border-radius: 12px;
          overflow: hidden; animation: fadeUp 0.7s 0.8s ease both; max-width: 600px;
        }
        .stat {
          flex: 1; padding: 24px 20px; text-align: center;
          border-right: 1px solid rgba(201,168,76,0.15);
        }
        .stat:last-child { border-right: none; }
        .stat-num {
          font-family: 'Fraunces', serif;
          font-size: 32px; font-weight: 600; color: var(--gold);
        }
        .stat-label {
          font-size: 12px; font-weight: 400;
          color: rgba(255,255,255,0.45); margin-top: 4px; letter-spacing: 0.04em;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── BRAND DISPLAY ── */
        .brand-section {
          background: var(--cream); padding: 100px 5vw; text-align: center;
          border-top: 1px solid rgba(13,27,42,0.08);
        }
        .brand-section-label {
          font-size: 11px; font-weight: 500; letter-spacing: 0.15em;
          text-transform: uppercase; color: var(--text-muted); margin-bottom: 16px;
        }
        .brand-tagline { font-size: 15px; font-weight: 300; color: var(--text-muted); letter-spacing: 0.05em; }

        /* ── FEATURES ── */
        .features-section { background: var(--navy); padding: 100px 5vw; }
        .section-label {
          font-size: 11px; font-weight: 500; letter-spacing: 0.15em;
          text-transform: uppercase; color: var(--gold);
          margin-bottom: 16px; display: block;
        }
        .section-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(32px, 5vw, 48px); font-weight: 600;
          color: var(--white); line-height: 1.2;
          letter-spacing: -0.5px; margin-bottom: 60px;
        }
        .section-title em { font-style: italic; color: var(--gold); }
        .section-title.dark { color: var(--navy); text-align: center; margin-bottom: 20px; }
        
        .roles-section .section-label { text-align: center; }

        .features-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 2px;
          background: rgba(201,168,76,0.12);
          border: 1px solid rgba(201,168,76,0.12);
          border-radius: 16px; overflow: hidden;
        }
        .feature-card {
          background: var(--navy-mid); padding: 40px 32px; transition: background 0.25s;
        }
        .feature-card:hover { background: var(--navy-light); }
        .feature-icon {
          width: 48px; height: 48px;
          border: 1px solid rgba(201,168,76,0.3); border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 24px; color: var(--gold);
        }
        .feature-icon svg { width: 22px; height: 22px; stroke-width: 1.5; }
        .feature-num {
          font-size: 11px; font-weight: 500; letter-spacing: 0.1em;
          color: rgba(201,168,76,0.5); margin-bottom: 12px;
        }
        .feature-title {
          font-family: 'Fraunces', serif;
          font-size: 20px; font-weight: 600;
          color: var(--white); margin-bottom: 12px; line-height: 1.3;
        }
        .feature-desc {
          font-size: 14px; font-weight: 300;
          color: rgba(255,255,255,0.5); line-height: 1.7;
        }

        /* ── ROLES ── */
        .roles-section { padding: 100px 5vw; background: var(--cream); }
        .roles-grid { 
          display: grid; 
          grid-template-columns: repeat(2, 1fr); 
          gap: 32px; 
          margin-top: 50px; 
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }
        .role-card {
          border: 1px solid rgba(13,27,42,0.1); border-radius: 16px;
          padding: 40px 32px; background: var(--white);
          transition: all 0.25s; cursor: default; position: relative; overflow: hidden;
        }
        .role-card::after {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: var(--gold); transform: scaleX(0); transform-origin: left;
          transition: transform 0.3s ease;
        }
        .role-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(13,27,42,0.1); }
        .role-card:hover::after { transform: scaleX(1); }
        .role-avatar {
          width: 52px; height: 52px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 24px; font-size: 22px;
        }
        .role-avatar.student { background: rgba(201,168,76,0.12); }
        .role-avatar.admin   { background: rgba(13,27,42,0.08); }
        .role-name {
          font-family: 'Fraunces', serif;
          font-size: 20px; font-weight: 600; color: var(--navy); margin-bottom: 8px;
        }
        .role-desc { font-size: 14px; color: var(--text-muted); line-height: 1.6; margin-bottom: 24px; }
        .role-perms { list-style: none; }
        .role-perms li {
          font-size: 13px; color: var(--navy); padding: 7px 0;
          border-bottom: 1px solid rgba(13,27,42,0.06);
          display: flex; align-items: center; gap: 10px;
        }
        .role-perms li:last-child { border-bottom: none; }
        .perm-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--gold); flex-shrink: 0; }

        /* ── CTA ── */
        .cta-section {
          background: var(--navy); padding: 100px 5vw; text-align: center;
          position: relative; overflow: hidden;
        }
        .cta-bg {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 50% 80% at 50% 100%, rgba(201,168,76,0.15) 0%, transparent 70%);
        }
        .cta-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(36px, 5vw, 54px); font-weight: 700;
          color: var(--white); line-height: 1.15; letter-spacing: -1px;
          margin-bottom: 20px; position: relative; z-index: 1;
        }
        .cta-title em { color: var(--gold); font-style: italic; }
        .cta-sub {
          font-size: 16px; font-weight: 300; color: rgba(255,255,255,0.55);
          margin-bottom: 44px; position: relative; z-index: 1;
        }
        .cta-actions {
          display: flex; gap: 14px; justify-content: center;
          position: relative; z-index: 1; flex-wrap: wrap;
        }

        /* ── FOOTER ── */
        footer {
          background: #08111A;
          border-top: 1px solid rgba(201,168,76,0.15);
          padding: 48px 5vw 32px;
        }
        .footer-top {
          display: flex; align-items: center; justify-content: space-between;
          padding-bottom: 32px; border-bottom: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 24px;
        }
        .footer-copy { font-size: 13px; color: rgba(255,255,255,0.3); }
        .footer-links { display: flex; gap: 24px; }
        .footer-link { font-size: 13px; color: rgba(255,255,255,0.35); text-decoration: none; transition: color 0.2s; }
        .footer-link:hover { color: var(--gold); }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .nav-links .nav-link { display: none; }
          .features-grid { grid-template-columns: 1fr; }
          .roles-grid { grid-template-columns: 1fr; }
          .hero-stats { flex-direction: column; }
          .stat { border-right: none; border-bottom: 1px solid rgba(201,168,76,0.15); }
          .stat:last-child { border-bottom: none; }
          .footer-top { flex-direction: column; gap: 20px; text-align: center; }
        }
      `}</style>

      {/* ─── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="dormify-nav">
        {/* LOGO CHÍNH - Chữ được nâng lên xíu xiu */}
        <Link href="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity no-underline">
          <DormifyLogoMark size={75} className="-translate-y-2" />
          {/* Sửa translate-y-2 thành translate-y-1 */}
          <span className="font-serif text-4xl font-bold text-white tracking-tight translate-y-1">
            Dorm<span className="text-[#C9A84C]">ify</span>
          </span>
        </Link>

        <div className="nav-links">
          <a href="#features" className="nav-link">Tính năng</a>
          <a href="#roles"    className="nav-link">Vai trò</a>
          {user ? (
            <Link href={dashboardHref} className="btn-nav btn-gold">
              Vào không gian làm việc
            </Link>
          ) : (
            <Link href="/login" className="btn-nav btn-gold">
              Đăng nhập / Đăng ký
            </Link>
          )}
        </div>
      </header>

      <main>
        {/* ─── Hero ─────────────────────────────────────────────────────────── */}
        <section className="hero">
          <div className="hero-bg" />
          <div className="hero-grid" />

          <div className="hero-content">
            <div className="hero-badge">Hệ thống Quản lý Lưu trú thế hệ mới</div>

            <h1 className="hero-headline">
              Nơi sinh viên<br />
              sống <span className="gold">thật thoải mái</span>,<br />
              quản lý thật dễ dàng
            </h1>

            <p className="hero-sub">
              Nền tảng quản lý ký túc xá toàn diện dành cho sinh viên HCMUS — từ đặt phòng,
              theo dõi hóa đơn đến hỗ trợ bảo trì, tất cả trong một nơi.
            </p>

            <div className="hero-actions">
              {user ? (
                <Link href={dashboardHref} className="btn-hero-primary">
                  Quay lại Bảng điều khiển
                </Link>
              ) : (
                <Link href="/login" className="btn-hero-primary">
                  Bắt đầu miễn phí
                </Link>
              )}
              <a href="#features" className="btn-hero-secondary">Khám phá tính năng →</a>
            </div>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <div className="stat-num">500+</div>
              <div className="stat-label">Phòng quản lý</div>
            </div>
            <div className="stat">
              <div className="stat-num">2,000+</div>
              <div className="stat-label">Sinh viên sử dụng</div>
            </div>
            <div className="stat">
              <div className="stat-num">24/7</div>
              <div className="stat-label">Hỗ trợ &amp; Bảo trì</div>
            </div>
          </div>
        </section>

        {/* ─── Brand Display ────────────────────────────────────────────────── */}
        <section className="brand-section">
          <div className="brand-section-label">Thương hiệu</div>
          {/* LOGO THƯƠNG HIỆU - Chữ được nâng lên xíu xiu */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <DormifyLogoMark size={90} className="-translate-y-2" />
            {/* Sửa translate-y-2 thành translate-y-1 */}
            <div className="font-serif text-6xl font-bold text-[#0D1B2A] tracking-tight translate-y-1">
              Dorm<span className="text-[#C9A84C]">ify</span>
            </div>
          </div>
          <div className="brand-tagline">Smart Dormitory Management Platform · HCMUS</div>
        </section>

        {/* ─── Features ─────────────────────────────────────────────────────── */}
        <section id="features" className="features-section">
          <span className="section-label">Tính năng nổi bật</span>
          <h2 className="section-title">
            Mọi thứ bạn cần,<br />
            tập trung <em>một nơi</em>
          </h2>

          <div className="features-grid">
            <FeatureCard
              num="01" title="Đăng ký phòng trực tuyến"
              desc="Xem sơ đồ tòa nhà, lựa chọn phòng trống và hoàn tất hồ sơ lưu trú nhanh chóng, không cần giấy tờ phức tạp."
              icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
            />
            <FeatureCard
              num="02" title="Hợp đồng số hóa"
              desc="Ký kết và quản lý hợp đồng thuê phòng trực tuyến. Xem lại lịch sử và gia hạn hợp đồng dễ dàng bất kỳ lúc nào."
              icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            />
            <FeatureCard
              num="03" title="Thanh toán minh bạch"
              desc="Theo dõi phí phòng, điện nước hàng tháng với lịch sử giao dịch được lưu trữ rõ ràng và an toàn tuyệt đối."
              icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            />
            <FeatureCard
              num="04" title="Báo cáo sự cố 24/7"
              desc="Phản ánh ngay sự cố điện, nước hay thiết bị hỏng hóc. Ban quản lý tiếp nhận và xử lý kịp thời, minh bạch."
              icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>}
            />
            <FeatureCard
              num="05" title="Dashboard quản trị"
              desc="Admin có toàn quyền quản lý phòng, sinh viên, hóa đơn và báo cáo thống kê trực quan theo thời gian thực."
              icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            />
            <FeatureCard
              num="06" title="Thông báo thông minh"
              desc="Nhận cảnh báo hạn hóa đơn, cập nhật trạng thái bảo trì và mọi thông tin quan trọng về lưu trú của bạn."
              icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
            />
          </div>
        </section>

        {/* ─── Roles ────────────────────────────────────────────────────────── */}
        <section id="roles" className="roles-section">
          <span className="section-label">Dành cho tất cả</span>
          <h2 className="section-title dark">
            Hai vai trò, <em style={{ color: "var(--gold)" }}>một nền tảng</em>
          </h2>

          <div className="roles-grid">
            <RoleCard
              emoji="🎓" name="Sinh viên" avatarClass="student"
              desc="Quản lý toàn bộ việc lưu trú, từ đăng ký đến thanh toán, ngay trên điện thoại."
              perms={["Tìm kiếm & đặt phòng", "Xem hóa đơn & thanh toán", "Báo cáo sự cố", "Xem hợp đồng cá nhân"]}
            />
            <RoleCard
              emoji="🏛️" name="Quản trị viên" avatarClass="admin"
              desc="Kiểm soát toàn bộ hệ thống — phòng, sinh viên, bảo trì và báo cáo tài chính."
              perms={["Quản lý phòng & tòa nhà", "Phê duyệt yêu cầu thuê", "Quản lý & Điều phối bảo trì", "Thống kê & báo cáo"]}
            />
          </div>
        </section>

        {/* ─── CTA ──────────────────────────────────────────────────────────── */}
        <section className="cta-section">
          <div className="cta-bg" />
          <h2 className="cta-title">
            Sẵn sàng trải nghiệm<br />
            <em>ký túc xá thế hệ mới?</em>
          </h2>
          <p className="cta-sub">Đăng ký ngay hôm nay — miễn phí, không cần thẻ tín dụng.</p>
          <div className="cta-actions">
            {user ? (
              <Link href={dashboardHref} className="btn-hero-primary">
                Vào Bảng điều khiển
              </Link>
            ) : (
              <Link href="/login" className="btn-hero-primary">Đăng nhập / Đăng ký</Link>
            )}
          </div>
        </section>
      </main>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer>
        <div className="footer-top">
          {/* LOGO FOOTER - Chữ được nâng lên (bỏ translate-y-1) */}
          <div className="flex items-center gap-2">
            <DormifyLogoMark size={40} className="-translate-y-1" />
            {/* Đã bỏ class translate-y-1 để chữ bằng ngang với logo */}
            <span className="font-serif text-2xl font-bold text-white tracking-tight">
              Dorm<span className="text-[#C9A84C]">ify</span>
            </span>
          </div>
          <div className="footer-links">
            <a href="#features" className="footer-link">Tính năng</a>
            <a href="#roles"    className="footer-link">Vai trò</a>
            <Link href="/login" className="footer-link">Đăng nhập</Link>
          </div>
        </div>
        <div className="footer-copy">
          © {new Date().getFullYear()} Dormify · Hệ thống Quản lý Ký túc xá · HCMUS · Được thiết kế vì trải nghiệm của bạn.
        </div>
      </footer>
    </>
  );
}