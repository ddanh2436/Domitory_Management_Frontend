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
  createdAt: string;
  paidAt?: string;
}

interface Room {
  _id: string;
  name: string;
  building: string;
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
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setActionMsg({ text: "Tạo hóa đơn thành công!", type: "success" });
        setShowModal(false);
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
    <div className="w-full space-y-6 text-slate-800 font-sans relative">
      {/* Thanh công cụ hành động */}
      <div className="flex justify-end items-center gap-3">
        <button 
          onClick={handleTriggerOverdue}
          className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium transition-colors text-sm"
        >
          ↻ Quét Quá Hạn
        </button>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-sm shadow-sm"
        >
          + Tạo Hóa Đơn Mới
        </button>
      </div>

      {actionMsg.text && (
        <div className={`p-4 rounded-lg font-medium border ${actionMsg.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          {actionMsg.text}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-slate-600">Phòng</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-600">Kỳ thu</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-600">Tiền phòng</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-600">Điện & Nước</th>
                <th className="px-6 py-4 text-right font-bold text-slate-800">Tổng cộng</th>
                <th className="px-6 py-4 text-center font-semibold text-slate-600">Trạng thái</th>
                <th className="px-6 py-4 text-center font-semibold text-slate-600">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500">Đang tải dữ liệu...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500">Chưa có hóa đơn nào.</td></tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800">{inv.room?.name || 'Phòng đã xóa'}</div>
                      <div className="text-slate-500 text-xs">Tòa {inv.room?.building || '—'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                      Tháng {inv.month}/{inv.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-slate-600">
                      {formatCurrency(inv.roomFee)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-orange-600 text-xs">⚡ {formatCurrency(inv.electricityFee)}</div>
                      <div className="text-cyan-600 text-xs">💧 {formatCurrency(inv.waterFee)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-blue-700">
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${
                        inv.status === 'PAID' ? 'bg-green-100 text-green-700 border-green-200' :
                        inv.status === 'OVERDUE' ? 'bg-red-100 text-red-700 border-red-200' : 
                        'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        {inv.status === 'PAID' ? 'ĐÃ THU' : inv.status === 'OVERDUE' ? 'QUÁ HẠN' : 'CHỜ THU'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {inv.status !== 'PAID' ? (
                        <button 
                          onClick={() => handleMarkAsPaid(inv._id)}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-xs font-semibold transition-colors"
                        >
                          Xác nhận Thu
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Đã hoàn tất</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tạo Hóa Đơn */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Tạo Hóa Đơn Mới</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chọn Phòng</label>
                <select 
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                  value={formData.roomId}
                  onChange={(e) => setFormData({...formData, roomId: e.target.value})}
                >
                  <option value="" disabled>-- Lựa chọn phòng --</option>
                  {rooms.map(r => (
                    <option key={r._id} value={r._id}>{r.name} (Tòa {r.building})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tháng</label>
                  <input type="number" min="1" max="12" required value={formData.month} onChange={(e) => setFormData({...formData, month: Number(e.target.value)})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Năm</label>
                  <input type="number" min="2020" required value={formData.year} onChange={(e) => setFormData({...formData, year: Number(e.target.value)})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"/>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tiền Điện (VNĐ)</label>
                <input type="number" min="0" required value={formData.electricityFee} onChange={(e) => setFormData({...formData, electricityFee: Number(e.target.value)})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"/>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tiền Nước (VNĐ)</label>
                <input type="number" min="0" required value={formData.waterFee} onChange={(e) => setFormData({...formData, waterFee: Number(e.target.value)})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"/>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm transition-colors">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm transition-colors">
                  {isSubmitting ? "Đang lưu..." : "Lưu hóa đơn"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}