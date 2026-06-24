import { NextRequest, NextResponse } from "next/server";
import { getViewerFromRequest } from "../_auth";
import { logAccessDenied } from "../_audit";
import { findRoomByViewer, toPublicRoomView } from "../data";

export function GET(request: NextRequest) {
  const viewer = getViewerFromRequest(request);

  if (!viewer) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (viewer.role !== "STUDENT") {
    return NextResponse.json({ message: "Chỉ sinh viên mới dùng được API này." }, { status: 403 });
  }

  const room = findRoomByViewer(viewer);

  if (!room) {
    logAccessDenied({
      endpoint: "/api/rooms/me",
      viewerRole: viewer.role,
      viewerEmail: viewer.email,
      reason: "Student room assignment missing",
    });

    return NextResponse.json({ message: "Sinh viên chưa được phân phòng." }, { status: 404 });
  }

  return NextResponse.json({ data: toPublicRoomView(room) });
}
