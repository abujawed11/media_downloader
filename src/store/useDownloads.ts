import { create } from "zustand";

type Item = {
  id: string;
  url: string;
  title?: string;
  progress: number; // 0..1
  status: "queued" | "downloading" | "paused" | "completed" | "failed" | "canceled";
};

type State = {
  items: Item[];
  add: (i: Item) => void;
  update: (id: string, patch: Partial<Item>) => void;
};

export const useDownloads = create<State>((set) => ({
  items: [],
  add: (i) => set((s) => ({ items: [i, ...s.items] })),
  update: (id, patch) =>
    set((s) => ({ items: s.items.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
}));
