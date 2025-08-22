import { MediaMetadata } from '../store/types';

export class ApiService {
  static async getMediaInfo(url: string): Promise<MediaMetadata> {
    try {
      // Extract video ID from YouTube URL
      const videoId = this.extractYouTubeVideoId(url);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      // Use a public YouTube info API (for development)
      const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch video info');
      }

      const data = await response.json();
      
      // Return structured data for your app
      return {
        url: url, // Original URL
        title: data.title || 'Unknown Title',
        thumbnail: data.thumbnail_url || 'https://via.placeholder.com/300x200',
        platform: 'youtube',
        formats: [
          {
            format_id: '1',
            quality: '1080p',
            ext: 'mp4',
            filesize: 50000000,
          },
          {
            format_id: '2', 
            quality: '720p',
            ext: 'mp4',
            filesize: 30000000,
          },
          {
            format_id: '3',
            quality: '480p',
            ext: 'mp4',
            filesize: 15000000,
          },
        ],
      };
    } catch (error) {
      console.error('Error fetching media info:', error);
      
      // Fallback to mock data for development
      console.warn('Using mock data for development');
      return {
        url: url, // Keep the original URL
        title: 'Sample Video Title (Mock)',
        thumbnail: 'https://via.placeholder.com/300x200',
        platform: 'youtube',
        formats: [
          {
            format_id: '1',
            quality: '1080p',
            ext: 'mp4',
            filesize: 50000000,
          },
          {
            format_id: '2',
            quality: '720p',
            ext: 'mp4',
            filesize: 30000000,
          },
          {
            format_id: '3',
            quality: '480p',
            ext: 'mp4',
            filesize: 15000000,
          },
        ],
      };
    }
  }

  private static extractYouTubeVideoId(url: string): string | null {
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }
}
