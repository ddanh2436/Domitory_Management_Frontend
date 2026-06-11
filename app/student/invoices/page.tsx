"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RoleGuard from "../../components/RoleGuard";

interface Invoice {
  _id: string;
  month: number;
  year: number;
  roomFee: number;
  electricityFee: number;
  waterFee: number;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  createdAt: string;
}

const Icons = {
  back: (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  invoice: (
    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  bolt: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  water: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16a4 4 0 100-8 4 4 0 000 8z" />
    </svg>
  ),
};

export default function StudentInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasRoom, setHasRoom] = useState(true);

  useEffect(() => {
    const fetchMyInvoices = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // 1. Lấy thông tin cá nhân để biết sinh viên đang ở phòng nào (lấy _id của phòng)
        const profileRes = await fetch("http://localhost:3001/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profile = await profileRes.json();

        console.log("=== Profile Sinh Viên ===", profile);

        // Nếu sinh viên chưa có phòng (chưa đăng ký hoặc chưa được duyệt)
        if (!profile.room || !profile.room._id) {
          setHasRoom(false);
          setLoading(false);
          return;
        }

        // 2. Gọi API lấy danh sách hóa đơn theo ID phòng đó
        const invoiceRes = await fetch(`http://localhost:3001/api/invoices/room/${profile.room._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (invoiceRes.ok) {
          const data = await invoiceRes.json();
          setInvoices(data); // Backend trả về thẳng mảng, không qua .data
        }
      } catch (error) {
        console.error("Lỗi lấy hóa đơn:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyInvoices();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handlePayMockup = () => {
    alert("Tính năng thanh toán online (VNPay/MoMo) đang được phát triển. Vui lòng đến văn phòng Ban Quản Lý KTX để đóng tiền mặt!");
  };

  return (
    <RoleGuard allowedRoles={["STUDENT"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,700;1,9..144,400&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --navy:        #0D1B2A;
          --gold:        #C9A84C;
          --bg-color:    #F5F3EF;
          --white:       #ffffff;
          --muted:       #8A9BAD;
          --border:      rgba(13,27,42,0.09);
        }

        body { background: var(--bg-color); font-family: 'DM Sans', sans-serif; color: var(--navy); }

        .app-container { max-width: 800px; margin: 0 auto; padding: 40px 24px; min-height: 100vh; }

        /* ── HEADER ── */
        .header { display: flex; align-items: center; gap: 16px; margin-bottom: 40px; }
        .btn-back {
          width: 40px; height: 40px; border-radius: 10px; border: 1px solid var(--border);
          background: var(--white); display: flex; align-items: center; justify-content: center;
          color: var(--navy); cursor: pointer; transition: all 0.2s; text-decoration: none;
        }
        .btn-back:hover { background: var(--navy); color: var(--white); border-color: var(--navy); }
        .page-title { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 700; color: var(--navy); letter-spacing: -0.5px; }
        .page-subtitle { font-size: 14px; color: var(--muted); margin-top: 4px; }

        /* ── INVOICE LIST ── */
        .invoice-list { display: flex; flex-direction: column; gap: 20px; }

        /* ── INVOICE CARD ── */
        .inv-card {
          background: var(--white); border: 1px solid var(--border); border-radius: 16px;
          padding: 24px; display: flex; flex-direction: column; position: relative; overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }
        .inv-card--overdue { border-color: rgba(239,68,68,0.3); box-shadow: 0 4px 16px rgba(239,68,68,0.05); }

        .inv-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 1px dashed var(--border); padding-bottom: 20px; }
        .inv-month { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 700; color: var(--navy); display: flex; align-items: center; gap: 10px; }
        .inv-month svg { color: var(--gold); }
        
        .status-badge { padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .status--paid { background: rgba(34,197,94,0.1); color: #16a34a; border: 1px solid rgba(34,197,94,0.2); }
        .status--pending { background: rgba(245,158,11,0.1); color: #d97706; border: 1px solid rgba(245,158,11,0.2); }
        .status--overdue { background: rgba(239,68,68,0.1); color: #dc2626; border: 1px solid rgba(239,68,68,0.2); }

        .inv-details { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
        .inv-row { display: flex; justify-content: space-between; align-items: center; font-size: 14.5px; color: #4A6580; }
        .inv-row span:last-child { font-weight: 500; color: var(--navy); }
        .inv-row--icon { display: flex; align-items: center; gap: 8px; }

        .inv-total { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: #F8F9FA; border-radius: 12px; margin-bottom: 20px; }
        .inv-total-label { font-size: 14px; font-weight: 500; color: var(--muted); }
        .inv-total-amount { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 700; color: var(--navy); }

        .btn-pay { width: 100%; padding: 14px; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; text-align: center; border: none; cursor: pointer; transition: all 0.2s; }
        .btn-pay--active { background: var(--navy); color: var(--white); }
        .btn-pay--active:hover { background: #1a334d; box-shadow: 0 4px 12px rgba(13,27,42,0.15); }
        .btn-pay--overdue { background: #dc2626; color: var(--white); }
        .btn-pay--overdue:hover { background: #b91c1c; box-shadow: 0 4px 12px rgba(220,38,38,0.2); }
      `}</style>

      <div className="app-container">
        <header className="header">
          <Link href="/student" className="btn-back" title="Quay lại">
            {Icons.back}
          </Link>
          <div>
            <h1 className="page-title">Hóa đơn điện nước</h1>
            <p className="page-subtitle">Quản lý và theo dõi chi phí sinh hoạt hàng tháng</p>
          </div>
        </header>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>Đang tải hóa đơn...</div>
        ) : !hasRoom ? (
          <div style={{ textAlign: "center", padding: "60px", background: "var(--white)", borderRadius: "16px", border: "1px solid var(--border)" }}>
            <p style={{ fontWeight: 600, fontSize: "16px", color: "var(--navy)" }}>Bạn chưa có phòng lưu trú</p>
            <p style={{ fontSize: "14px", color: "var(--muted)", marginTop: "4px" }}>Vui lòng đăng ký phòng để có thể nhận hóa đơn hàng tháng.</p>
          </div>
        ) : invoices.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", background: "var(--white)", borderRadius: "16px", border: "1px dashed var(--border)" }}>
            <div style={{ color: "var(--muted)", marginBottom: "12px", display: "flex", justifyContent: "center" }}>{Icons.invoice}</div>
            <p style={{ fontWeight: 600, fontSize: "16px" }}>Chưa có hóa đơn nào</p>
            <p style={{ fontSize: "14px", color: "var(--muted)", marginTop: "4px" }}>Tháng này phòng bạn chưa có thông báo thu tiền.</p>
          </div>
        ) : (
          <div className="invoice-list">
            {invoices.map((inv) => (
              <div key={inv._id} className={`inv-card ${inv.status === 'OVERDUE' ? 'inv-card--overdue' : ''}`}>
                
                <div className="inv-header">
                  <div className="inv-month">
                    {Icons.invoice} Kỳ thu: Tháng {inv.month}/{inv.year}
                  </div>
                  <div className={`status-badge ${
                    inv.status === 'PAID' ? 'status--paid' : 
                    inv.status === 'OVERDUE' ? 'status--overdue' : 'status--pending'
                  }`}>
                    {inv.status === 'PAID' ? 'Đã Thanh Toán' : inv.status === 'OVERDUE' ? 'Quá Hạn' : 'Chưa Thanh Toán'}
                  </div>
                </div>

                <div className="inv-details">
                  <div className="inv-row">
                    <span>Phí thuê phòng</span>
                    <span>{formatCurrency(inv.roomFee)}</span>
                  </div>
                  <div className="inv-row">
                    <span className="inv-row--icon" style={{ color: "#d97706" }}>{Icons.bolt} Tiền điện</span>
                    <span>{formatCurrency(inv.electricityFee)}</span>
                  </div>
                  <div className="inv-row">
                    <span className="inv-row--icon" style={{ color: "#0284c7" }}>{Icons.water} Tiền nước</span>
                    <span>{formatCurrency(inv.waterFee)}</span>
                  </div>
                </div>

                <div className="inv-total">
                  <span className="inv-total-label">Tổng thanh toán:</span>
                  <span className="inv-total-amount">{formatCurrency(inv.totalAmount)}</span>
                </div>

                {inv.status !== 'PAID' && (
                  <button 
                    onClick={handlePayMockup}
                    className={`btn-pay ${inv.status === 'OVERDUE' ? 'btn-pay--overdue' : 'btn-pay--active'}`}
                  >
                    {inv.status === 'OVERDUE' ? 'Thanh toán ngay (Đã trễ hạn)' : 'Thanh toán hóa đơn'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}