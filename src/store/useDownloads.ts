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
// import { startBackgroundDownload } from "@/src/native/background/downloader";
// import { create } from "zustand";

// export type JobStatus =
//   | "queued"
//   | "downloading"
//   | "paused"
//   | "completed"
//   | "failed"
//   | "canceled";

// export type DlJob = {
//   id: string;            // app-level id (we also use it as RNBD id)
//   title: string;
//   url: string;           // direct url used to start the task (for debugging/resume strategies)
//   fileName: string;      // saved file name in app docs dir
//   progress01: number;    // 0..1
//   status: JobStatus;
//   localUri?: string;     // file:///... after completion
//   mime?: string;
//   headers?: Record<string, string>;
//   // RNBD task ref (any because library ships no TS types)
//   task?: any;
//   // optional backend/meta
//   sizeBytes?: number | null;
//   quality?: string | null;
//   ext?: string | null;
//   error?: string | null;
// };

// type DownloadsState = {
//   jobs: Record<string, DlJob>;
//   // commands
//   start: (args: {
//     id: string;
//     title: string;
//     url: string;
//     fileName: string;
//     headers?: Record<string, string>;
//     mime?: string;
//     sizeBytes?: number | null;
//     quality?: string | null;
//     ext?: string | null;
//   }) => Promise<void>;
//   pause: (id: string) => void;
//   resume: (id: string) => void;
//   cancel: (id: string) => void;
//   // lifecycle updates
//   updateProgress: (id: string, p01: number) => void;
//   markCompleted: (id: string, localPath: string) => void;
//   markFailed: (id: string, reason: string) => void;
//   remove: (id: string) => void;
//   clear: () => void;
// };

// export const useDownloads = create<DownloadsState>((set, get) => ({
//   jobs: {},

//   start: async ({
//     id,
//     title,
//     url,
//     fileName,
//     headers,
//     mime,
//     sizeBytes = null,
//     quality = null,
//     ext = null,
//   }) => {
//     // Create initial job
//     set((s) => ({
//       jobs: {
//         ...s.jobs,
//         [id]: {
//           id,
//           title,
//           url,
//           fileName,
//           headers,
//           mime,
//           sizeBytes,
//           quality,
//           ext,
//           progress01: 0,
//           status: "downloading",
//         },
//       },
//     }));

//     // Start RNBD task and wire events to store
//     const task = startBackgroundDownload(
//       { id, url, fileName, headers },
//       {
//         onProgress: (p) => get().updateProgress(id, p),
//         onDone: (localPath) => get().markCompleted(id, localPath),
//         onError: (e) => get().markFailed(id, String(e)),
//       }
//     );

//     // Save the task handle for pause/resume/cancel
//     set((s) => ({
//       jobs: {
//         ...s.jobs,
//         [id]: { ...s.jobs[id], task },
//       },
//     }));
//   },

//   pause: (id) => {
//     const job = get().jobs[id];
//     job?.task?.pause?.();
//     set((s) => ({
//       jobs: { ...s.jobs, [id]: { ...s.jobs[id], status: "paused" } },
//     }));
//   },

//   resume: (id) => {
//     const job = get().jobs[id];
//     job?.task?.resume?.();
//     set((s) => ({
//       jobs: { ...s.jobs, [id]: { ...s.jobs[id], status: "downloading" } },
//     }));
//   },

//   cancel: (id) => {
//     const job = get().jobs[id];
//     job?.task?.stop?.(); // cancels
//     set((s) => ({
//       jobs: { ...s.jobs, [id]: { ...s.jobs[id], status: "canceled" } },
//     }));
//   },

//   updateProgress: (id, p01) =>
//     set((s) => ({
//       jobs: {
//         ...s.jobs,
//         [id]: { ...s.jobs[id], progress01: p01, status: "downloading" },
//       },
//     })),

//   markCompleted: (id, localPath) =>
//     set((s) => ({
//       jobs: {
//         ...s.jobs,
//         [id]: {
//           ...s.jobs[id],
//           status: "completed",
//           progress01: 1,
//           localUri: localPath,
//           error: undefined,
//         },
//       },
//     })),

//   markFailed: (id, reason) =>
//     set((s) => ({
//       jobs: {
//         ...s.jobs,
//         [id]: { ...s.jobs[id], status: "failed", error: reason },
//       },
//     })),

//   remove: (id) =>
//     set((s) => {
//       const next = { ...s.jobs };
//       delete next[id];
//       return { jobs: next };
//     }),

//   clear: () => set({ jobs: {} }),
// }));



// src/store/useDownloads.ts
// import { create } from "zustand";

// export type JobStatus = "queued" | "downloading" | "paused" | "completed" | "failed" | "canceled";

// export type NativeTask = {
//   pause?: () => void;
//   resume?: () => void;
//   stop?: () => void;
// } | null;

// export interface NativeJob {
//   id: string;
//   title?: string;
//   fileName: string;
//   quality?: string;
//   ext?: string;
//   sizeBytes?: number | null;     // total size if known
//   progress01: number;            // 0..1
//   status: JobStatus;
//   localUri?: string;             // file:///... path after completion
//   mime?: string;
//   error?: string | null;
//   task?: NativeTask;
// }

// type Store = {
//   jobs: Record<string, NativeJob>;
//   addNativeJob: (j: Omit<NativeJob, "progress01" | "status"> & Partial<Pick<NativeJob, "progress01" | "status">>) => void;
//   attachTask: (id: string, task: NativeTask) => void;
//   update: (id: string, patch: Partial<NativeJob>) => void;
//   updateProgress: (id: string, p01: number, sizeBytes?: number) => void;
//   markCompleted: (id: string, localUri: string) => void;
//   markFailed: (id: string, error: string) => void;
//   pause: (id: string) => Promise<void>;
//   resume: (id: string) => Promise<void>;
//   cancel: (id: string) => Promise<void>;
//   clear: () => void;
// };

// export const useDownloads = create<Store>((set, get) => ({
//   jobs: {},

//   addNativeJob: (j) =>
//     set((s) => {
//       const job: NativeJob = {
//         progress01: j.progress01 ?? 0,
//         status: j.status ?? "queued",
//         ...j,
//       } as NativeJob;
//       // dev log
//       if (__DEV__) console.log("[DL] addNativeJob", job.id, job.fileName);
//       return { jobs: { ...s.jobs, [job.id]: job } };
//     }),

//   attachTask: (id, task) =>
//     set((s) => {
//       const cur = s.jobs[id];
//       if (!cur) return s;
//       return { jobs: { ...s.jobs, [id]: { ...cur, task } } };
//     }),

//   update: (id, patch) =>
//     set((s) => {
//       const cur = s.jobs[id];
//       if (!cur) return s;
//       const next = { ...cur, ...patch };
//       if (__DEV__) console.log("[DL] update", id, patch);
//       return { jobs: { ...s.jobs, [id]: next } };
//     }),

//   updateProgress: (id, p01, sizeBytes) =>
//     set((s) => {
//       const cur = s.jobs[id];
//       if (!cur) return s;
//       const next: NativeJob = {
//         ...cur,
//         status: "downloading",
//         progress01: p01,
//         sizeBytes: sizeBytes ?? cur.sizeBytes,
//       };
//       return { jobs: { ...s.jobs, [id]: next } };
//     }),

//   markCompleted: (id, localUri) =>
//     set((s) => {
//       const cur = s.jobs[id];
//       if (!cur) return s;
//       if (__DEV__) console.log("[DL] completed", id, localUri);
//       return {
//         jobs: {
//           ...s.jobs,
//           [id]: { ...cur, status: "completed", progress01: 1, localUri },
//         },
//       };
//     }),

//   markFailed: (id, error) =>
//     set((s) => {
//       const cur = s.jobs[id];
//       if (!cur) return s;
//       if (__DEV__) console.log("[DL] failed", id, error);
//       return { jobs: { ...s.jobs, [id]: { ...cur, status: "failed", error } } };
//     }),

//   pause: async (id) => {
//     const t = get().jobs[id]?.task;
//     t?.pause?.();
//     get().update(id, { status: "paused" });
//   },

//   resume: async (id) => {
//     const t = get().jobs[id]?.task;
//     t?.resume?.();
//     get().update(id, { status: "downloading" });
//   },

//   cancel: async (id) => {
//     const t = get().jobs[id]?.task;
//     t?.stop?.();
//     get().update(id, { status: "canceled" });
//   },

//   clear: () => set({ jobs: {} }),
// }));



// // src/store/useDownloads.ts
// import { API_URL } from "@/src/config/env";
// import { startBackgroundDownload } from "@/src/native/background/downloader";
// import { listJobs, type Job as ServerJob } from "@/src/services/api/media";
// import { create } from "zustand";

// // --- types the UI already uses ---
// export type JobStatus =
//   | "queued" | "downloading" | "paused" | "canceled"
//   | "completed" | "failed"; // <- UI-friendly status set

// export type DLCard = {
//   id: string;
//   title?: string | null;
//   ext?: string | null;
//   fileName?: string | null;
//   quality?: string | null;
//   status: JobStatus;
//   progress01?: number;       // 0..1
//   sizeBytes?: number | null;
//   localUri?: string;         // file:// path when pulled to device
//   mime?: string | null;
//   error?: string | null;
// };


// type DownloadsState = {
//   jobs: Record<string, DLCard>;

//   // actions used below
//   setFromServer: (j: ServerJob) => void;
//   updateProgress: (id: string, p01: number, totalBytes?: number) => void;
//   markLocalReady: (id: string, localPath: string, mime?: string) => void;
//   markFailed: (id: string, err: any) => void;
//   markCompleted: (id: string, localUri: string) => void;

//   // poller
//   syncServerJobsToDevice: () => Promise<void>;
// };

// function sanitizeFileName(s: string) {
//   return (s || "download").replace(/[^\w\-. ]+/g, "_");
// }

// function mapServerStatus(s: ServerJob["status"]): JobStatus {
//   switch (s) {
//     case "done": return "completed";
//     case "error": return "failed";
//     default: return s as any; // queued/downloading/paused/merging/canceled
//   }
// }

// export const useDownloads = create<DownloadsState>((set, get) => ({
//   jobs: {},

//   setFromServer: (j) => {
//     set((state) => {
//       const prev = state.jobs[j.id] || {};
//       const status = mapServerStatus(j.status);
//       const fileName =
//         j.filename?.split("/").pop() ||
//         (j.title ? `${sanitizeFileName(j.title)}.${j.ext || "mp4"}` : prev.fileName) ||
//         prev.fileName ||
//         null;

//       state.jobs[j.id] = {
//         id: j.id,
//         title: j.title,
//         ext: j.ext,
//         fileName,
//         status,
//         progress01: typeof j.progress === "number" ? j.progress : prev.progress01 || 0,
//         sizeBytes: j.total_bytes ?? prev.sizeBytes ?? null,
//         localUri: prev.localUri, // stays until we download locally
//         mime: prev.mime ?? (j.ext ? `video/${j.ext}` : null),
//         error: j.error || null,
//       };
//       return state;
//     });
//   },

//   updateProgress: (id, p01, totalBytes) =>
//     set((state) => {
//       const card = state.jobs[id];
//       if (!card) return state;
//       state.jobs[id] = {
//         ...card,
//         progress01: p01,
//         sizeBytes: totalBytes ?? card.sizeBytes ?? null,
//         status: p01 >= 1 ? "completed" : card.status,
//       };
//       return state;
//     }),

//   markLocalReady: (id, localPath, mime) =>
//     set((state) => {
//       const card = state.jobs[id];
//       if (!card) return state;
//       state.jobs[id] = { ...card, localUri: localPath, mime: mime || card.mime, status: "completed", progress01: 1 };
//       return state;
//     }),

//   markFailed: (id, err) =>
//     set((state) => {
//       const card = state.jobs[id];
//       if (!card) return state;
//       state.jobs[id] = { ...card, status: "failed", error: String(err) };
//       return state;
//     }),


//   markCompleted: (id, localUri) =>
//     set((s) => {
//       const cur = s.jobs[id];
//       if (!cur) return s;
//       if (__DEV__) console.log("[DL] completed", id, localUri);
//       return {
//         jobs: {
//           ...s.jobs,
//           [id]: { ...cur, status: "completed", progress01: 1, localUri },
//         },
//       };
//     }),

//   // --- THIS is the function you pasted ---
//   syncServerJobsToDevice: async () => {
//     const jobs = await listJobs();

//     // First: mirror server status to cards
//     for (const j of jobs) {
//       get().setFromServer(j);
//     }

//     // Then: for any server-done job not yet pulled to device, start RNBD
//     for (const j of jobs) {
//       const inStore = get().jobs[j.id];
//       if (j.status === "done" && !inStore?.localUri) {
//         const fileName =
//           j.filename?.split("/").pop() ||
//           `${sanitizeFileName(j.title || "video")}.${j.ext || "mp4"}`;

//         startBackgroundDownload(
//           {
//             id: `job-${j.id}`,
//             url: `${API_URL}/media/jobs/${j.id}/file`,
//             fileName,
//             headers: {}, // add auth if you need it
//           },
//           {
//             onBegin: (bytes) => get().updateProgress(j.id, 0, bytes || undefined),
//             onProgress: (p01) => get().updateProgress(j.id, p01, undefined),
//             onDone: (localPath) =>
//               get().markLocalReady(j.id, localPath, j.ext ? `video/${j.ext}` : undefined),
//             onError: (err) => get().markFailed(j.id, err),
//           }
//         );
//       }
//     }
//   },
// }));



// src/store/useDownloads.ts
// import { API_URL } from "@/src/config/env";
// import { startBackgroundDownload } from "@/src/native/background/downloader";
// import { listJobs, type Job as ServerJob } from "@/src/services/api/media";
// import { create } from "zustand";

// /** UI-friendly status set used by the app */
// export type JobStatus =
//   | "queued"
//   | "downloading"
//   | "paused"
//   | "canceled"
//   | "completed"
//   | "failed";

// export type DLCard = {
//   id: string;
//   title?: string | null;
//   ext?: string | null;
//   fileName?: string | null;
//   quality?: string | null;
//   status: JobStatus;
//   progress01?: number; // 0..1
//   sizeBytes?: number | null;
//   localUri?: string; // file:// path when pulled to device
//   mime?: string | null;
//   error?: string | null;
// };

// type DownloadsState = {
//   /** Cards shown in the Downloads UI, keyed by id (server id or local id) */
//   jobs: Record<string, DLCard>;

//   /** Optional map of native download tasks so we can pause/resume/cancel later */
//   nativeTasks: Record<string, any>;

//   /** ---- actions used by UI & sync code ---- */
//   addNativeJob: (card: Partial<DLCard> & { id: string }) => void;
//   update: (id: string, patch: Partial<DLCard>) => void;
//   attachTask: (id: string, task: any) => void;

//   // ⬇️ add these three
//   pause?: (id: string) => void;
//   resume?: (id: string) => void;
//   cancel?: (id: string) => void;

//   setFromServer: (j: ServerJob) => void;
//   updateProgress: (id: string, p01: number, totalBytes?: number) => void;
//   markLocalReady: (id: string, localPath: string, mime?: string) => void;
//   markFailed: (id: string, err: any) => void;
//   markCompleted: (id: string, localUri: string) => void;

//   /** Poll server jobs and, when done, pull file to device */
//   syncServerJobsToDevice: () => Promise<void>;
// };

// function sanitizeFileName(s: string) {
//   return (s || "download").replace(/[^\w\-. ]+/g, "_");
// }

// /** Convert API status to UI status */
// function mapServerStatus(s: ServerJob["status"]): JobStatus {
//   switch (s) {
//     case "done":
//       return "completed";
//     case "error":
//       return "failed";
//     case "merging":
//       // Treat "merging" as actively working
//       return "downloading";
//     case "queued":
//     case "downloading":
//     case "paused":
//     case "canceled":
//       return s;
//     default:
//       // Fallback to "queued" to avoid type issues if the API adds a new status
//       return "queued";
//   }
// }

// export const useDownloads = create<DownloadsState>((set, get) => ({
//   jobs: {},
//   nativeTasks: {},

//   /** Insert or upsert a local/native job card so the UI shows it immediately */
//   addNativeJob: (card) =>
//     set((state) => {
//       const prev = state.jobs[card.id] || ({} as DLCard);
//       state.jobs[card.id] = {
//         id: card.id,
//         title: card.title ?? prev.title ?? null,
//         ext: card.ext ?? prev.ext ?? null,
//         fileName: card.fileName ?? prev.fileName ?? null,
//         quality: card.quality ?? prev.quality ?? null,
//         status: card.status ?? prev.status ?? "queued",
//         progress01: card.progress01 ?? prev.progress01 ?? 0,
//         sizeBytes: card.sizeBytes ?? prev.sizeBytes ?? null,
//         localUri: card.localUri ?? prev.localUri,
//         mime: card.mime ?? prev.mime ?? null,
//         error: card.error ?? prev.error ?? null,
//       };
//       return state;
//     }),

//   /** Patch a card by id */
//   update: (id, patch) =>
//     set((state) => {
//       const cur = state.jobs[id];
//       if (!cur) return state;
//       state.jobs[id] = { ...cur, ...patch };
//       return state;
//     }),

//   /** Remember a native RN background downloader task for later controls */
//   attachTask: (id, task) =>
//     set((state) => {
//       state.nativeTasks[id] = task;
//       return state;
//     }),



//   // ⬇️ add these
//   pause: (id) =>
//     set((state) => {
//       const t = state.nativeTasks[id];
//       if (t?.pause) t.pause();
//       if (state.jobs[id]) state.jobs[id] = { ...state.jobs[id], status: "paused" };
//       return state;
//     }),

//   resume: (id) =>
//     set((state) => {
//       const t = state.nativeTasks[id];
//       if (t?.resume) t.resume();
//       if (state.jobs[id]) state.jobs[id] = { ...state.jobs[id], status: "downloading" };
//       return state;
//     }),

//   cancel: (id) =>
//     set((state) => {
//       const t = state.nativeTasks[id];
//       if (t?.cancel) t.cancel();
//       if (state.jobs[id]) state.jobs[id] = { ...state.jobs[id], status: "canceled" };
//       return state;
//     }),

//   /** Mirror a server job into a DLCard */
//   setFromServer: (j) =>
//     set((state) => {
//       const prev = state.jobs[j.id] || ({} as DLCard);
//       const status = mapServerStatus(j.status);
//       const fileName =
//         j.filename?.split("/").pop() ||
//         (j.title ? `${sanitizeFileName(j.title)}.${j.ext || "mp4"}` : prev.fileName) ||
//         prev.fileName ||
//         null;

//       state.jobs[j.id] = {
//         id: j.id,
//         title: j.title,
//         ext: j.ext,
//         fileName,
//         status,
//         progress01:
//           typeof j.progress === "number" ? j.progress : prev.progress01 ?? 0,
//         sizeBytes: j.total_bytes ?? prev.sizeBytes ?? null,
//         localUri: prev.localUri, // remains until we download locally
//         mime: prev.mime ?? (j.ext ? `video/${j.ext}` : null),
//         error: j.error || null,
//       };
//       return state;
//     }),

//   updateProgress: (id, p01, totalBytes) =>
//     set((state) => {
//       const card = state.jobs[id];
//       if (!card) return state;
//       state.jobs[id] = {
//         ...card,
//         progress01: p01,
//         sizeBytes: totalBytes ?? card.sizeBytes ?? null,
//         status: p01 >= 1 ? "completed" : card.status,
//       };
//       return state;
//     }),

//   markLocalReady: (id, localPath, mime) =>
//     set((state) => {
//       const card = state.jobs[id];
//       if (!card) return state;
//       state.jobs[id] = {
//         ...card,
//         localUri: localPath,
//         mime: mime || card.mime,
//         status: "completed",
//         progress01: 1,
//       };
//       return state;
//     }),

//   markFailed: (id, err) =>
//     set((state) => {
//       const card = state.jobs[id];
//       if (!card) return state;
//       state.jobs[id] = { ...card, status: "failed", error: String(err) };
//       return state;
//     }),

//   markCompleted: (id, localUri) =>
//     set((s) => {
//       const cur = s.jobs[id];
//       if (!cur) return s;
//       if (__DEV__) console.log("[DL] completed", id, localUri);
//       return {
//         jobs: {
//           ...s.jobs,
//           [id]: { ...cur, status: "completed", progress01: 1, localUri },
//         },
//       };
//     }),

//   /** Pull server jobs & automatically download finished ones to device */
//   syncServerJobsToDevice: async () => {
//     const jobs = await listJobs();

//     // Mirror server state into our cards first
//     for (const j of jobs) {
//       get().setFromServer(j);
//     }

//     // For any server-done job not yet on device, start a background download
//     for (const j of jobs) {
//       const inStore = get().jobs[j.id];
//       if (j.status === "done" && !inStore?.localUri) {
//         const fileName =
//           j.filename?.split("/").pop() ||
//           `${sanitizeFileName(j.title || "video")}.${j.ext || "mp4"}`;

//         const task = startBackgroundDownload(
//           {
//             id: `job-${j.id}`,
//             url: `${API_URL}/media/jobs/${j.id}/file`,
//             fileName,
//             headers: {}, // add auth if needed
//           },
//           {
//             onBegin: (bytes) => get().updateProgress(j.id, 0, bytes || undefined),
//             onProgress: (p01) => get().updateProgress(j.id, p01, undefined),
//             onDone: (localPath) =>
//               get().markLocalReady(
//                 j.id,
//                 localPath,
//                 j.ext ? `video/${j.ext}` : undefined
//               ),
//             onError: (err) => get().markFailed(j.id, err),
//           }
//         );

//         // Keep a handle in case you want controls in the UI later
//         get().attachTask(j.id, task);
//       }
//     }
//   },
// }));





// src/store/useDownloads.ts
import { API_URL } from "@/src/config/env";
import RNBackgroundDownloader from "@kesha-antonov/react-native-background-downloader";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { create } from "zustand";

export type JobStatus =
  | "queued"
  | "downloading"
  | "paused"
  | "completed"
  | "failed"
  | "canceled";

export type DlJob = {
  id: string;
  title?: string | null;
  // backend status/progress
  status: JobStatus;
  progress01: number;

  fileName?: string | null;     // <-- NEW (progressive or placeholder name)
  clientProgress01?: number;    // <-- NEW (RNBD progress for progressive/final)

  // media meta
  sizeBytes?: number | null;
  quality?: string | null;
  ext?: string | null;
  thumbnail?: string | null;

  // live backend metrics
  part?: "video" | "audio" | "merging" | "progressive";
  downloadedBytes?: number;
  totalBytes?: number | null;
  speedBps?: number | null;
  etaSeconds?: number | null;

  // after final file is downloaded to app cache:
  localUri?: string | null;
  mime?: string | null;

  // errors
  error?: string | null;

  // RNBackgroundDownloader task (for final file), opaque
  task?: any;
};

type DownloadsState = {
  jobs: Record<string, DlJob>;
  upsertJob: (j: Partial<DlJob> & { id: string }) => void;

  // NEW (used by index.tsx)
  addNativeJob: (j: {
    id: string;
    title?: string | null;
    fileName?: string | null;
    quality?: string | null;
    ext?: string | null;
    sizeBytes?: number | null;
    mime?: string | null;
    progress01?: number;
    status?: JobStatus;
  }) => void;
  update: (id: string, patch: Partial<DlJob>) => void;
  updateProgress: (id: string, p01: number) => void;
  attachTask: (id: string, task: any) => void;
  markCompleted: (id: string, tempPath?: string) => Promise<void>;
  markFailed: (id: string, message?: string) => void;     // alias for failures

  // backend updates
  setBackendJobProgress: (id: string, p01: number) => void;
  setBackendJobStatus: (id: string, raw: string) => void;
  setBackendJobMetrics: (id: string, m: Partial<DlJob>) => void;
  markJobDone: (id: string) => void;
  markJobFailed: (id: string, msg?: string) => void;

  // client-side: fetch /jobs/{id}/file and save to Downloads
  startFinalDownloadIfNeeded: (id: string) => Promise<void>;

  // controls (no-ops until server supports them)
  pause: (id: string) => void;
  resume: (id: string) => void;
  cancel: (id: string) => void;

  remove: (id: string) => void;
  clear: () => void;
};

const toUiStatus = (raw: string): JobStatus => {
  switch (raw) {
    case "finished": return "completed";
    case "failed": return "failed";
    case "merging": return "downloading";
    case "queued":
    case "downloading":
    case "paused":
    case "canceled":
      return raw as JobStatus;
    case "done": return "completed";
    case "error": return "failed";
    default: return "downloading";
  }
};

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

export const useDownloads = create<DownloadsState>((set, get) => ({
  jobs: {},



  // ===== Methods used by app/(tabs)/index.tsx =====
  addNativeJob: (j: {
    id: string;
    title?: string | null;
    fileName?: string | null;
    quality?: string | null;
    ext?: string | null;
    sizeBytes?: number | null;
    mime?: string | null;
    progress01?: number;
    status?: JobStatus;
  }) =>
    set((s) => {
      const prev = s.jobs[j.id] || {
        id: j.id,
        status: "queued" as JobStatus,
        progress01: 0,
      };
      const next: DlJob = {
        ...prev,
        title: j.title ?? prev.title,
        fileName: j.fileName ?? prev.fileName,
        quality: j.quality ?? prev.quality,
        ext: j.ext ?? prev.ext,
        sizeBytes: j.sizeBytes ?? prev.sizeBytes,
        mime: j.mime ?? prev.mime,
        progress01: clamp01(j.progress01 ?? prev.progress01 ?? 0),
        status: j.status ?? prev.status,
      };
      return { jobs: { ...s.jobs, [j.id]: next } };
    }),

  update: (id: string, patch: Partial<DlJob>) =>
    set((s) => {
      const prev = s.jobs[id] || { id, status: "queued" as JobStatus, progress01: 0 };
      const next: DlJob = { ...prev, ...patch };
      if (typeof next.progress01 === "number") next.progress01 = clamp01(next.progress01);
      if (typeof (next as any).clientProgress01 === "number") (next as any).clientProgress01 = clamp01((next as any).clientProgress01);
      return { jobs: { ...s.jobs, [id]: next } };
    }),

  updateProgress: (id: string, p01: number) =>
    set((s) => {
      const prev = s.jobs[id] || { id, status: "queued" as JobStatus, progress01: 0 };
      return { jobs: { ...s.jobs, [id]: { ...prev, status: "downloading", progress01: clamp01(p01) } } };
    }),

  attachTask: (id: string, task: any) =>
    set((s) => {
      const prev = s.jobs[id] || { id, status: "queued" as JobStatus, progress01: 0 };
      return { jobs: { ...s.jobs, [id]: { ...prev, task } } };
    }),

  // Mark a progressive/background file as completed and move to "Download" album
  markCompleted: async (id: string, tempPath?: string) => {
    const s = get();
    const prev = s.jobs[id];
    if (!prev) return;

    try {
      if (tempPath) {
        const perm = await MediaLibrary.requestPermissionsAsync();
        if (perm.granted) {
          const asset = await MediaLibrary.createAssetAsync(tempPath);
          let album = await MediaLibrary.getAlbumAsync("Download");
          if (!album) {
            album = await MediaLibrary.createAlbumAsync("Download", asset, false);
          } else {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          }
          set((st) => ({ jobs: { ...st.jobs, [id]: { ...st.jobs[id], status: "completed", progress01: 1, localUri: asset.uri } } }));
        } else {
          set((st) => ({ jobs: { ...st.jobs, [id]: { ...st.jobs[id], status: "completed", progress01: 1, error: "Storage permission denied" } } }));
        }
        return;
      }

      // No tempPath case (e.g. server-merged flow)
      set((st) => ({ jobs: { ...st.jobs, [id]: { ...st.jobs[id], status: "completed", progress01: 1 } } }));
    } catch (e: any) {
      set((st) => ({ jobs: { ...st.jobs, [id]: { ...st.jobs[id], status: "failed", error: String(e?.message || e) } } }));
    }
  },

  // Alias used by index.tsx for failures
  markFailed: (id: string, message?: string) =>
    set((s) => {
      const prev = s.jobs[id] || { id, status: "queued" as JobStatus, progress01: 0 };
      return { jobs: { ...s.jobs, [id]: { ...prev, status: "failed", error: message || "Failed" } } };
    }),



  upsertJob: (j) =>
    set((s) => ({ jobs: { ...s.jobs, [j.id]: { ...(s.jobs[j.id] || { id: j.id, status: "queued", progress01: 0 }), ...j } } })),

  setBackendJobProgress: (id, p01) =>
    set((s) => {
      const it = s.jobs[id] || { id, status: "queued", progress01: 0 };
      return { jobs: { ...s.jobs, [id]: { ...it, progress01: Math.max(0, Math.min(1, p01)) } } };
    }),

  setBackendJobStatus: (id, raw) =>
    set((s) => {
      const it = s.jobs[id] || { id, status: "queued", progress01: 0 };
      return { jobs: { ...s.jobs, [id]: { ...it, status: toUiStatus(raw) } } };
    }),

  setBackendJobMetrics: (id, m) =>
    set((s) => {
      const it = s.jobs[id] || { id, status: "queued", progress01: 0 };
      return { jobs: { ...s.jobs, [id]: { ...it, ...m } } };
    }),

  markJobDone: (id) =>
    set((s) => {
      const it = s.jobs[id] || { id, status: "queued", progress01: 0 };
      return { jobs: { ...s.jobs, [id]: { ...it, status: "completed", progress01: 1 } } };
    }),

  markJobFailed: (id, msg) =>
    set((s) => {
      const it = s.jobs[id] || { id, status: "queued", progress01: 0 };
      return { jobs: { ...s.jobs, [id]: { ...it, status: "failed", error: msg || "Failed" } } };
    }),

  startFinalDownloadIfNeeded: async (id: string) => {
    const s = get();
    const job = s.jobs[id];
    if (!job || job.localUri || job.status !== "completed") return;

    // ensure media permission so we can move file to Download album
    const perm = await MediaLibrary.requestPermissionsAsync();
    if (!perm.granted) {
      set((st) => ({ jobs: { ...st.jobs, [id]: { ...st.jobs[id], error: "Storage permission denied" } } }));
      return;
    }

    const fileUrl = `${API_URL.replace(/\/$/, "")}/media/jobs/${id}/file`;
    const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory!;
    const destPath = `${cacheDir}${id}.bin`;

    // Use RNBackgroundDownloader for resilience
    const task = RNBackgroundDownloader.download({
      id: `final-${id}`,
      url: fileUrl,
      destination: destPath,
      headers: {},
    }) as any;

    task
      .begin(() => {
        // optional: UI cue
      })
      .progress((p: number) => {
        set((st) => {
          const it = st.jobs[id];
          if (!it) return st;
          return { jobs: { ...st.jobs, [id]: { ...it, clientProgress01: Math.max(0, Math.min(1, p)) } } };
        });
      })
      .done(async () => {
        try {
          const asset = await MediaLibrary.createAssetAsync(destPath);
          let album = await MediaLibrary.getAlbumAsync("Download");
          if (!album) {
            album = await MediaLibrary.createAlbumAsync("Download", asset, false);
          } else {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          }
          set((st) => ({ jobs: { ...st.jobs, [id]: { ...st.jobs[id], localUri: asset.uri } } }));
        } catch (e: any) {
          set((st) => ({ jobs: { ...st.jobs, [id]: { ...st.jobs[id], error: String(e?.message || e) } } }));
        }
      })
      .error((e: any) => {
        set((st) => ({ jobs: { ...st.jobs, [id]: { ...st.jobs[id], error: String(e?.message || e) } } }));
      });

    set((st) => ({ jobs: { ...st.jobs, [id]: { ...st.jobs[id], task } } }));
    // const task = RNBackgroundDownloader.download({
    //   id: `final-${id}`,
    //   url: fileUrl,
    //   destination: destPath,
    //   headers: {}, // add auth headers here if needed
    // }).begin(() => {
    //   // optional: update UI that we started final client download
    // }).progress((p: number) => {
    //   // client-side final download progress (separate from backend p01)
    //   set((st) => {
    //     const it = st.jobs[id]; if (!it) return st as any;
    //     return { jobs: { ...st.jobs, [id]: { ...it, clientProgress01: p } } } as any;
    //   });
    // }).done(async () => {
    //   try {
    //     // Move into user-visible "Download" album
    //     const asset = await MediaLibrary.createAssetAsync(destPath);
    //     let album = await MediaLibrary.getAlbumAsync("Download");
    //     if (!album) {
    //       album = await MediaLibrary.createAlbumAsync("Download", asset, false);
    //     } else {
    //       await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    //     }

    //     // Save localUri for "Open" action
    //     set((st) => ({ jobs: { ...st.jobs, [id]: { ...st.jobs[id], localUri: asset.uri } } }));
    //   } catch (e: any) {
    //     set((st) => ({ jobs: { ...st.jobs, [id]: { ...st.jobs[id], error: String(e?.message || e) } } }));
    //   }
    // }).error((e: any) => {
    //   set((st) => ({ jobs: { ...st.jobs, [id]: { ...st.jobs[id], error: String(e?.message || e) } } }));
    // });

    // set((st) => ({ jobs: { ...st.jobs, [id]: { ...st.jobs[id], task } } }));
  },

  pause: (_id) => { /* wire server/client pause as needed */ },
  resume: (_id) => { /* wire server/client resume as needed */ },
  cancel: (_id) => { /* wire server/client cancel as needed */ },

  remove: (id) => set((s) => {
    const next = { ...s.jobs }; delete next[id]; return { jobs: next };
  }),
  clear: () => set({ jobs: {} }),
}));
