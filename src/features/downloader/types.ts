export type FormatOption = {
  format_id?: string | null;     // present for single-itag formats
  format_string: string;         // "18" or "137+140"  <-- IMPORTANT
  label: string;                 // "720p mp4", "Audio m4a", etc.
  ext?: string | null;           // "mp4" | "webm" | "m4a" | ...
  filesize?: string;             // human readable file size from server
};

export type InfoResponse = {
  title: string;
  thumbnail?: string | null;
  duration?: number | null;      // seconds
  formats: FormatOption[];
};
