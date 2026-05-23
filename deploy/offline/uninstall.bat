@echo off
chcp 65001 >nul 2>&1

echo ========================================
echo   文档排版助手 - 离线版卸载
echo ========================================
echo.

REM ---- Stop server ----
echo Stopping server...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000.*LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)

REM ---- Remove startup shortcut ----
echo Removing auto-start...
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\WordFormatter.lnk" >nul 2>&1

REM ---- Unregister from WPS ----
echo Unregistering from WPS...
set "JSADDONS=%APPDATA%\kingsoft\wps\jsaddons"
if exist "%JSADDONS%\publish.xml" del "%JSADDONS%\publish.xml"

REM ---- Remove installed files ----
echo Removing files...
set "INSTALL_DIR=%LOCALAPPDATA%\WordFormatter"
if exist "%INSTALL_DIR%" (
    rmdir /S /Q "%INSTALL_DIR%"
    echo Files removed.
) else (
    echo No installation found.
)

echo.
echo Uninstall complete! Please restart WPS.
echo.
pause
