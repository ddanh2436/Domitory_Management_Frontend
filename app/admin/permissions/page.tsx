"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../components/ToastProvider";
import { apiClient } from "../../utils/apiClient";

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

const SearchIcon = (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export default function AdminPermissionsPage() {
  const toast = useToast();
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
        const response = await apiClient.get("/users/access-control");

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Không thể tải danh sách tài khoản.");
        }

        setAccounts(data.map(normalizeAccount).filter((account: AccountAccess) => account.id));
      } catch (error: unknown) {
        setErrorMsg(error instanceof Error ? error.message : "Không thể tải danh sách tài khoản.");
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
      const response = await apiClient.patch(`/users/${id}/access-control`, updateData);

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Không thể cập nhật phân quyền.");
      }

      const updatedAccount = normalizeAccount(data);
      setAccounts((current) =>
        current.map((account) => account.id === id ? updatedAccount : account)
      );
      toast.success("Đã cập nhật phân quyền tài khoản thành công.", "Cập nhật thành công");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Không thể cập nhật phân quyền.";
      setErrorMsg(msg);
      toast.error(msg);
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

  return (
    <div className="w-full font-sans text-slate-800 relative">
      <style>{`
        .panel { background: #fff; border: 1px solid rgba(13,27,42,0.09); border-radius: 12px; overflow: hidden; }
        .panel__header { padding: 20px 24px; border-bottom: 1px solid rgba(13,27,42,0.09); display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .panel__title { font-family: 'Fraunces', Georgia, serif; font-size: 17px; font-weight: 600; color: #0d1b2a; }
        .panel__subtitle { margin-top: 3px; color: #8a9bad; font-size: 12.5px; }
        .panel__body { padding: 24px; }
        .field-label { display: block; margin-bottom: 7px; font-size: 12px; font-weight: 700; color: #0d1b2a; }
        .select-input, .search-input { width: 100%; height: 40px; padding: 0 12px; border: 1px solid rgba(13,27,42,0.15); border-radius: 8px; background: #fbfaf8; color: #0d1b2a; outline: none; font-size: 13.5px; transition: border-color 0.15s, background 0.15s; }
        .select-input:focus, .search-input:focus { border-color: #c9a84c; background: #fff; }
        .search-wrap { position: relative; width: min(420px, 100%); }
        .search-wrap__icon { position: absolute; top: 12px; left: 12px; color: #8a9bad; display: flex; }
        .search-wrap .search-input { padding-left: 36px; }
        .account-list { display: flex; flex-direction: column; gap: 12px; }
        .account-row { display: grid; grid-template-columns: minmax(240px, 1fr) 200px 220px; gap: 14px; align-items: start; padding: 16px; border: 1px solid rgba(13,27,42,0.09); border-radius: 10px; background: #fbfaf8; transition: border-color 0.15s; }
        .account-row:hover { border-color: rgba(201,168,76,0.3); }
        .account-name { font-weight: 700; font-size: 14px; color: #0d1b2a; }
        .account-meta { margin-top: 4px; color: #63778b; font-size: 12px; line-height: 1.5; }
        .status-control { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .status-button { height: 34px; border: 1px solid rgba(13,27,42,0.1); border-radius: 8px; background: #fff; color: #5c6f82; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
        .status-button:disabled, .select-input:disabled { opacity: 0.6; cursor: not-allowed; }
        .status-button:not(:disabled):hover { border-color: rgba(13,27,42,0.2); }
        .status-button--active { border-color: rgba(34,197,94,0.35); background: rgba(34,197,94,0.1); color: #15803d; }
        .status-button--locked { border-color: rgba(220,38,38,0.3); background: rgba(220,38,38,0.08); color: #b91c1c; }
        .state-message { margin-bottom: 14px; padding: 12px 14px; border-radius: 8px; font-size: 13px; }
        .state-message--error { border: 1px solid rgba(220,38,38,0.18); background: rgba(220,38,38,0.08); color: #b91c1c; }
        .empty-state { padding: 40px 20px; border: 1px dashed rgba(13,27,42,0.18); border-radius: 10px; color: #6b7f92; text-align: center; font-size: 14px; }
        @media (max-width: 800px) {
          .account-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <section className="panel">
        <div className="panel__header">
          <div>
            <div className="panel__title">Kiểm soát quyền truy cập</div>
            <div className="panel__subtitle">Tra cứu bằng MSSV hoặc CCCD và điều chỉnh quyền tài khoản</div>
          </div>
          <div className="search-wrap">
            <span className="search-wrap__icon">{SearchIcon}</span>
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
    </div>
  );
}