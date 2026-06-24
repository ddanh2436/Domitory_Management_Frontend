import type {
  AdminRoomView,
  PublicOccupantView,
  PublicRoomView,
  RoomRecord,
  ResidentRecord,
  ViewerContext,
} from "./types";

export const rooms: RoomRecord[] = [
  {
    roomId: "room-a401",
    roomNumber: "A401",
    roomType: "Phòng 4 người",
    building: "A",
    floor: 4,
    capacity: 4,
    status: "FULL",
    price: 1250000,
    facilities: ["Điều hòa", "Bàn học", "Tủ khóa", "Wi-Fi"],
    occupants: [
      {
        userId: "sv-001",
        fullName: "Nguyễn Minh Anh",
        mssv: "B21DCCN001",
        dateOfBirth: "2004-08-12",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
        contactInfo: { phone: "0901234567", email: "minhanh@example.edu.vn", allowed: true },
        checkInDate: "2025-08-20",
        roomStatus: "CONFIRMED",
        bookingHistory: [
          { bookingId: "bk-1001", roomNumber: "A401", requestedAt: "2025-08-02T08:30:00.000Z", status: "APPROVED" },
        ],
        contractInfo: {
          contractNumber: "HD-A401-001",
          startDate: "2025-08-20",
          endDate: "2026-08-19",
          rentalFee: 1250000,
          status: "ACTIVE",
        },
        currentRoomAssignment: { roomId: "room-a401", roomNumber: "A401", roomType: "Phòng 4 người", building: "A", floor: 4 },
      },
      {
        userId: "sv-002",
        fullName: "Trần Hoàng Phúc",
        mssv: "B21DCCN008",
        dateOfBirth: "2004-01-23",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300",
        contactInfo: { phone: "0912345678", email: "hoangphuc@example.edu.vn", allowed: true },
        checkInDate: "2025-08-20",
        roomStatus: "CONFIRMED",
        bookingHistory: [
          { bookingId: "bk-1002", roomNumber: "A401", requestedAt: "2025-08-02T08:36:00.000Z", status: "APPROVED" },
        ],
        contractInfo: {
          contractNumber: "HD-A401-002",
          startDate: "2025-08-20",
          endDate: "2026-08-19",
          rentalFee: 1250000,
          status: "ACTIVE",
        },
        currentRoomAssignment: { roomId: "room-a401", roomNumber: "A401", roomType: "Phòng 4 người", building: "A", floor: 4 },
      },
      {
        userId: "sv-003",
        fullName: "Lê Thu Hằng",
        mssv: "B21DCCN010",
        dateOfBirth: "2004-05-09",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300",
        contactInfo: { phone: "0907771122", email: "thuhang@example.edu.vn", allowed: false },
        checkInDate: "2025-08-20",
        roomStatus: "CONFIRMED",
        bookingHistory: [
          { bookingId: "bk-1003", roomNumber: "A401", requestedAt: "2025-08-02T08:45:00.000Z", status: "APPROVED" },
        ],
        contractInfo: {
          contractNumber: "HD-A401-003",
          startDate: "2025-08-20",
          endDate: "2026-08-19",
          rentalFee: 1250000,
          status: "ACTIVE",
        },
        currentRoomAssignment: { roomId: "room-a401", roomNumber: "A401", roomType: "Phòng 4 người", building: "A", floor: 4 },
      },
      {
        userId: "sv-004",
        fullName: "Phạm Gia Huy",
        mssv: "B21DCCN015",
        dateOfBirth: "2004-11-02",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300",
        contactInfo: { phone: "0988123456", email: "giahuy@example.edu.vn", allowed: true },
        checkInDate: "2025-08-20",
        roomStatus: "CONFIRMED",
        bookingHistory: [
          { bookingId: "bk-1004", roomNumber: "A401", requestedAt: "2025-08-02T08:50:00.000Z", status: "APPROVED" },
        ],
        contractInfo: {
          contractNumber: "HD-A401-004",
          startDate: "2025-08-20",
          endDate: "2026-08-19",
          rentalFee: 1250000,
          status: "ACTIVE",
        },
        currentRoomAssignment: { roomId: "room-a401", roomNumber: "A401", roomType: "Phòng 4 người", building: "A", floor: 4 },
      },
    ],
  },
  {
    roomId: "room-b205",
    roomNumber: "B205",
    roomType: "Phòng 3 người",
    building: "B",
    floor: 2,
    capacity: 3,
    status: "AVAILABLE",
    price: 1380000,
    facilities: ["Điều hòa", "Tủ lạnh", "Máy giặt chung", "Wi-Fi"],
    occupants: [
      {
        userId: "sv-005",
        fullName: "Đỗ Quỳnh Chi",
        mssv: "B21DCCN022",
        dateOfBirth: "2004-03-18",
        avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300",
        contactInfo: { phone: "0903011223", email: "quynhchi@example.edu.vn", allowed: true },
        checkInDate: "2025-09-01",
        roomStatus: "CONFIRMED",
        bookingHistory: [
          { bookingId: "bk-1005", roomNumber: "B205", requestedAt: "2025-08-25T06:15:00.000Z", status: "APPROVED" },
        ],
        contractInfo: {
          contractNumber: "HD-B205-001",
          startDate: "2025-09-01",
          endDate: "2026-08-31",
          rentalFee: 1380000,
          status: "ACTIVE",
        },
        currentRoomAssignment: { roomId: "room-b205", roomNumber: "B205", roomType: "Phòng 3 người", building: "B", floor: 2 },
      },
      {
        userId: "sv-006",
        fullName: "Võ Đức Long",
        mssv: "B21DCCN030",
        dateOfBirth: "2004-09-04",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300",
        contactInfo: { phone: "0911882200", email: "duclong@example.edu.vn", allowed: false },
        checkInDate: "2025-09-01",
        roomStatus: "CONFIRMED",
        bookingHistory: [
          { bookingId: "bk-1006", roomNumber: "B205", requestedAt: "2025-08-25T06:20:00.000Z", status: "APPROVED" },
        ],
        contractInfo: {
          contractNumber: "HD-B205-002",
          startDate: "2025-09-01",
          endDate: "2026-08-31",
          rentalFee: 1380000,
          status: "ACTIVE",
        },
        currentRoomAssignment: { roomId: "room-b205", roomNumber: "B205", roomType: "Phòng 3 người", building: "B", floor: 2 },
      },
    ],
  },
  {
    roomId: "room-c110",
    roomNumber: "C110",
    roomType: "Phòng 2 người",
    building: "C",
    floor: 1,
    capacity: 2,
    status: "MAINTENANCE",
    price: 1480000,
    facilities: ["Điều hòa", "Bàn học đôi", "Ban công", "Wi-Fi"],
    occupants: [
      {
        userId: "sv-007",
        fullName: "Ngô Anh Tuấn",
        mssv: "B21DCCN041",
        dateOfBirth: "2004-12-11",
        avatar: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=300",
        contactInfo: { phone: "0977112233", email: "anhtuan@example.edu.vn", allowed: true },
        checkInDate: "2025-10-03",
        roomStatus: "PENDING_CHECKOUT",
        bookingHistory: [
          { bookingId: "bk-1007", roomNumber: "C110", requestedAt: "2025-09-20T09:00:00.000Z", status: "APPROVED" },
        ],
        contractInfo: {
          contractNumber: "HD-C110-001",
          startDate: "2025-10-03",
          endDate: "2026-10-02",
          rentalFee: 1480000,
          status: "ACTIVE",
        },
        currentRoomAssignment: { roomId: "room-c110", roomNumber: "C110", roomType: "Phòng 2 người", building: "C", floor: 1 },
      },
    ],
  },
];

export function getRoomOccupancy(room: RoomRecord) {
  return room.occupants.length;
}

export function getAvailabilityStatus(room: RoomRecord) {
  if (room.status === "MAINTENANCE") return "Đang bảo trì";
  if (getRoomOccupancy(room) >= room.capacity) return "Đã kín";
  return "Còn trống";
}

export function findRoomById(roomId: string) {
  return rooms.find((room) => room.roomId === roomId) ?? null;
}

export function findRoomByViewer(viewer: ViewerContext) {
  if (viewer.role !== "STUDENT") return null;

  const matchedRoom = rooms.find((room) => room.occupants.some((resident) => resident.userId === viewer.userId || resident.contactInfo.email === viewer.email));
  return matchedRoom ?? null;
}

export function toPublicOccupantView(resident: ResidentRecord): PublicOccupantView {
  return {
    userId: resident.userId,
    fullName: resident.fullName,
    mssv: resident.mssv,
    avatar: resident.avatar,
    contactInfo: resident.contactInfo.allowed
      ? {
          phone: resident.contactInfo.phone,
          email: resident.contactInfo.email,
        }
      : null,
    checkInDate: resident.checkInDate,
    roomStatus: resident.roomStatus,
  };
}

export function toPublicRoomView(room: RoomRecord): PublicRoomView {
  return {
    roomId: room.roomId,
    roomNumber: room.roomNumber,
    roomType: room.roomType,
    building: room.building,
    floor: room.floor,
    capacity: room.capacity,
    currentOccupancy: getRoomOccupancy(room),
    status: room.status,
    availabilityStatus: getAvailabilityStatus(room),
    price: room.price,
    facilities: room.facilities,
    occupants: room.occupants.map(toPublicOccupantView),
  };
}

export function toAdminRoomView(room: RoomRecord): AdminRoomView {
  return {
    ...room,
    currentOccupancy: getRoomOccupancy(room),
    availabilityStatus: getAvailabilityStatus(room),
  };
}
