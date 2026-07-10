@echo off
chcp 65001 >nul
cd /d "%~dp0"

set STUDIO=D:\andriod-studio\bin\studio64.exe
set PROJECT=%~dp0android

if not exist "%STUDIO%" (
  echo [错误] 未找到 Android Studio：%STUDIO%
  echo 请确认安装路径，或手动打开 Android Studio 后选择 Open → android 文件夹
  pause
  exit /b 1
)

echo ========================================
echo   小说助手 · 打开安卓工程
echo ========================================
echo.
echo Android Studio: %STUDIO%
echo 工程目录:       %PROJECT%
echo.

where node >nul 2>&1
if not errorlevel 1 (
  echo [1/2] 同步最新网页资源到安卓工程...
  call npm run android:sync
  if errorlevel 1 (
    echo [警告] 同步失败，仍会打开 Android Studio
  )
) else (
  echo [跳过] 未检测到 Node，直接打开工程
)

echo.
echo [2/2] 正在启动 Android Studio...
echo.
echo 若首次打开提示缺少 SDK：
echo   1. 按提示安装 Android SDK
echo   2. SDK 建议装到：C:\Users\wcl\AppData\Local\Android\Sdk
echo   3. 安装完成后点 Sync Project with Gradle Files
echo   4. 连接手机或启动模拟器，点绿色 Run
echo.

start "" "%STUDIO%" "%PROJECT%"
echo 已启动 Android Studio。
pause
