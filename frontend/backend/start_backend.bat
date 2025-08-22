@echo off
echo Starting YouTube Downloader Backend...
echo.
echo Installing dependencies...
pip install -r requirements.txt
echo.
echo Starting server on http://localhost:8000
echo.
python main.py
pause
