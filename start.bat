@echo off
echo Starting Pulses.life Health Assistant Suite...
echo ================================================
echo Services:
echo - Backend: http://localhost:5002
echo - Frontend: http://localhost:3000
echo - WhatsApp Bot: http://localhost:8000
echo ================================================
echo.
echo Starting [1/3] Backend (Node.js/Express)...
start "Pulses.life Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak > nul

echo Starting [2/3] Frontend (Next.js)...
start "Pulses.life Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 5 /nobreak > nul

echo Starting [3/3] WhatsApp Bot (FastAPI)...
start "Pulses.life WhatsApp Bot" cmd /k "cd "whatsapp bot" && venv\Scripts\activate && python main.py"

echo.
echo ================================================
echo ✅ All services launched successfully!
echo ================================================
echo.
echo Access point: http://localhost:3000
echo.
echo Keep the command windows open to maintain services.
echo ================================================
pause