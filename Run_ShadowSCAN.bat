@echo off
echo Starting ShadowSCAN...

start cmd /k "uvicorn main:app --reload"
timeout /t 2 >nul
start cmd /k "cd ui && npm run dev"

echo Open http://localhost:5173
pause