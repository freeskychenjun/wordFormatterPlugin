@echo off
chcp 65001 >nul 2>&1

echo ========================================
echo   WordFormatterPlugin - Install
echo ========================================
echo.

set "ADDON_URL=http://172.14.60.197:3000/"

if not "%~1"=="" set "ADDON_URL=%~1"

if not "%ADDON_URL:~-1%"=="/" set "ADDON_URL=%ADDON_URL%/"

echo Plugin URL: %ADDON_URL%
echo.

set "JSADDONS=%APPDATA%\kingsoft\wps\jsaddons"

if not exist "%JSADDONS%" mkdir "%JSADDONS%"

> "%JSADDONS%\publish.xml" echo ^<?xml version="1.0" encoding="UTF-8"?^>^<jsplugins^>^<jspluginonline name="wordformatterplugin" type="wps" url="%ADDON_URL%" debug="" enable="enable_dev" install="null" /^>^</jsplugins^>

if exist "%JSADDONS%\publish.xml" (
    echo Install success!
    echo.
    echo Next steps:
    echo   1. Restart WPS
    echo   2. Open WPS -^> Options -^> Add-ins (COM Add-ins)
    echo   3. Find "wordformatterplugin" and click Enable
    echo   4. The "WordFormatter" tab will appear in the ribbon
) else (
    echo Install failed. Check permissions.
)

echo.
pause
