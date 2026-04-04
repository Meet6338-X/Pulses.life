@echo off
echo ================================================================
echo   MediRoute Emergency Dispatch System - Demo Launcher
echo ================================================================
echo.
echo Starting all services...
echo.

:: Start Backend
echo [1/4] Starting Backend Server (port 3000)...
start "MediRoute Backend" cmd /k "cd /d %~dp0backend && node index.js"
timeout /t 3 /nobreak > nul

:: Start Patient App
echo [2/4] Starting Patient App (port 5173)...
start "MediRoute Patient" cmd /k "cd /d %~dp0patient-app && npx vite --port 5173 --host"
timeout /t 2 /nobreak > nul

:: Start Admin Dashboard
echo [3/4] Starting Admin Dashboard (port 5174)...
start "MediRoute Admin" cmd /k "cd /d %~dp0admin-app && npx vite --port 5174 --host"
timeout /t 2 /nobreak > nul

:: Start Hospital Panel
echo [4/4] Starting Hospital Panel (port 5175)...
start "MediRoute Hospital" cmd /k "cd /d %~dp0hospital-app && npx vite --port 5175 --host"
timeout /t 3 /nobreak > nul

echo.
echo ================================================================
echo   All services started!
echo ================================================================
echo.
echo   Patient App:      http://localhost:5173
echo   Admin Dashboard:  http://localhost:5174
echo   Hospital Panel:   http://localhost:5175
echo   Backend API:      http://localhost:3000
echo.
echo   Opening all three screens in your browser...
echo ================================================================

:: Open all three apps in browser
start http://localhost:5174
timeout /t 1 /nobreak > nul
start http://localhost:5175
timeout /t 1 /nobreak > nul
start http://localhost:5173

echo.
echo Press any key to close this launcher (services will keep running)...
pause > nul
