import { API_URL } from "@/src/config/env";
import { useDownloads } from "@/src/store/useDownloads";
import { useEffect } from "react";

// Simple polling registry - one polling timer per jobId
const pollers = new Map<string, number>();

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
    jobs,
  } = useDownloads();

  useEffect(() => {
    if (!jobId) return;
    let unmounted = false;
    
    // Check if job is already saved to gallery (silent check to reduce log spam)
    const job = jobs[jobId];
    if (job?._gallerySaved) {
      return; // Silent return to avoid log spam
    }

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
        markJobFailed(jobId, d.message);
      } else if (d.finished) {
        stopPolling(jobId);
        markJobDone(jobId);
        startFinalDownloadIfNeeded(jobId);
      }
    };

    const startPolling = (ms = 2500) => {
      if (pollers.has(jobId)) return;
      const id = (setInterval(async () => {
        try {
          const r = await fetch(`${API_URL}/jobs/${jobId}`);
          if (r.ok) {
            const job = await r.json();
            handle({
              id: job.id,
              status: job.status,
              progress01: job.progress,
              downloadedBytes: job.downloaded_bytes,
              totalBytes: job.total_bytes,
              speedBps: job.speed_bps,
              etaSeconds: job.eta_seconds,
              finished: job.status === "done",
              failed: job.status === "error",
              message: job.error,
            });
          }
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

    // Start polling for job updates
    startPolling(1500);

    return () => {
      if (unmounted) return;
      unmounted = true;
      stopPolling(jobId);
    };
  }, [jobId, setBackendJobMetrics, setBackendJobProgress, setBackendJobStatus, markJobDone, markJobFailed, startFinalDownloadIfNeeded, jobs]);
}
