param(
    [string]$InstallDir = "$env:LOCALAPPDATA\WordFormatter",
    [string]$ProjectDist = "D:\Claude Code\wordFormatterPlugin\dist",
    [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $InstallDir -PathType Container)) {
    throw "Install directory not found: $InstallDir"
}

if (-not (Test-Path (Join-Path $ProjectDist "index.html") -PathType Leaf)) {
    throw "Project dist not found: $ProjectDist. Run npm run build first."
}

$serverSource = Join-Path "D:\Claude Code\wordFormatterPlugin" "deploy\offline\server.ps1"
$serverTarget = Join-Path $InstallDir "server.ps1"
$webRootConfig = Join-Path $InstallDir "web-root.txt"
$launcher = Join-Path $InstallDir "start-silent.vbs"

Copy-Item $serverSource $serverTarget -Force
Set-Content -Path $webRootConfig -Value $ProjectDist -Encoding UTF8

Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }

Start-Sleep -Seconds 1

if (Test-Path $launcher -PathType Leaf) {
    Start-Process wscript.exe -ArgumentList ('"' + $launcher + '"') -WindowStyle Hidden
}

Start-Sleep -Seconds 2

Write-Output "Linked installed server to: $ProjectDist"
Write-Output "Install dir: $InstallDir"
Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
    Select-Object LocalAddress, LocalPort, State, OwningProcess
