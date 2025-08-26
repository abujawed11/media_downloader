// src/features/downloader/hooks/useJobProgress.ts
import { WS_URL } from "@/src/config/env";
import { useDownloads } from "@/src/store/useDownloads";
import { useEffect, useRef } from "react";

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
    } = useDownloads() as any;

    const wsRef = useRef<WebSocket | null>(null);
    //   const pollRef = useRef<NodeJS.Timer | null>(null);
    const pollRef = useRef<number | null>(null);
    const backoffRef = useRef(1000);

    useEffect(() => {
        if (!jobId) return;
        let closed = false;

        const handle = (d: Update) => {
            if (!d || d.type === "ping") return;
            if (typeof d.progress01 === "number") setBackendJobProgress(jobId, d.progress01);
            if (d.status) setBackendJobStatus(jobId, d.status);
            setBackendJobMetrics(jobId, {
                part: d.part,
                downloadedBytes: d.downloadedBytes,
                totalBytes: d.totalBytes,
                speedBps: d.speedBps,
                etaSeconds: d.etaSeconds,
            });
            if (d.failed) {
                stopPolling(); closeWS();
                markJobFailed(jobId, d.message);
            } else if (d.finished) {
                stopPolling(); closeWS();
                markJobDone(jobId);
                startFinalDownloadIfNeeded(jobId); // kick off final GET /jobs/{id}/file
            }
        };

        const httpBase = WS_URL.replace(/^ws/i, "http");

        const startPolling = (ms = 2500) => {
            if (pollRef.current) return;
            pollRef.current = (setInterval(async () => {
                try {
                    const httpBase = WS_URL.replace(/^ws/i, "http");
                    const r = await fetch(`${httpBase}/media/jobs/${jobId}/progress`);
                    if (r.ok) handle(await r.json());
                } catch { }
            }, ms) as unknown) as number;
        };

        // const stopPolling = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
        const stopPolling = () => {
            if (pollRef.current !== null) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };
        const closeWS = () => { const ws = wsRef.current; if (ws) { try { ws.close(); } catch { } wsRef.current = null; } };

        const connect = () => {
            try {
                const ws = new WebSocket(`${WS_URL}/ws/jobs/${jobId}`);
                wsRef.current = ws;
                ws.onopen = () => { stopPolling(); backoffRef.current = 1000; };
                ws.onmessage = (e) => { try { handle(JSON.parse(e.data)); } catch { } };
                ws.onerror = () => { startPolling(2500); };
                ws.onclose = () => {
                    if (closed) return;
                    startPolling(Math.min(5000, backoffRef.current + 1000));
                    const wait = backoffRef.current;
                    backoffRef.current = Math.min(15000, backoffRef.current * 2);
                    setTimeout(connect, wait);
                };
            } catch {
                startPolling(2500);
                setTimeout(connect, 2000);
            }
        };

        startPolling(1500);
        connect();

        // return () => { closed = True as any; stopPolling(); closeWS(); };
        return () => {
            closed = true;
            stopPolling();
            closeWS();
        };
    }, [jobId]);
}
