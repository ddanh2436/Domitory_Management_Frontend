import { NextRequest, NextResponse } from "next/server";
import { getViewerFromRequest, isAdminViewer } from "./_auth";
import { logAccessDenied } from "./_audit";
import { findRoomByViewer, rooms, toAdminRoomView, toPublicRoomView } from "./data";

export function GET(request: NextRequest) {
  const viewer = getViewerFromRequest(request);

  if (!viewer) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (isAdminViewer(viewer.role)) {
    return NextResponse.json({ data: rooms.map(toAdminRoomView) });
  }

  const room = findRoomByViewer(viewer);

  if (!room) {
    logAccessDenied({
      endpoint: "/api/rooms",
      viewerRole: viewer.role,
      viewerEmail: viewer.email,
      reason: "Student has no assigned room",
    });

    return NextResponse.json({ message: "Sinh viên chưa được phân phòng." }, { status: 404 });
  }

  return NextResponse.json({ data: [toPublicRoomView(room)] });
}
