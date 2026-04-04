@echo off
echo Stopping Pulses.life Health Assistant Suite...
echo ================================================
echo Killing processes on ports 3000, 5000, 5002, and 8000...

set ports=3000 5000 5002 8000

for %%p in (%ports%) do (
    echo.
    echo Cleaning up port %%p...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%%p ^| findstr LISTENING') do (
        echo Found process PID %%a on port %%p. Killing it...
        taskkill /PID %%a /F >nul 2>&1
        if %errorlevel%==0 (
            echo Success.
        ) else (
            echo Failed or already stopped.
        )
    )
)

echo.
echo ================================================
echo ✅ Done. All services stopped.
echo ================================================
pause