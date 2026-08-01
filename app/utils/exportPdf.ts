// Xuất PDF bằng cửa sổ in của trình duyệt (Ctrl+P → Save as PDF).
// Ưu điểm: không cần thư viện, font tiếng Việt hiển thị chuẩn 100%.

function openPrintWindow(title: string, bodyHtml: string): boolean {
  const win = window.open("", "_blank", "width=820,height=980");
  if (!win) return false;

  win.document.write(`<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; color: #0D1B2A; padding: 36px; font-size: 13px; line-height: 1.6; }
  .doc { max-width: 700px; margin: 0 auto; }
  .doc-head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0D1B2A; padding-bottom: 14px; margin-bottom: 22px; }
  .brand { font-size: 22px; font-weight: 800; color: #0D1B2A; }
  .brand span { color: #C9A84C; }
  .brand-sub { font-size: 11px; color: #64748b; margin-top: 3px; }
  .doc-meta { text-align: right; font-size: 11.5px; color: #64748b; }
  .doc-title { text-align: center; font-size: 19px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin: 6px 0 2px; }
  .doc-no { text-align: center; font-size: 12px; color: #64748b; margin-bottom: 22px; }
  .section { margin-bottom: 18px; }
  .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #9a7b2c; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px; }
  .row { display: flex; justify-content: space-between; gap: 16px; padding: 4px 0; }
  .row .label { color: #64748b; }
  .row .value { font-weight: 700; text-align: right; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th { background: #f1f5f9; text-align: left; padding: 9px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; border: 1px solid #e2e8f0; }
  td { padding: 9px 12px; border: 1px solid #e2e8f0; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .total-row td { font-weight: 800; background: #fffbeb; font-size: 14px; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
  .badge--paid { background: #dcfce7; color: #15803d; }
  .badge--pending { background: #fef3c7; color: #b45309; }
  .badge--overdue { background: #fee2e2; color: #b91c1c; }
  .terms { white-space: pre-line; font-size: 12.5px; color: #334155; }
  .signatures { display: flex; justify-content: space-between; margin-top: 40px; text-align: center; }
  .sig { width: 45%; }
  .sig-role { font-weight: 800; font-size: 12.5px; }
  .sig-note { font-size: 11px; color: #94a3b8; font-style: italic; margin-top: 2px; }
  .sig-space { height: 70px; }
  .sig-name { font-weight: 700; }
  .doc-foot { margin-top: 30px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10.5px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 12px; } }
</style>
</head>
<body>
  <div class="doc">${bodyHtml}</div>
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`);
  win.document.close();
  return true;
}

const fmtVnd = (n: number) => `${(n ?? 0).toLocaleString("vi-VN")} đ`;
const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "—");
const todayStr = () =>
  new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

// ─── Hàm tiện ích tạo chuỗi SVG cho con dấu ───────────────────────────────────
function generateSealSVG(id: string, color: string, arc: string, bottom: string, rotate: number) {
  return `
    <svg width="128" height="128" viewBox="0 0 128 128" style="transform: rotate(${rotate}deg)">
      <defs>
        <path id="${id}" d="M 18, 64 a 46,46 0 1,1 92,0 a 46,46 0 1,1 -92,0" />
      </defs>
      <circle cx="64" cy="64" r="58" fill="none" stroke="${color}" stroke-width="2.5" />
      <circle cx="64" cy="64" r="48" fill="none" stroke="${color}" stroke-width="1" stroke-dasharray="2 3" />
      <text font-family="Arial, sans-serif" font-weight="800" font-size="8.5" letter-spacing="1.2" fill="${color}">
        <textPath href="#${id}" startOffset="25%" text-anchor="middle">${arc}</textPath>
      </text>
      <path d="M46 66 L58 78 L83 50" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
      <text x="64" y="98" font-family="Arial, sans-serif" font-weight="800" font-size="8.5" letter-spacing="1.5" fill="${color}" text-anchor="middle">
        ${bottom}
      </text>
    </svg>
  `;
}

// ─── Hóa đơn ──────────────────────────────────────────────────────────────────

export interface InvoicePdfData {
  roomName: string;
  building?: string;
  month: number;
  year: number;
  roomFee: number;
  electricityFee: number;
  waterFee: number;
  totalAmount: number;
  status: "PENDING" | "PAID" | "OVERDUE";
  dueDate?: string;
  paidAt?: string;
  createdAt?: string;
}

export function exportInvoicePdf(inv: InvoicePdfData): boolean {
  const statusLabel = inv.status === "PAID" ? "Đã thanh toán" : inv.status === "OVERDUE" ? "Quá hạn" : "Chờ thanh toán";
  const badgeClass = inv.status === "PAID" ? "badge--paid" : inv.status === "OVERDUE" ? "badge--overdue" : "badge--pending";

  const html = `
    <div class="doc-head">
      <div>
        <div class="brand">Dorm<span>ify</span></div>
        <div class="brand-sub">Hệ thống quản lý Ký túc xá</div>
      </div>
      <div class="doc-meta">Ngày xuất: ${todayStr()}</div>
    </div>

    <div class="doc-title">Hóa đơn tiền phòng</div>
    <div class="doc-no">Kỳ thu: Tháng ${inv.month}/${inv.year} · Phòng ${inv.roomName}${inv.building ? ` · Tòa ${inv.building}` : ""}</div>

    <div class="section">
      <div class="section-title">Thông tin hóa đơn</div>
      <div class="row"><span class="label">Phòng</span><span class="value">${inv.roomName}${inv.building ? ` (Tòa ${inv.building})` : ""}</span></div>
      <div class="row"><span class="label">Kỳ thu</span><span class="value">Tháng ${inv.month}/${inv.year}</span></div>
      <div class="row"><span class="label">Ngày phát hành</span><span class="value">${fmtDate(inv.createdAt)}</span></div>
      <div class="row"><span class="label">Hạn thanh toán</span><span class="value">${fmtDate(inv.dueDate)}</span></div>
      <div class="row"><span class="label">Trạng thái</span><span class="value"><span class="badge ${badgeClass}">${statusLabel}</span></span></div>
      ${inv.paidAt ? `<div class="row"><span class="label">Ngày thanh toán</span><span class="value">${fmtDate(inv.paidAt)}</span></div>` : ""}
    </div>

    <div class="section">
      <div class="section-title">Chi tiết các khoản</div>
      <table>
        <thead><tr><th>Khoản mục</th><th style="text-align:right">Thành tiền</th></tr></thead>
        <tbody>
          <tr><td>Tiền phòng</td><td class="num">${fmtVnd(inv.roomFee)}</td></tr>
          <tr><td>Tiền điện</td><td class="num">${fmtVnd(inv.electricityFee)}</td></tr>
          <tr><td>Tiền nước</td><td class="num">${fmtVnd(inv.waterFee)}</td></tr>
          <tr class="total-row"><td>TỔNG CỘNG</td><td class="num">${fmtVnd(inv.totalAmount)}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="doc-foot">Hóa đơn được xuất từ hệ thống Dormify — mọi thắc mắc vui lòng liên hệ Ban quản lý KTX.</div>
  `;

  return openPrintWindow(`HoaDon_${inv.roomName}_T${inv.month}-${inv.year}`, html);
}

// ─── Hợp đồng ─────────────────────────────────────────────────────────────────

export interface ContractPdfData {
  contractNumber: string;
  studentName?: string;
  mssv?: string;
  email?: string;
  phone?: string;
  cccd?: string;
  roomName?: string;
  building?: string;
  floor?: number;
  startDate: string;
  endDate: string;
  rentalFee: number;
  status: string;
  terms?: string;
}

export function exportContractPdf(c: ContractPdfData): boolean {
  const statusLabel = c.status === "ACTIVE" ? "Đang hiệu lực" : c.status === "TERMINATED" ? "Đã thanh lý" : "Hết hạn";
  const today = new Date();
  const termLines = c.terms ? c.terms.split('\n').map(s => s.trim()).filter(Boolean) : [];

  const html = `
    <style>
      /* Ép lề in chuẩn A4, loại bỏ footer thừa của trình duyệt để tiết kiệm giấy */
      @page { size: A4; margin: 12mm 15mm; } 
    </style>
    <div style="font-family: 'Times New Roman', Times, serif; color: #000; line-height: 1.35; position: relative;">
      
      ${c.status === "TERMINATED" ? `
        <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 2;">
          <div style="transform: rotate(-16deg); font-weight: 800; font-size: 90px; letter-spacing: 0.04em; color: #dc2626; opacity: 0.1; white-space: nowrap;">
            ĐÃ THANH LÝ
          </div>
        </div>
      ` : ""}

      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="font-family: Arial, sans-serif;">
            <div style="font-weight: bold; font-size: 14px; color: #0D1B2A;">DORMIFY HCMUS</div>
            <div style="font-size: 10px; color: #8A9BAD;">Hệ thống quản lý Ký túc xá</div>
          </div>
        </div>
        <div style="text-align: right; font-family: Arial, sans-serif;">
          <div style="font-weight: 600; font-size: 12px; color: #0D1B2A;">Mã HĐ: ${c.contractNumber}</div>
          <div style="font-size: 11px; color: ${c.status === 'TERMINATED' ? '#dc2626' : '#C9A84C'}; font-weight: 600;">
            Trạng thái: ${statusLabel}
          </div>
        </div>
      </div>

      <!-- Quốc hiệu -->
      <div style="text-align: center; margin-bottom: 16px;">
        <h1 style="font-size: 16px; font-weight: bold; text-transform: uppercase; margin: 0;">Cộng hòa xã hội chủ nghĩa Việt Nam</h1>
        <h2 style="font-size: 15px; font-weight: bold; margin: 2px 0 0;">Độc lập - Tự do - Hạnh phúc</h2>
        <div style="width: 100px; height: 1px; background: #000; margin: 8px auto 16px;"></div>
        <h1 style="font-size: 17px; font-weight: bold; text-transform: uppercase; margin: 0;">HỢP ĐỒNG THUÊ CHỖ Ở KÝ TÚC XÁ</h1>
      </div>

      <p style="font-size: 14px; margin-bottom: 12px; font-style: italic;">
        Hôm nay, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}, tại Ban Quản lý Ký túc xá, chúng tôi gồm có:
      </p>

      <!-- Bên A -->
      <div style="margin-bottom: 12px;">
        <h3 style="font-weight: bold; font-size: 14px; margin: 0 0 4px 0;">BÊN CHO THUÊ (BÊN A): BAN QUẢN LÝ KÝ TÚC XÁ DORMIFY HCMUS</h3>
        <p style="font-size: 14px; margin: 0 0 2px 0;"><strong>Đại diện:</strong> Ông/Bà Nguyễn Văn Đại Diện</p>
        <p style="font-size: 14px; margin: 0 0 2px 0;"><strong>Chức vụ:</strong> Trưởng Ban Quản lý Ký túc xá</p>
        <p style="font-size: 14px; margin: 0 0 2px 0;"><strong>Địa chỉ:</strong> Khu đô thị ĐHQG-HCM, Thủ Đức, TP. Hồ Chí Minh</p>
        <p style="font-size: 14px; margin: 0 0 2px 0;"><strong>Điện thoại:</strong> 028 3896 6666</p>
      </div>

      <!-- Bên B -->
      <div style="margin-bottom: 16px;">
        <h3 style="font-weight: bold; font-size: 14px; margin: 0 0 4px 0;">BÊN THUÊ (BÊN B): SINH VIÊN LƯU TRÚ</h3>
        <p style="font-size: 14px; margin: 0 0 2px 0;"><strong>Họ và tên:</strong> ${c.studentName || "—"}</p>
        <p style="font-size: 14px; margin: 0 0 2px 0;"><strong>Mã số sinh viên:</strong> ${c.mssv || "Không có"}</p>
        <p style="font-size: 14px; margin: 0 0 2px 0;">
          <strong>CCCD/CMND số:</strong> ${c.cccd || "Không có"} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <strong>Số điện thoại:</strong> ${c.phone || "Không có"}
        </p>
        <p style="font-size: 14px; margin: 0 0 2px 0;"><strong>Email:</strong> ${c.email || "—"}</p>
      </div>

      <p style="font-size: 14px; margin-bottom: 12px;">Hai bên cùng thỏa thuận và thống nhất ký kết Hợp đồng thuê chỗ ở nội trú với các điều khoản sau đây:</p>

      <!-- Điều 1 -->
      <div style="margin-bottom: 10px;">
        <h3 style="font-weight: bold; font-size: 14px; margin: 0 0 4px 0;">Điều 1: Đối tượng hợp đồng và Thời hạn</h3>
        <p style="font-size: 14px; margin: 0 0 2px 0;">1. Bên A đồng ý cho Bên B thuê 01 chỗ ở tại <strong>Phòng ${c.roomName || "—"}</strong>, Tòa nhà <strong>${c.building || "—"}</strong> (Tầng ${c.floor || "—"}) thuộc Ký túc xá Dormify HCMUS.</p>
        <p style="font-size: 14px; margin: 0 0 2px 0;">2. Thời hạn thuê: Có hiệu lực kể từ ngày <strong>${fmtDate(c.startDate)}</strong> đến ngày <strong>${fmtDate(c.endDate)}</strong>.</p>
      </div>

      <!-- Điều 2 -->
      <div style="margin-bottom: 10px;">
        <h3 style="font-weight: bold; font-size: 14px; margin: 0 0 4px 0;">Điều 2: Giá thuê và Phương thức thanh toán</h3>
        <p style="font-size: 14px; margin: 0 0 2px 0;">1. Tiền thuê chỗ ở: <strong>${fmtVnd(c.rentalFee)}/tháng</strong> (Giá này không bao gồm các chi phí phụ trội như điện, nước, internet...).</p>
        <p style="font-size: 14px; margin: 0 0 2px 0;">2. Phương thức thanh toán: Bên B thanh toán định kỳ hàng tháng qua hệ thống Dormify trước ngày 05.</p>
      </div>

      <!-- Điều 3 -->
      <div style="margin-bottom: 16px;">
        <h3 style="font-weight: bold; font-size: 14px; margin: 0 0 4px 0;">Điều 3: Quyền và Nghĩa vụ của các bên</h3>
        ${termLines.length > 0 
          ? `<ul style="list-style-type: disc; padding-left: 20px; margin: 0; font-size: 14px;">
              ${termLines.map(line => `<li style="margin-bottom: 2px;">${line}</li>`).join('')}
             </ul>`
          : `<p style="font-size: 14px; margin: 0 0 2px 0;">1. <strong>Bên A:</strong> Đảm bảo cơ sở vật chất, an ninh trật tự; Hướng dẫn và kiểm tra Bên B thực hiện đúng Nội quy Ký túc xá.</p>
             <p style="font-size: 14px; margin: 0 0 2px 0;">2. <strong>Bên B:</strong> Sử dụng trang thiết bị đúng mục đích; Đóng phí đầy đủ, đúng hạn; Chấp hành nghiêm chỉnh quy định pháp luật và Nội quy.</p>`
        }
      </div>

      <p style="font-size: 14px; margin-bottom: 16px;">Hợp đồng này được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản. Hợp đồng điện tử trên hệ thống có giá trị tương đương bản gốc.</p>

      <!-- Chữ ký -->
      <div style="display: flex; justify-content: space-between; page-break-inside: avoid; margin-top: 10px;">
        <div style="text-align: center; width: 45%;">
          <div style="font-weight: bold; font-size: 14px;">ĐẠI DIỆN BÊN A</div>
          <div style="font-size: 13px; font-style: italic; margin-bottom: 4px;">(Ký, ghi rõ họ tên và đóng dấu)</div>
          <div style="display: flex; justify-content: center; transform: scale(0.85); height: 100px; align-items: center;">
            ${generateSealSVG("seal-a", "#dc2626", "★ BAN QUẢN LÝ KTX DORMIFY ★", "ĐÃ KÝ ĐÓNG DẤU", -7)}
          </div>
          <div style="font-weight: bold; font-size: 14px;">Ban Quản Lý</div>
        </div>
        <div style="text-align: center; width: 45%;">
          <div style="font-weight: bold; font-size: 14px;">ĐẠI DIỆN BÊN B</div>
          <div style="font-size: 13px; font-style: italic; margin-bottom: 4px;">(Chữ ký số điện tử)</div>
          <div style="display: flex; justify-content: center; transform: scale(0.85); height: 100px; align-items: center;">
            ${generateSealSVG("seal-b", "#2563eb", "★ SINH VIÊN LƯU TRÚ ★", "ĐÃ XÁC THỰC KÝ SỐ", 6)}
          </div>
          <div style="font-weight: bold; font-size: 14px;">${c.studentName || ""}</div>
        </div>
      </div>
    </div>
  `;

  return openPrintWindow(`HopDong_${c.contractNumber}`, html);
}