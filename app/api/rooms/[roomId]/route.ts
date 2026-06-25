import { NextRequest, NextResponse } from "next/server";
import { getViewerFromRequest, isAdminViewer } from "../_auth";
import { logAccessDenied } from "../_audit";
import { findRoomById, findRoomByViewer, toAdminRoomView, toPublicRoomView } from "../data";

export async function GET(request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const viewer = getViewerFromRequest(request);

  if (!viewer) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Handle "me" as special case for student's own room
  if (roomId === "me") {
    if (viewer.role !== "STUDENT") {
      return NextResponse.json({ message: "Chỉ sinh viên mới dùng được API này." }, { status: 403 });
    }
    const room = findRoomByViewer(viewer);
    if (!room) {
      return NextResponse.json({ message: "Sinh viên chưa được phân phòng." }, { status: 404 });
    }
    return NextResponse.json({ data: toPublicRoomView(room) });
  }

  const room = findRoomById(roomId);

  if (!room) {
    return NextResponse.json({ message: "Không tìm thấy phòng." }, { status: 404 });
  }

  if (isAdminViewer(viewer.role)) {
    return NextResponse.json({ data: toAdminRoomView(room) });
  }

  const ownRoom = findRoomByViewer(viewer);

  if (!ownRoom || ownRoom.roomId !== room.roomId) {
    logAccessDenied({
      endpoint: `/api/rooms/${roomId}`,
      roomId: roomId,
      viewerRole: viewer.role,
      viewerEmail: viewer.email,
      reason: "Student attempted to access another room",
    });

    return NextResponse.json({ message: "Bạn chỉ có thể xem phòng của mình." }, { status: 403 });
  }

  return NextResponse.json({ data: toPublicRoomView(room) });
}