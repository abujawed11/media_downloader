from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers.media import router as media_router

app = FastAPI(title="Media Downloader API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # lock down later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(media_router)
