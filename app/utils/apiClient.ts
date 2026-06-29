// app/utils/apiClient.ts

const getBaseUrl = () => {
  let url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  
  // Tự động chuẩn hóa: Nếu URL bị cấu hình thiếu /api, hệ thống sẽ tự thêm vào
  // Xử lý triệt để lỗi "Cannot GET /rooms?status=AVAILABLE"
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const apiClient = {
  get: async (endpoint: string) => {
    return fetch(`${getBaseUrl()}${endpoint}`, {
      method: "GET",
      headers: getHeaders(),
    });
  },

  post: async (endpoint: string, body: unknown) => {
    return fetch(`${getBaseUrl()}${endpoint}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
  },

  patch: async (endpoint: string, body?: unknown) => {
    return fetch(`${getBaseUrl()}${endpoint}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete: async (endpoint: string) => {
    return fetch(`${getBaseUrl()}${endpoint}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
  },
};