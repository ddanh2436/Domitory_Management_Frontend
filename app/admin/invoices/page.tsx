"use client";

import { useEffect, useState } from "react";
import { useToast } from "../../components/ToastProvider";
import { useConfirm } from "../../components/ConfirmProvider";
import { apiClient } from "../../utils/apiClient";
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
          max-width: 1180px; 
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
      `}</style>


      <div className="panel">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
           <h2 className="panel-title">Quản lý Hệ thống Hóa đơn</h2>

           <div className="flex flex-wrap items-center gap-3 shrink-0">
            <RoomFilterBar rooms={invoices.map((inv) => inv.room)} value={roomFilter} onChange={setRoomFilter} />
            <button 
              onClick={handleTriggerOverdue}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-bold transition-colors text-[13px] whitespace-nowrap"
            >
              ↻ Quét Quá Hạn
            </button>
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-5 py-2.5 bg-[#C9A84C] text-[#0D1B2A] rounded-lg hover:bg-[#D9B85C] font-bold transition-colors text-[13px] shadow-sm whitespace-nowrap"
            >
              ⚡ Sinh hàng loạt
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 bg-[#0D1B2A] text-white rounded-lg hover:bg-[#1A2E42] font-bold transition-colors text-[13px] shadow-sm whitespace-nowrap"
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
                      {inv.status !== 'PAID' ? (
                        <button 
                          onClick={() => handleMarkAsPaid(inv._id)}
                          className="px-4 py-2 bg-[#f0fdf4] text-[#16a34a] hover:bg-[#dcfce7] border border-[#bbf7d0] rounded-lg font-bold transition-colors text-[13px] whitespace-nowrap"
                        >
                          Xác nhận Thu
                        </button>
                      ) : (
                        <span className="text-[#8A9BAD] italic text-[13px] font-medium">Đã hoàn tất</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TẠO HÓA ĐƠN */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-drop-down">
            
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-[#0D1B2A] mb-1" style={{ fontFamily: "'Fraunces', serif" }}>Tạo Hóa Đơn Mới</h3>
                <p className="text-[13.5px] text-[#8A9BAD]">Lựa chọn phòng và nhập các khoản phí sinh hoạt hàng tháng.</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-slate-400 hover:text-[#dc2626] text-2xl font-bold transition-colors"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreateInvoice} className="p-8 pt-6 space-y-5">
              <div>
                <label className="block text-[13.5px] font-bold text-[#0D1B2A] mb-2">Chọn Phòng</label>
                <select 
                  required
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] font-medium text-slate-800 bg-white transition-all text-[14px]"
                  value={formData.roomId}
                  onChange={(e) => setFormData({...formData, roomId: e.target.value})}
                >
                  <option value="" disabled>-- Lựa chọn phòng --</option>
                  {rooms.map(r => (
                    <option key={r._id} value={r._id}>{r.name} (Tòa {r.building})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13.5px] font-bold text-[#0D1B2A] mb-2">Tháng</label>
                  <input type="number" min="1" max="12" required value={formData.month} onChange={(e) => setFormData({...formData, month: Number(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] font-medium text-slate-800 bg-white transition-all text-[14px]"/>
                </div>
                <div>
                  <label className="block text-[13.5px] font-bold text-[#0D1B2A] mb-2">Năm</label>
                  <input type="number" min="2020" required value={formData.year} onChange={(e) => setFormData({...formData, year: Number(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] font-medium text-slate-800 bg-white transition-all text-[14px]"/>
                </div>
              </div>

              <div>
                <label className="block text-[13.5px] font-bold text-[#0D1B2A] mb-2">Tiền Điện (VNĐ)</label>
                <input type="number" min="0" required value={formData.electricityFee} onChange={(e) => setFormData({...formData, electricityFee: Number(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] font-medium text-slate-800 bg-white transition-all text-[14px]"/>
              </div>

              <div>
                <label className="block text-[13.5px] font-bold text-[#0D1B2A] mb-2">Tiền Nước (VNĐ)</label>
                <input type="number" min="0" required value={formData.waterFee} onChange={(e) => setFormData({...formData, waterFee: Number(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] font-medium text-slate-800 bg-white transition-all text-[14px]"/>
              </div>

              <div className="pt-5 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold text-[14px] transition-colors">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-5 py-2.5 bg-[#0D1B2A] text-white rounded-lg hover:bg-[#1A2E42] disabled:opacity-50 font-bold text-[14px] transition-colors shadow-sm">
                  {isSubmitting ? "Đang xử lý..." : "Lưu hóa đơn"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SINH HÓA ĐƠN HÀNG LOẠT */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-drop-down max-h-[92vh] flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start shrink-0">
              <div>
                <h3 className="text-2xl font-bold text-[#0D1B2A] mb-1" style={{ fontFamily: "'Fraunces', serif" }}>Sinh hóa đơn hàng loạt</h3>
                <p className="text-[13.5px] text-[#8A9BAD]">Nhập chỉ số điện nước từng phòng — tiền phòng lấy theo giá phòng, phòng đã có hóa đơn kỳ này sẽ được bỏ qua.</p>
              </div>
              <button
                onClick={() => !bulkSubmitting && setShowBulkModal(false)}
                className="text-slate-400 hover:text-[#dc2626] text-2xl font-bold transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleGenerateBulk} className="flex flex-col overflow-hidden">
              <div className="px-8 pt-6 pb-4 shrink-0">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-[12px] font-bold text-[#0D1B2A] mb-1.5">Tháng</label>
                    <input type="text" inputMode="numeric" required value={bulkConfig.month} onChange={(e) => setBulkConfig({ ...bulkConfig, month: sanitizeDigits(e.target.value) })} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#C9A84C] font-medium text-slate-800 bg-white text-[13.5px]" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#0D1B2A] mb-1.5">Năm</label>
                    <input type="text" inputMode="numeric" required value={bulkConfig.year} onChange={(e) => setBulkConfig({ ...bulkConfig, year: sanitizeDigits(e.target.value) })} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#C9A84C] font-medium text-slate-800 bg-white text-[13.5px]" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#0D1B2A] mb-1.5">Hạn đóng</label>
                    <input type="datetime-local" required value={bulkConfig.dueDate} onChange={(e) => setBulkConfig({ ...bulkConfig, dueDate: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#C9A84C] font-medium text-slate-800 bg-white text-[12.5px]" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#0D1B2A] mb-1.5">Giá điện (đ/kWh)</label>
                    <input type="text" inputMode="numeric" required value={bulkConfig.electricityUnitPrice} onChange={(e) => setBulkConfig({ ...bulkConfig, electricityUnitPrice: sanitizeDigits(e.target.value) })} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#C9A84C] font-medium text-slate-800 bg-white text-[13.5px]" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#0D1B2A] mb-1.5">Giá nước (đ/m³)</label>
                    <input type="text" inputMode="numeric" required value={bulkConfig.waterUnitPrice} onChange={(e) => setBulkConfig({ ...bulkConfig, waterUnitPrice: sanitizeDigits(e.target.value) })} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#C9A84C] font-medium text-slate-800 bg-white text-[13.5px]" />
                  </div>
                </div>
              </div>

              <div className="px-8 pb-4 overflow-y-auto grow">
                {occupiedRooms.length === 0 ? (
                  <div className="text-center py-10 text-[#8A9BAD] text-[13.5px] border border-dashed border-slate-200 rounded-xl">
                    Chưa có phòng nào đang có người ở.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[#8A9BAD] rounded-l-lg">Phòng</th>
                        <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[#8A9BAD]">Tiền phòng</th>
                        <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[#8A9BAD]">Điện (kWh)</th>
                        <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[#8A9BAD]">Nước (m³)</th>
                        <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[#8A9BAD] text-right rounded-r-lg">Tổng dự kiến</th>
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
                          <tr key={room._id} className="border-b border-slate-100 last:border-0">
                            <td className="px-4 py-2.5">
                              <div className="font-bold text-[#0D1B2A] text-[13.5px]">{room.name}</div>
                              <div className="text-[#8A9BAD] text-[11.5px]">Tòa {room.building}{room.floor ? ` · Tầng ${room.floor}` : ""}</div>
                            </td>
                            <td className="px-4 py-2.5 text-[13px] text-slate-600 whitespace-nowrap">{(room.price ?? 0).toLocaleString("vi-VN")} đ</td>
                            <td className="px-4 py-2.5">
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                value={reading.kwh}
                                onChange={(e) => setBulkReadings({ ...bulkReadings, [room._id]: { ...reading, kwh: sanitizeDigits(e.target.value) } })}
                                className="w-20 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#C9A84C] text-[13px] text-slate-800"
                              />
                            </td>
                            <td className="px-4 py-2.5">
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                value={reading.m3}
                                onChange={(e) => setBulkReadings({ ...bulkReadings, [room._id]: { ...reading, m3: sanitizeDigits(e.target.value) } })}
                                className="w-20 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#C9A84C] text-[13px] text-slate-800"
                              />
                            </td>
                            <td className="px-4 py-2.5 text-right font-bold text-[#2563eb] text-[13.5px] whitespace-nowrap">{total.toLocaleString("vi-VN")} đ</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="px-8 py-5 border-t border-slate-100 flex gap-3 shrink-0">
                <button type="button" onClick={() => setShowBulkModal(false)} disabled={bulkSubmitting} className="flex-1 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold text-[14px] transition-colors">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={bulkSubmitting || occupiedRooms.length === 0} className="flex-[2] px-5 py-2.5 bg-[#0D1B2A] text-white rounded-lg hover:bg-[#1A2E42] disabled:opacity-50 font-bold text-[14px] transition-colors shadow-sm">
                  {bulkSubmitting ? "Đang sinh hóa đơn..." : `Sinh hóa đơn cho ${occupiedRooms.length} phòng`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}