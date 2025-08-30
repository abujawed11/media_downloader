import Constants from "expo-constants";
const baseUrl = "http://10.20.2.78:8001";

export const API_URL: string =
  (Constants?.expoConfig?.extra as any)?.apiUrl ??
  (Constants?.manifest2?.extra as any)?.apiUrl ??
  baseUrl;

// Removed WS_URL since server doesn't support WebSockets
