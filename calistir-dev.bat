@echo off
chcp 65001 >nul
title ISG Pro 11.01 - Gelistirici Sunucusu
cd /d "%~dp0"

echo ===================================================
echo   ISG Pro 11.01 Port 3000 Kontrol Ediliyor...
echo ===================================================
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Eski arka plan sureci (PID: %%a) kapatiliyor...
    taskkill /F /PID %%a >nul 2>&1
)

echo ===================================================
echo   ISG Pro 11.01 (npm run dev) Baslatiliyor...
echo ===================================================
echo Tarayici: http://localhost:3000
echo.
npm run dev
pause
