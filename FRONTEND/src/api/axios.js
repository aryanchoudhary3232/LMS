import axios from "axios";
import { trackApiLatency } from "../services/telemetry";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  config.metadata = {
    startTime: performance.now(),
  };

  return config;
});

api.interceptors.response.use(
  (response) => {
    const startTime = response.config?.metadata?.startTime;

    if (typeof startTime === "number") {
      trackApiLatency({
        endpoint: response.config?.url,
        method: response.config?.method,
        status: response.status,
        durationMs: Math.max(performance.now() - startTime, 0),
      });
    }

    return response;
  },
  (error) => {
    const startTime = error.config?.metadata?.startTime;

    if (typeof startTime === "number") {
      trackApiLatency({
        endpoint: error.config?.url,
        method: error.config?.method,
        status: error.response?.status || 0,
        durationMs: Math.max(performance.now() - startTime, 0),
      });
    }

    return Promise.reject(error);
  },
);

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else delete api.defaults.headers.common["Authorization"];
};

export default api;
