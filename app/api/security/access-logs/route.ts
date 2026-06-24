import { NextRequest, NextResponse } from "next/server";
import { getViewerFromRequest, isAdminViewer } from "../../rooms/_auth";
import { getAccessDeniedLogs } from "../../rooms/_audit";

export function GET(request: NextRequest) {
  const viewer = getViewerFromRequest(request);

  if (!viewer) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminViewer(viewer.role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ data: getAccessDeniedLogs() });
}