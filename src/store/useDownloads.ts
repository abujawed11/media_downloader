// import { create } from "zustand";

// type Item = {
//   id: string;
//   url: string;
//   title?: string;
//   progress: number; // 0..1
//   status: "queued" | "downloading" | "paused" | "completed" | "failed" | "canceled";
// };

// type State = {
//   items: Item[];
//   add: (i: Item) => void;
//   update: (id: string, patch: Partial<Item>) => void;
// };

// export const useDownloads = create<State>((set) => ({
//   items: [],
//   add: (i) => set((s) => ({ items: [i, ...s.items] })),
//   update: (id, patch) =>
//     set((s) => ({ items: s.items.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
// }));


// src/store/useDownloads.ts
// import { create } from "zustand";


// type JobStatus = "queued"|"downloading"|"paused"|"completed"|"failed"|"canceled";

// export type DownloadStatus =
//   | "queued"
//   | "downloading"
//   | "paused"
//   | "completed"
//   | "failed"
//   | "canceled";

// export type Item = {
//   id: string;
//   url: string;
//   title?: string;
//   progress: number;                // 0..1
//   status: DownloadStatus;

//   // Optional metadata for the card:
//   sizeBytes?: number | null;
//   quality?: string;                // e.g., "720p mp4 (merge)"
//   ext?: string | null;             // "mp4", "webm", ...
//   thumbnail?: string | null;

//   // Live stats coming from the backend:
//   speed_bps?: number;              // bytes/sec
//   eta_seconds?: number;            // seconds
//   downloaded_bytes?: number;
//   total_bytes?: number | null;

//   // After done:
//   filename?: string | null;

//   // If failed:
//   error?: string | null;
// };

// type State = {
//   items: Item[];
//   add: (i: Item) => void;
//   update: (id: string, patch: Partial<Item>) => void;
//   remove?: (id: string) => void;
//   clear?: () => void;
// };

// export interface DlJob {
//   id: string;           // your app-level id
//   nativeId: string;     // same as id for RNBD
//   title: string;
//   fileName: string;
//   progress01: number;
//   status: JobStatus;
//   localUri?: string;    // file:///... after completion
//   task?: any;           // RNBD task ref
// }

// export const useDownloads = create<State>((set) => ({
//   items: [],
//   add: (i) => set((s) => ({ items: [i, ...s.items] })),
//   update: (id, patch) =>
//     set((s) => ({
//       items: s.items.map((x) => (x.id === id ? { ...x, ...patch } : x)),
//     })),
//   remove: (id) =>
//     set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
//   clear: () => set({ items: [] }),
// }));



// src/store/useDownloads.ts
import { startBackgroundDownload } from "@/src/native/background/downloader";
import { create } from "zustand";

export type JobStatus =
  | "queued"
  | "downloading"
  | "paused"
  | "completed"
  | "failed"
  | "canceled";

export type DlJob = {
  id: string;            // app-level id (we also use it as RNBD id)
  title: string;
  url: string;           // direct url used to start the task (for debugging/resume strategies)
  fileName: string;      // saved file name in app docs dir
  progress01: number;    // 0..1
  status: JobStatus;
  localUri?: string;     // file:///... after completion
  mime?: string;
  headers?: Record<string, string>;
  // RNBD task ref (any because library ships no TS types)
  task?: any;
  // optional backend/meta
  sizeBytes?: number | null;
  quality?: string | null;
  ext?: string | null;
  error?: string | null;
};

type DownloadsState = {
  jobs: Record<string, DlJob>;
  // commands
  start: (args: {
    id: string;
    title: string;
    url: string;
    fileName: string;
    headers?: Record<string, string>;
    mime?: string;
    sizeBytes?: number | null;
    quality?: string | null;
    ext?: string | null;
  }) => Promise<void>;
  pause: (id: string) => void;
  resume: (id: string) => void;
  cancel: (id: string) => void;
  // lifecycle updates
  updateProgress: (id: string, p01: number) => void;
  markCompleted: (id: string, localPath: string) => void;
  markFailed: (id: string, reason: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useDownloads = create<DownloadsState>((set, get) => ({
  jobs: {},

  start: async ({
    id,
    title,
    url,
    fileName,
    headers,
    mime,
    sizeBytes = null,
    quality = null,
    ext = null,
  }) => {
    // Create initial job
    set((s) => ({
      jobs: {
        ...s.jobs,
        [id]: {
          id,
          title,
          url,
          fileName,
          headers,
          mime,
          sizeBytes,
          quality,
          ext,
          progress01: 0,
          status: "downloading",
        },
      },
    }));

    // Start RNBD task and wire events to store
    const task = startBackgroundDownload(
      { id, url, fileName, headers },
      {
        onProgress: (p) => get().updateProgress(id, p),
        onDone: (localPath) => get().markCompleted(id, localPath),
        onError: (e) => get().markFailed(id, String(e)),
      }
    );

    // Save the task handle for pause/resume/cancel
    set((s) => ({
      jobs: {
        ...s.jobs,
        [id]: { ...s.jobs[id], task },
      },
    }));
  },

  pause: (id) => {
    const job = get().jobs[id];
    job?.task?.pause?.();
    set((s) => ({
      jobs: { ...s.jobs, [id]: { ...s.jobs[id], status: "paused" } },
    }));
  },

  resume: (id) => {
    const job = get().jobs[id];
    job?.task?.resume?.();
    set((s) => ({
      jobs: { ...s.jobs, [id]: { ...s.jobs[id], status: "downloading" } },
    }));
  },

  cancel: (id) => {
    const job = get().jobs[id];
    job?.task?.stop?.(); // cancels
    set((s) => ({
      jobs: { ...s.jobs, [id]: { ...s.jobs[id], status: "canceled" } },
    }));
  },

  updateProgress: (id, p01) =>
    set((s) => ({
      jobs: {
        ...s.jobs,
        [id]: { ...s.jobs[id], progress01: p01, status: "downloading" },
      },
    })),

  markCompleted: (id, localPath) =>
    set((s) => ({
      jobs: {
        ...s.jobs,
        [id]: {
          ...s.jobs[id],
          status: "completed",
          progress01: 1,
          localUri: localPath,
          error: undefined,
        },
      },
    })),

  markFailed: (id, reason) =>
    set((s) => ({
      jobs: {
        ...s.jobs,
        [id]: { ...s.jobs[id], status: "failed", error: reason },
      },
    })),

  remove: (id) =>
    set((s) => {
      const next = { ...s.jobs };
      delete next[id];
      return { jobs: next };
    }),

  clear: () => set({ jobs: {} }),
}));
