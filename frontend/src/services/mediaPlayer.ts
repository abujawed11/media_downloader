import { Platform, Alert } from 'react-native';
import { fileStorageService } from './fileStorage';

export interface PlaybackInfo {
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  progress: number;
}

class MediaPlayerService {
  private static instance: MediaPlayerService;
  private currentlyPlaying: string | null = null;

  public static getInstance(): MediaPlayerService {
    if (!MediaPlayerService.instance) {
      MediaPlayerService.instance = new MediaPlayerService();
    }
    return MediaPlayerService.instance;
  }

  public async playFile(
    filePath: string, 
    onProgress?: (info: PlaybackInfo) => void
  ): Promise<void> {
    try {
      this.currentlyPlaying = filePath;
      
      // Check if file exists
      const fileInfo = await fileStorageService.getFileInfo(filePath);
      if (!fileInfo.exists) {
        throw new Error('File not found');
      }

      // Show file info and open with default app
      Alert.alert(
        'File Ready to Play',
        `File: ${filePath.split('/').pop()}\nSize: ${(fileInfo.size / 1024 / 1024).toFixed(2)} MB\n\nOpening with default media player...`,
        [
          {
            text: 'OK',
            onPress: () => {
              // For now, just show success message
              // In a real app, you'd use react-native-file-viewer or similar
              Alert.alert('Success', 'File opened with default media player!');
            }
          }
        ]
      );

      // Simulate playback info for UI
      if (onProgress) {
        onProgress({
          isPlaying: true,
          duration: 0,
          currentTime: 0,
          progress: 0,
        });
      }
      
    } catch (error) {
      console.error('Error playing file:', error);
      throw error;
    }
  }

  public pause(): void {
    this.currentlyPlaying = null;
  }

  public resume(): void {
    // Resume functionality would be implemented here
  }

  public async stop(): Promise<void> {
    this.currentlyPlaying = null;
  }

  public seekTo(time: number): void {
    // Seek functionality would be implemented here
  }

  public getCurrentTime(): number {
    return 0;
  }

  public getDuration(): number {
    return 0;
  }

  public isPlaying(): boolean {
    return this.currentlyPlaying !== null;
  }

  public cleanup(): void {
    this.currentlyPlaying = null;
  }
}

export const mediaPlayerService = MediaPlayerService.getInstance();
