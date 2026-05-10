@echo off
chcp 65001 >nul 2>nul
cd /d "%~dp0"
set PORT=8765
set "ENTRY=lighthouse-full.html"

if not exist "%ENTRY%" (
  echo.
  echo [错误] 当前文件夹里没有网页文件：%ENTRY%
  echo 请把本脚本与 lighthouse-full.html 放在同一文件夹（dist 文件夹里则用 index.html）。
  echo.
  pause
  exit /b 1
)

echo.
echo 灯塔英语角 - 启动本地服务（跟读录音需用下方网址打开，勿直接用双击 HTML）
echo.

where py >nul 2>nul && goto USE_PY
where python >nul 2>nul && goto USE_PYTHON
where node >nul 2>nul && goto USE_NODE

echo [错误] 电脑里没有检测到 Python（命令 py / python）也没有 Node.js（命令 node）。
echo 请先安装其中一个后再双击本脚本，例如：
echo   Python: https://www.python.org/downloads/
echo   Node.js: https://nodejs.org/
echo.
pause
exit /b 1

:USE_PY
start "lighthouse-http" cmd /k "title lighthouse-http ^& py -m http.server %PORT%"
goto OPEN

:USE_PYTHON
start "lighthouse-http" cmd /k "title lighthouse-http ^& python -m http.server %PORT%"
goto OPEN

:USE_NODE
echo 使用 Node 启动（首次可能下载较慢，请稍等）…
start "lighthouse-http" cmd /k "title lighthouse-http ^& npx --yes serve@14 . -l %PORT%"

:OPEN
timeout /t 4 /nobreak >nul
start "" "http://127.0.0.1:%PORT%/%ENTRY%#/"
echo.
echo 若浏览器没打开，请手动把下面整行复制到浏览器地址栏：
echo http://127.0.0.1:%PORT%/%ENTRY%#/
echo.
echo 请勿关闭标题为 lighthouse-http 的黑色窗口——关掉后网页会打不开。
pause
