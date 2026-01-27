@echo off
REM PM2 Startup Script for Windows
REM Run this script when Windows boots to start your server

cd /d "C:\Users\vinee\OneDrive\Desktop\AI-Powered-Mobile-Stock-Screener-and-Advisory-Platform\backend"
pm2 start ecosystem.config.js
exit
