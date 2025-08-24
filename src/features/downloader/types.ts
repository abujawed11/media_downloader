export type FormatOption = {
  itag: string;
  label: string;
  ext: string;
  note?: string;
  sizeBytes?: number;
};

export type InfoResponse = {
  title: string;
  thumbnail: string;
  duration?: number | null;
  formats: FormatOption[];
};
