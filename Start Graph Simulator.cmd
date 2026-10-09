@echo off
setlocal

title Third-Party Graph Simulator

REM Always work relative to this launcher, regardless of where it was launched from.
cd /d "%~dp0"

echo.
echo ========================================================
echo.
echo              Third-Party Graph Simulator
echo.
echo ========================================================
echo.
echo Starting the simulator...
echo.
echo The simulator runs locally on this computer.
echo Closing this window will stop the simulator.
echo.
echo ========================================================
echo.

REM Verify bundled Node exists.
if not exist "%~dp0runtime\node.exe" (
    echo ERROR: The bundled Node.js runtime could not be found.
    echo.
    echo Expected:
    echo %~dp0runtime\node.exe
    echo.
    echo Make sure the complete simulator folder was extracted.
    echo.
    pause
    exit /b 1
)

REM Verify server.js exists.
if not exist "%~dp0app\server.js" (
    echo ERROR: server.js could not be found.
    echo.
    echo Expected:
    echo %~dp0app\server.js
    echo.
    echo Make sure the complete simulator folder was extracted.
    echo.
    pause
    exit /b 1
)

REM Switch to the application directory.
cd /d "%~dp0app"

REM Start server.js using OUR bundled Node, not the system Node.
"%~dp0runtime\node.exe" server.js

REM Capture the Node exit code.
set "EXITCODE=%ERRORLEVEL%"

echo.
echo ========================================================
echo.
echo The Graph Simulator has stopped.
echo.

if not "%EXITCODE%"=="0" (
    echo The application exited with error code %EXITCODE%.
    echo.
    echo Capture the error information displayed above if
    echo troubleshooting is required.
) else (
    echo The application closed normally.
)

echo.
echo ========================================================
echo.

pause

exit /b %EXITCODE%