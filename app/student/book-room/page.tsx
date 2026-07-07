"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RoleGuard from "../../components/RoleGuard";
import { apiClient } from "../../utils/apiClient";

// ─── Types (identical to original) ────────────────────────────────────────────
interface Room {
  roomId: string;
  _id: string;
  roomNumber: string;
  name: string;
  roomType: string;
  building: string;
  floor: number;
  capacity: number;
  currentOccupancy: number;
  price: number;
  facilities: string[];
}

interface Bed {
  id: string;
  code: string;
  status: 'available' | 'occupied' | 'maintenance';
  price: number;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const I = {
  back:   <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  bed:    <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 18v-6a2 2 0 012-2h14a2 2 0 012 2v6M3 18v2m0-2h18m0 0v2M5 12V9a2 2 0 012-2h3a2 2 0 012 2v3" /></svg>,
  cursor: <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>,
};

// ─── VisualBedMap (same logic, redesigned UI) ─────────────────────────────────
function VisualBedMap({
  room, beds, onSelectBed,
}: {
  room: Room; beds: Bed[]; onSelectBed: (bed: Bed | null) => void;
}) {
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);

  const handleBedClick = (bed: Bed) => {
    if (bed.status !== 'available') return;
    if (selectedBedId === bed.id) {
      setSelectedBedId(null);
      onSelectBed(null);
    } else {
      setSelectedBedId(bed.id);
      onSelectBed(bed);
    }
  };

  const getBedClass = (bed: Bed) => {
    if (bed.status === 'occupied')    return 'br-bed br-bed--occupied';
    if (bed.status === 'maintenance') return 'br-bed br-bed--maintenance';
    if (selectedBedId === bed.id)     return 'br-bed br-bed--selected';
    return 'br-bed br-bed--available';
  };

  return (
    <div className="br-panel">
      <div className="br-panel-head">
        <div className="br-panel-title">Sơ đồ phòng {room.name || room.roomNumber}</div>
        <div className="br-legend">
          <span className="br-legend-item"><span className="br-legend-dot br-legend-dot--available" />Trống</span>
          <span className="br-legend-item"><span className="br-legend-dot br-legend-dot--selected" />Đang chọn</span>
          <span className="br-legend-item"><span className="br-legend-dot br-legend-dot--occupied" />Đã có người</span>
        </div>
      </div>

      <div className="br-map-frame">
        <div className="br-map-inner">
          <div className="br-corridor">
            <span>Lối đi chung</span>
          </div>
          <div className="br-bed-grid">
            {beds.map((bed) => (
              <div key={bed.id} onClick={() => handleBedClick(bed)} className={getBedClass(bed)}>
                <span className="br-bed-icon">{I.bed}</span>
                <span className="br-bed-code">{bed.code}</span>
                {bed.status === 'occupied' && <span className="br-bed-tag">Đã ở</span>}
                {bed.status === 'maintenance' && <span className="br-bed-tag br-bed-tag--maint">Bảo trì</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="br-door">Cửa chính</div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BookRoomPage() {
  // ── State (identical to original) ──
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomBeds, setRoomBeds] = useState<Bed[]>([]);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);

  useEffect(() => {
    const fetchAvailableRooms = async () => {
      try {
        const response = await apiClient.get("/rooms?status=AVAILABLE");
        const payload = await response.json();
        if (response.ok) {
          setRooms(payload.data || payload);
        } else {
          setError(payload.message || "Không thể tải danh sách phòng.");
        }
      } catch (err) {
        setError("Lỗi kết nối đến máy chủ.");
      } finally {
        setLoading(false);
      }
    };
    fetchAvailableRooms();
  }, []);

  // ── handleSelectRoomToViewMap (identical to original) ──
  const handleSelectRoomToViewMap = (room: Room) => {
    const generatedBeds: Bed[] = [];
    for (let i = 1; i <= room.capacity; i++) {
      generatedBeds.push({
        id: `${room._id || room.roomId}-bed-${i}`,
        code: `Giường ${i}`,
        status: i <= room.currentOccupancy ? 'occupied' : 'available',
        price: room.price,
      });
    }
    setRoomBeds(generatedBeds);
    setSelectedRoom(room);
    setSelectedBed(null);
  };

  // ── handleBookRoom (identical to original) ──
  const handleBookRoom = async () => {
    if (!selectedRoom || !selectedBed) return;
    if (!confirm(`Bạn có chắc chắn muốn đăng ký ${selectedBed.code} - Phòng ${selectedRoom.name || selectedRoom.roomNumber}?`)) return;

    setSubmitting(true);
    try {
      const response = await apiClient.post("/bookings", {
        roomId: selectedRoom._id || selectedRoom.roomId,
        bedId: selectedBed.id,
      });
      const data = await response.json();
      if (response.ok) {
        alert("🎉 Đặt phòng thành công! Vui lòng chờ Ban quản lý phê duyệt.");
        window.location.href = "/student/bookings";
      } else {
        alert(`❌ Lỗi: ${data.message}`);
      }
    } catch (err) {
      alert("Đã xảy ra lỗi hệ thống, vui lòng thử lại sau.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["STUDENT"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;1,9..144,400&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .br-page-root {
          --navy:    #0D1B2A;
          --navy-md: #1A2E42;
          --gold:    #C9A84C;
          --gold-dim:rgba(201,168,76,0.15);
          --gold-b:  rgba(201,168,76,0.25);
          --white:   #ffffff;
          --muted:   #8A9BAD;
          --border:  rgba(13,27,42,0.09);
          font-family:'DM Sans',sans-serif;
          padding: 24px 28px 48px;
        }

        /* ── HERO BANNER ── */
        .br-hero { background:var(--navy); border-radius:16px; padding:26px 30px; margin-bottom:24px; position:relative; overflow:hidden; border:1px solid var(--gold-b); }
        .br-hero-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(201,168,76,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,.04) 1px,transparent 1px); background-size:40px 40px; pointer-events:none; }
        .br-hero-glow { position:absolute; inset:0; background:radial-gradient(ellipse 60% 80% at 100% 0%, rgba(201,168,76,.12) 0%, transparent 60%); pointer-events:none; }
        .br-hero-content { position:relative; z-index:1; }
        .br-back-link { display:inline-flex; align-items:center; gap:7px; font-size:12.5px; color:rgba(255,255,255,.5); text-decoration:none; background:none; border:none; cursor:pointer; margin-bottom:16px; font-family:'DM Sans',sans-serif; transition:color .15s; padding:0; }
        .br-back-link:hover { color:var(--gold); }
        .br-hero-title { font-family:'Fraunces',serif; font-size:24px; font-weight:700; color:#fff; letter-spacing:-.3px; margin-bottom:8px; }
        .br-hero-sub { font-size:13px; color:rgba(255,255,255,.45); }

        /* ── ERROR ── */
        .br-error { padding:14px 18px; background:rgba(239,68,68,.08); color:#b91c1c; border:1px solid rgba(239,68,68,.2); border-radius:10px; margin-bottom:20px; font-size:13.5px; font-weight:500; }

        /* ── LOADING ── */
        .br-loading { text-align:center; padding:60px 24px; color:var(--muted); font-size:13.5px; }

        /* ── ROOM GRID ── */
        .br-room-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:18px; }
        .br-room-card { background:var(--white); border:1px solid var(--border); border-radius:14px; overflow:hidden; display:flex; flex-direction:column; transition:transform .18s, box-shadow .18s; }
        .br-room-card:hover { transform:translateY(-3px); box-shadow:0 12px 30px rgba(13,27,42,.09); }
        .br-room-body { padding:22px 22px 18px; flex:1; }
        .br-room-head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; gap:10px; }
        .br-room-name { font-family:'Fraunces',serif; font-size:19px; font-weight:600; color:var(--navy); }
        .br-room-loc { font-size:12px; color:var(--muted); margin-top:3px; }
        .br-room-avail { padding:3px 11px; border-radius:100px; background:rgba(34,197,94,.1); color:#16a34a; border:1px solid rgba(34,197,94,.2); font-size:11px; font-weight:600; white-space:nowrap; }

        .br-room-rows { display:flex; flex-direction:column; gap:9px; margin-bottom:16px; }
        .br-room-row { display:flex; justify-content:space-between; font-size:13px; }
        .br-room-row-label { color:var(--muted); }
        .br-room-row-val { font-weight:500; color:var(--navy); }
        .br-room-row-val--price { font-weight:700; color:var(--gold); }

        .br-fac-row { display:flex; flex-wrap:wrap; gap:6px; }
        .br-fac-tag { padding:3px 9px; background:#F5F3EF; color:#4A6580; border-radius:6px; font-size:11px; font-weight:500; border:1px solid var(--border); }

        .br-room-foot { padding:16px 22px; background:#FAFAF9; border-top:1px solid var(--border); }
        .br-btn-select { width:100%; padding:12px; background:var(--navy); color:#fff; border:none; border-radius:10px; font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:500; cursor:pointer; transition:all .18s; }
        .br-btn-select:hover { background:var(--navy-md); box-shadow:0 6px 18px rgba(13,27,42,.2); transform:translateY(-1px); }

        .br-empty-rooms { grid-column:1/-1; text-align:center; padding:60px 24px; background:var(--white); border:2px dashed var(--border); border-radius:16px; }
        .br-empty-rooms p { color:var(--muted); font-weight:500; font-size:15px; }

        /* ── STEP 2 LAYOUT ── */
        .br-step2 { display:flex; gap:22px; align-items:flex-start; flex-wrap:wrap; }
        .br-map-col { flex:2; min-width:340px; }
        .br-side-col { flex:1; min-width:280px; }

        /* ── MAP PANEL ── */
        .br-panel { background:var(--white); border:1px solid var(--border); border-radius:16px; padding:24px; }
        .br-panel-head { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:14px; margin-bottom:22px; }
        .br-panel-title { font-family:'Fraunces',serif; font-size:18px; font-weight:600; color:var(--navy); }
        .br-legend { display:flex; flex-wrap:wrap; gap:14px; }
        .br-legend-item { display:flex; align-items:center; gap:7px; font-size:12.5px; color:var(--muted); font-weight:500; }
        .br-legend-dot { width:12px; height:12px; border-radius:4px; flex-shrink:0; }
        .br-legend-dot--available { background:#fff; border:2px solid #22c55e; }
        .br-legend-dot--selected  { background:var(--gold); border:2px solid var(--gold); }
        .br-legend-dot--occupied  { background:#E4E0D8; border:2px solid #CBC5B9; }

        /* ── VISUAL MAP ── */
        .br-map-frame { position:relative; max-width:640px; margin:0 auto; border:2px solid var(--border); border-radius:16px; padding:32px 24px 44px; background:#FAFAF9; min-height:380px; }
        .br-map-inner { position:relative; }
        .br-corridor {
          position:absolute; top:0; bottom:0; left:50%; transform:translateX(-50%);
          width:56px; background:#fff; border:1px solid var(--border); border-radius:8px;
          display:flex; align-items:center; justify-content:center;
        }
        .br-corridor span { writing-mode:vertical-rl; font-size:11.5px; color:var(--muted); font-weight:500; white-space:nowrap; }
        .br-door {
          position:absolute; bottom:-1px; left:50%; transform:translateX(-50%);
          background:var(--navy); color:var(--gold); font-size:10px; font-weight:600;
          letter-spacing:.08em; padding:5px 18px; border-radius:6px 6px 0 0;
        }

        .br-bed-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px 88px; }

        .br-bed {
          position:relative; height:96px; border-radius:12px; border:2px solid transparent;
          display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px;
          cursor:pointer; transition:all .18s;
        }
        .br-bed-icon { display:flex; }
        .br-bed-code { font-family:'Fraunces',serif; font-size:14px; font-weight:600; }
        .br-bed-tag { position:absolute; top:8px; right:8px; font-size:9px; font-weight:600; padding:2px 7px; border-radius:100px; letter-spacing:.03em; }

        .br-bed--available { background:#fff; border-color:#22c55e; color:#15803d; }
        .br-bed--available:hover { background:rgba(34,197,94,.06); transform:translateY(-2px); box-shadow:0 6px 16px rgba(34,197,94,.15); }
        .br-bed--selected  { background:var(--gold); border-color:var(--gold); color:var(--navy); transform:scale(1.03); box-shadow:0 8px 20px rgba(201,168,76,.35); cursor:pointer; }
        .br-bed--occupied  { background:#F0EDE8; border-color:#DCD5C8; color:#A8A093; cursor:not-allowed; }
        .br-bed--occupied .br-bed-tag { background:#DCD5C8; color:#6B6459; }
        .br-bed--maintenance { background:rgba(239,68,68,.05); border:2px dashed rgba(239,68,68,.3); color:#dc2626; cursor:not-allowed; }
        .br-bed--maintenance .br-bed-tag--maint { background:rgba(239,68,68,.15); color:#b91c1c; }

        /* ── SIDE PANEL (booking summary) ── */
        .br-summary { background:var(--white); border:1px solid var(--border); border-radius:16px; padding:24px; position:sticky; top:24px; }
        .br-summary-title { font-family:'Fraunces',serif; font-size:17px; font-weight:600; color:var(--navy); padding-bottom:16px; border-bottom:1px solid var(--border); margin-bottom:18px; }

        .br-sum-rows { display:flex; flex-direction:column; gap:13px; margin-bottom:20px; }
        .br-sum-row { display:flex; justify-content:space-between; align-items:center; font-size:13px; }
        .br-sum-label { color:var(--muted); }
        .br-sum-val { font-weight:500; color:var(--navy); }
        .br-sum-val--bed { font-weight:700; color:var(--gold); background:var(--gold-dim); padding:4px 12px; border-radius:8px; border:1px solid var(--gold-b); }

        .br-sum-total { padding-top:20px; margin-top:6px; border-top:1px solid var(--border); }
        .br-sum-total-row { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:18px; }
        .br-sum-total-label { font-size:13px; color:var(--muted); font-weight:500; }
        .br-sum-total-val { font-family:'Fraunces',serif; font-size:26px; font-weight:700; color:var(--navy); letter-spacing:-.5px; }

        .br-btn-confirm { width:100%; padding:14px; background:var(--navy); color:#fff; border:none; border-radius:11px; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600; cursor:pointer; transition:all .18s; display:flex; align-items:center; justify-content:center; gap:8px; }
        .br-btn-confirm:hover:not(:disabled) { background:var(--navy-md); box-shadow:0 8px 22px rgba(13,27,42,.25); transform:translateY(-1px); }
        .br-btn-confirm:disabled { opacity:.5; cursor:not-allowed; }

        .br-empty-selection { text-align:center; padding:36px 12px; }
        .br-empty-icon { width:60px; height:60px; border-radius:50%; background:#F5F3EF; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; color:var(--muted); }
        .br-empty-title { font-weight:600; font-size:14.5px; color:var(--navy); margin-bottom:6px; }
        .br-empty-sub { font-size:12.5px; color:var(--muted); line-height:1.6; }
        .br-empty-sub em { color:#16a34a; font-style:normal; font-weight:600; }

        /* ── RESPONSIVE ── */
        @media (max-width:900px) {
          .br-bed-grid { grid-template-columns:1fr 1fr; gap:12px 60px; }
        }
        @media (max-width:768px) {
          .br-page-root { padding:16px 14px 40px; }
          .br-step2 { flex-direction:column; }
          .br-summary { position:static; }
        }
      `}</style>

      <div className="br-page-root">

        {/* Hero */}
        <div className="br-hero">
          <div className="br-hero-grid" />
          <div className="br-hero-glow" />
          <div className="br-hero-content">
            {selectedRoom ? (
              <button onClick={() => setSelectedRoom(null)} className="br-back-link">
                {I.back} Quay lại danh sách phòng
              </button>
            ) : (
              <Link href="/student" className="br-back-link">
                {I.back} Quay lại tổng quan
              </Link>
            )}
            <div className="br-hero-title">
              {selectedRoom ? `Chọn giường: Phòng ${selectedRoom.name || selectedRoom.roomNumber}` : "Đăng ký phòng ở"}
            </div>
            <div className="br-hero-sub">
              {selectedRoom
                ? "Vui lòng chọn vị trí giường trống trên sơ đồ bên dưới."
                : "Danh sách các phòng hiện đang còn trống trong hệ thống."}
            </div>
          </div>
        </div>

        {error && <div className="br-error">{error}</div>}

        {/* ── STEP 1: Room grid ── */}
        {!selectedRoom && (
          loading ? (
            <div className="br-loading">Đang tìm kiếm phòng trống...</div>
          ) : (
            <div className="br-room-grid">
              {rooms.length > 0 ? (
                rooms.map((room) => {
                  const id = room._id || room.roomId;
                  return (
                    <div key={id} className="br-room-card">
                      <div className="br-room-body">
                        <div className="br-room-head">
                          <div>
                            <div className="br-room-name">Phòng {room.name || room.roomNumber}</div>
                            <div className="br-room-loc">Tòa {room.building} · Tầng {room.floor}</div>
                          </div>
                          <span className="br-room-avail">Còn {room.capacity - room.currentOccupancy} chỗ</span>
                        </div>

                        <div className="br-room-rows">
                          <div className="br-room-row">
                            <span className="br-room-row-label">Loại phòng</span>
                            <span className="br-room-row-val">{room.roomType || "Tiêu chuẩn"}</span>
                          </div>
                          <div className="br-room-row">
                            <span className="br-room-row-label">Đã ở</span>
                            <span className="br-room-row-val">{room.currentOccupancy} / {room.capacity} người</span>
                          </div>
                          <div className="br-room-row">
                            <span className="br-room-row-label">Đơn giá</span>
                            <span className="br-room-row-val br-room-row-val--price">{room.price?.toLocaleString("vi-VN")} ₫/tháng</span>
                          </div>
                        </div>

                        <div className="br-fac-row">
                          {room.facilities?.slice(0, 3).map((fac, i) => (
                            <span key={i} className="br-fac-tag">{fac}</span>
                          ))}
                          {room.facilities?.length > 3 && (
                            <span className="br-fac-tag">+{room.facilities.length - 3}</span>
                          )}
                        </div>
                      </div>

                      <div className="br-room-foot">
                        <button onClick={() => handleSelectRoomToViewMap(room)} className="br-btn-select">
                          Xem sơ đồ &amp; Chọn giường
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="br-empty-rooms">
                  <p>Hiện tại Ký túc xá đã hết phòng trống.</p>
                </div>
              )}
            </div>
          )
        )}

        {/* ── STEP 2: Bed map + summary ── */}
        {selectedRoom && (
          <div className="br-step2">
            <div className="br-map-col">
              <VisualBedMap room={selectedRoom} beds={roomBeds} onSelectBed={setSelectedBed} />
            </div>

            <div className="br-side-col">
              <div className="br-summary">
                <div className="br-summary-title">Chi tiết đăng ký</div>

                {selectedBed ? (
                  <>
                    <div className="br-sum-rows">
                      <div className="br-sum-row">
                        <span className="br-sum-label">Phòng</span>
                        <span className="br-sum-val">{selectedRoom.name || selectedRoom.roomNumber} (Khu {selectedRoom.building})</span>
                      </div>
                      <div className="br-sum-row">
                        <span className="br-sum-label">Loại phòng</span>
                        <span className="br-sum-val">{selectedRoom.roomType || "Tiêu chuẩn"}</span>
                      </div>
                      <div className="br-sum-row">
                        <span className="br-sum-label">Vị trí giường</span>
                        <span className="br-sum-val--bed">{selectedBed.code}</span>
                      </div>
                      <div className="br-sum-row">
                        <span className="br-sum-label">Giá niêm yết</span>
                        <span className="br-sum-val">{selectedBed.price.toLocaleString('vi-VN')} ₫</span>
                      </div>
                    </div>

                    <div className="br-sum-total">
                      <div className="br-sum-total-row">
                        <span className="br-sum-total-label">Tạm tính/tháng</span>
                        <span className="br-sum-total-val">{selectedBed.price.toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <button onClick={handleBookRoom} disabled={submitting} className="br-btn-confirm">
                        {submitting ? "Đang xử lý..." : "Xác nhận đặt giường này"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="br-empty-selection">
                    <div className="br-empty-icon">{I.cursor}</div>
                    <div className="br-empty-title">Chưa chọn vị trí</div>
                    <div className="br-empty-sub">
                      Vui lòng chọn một giường <em>màu xanh</em> trên sơ đồ để xem chi tiết.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </RoleGuard>
  );
}