@echo off
cd /d "%~dp0"
echo 正在启动「小说助手」...
start http://localhost:5173
npm run dev
