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
import { create } from "zustand";

export type DownloadStatus =
  | "queued"
  | "downloading"
  | "paused"
  | "completed"
  | "failed"
  | "canceled";

export type Item = {
  id: string;
  url: string;
  title?: string;
  progress: number;                // 0..1
  status: DownloadStatus;

  // Optional metadata for the card:
  sizeBytes?: number | null;
  quality?: string;                // e.g., "720p mp4 (merge)"
  ext?: string | null;             // "mp4", "webm", ...
  thumbnail?: string | null;

  // Live stats coming from the backend:
  speed_bps?: number;              // bytes/sec
  eta_seconds?: number;            // seconds
  downloaded_bytes?: number;
  total_bytes?: number | null;

  // After done:
  filename?: string | null;

  // If failed:
  error?: string | null;
};

type State = {
  items: Item[];
  add: (i: Item) => void;
  update: (id: string, patch: Partial<Item>) => void;
  remove?: (id: string) => void;
  clear?: () => void;
};

export const useDownloads = create<State>((set) => ({
  items: [],
  add: (i) => set((s) => ({ items: [i, ...s.items] })),
  update: (id, patch) =>
    set((s) => ({
      items: s.items.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    })),
  remove: (id) =>
    set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
  clear: () => set({ items: [] }),
}));
