@echo off
echo Starting Pulses.life Health Assistant...
echo ================================================
echo System:
echo - Backend: http://localhost:5002
echo - Frontend: http://localhost:3000 (or next available port)
echo ================================================
echo.
echo Starting services...
echo.
echo [1/2] Starting backend...
start "Pulses.life Backend" cmd /k "cd backend && npm run dev"
echo Backend started.
echo.
timeout /t 3 /nobreak > nul
echo.
echo [2/2] Starting frontend...
start "Pulses.life Frontend" cmd /k "cd frontend && npm run dev"
echo Frontend started.
echo.
echo ================================================
echo ✅ Services started successfully!
echo.
echo Access point:
echo • Health Assistant: http://localhost:3000
echo.
echo Keep command windows open.
echo ================================================
pause