import { useState } from "react";
import { getInfo } from "../../../services/api/media";
import type { InfoResponse } from "../types";
import { isValidUrl } from "../utils";

export function useInfo() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InfoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchInfo(url: string) {
    if (!isValidUrl(url)) { setError("Please enter a valid URL."); return; }
    setLoading(true); setError(null);
    try {
      const resp = await getInfo(url);
      setData(resp);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e?.message ?? "Failed to fetch info");
    } finally {
      setLoading(false);
    }
  }

  return { loading, data, error, fetchInfo };
}
