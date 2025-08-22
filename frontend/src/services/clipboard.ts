import Clipboard from '@react-native-clipboard/clipboard';

export class ClipboardService {
  static async getClipboardContent(): Promise<string> {
    try {
      const content = await Clipboard.getString();
      return content;
    } catch (error) {
      console.error('Error getting clipboard content:', error);
      return '';
    }
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isSupportedPlatform(url: string): boolean {
    const supportedDomains = [
      'youtube.com',
      'youtu.be',
      'instagram.com',
      'tiktok.com',
      'twitter.com',
      'facebook.com',
      'fb.com',
    ];

    try {
      const urlObj = new URL(url);
      return supportedDomains.some(domain => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  }
}
