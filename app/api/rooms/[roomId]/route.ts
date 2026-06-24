import { NextRequest, NextResponse } from "next/server";
import { getViewerFromRequest, isAdminViewer } from "../_auth";
import { logAccessDenied } from "../_audit";
import { findRoomById, findRoomByViewer, toAdminRoomView, toPublicRoomView } from "../data";

export function GET(request: NextRequest, { params }: { params: { roomId: string } }) {
  const viewer = getViewerFromRequest(request);

  if (!viewer) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const room = findRoomById(params.roomId);

  if (!room) {
    return NextResponse.json({ message: "Không tìm thấy phòng." }, { status: 404 });
  }

  if (isAdminViewer(viewer.role)) {
    return NextResponse.json({ data: toAdminRoomView(room) });
  }

  const ownRoom = findRoomByViewer(viewer);

  if (!ownRoom || ownRoom.roomId !== room.roomId) {
    logAccessDenied({
      endpoint: `/api/rooms/${params.roomId}`,
      roomId: params.roomId,
      viewerRole: viewer.role,
      viewerEmail: viewer.email,
      reason: "Student attempted to access another room",
    });

    return NextResponse.json({ message: "Bạn chỉ có thể xem phòng của mình." }, { status: 403 });
  }

  return NextResponse.json({ data: toPublicRoomView(room) });
}
