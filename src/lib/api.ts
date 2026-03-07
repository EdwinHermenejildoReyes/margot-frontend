import axios from "axios";

// Call Django directly (bypass Next.js proxy) to avoid trailing-slash issues
const API_BASE_URL =
  typeof window !== "undefined"
    ? `http://${window.location.hostname}:8004/api/v1`
    : "http://localhost:8004/api/v1";

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
        if (typeof window !== "undefined") window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
