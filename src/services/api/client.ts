import axios from "axios";
import { API_URL } from "../../config/env";

export const api = axios.create({
  baseURL: `${API_URL}/media`,
  timeout: 30000,
});

// Log every request
api.interceptors.request.use((config) => {
  console.log(
    "[API REQUEST]",
    config.method?.toUpperCase(),
    config.baseURL + (config.url || ""),
    config.params ? "params:" + JSON.stringify(config.params) : "",
    config.data ? "data:" + JSON.stringify(config.data) : ""
  );
  return config;
});

// Log every response
api.interceptors.response.use(
  (response) => {
    console.log(
      "[API RESPONSE]",
      response.status,
      response.config.url,
      response.data ? JSON.stringify(response.data).slice(0, 200) + "..." : ""
    );
    return response;
  },
  (error) => {
    if (error.response) {
      console.log(
        "[API ERROR]",
        error.config?.url,
        "status:",
        error.response.status,
        "data:",
        JSON.stringify(error.response.data)
      );
    } else {
      console.log("[API ERROR]", error.message, error.code);
    }
    return Promise.reject(error);
  }
);
