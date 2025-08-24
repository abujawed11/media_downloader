import { create } from "zustand";

type State = {
  defaultFormat: "360p" | "720p" | "1080p" | "mp3";
  autoMp3: boolean;
  downloadPath?: string;
  set: <K extends keyof State>(key: K, value: State[K]) => void;
};

export const useSettings = create<State>((set) => ({
  defaultFormat: "720p",
  autoMp3: false,
  downloadPath: undefined,
  set: (key, value) => set(() => ({ [key]: value } as any)),
}));
