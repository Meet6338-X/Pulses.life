@echo off
echo Stopping Pulses.life backend...

REM Find the PID of the process listening on port 5000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo Killing process PID %%a
    taskkill /PID %%a /F >nul 2>&1
    if %errorlevel%==0 (
        echo Successfully stopped backend process.
    ) else (
        echo Failed to stop process or no process found.
    )
    goto :end
)

echo No backend process found on port 5000.
:end
echo Done.