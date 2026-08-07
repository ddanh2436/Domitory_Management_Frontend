"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../../utils/apiClient";

interface AuditLog {
  _id: string;
  user?: { fullName?: string; email?: string; role?: string };
  userEmail?: string;
  userRole?: string;
  method: string;
  path: string;
  action: string;
  statusCode: number;
  ip?: string;
  createdAt: string;
}

const METHOD_COLORS: Record<string, { color: string; bg: string }> = {
  POST: { color: "#16a34a", bg: "rgba(34,197,94,.1)" },
  PATCH: { color: "#d97706", bg: "rgba(245,158,11,.1)" },
  PUT: { color: "#d97706", bg: "rgba(245,158,11,.1)" },
  DELETE: { color: "#dc2626", bg: "rgba(239,68,68,.1)" },
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Quản trị viên",
  DORMITORY_MANAGER: "Quản lý KTX",
  FLOOR_MANAGER: "Quản lý tầng",
  MAINTENANCE_STAFF: "NV bảo trì",
  STUDENT: "Sinh viên",
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [method, setMethod] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (method) params.set("method", method);
      if (search) params.set("search", search);
      const res = await apiClient.get(`/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data.data) ? data.data : []);
        setTotalPages(data.totalPages ?? 1);
        setTotal(data.total ?? 0);
      }
    } catch (err) {
      console.error("Lỗi tải nhật ký hệ thống:", err);
    } finally {
      setLoading(false);
    }
  }, [page, method, search]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const statusColor = (code: number) =>
    code < 300 ? "#16a34a" : code < 500 ? "#d97706" : "#dc2626";

  return (
    <div className="adm-page px-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700&family=DM+Sans:wght@400;500;700&display=swap');

        .adm-page { max-width: 1180px; margin: 0 auto; padding-top: 24px; padding-bottom: 48px; color: #0D1B2A; font-family: 'DM Sans', sans-serif; }
        .panel { background: #fff; border: 1px solid rgba(13,27,42,0.09); border-radius: 20px; padding: 28px 32px; box-shadow: 0 10px 24px rgba(13,27,42,0.04); overflow: hidden; }
        .panel-title { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 24px; font-weight: 700; color: #0D1B2A; letter-spacing: -0.5px; }
        .panel-sub { font-size: 13px; color: #64748b; margin-top: 6px; }

        .al-toolbar { display: flex; gap: 10px; flex-wrap: wrap; margin: 20px 0; align-items: center; }
        .al-search { flex: 1; min-width: 220px; height: 42px; padding: 0 14px; border: 1px solid rgba(13,27,42,.15); border-radius: 9px; background: #fbfaf8; color: #0D1B2A; outline: none; font-size: 13.5px; font-family: 'DM Sans', sans-serif; }
        .al-search:focus { border-color: #c9a84c; background: #fff; }
        .al-select { height: 42px; padding: 0 12px; border: 1px solid rgba(13,27,42,.15); border-radius: 9px; background: #fbfaf8; color: #0D1B2A; outline: none; font-size: 13.5px; font-family: 'DM Sans', sans-serif; }
        .al-btn { height: 42px; padding: 0 20px; background: #0D1B2A; color: #fff; border: none; border-radius: 9px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600; transition: background .15s; }
        .al-btn:hover { background: #1A2E42; }

        .adm-table { width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; min-width: 860px; }
        .adm-table th { padding: 14px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #8A9BAD; border-bottom: 1px solid rgba(13,27,42,0.08); background: #f8fafc; }
        .adm-table th:first-child { border-top-left-radius: 12px; border-bottom-left-radius: 12px; padding-left: 20px; }
        .adm-table th:last-child { border-top-right-radius: 12px; border-bottom-right-radius: 12px; }
        .adm-table td { padding: 13px 16px; border-bottom: 1px solid rgba(13,27,42,0.04); vertical-align: middle; font-size: 13px; color: #37485c; }
        .adm-table td:first-child { padding-left: 20px; }
        .adm-table tr:last-child td { border-bottom: none; }
        .adm-table tr:hover td { background: #fcfcfb; }

        .al-method { display: inline-flex; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; letter-spacing: .04em; }
        .al-path { font-family: ui-monospace, monospace; font-size: 12px; color: #64748b; max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; vertical-align: middle; }
        .al-empty { text-align: center; padding: 48px 20px; color: #8A9BAD; font-size: 13.5px; }

        .al-pager { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 18px; flex-wrap: wrap; }
        .al-pager-info { font-size: 12.5px; color: #8A9BAD; }
        .al-pager-btns { display: flex; gap: 8px; }
        .al-page-btn { padding: 8px 16px; border: 1px solid rgba(13,27,42,.15); border-radius: 8px; background: #fff; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; color: #0D1B2A; transition: background .15s; }
        .al-page-btn:hover:not(:disabled) { background: #F5F3EF; }
        .al-page-btn:disabled { opacity: .4; cursor: not-allowed; }
      `}</style>

      <div className="panel">
        <h2 className="panel-title">Nhật ký hệ thống</h2>
        <p className="panel-sub">
          Ghi lại mọi thao tác thay đổi dữ liệu: ai làm gì, lúc nào, kết quả ra sao. Nhật ký tự xóa sau 180 ngày.
        </p>

        <form className="al-toolbar" onSubmit={handleSearch}>
          <input
            className="al-search"
            placeholder="Tìm theo email, hành động, đường dẫn..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <select
            className="al-select"
            value={method}
            onChange={(e) => { setMethod(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả thao tác</option>
            <option value="POST">POST — Tạo mới</option>
            <option value="PATCH">PATCH — Cập nhật</option>
            <option value="PUT">PUT — Cập nhật</option>
            <option value="DELETE">DELETE — Xóa</option>
          </select>
          <button type="submit" className="al-btn">Tìm kiếm</button>
        </form>

        <div className="overflow-x-auto">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Người thực hiện</th>
                <th>Hành động</th>
                <th>Thao tác</th>
                <th>Đường dẫn</th>
                <th>Kết quả</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="al-empty">Đang tải nhật ký...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className="al-empty">Không có bản ghi nào khớp bộ lọc.</td></tr>
              ) : (
                logs.map((log) => {
                  const m = METHOD_COLORS[log.method] ?? { color: "#64748b", bg: "rgba(13,27,42,.06)" };
                  const who = log.user?.fullName || log.userEmail || "Khách (chưa đăng nhập)";
                  const role = log.user?.role || log.userRole;
                  return (
                    <tr key={log._id}>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {new Date(log.createdAt).toLocaleString("vi-VN", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                          hour: "2-digit", minute: "2-digit", second: "2-digit",
                        })}
                      </td>
                      <td>
                        <div className="font-bold text-[#0D1B2A] text-[13px]">{who}</div>
                        {role && <div className="text-[#8A9BAD] text-[11.5px] mt-0.5">{ROLE_LABEL[role] ?? role}</div>}
                      </td>
                      <td>{log.action}</td>
                      <td>
                        <span className="al-method" style={{ color: m.color, background: m.bg }}>{log.method}</span>
                      </td>
                      <td><span className="al-path" title={log.path}>{log.path}</span></td>
                      <td>
                        <span style={{ color: statusColor(log.statusCode), fontWeight: 700 }}>{log.statusCode}</span>
                      </td>
                      <td className="text-[#8A9BAD] text-[12px]">{log.ip || "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="al-pager">
          <div className="al-pager-info">
            {total > 0 ? `${total.toLocaleString("vi-VN")} bản ghi · Trang ${page}/${totalPages}` : ""}
          </div>
          <div className="al-pager-btns">
            <button type="button" className="al-page-btn" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
              ← Trước
            </button>
            <button type="button" className="al-page-btn" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
              Sau →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
