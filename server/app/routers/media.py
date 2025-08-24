from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from ..models.schemas import InfoRequest, InfoResponse, FormatOption
from ..services.ytdlp_service import extract_info, select_thumbnail, build_formats, download_to_temp

router = APIRouter(prefix="/media", tags=["media"])


@router.post("/info", response_model=InfoResponse)
def info(body: InfoRequest):
    try:
        data = extract_info(body.url)
        return InfoResponse(
            title=data.get("title") or "Untitled",
            thumbnail=select_thumbnail(data),
            duration=int(data["duration"]) if data.get("duration") else None,
            formats=[FormatOption(**f) for f in build_formats(data)],
        )
    except Exception as e:
        # Surface yt-dlp error message to client for easier debugging
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/download")
def download(url: str = Query(...), format: str = Query(..., alias="format")):
    """
    `format` must be the `format_string` returned by /info (e.g., "137+140" or "18").
    """
    try:
        path = download_to_temp(url, format)
        filename = path.split(os.sep)[-1]
        return FileResponse(
            path,
            media_type="application/octet-stream",
            filename=filename,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
