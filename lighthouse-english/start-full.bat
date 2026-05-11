@echo off
chcp 65001 >nul 2>nul
cd /d "%~dp0"
set PORT=8765
set "ENTRY=lighthouse-full.html"

if not exist "%ENTRY%" (
  echo Could not find %ENTRY%.
  pause
  exit /b 1
)

where py >nul 2>nul && goto USE_PY
where python >nul 2>nul && goto USE_PYTHON
where node >nul 2>nul && goto USE_NODE

echo Please install Python or Node.js, then run this file again.
pause
exit /b 1

:USE_PY
start "lighthouse-http" cmd /k "title lighthouse-http ^& py -m http.server %PORT%"
goto OPEN

:USE_PYTHON
start "lighthouse-http" cmd /k "title lighthouse-http ^& python -m http.server %PORT%"
goto OPEN

:USE_NODE
start "lighthouse-http" cmd /k "title lighthouse-http ^& npx --yes serve@14 . -l %PORT%"

:OPEN
timeout /t 4 /nobreak >nul
start "" "http://127.0.0.1:%PORT%/%ENTRY%#/"
echo Opened http://127.0.0.1:%PORT%/%ENTRY%#/
pause
