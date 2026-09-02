#!/usr/bin/env bash
# 升格智能论文系统 - Linux 服务器一键部署脚本
# 用法: bash deploy.sh [端口]   默认端口 80
set -euo pipefail

PORT="${1:-80}"
APP_NAME="shengge-ai-paper"

command -v docker >/dev/null 2>&1 || {
  echo "未检测到 Docker，请先安装: https://docs.docker.com/engine/install/"
  exit 1
}

echo "==> 构建 ${APP_NAME} 镜像（含前端生产构建）"
docker build -t "${APP_NAME}:latest" .

echo "==> 停止并移除旧容器（如存在）"
docker rm -f "${APP_NAME}" >/dev/null 2>&1 || true

echo "==> 启动容器，端口映射: ${PORT}:80"
docker run -d \
  --name "${APP_NAME}" \
  --restart unless-stopped \
  -p "${PORT}:80" \
  "${APP_NAME}:latest"

echo "==> 部署完成"
echo "访问地址: http://<服务器IP>${PORT:+:${PORT}}"
