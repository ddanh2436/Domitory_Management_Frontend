export interface AccessDeniedLog {
  id: string;
  at: string;
  endpoint: string;
  roomId?: string;
  viewerRole?: string;
  viewerEmail?: string;
  reason: string;
}

const accessDeniedLogs: AccessDeniedLog[] = [];

export function logAccessDenied(entry: Omit<AccessDeniedLog, "id" | "at">) {
  const logEntry: AccessDeniedLog = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    ...entry,
  };

  accessDeniedLogs.unshift(logEntry);
  accessDeniedLogs.splice(50);
  console.warn("[room-access-denied]", logEntry);
}

export function getAccessDeniedLogs() {
  return accessDeniedLogs;
}
