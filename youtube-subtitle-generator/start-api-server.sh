#!/bin/bash

# 进入 API 目录
cd "$(dirname "$0")/api"

# 检查 Python 是否安装
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到 python3 命令。请确保已安装 Python 3。"
    exit 1
fi

# 检查依赖是否已安装
if ! python3 -c "import fastapi" &> /dev/null; then
    echo "正在安装依赖..."
    pip3 install -r requirements.txt
fi

# 启动 API 服务器
echo "正在启动 API 服务器..."
python3 main.py 