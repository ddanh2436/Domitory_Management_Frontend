"use client";

import { useEffect, useState } from "react";
import { useToast } from "../../components/ToastProvider";
import { useConfirm } from "../../components/ConfirmProvider";
import { apiClient } from "../../utils/apiClient";

interface UnassignedStudent {
  _id: string;
  fullName: string;
  mssv?: string;
  email?: string;
  gender?: "MALE" | "FEMALE";
}

interface AvailableRoom {
  _id: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  currentOccupancy: number;
  genderType?: "MALE" | "FEMALE" | "MIXED";
  price: number;
}

interface AssignmentResult {
  studentId: string;
  studentName: string;
  mssv?: string;
  roomName?: string;
  status: "ASSIGNED" | "SKIPPED";
  reason?: string;
}

const GENDER_LABEL: Record<string, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  MIXED: "Không phân biệt",
};

const vnd = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

export default function AdminAutoAssignPage() {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [students, setStudents] = useState<UnassignedStudent[]>([]);
  const [rooms, setRooms] = useState<AvailableRoom[]>([]);
  const [freeSlots, setFreeSlots] = useState(0);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<AssignmentResult[] | null>(null);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/assignments/preview");
      if (res.ok) {
        const data = await res.json();
        setStudents(Array.isArray(data.unassignedStudents) ? data.unassignedStudents : []);
        setRooms(Array.isArray(data.availableRooms) ? data.availableRooms : []);
        setFreeSlots(data.freeSlots ?? 0);
      }
    } catch (err) {
      console.error("Lỗi tải dữ liệu phân phòng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPreview();
  }, []);

  const handleRun = async () => {
    const ok = await confirmDialog({
      title: "Chạy phân phòng tự động?",
      message: `Hệ thống sẽ xếp ${students.length} sinh viên chưa có phòng vào ${freeSlots} chỗ trống hiện có (ưu tiên khớp giới tính). Mỗi sinh viên được xếp sẽ tự động có hợp đồng lưu trú và nhận thông báo.`,
      confirmLabel: "Chạy phân phòng",
      variant: "primary",
    });
    if (!ok) return;

    setRunning(true);
    setResults(null);
    try {
      const res = await apiClient.post("/assignments/auto", {});
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Đã chạy phân phòng tự động.", "Phân phòng hoàn tất 🏠");
        setResults(Array.isArray(data.results) ? data.results : []);
        void loadPreview();
      } else {
        toast.error(data.message || "Không chạy được phân phòng tự động.");
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="adm-page px-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700&family=DM+Sans:wght@400;500;700&display=swap');

        .adm-page { max-width: 1180px; margin: 0 auto; padding-top: 24px; padding-bottom: 48px; color: #0D1B2A; font-family: 'DM Sans', sans-serif; }
        .panel { background: #fff; border: 1px solid rgba(13,27,42,0.09); border-radius: 20px; padding: 28px 32px; box-shadow: 0 10px 24px rgba(13,27,42,0.04); overflow: hidden; margin-bottom: 24px; }
        .panel-title { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 24px; font-weight: 700; color: #0D1B2A; margin-bottom: 8px; letter-spacing: -0.5px; }
        .panel-sub { font-size: 13.5px; color: #64748b; line-height: 1.6; max-width: 640px; }

        .aa-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin: 22px 0; }
        .aa-stat { background: #FAFAF9; border: 1px solid rgba(13,27,42,0.07); border-radius: 14px; padding: 18px 20px; }
        .aa-stat-num { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 28px; font-weight: 700; color: #0D1B2A; }
        .aa-stat-label { font-size: 12px; color: #8A9BAD; font-weight: 600; margin-top: 3px; }

        .aa-run-btn { display: inline-flex; align-items: center; gap: 9px; background: #0D1B2A; color: #fff; border: none; padding: 13px 26px; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 14px; cursor: pointer; transition: all .18s; }
        .aa-run-btn:hover:not(:disabled) { background: #1A2E42; transform: translateY(-1px); box-shadow: 0 8px 20px rgba(13,27,42,.2); }
        .aa-run-btn:disabled { opacity: .5; cursor: not-allowed; }

        .adm-table { width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; }
        .adm-table th { padding: 14px 18px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #8A9BAD; border-bottom: 1px solid rgba(13,27,42,0.08); background: #f8fafc; }
        .adm-table th:first-child { border-top-left-radius: 12px; border-bottom-left-radius: 12px; padding-left: 22px; }
        .adm-table th:last-child { border-top-right-radius: 12px; border-bottom-right-radius: 12px; }
        .adm-table td { padding: 15px 18px; border-bottom: 1px solid rgba(13,27,42,0.04); vertical-align: middle; font-size: 13.5px; color: #37485c; }
        .adm-table td:first-child { padding-left: 22px; }
        .adm-table tr:last-child td { border-bottom: none; }
        .adm-table tr:hover td { background: #fcfcfb; }

        .badge { display: inline-flex; align-items: center; padding: 5px 11px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; }
        .badge--assigned { background: rgba(34,197,94,0.12); color: #16a34a; }
        .badge--skipped { background: rgba(245,158,11,0.12); color: #d97706; }
        .badge--gender-m { background: rgba(59,130,246,0.1); color: #2563eb; }
        .badge--gender-f { background: rgba(236,72,153,0.1); color: #db2777; }
        .badge--gender-x { background: rgba(13,27,42,0.06); color: #64748b; }

        .aa-section-title { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 17px; font-weight: 700; color: #0D1B2A; margin-bottom: 16px; }
        .aa-empty { text-align: center; padding: 40px 20px; color: #8A9BAD; font-size: 13.5px; }
        .aa-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        @media (max-width: 900px) { .aa-grid { grid-template-columns: 1fr; } }
        .aa-note { padding: 12px 16px; border-radius: 10px; background: rgba(59,130,246,.07); border: 1px solid rgba(59,130,246,.18); color: #1d4ed8; font-size: 13px; line-height: 1.6; margin-top: 16px; }
      `}</style>

      {/* Điều khiển */}
      <div className="panel">
        <h2 className="panel-title">Phân phòng tự động</h2>
        <p className="panel-sub">
          Xếp hàng loạt sinh viên chưa có phòng vào các phòng còn chỗ trống — dùng vào đầu năm học.
          Hệ thống ưu tiên khớp giới tính: phòng Nam/Nữ chỉ nhận sinh viên tương ứng, phòng &quot;Không phân biệt&quot; nhận tất cả.
          Mỗi sinh viên được xếp sẽ tự động có đơn đặt phòng đã duyệt + hợp đồng lưu trú.
        </p>

        <div className="aa-stats">
          <div className="aa-stat">
            <div className="aa-stat-num">{loading ? "—" : students.length}</div>
            <div className="aa-stat-label">Sinh viên chưa có phòng</div>
          </div>
          <div className="aa-stat">
            <div className="aa-stat-num">{loading ? "—" : rooms.length}</div>
            <div className="aa-stat-label">Phòng còn chỗ trống</div>
          </div>
          <div className="aa-stat">
            <div className="aa-stat-num">{loading ? "—" : freeSlots}</div>
            <div className="aa-stat-label">Tổng chỗ trống</div>
          </div>
        </div>

        <button
          type="button"
          className="aa-run-btn"
          disabled={loading || running || students.length === 0 || freeSlots === 0}
          onClick={() => void handleRun()}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {running ? "Đang phân phòng..." : "Chạy phân phòng tự động"}
        </button>

        {!loading && students.length === 0 && (
          <div className="aa-note">Hiện không còn sinh viên nào chưa được xếp phòng. 🎉</div>
        )}
        {!loading && students.length > 0 && freeSlots === 0 && (
          <div className="aa-note">Không còn chỗ trống nào — hãy thêm phòng hoặc chờ sinh viên trả phòng.</div>
        )}
      </div>

      {/* Kết quả lần chạy gần nhất */}
      {results && (
        <div className="panel">
          <div className="aa-section-title">
            Kết quả phân phòng ({results.filter((r) => r.status === "ASSIGNED").length} xếp thành công
            {results.some((r) => r.status === "SKIPPED") ? `, ${results.filter((r) => r.status === "SKIPPED").length} bị bỏ qua` : ""})
          </div>
          {results.length === 0 ? (
            <div className="aa-empty">Không có sinh viên nào trong lượt chạy này.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Sinh viên</th>
                    <th>MSSV</th>
                    <th>Kết quả</th>
                    <th>Phòng được xếp / Lý do bỏ qua</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.studentId}>
                      <td className="font-bold text-[#0D1B2A]">{r.studentName}</td>
                      <td>{r.mssv || "—"}</td>
                      <td>
                        <span className={`badge badge--${r.status.toLowerCase()}`}>
                          {r.status === "ASSIGNED" ? "Đã xếp" : "Bỏ qua"}
                        </span>
                      </td>
                      <td>{r.status === "ASSIGNED" ? `Phòng ${r.roomName}` : r.reason || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Hiện trạng */}
      <div className="aa-grid">
        <div className="panel">
          <div className="aa-section-title">Sinh viên chờ xếp phòng ({students.length})</div>
          {loading ? (
            <div className="aa-empty">Đang tải...</div>
          ) : students.length === 0 ? (
            <div className="aa-empty">Không có sinh viên nào chưa có phòng.</div>
          ) : (
            <div className="overflow-x-auto" style={{ maxHeight: 420, overflowY: "auto" }}>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Họ tên</th>
                    <th>MSSV</th>
                    <th>Giới tính</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s._id}>
                      <td className="font-bold text-[#0D1B2A]">{s.fullName}</td>
                      <td>{s.mssv || "—"}</td>
                      <td>
                        {s.gender ? (
                          <span className={`badge badge--gender-${s.gender === "MALE" ? "m" : "f"}`}>
                            {GENDER_LABEL[s.gender]}
                          </span>
                        ) : (
                          <span className="badge badge--gender-x">Chưa khai</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="aa-section-title">Phòng còn chỗ trống ({rooms.length})</div>
          {loading ? (
            <div className="aa-empty">Đang tải...</div>
          ) : rooms.length === 0 ? (
            <div className="aa-empty">Không còn phòng trống nào.</div>
          ) : (
            <div className="overflow-x-auto" style={{ maxHeight: 420, overflowY: "auto" }}>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Phòng</th>
                    <th>Còn trống</th>
                    <th>Loại phòng</th>
                    <th>Giá/tháng</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <div className="font-bold text-[#2563eb]">{r.name}</div>
                        <div className="text-[#8A9BAD] text-[12px] mt-0.5">Tòa {r.building} · Tầng {r.floor}</div>
                      </td>
                      <td className="font-bold">{r.capacity - r.currentOccupancy} / {r.capacity}</td>
                      <td>
                        <span className={`badge badge--gender-${r.genderType === "MALE" ? "m" : r.genderType === "FEMALE" ? "f" : "x"}`}>
                          {GENDER_LABEL[r.genderType ?? "MIXED"]}
                        </span>
                      </td>
                      <td>{vnd(r.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
