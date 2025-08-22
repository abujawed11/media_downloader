#!/usr/bin/env python3
"""
Quick start script for the Media Downloader backend
"""

import os
import sys
import subprocess
from pathlib import Path

def check_requirements():
    """Check if all requirements are met"""
    try:
        import fastapi
        import yt_dlp
        import uvicorn
        print("✅ All Python dependencies are installed")
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please run: pip install -r requirements.txt")
        return False
    
    # Check FFmpeg
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        print("✅ FFmpeg is installed")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ FFmpeg not found")
        print("Please install FFmpeg:")
        print("  Windows: Download from https://ffmpeg.org/download.html")
        print("  macOS: brew install ffmpeg")
        print("  Ubuntu/Debian: sudo apt install ffmpeg")
        return False
    
    return True

def setup_directories():
    """Create necessary directories"""
    downloads_dir = Path("downloads")
    downloads_dir.mkdir(exist_ok=True)
    print(f"✅ Downloads directory ready: {downloads_dir.absolute()}")

def main():
    print("🚀 Starting Media Downloader Backend")
    print("=" * 50)
    
    if not check_requirements():
        sys.exit(1)
    
    setup_directories()
    
    print("\n🎯 Starting FastAPI server...")
    print("📍 API will be available at: http://localhost:8000")
    print("📖 Documentation at: http://localhost:8000/docs")
    print("\n⏹️  Press Ctrl+C to stop the server")
    print("=" * 50)
    
    try:
        os.system("python main.py")
    except KeyboardInterrupt:
        print("\n👋 Server stopped")

if __name__ == "__main__":
    main()
