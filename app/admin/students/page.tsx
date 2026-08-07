"use client";

import { useEffect, useState } from "react";
import { apiClient } from "../../utils/apiClient"; // TÍCH HỢP APICLIENT VÀO ĐÂY
import AvatarLightbox from "../../components/AvatarLightbox";
import { useToast } from "../../components/ToastProvider";
import { useConfirm } from "../../components/ConfirmProvider";
import RoomFilterBar, { EMPTY_ROOM_FILTER, matchRoomFilter, type RoomFilterValue } from "../../components/RoomFilterBar";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Student {
  _id: string;
  fullName: string;
  mssv?: string;
  email: string;
  phone?: string;
  cccd?: string;
  room?: { name: string; building: string; floor?: number };
  accessStatus?: string;
  blockReason?: string;
  avatar?: string;
  behaviorScore?: number;
}

interface Violation {
  _id: string;
  reason: string;
  points: number;
  scoreAfter?: number;
  createdAt: string;
  markedBy?: { fullName?: string };
}

// Danh sách lỗi vi phạm thường gặp để admin chọn nhanh (vẫn có thể tự nhập)
const VIOLATION_PRESETS: { reason: string; points: number }[] = [
  { reason: "Về ký túc xá muộn quá giờ quy định", points: 5 },
  { reason: "Không trực nhật / gây mất vệ sinh chung", points: 5 },
  { reason: "Gây ồn ào, mất trật tự trong giờ yên lặng", points: 10 },
  { reason: "Hút thuốc / sử dụng đồ uống có cồn trong KTX", points: 10 },
  { reason: "Cho người lạ vào phòng hoặc lưu trú trái phép", points: 15 },
  { reason: "Sử dụng thiết bị điện dễ cháy nổ trái phép", points: 20 },
  { reason: "Đánh nhau, gây rối trật tự khu nội trú", points: 30 },
  { reason: "Cờ bạc, tàng trữ vũ khí / chất cấm", points: 40 },
];

const Icons = {
  search: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AdminStudentsPage() {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState<RoomFilterValue>(EMPTY_ROOM_FILTER);
  // Cầu nối: giữ nguyên các lệnh gọi setAlertMsg({text,type}) sẵn có, chuyển sang toast đẹp dùng chung
  const setAlertMsg = ({ text, type }: { text: string; type: string }) => {
    if (!text) return;
    if (type === "success") toast.success(text);
    else if (type === "info") toast.info(text);
    else toast.error(text);
  };
  
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "LOCKED">("ACTIVE");

  // STATE CHO MODAL SINH VIÊN
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [modalTab, setModalTab] = useState<"PROFILE" | "SECURITY" | "BEHAVIOR">("PROFILE");

  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    cccd: "",
    avatar: ""
  });
  const [adminMessage, setAdminMessage] = useState("");
  const [blockReasonInput, setBlockReasonInput] = useState("");

  // Điểm hành vi / vi phạm
  const [violations, setViolations] = useState<Violation[]>([]);
  const [violationForm, setViolationForm] = useState({ reason: "", points: 5 });
  const [presetSel, setPresetSel] = useState<string>(""); // "" = chưa chọn, "custom" = tự nhập, còn lại = index preset
  const [markingViolation, setMarkingViolation] = useState(false);
  // Điểm hành vi hiện tại của sinh viên đang mở modal (cập nhật ngay sau khi trừ)
  const [currentScore, setCurrentScore] = useState<number>(100);

  const loadViolations = async (studentId: string) => {
    try {
      const res = await apiClient.get(`/violations/student/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setViolations(data);
      }
    } catch (error) {
      console.error("Lỗi tải lịch sử vi phạm:", error);
    }
  };

  const handleMarkViolation = async () => {
    if (!selectedStudent) return;
    if (!violationForm.reason.trim()) {
      setAlertMsg({ text: "Vui lòng nhập lý do vi phạm!", type: "error" });
      return;
    }
    setMarkingViolation(true);
    try {
      const res = await apiClient.post("/violations", {
        studentId: selectedStudent._id,
        reason: violationForm.reason.trim(),
        points: Number(violationForm.points),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAlertMsg({ text: `Đã ghi nhận vi phạm. Điểm còn lại: ${data.behaviorScore}/100`, type: "success" });
        setCurrentScore(data.behaviorScore);
        setViolationForm({ reason: "", points: 5 });
        setPresetSel("");
        await loadViolations(selectedStudent._id);
        // Đồng bộ lại điểm trong danh sách bảng
        setStudents((prev) =>
          prev.map((s) => (s._id === selectedStudent._id ? { ...s, behaviorScore: data.behaviorScore } : s)),
        );
      } else {
        setAlertMsg({ text: data.message || "Không ghi nhận được vi phạm", type: "error" });
      }
    } catch (error) {
      console.error(error);
      setAlertMsg({ text: "Lỗi kết nối máy chủ", type: "error" });
    } finally {
      setMarkingViolation(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Đã rút gọn bằng apiClient
      const resStudents = await apiClient.get("/users/students");
      if (resStudents.ok) {
        const data = await resStudents.json();
        setStudents(data);
      }
    } catch (error) {
      console.error("Lỗi đồng bộ dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleRowClick = (student: Student) => {
    setSelectedStudent(student);
    setEditForm({
      fullName: student.fullName || "",
      phone: student.phone || "",
      cccd: student.cccd || "",
      avatar: student.avatar || "", 
    });
    setAdminMessage("");
    setBlockReasonInput("");
    setViolationForm({ reason: "", points: 5 });
    setPresetSel("");
    setViolations([]);
    setCurrentScore(student.behaviorScore ?? 100);
    void loadViolations(student._id);
    setModalTab("PROFILE");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Vui lòng chọn ảnh nhỏ hơn 2MB!");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditForm({ ...editForm, avatar: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateAndNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      // Rút gọn bằng apiClient
      const updateRes = await apiClient.patch(`/users/${selectedStudent._id}`, editForm);

      if (!updateRes.ok) {
        const err = await updateRes.json().catch(() => ({}));
        setAlertMsg({ text: `Lỗi Backend: ${err.message || "Không thể cập nhật"}`, type: "error" });
        return;
      }

      // Đã sửa lại tên trường "recipient" cho chuẩn xác với Schema Notification
      if (adminMessage.trim() !== "") {
        await apiClient.post("/notifications", {
          recipient: selectedStudent._id,
          title: "Thông báo từ Ban Quản Lý",
          message: adminMessage,
          type: "SYSTEM",
          isRead: false
        });
      }

      setAlertMsg({ text: "Đã lưu thay đổi thành công!", type: "success" });
      setSelectedStudent(null);
      loadData(); 

    } catch (error) {
      console.error(error);
      setAlertMsg({ text: "Có lỗi xảy ra, vui lòng thử lại!", type: "error" });
    }
  };

  const handleBlockUser = async () => {
    if (!selectedStudent) return;
    if (!blockReasonInput.trim()) {
      toast.error("Vui lòng nhập lý do khóa tài khoản!");
      return;
    }

    const isConfirm = await confirmDialog({
      title: `Khóa tài khoản ${selectedStudent.fullName}?`,
      message: "Sinh viên này sẽ không thể đăng nhập vào hệ thống cho đến khi được mở khóa.",
      confirmLabel: "Khóa tài khoản",
      variant: "danger",
    });
    if (!isConfirm) return;

    try {
      const res = await apiClient.patch(`/users/${selectedStudent._id}/block`, { reason: blockReasonInput });

      if (!res.ok) throw new Error("Lỗi khi khóa");
      setAlertMsg({ text: "Đã khóa tài khoản thành công!", type: "success" });
      setSelectedStudent(null);
      loadData();
    } catch (error) {
      setAlertMsg({ text: "Không thể khóa tài khoản!", type: "error" });
    }
  };

  const handleUnblockUser = async () => {
    if (!selectedStudent) return;
    
    try {
      const res = await apiClient.patch(`/users/${selectedStudent._id}/unblock`);

      if (!res.ok) throw new Error("Lỗi khi mở khóa");
      setAlertMsg({ text: "Đã mở khóa tài khoản thành công!", type: "success" });
      setSelectedStudent(null);
      loadData();
    } catch (error) {
      setAlertMsg({ text: "Không thể mở khóa tài khoản!", type: "error" });
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    
    const isConfirm = await confirmDialog({
      title: `Xóa vĩnh viễn ${selectedStudent.fullName}?`,
      message: "Toàn bộ dữ liệu của sinh viên sẽ bị xóa khỏi hệ thống. Hành động này không thể hoàn tác!",
      confirmLabel: "Xóa vĩnh viễn",
      variant: "danger",
    });
    if (!isConfirm) return;

    try {
      const res = await apiClient.delete(`/users/${selectedStudent._id}`);

      if (!res.ok) throw new Error("Không thể xóa sinh viên");

      setAlertMsg({ text: "Đã xóa sinh viên khỏi hệ thống!", type: "success" });
      setSelectedStudent(null); 
      loadData(); 
    } catch (error) {
      setAlertMsg({ text: "Lỗi kết nối hoặc Backend chưa mở API xóa!", type: "error" });
    }
  };

  const searchedStudents = students.filter(s =>
    (s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      (s.mssv ?? "").toLowerCase().includes(search.toLowerCase())) &&
    matchRoomFilter(roomFilter, s.room)
  );

  const displayedStudents = searchedStudents.filter(s => {
    if (activeTab === "ACTIVE") return s.accessStatus !== "LOCKED";
    if (activeTab === "LOCKED") return s.accessStatus === "LOCKED";
    return true;
  });

  return (
    <div className="w-full text-slate-800 font-sans relative">
      <style>{`
        :root { --navy: #0D1B2A; --gold: #C9A84C; --gold-dim: rgba(201,168,76,0.18); --gold-border: rgba(201,168,76,0.25); --white: #ffffff; --muted: #8A9BAD; --border: rgba(13,27,42,0.09); --row-hover: rgba(201,168,76,0.04); }
        .panel { background: var(--white); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; margin-bottom: 28px; }
        .panel__header { padding: 20px 24px 10px 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
        .panel__title { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 17px; font-weight: 600; color: var(--navy); letter-spacing: -0.2px; }
        .panel__subtitle { font-size: 12.5px; color: var(--muted); }
        .panel__header-right { display: flex; align-items: center; gap: 10px; }
        .search-wrap { position: relative; display: flex; align-items: center; }
        .search-wrap__icon { position: absolute; left: 11px; color: var(--muted); pointer-events: none; display: flex; }
        .search-input { padding: 8px 12px 8px 34px; border: 1px solid var(--border); border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--navy); background: #F9F8F6; outline: none; width: 220px; transition: border-color 0.15s, background 0.15s; }
        .search-input:focus { border-color: var(--gold); background: var(--white); }
        
        .tabs-container { display: flex; gap: 12px; padding: 0 24px 16px 24px; border-bottom: 1px solid var(--border); background: var(--white); }
        .tab-btn { padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
        .tab-btn.active { background: var(--navy); color: var(--gold); }
        .tab-btn.inactive { background: #f1f5f9; color: var(--muted); }
        .tab-btn.inactive:hover { background: #e2e8f0; }

        .data-table { width: 100%; border-collapse: collapse; }
        .data-table thead tr { border-bottom: 1px solid var(--border); }
        .data-table th { padding: 10px 20px; font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); text-align: left; white-space: nowrap; background: #FAFAF9; }
        .data-table tbody tr { border-bottom: 1px solid var(--border); transition: background 0.12s; cursor: pointer; }
        .data-table tbody tr:hover { background: var(--row-hover); }
        .data-table td { padding: 14px 20px; vertical-align: middle; }
        .cell-index { font-size: 12px; font-weight: 500; color: var(--muted); }
        .cell-name { font-size: 14px; font-weight: 500; color: var(--navy); }
        .cell-mssv { font-size: 13px; font-weight: 500; color: var(--gold); font-family: 'DM Sans', monospace; }
        .cell-email { font-size: 13px; color: #4A6580; }
        .cell-status span { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 100px; font-size: 11.5px; font-weight: 500; }
        
        .status-active { background: rgba(34,197,94,0.1); color: #16a34a; border: 1px solid rgba(34,197,94,0.2); }
        .status-active::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: #22c55e; }
        .status-locked { background: rgba(220,38,38,0.1); color: #dc2626; border: 1px solid rgba(220,38,38,0.2); }
        .status-locked::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: #ef4444; }
        
        .skeleton { display: inline-block; border-radius: 4px; background: linear-gradient(90deg, #F0EDE8 25%, #E8E4DE 50%, #F0EDE8 75%); background-size: 400% 100%; animation: shimmer 1.4s ease infinite; }
        @keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }

        /* Styles cho Student Modal */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(13, 27, 42, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; }
        .modal-card { background: var(--white); border-radius: 16px; border: 1px solid var(--gold-border); width: 440px; max-width: 90%; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); display: flex; flex-direction: column; max-height: 90vh; }
        .modal-header { padding: 20px 24px; background: var(--navy); color: var(--white); display: flex; align-items: center; justify-content: space-between; }
        .modal-title { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 18px; font-weight: 600; color: var(--gold); }
        .modal-close { background: transparent; border: none; color: rgba(255,255,255,0.5); cursor: pointer; font-size: 24px; line-height: 1; display: flex; align-items: center; transition: color 0.15s; }
        .modal-close:hover { color: var(--white); }
        
        .modal-inner-tabs { display: flex; gap: 20px; border-bottom: 1px solid var(--border); padding: 0 24px; background: #fafaf9; }
        .modal-inner-tab-btn { padding: 14px 4px 12px 4px; border: none; background: transparent; font-size: 13.5px; font-weight: 600; color: var(--muted); cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; margin-bottom: -1px; }
        .modal-inner-tab-btn.active { color: var(--navy); border-bottom-color: var(--gold); }
        .modal-inner-tab-btn:hover:not(.active) { color: var(--navy); }
        
        .modal-body { padding: 24px; overflow-y: auto; flex: 1; }
        .form-group { margin-bottom: 18px; }
        .form-label { display: block; font-size: 12px; font-weight: 500; color: var(--navy); margin-bottom: 6px; letter-spacing: 0.02em; }
        .form-input-text { width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: var(--navy); background: #F9F8F6; outline: none; transition: border-color 0.15s, background 0.15s; }
        .form-input-text:focus { border-color: var(--gold); background: var(--white); }
        .modal-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; gap: 10px; flex-wrap: wrap; border-top: 1px solid var(--border); padding-top: 20px; }
        .btn-cancel { padding: 9px 16px; border-radius: 8px; border: 1px solid var(--border); background: transparent; color: var(--navy); font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.15s; }
        .btn-cancel:hover { background: #FAFAF9; }
        .btn-submit { padding: 9px 18px; border-radius: 8px; border: none; background: var(--navy); color: var(--gold); font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid var(--gold-border); transition: background 0.15s; }
        .btn-submit:hover { background: #162a3f; }
        .btn-delete { padding: 9px 14px; border-radius: 8px; border: none; background: #fee2e2; color: #dc2626; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .btn-delete:hover { background: #fca5a5; }
        
        .btn-block { padding: 10px 14px; border-radius: 8px; border: none; background: #fff7ed; color: #ea580c; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid #fed7aa; transition: background 0.15s; display: flex; justify-content: center; width: 100%; }
        .btn-block:hover { background: #ffedd5; }
        .btn-unblock { padding: 10px 14px; border-radius: 8px; border: none; background: #f0fdf4; color: #16a34a; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid #bbf7d0; transition: background 0.15s; display: flex; justify-content: center; width: 100%; }
        .btn-unblock:hover { background: #dcfce7; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
      `}</style>


      <div className="panel">
        <div className="panel__header">
          <div className="panel__header-left">
            <div className="panel__title">Quản lý tài khoản Sinh viên</div>
            <div className="panel__subtitle">Xem danh sách, sửa hồ sơ hoặc khóa tài khoản vi phạm</div>
          </div>
          <div className="panel__header-right">
            <RoomFilterBar rooms={students.map((s) => s.room)} value={roomFilter} onChange={setRoomFilter} />
            <div className="search-wrap">
              <span className="search-wrap__icon">{Icons.search}</span>
              <input
                type="text"
                className="search-input"
                placeholder="Tìm tên, MSSV, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === "ACTIVE" ? "active" : "inactive"}`}
            onClick={() => setActiveTab("ACTIVE")}
          >
            Đang hoạt động ({searchedStudents.filter(s => s.accessStatus !== "LOCKED").length})
          </button>
          <button 
            className={`tab-btn ${activeTab === "LOCKED" ? "active" : "inactive"}`}
            onClick={() => setActiveTab("LOCKED")}
          >
            Bị khóa ({searchedStudents.filter(s => s.accessStatus === "LOCKED").length})
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Họ và Tên</th>
                <th>MSSV / Căn cước</th>
                <th>Email / SĐT</th>
                <th>Phòng hiện tại</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td><span className="skeleton" style={{ width: 20, height: 14 }} /></td>
                    <td><span className="skeleton" style={{ width: 140, height: 14 }} /></td>
                    <td><span className="skeleton" style={{ width: 80, height: 14 }} /></td>
                    <td><span className="skeleton" style={{ width: 180, height: 14 }} /></td>
                    <td><span className="skeleton" style={{ width: 100, height: 14 }} /></td>
                    <td><span className="skeleton" style={{ width: 60, height: 18, borderRadius: 100 }} /></td>
                  </tr>
                ))
              ) : displayedStudents.length > 0 ? (
                displayedStudents.map((student, index) => (
                  <tr key={student._id} onClick={() => handleRowClick(student)}>
                    <td className="cell-index">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <AvatarLightbox name={student.fullName} avatar={student.avatar} size={36} />
                        <span className="cell-name">{student.fullName || "Chưa cập nhật tên"}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-mssv">{student.mssv || "—"}</div>
                      <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>CCCD: {student.cccd || "—"}</div>
                    </td>
                    <td>
                      <div className="cell-email">{student.email}</div>
                      <div style={{ fontSize: "12px", color: "var(--navy)", marginTop: "2px" }}>{student.phone || "Chưa cập nhật SĐT"}</div>
                    </td>
                    <td>
                      <div className="font-bold" style={{ fontSize: "13px", color: "var(--gold)" }}>
                        {student.room ? `P.${student.room.name} - Tòa ${student.room.building}` : "Chưa xếp phòng"}
                      </div>
                    </td>
                    <td className="cell-status">
                      {student.accessStatus === 'LOCKED' ? (
                        <span className="status-locked">Bị khóa</span>
                      ) : (
                        <span className="status-active">Hoạt động</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    {activeTab === "ACTIVE" 
                      ? "Không có sinh viên nào đang hoạt động phù hợp."
                      : "Không có sinh viên nào đang bị khóa."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL QUẢN LÝ SINH VIÊN ───────────────────────────────── */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Hồ sơ Sinh viên</div>
              <button type="button" className="modal-close" onClick={() => setSelectedStudent(null)}>×</button>
            </div>

            <div className="modal-inner-tabs">
              <button 
                type="button" 
                className={`modal-inner-tab-btn ${modalTab === 'PROFILE' ? 'active' : ''}`} 
                onClick={() => setModalTab('PROFILE')}
              >
                Thông tin cá nhân
              </button>
              <button
                type="button"
                className={`modal-inner-tab-btn ${modalTab === 'SECURITY' ? 'active' : ''}`}
                onClick={() => setModalTab('SECURITY')}
              >
                Quản lý quyền & Lời nhắn
              </button>
              <button
                type="button"
                className={`modal-inner-tab-btn ${modalTab === 'BEHAVIOR' ? 'active' : ''}`}
                onClick={() => setModalTab('BEHAVIOR')}
              >
                Điểm hành vi
              </button>
            </div>

            <form onSubmit={handleUpdateAndNotify} className="modal-body">
              
              {/* TAB 1: THÔNG TIN CÁ NHÂN */}
              {modalTab === 'PROFILE' && (
                <div className="animate-fadeIn">
                  <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
                    {editForm.avatar ? (
                      <img 
                        src={editForm.avatar} 
                        alt="Preview" 
                        style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover" as const, border: "2px solid var(--gold)" }} 
                      />
                    ) : (
                      <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#F1EFEA", display: "flex", alignItems: "center" as const, justifyContent: "center" as const, fontSize: "14px", color: "var(--muted)", fontWeight: "bold" }}>
                        Avt
                      </div>
                    )}
                    
                    <div style={{ display: "flex", gap: "10px" }}>
                      <input 
                        type="file" 
                        id="avatarUpload" 
                        accept="image/*" 
                        style={{ display: "none" }} 
                        onChange={handleImageUpload} 
                      />
                      <button 
                        type="button" 
                        style={{ padding: "8px 12px", background: "var(--navy)", color: "var(--gold)", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
                        onClick={() => document.getElementById("avatarUpload")?.click()}
                      >
                        📷 Chọn Ảnh
                      </button>
                      {editForm.avatar && (
                        <button 
                          type="button" 
                          style={{ padding: "8px 12px", background: "transparent", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
                          onClick={() => setEditForm({ ...editForm, avatar: "" })}
                        >
                          Xóa Ảnh
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tài khoản Email</label>
                    <input type="text" className="form-input-text" style={{ backgroundColor: "#F1EFEA", cursor: "not-allowed", color: "var(--muted)" }} value={selectedStudent.email} readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Họ và Tên</label>
                    <input type="text" className="form-input-text" required value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Số điện thoại</label>
                    <input type="text" className="form-input-text" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Số CCCD</label>
                    <input type="text" className="form-input-text" value={editForm.cccd} onChange={(e) => setEditForm({ ...editForm, cccd: e.target.value })} />
                  </div>
                </div>
              )}

              {/* TAB 2: LỜI NHẮN VÀ BẢO MẬT TÀI KHOẢN */}
              {modalTab === 'SECURITY' && (
                <div className="animate-fadeIn">
                  
                  <div className="form-group">
                    <label className="form-label" style={{ color: "var(--navy)", fontWeight: "bold", fontSize: "13px" }}>
                      📨 Gửi lời nhắn / Thông báo đến sinh viên
                    </label>
                    <p style={{fontSize: "12px", color: "var(--muted)", marginBottom: "10px"}}>
                      Thông báo này sẽ xuất hiện ở chuông thông báo của sinh viên khi bạn bấm &quot;Lưu thay đổi&quot;.
                    </p>
                    <textarea
                      className="form-input-text"
                      placeholder="VD: Nhắc nhở nộp phạt vi phạm, bổ sung giấy tờ tạm trú..."
                      value={adminMessage}
                      onChange={e => setAdminMessage(e.target.value)}
                      style={{ resize: "none", height: "80px", fontFamily: "inherit" }}
                    />
                  </div>

                  <hr style={{ margin: "24px 0", borderTop: "1px solid var(--border)" }} />

                  <div className="form-group">
                    <label className="form-label" style={{ color: selectedStudent.accessStatus === 'LOCKED' ? "#16a34a" : "#ea580c", fontWeight: "bold", fontSize: "14px" }}>
                      {selectedStudent.accessStatus === 'LOCKED' ? "🔒 Trạng thái: Đang bị khóa" : "🔓 Quản lý truy cập (Khóa tài khoản)"}
                    </label>
                    
                    {selectedStudent.accessStatus === 'LOCKED' ? (
                      <div style={{ background: "#fef2f2", padding: "16px", borderRadius: "8px", border: "1px solid #fee2e2" }}>
                        <p style={{ fontSize: "13px", color: "#dc2626", marginBottom: "12px", fontWeight: 500 }}>
                          Sinh viên này hiện đang bị chặn đăng nhập.<br/>
                          <span style={{color: "#7f1d1d", marginTop: "4px", display: "inline-block"}}>Lý do: {selectedStudent.blockReason || "Không có lý do"}</span>
                        </p>
                        <button type="button" className="btn-unblock" onClick={handleUnblockUser}>
                          🔓 Mở khóa tài khoản ngay
                        </button>
                      </div>
                    ) : (
                      <div style={{ background: "#fff7ed", padding: "16px", borderRadius: "8px", border: "1px solid #ffedd5" }}>
                        <p style={{ fontSize: "12px", color: "#9a3412", marginBottom: "12px" }}>
                          Khi bị khóa, sinh viên sẽ bị đăng xuất tự động và không thể tiếp tục truy cập vào hệ thống cho đến khi được mở lại.
                        </p>
                        <input 
                          type="text" 
                          className="form-input-text" 
                          placeholder="Nhập lý do khóa tài khoản (bắt buộc)..." 
                          value={blockReasonInput}
                          onChange={(e) => setBlockReasonInput(e.target.value)}
                          style={{ marginBottom: "12px", borderColor: "#fdba74" }}
                        />
                        <button type="button" className="btn-block" onClick={handleBlockUser}>
                          🔒 Xác nhận Khóa tài khoản
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: ĐIỂM HÀNH VI & VI PHẠM */}
              {modalTab === 'BEHAVIOR' && (
                <div className="animate-fadeIn">
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                    padding: "16px 18px", borderRadius: 12, marginBottom: 20,
                    background: currentScore < 60 ? "rgba(239,68,68,0.08)" : "rgba(201,168,76,0.1)",
                    border: `1px solid ${currentScore < 60 ? "rgba(239,68,68,0.25)" : "var(--gold-border)"}`,
                  }}>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                        Điểm hành vi hiện tại
                      </div>
                      <div style={{ fontSize: 13, color: currentScore < 60 ? "#b91c1c" : "#7A5E1A", marginTop: 4 }}>
                        {currentScore < 60 ? "Dưới ngưỡng cảnh báo (60)" : "Trong ngưỡng an toàn"}
                      </div>
                    </div>
                    <div style={{ fontFamily: "'FrauncesAmp', 'Fraunces', serif", fontSize: 34, fontWeight: 700, color: currentScore < 60 ? "#dc2626" : "var(--gold)", whiteSpace: "nowrap" }}>
                      {currentScore}<span style={{ fontSize: 15, color: "var(--muted)", fontWeight: 400 }}>/100</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ color: "var(--navy)", fontWeight: "bold", fontSize: "13px" }}>
                      ⚠️ Ghi nhận vi phạm (trừ điểm)
                    </label>
                    <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "10px" }}>
                      Sinh viên sẽ nhận được thông báo và bị trừ điểm ngay khi bạn bấm &quot;Trừ điểm&quot;.
                    </p>
                    <select
                      className="form-input-text"
                      value={presetSel}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPresetSel(val);
                        if (val === "custom") {
                          setViolationForm({ reason: "", points: 5 });
                        } else if (val !== "") {
                          const p = VIOLATION_PRESETS[Number(val)];
                          setViolationForm({ reason: p.reason, points: p.points });
                        }
                      }}
                      style={{ marginBottom: 12, cursor: "pointer" }}
                    >
                      <option value="">— Chọn nhanh lỗi vi phạm thường gặp —</option>
                      {VIOLATION_PRESETS.map((p, i) => (
                        <option key={i} value={i}>
                          {p.reason} (−{p.points})
                        </option>
                      ))}
                      <option value="custom">✏️ Khác (tự nhập)…</option>
                    </select>
                    <input
                      type="text"
                      className="form-input-text"
                      placeholder="Lý do vi phạm (VD: Về phòng muộn quá giờ quy định)..."
                      value={violationForm.reason}
                      onChange={(e) => {
                        setViolationForm({ ...violationForm, reason: e.target.value });
                        setPresetSel("custom");
                      }}
                      style={{ marginBottom: 12 }}
                    />
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        className="form-input-text"
                        value={violationForm.points}
                        onChange={(e) => {
                          setViolationForm({ ...violationForm, points: Number(e.target.value) });
                          setPresetSel("custom");
                        }}
                        style={{ width: 110 }}
                        title="Số điểm trừ (1-100)"
                      />
                      <span style={{ fontSize: 12.5, color: "var(--muted)" }}>điểm sẽ bị trừ</span>
                      <button
                        type="button"
                        className="btn-block"
                        style={{ marginLeft: "auto", opacity: markingViolation ? 0.6 : 1 }}
                        disabled={markingViolation}
                        onClick={handleMarkViolation}
                      >
                        {markingViolation ? "Đang xử lý…" : "➖ Trừ điểm"}
                      </button>
                    </div>
                  </div>

                  <hr style={{ margin: "22px 0", borderTop: "1px solid var(--border)" }} />

                  <div className="form-group">
                    <label className="form-label" style={{ color: "var(--navy)", fontWeight: "bold", fontSize: "13px", marginBottom: 12, display: "block" }}>
                      📋 Lịch sử vi phạm ({violations.length})
                    </label>
                    {violations.length === 0 ? (
                      <div style={{ padding: 18, textAlign: "center", fontSize: 13, color: "var(--muted)", background: "#F9F8F6", border: "1px dashed var(--border)", borderRadius: 10 }}>
                        Sinh viên này chưa có vi phạm nào.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
                        {violations.map((v) => (
                          <div key={v._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: 10, background: "#FCFBF9" }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--navy)" }}>{v.reason}</div>
                              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                                {new Date(v.createdAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                {v.markedBy?.fullName && ` · bởi ${v.markedBy.fullName}`}
                              </div>
                            </div>
                            <div style={{ fontFamily: "'FrauncesAmp', 'Fraunces', serif", fontSize: 18, fontWeight: 700, color: "#dc2626", whiteSpace: "nowrap" }}>-{v.points}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* FOOTER CHUNG CỦA MODAL */}
              <div className="modal-actions">
                <button type="button" className="btn-delete" onClick={handleDeleteStudent}>
                  🗑️ Xóa sinh viên
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className="btn-cancel" onClick={() => setSelectedStudent(null)}>Hủy bỏ</button>
                  <button type="submit" className="btn-submit">Lưu thay đổi</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}