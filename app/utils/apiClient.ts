// app/utils/apiClient.ts

const getBaseUrl = () => {
  // Lấy đường dẫn từ file .env.local, nếu không có thì fallback tạm về localhost
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
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