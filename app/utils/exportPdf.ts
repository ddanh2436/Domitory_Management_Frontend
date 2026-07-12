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

  const html = `
    <div class="doc-head">
      <div>
        <div class="brand">Dorm<span>ify</span></div>
        <div class="brand-sub">Hệ thống quản lý Ký túc xá</div>
      </div>
      <div class="doc-meta">Ngày xuất: ${todayStr()}</div>
    </div>

    <div class="doc-title">Hợp đồng lưu trú ký túc xá</div>
    <div class="doc-no">Số hợp đồng: <b>${c.contractNumber}</b> · Trạng thái: ${statusLabel}</div>

    <div class="section">
      <div class="section-title">Bên A — Ban quản lý Ký túc xá</div>
      <div class="row"><span class="label">Đơn vị</span><span class="value">Ban quản lý KTX Dormify</span></div>
    </div>

    <div class="section">
      <div class="section-title">Bên B — Sinh viên lưu trú</div>
      <div class="row"><span class="label">Họ và tên</span><span class="value">${c.studentName || "—"}</span></div>
      <div class="row"><span class="label">MSSV</span><span class="value">${c.mssv || "—"}</span></div>
      ${c.cccd ? `<div class="row"><span class="label">CCCD</span><span class="value">${c.cccd}</span></div>` : ""}
      <div class="row"><span class="label">Email</span><span class="value">${c.email || "—"}</span></div>
      ${c.phone ? `<div class="row"><span class="label">Điện thoại</span><span class="value">${c.phone}</span></div>` : ""}
    </div>

    <div class="section">
      <div class="section-title">Nội dung lưu trú</div>
      <div class="row"><span class="label">Phòng</span><span class="value">${c.roomName || "—"}${c.building ? ` · Tòa ${c.building}` : ""}${c.floor ? ` · Tầng ${c.floor}` : ""}</span></div>
      <div class="row"><span class="label">Thời hạn</span><span class="value">${fmtDate(c.startDate)} — ${fmtDate(c.endDate)}</span></div>
      <div class="row"><span class="label">Giá thuê</span><span class="value">${fmtVnd(c.rentalFee)}/tháng</span></div>
    </div>

    ${c.terms ? `
    <div class="section">
      <div class="section-title">Điều khoản</div>
      <div class="terms">${c.terms}</div>
    </div>` : ""}

    <div class="signatures">
      <div class="sig">
        <div class="sig-role">ĐẠI DIỆN BÊN A</div>
        <div class="sig-note">(Ký và ghi rõ họ tên)</div>
        <div class="sig-space"></div>
        <div class="sig-name">Ban quản lý KTX</div>
      </div>
      <div class="sig">
        <div class="sig-role">BÊN B</div>
        <div class="sig-note">(Ký và ghi rõ họ tên)</div>
        <div class="sig-space"></div>
        <div class="sig-name">${c.studentName || ""}</div>
      </div>
    </div>

    <div class="doc-foot">Hợp đồng được xuất từ hệ thống Dormify — bản in có giá trị đối chiếu với bản điện tử trên hệ thống.</div>
  `;

  return openPrintWindow(`HopDong_${c.contractNumber}`, html);
}
