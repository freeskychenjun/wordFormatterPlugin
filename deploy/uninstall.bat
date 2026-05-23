@echo off
chcp 65001 >nul 2>&1
echo ========================================
echo   文档排版助手 - 卸载插件
echo ========================================
echo.

set PUBLISH_XML=%APPDATA%\kingsoft\wps\jsaddons\publish.xml

if exist "%PUBLISH_XML%" (
    del "%PUBLISH_XML%"
    echo 已删除插件注册信息。
) else (
    echo 未找到插件注册信息，可能未安装。
)

echo.
echo 请重启 WPS 使更改生效。
echo.
pause
