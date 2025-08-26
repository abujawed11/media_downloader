import Constants from "expo-constants";

const baseUrl = "http://192.168.1.102:8000"

export const API_URL: string =
  (Constants?.expoConfig?.extra as any)?.apiUrl ?? (Constants?.manifest2?.extra as any)?.apiUrl ?? baseUrl;
