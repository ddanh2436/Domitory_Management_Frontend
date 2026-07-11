"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../../utils/apiClient";
import AvatarLightbox from "../../components/AvatarLightbox";
import { useToast } from "../../components/ToastProvider";
import { useConfirm } from "../../components/ConfirmProvider";

interface Occupant {
  userId: string;
  fullName: string;
  mssv: string;
  dateOfBirth: string;
  avatar?: string;
  contactInfo?: { phone?: string; email?: string } | null;
  checkInDate: string;
  roomStatus: string;
  bookingHistory: { bookingId: string; roomNumber: string; requestedAt: string; status: string }[];
  contractInfo: { contractNumber: string; startDate: string; endDate: string; rentalFee: number; status: string };
  currentRoomAssignment: { roomId: string; roomNumber: string; roomType: string; building: string; floor: number };
}

interface Room {
  roomId: string;
  roomNumber: string;
  name?: string; // Tên phòng trên database (nếu có)
  roomType: string;
  building: string;
  floor: number;
  capacity: number;
  currentOccupancy: number;
  price: number;
  status: "AVAILABLE" | "FULL" | "MAINTENANCE";
  availabilityStatus: string;
  facilities: string[];
  occupants?: Occupant[];
  _id?: string;
}

type StatusFilter = "ALL" | Room["status"];

const STATUS_LABEL: Record<Room["status"], string> = {
  AVAILABLE: "Còn trống",
  FULL: "Đã đầy",
  MAINTENANCE: "Bảo trì",
};

// Form dùng chuỗi cho các trường số để tránh bug số 0 dính đầu / NaN của input controlled
const EMPTY_FORM = { name: "", building: "", floor: "1", capacity: "4", price: "", facilities: "" };

// Chỉ giữ chữ số, bỏ số 0 thừa ở đầu (giữ lại "0" đơn lẻ khi người dùng gõ đúng số 0)
function sanitizeDigits(value: string): string {
  return value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
}

export default function AdminRoomsPage() {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Bộ lọc danh sách phòng
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [floorFilter, setFloorFilter] = useState("");

  // States cho tính năng Thêm phòng
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRoom, setNewRoom] = useState({ ...EMPTY_FORM });

  const fetchRooms = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get("/rooms");
      const payload = await response.json();

      if (response.ok) {
        setRooms(payload.data || []);
        // Nếu không có phòng nào được chọn, tự động chọn phòng đầu tiên
        if (!selectedRoomId && payload.data?.length > 0) {
          const firstRoomId = payload.data[0].roomId || payload.data[0]._id;
          setSelectedRoomId(firstRoomId);
        }
      } else {
        setRooms([]);
        setError(payload.message || "Không thể tải danh sách phòng.");
      }
    } catch (requestError) {
      console.error(requestError);
      setError("Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ESC để đóng modal thêm phòng
  useEffect(() => {
    if (!isAddModalOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) setIsAddModalOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isAddModalOpen, isSubmitting]);

  // Xử lý logic Thêm Phòng
  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    const floor = Number(newRoom.floor);
    const capacity = Number(newRoom.capacity);
    const price = Number(newRoom.price);
    if (!newRoom.floor || floor < 1) {
      toast.error("Tầng phải là số nguyên từ 1 trở lên.");
      return;
    }
    if (!newRoom.capacity || capacity < 1) {
      toast.error("Sức chứa phải là số nguyên từ 1 trở lên.");
      return;
    }
    if (newRoom.price === "" || price < 0) {
      toast.error("Vui lòng nhập giá thuê hợp lệ.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Tách chuỗi tiện ích thành mảng
      const facilitiesArray = newRoom.facilities
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);

      const payload = {
        name: newRoom.name.trim(),
        building: newRoom.building.trim(),
        floor,
        capacity,
        price,
        status: "AVAILABLE",
        facilities: facilitiesArray,
      };

      const response = await apiClient.post("/rooms", payload);

      if (response.ok) {
        setIsAddModalOpen(false);
        setNewRoom({ ...EMPTY_FORM });
        await fetchRooms(); // Tải lại danh sách
        toast.success(`Đã thêm phòng ${payload.name} vào hệ thống.`, "Thêm phòng thành công");
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Không thể thêm phòng.");
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi kết nối với server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý logic Xóa Phòng
  const handleDeleteRoom = async () => {
    if (!selectedRoomId) return;
    const roomToDelete = rooms.find((r) => (r.roomId || r._id) === selectedRoomId);
    const roomName = roomToDelete?.roomNumber || roomToDelete?.name || "này";
    const occupantCount = roomToDelete?.occupants?.length ?? 0;

    const ok = await confirmDialog({
      title: `Xóa phòng ${roomName}?`,
      message:
        occupantCount > 0
          ? `Phòng này đang có ${occupantCount} sinh viên lưu trú. Xóa phòng sẽ ảnh hưởng đến chỗ ở của họ và không thể hoàn tác.`
          : "Toàn bộ dữ liệu của phòng sẽ bị xóa khỏi hệ thống. Hành động này không thể hoàn tác.",
      confirmLabel: "Xóa phòng",
      variant: "danger",
    });
    if (!ok) return;

    try {
      const response = await apiClient.delete(`/rooms/${selectedRoomId}`);
      if (response.ok) {
        toast.success(`Đã xóa phòng ${roomName} khỏi hệ thống.`, "Xóa phòng thành công");
        setSelectedRoomId(null); // Xóa selection
        fetchRooms(); // Tải lại danh sách
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Không thể xóa phòng.");
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi kết nối với server.");
    }
  };

  // Options lọc suy ra từ dữ liệu
  const buildings = useMemo(
    () => [...new Set(rooms.map((r) => r.building).filter(Boolean))].sort(),
    [rooms],
  );
  const floors = useMemo(
    () =>
      [...new Set(
        rooms
          .filter((r) => !buildingFilter || r.building === buildingFilter)
          .map((r) => String(r.floor)),
      )].sort((a, b) => Number(a) - Number(b)),
    [rooms, buildingFilter],
  );

  const filteredRooms = rooms.filter((room) => {
    const q = search.trim().toLowerCase();
    const name = (room.roomNumber || room.name || "").toLowerCase();
    if (q && !name.includes(q)) return false;
    if (statusFilter !== "ALL" && room.status !== statusFilter) return false;
    if (buildingFilter && room.building !== buildingFilter) return false;
    if (floorFilter && String(room.floor) !== floorFilter) return false;
    return true;
  });

  const countByStatus = (s: Room["status"]) => rooms.filter((r) => r.status === s).length;

  const selectedRoom = rooms.find((room) => (room.roomId || room._id) === selectedRoomId) || filteredRooms[0] || null;

  // Preview giá tiền đã định dạng trong modal
  const pricePreview = newRoom.price ? Number(newRoom.price).toLocaleString("vi-VN") : "";
  const facilitiesPreview = newRoom.facilities.split(",").map((f) => f.trim()).filter(Boolean);

  return (
    <div className="rm-shell">
      <style>{`
        .rm-shell { width: 100%; color: #0D1B2A; font-family: 'DM Sans', sans-serif; display: flex; flex-direction: column; gap: 20px; }

        /* ── HERO ── */
        .rm-hero { position: relative; background: linear-gradient(135deg, #0D1B2A 0%, #182b43 60%, #253d5d 100%); color: #fff; border-radius: 16px; padding: 26px 28px; border: 1px solid rgba(201,168,76,0.25); overflow: hidden; }
        .rm-hero::after { content: ''; position: absolute; right: -70px; top: -70px; width: 240px; height: 240px; border-radius: 50%; background: rgba(201,168,76,0.08); pointer-events: none; }
        .rm-hero-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .rm-hero-title { font-family: 'Fraunces', serif; font-size: 25px; font-weight: 700; letter-spacing: -0.3px; }
        .rm-hero-sub { margin-top: 6px; color: rgba(255,255,255,0.65); font-size: 13.5px; max-width: 520px; line-height: 1.6; }
        .rm-add-btn { display: inline-flex; align-items: center; gap: 8px; background: #C9A84C; color: #0D1B2A; border: none; padding: 11px 20px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 13.5px; cursor: pointer; transition: all .18s; position: relative; z-index: 1; }
        .rm-add-btn:hover { background: #D9B85C; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(201,168,76,0.35); }
        .rm-stats { display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap; }
        .rm-stat { background: rgba(255,255,255,0.06); border: 1px solid rgba(201,168,76,0.2); border-radius: 10px; padding: 12px 18px; min-width: 110px; }
        .rm-stat-num { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 700; }
        .rm-stat-label { font-size: 11.5px; color: rgba(255,255,255,0.6); margin-top: 2px; }
        .rm-stat-num--green { color: #4ade80; }
        .rm-stat-num--red { color: #f87171; }
        .rm-stat-num--amber { color: #fbbf24; }

        /* ── TOOLBAR ── */
        .rm-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .rm-status-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
        .rm-tab { padding: 8px 14px; border-radius: 8px; border: 1px solid rgba(13,27,42,0.12); background: #fff; font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 600; color: #5c6f82; cursor: pointer; transition: all .15s; display: inline-flex; align-items: center; gap: 6px; }
        .rm-tab:hover { border-color: rgba(13,27,42,0.25); }
        .rm-tab--active { background: #0D1B2A; border-color: #0D1B2A; color: #fff; }
        .rm-tab-count { font-size: 11px; background: rgba(13,27,42,0.07); border-radius: 100px; padding: 1px 7px; font-weight: 700; }
        .rm-tab--active .rm-tab-count { background: rgba(255,255,255,0.18); }
        .rm-toolbar-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .rm-search-wrap { position: relative; }
        .rm-search-wrap svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #8A9BAD; pointer-events: none; }
        .rm-search { height: 38px; width: 190px; padding: 0 12px 0 34px; border: 1px solid rgba(13,27,42,0.15); border-radius: 8px; background: #fff; color: #0D1B2A; outline: none; font-size: 13px; font-family: 'DM Sans', sans-serif; transition: border-color .15s; }
        .rm-search:focus { border-color: #C9A84C; }
        .rm-select { height: 38px; padding: 0 10px; border: 1px solid rgba(13,27,42,0.15); border-radius: 8px; background: #fff; color: #0D1B2A; outline: none; font-size: 12.5px; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: border-color .15s; }
        .rm-select:focus { border-color: #C9A84C; }
        .rm-refresh { width: 38px; height: 38px; border-radius: 8px; border: 1px solid rgba(13,27,42,0.15); background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #5c6f82; transition: all .15s; }
        .rm-refresh:hover { border-color: rgba(13,27,42,0.3); color: #0D1B2A; }

        /* ── LAYOUT ── */
        .rm-layout { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 20px; align-items: start; }
        .rm-panel { background: #fff; border: 1px solid rgba(13,27,42,0.09); border-radius: 12px; overflow: hidden; }
        .rm-panel-head { padding: 16px 20px; border-bottom: 1px solid rgba(13,27,42,0.09); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .rm-panel-title { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 600; color: #0D1B2A; }
        .rm-panel-count { font-size: 12px; color: #8A9BAD; font-weight: 600; }
        .rm-panel-body { padding: 16px; }

        /* ── ROOM CARDS ── */
        .rm-list { display: flex; flex-direction: column; gap: 10px; max-height: 720px; overflow-y: auto; padding-right: 4px; }
        .rm-list::-webkit-scrollbar { width: 6px; }
        .rm-list::-webkit-scrollbar-thumb { background: rgba(13,27,42,0.14); border-radius: 100px; }
        .rm-card { border: 1px solid rgba(13,27,42,0.09); border-radius: 10px; padding: 14px 16px; cursor: pointer; transition: border-color .15s, background .15s, box-shadow .15s; background: #fff; text-align: left; width: 100%; font-family: 'DM Sans', sans-serif; }
        .rm-card:hover { border-color: rgba(201,168,76,0.4); }
        .rm-card--active { border-color: #C9A84C; background: #fffdf7; box-shadow: 0 4px 14px rgba(201,168,76,0.12); }
        .rm-card-top { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }
        .rm-card-name { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 700; color: #0D1B2A; }
        .rm-card-sub { color: #8A9BAD; font-size: 12px; margin-top: 3px; }
        .rm-tag { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 6px; font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
        .rm-tag-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
        .rm-tag--available { background: rgba(34,197,94,0.1); color: #16a34a; }
        .rm-tag--full { background: rgba(239,68,68,0.1); color: #dc2626; }
        .rm-tag--maintenance { background: rgba(245,158,11,0.1); color: #d97706; }

        .rm-occ-bar { margin-top: 12px; }
        .rm-occ-info { display: flex; justify-content: space-between; font-size: 12px; color: #5c6f82; margin-bottom: 5px; }
        .rm-occ-info b { color: #0D1B2A; }
        .rm-occ-track { height: 5px; border-radius: 100px; background: rgba(13,27,42,0.07); overflow: hidden; }
        .rm-occ-fill { height: 100%; border-radius: 100px; transition: width .3s; }

        .rm-card-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; gap: 10px; }
        .rm-price { font-size: 13px; font-weight: 700; color: #9a7b2c; }
        .rm-price small { font-weight: 500; color: #8A9BAD; }
        .rm-avatars { display: flex; align-items: center; }
        .rm-avatars-more { margin-left: -8px; width: 26px; height: 26px; border-radius: 50%; background: rgba(13,27,42,0.06); color: #334155; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 2px #fff; }
        .rm-avatars-empty { font-size: 11.5px; color: #b6c2cd; font-style: italic; }

        .rm-empty { text-align: center; padding: 48px 20px; color: #8A9BAD; font-size: 13.5px; border: 1px dashed rgba(13,27,42,0.15); border-radius: 10px; }

        /* ── DETAIL PANEL ── */
        .rm-detail-head { padding: 20px 24px; border-bottom: 1px solid rgba(13,27,42,0.09); display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
        .rm-detail-title { font-family: 'Fraunces', serif; font-size: 21px; font-weight: 700; color: #0D1B2A; letter-spacing: -0.3px; }
        .rm-detail-sub { font-size: 12.5px; color: #8A9BAD; margin-top: 4px; }
        .rm-detail-actions { display: flex; align-items: center; gap: 8px; }
        .rm-delete-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 14px; border-radius: 8px; border: 1px solid rgba(239,68,68,0.25); background: #fff; color: #dc2626; font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 600; cursor: pointer; transition: all .15s; }
        .rm-delete-btn:hover { background: rgba(239,68,68,0.06); border-color: rgba(239,68,68,0.45); }

        .rm-detail-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; padding: 20px 24px; border-bottom: 1px solid rgba(13,27,42,0.07); }
        .rm-detail-item { padding: 12px 14px; border-radius: 8px; background: #fbfaf8; border: 1px solid rgba(13,27,42,0.07); }
        .rm-detail-label { font-size: 11px; font-weight: 700; color: #8A9BAD; text-transform: uppercase; letter-spacing: 0.05em; }
        .rm-detail-value { font-size: 14px; font-weight: 700; color: #0D1B2A; margin-top: 4px; }

        .rm-fac-wrap { padding: 16px 24px; border-bottom: 1px solid rgba(13,27,42,0.07); }
        .rm-fac-title { font-size: 11px; font-weight: 700; color: #8A9BAD; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 9px; }
        .rm-fac-row { display: flex; flex-wrap: wrap; gap: 6px; }
        .rm-fac { padding: 5px 11px; border-radius: 6px; background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.22); font-size: 12px; color: #7a6023; font-weight: 600; }
        .rm-fac--none { background: rgba(13,27,42,0.04); border-color: rgba(13,27,42,0.08); color: #8A9BAD; font-style: italic; font-weight: 500; }

        .rm-occupants { padding: 18px 24px 22px; }
        .rm-occupants-title { font-family: 'Fraunces', serif; font-size: 15px; font-weight: 600; color: #0D1B2A; margin-bottom: 12px; }
        .rm-occupant { border: 1px solid rgba(13,27,42,0.08); border-radius: 10px; padding: 14px 16px; margin-bottom: 10px; background: #fff; }
        .rm-occupant:last-child { margin-bottom: 0; }
        .rm-occupant-head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
        .rm-occupant-identity { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .rm-occupant-name { font-size: 14.5px; font-weight: 700; color: #0D1B2A; }
        .rm-occupant-mssv { font-size: 12.5px; color: #8A9BAD; margin-top: 2px; }
        .rm-occupant-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 14px; margin-top: 12px; font-size: 12.5px; color: #5c6f82; }
        .rm-occupant-meta b { color: #0D1B2A; font-weight: 600; }
        .rm-no-occupant { font-size: 13px; color: #8A9BAD; font-style: italic; padding: 22px; border: 1px dashed rgba(13,27,42,0.15); border-radius: 10px; background: #fbfaf8; text-align: center; }

        /* ── MODAL THÊM PHÒNG ── */
        @keyframes rmModalIn { from { opacity: 0; transform: scale(0.97) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .rm-overlay { position: fixed; inset: 0; background: rgba(13,27,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(3px); padding: 20px; }
        .rm-modal { background: #fff; border-radius: 12px; width: 100%; max-width: 520px; box-shadow: 0 24px 60px rgba(13,27,42,0.3); max-height: 92vh; overflow-y: auto; animation: rmModalIn .18s cubic-bezier(.22,1,.36,1); }
        .rm-modal-head { padding: 20px 24px; border-bottom: 1px solid rgba(13,27,42,0.09); display: flex; align-items: center; gap: 14px; }
        .rm-modal-icon { width: 42px; height: 42px; border-radius: 10px; background: rgba(201,168,76,0.14); color: #9a7b2c; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .rm-modal-title { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 700; color: #0D1B2A; }
        .rm-modal-sub { font-size: 12.5px; color: #8A9BAD; margin-top: 2px; }
        .rm-modal-body { padding: 22px 24px; }

        .rm-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 15px; }
        .rm-label { font-size: 12px; font-weight: 700; color: #0D1B2A; }
        .rm-label small { font-weight: 500; color: #8A9BAD; }
        .rm-input { width: 100%; height: 42px; padding: 0 13px; border: 1px solid rgba(13,27,42,0.15); border-radius: 8px; background: #fbfaf8; color: #0D1B2A; outline: none; font-size: 13.5px; font-family: 'DM Sans', sans-serif; transition: border-color .15s, background .15s, box-shadow .15s; }
        .rm-input:focus { border-color: #C9A84C; background: #fff; box-shadow: 0 0 0 3px rgba(201,168,76,0.15); }
        .rm-input::placeholder { color: #b6c2cd; }
        .rm-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .rm-price-preview { font-size: 12px; color: #9a7b2c; font-weight: 600; }
        .rm-fac-preview { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px; }

        .rm-modal-foot { display: flex; gap: 10px; padding: 18px 24px 22px; border-top: 1px solid rgba(13,27,42,0.07); }
        .rm-btn-cancel { flex: 1; height: 44px; border: 1px solid rgba(13,27,42,0.15); border-radius: 8px; background: #fff; color: #0D1B2A; font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: background .15s; }
        .rm-btn-cancel:hover { background: #F5F3EF; }
        .rm-btn-submit { flex: 2; height: 44px; border: none; border-radius: 8px; background: #0D1B2A; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: background .18s; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
        .rm-btn-submit:hover:not(:disabled) { background: #1A2E42; }
        .rm-btn-submit:disabled { opacity: .55; cursor: not-allowed; }

        @media (max-width: 1000px) { .rm-layout { grid-template-columns: 1fr; } .rm-detail-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .rm-detail-grid, .rm-occupant-meta, .rm-grid2 { grid-template-columns: 1fr; } .rm-search { width: 100%; } }
      `}</style>

      {/* HERO + THỐNG KÊ */}
      <div className="rm-hero">
        <div className="rm-hero-top">
          <div>
            <div className="rm-hero-title">Quản lý phòng ở</div>
            <div className="rm-hero-sub">
              Theo dõi tình trạng từng phòng, danh sách cư dân và thêm/xóa phòng trong hệ thống ký túc xá.
            </div>
          </div>
          <button type="button" className="rm-add-btn" onClick={() => setIsAddModalOpen(true)}>
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm phòng mới
          </button>
        </div>
        <div className="rm-stats">
          <div className="rm-stat">
            <div className="rm-stat-num">{loading ? "—" : rooms.length}</div>
            <div className="rm-stat-label">Tổng số phòng</div>
          </div>
          <div className="rm-stat">
            <div className="rm-stat-num rm-stat-num--green">{loading ? "—" : countByStatus("AVAILABLE")}</div>
            <div className="rm-stat-label">Còn trống</div>
          </div>
          <div className="rm-stat">
            <div className="rm-stat-num rm-stat-num--red">{loading ? "—" : countByStatus("FULL")}</div>
            <div className="rm-stat-label">Đã đầy</div>
          </div>
          <div className="rm-stat">
            <div className="rm-stat-num rm-stat-num--amber">{loading ? "—" : countByStatus("MAINTENANCE")}</div>
            <div className="rm-stat-label">Đang bảo trì</div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: "13px 16px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#b91c1c", fontSize: 13.5, fontWeight: 500 }}>
          {error}
        </div>
      )}

      {/* TOOLBAR LỌC */}
      <div className="rm-toolbar">
        <div className="rm-status-tabs">
          {(["ALL", "AVAILABLE", "FULL", "MAINTENANCE"] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`rm-tab ${statusFilter === s ? "rm-tab--active" : ""}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === "ALL" ? "Tất cả" : STATUS_LABEL[s]}
              <span className="rm-tab-count">{s === "ALL" ? rooms.length : countByStatus(s)}</span>
            </button>
          ))}
        </div>
        <div className="rm-toolbar-right">
          <select
            className="rm-select"
            value={buildingFilter}
            onChange={(e) => { setBuildingFilter(e.target.value); setFloorFilter(""); }}
            aria-label="Lọc theo tòa"
          >
            <option value="">Tất cả tòa</option>
            {buildings.map((b) => <option key={b} value={b}>Tòa {b}</option>)}
          </select>
          <select
            className="rm-select"
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            aria-label="Lọc theo tầng"
          >
            <option value="">Tất cả tầng</option>
            {floors.map((f) => <option key={f} value={f}>Tầng {f}</option>)}
          </select>
          <div className="rm-search-wrap">
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="rm-search"
              type="search"
              placeholder="Tìm tên phòng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="button" className="rm-refresh" onClick={fetchRooms} title="Tải lại danh sách">
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rm-panel" style={{ padding: 40, textAlign: "center", color: "#8A9BAD", fontSize: 13.5 }}>
          Đang tải dữ liệu phòng...
        </div>
      ) : (
        <div className="rm-layout">
          {/* CỘT TRÁI: DANH SÁCH PHÒNG */}
          <section className="rm-panel">
            <div className="rm-panel-head">
              <span className="rm-panel-title">Danh sách phòng</span>
              <span className="rm-panel-count">{filteredRooms.length}/{rooms.length} phòng</span>
            </div>
            <div className="rm-panel-body">
              <div className="rm-list">
                {filteredRooms.map((room, index) => {
                  const safeId = room.roomId || room._id || `room-${index}`;
                  const isSelected = selectedRoomId === safeId;
                  const occRatio = room.capacity > 0 ? room.currentOccupancy / room.capacity : 0;
                  const barColor = occRatio >= 1 ? "#ef4444" : occRatio >= 0.75 ? "#f59e0b" : "#22c55e";

                  return (
                    <button key={safeId} type="button" onClick={() => setSelectedRoomId(safeId)} className={`rm-card ${isSelected ? "rm-card--active" : ""}`}>
                      <div className="rm-card-top">
                        <div>
                          <div className="rm-card-name">Phòng {room.roomNumber || room.name}</div>
                          <div className="rm-card-sub">Tòa {room.building} · Tầng {room.floor} · {room.roomType || "Tiêu chuẩn"}</div>
                        </div>
                        <span className={`rm-tag rm-tag--${room.status.toLowerCase()}`}>
                          <span className="rm-tag-dot" />
                          {STATUS_LABEL[room.status] || room.status}
                        </span>
                      </div>

                      <div className="rm-occ-bar">
                        <div className="rm-occ-info">
                          <span>Sức chứa</span>
                          <span><b>{room.currentOccupancy}</b>/{room.capacity} người</span>
                        </div>
                        <div className="rm-occ-track">
                          <div className="rm-occ-fill" style={{ width: `${Math.min(100, occRatio * 100)}%`, background: barColor }} />
                        </div>
                      </div>

                      <div className="rm-card-foot">
                        <span className="rm-price">{room.price.toLocaleString("vi-VN")} đ <small>/tháng</small></span>
                        <div className="rm-avatars">
                          {room.occupants && room.occupants.length > 0 ? (
                            <>
                              {room.occupants.slice(0, 4).map((occ, i) => (
                                <AvatarLightbox
                                  key={`${occ.userId || occ.mssv || "occ"}-${i}`}
                                  name={occ.fullName}
                                  avatar={occ.avatar}
                                  size={26}
                                  style={{ marginLeft: i === 0 ? 0 : -8, boxShadow: "0 0 0 2px #fff" }}
                                />
                              ))}
                              {room.occupants.length > 4 && (
                                <span className="rm-avatars-more">+{room.occupants.length - 4}</span>
                              )}
                            </>
                          ) : (
                            <span className="rm-avatars-empty">Chưa có sinh viên</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filteredRooms.length === 0 && (
                  <div className="rm-empty">
                    {rooms.length === 0 ? "Chưa có phòng nào trong hệ thống." : "Không có phòng nào khớp bộ lọc."}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* CỘT PHẢI: CHI TIẾT PHÒNG ĐƯỢC CHỌN */}
          <aside className="rm-panel">
            {selectedRoom ? (
              <>
                <div className="rm-detail-head">
                  <div>
                    <div className="rm-detail-title">Phòng {selectedRoom.roomNumber || selectedRoom.name}</div>
                    <div className="rm-detail-sub">Tòa {selectedRoom.building} · Tầng {selectedRoom.floor} · {selectedRoom.roomType || "Tiêu chuẩn"}</div>
                  </div>
                  <div className="rm-detail-actions">
                    <span className={`rm-tag rm-tag--${selectedRoom.status.toLowerCase()}`}>
                      <span className="rm-tag-dot" />
                      {STATUS_LABEL[selectedRoom.status] || selectedRoom.status}
                    </span>
                    <button type="button" onClick={handleDeleteRoom} className="rm-delete-btn">
                      <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18m-2 0l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m4 0V4a2 2 0 012-2h2a2 2 0 012 2v2" />
                      </svg>
                      Xóa phòng
                    </button>
                  </div>
                </div>

                <div className="rm-detail-grid">
                  <div className="rm-detail-item">
                    <div className="rm-detail-label">Sức chứa</div>
                    <div className="rm-detail-value">{selectedRoom.currentOccupancy} / {selectedRoom.capacity} người</div>
                  </div>
                  <div className="rm-detail-item">
                    <div className="rm-detail-label">Giá thuê</div>
                    <div className="rm-detail-value">{selectedRoom.price.toLocaleString("vi-VN")} đ/tháng</div>
                  </div>
                  <div className="rm-detail-item">
                    <div className="rm-detail-label">Chỗ trống</div>
                    <div className="rm-detail-value">{Math.max(0, selectedRoom.capacity - selectedRoom.currentOccupancy)} chỗ</div>
                  </div>
                </div>

                <div className="rm-fac-wrap">
                  <div className="rm-fac-title">Tiện ích trong phòng</div>
                  <div className="rm-fac-row">
                    {selectedRoom.facilities.length > 0 ? (
                      selectedRoom.facilities.map((facility) => <span key={facility} className="rm-fac">{facility}</span>)
                    ) : (
                      <span className="rm-fac rm-fac--none">Chưa khai báo tiện ích</span>
                    )}
                  </div>
                </div>

                <div className="rm-occupants">
                  <div className="rm-occupants-title">
                    Cư dân trong phòng ({selectedRoom.occupants?.length ?? 0})
                  </div>
                  {selectedRoom.occupants && selectedRoom.occupants.length > 0 ? (
                    selectedRoom.occupants.map((occupant, idx) => (
                      <div key={`${occupant.userId || occupant.mssv || "occ"}-${idx}`} className="rm-occupant">
                        <div className="rm-occupant-head">
                          <div className="rm-occupant-identity">
                            <AvatarLightbox name={occupant.fullName} avatar={occupant.avatar} size={42} />
                            <div style={{ minWidth: 0 }}>
                              <div className="rm-occupant-name">{occupant.fullName}</div>
                              <div className="rm-occupant-mssv">MSSV: {occupant.mssv}</div>
                            </div>
                          </div>
                          <span className={`rm-tag ${occupant.roomStatus === "CONFIRMED" ? "rm-tag--available" : "rm-tag--maintenance"}`}>
                            <span className="rm-tag-dot" />
                            {occupant.roomStatus || "CONFIRMED"}
                          </span>
                        </div>
                        <div className="rm-occupant-meta">
                          <div><b>Ngày sinh:</b> {occupant.dateOfBirth ? new Date(occupant.dateOfBirth).toLocaleDateString("vi-VN") : "N/A"}</div>
                          <div><b>Check-in:</b> {occupant.checkInDate ? new Date(occupant.checkInDate).toLocaleDateString("vi-VN") : "N/A"}</div>
                          <div><b>Email:</b> {occupant.contactInfo?.email || "Không công khai"}</div>
                          <div><b>Điện thoại:</b> {occupant.contactInfo?.phone || "Không công khai"}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rm-no-occupant">Chưa có cư dân nào được phân bổ vào phòng này.</div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ padding: 40, textAlign: "center", color: "#8A9BAD", fontSize: 13.5 }}>Chưa chọn phòng nào.</div>
            )}
          </aside>
        </div>
      )}

      {/* MODAL THÊM PHÒNG */}
      {isAddModalOpen && (
        <div
          className="rm-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) setIsAddModalOpen(false);
          }}
        >
          <div className="rm-modal" role="dialog" aria-modal="true" aria-labelledby="rm-modal-title">
            <div className="rm-modal-head">
              <div className="rm-modal-icon">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <div id="rm-modal-title" className="rm-modal-title">Thêm phòng mới</div>
                <div className="rm-modal-sub">Phòng mới sẽ ở trạng thái &ldquo;Còn trống&rdquo; và sẵn sàng nhận đăng ký</div>
              </div>
            </div>

            <form onSubmit={handleAddRoom}>
              <div className="rm-modal-body">
                <div className="rm-field">
                  <label className="rm-label" htmlFor="rm-name">Tên / Số phòng *</label>
                  <input
                    id="rm-name"
                    required
                    placeholder="Ví dụ: P101"
                    type="text"
                    className="rm-input"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  />
                </div>

                <div className="rm-grid2">
                  <div className="rm-field">
                    <label className="rm-label" htmlFor="rm-building">Tòa nhà *</label>
                    <input
                      id="rm-building"
                      required
                      placeholder="Ví dụ: A1"
                      type="text"
                      className="rm-input"
                      value={newRoom.building}
                      onChange={(e) => setNewRoom({ ...newRoom, building: e.target.value })}
                    />
                  </div>
                  <div className="rm-field">
                    <label className="rm-label" htmlFor="rm-floor">Tầng *</label>
                    <input
                      id="rm-floor"
                      required
                      type="text"
                      inputMode="numeric"
                      placeholder="Ví dụ: 1"
                      className="rm-input"
                      value={newRoom.floor}
                      onChange={(e) => setNewRoom({ ...newRoom, floor: sanitizeDigits(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="rm-grid2">
                  <div className="rm-field">
                    <label className="rm-label" htmlFor="rm-capacity">Sức chứa tối đa *</label>
                    <input
                      id="rm-capacity"
                      required
                      type="text"
                      inputMode="numeric"
                      placeholder="Ví dụ: 4"
                      className="rm-input"
                      value={newRoom.capacity}
                      onChange={(e) => setNewRoom({ ...newRoom, capacity: sanitizeDigits(e.target.value) })}
                    />
                  </div>
                  <div className="rm-field">
                    <label className="rm-label" htmlFor="rm-price">Giá thuê (VNĐ/tháng) *</label>
                    <input
                      id="rm-price"
                      required
                      type="text"
                      inputMode="numeric"
                      placeholder="Ví dụ: 1200000"
                      className="rm-input"
                      value={newRoom.price}
                      onChange={(e) => setNewRoom({ ...newRoom, price: sanitizeDigits(e.target.value) })}
                    />
                    {pricePreview && <span className="rm-price-preview">= {pricePreview} đ/tháng</span>}
                  </div>
                </div>

                <div className="rm-field" style={{ marginBottom: 0 }}>
                  <label className="rm-label" htmlFor="rm-facilities">
                    Tiện ích <small>(cách nhau bằng dấu phẩy)</small>
                  </label>
                  <input
                    id="rm-facilities"
                    placeholder="Ví dụ: Máy lạnh, Tủ lạnh, Tủ đồ cá nhân"
                    type="text"
                    className="rm-input"
                    value={newRoom.facilities}
                    onChange={(e) => setNewRoom({ ...newRoom, facilities: e.target.value })}
                  />
                  {facilitiesPreview.length > 0 && (
                    <div className="rm-fac-preview">
                      {facilitiesPreview.map((f, i) => <span key={`${f}-${i}`} className="rm-fac">{f}</span>)}
                    </div>
                  )}
                </div>
              </div>

              <div className="rm-modal-foot">
                <button type="button" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting} className="rm-btn-cancel">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={isSubmitting} className="rm-btn-submit">
                  {isSubmitting ? (
                    "Đang xử lý..."
                  ) : (
                    <>
                      <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Lưu phòng mới
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
