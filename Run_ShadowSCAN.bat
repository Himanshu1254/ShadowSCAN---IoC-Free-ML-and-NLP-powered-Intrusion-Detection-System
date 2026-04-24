@echo off
echo Starting ShadowSCAN...

REM Go to project root (auto-detect current folder)
cd /d %~dp0

REM Activate virtual environment
call venv\Scripts\activate

REM Start backend
start cmd /k "uvicorn main:app --reload"

REM Small delay
timeout /t 2 >nul

REM Start frontend
start cmd /k "cd ui && npm run dev"

echo.
echo Open http://localhost:5173
pause