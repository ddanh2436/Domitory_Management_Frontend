"use client";

import { useEffect, useState } from "react";
import { useToast } from "../../components/ToastProvider";
import { useConfirm } from "../../components/ConfirmProvider";
import { apiClient } from "../../utils/apiClient";
import { exportInvoicePdf } from "../../utils/exportPdf";
import RoomFilterBar, { EMPTY_ROOM_FILTER, matchRoomFilter, type RoomFilterValue } from "../../components/RoomFilterBar";

interface Invoice {
  _id: string;
  room: { _id: string; name: string; building: string; floor?: number };
  month: number;
  year: number;
  roomFee: number;
  electricityFee: number;
  waterFee: number;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  dueDate?: string;
  createdAt: string;
  paidAt?: string;
}

interface Room {
  _id: string;
  name: string;
  building: string;
  floor?: number;
  price?: number;
  currentOccupancy?: number;
}

// Chỉ giữ chữ số, bỏ số 0 thừa ở đầu — tránh bug input số của controlled component
function sanitizeDigits(value: string): string {
  return value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
}

function toDateTimeLocalValue(date: Date) {
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function getDefaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setHours(23, 59, 0, 0);
  return toDateTimeLocalValue(date);
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomFilter, setRoomFilter] = useState<RoomFilterValue>(EMPTY_ROOM_FILTER);
  const toast = useToast();
  const confirmDialog = useConfirm();

  const filteredInvoices = invoices.filter((inv) => matchRoomFilter(roomFilter, inv.room));
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal sinh hóa đơn hàng loạt theo chỉ số điện nước
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkConfig, setBulkConfig] = useState({
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    dueDate: getDefaultDueDate(),
    electricityUnitPrice: "3500",
    waterUnitPrice: "15000",
  });
  const [bulkReadings, setBulkReadings] = useState<Record<string, { kwh: string; m3: string }>>({});
  const [formData, setFormData] = useState({
    roomId: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    electricityFee: 0,
    waterFee: 0,
    dueDate: getDefaultDueDate(),
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const resInvoices = await apiClient.get("/invoices?limit=100");
      if (resInvoices.ok) {
        const result = await resInvoices.json();
        setInvoices(result.data || []);
      }

      const resRooms = await apiClient.get("/rooms?limit=100");
      if (resRooms.ok) {
        const result = await resRooms.json();
        setRooms(result.data || []);
      }
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Đóng modal tạo hóa đơn bằng phím Esc, giống UX của trang Phòng
  useEffect(() => {
    if (!showModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) setShowModal(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showModal, isSubmitting]);

  // Đóng modal sinh hóa đơn hàng loạt bằng phím Esc
  useEffect(() => {
    if (!showBulkModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !bulkSubmitting) setShowBulkModal(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showBulkModal, bulkSubmitting]);

  const handleMarkAsPaid = async (invoiceId: string) => {
    const ok = await confirmDialog({
      title: "Xác nhận đã thu tiền?",
      message: "Hóa đơn sẽ được đánh dấu ĐÃ THU và sinh viên trong phòng nhận được thông báo thanh toán thành công.",
      confirmLabel: "Đã thu tiền",
    });
    if (!ok) return;
    
    try {
      const response = await apiClient.patch(`/invoices/${invoiceId}/pay`);
      
      const data = await response.json();
      if (response.ok) {
        toast.success("Đã xác nhận thu tiền và gửi thông báo cho sinh viên.", "Thanh toán thành công 💰");
        fetchData();
      } else {
        toast.error(data.message || "Không xác nhận được thanh toán.");
      }
    } catch (error) {
      toast.error("Không thể kết nối đến máy chủ.");
    }
  };

  const handleTriggerOverdue = async () => {
    try {
      const response = await apiClient.post("/invoices/trigger-overdue", {});
      if (response.ok) {
        toast.success("Đã quét và cập nhật các hóa đơn quá hạn!", "Hoàn tất");
        fetchData();
      }
    } catch (error) {
      toast.error("Không thể kết nối đến máy chủ.");
    }
  };

  // Sinh hóa đơn hàng loạt: gửi chỉ số điện nước từng phòng lên backend
  const occupiedRooms = rooms.filter((r) => (r.currentOccupancy ?? 0) > 0);

  const handleGenerateBulk = async (e: React.FormEvent) => {
    e.preventDefault();

    const readings = occupiedRooms.map((room) => ({
      roomId: room._id,
      electricityKwh: Number(bulkReadings[room._id]?.kwh || 0),
      waterM3: Number(bulkReadings[room._id]?.m3 || 0),
    }));

    if (readings.length === 0) {
      toast.error("Không có phòng nào đang có người ở để sinh hóa đơn.");
      return;
    }

    const ok = await confirmDialog({
      title: `Sinh hóa đơn tháng ${bulkConfig.month}/${bulkConfig.year}?`,
      message: `Hệ thống sẽ tạo hóa đơn cho ${readings.length} phòng đang có người ở (tiền phòng + điện nước theo chỉ số đã nhập) và gửi thông báo đến sinh viên. Phòng đã có hóa đơn kỳ này sẽ tự động được bỏ qua.`,
      confirmLabel: "Sinh hóa đơn",
    });
    if (!ok) return;

    setBulkSubmitting(true);
    try {
      const response = await apiClient.post("/invoices/generate-bulk", {
        month: Number(bulkConfig.month),
        year: Number(bulkConfig.year),
        dueDate: new Date(bulkConfig.dueDate).toISOString(),
        electricityUnitPrice: Number(bulkConfig.electricityUnitPrice || 0),
        waterUnitPrice: Number(bulkConfig.waterUnitPrice || 0),
        readings,
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message, "Sinh hóa đơn hàng loạt 🧾");
        if (data.errors?.length > 0) {
          toast.info(data.errors.slice(0, 3).join(" · "));
        }
        setShowBulkModal(false);
        setBulkReadings({});
        fetchData();
      } else {
        toast.error(data.message || "Không sinh được hóa đơn hàng loạt.");
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await apiClient.post("/invoices", {
        ...formData,
        electricityFee: Number(formData.electricityFee),
        waterFee: Number(formData.waterFee),
        dueDate: new Date(formData.dueDate).toISOString(),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Đã tạo hóa đơn mới cho phòng thành công!", "Tạo hóa đơn thành công");
        setShowModal(false);
        setFormData({
          roomId: "",
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          electricityFee: 0,
          waterFee: 0,
          dueDate: getDefaultDueDate(),
        });
        fetchData();
      } else {
        toast.error(data.message || "Không tạo được hóa đơn.");
      }
    } catch (error) {
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="adm-page px-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700&family=DM+Sans:wght@400;500;700&display=swap');
        
        .adm-page { 
          max-width: 1300px; 
          margin: 0 auto; 
          padding-top: 24px;
          padding-bottom: 48px;
          color: #0D1B2A; 
          font-family: 'DM Sans', sans-serif; 
        }
        
        .panel { 
          background: #fff; 
          border: 1px solid rgba(13,27,42,0.09); 
          border-radius: 20px; 
          padding: 28px 32px; 
          box-shadow: 0 10px 24px rgba(13,27,42,0.04); 
          overflow: hidden; 
        }
        
        .panel-title { 
          font-family: 'Fraunces', serif; 
          font-size: 24px; 
          font-weight: 700; 
          color: #0D1B2A; 
          letter-spacing: -0.5px; 
          margin: 0;
        }
        
        .adm-table { 
          width: 100%; 
          border-collapse: separate; 
          border-spacing: 0; 
          text-align: left; 
        }
        
        .adm-table th { 
          padding: 16px 20px; 
          font-size: 11px; 
          font-weight: 700; 
          text-transform: uppercase; 
          letter-spacing: 0.08em; 
          color: #8A9BAD; 
          border-bottom: 1px solid rgba(13,27,42,0.08); 
          background: #f8fafc; 
        }
        
        .adm-table th:first-child { 
          border-top-left-radius: 12px; 
          border-bottom-left-radius: 12px; 
          padding-left: 24px;
        }
        
        .adm-table th:last-child { 
          border-top-right-radius: 12px; 
          border-bottom-right-radius: 12px; 
          text-align: center; 
        }
        
        .adm-table td { 
          padding: 20px; 
          border-bottom: 1px solid rgba(13,27,42,0.04); 
          vertical-align: middle; 
        }
        
        .adm-table td:first-child {
          padding-left: 24px;
        }
        
        .adm-table tr:last-child td { 
          border-bottom: none; 
        }
        
        .adm-table tr:hover td { 
          background: #fcfcfb; 
        }
        
        .badge { 
          display: inline-flex; 
          align-items: center; 
          padding: 6px 12px; 
          border-radius: 999px; 
          font-size: 11px; 
          font-weight: 800; 
          letter-spacing: 0.04em; 
          text-transform: uppercase; 
        }
        
        .badge--pending { background: rgba(245,158,11,0.12); color: #d97706; }
        .badge--paid { background: rgba(34,197,94,0.12); color: #16a34a; }
        .badge--overdue { background: rgba(239,68,68,0.12); color: #dc2626; }

        @keyframes dropDownModal {
          0% { transform: translateY(-10vh); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-drop-down {
          animation: dropDownModal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* ── MODAL TẠO HÓA ĐƠN — cùng ngôn ngữ thiết kế với modal Thêm phòng mới ── */
        @keyframes ivModalIn { from { opacity: 0; transform: scale(0.97) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .iv-overlay { position: fixed; inset: 0; background: rgba(13,27,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(3px); padding: 20px; }
        .iv-modal { background: #fff; border-radius: 12px; width: 100%; max-width: 560px; box-shadow: 0 24px 60px rgba(13,27,42,0.3); max-height: 92vh; overflow-y: auto; animation: ivModalIn .18s cubic-bezier(.22,1,.36,1); }
        .iv-modal-head { padding: 22px 26px; border-bottom: 1px solid rgba(13,27,42,0.09); display: flex; align-items: center; gap: 14px; }
        .iv-modal-icon { width: 46px; height: 46px; border-radius: 11px; background: rgba(201,168,76,0.14); color: #9a7b2c; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .iv-modal-title { font-family: 'Fraunces', serif; font-size: 19px; font-weight: 700; color: #0D1B2A; }
        .iv-modal-sub { font-size: 13px; color: #8A9BAD; margin-top: 2px; }
        .iv-modal-body { padding: 24px 26px; }

        .iv-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 17px; }
        .iv-label { font-size: 12.5px; font-weight: 700; color: #0D1B2A; }
        .iv-input, .iv-select { width: 100%; height: 44px; padding: 0 14px; border: 1px solid rgba(13,27,42,0.15); border-radius: 8px; background: #fbfaf8; color: #0D1B2A; outline: none; font-size: 14px; font-weight: 500; font-family: 'DM Sans', sans-serif; transition: border-color .15s, background .15s, box-shadow .15s; }
        .iv-input:focus, .iv-select:focus { border-color: #C9A84C; background: #fff; box-shadow: 0 0 0 3px rgba(201,168,76,0.15); }
        .iv-input::placeholder { color: #b6c2cd; }
        .iv-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%238A9BAD' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 38px; }
        .iv-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        .iv-modal-foot { display: flex; gap: 12px; padding: 20px 26px 24px; border-top: 1px solid rgba(13,27,42,0.07); background: #FBFAF8; }
        .iv-btn-cancel { flex: 1; height: 46px; border: 1px solid rgba(13,27,42,0.15); border-radius: 8px; background: #fff; color: #0D1B2A; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: background .15s; }
        .iv-btn-cancel:hover { background: #F5F3EF; }
        .iv-btn-submit { flex: 2; height: 46px; border: none; border-radius: 8px; background: #0D1B2A; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: background .18s; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
        .iv-btn-submit:hover:not(:disabled) { background: #1A2E42; }
        .iv-btn-submit:disabled { opacity: .55; cursor: not-allowed; }

        /* ── MODAL SINH HÓA ĐƠN HÀNG LOẠT — mở rộng từ hệ iv- ── */
        .iv-modal--wide { max-width: 960px; }
        .iv-modal-body--flush { padding: 22px 26px 20px; border-bottom: 1px solid rgba(13,27,42,0.09); }
        .iv-config-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; }
        .iv-field-sm { display: flex; flex-direction: column; gap: 6px; }
        .iv-label-sm { font-size: 11.5px; font-weight: 700; color: #0D1B2A; }
        .iv-input-sm { width: 100%; height: 40px; padding: 0 11px; border: 1px solid rgba(13,27,42,0.15); border-radius: 8px; background: #fbfaf8; color: #0D1B2A; outline: none; font-size: 13px; font-weight: 500; font-family: 'DM Sans', sans-serif; transition: border-color .15s, background .15s, box-shadow .15s; }
        .iv-input-sm:focus { border-color: #C9A84C; background: #fff; box-shadow: 0 0 0 3px rgba(201,168,76,0.15); }

        .iv-table-wrap { padding: 18px 26px 22px; overflow-y: auto; flex-grow: 1; background: #FBFAF8; }
        .iv-empty { text-align: center; padding: 44px 20px; color: #8A9BAD; font-size: 13.5px; border: 1px dashed rgba(13,27,42,0.15); border-radius: 10px; background: #fff; }
        .iv-table { width: 100%; border-collapse: collapse; text-align: left; background: #fff; border: 1px solid rgba(13,27,42,0.08); border-radius: 10px; overflow: hidden; }
        .iv-table th { padding: 12px 18px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #9a7b2c; background: rgba(201,168,76,0.08); border-bottom: 1px solid rgba(13,27,42,0.08); }
        .iv-table th:last-child { text-align: right; }
        .iv-table td { padding: 12px 18px; border-bottom: 1px solid rgba(13,27,42,0.06); vertical-align: middle; }
        .iv-table tr:last-child td { border-bottom: none; }
        .iv-table tr:hover td { background: #fbfaf8; }
        .iv-table-room { font-weight: 700; color: #0D1B2A; font-size: 14px; }
        .iv-table-sub { color: #8A9BAD; font-size: 12px; margin-top: 2px; }
        .iv-table-input { width: 92px; height: 38px; padding: 0 12px; border: 1px solid rgba(13,27,42,0.15); border-radius: 8px; background: #fbfaf8; color: #0D1B2A; outline: none; font-size: 13.5px; font-weight: 500; font-family: 'DM Sans', sans-serif; transition: border-color .15s, background .15s, box-shadow .15s; }
        .iv-table-input:focus { border-color: #C9A84C; background: #fff; box-shadow: 0 0 0 3px rgba(201,168,76,0.15); }
        .iv-table-total { text-align: right; font-weight: 800; color: #2563eb; font-size: 14.5px; white-space: nowrap; }

        @media (max-width: 760px) { .iv-config-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .iv-grid2 { grid-template-columns: 1fr; } }
      `}</style>

      <div className="panel">
        
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4">
           <h2 className="panel-title shrink-0">Quản lý Hệ thống Hóa đơn</h2>

           <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <RoomFilterBar rooms={invoices.map((inv) => inv.room)} value={roomFilter} onChange={setRoomFilter} />
            
            <button 
              onClick={handleTriggerOverdue}
              className="shrink-0 flex items-center justify-center gap-2 h-9 px-4 text-[12.5px] font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
            >
              ↻ Quét Quá Hạn
            </button>
            <button
              onClick={() => setShowBulkModal(true)}
              className="shrink-0 flex items-center justify-center gap-2 h-9 px-4 text-[12.5px] font-semibold bg-[#C9A84C] text-[#0D1B2A] rounded-lg hover:bg-[#D9B85C] shadow-sm transition-colors whitespace-nowrap"
            >
              ⚡ Sinh hàng loạt
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="shrink-0 flex items-center justify-center gap-2 h-9 px-4 text-[12.5px] font-semibold bg-[#0D1B2A] text-white rounded-lg hover:bg-[#1A2E42] shadow-sm transition-colors whitespace-nowrap"
            >
              + Tạo hóa đơn mới
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Phòng</th>
                <th>Kỳ thu</th>
                <th className="text-right">Tiền phòng</th>
                <th className="text-right">Điện & Nước</th>
                <th className="text-right">Tổng cộng</th>
                <th className="text-center">Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16 text-[#8A9BAD] font-medium text-sm">Đang tải dữ liệu...</td></tr>
              ) : filteredInvoices.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-[#8A9BAD] font-medium text-sm">{invoices.length === 0 ? "Chưa có hóa đơn nào." : "Không có hóa đơn nào khớp bộ lọc."}</td></tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv._id} style={{ transition: 'background-color 0.2s' }}>
                    <td className="whitespace-nowrap">
                      <div className="font-bold text-[#0D1B2A] text-[15px]">{inv.room?.name || 'Phòng đã xóa'}</div>
                      <div className="text-[#8A9BAD] text-[13px] mt-1">Tòa {inv.room?.building || '—'}</div>
                    </td>
                    <td className="whitespace-nowrap text-[#334155] font-bold text-[14px]">
                      Tháng {inv.month}/{inv.year}
                    </td>
                    <td className="whitespace-nowrap text-right text-[#334155] font-medium text-[14px]">
                      {formatCurrency(inv.roomFee)}
                    </td>
                    <td className="whitespace-nowrap text-right">
                      <div className="text-orange-600 text-[13px] font-bold">⚡ {formatCurrency(inv.electricityFee)}</div>
                      <div className="text-cyan-600 text-[13px] font-bold mt-1">💧 {formatCurrency(inv.waterFee)}</div>
                    </td>
                    <td className="whitespace-nowrap text-right font-black text-[#2563eb] text-[16px]">
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td className="whitespace-nowrap text-center">
                      <span className={`badge ${
                        inv.status === 'PAID' ? 'badge--paid' :
                        inv.status === 'OVERDUE' ? 'badge--overdue' : 'badge--pending'
                      }`}>
                        {inv.status === 'PAID' ? 'ĐÃ THU' : inv.status === 'OVERDUE' ? 'QUÁ HẠN' : 'CHỜ THU'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        {inv.status !== 'PAID' ? (
                          <button
                            onClick={() => handleMarkAsPaid(inv._id)}
                            className="px-4 py-2 bg-[#f0fdf4] text-[#16a34a] hover:bg-[#dcfce7] border border-[#bbf7d0] rounded font-bold transition-colors text-[13px] whitespace-nowrap"
                          >
                            Xác nhận Thu
                          </button>
                        ) : (
                          <span className="text-[#8A9BAD] italic text-[13px] font-medium">Đã hoàn tất</span>
                        )}
                        <button
                          onClick={() =>
                            exportInvoicePdf({
                              roomName: inv.room?.name || "—",
                              building: inv.room?.building,
                              month: inv.month,
                              year: inv.year,
                              roomFee: inv.roomFee,
                              electricityFee: inv.electricityFee,
                              waterFee: inv.waterFee,
                              totalAmount: inv.totalAmount,
                              status: inv.status,
                              dueDate: inv.dueDate,
                              paidAt: inv.paidAt,
                              createdAt: inv.createdAt,
                            })
                          }
                          title="Xuất hóa đơn PDF"
                          className="px-3 py-2 bg-white text-slate-600 hover:text-[#0D1B2A] hover:border-[#C9A84C] border border-slate-200 rounded font-bold transition-colors text-[13px] whitespace-nowrap"
                        >
                          📄 PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TẠO HÓA ĐƠN — thiết kế lớn, thoáng, đồng bộ với modal Thêm phòng mới */}
      {showModal && (
        <div
          className="iv-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) setShowModal(false);
          }}
        >
          <div className="iv-modal" role="dialog" aria-modal="true" aria-labelledby="iv-modal-title">
            <div className="iv-modal-head">
              <div className="iv-modal-icon">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <div>
                <div id="iv-modal-title" className="iv-modal-title">Tạo Hóa Đơn Mới</div>
                <div className="iv-modal-sub">Lựa chọn phòng và nhập các khoản phí sinh hoạt hàng tháng</div>
              </div>
            </div>

            <form onSubmit={handleCreateInvoice}>
              <div className="iv-modal-body">
                <div className="iv-field">
                  <label className="iv-label" htmlFor="iv-room">Chọn Phòng *</label>
                  <select
                    id="iv-room"
                    required
                    className="iv-select"
                    value={formData.roomId}
                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  >
                    <option value="" disabled>-- Lựa chọn phòng --</option>
                    {rooms.map((r) => (
                      <option key={r._id} value={r._id}>{r.name} (Tòa {r.building})</option>
                    ))}
                  </select>
                </div>

                <div className="iv-grid2">
                  <div className="iv-field">
                    <label className="iv-label" htmlFor="iv-month">Tháng *</label>
                    <input
                      id="iv-month"
                      type="number" min="1" max="12" required
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                      placeholder="Ví dụ: 8"
                      className="iv-input"
                    />
                  </div>
                  <div className="iv-field">
                    <label className="iv-label" htmlFor="iv-year">Năm *</label>
                    <input
                      id="iv-year"
                      type="number" min="2020" required
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                      placeholder="Ví dụ: 2026"
                      className="iv-input"
                    />
                  </div>
                </div>

                <div className="iv-grid2">
                  <div className="iv-field">
                    <label className="iv-label" htmlFor="iv-electricity">Tiền Điện (VNĐ) *</label>
                    <input
                      id="iv-electricity"
                      type="number" min="0" required
                      value={formData.electricityFee}
                      onChange={(e) => setFormData({ ...formData, electricityFee: Number(e.target.value) })}
                      placeholder="Ví dụ: 300000"
                      className="iv-input"
                    />
                  </div>
                  <div className="iv-field" style={{ marginBottom: 0 }}>
                    <label className="iv-label" htmlFor="iv-water">Tiền Nước (VNĐ) *</label>
                    <input
                      id="iv-water"
                      type="number" min="0" required
                      value={formData.waterFee}
                      onChange={(e) => setFormData({ ...formData, waterFee: Number(e.target.value) })}
                      placeholder="Ví dụ: 100000"
                      className="iv-input"
                    />
                  </div>
                </div>
              </div>

              <div className="iv-modal-foot">
                <button type="button" onClick={() => setShowModal(false)} disabled={isSubmitting} className="iv-btn-cancel">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={isSubmitting} className="iv-btn-submit">
                  {isSubmitting ? (
                    "Đang xử lý..."
                  ) : (
                    <>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Lưu hóa đơn mới
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SINH HÓA ĐƠN HÀNG LOẠT — cùng hệ thiết kế iv- với modal Tạo hóa đơn mới */}
      {showBulkModal && (
        <div
          className="iv-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !bulkSubmitting) setShowBulkModal(false);
          }}
        >
          <div className="iv-modal iv-modal--wide" style={{ display: "flex", flexDirection: "column" }} role="dialog" aria-modal="true" aria-labelledby="iv-bulk-modal-title">
            <div className="iv-modal-head">
              <div className="iv-modal-icon">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
              <div>
                <div id="iv-bulk-modal-title" className="iv-modal-title">Sinh hóa đơn hàng loạt</div>
                <div className="iv-modal-sub">Nhập chỉ số điện nước từng phòng, phòng đã có hóa đơn kỳ này sẽ được bỏ qua</div>
              </div>
            </div>

            <form onSubmit={handleGenerateBulk} style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1 }}>
              <div className="iv-modal-body--flush">
                <div className="iv-config-grid">
                  <div className="iv-field-sm">
                    <label className="iv-label-sm" htmlFor="iv-bulk-month">Tháng *</label>
                    <input id="iv-bulk-month" type="text" inputMode="numeric" required value={bulkConfig.month} onChange={(e) => setBulkConfig({ ...bulkConfig, month: sanitizeDigits(e.target.value) })} className="iv-input-sm" />
                  </div>
                  <div className="iv-field-sm">
                    <label className="iv-label-sm" htmlFor="iv-bulk-year">Năm *</label>
                    <input id="iv-bulk-year" type="text" inputMode="numeric" required value={bulkConfig.year} onChange={(e) => setBulkConfig({ ...bulkConfig, year: sanitizeDigits(e.target.value) })} className="iv-input-sm" />
                  </div>
                  <div className="iv-field-sm">
                    <label className="iv-label-sm" htmlFor="iv-bulk-due">Hạn đóng *</label>
                    <input id="iv-bulk-due" type="datetime-local" required value={bulkConfig.dueDate} onChange={(e) => setBulkConfig({ ...bulkConfig, dueDate: e.target.value })} className="iv-input-sm" style={{ padding: "0 8px" }} />
                  </div>
                  <div className="iv-field-sm">
                    <label className="iv-label-sm" htmlFor="iv-bulk-elec">Giá điện (đ) *</label>
                    <input id="iv-bulk-elec" type="text" inputMode="numeric" required value={bulkConfig.electricityUnitPrice} onChange={(e) => setBulkConfig({ ...bulkConfig, electricityUnitPrice: sanitizeDigits(e.target.value) })} className="iv-input-sm" />
                  </div>
                  <div className="iv-field-sm">
                    <label className="iv-label-sm" htmlFor="iv-bulk-water">Giá nước (đ) *</label>
                    <input id="iv-bulk-water" type="text" inputMode="numeric" required value={bulkConfig.waterUnitPrice} onChange={(e) => setBulkConfig({ ...bulkConfig, waterUnitPrice: sanitizeDigits(e.target.value) })} className="iv-input-sm" />
                  </div>
                </div>
              </div>

              <div className="iv-table-wrap">
                {occupiedRooms.length === 0 ? (
                  <div className="iv-empty">Chưa có phòng nào đang có người ở.</div>
                ) : (
                  <table className="iv-table">
                    <thead>
                      <tr>
                        <th>Phòng</th>
                        <th>Tiền phòng</th>
                        <th>Điện (kWh)</th>
                        <th>Nước (m³)</th>
                        <th>Tổng dự kiến</th>
                      </tr>
                    </thead>
                    <tbody>
                      {occupiedRooms.map((room) => {
                        const reading = bulkReadings[room._id] || { kwh: "", m3: "" };
                        const total =
                          (room.price ?? 0) +
                          Number(reading.kwh || 0) * Number(bulkConfig.electricityUnitPrice || 0) +
                          Number(reading.m3 || 0) * Number(bulkConfig.waterUnitPrice || 0);
                        return (
                          <tr key={room._id}>
                            <td>
                              <div className="iv-table-room">{room.name}</div>
                              <div className="iv-table-sub">Tòa {room.building}{room.floor ? ` · Tầng ${room.floor}` : ""}</div>
                            </td>
                            <td style={{ whiteSpace: "nowrap", fontSize: 13.5, color: "#475569", fontWeight: 500 }}>{(room.price ?? 0).toLocaleString("vi-VN")} đ</td>
                            <td>
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                value={reading.kwh}
                                onChange={(e) => setBulkReadings({ ...bulkReadings, [room._id]: { ...reading, kwh: sanitizeDigits(e.target.value) } })}
                                className="iv-table-input"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                value={reading.m3}
                                onChange={(e) => setBulkReadings({ ...bulkReadings, [room._id]: { ...reading, m3: sanitizeDigits(e.target.value) } })}
                                className="iv-table-input"
                              />
                            </td>
                            <td className="iv-table-total">{total.toLocaleString("vi-VN")} đ</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="iv-modal-foot">
                <button type="button" onClick={() => setShowBulkModal(false)} disabled={bulkSubmitting} className="iv-btn-cancel">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={bulkSubmitting || occupiedRooms.length === 0} className="iv-btn-submit">
                  {bulkSubmitting ? (
                    "Đang sinh hóa đơn..."
                  ) : (
                    <>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Sinh hóa đơn cho {occupiedRooms.length} phòng
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}