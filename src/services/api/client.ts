// src/services/api/client.ts
import axios from "axios";
import { API_URL } from "../../config/env";

// Server uses root endpoints, not /media prefix
const base = `${API_URL.replace(/\/$/, "")}`;

export const api = axios.create({
  baseURL: base,
  timeout: 30000,
});

// Dev log: base once
if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log("[api] baseURL =", base);
}

// Log every request
api.interceptors.request.use((config) => {
  try {
    const method = (config.method || "get").toUpperCase();
    const url = (config.baseURL || "") + (config.url || "");
    const parts: string[] = [`[API REQUEST] ${method} ${url}`];
    if (config.params) parts.push("params:" + JSON.stringify(config.params));
    if (config.data) parts.push("data:" + JSON.stringify(config.data));
    // eslint-disable-next-line no-console
    console.log(parts.join("  "));
  } catch {}
  return config;
});

// Log every response / error
api.interceptors.response.use(
  (response) => {
    try {
      const preview =
        typeof response.data === "string"
          ? response.data.slice(0, 200)
          : JSON.stringify(response.data).slice(0, 200);
      // eslint-disable-next-line no-console
      console.log(
        "[API RESPONSE]",
        response.status,
        response.config?.url,
        preview + (preview.length === 200 ? "..." : "")
      );
    } catch {}
    return response;
  },
  (error) => {
    try {
      if (error.response) {
        // eslint-disable-next-line no-console
        console.log(
          "[API ERROR]",
          error.config?.url,
          "status:",
          error.response.status,
          "data:",
          JSON.stringify(error.response.data)
        );
      } else {
        // eslint-disable-next-line no-console
        console.log("[API ERROR]", error.message, error.code);
      }
    } catch {}
    return Promise.reject(error);
  }
);
