@echo off
chcp 65001 >nul 2>&1
echo ========================================
echo   WordFormatterPlugin - Uninstall
echo ========================================
echo.

set PUBLISH_XML=%APPDATA%\kingsoft\wps\jsaddons\publish.xml

if exist "%PUBLISH_XML%" (
    del "%PUBLISH_XML%"
    echo Done. Plugin registration removed.
) else (
    echo Plugin registration not found. May not be installed.
)

echo.
echo Please restart WPS to apply changes.
echo.
pause
