import axios, { AxiosInstance, AxiosError } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/connectk_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (config.method && !["get", "head", "options"].includes(config.method)) {
    const csrf = getCsrfToken();
    if (csrf) {
      config.headers["X-CSRF-Token"] = csrf;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export function extractData<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export function extractPagination(response: { data: { pagination?: unknown } }) {
  return response.data.pagination;
}

export function extractKpis(response: { data: { kpis?: unknown } }) {
  return response.data.kpis;
}
