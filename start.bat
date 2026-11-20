@echo off
setlocal
set "ROOT=%~dp0"
cd /d "%ROOT%"

echo ==========================================================
echo   雨落街角 / Rainfall Corner  -  一键启动
echo   后端 http://127.0.0.1:8000   ^|  前端 http://localhost:5199
echo ==========================================================
echo.

set "PATH=C:\Program Files\nodejs;%PATH%"

if not exist "%ROOT%backend\.venv\Scripts\python.exe" goto mkvenv
goto havenv

:mkvenv
echo [1/4] 未找到 backend\.venv，开始创建虚拟环境...
set "PYCMD="
where py >nul 2>nul
if %errorlevel%==0 set "PYCMD=py -3"
if not defined PYCMD (
  where python >nul 2>nul
  if %errorlevel%==0 set "PYCMD=python"
)
if not defined PYCMD (
  echo [错误] 未找到 Python。请安装 Python 3.10 以上版本，并在安装时勾选 "Add Python to PATH"。
  pause
  exit /b 1
)
%PYCMD% -m venv "%ROOT%backend\.venv"
if errorlevel 1 (
  echo [错误] 创建虚拟环境失败。
  pause
  exit /b 1
)

:havenv
echo [1/4] 检查后端依赖...
"%ROOT%backend\.venv\Scripts\python.exe" -c "import fastapi, uvicorn, pydantic, sqlalchemy" >nul 2>nul
if errorlevel 1 (
  echo       安装 backend\requirements.txt ...
  "%ROOT%backend\.venv\Scripts\python.exe" -m pip install -q --disable-pip-version-check -r "%ROOT%backend\requirements.txt"
  if errorlevel 1 (
    echo [错误] 后端依赖安装失败，请检查网络后重试。
    pause
    exit /b 1
  )
)

echo [2/4] 检查前端依赖...
if not exist "%ROOT%frontend\node_modules" (
  echo       首次运行，安装前端依赖（约 1-3 分钟）...
  pushd "%ROOT%frontend"
  call npm install
  popd
  if errorlevel 1 (
    echo [错误] 前端依赖安装失败。请确认已安装 Node.js 18 以上版本。
    pause
    exit /b 1
  )
)

echo [3/4] 检查 8000 端口...
netstat -ano | findstr /r /c:":8000 .*LISTENING" >nul 2>nul
if not errorlevel 1 (
  echo.
  echo [提示] 8000 端口已被别的程序占用，本项目后端无法绑定。
  echo        当前占用情况（最后一列是 PID）：
  netstat -ano ^| findstr /r /c:":8000 .*LISTENING"
  echo.
  echo        处理办法（任选其一）：
  echo          1^) 结束占用进程：  taskkill /PID ^<上面的PID^> /F
  echo          2^) 本项目换端口：  set VITE_API_BASE=http://127.0.0.1:8010
  echo                             并手工用 --port 8010 启动 backend\.venv\Scripts\python.exe -m uvicorn app.main:app
  echo        先关掉占用方再双击本脚本最省事。
  pause
  exit /b 1
)

echo [3/4] 启动后端 API（新窗口）...
start "RainfallCorner-API" cmd /k ""%ROOT%backend\.venv\Scripts\python.exe" -m uvicorn app.main:app --app-dir "%ROOT%backend" --host 127.0.0.1 --port 8000"

echo [4/4] 启动前端（新窗口）...
start "RainfallCorner-Web" cmd /k "cd /d "%ROOT%frontend" && npm run dev"

echo.
echo 等待服务就绪（约 8 秒）...
timeout /t 8 >nul
start "" http://localhost:5199

echo.
echo 已启动：
echo   前端  http://localhost:5199
echo   接口  http://127.0.0.1:8000/docs
echo 关闭弹出的两个窗口即可停止服务。
echo.
pause