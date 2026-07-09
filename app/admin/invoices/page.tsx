"use client";

import { useEffect, useState } from "react";
import { useToast } from "../../components/ToastProvider";

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
  const toast = useToast();
  
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
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3001/api/invoices/trigger-overdue`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        toast.success("Đã quét và cập nhật các hóa đơn quá hạn!", "Hoàn tất");
        fetchData();
      }
    } catch (error) {
      toast.error("Không thể kết nối đến máy chủ.");
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

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
           
           <div className="flex gap-3 shrink-0">
            <button 
              onClick={handleTriggerOverdue}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-bold transition-colors text-[13px] whitespace-nowrap"
            >
              ↻ Quét Quá Hạn
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
              ) : invoices.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-[#8A9BAD] font-medium text-sm">Chưa có hóa đơn nào.</td></tr>
              ) : (
                invoices.map((inv) => (
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
    </div>
  );
}