from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parents[2]
COOKIES_DIR = BASE_DIR / "cookies"
YOUTUBE_COOKIES = os.getenv("YOUTUBE_COOKIES", str(COOKIES_DIR / "youtube.com.txt"))
