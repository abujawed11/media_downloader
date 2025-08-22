# Media Downloader App

A comprehensive personal media downloader app built with React Native and FastAPI, featuring a system-wide floating bubble for quick downloads.

## Features

### Core Features
- 📱 **Cross-platform React Native app** (Android/iOS)
- 🎬 **Multi-platform support**: YouTube, Instagram, Facebook, Twitter, TikTok, and more
- 📋 **Clipboard integration**: Auto-detect URLs from clipboard
- 🎯 **Quality selection**: Choose from 360p, 720p, 1080p, or audio-only (MP3)
- 📊 **Download progress tracking** with pause/resume/cancel functionality
- 📁 **Organized downloads** by platform and channel
- ⚙️ **Customizable settings** for quality, paths, and preferences

### Special Feature: Floating Bubble
- 🟡 **System-wide floating button** (like Messenger Chat Head)
- 👆 **Single tap**: Auto-fetch clipboard URL and start download
- ✋ **Long press**: Open the full app
- 🎯 **Smart auto-download** with preferred quality settings

## Architecture

### Frontend (React Native)
- **Framework**: Bare React Native with TypeScript
- **Styling**: NativeWind (TailwindCSS)
- **Navigation**: React Navigation (Stack + Tabs)
- **State Management**: Zustand with AsyncStorage persistence
- **UI Theme**: Black + Yellow (#FAD90E) design

### Backend (FastAPI)
- **Framework**: FastAPI with Python 3.11+
- **Media Processing**: yt-dlp for extraction and downloading
- **File Handling**: Streaming downloads with progress tracking
- **Audio Conversion**: FFmpeg integration for MP3 conversion

## Project Structure

```
mediadownloader/
├── frontend/                 # React Native app
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   └── FloatingBubble.tsx
│   │   ├── navigation/      # App navigation setup
│   │   │   └── AppNavigator.tsx
│   │   ├── screens/         # Main app screens
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── DownloadsScreen.tsx
│   │   │   └── SettingsScreen.tsx
│   │   ├── services/        # API communication
│   │   │   └── apiService.ts
│   │   ├── store/           # State management
│   │   │   └── useDownloadStore.ts
│   │   ├── types/           # TypeScript definitions
│   │   │   └── index.ts
│   │   └── utils/           # Utility functions
│   ├── android/             # Android-specific code
│   └── ios/                 # iOS-specific code
└── backend/                 # FastAPI backend
    ├── main.py             # Main FastAPI application
    ├── requirements.txt    # Python dependencies
    ├── Dockerfile          # Docker configuration
    └── downloads/          # Downloaded files storage
```

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- FFmpeg (for audio conversion)
- Android Studio (for Android development)
- Xcode (for iOS development)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install FFmpeg:**
   - **Windows**: Download from https://ffmpeg.org/download.html
   - **macOS**: `brew install ffmpeg`
   - **Ubuntu/Debian**: `sudo apt install ffmpeg`

4. **Start the backend server:**
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install native dependencies (for Android):**
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

4. **Start Metro bundler:**
   ```bash
   npm start
   ```

5. **Run on Android:**
   ```bash
   npm run android
   ```

6. **Run on iOS:**
   ```bash
   npm run ios
   ```

## Usage

### Main App
1. **Home Screen**: Paste or enter media URLs and select download quality
2. **Downloads Screen**: Monitor progress, manage downloads, and access files
3. **Settings Screen**: Configure default quality, download paths, and app preferences

### Floating Bubble
1. Enable floating bubble in Settings
2. Grant SYSTEM_ALERT_WINDOW permission when prompted
3. The yellow floating button will appear system-wide
4. **Single tap**: Downloads currently copied URL
5. **Long press**: Opens the main app

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Key Endpoints

- `POST /info` - Extract media information from URL
- `POST /download` - Start media download
- `GET /download/{id}/status` - Get download progress
- `GET /download/{id}/file` - Download completed file
- `GET /downloads` - List all downloads

## Supported Platforms

- YouTube (youtube.com, youtu.be)
- Instagram (instagram.com)
- Facebook (facebook.com, fb.watch)
- Twitter/X (twitter.com, x.com)
- TikTok (tiktok.com)
- And many more supported by yt-dlp

## Development

### Running with Docker

**Backend only:**
```bash
cd backend
docker-compose up -d
```

**Full stack:**
```bash
# Backend
cd backend && docker-compose up -d

# Frontend (in another terminal)
cd frontend && npm start
```

### Code Style
- **Frontend**: ESLint + Prettier with TypeScript
- **Backend**: Black code formatter + isort
- **Commits**: Conventional commit messages

## Advanced Features (Planned)

- 🎵 **Auto MP3 conversion** with metadata
- 🔔 **Background downloads** with notifications
- 📋 **Playlist downloader** for batch processing
- ⏰ **Queue management** for multiple downloads
- 🗂️ **Category organization** by channel/creator
- 🔗 **Batch URL processing** from text files
- 📱 **Share sheet integration** for seamless downloading

## Permissions

### Android
- `INTERNET` - Network access for downloads
- `WRITE_EXTERNAL_STORAGE` - Save downloaded files
- `READ_EXTERNAL_STORAGE` - Access downloaded files
- `SYSTEM_ALERT_WINDOW` - Floating bubble overlay
- `DOWNLOAD_WITHOUT_NOTIFICATION` - Background downloads

### iOS
- `NSAppTransportSecurity` - Network access
- `NSPhotoLibraryUsageDescription` - Save to photo library
- `NSMicrophoneUsageDescription` - Audio processing

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This tool is for personal use only. Please respect the terms of service of the platforms you're downloading from and ensure you have the right to download the content.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the API documentation at `/docs`
- Review the troubleshooting section in backend README

---

**Happy Downloading! 🎉**
