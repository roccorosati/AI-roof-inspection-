@echo off
setlocal

REM Make sure Node.js is on PATH
set "PATH=C:\Program Files\nodejs;%PATH%"

echo ============================================
echo   AI Roof Inspector
echo ============================================
echo.

REM Verify node is available
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found.
    echo Install it from https://nodejs.org then restart your computer.
    echo.
    pause
    exit /b 1
)

REM Warn if API key hasn't been set
findstr /C:"your_api_key_here" "%~dp0backend\.env" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ERROR: API key not set.
    echo Open backend\.env and replace "your_api_key_here" with your key from:
    echo https://console.anthropic.com
    echo.
    pause
    exit /b 1
)

REM Install backend deps if missing
if not exist "%~dp0backend\node_modules" (
    echo Installing backend packages...
    cd /d "%~dp0backend"
    npm install
    cd /d "%~dp0"
)

REM Build frontend if not already built
if not exist "%~dp0backend\public\index.html" (
    echo Installing and building frontend...
    cd /d "%~dp0frontend"
    npm install
    npm run build
    cd /d "%~dp0"
)

echo Starting server at http://localhost:3001
echo.
echo Keep this window open while using the app.
echo Press Ctrl+C to stop the server.
echo.

REM Open browser after 2 seconds
start "" /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3001"

REM Start server (keeps this window open, shows logs)
cd /d "%~dp0backend"
node server.js
