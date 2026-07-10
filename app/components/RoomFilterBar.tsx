"use client";

import { useMemo } from "react";

// ─── Bộ lọc Tòa / Tầng / Phòng dùng chung cho các trang admin ─────────────────
// Lọc hoàn toàn phía client: options được suy ra từ chính dữ liệu đã tải về.

export interface RoomRef {
  name?: string;
  building?: string;
  floor?: number | string;
}

export interface RoomFilterValue {
  building: string; // "" = tất cả
  floor: string;    // "" = tất cả
  room: string;     // "" = tất cả (so theo room.name)
}

export const EMPTY_ROOM_FILTER: RoomFilterValue = { building: "", floor: "", room: "" };

/** Một dòng dữ liệu có khớp bộ lọc hiện tại không (dòng không có phòng chỉ hiện khi không lọc gì). */
export function matchRoomFilter(filter: RoomFilterValue, room?: RoomRef | null): boolean {
  const active = filter.building || filter.floor || filter.room;
  if (!room) return !active;
  if (filter.building && room.building !== filter.building) return false;
  if (filter.floor && String(room.floor ?? "") !== filter.floor) return false;
  if (filter.room && room.name !== filter.room) return false;
  return true;
}

export default function RoomFilterBar({
  rooms,
  value,
  onChange,
}: {
  /** Danh sách phòng của các dòng đang hiển thị (trùng lặp được, null/undefined được bỏ qua). */
  rooms: (RoomRef | null | undefined)[];
  value: RoomFilterValue;
  onChange: (next: RoomFilterValue) => void;
}) {
  const { buildings, floors, roomNames } = useMemo(() => {
    const valid = rooms.filter((r): r is RoomRef => !!r);

    const buildings = [...new Set(valid.map((r) => r.building).filter(Boolean))].sort() as string[];

    const floorPool = valid.filter((r) => !value.building || r.building === value.building);
    const floors = [...new Set(floorPool.map((r) => (r.floor != null ? String(r.floor) : "")).filter(Boolean))]
      .sort((a, b) => Number(a) - Number(b));

    const roomPool = floorPool.filter((r) => !value.floor || String(r.floor ?? "") === value.floor);
    const roomNames = [...new Set(roomPool.map((r) => r.name).filter(Boolean))].sort() as string[];

    return { buildings, floors, roomNames };
  }, [rooms, value.building, value.floor]);

  const isActive = value.building || value.floor || value.room;

  return (
    <div className="rfb">
      <style>{`
        .rfb { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .rfb-select { height: 36px; padding: 0 10px; border: 1px solid rgba(13,27,42,0.15); border-radius: 8px; background: #fff; color: #0D1B2A; outline: none; font-size: 12.5px; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: border-color .15s; min-width: 110px; }
        .rfb-select:focus { border-color: #c9a84c; }
        .rfb-select:disabled { opacity: .55; cursor: not-allowed; }
        .rfb-clear { height: 36px; padding: 0 12px; border: 1px solid rgba(220,38,38,0.25); border-radius: 8px; background: #fff; color: #dc2626; font-size: 12.5px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all .15s; }
        .rfb-clear:hover { background: rgba(220,38,38,0.06); }
      `}</style>

      <select
        className="rfb-select"
        value={value.building}
        onChange={(e) => onChange({ building: e.target.value, floor: "", room: "" })}
        aria-label="Lọc theo tòa"
      >
        <option value="">Tất cả tòa</option>
        {buildings.map((b) => (
          <option key={b} value={b}>Tòa {b}</option>
        ))}
      </select>

      <select
        className="rfb-select"
        value={value.floor}
        onChange={(e) => onChange({ ...value, floor: e.target.value, room: "" })}
        aria-label="Lọc theo tầng"
      >
        <option value="">Tất cả tầng</option>
        {floors.map((f) => (
          <option key={f} value={f}>Tầng {f}</option>
        ))}
      </select>

      <select
        className="rfb-select"
        value={value.room}
        onChange={(e) => onChange({ ...value, room: e.target.value })}
        aria-label="Lọc theo phòng"
      >
        <option value="">Tất cả phòng</option>
        {roomNames.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>

      {isActive && (
        <button type="button" className="rfb-clear" onClick={() => onChange(EMPTY_ROOM_FILTER)}>
          Xóa lọc
        </button>
      )}
    </div>
  );
}
