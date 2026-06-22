"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Contract {
  contractNumber: string;
  startDate: string;
  endDate: string;
  rentalFee: number;
  terms: string;
  user: { fullName: string; mssv?: string; email: string; phone?: string; cccd?: string };
  room: { name: string; building: string; floor: number };
}

export default function StudentContractPage() {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getContract = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3001/api/contracts/my-contract", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const text = await res.text();
          if (text) {
            setContract(JSON.parse(text)); 
          } else {
            setContract(null); 
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    getContract();
  }, []);

  if (loading) {
    return <div style={{ padding: "40px", color: "#8A9BAD", fontFamily: "sans-serif", textAlign: "center" }}>ĐANG ĐỒNG BỘ HỢP ĐỒNG...</div>;
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .contract-box { border: none !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; }
          body { background: #fff !important; color: #000 !important; }
          /* Ẩn Sidebar và Topbar của Layout khi in */
          .st-sidebar, .st-topbar { display: none !important; }
          .st-main { margin-left: 0 !important; }
          .st-body { padding: 0 !important; }
        }
      `}</style>

      <div style={{ maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif" }}>
        <Link href="/student" className="no-print" style={{ color: "#C9A84C", textDecoration: "none", fontSize: "14px", fontWeight: 500, display: "inline-block", marginBottom: "20px" }}>
          ← Trở về Tổng quan
        </Link>
        
        {contract ? (
          <div className="contract-box" style={{ background: "#fff", padding: "50px", border: "1px solid rgba(13,27,42,0.09)", borderRadius: "12px" }}>
            <div style={{ textAlign: "center", marginBottom: "35px" }}>
              <h3 style={{ textTransform: "uppercase", fontSize: "13px", margin: 0, letterSpacing: "0.05em" }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h3>
              <p style={{ fontSize: "12px", fontWeight: "bold", margin: "5px 0 25px" }}>Độc lập - Tự do - Hạnh phúc</p>
              <h2 style={{ fontSize: "22px", color: "#0D1B2A", margin: "10px 0 5px" }}>HỢP ĐỒNG ĐIỆN TỬ THUÊ PHÒNG KÝ TÚC XÁ</h2>
              <p style={{ fontFamily: "monospace", fontSize: "13px", color: "#8A9BAD", margin: 0 }}>Mã số định danh: {contract.contractNumber}</p>
            </div>

            <h4 style={{ color: "#0D1B2A", borderLeft: "3px solid #C9A84C", paddingLeft: "8px", fontSize: "15px" }}>BÊN A: BAN QUẢN LÝ KÝ TÚC XÁ DORMIFY</h4>
            <p style={{ fontSize: "14px", margin: "0 0 20px 15px", color: "#334155" }}>Đại diện ban điều hành hạ tầng nội trú thông minh.</p>

            <h4 style={{ color: "#0D1B2A", borderLeft: "3px solid #C9A84C", paddingLeft: "8px", fontSize: "15px", marginTop: "25px" }}>BÊN B: SINH VIÊN ĐĂNG KÝ LƯU TRÚ</h4>
            <div style={{ fontSize: "14px", margin: "0 0 20px 15px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px", color: "#334155" }}>
              <div>• Họ và tên: <strong>{contract.user?.fullName}</strong></div>
              <div>• Mã số sinh viên: <strong>{contract.user?.mssv || "—"}</strong></div>
              <div>• Số CCCD/CMND: {contract.user?.cccd || "—"}</div>
              <div>• Số điện thoại: {contract.user?.phone || "—"}</div>
              <div style={{ gridColumn: "1 / -1" }}>• Email liên hệ: {contract.user?.email}</div>
            </div>

            <h4 style={{ color: "#0D1B2A", borderLeft: "3px solid #C9A84C", paddingLeft: "8px", fontSize: "15px", marginTop: "25px" }}>NỘI DUNG THỎA THUẬN CHỖ Ở</h4>
            <div style={{ fontSize: "14px", margin: "0 0 20px 15px", color: "#334155", lineHeight: "1.6" }}>
              <p>• Phòng ở được phân phối: <strong>Phòng {contract.room?.name}</strong> (Tòa {contract.room?.building} — Tầng {contract.room?.floor})</p>
              <p>• Mức phí nội trú hàng tháng: <strong style={{ color: "#b45309" }}>{contract.rentalFee?.toLocaleString("vi-VN")} VND / tháng</strong></p>
              <p>• Thời hạn hợp đồng: Từ ngày {new Date(contract.startDate).toLocaleDateString("vi-VN")} đến ngày {new Date(contract.endDate).toLocaleDateString("vi-VN")}</p>
            </div>

            <h4 style={{ color: "#0D1B2A", borderLeft: "3px solid #C9A84C", paddingLeft: "8px", fontSize: "15px", marginTop: "25px" }}>ĐIỀU KHOẢN TRÁCH NHIỆM & NGHĨA VỤ</h4>
            <div style={{ background: "#F9F8F6", padding: "18px", borderRadius: "8px", fontSize: "13.5px", whiteSpace: "pre-line", lineHeight: "1.6", color: "#475569" }}>
              {contract.terms}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "45px", padding: "0 20px", textAlign: "center", fontSize: "13px" }}>
              <div>
                <strong style={{ color: "#0D1B2A" }}>ĐẠI DIỆN BÊN A</strong>
                <p style={{ color: "#16a34a", fontWeight: "bold", marginTop: "40px", fontSize: "11px", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "4px 8px", borderRadius: "4px" }}>✓ ĐÃ KÝ SỐ HỆ THỐNG</p>
              </div>
              <div>
                <strong style={{ color: "#0D1B2A" }}>ĐẠI DIỆN BÊN B</strong>
                <p style={{ color: "#16a34a", fontWeight: "bold", marginTop: "40px", fontSize: "11px", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "4px 8px", borderRadius: "4px" }}>✓ XÁC THỰC ĐIỆN TỬ</p>
              </div>
            </div>
            
            <button className="no-print" onClick={() => window.print()} style={{ marginTop: "40px", width: "100%", padding: "12px", background: "#0D1B2A", color: "#C9A84C", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>
              In hoặc Tải file hợp đồng (PDF)
            </button>
          </div>
        ) : (
          <div style={{ background: "#fff", padding: "40px", textAlign: "center", borderRadius: "12px", border: "1px solid rgba(13,27,42,0.09)" }}>
            <p style={{ color: "#8A9BAD", fontSize: "14.5px" }}>
              Hợp đồng điện tử sẽ tự động xuất hiện tại đây ngay khi đơn xin đăng ký chỗ ở của bạn được Quản trị viên phê duyệt thành công.
            </p>
          </div>
        )}
      </div>
    </>
  );
}