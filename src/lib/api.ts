import axios from "axios";

// PC (localhost) → connect directly to nginx on port 8005
// Mobile/other devices → use Next.js proxy (they can't reach port 8005)
function getBaseURL(): string {
  if (typeof window === "undefined") {
    // Server-side: use env var or local fallback
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api/v1";
  }
  const h = window.location.hostname;
  if (h === "localhost" || h === "127.0.0.1") {
    return "http://localhost:8005/api/v1";
  }
  // Production: call backend API directly
  return process.env.NEXT_PUBLIC_API_URL || "https://api.margot.rest/api/v1";
}

const API_BASE_URL = getBaseURL();

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

api.interceptors.request.use((config) => {
  // Asegurar trailing slash para Django APPEND_SLASH
  if (config.url && !config.url.endsWith('/') && !config.url.includes('?')) {
    config.url = config.url + '/';
  } else if (config.url && config.url.includes('?') && !config.url.split('?')[0].endsWith('/')) {
    const [path, query] = config.url.split('?');
    config.url = path + '/?' + query;
  }
  // Auto-set Content-Type: axios sets multipart/form-data for FormData automatically
  if (!(config.data instanceof FormData)) {
    config.headers["Content-Type"] = config.headers["Content-Type"] || "application/json";
  }
  // CSRF token for mutating requests
  const method = config.method?.toUpperCase();
  if (method && !["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers["X-CSRFToken"] = csrfToken;
    }
  }
  return config;
});

// Silent refresh on 401 — cookies are sent automatically
let isRefreshing = false;
let refreshSubscribers: ((success: boolean) => void)[] = [];

function onRefreshDone(success: boolean) {
  refreshSubscribers.forEach((cb) => cb(success));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await api.post("/auth/jwt/refresh/");
          isRefreshing = false;
          onRefreshDone(true);
          return api(originalRequest);
        } catch {
          isRefreshing = false;
          onRefreshDone(false);
          return Promise.reject(error);
        }
      }

      // Another request already triggered a refresh — wait for it
      return new Promise((resolve, reject) => {
        refreshSubscribers.push((success) => {
          if (success) {
            resolve(api(originalRequest));
          } else {
            reject(error);
          }
        });
      });
    }
    return Promise.reject(error);
  }
);

export default api;
