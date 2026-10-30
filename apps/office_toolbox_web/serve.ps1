$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:4173/")
$listener.Start()

Write-Host "Serving $root at http://localhost:4173/"

function Get-ContentType([string]$path) {
  switch ([System.IO.Path]::GetExtension($path).ToLowerInvariant()) {
    ".html" { return "text/html; charset=utf-8" }
    ".css" { return "text/css; charset=utf-8" }
    ".js" { return "text/javascript; charset=utf-8" }
    ".json" { return "application/json; charset=utf-8" }
    ".png" { return "image/png" }
    ".jpg" { return "image/jpeg" }
    ".jpeg" { return "image/jpeg" }
    ".svg" { return "image/svg+xml; charset=utf-8" }
    ".ico" { return "image/x-icon" }
    default { return "application/octet-stream" }
  }
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $requestPath = [System.Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart("/"))
    if ([string]::IsNullOrWhiteSpace($requestPath)) {
      $requestPath = "index.html"
    }

    $safeRelative = $requestPath.Replace("/", "\")
    $filePath = Join-Path $root $safeRelative

    if ((Test-Path $filePath) -and -not (Get-Item $filePath).PSIsContainer) {
      $bytes = [System.IO.File]::ReadAllBytes($filePath)
      $context.Response.ContentType = Get-ContentType $filePath
      $context.Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
      $context.Response.ContentLength64 = $bytes.Length
      $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $fallback = Join-Path $root "index.html"
      $bytes = [System.IO.File]::ReadAllBytes($fallback)
      $context.Response.StatusCode = 200
      $context.Response.ContentType = "text/html; charset=utf-8"
      $context.Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
      $context.Response.ContentLength64 = $bytes.Length
      $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    }

    $context.Response.OutputStream.Close()
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
