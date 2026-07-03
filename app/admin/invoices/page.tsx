"use client";

import { useEffect, useState } from "react";

interface Invoice {
  _id: string;
  room: { _id: string; name: string; building: string };
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
  const [actionMsg, setActionMsg] = useState({ text: "", type: "" });
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      const token = localStorage.getItem("token");
      
      const resInvoices = await fetch("http://localhost:3001/api/invoices?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resInvoices.ok) {
        const result = await resInvoices.json();
        setInvoices(result.data || []);
      }

      const resRooms = await fetch("http://localhost:3001/api/rooms?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    if (!window.confirm(`Xác nhận đã thu tiền cho hóa đơn này?`)) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3001/api/invoices/${invoiceId}/pay`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      if (response.ok) {
        setActionMsg({ text: "Đã xác nhận thanh toán thành công!", type: "success" });
        fetchData(); 
      } else {
        setActionMsg({ text: data.message, type: "error" });
      }
    } catch (error) {
      setActionMsg({ text: "Lỗi kết nối máy chủ", type: "error" });
    }
  };

  const handleTriggerOverdue = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3001/api/invoices/trigger-overdue`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setActionMsg({ text: "Đã quét và cập nhật các hóa đơn quá hạn!", type: "success" });
        fetchData();
      }
    } catch (error) {
      setActionMsg({ text: "Lỗi kết nối máy chủ", type: "error" });
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionMsg({ text: "", type: "" });

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/api/invoices", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...formData,
          electricityFee: Number(formData.electricityFee),
          waterFee: Number(formData.waterFee),
          dueDate: new Date(formData.dueDate).toISOString(),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setActionMsg({ text: "Tạo hóa đơn thành công!", type: "success" });
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
        setActionMsg({ text: data.message || "Lỗi tạo hóa đơn", type: "error" });
      }
    } catch (error) {
      setActionMsg({ text: "Lỗi kết nối đến máy chủ", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="w-full space-y-8 text-slate-800 font-sans relative p-6 md:p-8">
      
      {/* ── CSS KEYFRAMES CHO HIỆU ỨNG MODAL ── */}
      <style>{`
        @keyframes dropDownModal {
          0% { transform: translateY(-100vh); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-drop-down {
          animation: dropDownModal 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}</style>

      {actionMsg.text && (
        <div 
          className={`py-5 rounded-2xl font-bold text-base border ${actionMsg.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}
          style={{ paddingLeft: '32px', paddingRight: '32px' }}
        >
          {actionMsg.text}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 py-6 sm:py-10">
        
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
           <h2 className="text-2xl font-bold text-slate-800" style={{ paddingLeft: '32px' }}>
             Quản lý Hệ thống Hóa đơn
           </h2>
           
           <div className="flex gap-4 shrink-0" style={{ paddingRight: '32px' }}>
            <button 
              onClick={handleTriggerOverdue}
              className="px-10 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-colors text-sm whitespace-nowrap shrink-0"
            >
              ↻ Quét Quá Hạn
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="px-10 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-colors text-sm shadow-sm whitespace-nowrap shrink-0"
            >
              + Tạo hóa đơn mới
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-base">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-5 text-left font-bold text-slate-600 rounded-tl-2xl" style={{ paddingLeft: '32px', paddingRight: '32px' }}>Phòng</th>
                <th className="px-8 py-5 text-left font-bold text-slate-600">Kỳ thu</th>
                <th className="px-8 py-5 text-right font-bold text-slate-600">Tiền phòng</th>
                <th className="px-8 py-5 text-right font-bold text-slate-600">Điện & Nước</th>
                <th className="px-8 py-5 text-right font-bold text-slate-600">Tổng cộng</th>
                <th className="px-8 py-5 text-center font-bold text-slate-600">Trạng thái</th>
                <th className="py-5 text-center font-bold text-slate-600 rounded-tr-2xl" style={{ paddingLeft: '32px', paddingRight: '32px' }}>Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500 text-lg">Đang tải dữ liệu...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500 text-lg">Chưa có hóa đơn nào.</td></tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-6 whitespace-nowrap" style={{ paddingLeft: '32px', paddingRight: '32px' }}>
                      <div className="font-bold text-slate-800 text-[17px]">{inv.room?.name || 'Phòng đã xóa'}</div>
                      <div className="text-slate-500 text-sm mt-1">Tòa {inv.room?.building || '—'}</div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-slate-600 font-bold">
                      Tháng {inv.month}/{inv.year}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-right text-slate-600 font-medium">
                      {formatCurrency(inv.roomFee)}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-right">
                      <div className="text-orange-600 text-[14px] font-bold">⚡ {formatCurrency(inv.electricityFee)}</div>
                      <div className="text-cyan-600 text-[14px] font-bold mt-1">💧 {formatCurrency(inv.waterFee)}</div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-right font-black text-blue-700 text-[18px]">
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-center">
                      <span className={`inline-flex px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border ${
                        inv.status === 'PAID' ? 'bg-green-100 text-green-700 border-green-200' :
                        inv.status === 'OVERDUE' ? 'bg-red-100 text-red-700 border-red-200' : 
                        'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        {inv.status === 'PAID' ? 'ĐÃ THU' : inv.status === 'OVERDUE' ? 'QUÁ HẠN' : 'CHỜ THU'}
                      </span>
                    </td>
                    <td className="py-6 whitespace-nowrap text-center" style={{ paddingLeft: '32px', paddingRight: '32px' }}>
                      {inv.status !== 'PAID' ? (
                        <button 
                          onClick={() => handleMarkAsPaid(inv._id)}
                          className="px-5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl font-bold transition-colors whitespace-nowrap shrink-0"
                        >
                          Xác nhận Thu
                        </button>
                      ) : (
                        <span className="text-slate-400 text-sm italic font-medium">Đã hoàn tất</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL TẠO HÓA ĐƠN ĐƯỢC CHỈNH LẠI PADDING & FONT CHỮ ── */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-drop-down">
            
            {/* Ép paddingLeft và paddingRight cho Header Modal */}
            <div className="py-6 border-b border-slate-100 flex justify-between items-start bg-white" style={{ paddingLeft: '32px', paddingRight: '32px' }}>
              <div>
                {/* Đồng bộ font chữ: font-serif, in đậm (font-bold), màu đen (text-slate-900) */}
                <h3 className="font-serif text-2xl font-bold text-slate-900">Tạo Hóa Đơn Mới</h3>
                <p className="text-sm text-slate-500 mt-1">Lựa chọn phòng và nhập các khoản phí sinh hoạt hàng tháng.</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-slate-400 hover:text-slate-700 text-2xl font-bold transition-colors"
              >
                &times;
              </button>
            </div>
            
            {/* Ép paddingLeft và paddingRight cho Form Modal */}
            <form onSubmit={handleCreateInvoice} className="py-8 space-y-6 bg-white" style={{ paddingLeft: '32px', paddingRight: '32px' }}>
              <div>
                <label className="block text-[14px] font-bold text-slate-700 mb-2">Chọn Phòng</label>
                <select 
                  required
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium text-slate-800 bg-white transition-all"
                  value={formData.roomId}
                  onChange={(e) => setFormData({...formData, roomId: e.target.value})}
                >
                  <option value="" disabled>-- Lựa chọn phòng --</option>
                  {rooms.map(r => (
                    <option key={r._id} value={r._id}>{r.name} (Tòa {r.building})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[14px] font-bold text-slate-700 mb-2">Tháng</label>
                  <input type="number" min="1" max="12" required value={formData.month} onChange={(e) => setFormData({...formData, month: Number(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium text-slate-800 bg-white transition-all"/>
                </div>
                <div>
                  <label className="block text-[14px] font-bold text-slate-700 mb-2">Năm</label>
                  <input type="number" min="2020" required value={formData.year} onChange={(e) => setFormData({...formData, year: Number(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium text-slate-800 bg-white transition-all"/>
                </div>
              </div>

              <div>
                <label className="block text-[14px] font-bold text-slate-700 mb-2">Tiền Điện (VNĐ)</label>
                <input type="number" min="0" required value={formData.electricityFee} onChange={(e) => setFormData({...formData, electricityFee: Number(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium text-slate-800 bg-white transition-all"/>
              </div>

              <div>
                <label className="block text-[14px] font-bold text-slate-700 mb-2">Tiền Nước (VNĐ)</label>
                <input type="number" min="0" required value={formData.waterFee} onChange={(e) => setFormData({...formData, waterFee: Number(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium text-slate-800 bg-white transition-all"/>
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold text-[15px] transition-colors">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-bold text-[15px] transition-colors shadow-sm">
                  {isSubmitting ? "Đang xử lý..." : "Lưu hóa đơn"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}