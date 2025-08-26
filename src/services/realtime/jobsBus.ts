// src/services/realtime/jobsBus.ts
import { WS_URL } from "@/src/config/env";
import { useDownloads } from "@/src/store/useDownloads";

// Persist across Fast Refresh
type GlobalBus = {
  ws?: WebSocket | null;
  backoff: number;
  polling?: number | null;
  started: boolean;
};
const g: GlobalBus = (globalThis as any).__JOBS_BUS__ ?? { ws: null, backoff: 1000, polling: null, started: false };
(globalThis as any).__JOBS_BUS__ = g;

function startPolling() {
  if (g.polling != null) return;
  const httpBase = WS_URL.replace(/^ws/i, "http");
  g.polling = (setInterval(async () => {
    try {
      // Optional: if you want to refresh all jobs list, you can keep a small set somewhere.
      // Here we do nothing; WS is the primary channel. Polling is a safety net you can implement per job if needed.
    } catch {}
  }, 3000) as unknown) as number;
}

function stopPolling() {
  if (g.polling != null) {
    clearInterval(g.polling);
    g.polling = null;
  }
}

export function ensureJobsBusStarted() {
  if (g.started) return;
  g.started = true;

  const connect = () => {
    try {
      const ws = new WebSocket(`${WS_URL}/ws/jobs`);
      g.ws = ws;

      ws.onopen = () => {
        stopPolling();
        g.backoff = 1000;
      };

      ws.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (!d || d.type === "ping") return;
          const { id } = d;
          if (!id) return;

          // Push into store with monotonic + throttle safeguards
          const store = useDownloads.getState();

          if (typeof d.progress01 === "number") {
            store.setBackendJobProgress(id, d.progress01);
          }
          if (d.status) store.setBackendJobStatus(id, d.status);
          store.setBackendJobMetrics(id, {
            part: d.part,
            downloadedBytes: d.downloadedBytes,
            totalBytes: d.totalBytes,
            speedBps: d.speedBps,
            etaSeconds: d.etaSeconds,
          });

          if (d.failed) {
            store.markJobFailed(id, d.message);
          } else if (d.finished) {
            store.markJobDone(id);
            store.startFinalDownloadIfNeeded(id);
          }
        } catch {}
      };

      ws.onerror = () => {
        startPolling();
      };

      ws.onclose = () => {
        startPolling();
        const wait = g.backoff;
        g.backoff = Math.min(15000, g.backoff * 2);
        setTimeout(connect, wait);
      };
    } catch {
      startPolling();
      setTimeout(connect, 2000);
    }
  };

  // Kick it off
  startPolling(); // safety net
  connect();
}
