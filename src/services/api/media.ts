// src/services/api/media.ts
import type { InfoResponse } from "../../features/downloader/types";
import { api } from "./client";

// ---------- Info ----------
export async function getInfo(url: string) {
  const { data } = await api.post<InfoResponse>("/info", { url });
  return data;
}

// (optional) legacy direct download-to-bytes endpoint
export async function startDownload(params: { url: string; format: string }) {
  return api.get<ArrayBuffer>("/download", {
    params,
    responseType: "arraybuffer",
  });
}

// ---------- Job-based endpoints ----------
export type CreateJobBody = {
  url: string;             // original media URL
  format: string;          // format_string e.g. "137+140" or "18"
  title?: string;
  ext?: string;
};

export type Job = {
  id: string;
  url: string;
  format_string: string;
  title?: string | null;
  ext?: string | null;
  status:
    | "queued"
    | "downloading"
    | "paused"
    | "merging"
    | "done"
    | "error"
    | "canceled";
  progress: number;               // 0..1
  downloaded_bytes: number;
  total_bytes?: number | null;
  speed_bps?: number | null;
  eta_seconds?: number | null;
  filename?: string | null;
  error?: string | null;
};

export async function createJob(body: CreateJobBody) {
  const { data } = await api.post<Job>("/jobs", body);
  return data;
}

export async function getJob(id: string) {
  const { data } = await api.get<Job>(`/jobs/${id}`);
  return data;
}

export async function listJobs() {
  const { data } = await api.get<Job[]>("/jobs");
  return data;
}

export async function pauseJob(id: string) {
  const { data } = await api.post<Job>(`/jobs/${id}/pause`, {});
  return data;
}

export async function resumeJob(id: string) {
  const { data } = await api.post<Job>(`/jobs/${id}/resume`, {});
  return data;
}

export async function cancelJob(id: string) {
  const { data } = await api.post<Job>(`/jobs/${id}/cancel`, {});
  return data;
}

// ---------- Direct URL for RNBD ----------
export async function getDirectUrl(params: { url: string; format_id: string }) {
  const { data } = await api.post<{
    url: string;
    fileName?: string;
    mime?: string;
    headers?: Record<string, string>;
  }>("/direct-url", params);
  return data;
}
