@echo off
echo 🔥 Starting ShadowSCAN...

REM Activate virtual environment
call venv\Scripts\activate

REM Start Backend
echo 🚀 Starting Backend...
start cmd /k "cd /d D:\Projects\ShadowSCAN && uvicorn main:app --reload"

REM Wait for backend
timeout /t 3 >nul

REM Start Frontend
echo 💻 Starting Frontend...
start cmd /k "cd /d D:\Projects\ShadowSCAN\ui && npm run dev"

echo 🌐 Open http://localhost:5173
pause