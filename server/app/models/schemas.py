from pydantic import BaseModel
from typing import List, Optional


class FormatOption(BaseModel):
    # Keep both: `itag` for UI/debug, `format_string` for actual download (e.g., "137+140" or "18")
    itag: Optional[str] = None
    format_string: str
    label: str
    ext: str
    note: Optional[str] = None
    sizeBytes: Optional[int] = None


class InfoRequest(BaseModel):
    url: str


class InfoResponse(BaseModel):
    title: str
    thumbnail: Optional[str] = None
    duration: Optional[int] = None
    formats: List[FormatOption]
