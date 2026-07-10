@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   小说助手 · 同步并打开安卓工程
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [错误] 未找到 Node.js，请先安装：https://nodejs.org
  pause
  exit /b 1
)

echo [1/2] 构建网页并同步到 android ...
call npm run android:sync
if errorlevel 1 (
  echo [错误] 同步失败
  pause
  exit /b 1
)

echo.
echo [2/2] 打开 Android Studio ...
call npm run android:open
if errorlevel 1 (
  echo.
  echo 若未自动打开，请手动用 Android Studio 打开本目录下的 android 文件夹。
  echo 详见 ANDROID.md
)

echo.
echo 完成。在 Android Studio 中点击 Run 即可安装到手机/模拟器。
pause
