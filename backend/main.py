from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel
import yt_dlp
import os
import uuid
import asyncio
import json
from typing import Optional, List, Dict, Any
import aiofiles
from pathlib import Path
import tempfile
import shutil

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
DOWNLOAD_DIR = Path("downloads")
DOWNLOAD_DIR.mkdir(exist_ok=True)

# In-memory storage for download progress (in production, use Redis or database)
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

def get_ydl_opts(download_path: str = None):
    """Get yt-dlp options"""
    opts = {
        'quiet': True,
        'no_warnings': True,
        'extractaudio': False,
        'audioformat': 'mp3',
        'outtmpl': str(DOWNLOAD_DIR / '%(title)s.%(ext)s') if not download_path else download_path,
        'writeinfojson': False,
        'writedescription': False,
        'writesubtitles': False,
        'writeautomaticsub': False,
    }
    return opts

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
    return {"message": "Media Downloader API", "version": "1.0.0"}

@app.post("/info", response_model=MediaInfo)
async def get_media_info(request: URLRequest):
    """Get media information from URL"""
    try:
        with yt_dlp.YoutubeDL(get_ydl_opts()) as ydl:
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
            
            return MediaInfo(
                title=title,
                thumbnail=thumbnail,
                duration=duration,
                platform=platform,
                formats=formats
            )
            
    except yt_dlp.DownloadError as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract info: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

def progress_hook(d):
    """Progress hook for yt-dlp downloads"""
    if d['status'] == 'downloading':
        download_id = d.get('info_dict', {}).get('id', 'unknown')
        if download_id in download_progress:
            total = d.get('total_bytes') or d.get('total_bytes_estimate', 0)
            downloaded = d.get('downloaded_bytes', 0)
            
            if total > 0:
                progress = (downloaded / total) * 100
                download_progress[download_id]['progress'] = progress
                download_progress[download_id]['status'] = 'downloading'
    
    elif d['status'] == 'finished':
        download_id = d.get('info_dict', {}).get('id', 'unknown')
        if download_id in download_progress:
            download_progress[download_id]['progress'] = 100
            download_progress[download_id]['status'] = 'completed'
            download_progress[download_id]['filename'] = d.get('filename', '')

async def download_media_task(url: str, format_id: str, quality: str, download_id: str):
    """Background task to download media"""
    try:
        # Set up download options
        filename = f"{download_id}_%(title)s.%(ext)s"
        outtmpl = str(DOWNLOAD_DIR / filename)
        
        ydl_opts = get_ydl_opts(outtmpl)
        ydl_opts['progress_hooks'] = [progress_hook]
        
        # Configure format selection
        if format_id == 'audio':
            ydl_opts['format'] = 'bestaudio/best'
            ydl_opts['extractaudio'] = True
            ydl_opts['audioformat'] = 'mp3'
        else:
            ydl_opts['format'] = f'{format_id}/best[height<={quality.replace("p", "")}]/best'
        
        # Initialize progress tracking
        download_progress[download_id] = {
            'status': 'downloading',
            'progress': 0,
            'filename': '',
            'error': None
        }
        
        # Download the media
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            await asyncio.to_thread(ydl.download, [url])
            
    except Exception as e:
        download_progress[download_id] = {
            'status': 'failed',
            'progress': 0,
            'filename': '',
            'error': str(e)
        }

@app.post("/download", response_model=DownloadResponse)
async def download_media(request: DownloadRequest, background_tasks: BackgroundTasks):
    """Start media download"""
    try:
        download_id = str(uuid.uuid4())
        
        # Start download in background
        background_tasks.add_task(
            download_media_task,
            request.url,
            request.format,
            request.quality,
            download_id
        )
        
        return DownloadResponse(
            download_id=download_id,
            status="started",
            message="Download started successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start download: {str(e)}")

@app.get("/download/{download_id}/status")
async def get_download_status(download_id: str):
    """Get download progress status"""
    if download_id not in download_progress:
        raise HTTPException(status_code=404, detail="Download not found")
    
    return download_progress[download_id]

@app.get("/download/{download_id}/file")
async def download_file(download_id: str):
    """Download the completed file"""
    if download_id not in download_progress:
        raise HTTPException(status_code=404, detail="Download not found")
    
    progress_info = download_progress[download_id]
    
    if progress_info['status'] != 'completed':
        raise HTTPException(status_code=400, detail="Download not completed")
    
    filename = progress_info.get('filename', '')
    if not filename or not os.path.exists(filename):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        filename,
        media_type='application/octet-stream',
        filename=os.path.basename(filename)
    )

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
    """Delete a download and its file"""
    if download_id not in download_progress:
        raise HTTPException(status_code=404, detail="Download not found")
    
    progress_info = download_progress[download_id]
    filename = progress_info.get('filename', '')
    
    # Delete file if it exists
    if filename and os.path.exists(filename):
        try:
            os.remove(filename)
        except OSError:
            pass  # File might be in use or already deleted
    
    # Remove from progress tracking
    del download_progress[download_id]
    
    return {"message": "Download deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
