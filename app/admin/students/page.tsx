"use client";

import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Student {
  _id: string;
  fullName: string;
  mssv?: string;
  email: string;
  phone?: string;
  cccd?: string;
  room?: { name: string; building: string };
  status?: string;
  avatar?: string;
}

const Icons = {
  search: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [alertMsg, setAlertMsg] = useState({ text: "", type: "" });
  
  // STATE CHO MODAL SINH VIÊN
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    cccd: "",
    avatar: "" 
  });
  const [adminMessage, setAdminMessage] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const resStudents = await fetch("http://localhost:3001/api/users/students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resStudents.ok) setStudents(await resStudents.json());
    } catch (error) {
      console.error("Lỗi đồng bộ dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Hàm mở Modal khi click vào dòng sinh viên
  const handleRowClick = (student: Student) => {
    setSelectedStudent(student);
    setEditForm({
      fullName: student.fullName || "",
      phone: student.phone || "",
      cccd: student.cccd || "",
      avatar: student.avatar || "", 
    });
    setAdminMessage(""); 
  };

  // HÀM XỬ LÝ UPLOAD ẢNH TỪ MÁY
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Vui lòng chọn ảnh nhỏ hơn 2MB!");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditForm({ ...editForm, avatar: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  // Hàm Cập nhật thông tin & Gửi thông báo
  const handleUpdateAndNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      const token = localStorage.getItem("token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

      const updateRes = await fetch(`${API_URL}/api/users/${selectedStudent._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      if (!updateRes.ok) {
        const err = await updateRes.json().catch(() => ({}));
        setAlertMsg({ text: `Lỗi Backend: ${err.message || "Không thể cập nhật"}`, type: "error" });
        return;
      }

      if (adminMessage.trim() !== "") {
        await fetch(`${API_URL}/api/notifications`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: selectedStudent._id,
            title: "Thông báo từ Ban Quản Lý (Về hồ sơ cá nhân)",
            message: adminMessage,
            isRead: false
          }),
        });
      }

      setAlertMsg({ text: "Đã cập nhật thông tin thành công!", type: "success" });
      setSelectedStudent(null);
      loadData(); 

    } catch (error) {
      console.error(error);
      setAlertMsg({ text: "Có lỗi xảy ra, vui lòng thử lại!", type: "error" });
    }
  };

  // HÀM XỬ LÝ XÓA SINH VIÊN
  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    
    const isConfirm = window.confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN sinh viên ${selectedStudent.fullName} khỏi hệ thống không? Hành động này không thể hoàn tác!`);
    
    if (!isConfirm) return;

    try {
      const token = localStorage.getItem("token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

      const res = await fetch(`${API_URL}/api/users/${selectedStudent._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Không thể xóa sinh viên");
      }

      setAlertMsg({ text: "Đã xóa sinh viên khỏi hệ thống!", type: "success" });
      setSelectedStudent(null); 
      loadData(); 

    } catch (error) {
      console.error(error);
      setAlertMsg({ text: "Lỗi kết nối hoặc Backend chưa mở API xóa!", type: "error" });
    }
  };

  const filteredStudents = students.filter(s =>
    s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    (s.mssv ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full text-slate-800 font-sans relative">
      <style>{`
        :root { --navy: #0D1B2A; --gold: #C9A84C; --gold-dim: rgba(201,168,76,0.18); --gold-border: rgba(201,168,76,0.25); --white: #ffffff; --muted: #8A9BAD; --border: rgba(13,27,42,0.09); --row-hover: rgba(201,168,76,0.04); }
        .panel { background: var(--white); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; margin-bottom: 28px; }
        .panel__header { padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); flex-wrap: wrap; gap: 16px; }
        .panel__title { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 600; color: var(--navy); letter-spacing: -0.2px; }
        .panel__subtitle { font-size: 12.5px; color: var(--muted); }
        .panel__header-right { display: flex; align-items: center; gap: 10px; }
        .search-wrap { position: relative; display: flex; align-items: center; }
        .search-wrap__icon { position: absolute; left: 11px; color: var(--muted); pointer-events: none; display: flex; }
        .search-input { padding: 8px 12px 8px 34px; border: 1px solid var(--border); border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--navy); background: #F9F8F6; outline: none; width: 220px; transition: border-color 0.15s, background 0.15s; }
        .search-input:focus { border-color: var(--gold); background: var(--white); }
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
        .cell-status span { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 100px; font-size: 11.5px; font-weight: 500; background: rgba(34,197,94,0.1); color: #16a34a; border: 1px solid rgba(34,197,94,0.2); }
        .cell-status span::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: #22c55e; }
        .skeleton { display: inline-block; border-radius: 4px; background: linear-gradient(90deg, #F0EDE8 25%, #E8E4DE 50%, #F0EDE8 75%); background-size: 400% 100%; animation: shimmer 1.4s ease infinite; }
        @keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }

        /* Styles cho Student Modal */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(13, 27, 42, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; }
        .modal-card { background: var(--white); border-radius: 16px; border: 1px solid var(--gold-border); width: 440px; max-width: 90%; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); }
        .modal-header { padding: 20px 24px; background: var(--navy); color: var(--white); display: flex; align-items: center; justify-content: space-between; }
        .modal-title { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 600; color: var(--gold); }
        .modal-close { background: transparent; border: none; color: rgba(255,255,255,0.5); cursor: pointer; font-size: 24px; line-height: 1; display: flex; align-items: center; transition: color 0.15s; }
        .modal-close:hover { color: var(--white); }
        .modal-body { padding: 24px; }
        .form-group { margin-bottom: 18px; }
        .form-label { display: block; font-size: 12px; font-weight: 500; color: var(--navy); margin-bottom: 6px; letter-spacing: 0.02em; }
        .form-input-text { width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: var(--navy); background: #F9F8F6; outline: none; transition: border-color 0.15s, background 0.15s; }
        .form-input-text:focus { border-color: var(--gold); background: var(--white); }
        .modal-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; gap: 10px; flex-wrap: wrap; }
        .btn-cancel { padding: 9px 16px; border-radius: 8px; border: 1px solid var(--border); background: transparent; color: var(--navy); font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.15s; }
        .btn-cancel:hover { background: #FAFAF9; }
        .btn-submit { padding: 9px 18px; border-radius: 8px; border: none; background: var(--navy); color: var(--gold); font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid var(--gold-border); transition: background 0.15s; }
        .btn-submit:hover { background: #162a3f; }
        .btn-delete { padding: 9px 14px; border-radius: 8px; border: none; background: #fee2e2; color: #dc2626; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .btn-delete:hover { background: #fca5a5; }
      `}</style>

      {alertMsg.text && (
        <div className={`p-4 rounded-xl font-medium mb-6 border ${alertMsg.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          {alertMsg.text}
        </div>
      )}

      <div className="panel">
        <div className="panel__header">
          <div className="panel__header-left">
            <div className="panel__title">Danh sách sinh viên hệ thống</div>
            <div className="panel__subtitle">Bấm vào sinh viên để sửa thông tin hoặc xóa tài khoản!</div>
          </div>
          <div className="panel__header-right">
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
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => (
                  <tr key={student._id} onClick={() => handleRowClick(student)}>
                    <td className="cell-index">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {student.avatar ? (
                          <img src={student.avatar} alt="Avt" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }} />
                        ) : (
                          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--navy)", color: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold", fontFamily: "'Fraunces', serif" }}>
                            {student.fullName ? student.fullName.charAt(0).toUpperCase() : "S"}
                          </div>
                        )}
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
                    <td className="cell-status"><span>Hoạt động</span></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">Không tìm thấy sinh viên phù hợp.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL CẬP NHẬT HOẶC XÓA SINH VIÊN ───────────────────────────────── */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Hồ sơ Sinh viên</div>
              <button type="button" className="modal-close" onClick={() => setSelectedStudent(null)}>×</button>
            </div>
            <form onSubmit={handleUpdateAndNotify} className="modal-body">
              
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

              <hr style={{ margin: "20px 0", borderTop: "1px solid var(--border)" }} />
              
              <div className="form-group">
                <label className="form-label" style={{ color: "#d9534f", fontWeight: "bold" }}>
                  Lời nhắn từ Ban Quản Lý (Tạo thông báo)
                </label>
                <textarea
                  className="form-input-text"
                  placeholder="VD: Cập nhật lại số điện thoại cho đúng nhé..."
                  value={adminMessage}
                  onChange={e => setAdminMessage(e.target.value)}
                  style={{ resize: "none", height: "70px", fontFamily: "inherit" }}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-delete" onClick={handleDeleteStudent}>
                  🗑️ Xóa sinh viên
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className="btn-cancel" onClick={() => setSelectedStudent(null)}>Hủy bỏ</button>
                  <button type="submit" className="btn-submit">Lưu & Gửi</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}