"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RoleGuard from "../../components/RoleGuard";

type AccountRole =
  | "ADMIN"
  | "DORMITORY_MANAGER"
  | "FLOOR_MANAGER"
  | "STUDENT"
  | "MAINTENANCE_STAFF";

type AccessStatus = "ACTIVE" | "LOCKED";

interface AccountAccess {
  id: string;
  fullName: string;
  email: string;
  mssv?: string;
  cccd?: string;
  role: AccountRole;
  status: AccessStatus;
}

interface ApiAccount {
  _id?: string;
  id?: string;
  fullName?: string;
  email?: string;
  mssv?: string;
  cccd?: string;
  role?: AccountRole;
  accessStatus?: AccessStatus;
}

const API_BASE_URL = "http://localhost:3001";

const roleOptions: { value: AccountRole; label: string }[] = [
  { value: "ADMIN", label: "Quản trị viên" },
  { value: "DORMITORY_MANAGER", label: "Quản lý ký túc xá" },
  { value: "FLOOR_MANAGER", label: "Quản lý tầng" },
  { value: "STUDENT", label: "Sinh viên" },
  { value: "MAINTENANCE_STAFF", label: "Nhân viên bảo trì" },
];

const normalizeAccount = (account: ApiAccount): AccountAccess => ({
  id: account._id ?? account.id ?? "",
  fullName: account.fullName ?? "Chưa cập nhật tên",
  email: account.email ?? "Chưa cập nhật email",
  mssv: account.mssv,
  cccd: account.cccd,
  role: account.role ?? "STUDENT",
  status: account.accessStatus ?? "ACTIVE",
});

const Icons = {
  chart: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  home: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  users: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
  shield: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3l7 3v5c0 4.5-2.8 8.5-7 10-4.2-1.5-7-5.5-7-10V6l7-3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.5 12l1.7 1.7L15 10" /></svg>,
  doc: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  invoice: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>,
  wrench: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>,
  search: <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  logout: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
};

function DormifyLogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 42 42" fill="none">
      <rect width="42" height="42" rx="10" fill="#1A2E42" />
      <rect x="10" y="8" width="4" height="26" rx="1" fill="#C9A84C" />
      <path d="M14 8 Q28 8 28 21 Q28 34 14 34" stroke="#C9A84C" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <rect x="18" y="12" width="4" height="4" rx="1" fill="rgba(201,168,76,0.45)" />
      <rect x="18" y="19" width="4" height="4" rx="1" fill="rgba(201,168,76,0.45)" />
      <rect x="18" y="26" width="4" height="4" rx="1" fill="rgba(201,168,76,0.45)" />
      <line x1="10" y1="6" x2="26" y2="6" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function NavItem({ icon, label, href, active = false }: { icon: React.ReactNode; label: string; href: string; active?: boolean }) {
  return (
    <Link href={href} className={`nav-item ${active ? "nav-item--active" : ""}`}>
      <span className="nav-item__icon">{icon}</span>
      <span className="nav-item__label">{label}</span>
    </Link>
  );
}

export default function AdminPermissionsPage() {
  const [accounts, setAccounts] = useState<AccountAccess[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingAccountId, setSavingAccountId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Bạn cần đăng nhập để xem danh sách tài khoản.");

        const response = await fetch(`${API_BASE_URL}/api/users/access-control`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Không thể tải danh sách tài khoản.");
        }

        setAccounts(data.map(normalizeAccount).filter((account: AccountAccess) => account.id));
      } catch (error: any) {
        setErrorMsg(error.message || "Không thể tải danh sách tài khoản.");
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const filteredAccounts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return accounts;

    return accounts.filter((account) =>
      account.mssv?.toLowerCase().includes(term) ||
      account.cccd?.toLowerCase().includes(term)
    );
  }, [accounts, searchTerm]);

  const updateAccountAccess = async (
    id: string,
    updateData: { role?: AccountRole; accessStatus?: AccessStatus },
  ) => {
    setSavingAccountId(id);
    setErrorMsg(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Bạn cần đăng nhập để cập nhật phân quyền.");

      const response = await fetch(`${API_BASE_URL}/api/users/${id}/access-control`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Không thể cập nhật phân quyền.");
      }

      const updatedAccount = normalizeAccount(data);
      setAccounts((current) =>
        current.map((account) => account.id === id ? updatedAccount : account)
      );
    } catch (error: any) {
      setErrorMsg(error.message || "Không thể cập nhật phân quyền.");
    } finally {
      setSavingAccountId(null);
    }
  };

  const updateAccountRole = (id: string, role: AccountRole) => {
    updateAccountAccess(id, { role });
  };

  const updateAccountStatus = (id: string, status: AccessStatus) => {
    updateAccountAccess(id, { accessStatus: status });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .perm-shell { display: flex; min-height: 100vh; background: #f4f1ec; color: #0d1b2a; font-family: Arial, sans-serif; }
        .sidebar { width: 240px; min-height: 100vh; background: #0d1b2a; display: flex; flex-direction: column; position: fixed; inset: 0 auto 0 0; border-right: 1px solid rgba(201,168,76,0.25); }
        .sidebar__brand { padding: 24px 20px 20px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid rgba(255,255,255,0.06); text-decoration: none; }
        .sidebar__wordmark { font-family: Georgia, serif; font-size: 20px; font-weight: 600; color: #fff; }
        .sidebar__wordmark span { color: #c9a84c; }
        .sidebar__role-chip { margin: 16px 20px 4px; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.35); }
        .sidebar__nav { flex: 1; padding: 4px 12px 16px; display: flex; flex-direction: column; gap: 2px; }
        .nav-item { display: flex; align-items: center; gap: 11px; padding: 9px 12px; border-radius: 8px; text-decoration: none; transition: background 0.15s, color 0.15s; }
        .nav-item__icon { color: #8a9bad; display: flex; flex-shrink: 0; }
        .nav-item__label { font-size: 13.5px; color: rgba(255,255,255,0.58); }
        .nav-item:hover { background: rgba(255,255,255,0.05); }
        .nav-item:hover .nav-item__label, .nav-item:hover .nav-item__icon { color: #fff; }
        .nav-item--active { background: rgba(201,168,76,0.18); }
        .nav-item--active .nav-item__label, .nav-item--active .nav-item__icon { color: #c9a84c; font-weight: 600; }
        .sidebar__footer { padding: 16px 12px; border-top: 1px solid rgba(255,255,255,0.06); }
        .btn-logout { width: 100%; display: flex; align-items: center; gap: 11px; padding: 9px 12px; border: none; border-radius: 8px; background: transparent; color: rgba(240,80,80,0.85); cursor: pointer; font-size: 13.5px; }
        .btn-logout:hover { background: rgba(220,50,50,0.12); }
        .perm-main { margin-left: 240px; flex: 1; min-height: 100vh; }
        .topbar { height: 60px; padding: 0 32px; display: flex; align-items: center; justify-content: space-between; background: #fff; border-bottom: 1px solid rgba(13,27,42,0.09); position: sticky; top: 0; z-index: 20; }
        .topbar__title { font-family: Georgia, serif; font-size: 18px; font-weight: 600; }
        .topbar__breadcrumb { margin-top: 2px; color: #8a9bad; font-size: 12px; }
        .page-body { padding: 28px 32px 48px; }
        .panel { background: #fff; border: 1px solid rgba(13,27,42,0.09); border-radius: 12px; overflow: hidden; }
        .panel__header { padding: 20px 24px; border-bottom: 1px solid rgba(13,27,42,0.09); display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .panel__title { font-family: Georgia, serif; font-size: 17px; font-weight: 600; }
        .panel__subtitle { margin-top: 3px; color: #8a9bad; font-size: 12.5px; }
        .panel__body { padding: 24px; }
        .field-label { display: block; margin-bottom: 7px; font-size: 12px; font-weight: 700; color: #0d1b2a; }
        .select-input, .search-input { width: 100%; height: 40px; padding: 0 12px; border: 1px solid rgba(13,27,42,0.15); border-radius: 8px; background: #fbfaf8; color: #0d1b2a; outline: none; font-size: 13.5px; }
        .select-input:focus, .search-input:focus { border-color: #c9a84c; background: #fff; }
        .search-wrap { position: relative; width: min(420px, 100%); }
        .search-wrap__icon { position: absolute; top: 12px; left: 12px; color: #8a9bad; display: flex; }
        .search-wrap .search-input { padding-left: 36px; }
        .account-list { display: flex; flex-direction: column; gap: 12px; }
        .account-row { display: grid; grid-template-columns: minmax(240px, 1fr) 200px 220px; gap: 14px; align-items: start; padding: 16px; border: 1px solid rgba(13,27,42,0.09); border-radius: 10px; background: #fbfaf8; }
        .account-name { font-weight: 700; font-size: 14px; }
        .account-meta { margin-top: 4px; color: #63778b; font-size: 12px; line-height: 1.5; }
        .status-control { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .status-button { height: 34px; border: 1px solid rgba(13,27,42,0.1); border-radius: 8px; background: #fff; color: #5c6f82; font-size: 12px; font-weight: 700; cursor: pointer; }
        .status-button:disabled, .select-input:disabled { opacity: 0.6; cursor: not-allowed; }
        .status-button--active { border-color: rgba(34,197,94,0.35); background: rgba(34,197,94,0.1); color: #15803d; }
        .status-button--locked { border-color: rgba(220,38,38,0.3); background: rgba(220,38,38,0.08); color: #b91c1c; }
        .state-message { margin-bottom: 14px; padding: 12px 14px; border-radius: 8px; font-size: 13px; }
        .state-message--error { border: 1px solid rgba(220,38,38,0.18); background: rgba(220,38,38,0.08); color: #b91c1c; }
        .empty-state { padding: 20px; border: 1px dashed rgba(13,27,42,0.18); border-radius: 10px; color: #6b7f92; text-align: center; }
        @media (max-width: 1000px) {
          .sidebar { position: static; width: 100%; min-height: auto; }
          .perm-shell { display: block; }
          .perm-main { margin-left: 0; }
          .account-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="perm-shell">
        <aside className="sidebar">
          <Link href="/" className="sidebar__brand">
            <DormifyLogoMark size={36} />
            <span className="sidebar__wordmark">Dorm<span>ify</span></span>
          </Link>
          <div className="sidebar__role-chip">Quản trị viên</div>
          <nav className="sidebar__nav">
            <NavItem href="/admin" icon={Icons.chart} label="Tổng quan" />
            <NavItem href="/admin/rooms" icon={Icons.home} label="Quản lý phòng" />
            <NavItem href="/admin/students" icon={Icons.users} label="Sinh viên" />
            <NavItem href="/admin/permissions" icon={Icons.shield} label="Phân quyền tài khoản" active />
            <NavItem href="/admin/bookings" icon={Icons.doc} label="Duyệt đơn phòng" />
            <NavItem href="/admin/invoices" icon={Icons.invoice} label="Hóa đơn" />
            <NavItem href="#" icon={Icons.wrench} label="Bảo trì" />
          </nav>
          <div className="sidebar__footer">
            <button className="btn-logout" type="button" onClick={handleLogout}>
              <span>{Icons.logout}</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        <div className="perm-main">
          <header className="topbar">
            <div>
              <div className="topbar__title">Phân quyền tài khoản</div>
              <div className="topbar__breadcrumb">Dormify / Quản trị viên / Kiểm soát quyền truy cập</div>
            </div>
          </header>

          <main className="page-body">
            <section className="panel">
              <div className="panel__header">
                <div>
                  <div className="panel__title">Kiểm soát quyền truy cập</div>
                  <div className="panel__subtitle">Tra cứu bằng MSSV hoặc CCCD và điều chỉnh quyền tài khoản</div>
                </div>
                <div className="search-wrap">
                  <span className="search-wrap__icon">{Icons.search}</span>
                  <input
                    className="search-input"
                    type="search"
                    placeholder="Nhập MSSV hoặc CCCD"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
              </div>
              <div className="panel__body">
                {errorMsg && (
                  <div className="state-message state-message--error">{errorMsg}</div>
                )}
                <div className="account-list">
                  {loading ? (
                    <div className="empty-state">Đang tải danh sách tài khoản...</div>
                  ) : filteredAccounts.length === 0 ? (
                    <div className="empty-state">Không tìm thấy tài khoản phù hợp.</div>
                  ) : (
                    filteredAccounts.map((account) => (
                      <div className="account-row" key={account.id}>
                        <div>
                          <div className="account-name">{account.fullName}</div>
                          <div className="account-meta">{account.email}</div>
                          <div className="account-meta">
                            {account.mssv ? `MSSV: ${account.mssv}` : `CCCD: ${account.cccd ?? "-"}`}
                          </div>
                        </div>

                        <div>
                          <label className="field-label" htmlFor={`role-${account.id}`}>Vai trò</label>
                          <select
                            id={`role-${account.id}`}
                            className="select-input"
                            value={account.role}
                            disabled={savingAccountId === account.id}
                            onChange={(event) => updateAccountRole(account.id, event.target.value as AccountRole)}
                          >
                            {roleOptions.map((role) => (
                              <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="field-label">Trạng thái truy cập</label>
                          <div className="status-control">
                            <button
                              type="button"
                              className={`status-button ${account.status === "ACTIVE" ? "status-button--active" : ""}`}
                              disabled={savingAccountId === account.id}
                              onClick={() => updateAccountStatus(account.id, "ACTIVE")}
                            >
                              Hoạt động
                            </button>
                            <button
                              type="button"
                              className={`status-button ${account.status === "LOCKED" ? "status-button--locked" : ""}`}
                              disabled={savingAccountId === account.id}
                              onClick={() => updateAccountStatus(account.id, "LOCKED")}
                            >
                              Khóa
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
