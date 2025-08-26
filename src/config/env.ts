import Constants from "expo-constants";
const baseUrl = "http://10.20.2.78:8000";

export const API_URL: string =
  (Constants?.expoConfig?.extra as any)?.apiUrl ??
  (Constants?.manifest2?.extra as any)?.apiUrl ??
  baseUrl;

export const WS_URL = API_URL.replace(/^http/i, "ws"); // ws://... or wss://...
