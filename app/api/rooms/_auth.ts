import type { NextRequest } from "next/server";
import type { UserRole } from "../../utils/auth";
import type { ViewerContext } from "./types";

function decodeTokenPayload(token: string) {
  const [, payload] = token.split(".");

  if (!payload) return null;

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = Buffer.from(normalizedPayload, "base64").toString("utf8");
    return JSON.parse(decodedPayload) as { sub?: string; email?: string; role?: UserRole };
  } catch {
    return null;
  }
}

export function getViewerFromRequest(request: NextRequest): ViewerContext | null {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice(7).trim();
  if (!token) return null;

  const payload = decodeTokenPayload(token);
  if (!payload?.role || !payload.email) return null;

  return {
    userId: payload.sub ?? payload.email,
    email: payload.email,
    role: payload.role,
  };
}

export function isAdminViewer(role: UserRole) {
  return role !== "STUDENT";
}
