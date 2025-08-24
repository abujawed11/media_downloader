import type { InfoResponse } from "../../features/downloader/types";
import { api } from "./client";

export async function getInfo(url: string) {
  const { data } = await api.post<InfoResponse>("/info", { url });
  return data;
}

export async function startDownload(params: { url: string; format: string }) {
  return api.get<ArrayBuffer>("/download", {
    params,
    responseType: "arraybuffer",
  });
}
