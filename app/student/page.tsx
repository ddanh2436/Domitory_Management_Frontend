"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Profile {
  fullName: string;
  mssv?: string;
  email: string;
  role: string;
  avatar?: string;
  room?: {
    name: string;
    building: string;
    floor: number;
    contractEnd?: string;
  };
}

function FeatureCard({
  icon,
  title,
  desc,
  href,
  color = "gold",
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  href?: string;
  color?: "gold" | "teal" | "rose" | "violet";
}) {
  return (
    <Link href={href ?? "#"} style={{ textDecoration: "none" }}>
      <div className={`st-feat-card st-feat-card--${color}`}>
        <div className="st-feat-icon">{icon}</div>
        <div className="st-feat-body">
          <div className="st-feat-title">{title}</div>
          <div className="st-feat-desc">{desc}</div>
        </div>
        <span className="st-feat-arrow">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

function ActivityItem({
  icon,
  title,
  time,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  time: string;
  color: string;
}) {
  return (
    <div className="st-activity-item">
      <div className={`st-activity-dot st-activity-dot--${color}`}>{icon}</div>
      <div className="st-activity-content">
        <span className="st-activity-title">{title}</span>
        <span className="st-activity-time">{time}</span>
      </div>
    </div>
  );
}

const Icons = {
  search: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  doc: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  invoice: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  wrench: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <circle cx="12" cy="12" r="3" strokeWidth={1.8} />
    </svg>
  ),
};

export default function StudentDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3001/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setProfile(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const firstName = profile?.fullName?.split(" ").pop() ?? "bạn";

  return (
    <>
      <style>{`
        .st-welcome { background: #0D1B2A; border-radius: 16px; padding: 28px 32px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; position: relative; overflow: hidden; border: 1px solid rgba(201,168,76,0.25); }
        .st-welcome-bg { position: absolute; inset: 0; background: radial-gradient(ellipse 60% 80% at 100% 50%, rgba(201,168,76,0.12) 0%, transparent 60%), radial-gradient(ellipse 30% 60% at 0% 100%, rgba(36,59,85,0.6) 0%, transparent 70%); pointer-events: none; }
        .st-welcome-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px); background-size: 40px 40px; pointer-events: none; }
        .st-welcome-left { position: relative; z-index: 1; }
        .st-welcome-eyebrow { font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: #C9A84C; margin-bottom: 8px; display: block; }
        .st-welcome-name { font-family: 'Fraunces', serif; font-size: clamp(22px, 3vw, 30px); font-weight: 700; color: #ffffff; line-height: 1.2; letter-spacing: -0.5px; margin-bottom: 10px; }
        .st-welcome-name em { color: #C9A84C; font-style: italic; }
        .st-welcome-sub { font-size: 13.5px; font-weight: 300; color: rgba(255,255,255,0.5); max-width: 380px; line-height: 1.6; }
        .st-welcome-right { position: relative; z-index: 1; }
        .st-room-card { background: rgba(255,255,255,0.07); border: 1px solid rgba(201,168,76,0.25); border-radius: 12px; padding: 18px 22px; min-width: 220px; }
        .st-room-card-label { font-size: 10px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.35); margin-bottom: 10px; }
        .st-room-card-name { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 700; color: #C9A84C; letter-spacing: -0.5px; line-height: 1; margin-bottom: 8px; }
        .st-room-card-detail { font-size: 12.5px; color: rgba(255,255,255,0.5); display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
        .st-room-card-detail svg { width: 12px; height: 12px; stroke: #C9A84C; opacity: 0.7; }
        .st-room-no-room { font-size: 13px; color: rgba(255,255,255,0.4); font-style: italic; }
        .st-grid { display: grid; grid-template-columns: 260px 1fr; gap: 20px; }
        .st-panel { background: #ffffff; border: 1px solid rgba(13,27,42,0.09); border-radius: 14px; overflow: hidden; }
        .st-panel-head { padding: 16px 20px; border-bottom: 1px solid rgba(13,27,42,0.09); display: flex; align-items: center; justify-content: space-between; }
        .st-panel-title { font-family: 'Fraunces', serif; font-size: 15px; font-weight: 600; color: #0D1B2A; letter-spacing: -0.2px; }
        .st-panel-sub { font-size: 11.5px; color: #8A9BAD; margin-top: 2px; }
        .st-panel-body { padding: 18px 20px; }
        .st-profile-rows { display: flex; flex-direction: column; gap: 14px; }
        .st-prow-label { font-size: 10px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: #8A9BAD; margin-bottom: 3px; }
        .st-prow-value { font-size: 14px; font-weight: 500; color: #0D1B2A; }
        .st-prow-value--mono { font-size: 14px; font-weight: 600; color: #C9A84C; font-variant-numeric: tabular-nums; letter-spacing: 0.02em; }
        .st-prow-value--email { font-size: 13px; color: #4A6580; word-break: break-all; }
        .st-status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 100px; font-size: 11.5px; font-weight: 500; background: rgba(34,197,94,0.1); color: #16a34a; border: 1px solid rgba(34,197,94,0.2); }
        .st-status-badge::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: #22c55e; }
        .st-profile-divider { height: 1px; background: rgba(13,27,42,0.09); margin: 2px 0; }
        .st-right { display: flex; flex-direction: column; gap: 20px; }
        .st-feats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 16px 18px; }
        .st-feat-card { border: 1px solid rgba(13,27,42,0.09); border-radius: 12px; padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; transition: all 0.2s; cursor: pointer; background: #ffffff; text-decoration: none; position: relative; overflow: hidden; }
        .st-feat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; transform: scaleX(0); transform-origin: left; transition: transform 0.25s ease; }
        .st-feat-card--gold::before { background: #C9A84C; }
        .st-feat-card--teal::before { background: #0E9E85; }
        .st-feat-card--rose::before { background: #E05A6A; }
        .st-feat-card--violet::before { background: #7C5CBF; }
        .st-feat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(13,27,42,0.08); }
        .st-feat-card:hover::before { transform: scaleX(1); }
        .st-feat-icon { width: 38px; height: 38px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .st-feat-card--gold    .st-feat-icon { background: rgba(201,168,76,0.12); color: #C9A84C; }
        .st-feat-card--teal    .st-feat-icon { background: rgba(14,158,133,0.1); color: #0E9E85; }
        .st-feat-card--rose    .st-feat-icon { background: rgba(224,90,106,0.1); color: #E05A6A; }
        .st-feat-card--violet  .st-feat-icon { background: rgba(124,92,191,0.1); color: #7C5CBF; }
        .st-feat-body { flex: 1; }
        .st-feat-title { font-family: 'Fraunces', serif; font-size: 14px; font-weight: 600; color: #0D1B2A; margin-bottom: 5px; line-height: 1.3; }
        .st-feat-desc { font-size: 12px; color: #8A9BAD; line-height: 1.6; }
        .st-feat-arrow { display: flex; align-items: center; color: #8A9BAD; margin-top: auto; }
        .st-activity-list { display: flex; flex-direction: column; }
        .st-activity-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 20px; border-bottom: 1px solid rgba(13,27,42,0.09); }
        .st-activity-item:last-child { border-bottom: none; }
        .st-activity-dot { width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .st-activity-dot--green  { background: rgba(34,197,94,0.1); color: #16a34a; }
        .st-activity-dot--gold   { background: rgba(201,168,76,0.12); color: #C9A84C; }
        .st-activity-dot--blue   { background: rgba(59,130,246,0.1); color: #3b82f6; }
        .st-activity-dot--muted  { background: rgba(13,27,42,0.06); color: #8A9BAD; }
        .st-activity-content { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .st-activity-title { font-size: 13px; font-weight: 400; color: #0D1B2A; }
        .st-activity-time { font-size: 11.5px; color: #8A9BAD; }
        .st-notice { margin: 0 18px 16px; padding: 12px 16px; border-radius: 10px; background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.25); display: flex; align-items: center; gap: 10px; font-size: 12.5px; color: #7A5E1A; }
        .st-sk { background: linear-gradient(90deg, #EDE9E3 25%, #E4E0D8 50%, #EDE9E3 75%); background-size: 400% 100%; animation: stShimmer 1.4s ease infinite; display: inline-block; }
      `}</style>

      <div className="st-welcome">
        <div className="st-welcome-bg" />
        <div className="st-welcome-grid" />
        <div className="st-welcome-left">
          <span className="st-welcome-eyebrow">Chào mừng trở lại</span>
          <div className="st-welcome-name">
            {loading ? <span className="st-sk" style={{ width: 220, height: 30, borderRadius: 6 }} /> : <>Xin chào, <em>{firstName}</em>!</>}
          </div>
          <div className="st-welcome-sub">
            Đây là không gian cá nhân của bạn tại Dormify — theo dõi phòng ở, hóa đơn và các dịch vụ lưu trú ngay tại đây.
          </div>
        </div>
        <div className="st-welcome-right">
          <div className="st-room-card">
            <div className="st-room-card-label">Phòng hiện tại</div>
            {loading ? (
              <>
                <span className="st-sk" style={{ width: 80, height: 26, borderRadius: 4 }} />
                <div style={{ marginTop: 10 }}><span className="st-sk" style={{ width: 140, height: 12, borderRadius: 3 }} /></div>
              </>
            ) : profile?.room ? (
              <>
                <div className="st-room-card-name">{profile.room.name}</div>
                <div className="st-room-card-detail">Tòa {profile.room.building} — Tầng {profile.room.floor}</div>
                {profile.room.contractEnd && <div className="st-room-card-detail">Hết hạn: {profile.room.contractEnd}</div>}
              </>
            ) : (
              <div className="st-room-no-room">Chưa có phòng — hãy tìm và đặt phòng của bạn.</div>
            )}
          </div>
        </div>
      </div>

      <div className="st-grid">
        <div>
          <div className="st-panel">
            <div className="st-panel-head">
              <div>
                <div className="st-panel-title">Thông tin cá nhân</div>
                <div className="st-panel-sub">Hồ sơ tài khoản của bạn</div>
              </div>
            </div>
            <div className="st-panel-body">
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {[120, 90, 160, 80].map((w, i) => (
                    <div key={i}>
                      <span className="st-sk" style={{ width: 60, height: 10, borderRadius: 3 }} />
                      <div style={{ marginTop: 5 }}><span className="st-sk" style={{ width: w, height: 14, borderRadius: 3 }} /></div>
                    </div>
                  ))}
                </div>
              ) : profile ? (
                <div className="st-profile-rows">
                  <div className="st-profile-row">
                    <div className="st-prow-label">Họ và tên</div>
                    <div className="st-prow-value">{profile.fullName}</div>
                  </div>
                  <div className="st-profile-divider" />
                  <div className="st-profile-row">
                    <div className="st-prow-label">Mã số sinh viên</div>
                    <div className="st-prow-value--mono">{profile.mssv || "—"}</div>
                  </div>
                  <div className="st-profile-divider" />
                  <div className="st-profile-row">
                    <div className="st-prow-label">Email liên hệ</div>
                    <div className="st-prow-value--email">{profile.email}</div>
                  </div>
                  <div className="st-profile-divider" />
                  <div className="st-profile-row">
                    <div className="st-prow-label">Trạng thái tài khoản</div>
                    <div style={{ marginTop: 4 }}><span className="st-status-badge">Đang hoạt động</span></div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "24px 0", fontSize: 13, color: "#8A9BAD" }}>Không thể tải hồ sơ.</div>
              )}
            </div>
          </div>
        </div>

        <div className="st-right">
          <div className="st-panel">
            <div className="st-panel-head">
              <div>
                <div className="st-panel-title">Dịch vụ lưu trú</div>
                <div className="st-panel-sub">Các tính năng dành cho bạn</div>
              </div>
            </div>

            {!profile?.room && !loading && (
              <div className="st-notice">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 15, height: 15, stroke: "#C9A84C", flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Bạn chưa có phòng. Hãy tìm và gửi yêu cầu đặt phòng để bắt đầu lưu trú.
              </div>
            )}

            <div className="st-feats-grid">
              <FeatureCard icon={Icons.search} title="Tìm & Đặt phòng" color="gold" desc="Xem phòng trống, kiểm tra tiện nghi và gửi yêu cầu lưu trú trực tuyến." href="/student/rooms" />
              <FeatureCard icon={Icons.doc} title="Hợp đồng điện tử" color="teal" desc="Xem hợp đồng thuê phòng, thời hạn lưu trú và thực hiện gia hạn." href="/student/contracts" />
              <FeatureCard icon={Icons.invoice} title="Hóa đơn điện nước" color="violet" desc="Theo dõi chi phí phòng, điện nước và lịch sử thanh toán hàng tháng." href="/student/invoices" />
              <FeatureCard icon={Icons.wrench} title="Yêu cầu sửa chữa" color="rose" desc="Phản ánh hỏng hóc thiết bị, điện, nước để ban quản lý xử lý kịp thời." href="/student/maintenance" />
            </div>
          </div>

          <div className="st-panel">
            <div className="st-panel-head">
              <div>
                <div className="st-panel-title">Hoạt động gần đây</div>
                <div className="st-panel-sub">Lịch sử tương tác của bạn</div>
              </div>
            </div>
            <div className="st-activity-list">
              <ActivityItem icon={<svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>} color="green" title="Tài khoản đã được kích hoạt thành công" time="Hôm nay" />
              <ActivityItem icon={<svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="blue" title="Hồ sơ sinh viên đã được xác minh" time="Hôm nay" />
              {!profile?.room && !loading && <ActivityItem icon={<span>🏢</span>} color="muted" title="Chưa có phòng — tìm và đặt phòng để bắt đầu" time="—" />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}