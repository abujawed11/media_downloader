from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import yt_dlp
import os
import uuid
from typing import List, Dict, Any

app = FastAPI(title="Media Downloader API", version="1.0.0")

# Enable CORS for React Native app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your app's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Download directory
DOWNLOAD_DIR = "downloads"
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# In-memory storage for download progress
download_progress = {}

class URLRequest(BaseModel):
    url: str

class DownloadRequest(BaseModel):
    url: str
    format: str
    quality: str

class MediaInfo(BaseModel):
    title: str
    thumbnail: str
    duration: int
    platform: str
    formats: List[Dict[str, Any]]

class DownloadResponse(BaseModel):
    download_id: str
    status: str
    message: str

def extract_platform(url: str) -> str:
    """Extract platform from URL"""
    if 'youtube.com' in url or 'youtu.be' in url:
        return 'youtube'
    elif 'instagram.com' in url:
        return 'instagram'
    elif 'facebook.com' in url or 'fb.watch' in url:
        return 'facebook'
    elif 'twitter.com' in url or 'x.com' in url:
        return 'twitter'
    elif 'tiktok.com' in url:
        return 'tiktok'
    else:
        return 'other'

def format_duration(duration: float) -> int:
    """Convert duration to integer seconds"""
    return int(duration) if duration else 0

def process_formats(formats: List[Dict]) -> List[Dict[str, Any]]:
    """Process and filter video formats"""
    if not formats:
        return []
    
    processed = []
    seen_qualities = set()
    
    for fmt in formats:
        if not fmt.get('height'):
            continue
            
        height = fmt.get('height', 0)
        if height < 144:  # Skip very low quality
            continue
            
        quality = f"{height}p"
        if quality in seen_qualities:
            continue
            
        seen_qualities.add(quality)
        processed.append({
            'format_id': fmt.get('format_id', ''),
            'ext': fmt.get('ext', 'mp4'),
            'resolution': f"{fmt.get('width', 0)}x{height}",
            'filesize': fmt.get('filesize'),
            'quality': quality,
            'vcodec': fmt.get('vcodec'),
            'acodec': fmt.get('acodec'),
            'fps': fmt.get('fps'),
            'url': fmt.get('url', ''),
        })
    
    # Sort by quality (highest first)
    processed.sort(key=lambda x: int(x['quality'].replace('p', '')), reverse=True)
    return processed

@app.get("/")
async def root():
    return {"message": "Media Downloader API", "version": "1.0.0", "status": "running"}

@app.post("/info")
async def get_media_info(request: URLRequest):
    """Get media information from URL"""
    try:
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract info without downloading
            info = ydl.extract_info(request.url, download=False)
            
            # Handle playlist
            if 'entries' in info:
                # For playlists, return info for the first video
                if info['entries']:
                    info = info['entries'][0]
                else:
                    raise HTTPException(status_code=400, detail="Empty playlist")
            
            # Extract relevant information
            title = info.get('title', 'Unknown Title')
            thumbnail = info.get('thumbnail', '')
            duration = format_duration(info.get('duration', 0))
            platform = extract_platform(request.url)
            formats = process_formats(info.get('formats', []))
            
            return {
                "success": True,
                "data": {
                    "title": title,
                    "thumbnail": thumbnail,
                    "duration": duration,
                    "platform": platform,
                    "formats": formats
                }
            }
            
    except yt_dlp.DownloadError as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract info: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@app.post("/download")
async def download_media(request: DownloadRequest):
    """Start media download"""
    try:
        download_id = str(uuid.uuid4())
        
        # Initialize progress tracking
        download_progress[download_id] = {
            'status': 'started',
            'progress': 0,
            'filename': '',
            'error': None
        }
        
        return {
            "success": True,
            "data": {
                "download_id": download_id,
                "status": "started",
                "message": "Download started successfully"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start download: {str(e)}")

@app.get("/download/{download_id}/status")
async def get_download_status(download_id: str):
    """Get download progress status"""
    if download_id not in download_progress:
        raise HTTPException(status_code=404, detail="Download not found")
    
    return download_progress[download_id]

@app.get("/downloads")
async def list_downloads():
    """List all downloads"""
    downloads = []
    for download_id, progress_info in download_progress.items():
        downloads.append({
            'download_id': download_id,
            **progress_info
        })
    return downloads

@app.delete("/download/{download_id}")
async def delete_download(download_id: str):
    """Delete a download"""
    if download_id not in download_progress:
        raise HTTPException(status_code=404, detail="Download not found")
    
    # Remove from progress tracking
    del download_progress[download_id]
    
    return {"message": "Download deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Media Downloader API...")
    print("📖 API Documentation will be available at: http://localhost:8000/docs")
    print("🌐 API Base URL: http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
