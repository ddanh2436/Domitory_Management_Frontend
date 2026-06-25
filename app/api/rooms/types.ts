import type { UserRole } from "../../../utils/auth";

export type RoomStatus = "AVAILABLE" | "FULL" | "MAINTENANCE";
export type OccupancyStatus = "CONFIRMED" | "TEMPORARY" | "PENDING_CHECKOUT";

export interface ContactInfo {
  phone?: string;
  email?: string;
  allowed: boolean;
}

export interface BookingHistoryItem {
  bookingId: string;
  roomNumber: string;
  requestedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface ContractInfo {
  contractNumber: string;
  startDate: string;
  endDate: string;
  rentalFee: number;
  status: "ACTIVE" | "EXPIRED" | "TERMINATED";
}

export interface RoomAssignmentInfo {
  roomId: string;
  roomNumber: string;
  roomType: string;
  building: string;
  floor: number;
}

export interface ResidentRecord {
  userId: string;
  fullName: string;
  mssv: string;
  dateOfBirth: string;
  avatar?: string;
  contactInfo: ContactInfo;
  checkInDate: string;
  roomStatus: OccupancyStatus;
  bookingHistory: BookingHistoryItem[];
  contractInfo: ContractInfo;
  currentRoomAssignment: RoomAssignmentInfo;
}

export interface RoomRecord {
  roomId: string;
  roomNumber: string;
  roomType: string;
  building: string;
  floor: number;
  capacity: number;
  status: RoomStatus;
  price: number;
  facilities: string[];
  occupants: ResidentRecord[];
}

export interface ViewerContext {
  userId: string;
  email: string;
  role: UserRole;
}

export interface PublicOccupantView {
  userId: string;
  fullName: string;
  mssv: string;
  avatar?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
  } | null;
  checkInDate: string;
  roomStatus: OccupancyStatus;
}

export interface PublicRoomView {
  roomId: string;
  roomNumber: string;
  roomType: string;
  building: string;
  floor: number;
  capacity: number;
  currentOccupancy: number;
  status: RoomStatus;
  availabilityStatus: string;
  price: number;
  facilities: string[];
  occupants: PublicOccupantView[];
}

export interface AdminRoomView extends RoomRecord {
  currentOccupancy: number;
  availabilityStatus: string;
}
