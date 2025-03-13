@echo off
cd %~dp0\api

REM 检查 Python 是否安装
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 错误: 未找到 python 命令。请确保已安装 Python 3。
    exit /b 1
)

REM 检查依赖是否已安装
python -c "import fastapi" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 正在安装依赖...
    pip install -r requirements.txt
)

REM 启动 API 服务器
echo 正在启动 API 服务器...
python main.py 