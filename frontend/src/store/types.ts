export interface Download {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  platform: string;
  format: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'paused';
  filePath?: string;
  createdAt: Date;
}

export interface VideoFormat {
  format_id: string;
  quality: string;
  ext: string;
  filesize?: number;
}

export interface MediaMetadata {
  url: string;
  title: string;
  thumbnail: string;
  platform: string;
  formats: VideoFormat[];
}



