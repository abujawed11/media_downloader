export type FormatOption = {
  itag?: string | null;          // present for single-itag formats
  format_string: string;         // "18" or "137+140"  <-- IMPORTANT
  label: string;                 // "720p mp4", "Audio m4a", etc.
  ext: string;                   // "mp4" | "webm" | "m4a" | ...
  note?: string | null;          // "video+audio", etc.
  sizeBytes?: number | null;     // if available
};

export type InfoResponse = {
  title: string;
  thumbnail?: string | null;
  duration?: number | null;      // seconds
  formats: FormatOption[];
};
