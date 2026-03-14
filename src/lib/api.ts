import axios from "axios";

// PC (localhost) → connect directly to nginx on port 8005
// Mobile/other devices → use Next.js proxy (they can't reach port 8005)
function getBaseURL(): string {
  if (typeof window === "undefined") return "http://localhost:8005/api/v1";
  const h = window.location.hostname;
  if (h === "localhost" || h === "127.0.0.1") {
    return "http://localhost:8005/api/v1";
  }
  return "/api/v1"; // goes through Next.js rewrite proxy
}

const API_BASE_URL = getBaseURL();

const api = axios.create({
  baseURL: API_BASE_URL,
});

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
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = localStorage.getItem("refresh_token");
        if (refresh) {
          const { data } = await axios.post(`${API_BASE_URL}/auth/jwt/refresh/`, { refresh });
          localStorage.setItem("access_token", data.access);
          if (data.refresh) localStorage.setItem("refresh_token", data.refresh);
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        // Don't redirect here — let AuthContext handle navigation
      }
    }
    return Promise.reject(error);
  }
);

export default api;
