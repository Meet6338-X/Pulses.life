@echo off
echo Starting Pulses.life with MediRoute Integration...
echo ================================================
echo Main System:
echo - Backend: http://localhost:5002
echo - Frontend: http://localhost:3000 (or next available port)
echo.
echo MediRoute Emergency System:
echo - Backend: http://localhost:3001
echo - Patient App: http://localhost:5173
echo - Admin Dashboard: http://localhost:5174
echo - Hospital Panel: http://localhost:5175
echo ================================================
echo.
echo Starting services...
echo.
echo [1/2] Starting main backend...
start "Pulses.life Backend" cmd /k "cd backend && npm run dev"
echo Main backend started.
echo.
timeout /t 3 /nobreak > nul
echo.
echo [2/3] Starting main frontend...
start "Pulses.life Frontend" cmd /k "cd frontend && npm run dev"
echo Main frontend started.
echo.
timeout /t 3 /nobreak > nul
echo.
echo [3/3] Starting MediRoute system...
echo Starting MediRoute backend...
start "MediRoute Backend" cmd /k "cd nextmodule && npm run start:backend"
echo MediRoute backend started.
echo.
timeout /t 2 /nobreak > nul
echo Starting MediRoute apps...
start "MediRoute Patient" cmd /k "cd nextmodule && npm run start:patient"
start "MediRoute Admin" cmd /k "cd nextmodule && npm run start:admin"
start "MediRoute Hospital" cmd /k "cd nextmodule && npm run start:hospital"
echo All MediRoute apps started.
echo.
echo ================================================
echo ✅ All services started successfully!
echo.
echo Access points:
echo • Main Health Assistant: http://localhost:3000
echo • Emergency Patient App: http://localhost:5173
echo • Emergency Admin Dashboard: http://localhost:5174
echo • Emergency Hospital Panel: http://localhost:5175
echo.
echo Keep all command windows open.
echo ================================================
pause