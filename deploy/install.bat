@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo ========================================
echo   文档排版助手 - 安装插件
echo ========================================
echo.

:: 检查是否有参数传入URL
if "%~1"=="" (
    echo 错误：请提供插件地址
    echo.
    echo 用法：install.bat ^<插件地址^>
    echo 示例：install.bat http://192.168.1.100/formatter/
    echo.
    pause
    exit /b 1
)

set ADDON_URL=%~1

:: 确保URL以/结尾
if not "%ADDON_URL:~-1%"=="/" set ADDON_URL=%ADDON_URL%/

set JSADDONS=%APPDATA%\kingsoft\wps\jsaddons

if not exist "%JSADDONS%" mkdir "%JSADDONS%"

:: 写入 publish.xml
echo ^<?xml version="1.0" encoding="UTF-8"?^>^<jsplugins^>^<jspluginonline name="wordformatterplugin" type="wps" url="%ADDON_URL%" enable="enable_dev" /^>^</jsplugins^> > "%JSADDONS%\publish.xml"

if exist "%JSADDONS%\publish.xml" (
    echo.
    echo 安装成功！
    echo 插件地址：%ADDON_URL%
    echo.
    echo 请重启 WPS，功能区将出现"文档排版"标签页。
) else (
    echo.
    echo 安装失败，请检查权限。
)

echo.
pause
