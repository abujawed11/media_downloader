import { create } from 'zustand';
import { Download, MediaMetadata } from './types';

interface DownloadStore {
  downloads: Download[];
  activeDownloads: string[];
  currentMediaInfo: MediaMetadata | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addDownload: (download: Omit<Download, 'id' | 'createdAt'>) => void;
  updateDownload: (id: string, updates: Partial<Download>) => void;
  removeDownload: (id: string) => void;
  setCurrentMediaInfo: (mediaInfo: MediaMetadata | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Simple state actions (no service calls)
  markAsStarted: (id: string) => void;
  markAsPaused: (id: string) => void;
  markAsResumed: (id: string) => void;
  markAsCancelled: (id: string) => void;
}

export const useDownloadStore = create<DownloadStore>((set, get) => ({
  downloads: [],
  activeDownloads: [],
  currentMediaInfo: null,
  isLoading: false,
  error: null,
  
  addDownload: (download) => {
    const newDownload: Download = {
      ...download,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    
    set((state) => ({
      downloads: [...state.downloads, newDownload],
    }));

    // Auto-start download after a short delay
    setTimeout(() => {
      const { downloadService } = require('../services/downloadService');
      downloadService.startDownload(newDownload.id);
    }, 1000); // Reduced from 2000ms to 1000ms for faster start
  },
  
  updateDownload: (id, updates) =>
    set((state) => ({
      downloads: state.downloads.map((download) =>
        download.id === id ? { ...download, ...updates } : download
      ),
    })),
  
  removeDownload: (id) =>
    set((state) => ({
      downloads: state.downloads.filter((download) => download.id !== id),
      activeDownloads: state.activeDownloads.filter((downloadId) => downloadId !== id),
    })),

  markAsStarted: (id) =>
    set((state) => ({
      activeDownloads: [...state.activeDownloads.filter(aid => aid !== id), id],
    })),

  markAsPaused: (id) =>
    set((state) => ({
      activeDownloads: state.activeDownloads.filter((downloadId) => downloadId !== id),
    })),

  markAsResumed: (id) =>
    set((state) => ({
      activeDownloads: [...state.activeDownloads.filter(aid => aid !== id), id],
    })),

  markAsCancelled: (id) =>
    set((state) => ({
      downloads: state.downloads.filter((download) => download.id !== id),
      activeDownloads: state.activeDownloads.filter((downloadId) => downloadId !== id),
    })),

  setCurrentMediaInfo: (mediaInfo) => set({ currentMediaInfo: mediaInfo }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error: error }),
}));
