# WordFormatter Plugin - Local HTTP Server
# Serves static files from the web/ subdirectory on localhost:3000
# No dependencies required - uses built-in .NET HttpListener

param([int]$Port = 3000)

$webRoot = Join-Path $PSScriptRoot "web"
$errorActionPreference = "Stop"

if (-not (Test-Path $webRoot -PathType Container)) {
    Write-Host "[ERROR] web directory not found: $webRoot" -ForegroundColor Red
    exit 1
}

$mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.htm'  = 'text/html; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.mjs'  = 'application/javascript; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.gif'  = 'image/gif'
    '.svg'  = 'image/svg+xml'
    '.ico'  = 'image/x-icon'
    '.xml'  = 'text/xml; charset=utf-8'
    '.woff' = 'font/woff'
    '.woff2'= 'font/woff2'
    '.ttf'  = 'font/ttf'
    '.map'  = 'application/json'
}

$listener = New-Object System.Net.HttpListener

try {
    $listener.Prefixes.Add("http://localhost:${Port}/")
    $listener.Start()
}
catch {
    Write-Host "[ERROR] Cannot start server on port ${Port}: $_" -ForegroundColor Red
    Write-Host "  - Check if port ${Port} is already in use" -ForegroundColor Yellow
    Write-Host "  - Run: netstat -ano | findstr `":${Port}`"" -ForegroundColor Yellow
    exit 1
}

Write-Host "WordFormatter server started on http://localhost:${Port}/" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop."

try {
    while ($listener.IsListening) {
        $ctx = $listener.GetContext()
        $req = $ctx.Request
        $resp = $ctx.Response

        $resp.Headers.Add("Access-Control-Allow-Origin", "*")

        if ($req.HttpMethod -eq "OPTIONS") {
            $resp.StatusCode = 204
            $resp.Close()
            continue
        }

        $path = $req.Url.LocalPath
        if ($path -eq "/" -or $path -eq "") { $path = "/index.html" }

        $relative = $path.TrimStart("/").Replace("/", "\")
        $fullPath = Join-Path $webRoot $relative

        # Prevent directory traversal
        try {
            $resolved = (Resolve-Path $fullPath -ErrorAction Stop).Path
            $rootResolved = (Resolve-Path $webRoot -ErrorAction Stop).Path
            if (-not $resolved.StartsWith($rootResolved)) {
                $resp.StatusCode = 403
                $resp.Close()
                continue
            }
        }
        catch {
            $resp.StatusCode = 404
            $resp.Close()
            continue
        }

        if (Test-Path $resolved -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($resolved).ToLower()
            $ct = $mimeTypes[$ext]
            if (-not $ct) { $ct = "application/octet-stream" }

            $bytes = [System.IO.File]::ReadAllBytes($resolved)
            $resp.ContentType = $ct
            $resp.ContentLength64 = $bytes.Length
            $resp.StatusCode = 200
            $resp.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        else {
            $resp.StatusCode = 404
        }

        $resp.Close()
    }
}
catch [System.Net.HttpListenerException] {
    # Listener stopped
}
finally {
    if ($listener.IsListening) { $listener.Stop() }
    Write-Host "Server stopped."
}
