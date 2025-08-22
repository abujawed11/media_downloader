import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

export interface FileInfo {
  path: string;
  size: number;
  exists: boolean;
}

class FileStorageService {
  private static instance: FileStorageService;
  private downloadDir: string;

  private constructor() {
    // Set download directory based on platform
    if (Platform.OS === 'android') {
      this.downloadDir = `${RNFS.DownloadDirectoryPath}/MediaDownloader`;
    } else {
      this.downloadDir = `${RNFS.DocumentDirectoryPath}/MediaDownloader`;
    }
    this.ensureDownloadDir();
  }

  public static getInstance(): FileStorageService {
    if (!FileStorageService.instance) {
      FileStorageService.instance = new FileStorageService();
    }
    return FileStorageService.instance;
  }

  private async ensureDownloadDir(): Promise<void> {
    try {
      const exists = await RNFS.exists(this.downloadDir);
      if (!exists) {
        await RNFS.mkdir(this.downloadDir);
      }
    } catch (error) {
      console.error('Error creating download directory:', error);
    }
  }

  public async downloadFile(
    url: string, 
    filename: string, 
    onProgress?: (progress: number) => void
  ): Promise<string> {
    await this.ensureDownloadDir();
    
    const filePath = `${this.downloadDir}/${filename}`;
    
    const options = {
      fromUrl: url,
      toFile: filePath,
      background: true,
      discretionary: true,
      progress: (res: any) => {
        if (onProgress && res.bytesWritten && res.contentLength) {
          const progress = (res.bytesWritten / res.contentLength) * 100;
          onProgress(Math.floor(progress));
        }
      },
    };

    try {
      const result = await RNFS.downloadFile(options).promise;
      if (result.statusCode === 200) {
        return filePath;
      } else {
        throw new Error(`Download failed with status: ${result.statusCode}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  public async getFileInfo(filePath: string): Promise<FileInfo> {
    try {
      const exists = await RNFS.exists(filePath);
      if (!exists) {
        return { path: filePath, size: 0, exists: false };
      }
      
      const stats = await RNFS.stat(filePath);
      return {
        path: filePath,
        size: stats.size,
        exists: true,
      };
    } catch (error) {
      console.error('Error getting file info:', error);
      return { path: filePath, size: 0, exists: false };
    }
  }

  public async deleteFile(filePath: string): Promise<boolean> {
    try {
      const exists = await RNFS.exists(filePath);
      if (exists) {
        await RNFS.unlink(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  public async listDownloadedFiles(): Promise<string[]> {
    try {
      await this.ensureDownloadDir();
      const files = await RNFS.readDir(this.downloadDir);
      return files
        .filter(file => file.isFile())
        .map(file => file.path);
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  public getDownloadDir(): string {
    return this.downloadDir;
  }
}

export const fileStorageService = FileStorageService.getInstance();
