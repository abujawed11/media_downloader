from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yt_dlp
import json
import asyncio
from typing import Optional

app = FastAPI(title="YouTube Downloader API")

# Enable CORS for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DownloadRequest(BaseModel):
    url: str
    format: str = "mp4"

class DownloadResponse(BaseModel):
    downloadUrl: str
    title: str
    thumbnail: str
    duration: Optional[int] = None

@app.get("/")
async def root():
    return {"message": "YouTube Downloader API is running!"}

@app.post("/download", response_model=DownloadResponse)
async def get_download_url(request: DownloadRequest):
    try:
        # Configure yt-dlp options
        ydl_opts = {
            'format': 'best[ext=mp4]/best',  # Prefer MP4 format
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract video info
            info = ydl.extract_info(request.url, download=False)
            
            # Get the best download URL
            if 'url' in info:
                download_url = info['url']
            else:
                # If direct URL not available, get formats
                formats = info.get('formats', [])
                if formats:
                    # Get the best quality MP4 format
                    mp4_formats = [f for f in formats if f.get('ext') == 'mp4']
                    if mp4_formats:
                        download_url = mp4_formats[0]['url']
                    else:
                        download_url = formats[0]['url']
                else:
                    raise HTTPException(status_code=400, detail="No downloadable format found")
            
            return DownloadResponse(
                downloadUrl=download_url,
                title=info.get('title', 'Unknown Title'),
                thumbnail=info.get('thumbnail', ''),
                duration=info.get('duration')
            )
            
    except Exception as e:
        print(f"Error processing URL {request.url}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process video: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/test")
async def test_endpoint():
    return {"message": "Backend is working!", "timestamp": "2025-01-22"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
