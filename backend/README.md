# Media Downloader Backend

FastAPI backend service for downloading media from various platforms using yt-dlp.

## Features

- Extract media information from URLs
- Download videos in various qualities (360p, 720p, 1080p)
- Download audio-only (MP3)
- Progress tracking for downloads
- Support for multiple platforms (YouTube, Instagram, Facebook, Twitter, TikTok)
- RESTful API with automatic documentation

## Requirements

- Python 3.8+
- FFmpeg (for audio conversion)

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Install FFmpeg:
   - **Windows**: Download from https://ffmpeg.org/download.html
   - **macOS**: `brew install ffmpeg`
   - **Ubuntu/Debian**: `sudo apt install ffmpeg`

3. Create environment file:
```bash
cp .env.example .env
```

4. Run the server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### GET /
Health check endpoint

### POST /info
Extract media information from URL
```json
{
  "url": "https://youtube.com/watch?v=dQw4w9WgXcQ"
}
```

### POST /download
Start media download
```json
{
  "url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
  "format": "22",
  "quality": "720p"
}
```

### GET /download/{download_id}/status
Get download progress status

### GET /download/{download_id}/file
Download the completed file

### GET /downloads
List all downloads

### DELETE /download/{download_id}
Delete a download and its file

## Supported Platforms

- YouTube (youtube.com, youtu.be)
- Instagram (instagram.com)
- Facebook (facebook.com, fb.watch)
- Twitter/X (twitter.com, x.com)
- TikTok (tiktok.com)
- And many more supported by yt-dlp

## Configuration

Edit `.env` file to customize:
- Download directory
- Rate limiting
- Maximum file size
- Allowed domains

## Development

For development with auto-reload:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Docker Support

Build and run with Docker:
```bash
docker build -t media-downloader-backend .
docker run -p 8000:8000 -v ./downloads:/app/downloads media-downloader-backend
```
