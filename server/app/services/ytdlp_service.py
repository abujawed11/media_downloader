import os
import tempfile
from pathlib import Path
from typing import Dict, List, Optional

import yt_dlp

# base dirs
BASE_DIR = Path(__file__).resolve().parents[2]
COOKIES_DIR = BASE_DIR / "cookies"

# realistic headers + mobile client help with consent/bot walls
COMMON_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}


def _cookies_for(url: str) -> Optional[str]:
    """
    Returns a cookie file path for the domain if present.
    Put Netscape cookies here:
      server/cookies/youtube.txt
      server/cookies/instagram.txt
      server/cookies/facebook.txt
      server/cookies/twitter.txt
    """
    u = url.lower()
    mapping = {
        "youtube.txt": ["youtube.com", "youtu.be"],
        "instagram.txt": ["instagram.com"],
        "facebook.txt": ["facebook.com", "fb.watch"],
        "twitter.txt": ["twitter.com", "x.com"],
    }
    for name, keys in mapping.items():
        if any(k in u for k in keys):
            p = COOKIES_DIR / name
            return str(p) if p.is_file() else None
    return None


def _base_opts(url: str, *, for_info: bool) -> Dict:
    """
    Shared yt-dlp options. Crucially:
      - ignoreconfig=True to ignore user/global yt-dlp config files
      - youtube extractor set to mobile player client to avoid bot checks
    """
    opts: Dict = {
        "quiet": True,
        "skip_download": for_info,
        "nocheckcertificate": True,
        "cachedir": False,
        "ignoreconfig": True,  # <-- prevents global -f or other flags from breaking info()
        "retries": 3,
        "http_headers": COMMON_HEADERS,
        "extractor_args": {
            "youtube": {"player_client": ["android"]},
        },
    }
    cookiefile = _cookies_for(url)
    if cookiefile:
        opts["cookiefile"] = cookiefile
    return opts


def extract_info(url: str) -> Dict:
    opts = _base_opts(url, for_info=True)
    with yt_dlp.YoutubeDL(opts) as ydl:
        return ydl.extract_info(url, download=False)


def select_thumbnail(meta: Dict) -> Optional[str]:
    if isinstance(meta.get("thumbnail"), str):
        return meta["thumbnail"]
    thumbs = meta.get("thumbnails") or []
    best = None
    for t in thumbs:
        if isinstance(t, dict) and t.get("url"):
            if best is None or (t.get("height") or 0) > (best.get("height") or 0):
                best = t
    return best.get("url") if best else None


def build_formats(info: Dict) -> List[Dict]:
    """
    Build clean format options:
      - Prefer progressive MP4 for common heights
      - Fallback to best video-only + best audio (merged) for 360/480/720/1080/1440/2160
      - Include one best audio-only at the end
    Returns entries with: itag, format_string, label, ext, note, sizeBytes
    """
    targets = [360, 480, 720, 1080, 1440, 2160]
    fmts = info.get("formats") or []

    best_prog_mp4_by_h: Dict[int, Dict] = {}
    best_vo_mp4_by_h: Dict[int, Dict] = {}
    best_vo_webm_by_h: Dict[int, Dict] = {}
    best_audio_m4a: Optional[Dict] = None
    best_audio_webm: Optional[Dict] = None

    def better(a, b, key="tbr"):
        return (a or {}).get(key, 0) > (b or {}).get(key, 0)

    for f in fmts:
        ext = f.get("ext")
        v = f.get("vcodec")
        a = f.get("acodec")
        h = f.get("height")

        # audio-only
        if v == "none" and a != "none":
            if ext in ("m4a", "mp4"):
                if better(f, best_audio_m4a):
                    best_audio_m4a = f
            elif ext in ("webm", "opus"):
                if better(f, best_audio_webm):
                    best_audio_webm = f
            continue

        # video
        if isinstance(h, int):
            if v != "none" and a != "none" and ext == "mp4":  # progressive mp4
                cur = best_prog_mp4_by_h.get(h)
                if not cur or better(f, cur):
                    best_prog_mp4_by_h[h] = f
            if v != "none" and a == "none":  # video-only
                if ext == "mp4":
                    cur = best_vo_mp4_by_h.get(h)
                    if not cur or better(f, cur):
                        best_vo_mp4_by_h[h] = f
                elif ext == "webm":
                    cur = best_vo_webm_by_h.get(h)
                    if not cur or better(f, cur):
                        best_vo_webm_by_h[h] = f

    out: List[Dict] = []

    for h in sorted(set(targets)):
        added = False
        prog = best_prog_mp4_by_h.get(h)
        if prog:
            out.append({
                "itag": str(prog.get("format_id")),
                "format_string": str(prog.get("format_id")),  # progressive is a single id
                "label": f"{h}p mp4",
                "ext": "mp4",
                "note": "/".join(filter(None, [prog.get("vcodec"), prog.get("acodec")])),
                "sizeBytes": prog.get("filesize") or prog.get("filesize_approx"),
            })
            added = True

        if not added and best_vo_mp4_by_h.get(h) and (best_audio_m4a or best_audio_webm):
            v = best_vo_mp4_by_h[h]
            a = best_audio_m4a or best_audio_webm
            out.append({
                "itag": None,
                "format_string": f"{v.get('format_id')}+{a.get('format_id')}",  # merged
                "label": f"{h}p mp4 (merge)",
                "ext": "mp4",
                "note": "/".join(filter(None, [v.get("vcodec"), a.get("acodec")])),
                "sizeBytes": (v.get("filesize") or v.get("filesize_approx")) or (a.get("filesize") or a.get("filesize_approx")),
            })
            added = True

        if not added and best_vo_webm_by_h.get(h) and best_audio_webm:
            v = best_vo_webm_by_h[h]
            a = best_audio_webm
            out.append({
                "itag": None,
                "format_string": f"{v.get('format_id')}+{a.get('format_id')}",  # merged
                "label": f"{h}p webm (merge)",
                "ext": "webm",
                "note": "/".join(filter(None, [v.get("vcodec"), a.get("acodec")])),
                "sizeBytes": (v.get("filesize") or v.get("filesize_approx")) or (a.get("filesize") or a.get("filesize_approx")),
            })

    # Add a best audio-only option at the end
    if best_audio_m4a:
        out.append({
            "itag": str(best_audio_m4a.get("format_id")),
            "format_string": str(best_audio_m4a.get("format_id")),
            "label": "Audio m4a",
            "ext": "m4a",
            "note": best_audio_m4a.get("acodec"),
            "sizeBytes": best_audio_m4a.get("filesize") or best_audio_m4a.get("filesize_approx"),
        })
    elif best_audio_webm:
        out.append({
            "itag": str(best_audio_webm.get("format_id")),
            "format_string": str(best_audio_webm.get("format_id")),
            "label": "Audio webm",
            "ext": "webm",
            "note": best_audio_webm.get("acodec"),
            "sizeBytes": best_audio_webm.get("filesize") or best_audio_webm.get("filesize_approx"),
        })

    return out


def download_to_temp(url: str, format_string: str) -> str:
    """
    Download to a temp file and return the full path.
    Use the same base opts (cookies, ignoreconfig, headers) and set `format`.
    """
    tmpdir = tempfile.mkdtemp(prefix="md_")
    outtmpl = os.path.join(tmpdir, "%(title)s.%(ext)s")

    ydl_opts = _base_opts(url, for_info=False)
    ydl_opts.update({
        "format": format_string,      # e.g., "137+140" or "18"
        "outtmpl": outtmpl,
        "noprogress": True,
        "skip_download": False,
        # "merge_output_format": "mp4",  # optionally force mp4 container
    })

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        result = ydl.extract_info(url, download=True)

    # Resolve output path
    if isinstance(result, dict) and result.get("_filename"):
        return result["_filename"]
    entries = result.get("entries") if isinstance(result, dict) else None
    if entries and entries[0].get("_filename"):
        return entries[0]["_filename"]

    # Fallback: first file in tmpdir
    for f in os.listdir(tmpdir):
        p = os.path.join(tmpdir, f)
        if os.path.isfile(p):
            return p

    raise RuntimeError("Download failed: file not found")
