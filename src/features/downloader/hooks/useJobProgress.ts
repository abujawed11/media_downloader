import { WS_URL } from "@/src/config/env";
import { useDownloads } from "@/src/store/useDownloads";
import { useEffect } from "react";

// Simple singleton registry
const sockets = new Map<string, { ws: WebSocket; refs: number }>();
const pollers = new Map<string, number>(); // one polling timer per jobId

type Update = {
  id: string;
  status?: string;
  progress01?: number;
  message?: string;
  finished?: boolean;
  failed?: boolean;
  part?: "video" | "audio" | "merging" | "progressive";
  downloadedBytes?: number;
  totalBytes?: number | null;
  speedBps?: number | null;
  etaSeconds?: number | null;
  mergeTimeSec?: number | null;
  type?: "ping";
};

export function useJobProgress(jobId?: string) {
  const {
    setBackendJobProgress,
    setBackendJobStatus,
    setBackendJobMetrics,
    markJobDone,
    markJobFailed,
    startFinalDownloadIfNeeded,
  } = useDownloads();

  useEffect(() => {
    if (!jobId) return;
    let unmounted = false;

    const httpBase = WS_URL.replace(/^ws/i, "http");

    const handle = (d: Update) => {
      if (!d || d.type === "ping") return;

      // Make progress monotonic on the client too (extra guard)
      if (typeof d.progress01 === "number") {
        setBackendJobProgress(jobId, d.progress01);
      }
      if (d.status) setBackendJobStatus(jobId, d.status);
      setBackendJobMetrics(jobId, {
        part: d.part,
        downloadedBytes: d.downloadedBytes,
        totalBytes: d.totalBytes,
        speedBps: d.speedBps,
        etaSeconds: d.etaSeconds,
      });

      if (d.failed) {
        stopPolling(jobId);
        close(jobId);
        markJobFailed(jobId, d.message);
      } else if (d.finished) {
        stopPolling(jobId);
        close(jobId);
        markJobDone(jobId);
        startFinalDownloadIfNeeded(jobId);
      }
    };

    const startPolling = (ms = 2500) => {
      if (pollers.has(jobId)) return;
      const id = (setInterval(async () => {
        try {
          const r = await fetch(`${httpBase}/media/jobs/${jobId}/progress`);
          if (r.ok) handle(await r.json());
        } catch {}
      }, ms) as unknown) as number;
      pollers.set(jobId, id);
    };

    const stopPolling = (id: string) => {
      const t = pollers.get(id);
      if (t != null) {
        clearInterval(t);
        pollers.delete(id);
      }
    };

    const open = () => {
      const existing = sockets.get(jobId);
      if (existing) {
        // just increase ref-count
        existing.refs += 1;
        return;
      }
      const ws = new WebSocket(`${WS_URL}/ws/jobs/${jobId}`);
      sockets.set(jobId, { ws, refs: 1 });

      ws.onopen = () => {
        stopPolling(jobId);
      };
      ws.onmessage = (e) => {
        try { handle(JSON.parse(e.data)); } catch {}
      };
      ws.onerror = () => {
        // keep one polling loop as fallback
        startPolling(2500);
      };
      ws.onclose = () => {
        // when closed (e.g., server restarts), keep polling
        startPolling(3000);
      };
    };

    const close = (id: string) => {
      const entry = sockets.get(id);
      if (!entry) return;
      entry.refs -= 1;
      if (entry.refs <= 0) {
        try { entry.ws.close(); } catch {}
        sockets.delete(id);
      }
    };

    // Start with polling, then open 1 WS per job
    startPolling(1500);
    open();

    return () => {
      if (unmounted) return;
      unmounted = true;
      close(jobId);
      // leave polling off on unmount; if others still reference this job, WS stays alive
    };
  }, [jobId, setBackendJobMetrics, setBackendJobProgress, setBackendJobStatus, markJobDone, markJobFailed, startFinalDownloadIfNeeded]);
}
