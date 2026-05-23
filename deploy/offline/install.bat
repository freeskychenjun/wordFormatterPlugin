@echo off
chcp 65001 >nul 2>&1

echo ========================================
echo   WordFormatter - Offline Install
echo ========================================
echo.

set "INSTALL_DIR=%LOCALAPPDATA%\WordFormatter"

REM ---- Check web files exist ----
if not exist "%~dp0web\index.html" (
    echo [ERROR] web\index.html not found.
    echo Put this script next to the web folder.
    pause
    exit /b 1
)

REM ---- Stop existing server ----
echo Stopping existing server on port 3000...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000.*LISTENING"') do taskkill /PID %%a /F >nul 2>&1
echo.

REM ---- Install files ----
echo Install directory: %INSTALL_DIR%
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if not exist "%INSTALL_DIR%\web" mkdir "%INSTALL_DIR%\web"

echo Copying web files...
xcopy /E /Y /Q "%~dp0web" "%INSTALL_DIR%\web\" >nul
copy /Y "%~dp0server.ps1" "%INSTALL_DIR%\server.ps1" >nul
echo Done.
echo.

REM ---- Create silent launcher VBS ----
echo Creating launcher...
echo Set WshShell = CreateObject("WScript.Shell")> "%INSTALL_DIR%\start-silent.vbs"
echo WshShell.Run "powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File ""%INSTALL_DIR%\server.ps1""", 0, False>> "%INSTALL_DIR%\start-silent.vbs"

REM ---- Startup shortcut ----
echo Setting up auto-start...
set "SHORTCUT=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\WordFormatter.lnk"
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut('%SHORTCUT%'); $sc.TargetPath='wscript.exe'; $sc.Arguments='\"%INSTALL_DIR%\start-silent.vbs\"'; $sc.WindowStyle=7; $sc.Save()" >nul 2>&1

REM ---- Register with WPS ----
echo Registering with WPS...
set "JSADDONS=%APPDATA%\kingsoft\wps\jsaddons"
if not exist "%JSADDONS%" mkdir "%JSADDONS%"

echo ^<?xml version="1.0" encoding="UTF-8"?^>> "%JSADDONS%\publish.xml"
echo ^<jsplugins^>>> "%JSADDONS%\publish.xml"
echo ^<jspluginonline name="wordformatterplugin" type="wps" url="http://localhost:3000/" debug="" enable="enable_dev" install="null" /^>>> "%JSADDONS%\publish.xml"
echo ^</jsplugins^>>> "%JSADDONS%\publish.xml"

REM ---- Start server now ----
echo Starting server...
wscript "%INSTALL_DIR%\start-silent.vbs"

REM ---- Wait and verify ----
timeout /t 2 /nobreak >nul
netstat -ano 2>nul | findstr ":3000.*LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo.
    echo ========================================
    echo   Install success!
    echo ========================================
    echo.
    echo   Server: http://localhost:3000/
    echo   Files:  %INSTALL_DIR%
    echo   Auto-start on login: Yes
    echo.
    echo   Next steps:
    echo     1. Restart WPS
    echo     2. Look for the tab in ribbon
    echo.
) else (
    echo.
    echo [WARNING] Server may need a moment to start.
    echo   Run manually: wscript "%INSTALL_DIR%\start-silent.vbs"
    echo.
)

pause
