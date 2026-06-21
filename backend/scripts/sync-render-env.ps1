# Sync backend/.env vars to Render (requires RENDER_API_KEY in environment)
# Usage: $env:RENDER_API_KEY="rnd_..."; .\scripts\sync-render-env.ps1

$ErrorActionPreference = "Stop"
$ServiceId = "srv-d8idu0vlk1mc7382kgog"
$EnvFile = Join-Path $PSScriptRoot ".." ".env"

if (-not $env:RENDER_API_KEY) {
  Write-Error "Set RENDER_API_KEY first (Render Dashboard -> Account Settings -> API Keys)"
}

function Read-DotEnv($path) {
  $map = @{}
  Get-Content $path | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
    $idx = $_.IndexOf('=')
    if ($idx -lt 1) { return }
    $k = $_.Substring(0, $idx).Trim()
    $v = $_.Substring($idx + 1).Trim()
    $map[$k] = $v
  }
  return $map
}

$envMap = Read-DotEnv $EnvFile
$keys = @(
  "AI_PRIMARY_PROVIDER",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "OPENAI_FALLBACK_ENABLED",
  "META_VERIFY_TOKEN",
  "META_APP_SECRET",
  "META_PHONE_NUMBER_ID",
  "META_WABA_ID",
  "FRONTEND_URL",
  "ALLOWED_ORIGINS"
)

$payload = @()
foreach ($k in $keys) {
  if ($envMap.ContainsKey($k) -and $envMap[$k]) {
    $payload += @{ key = $k; value = $envMap[$k] }
  }
}

if ($payload.Count -eq 0) {
  Write-Error "No env values to sync. Fill backend/.env (especially META_APP_SECRET, OPENAI_API_KEY)."
}

$body = @{ envVars = $payload } | ConvertTo-Json -Depth 5
$headers = @{
  Authorization = "Bearer $($env:RENDER_API_KEY)"
  "Content-Type" = "application/json"
}

Write-Host "Updating Render service $ServiceId ..."
Invoke-RestMethod -Uri "https://api.render.com/v1/services/$ServiceId/env-vars" -Method Put -Headers $headers -Body $body | Out-Null

Write-Host "Triggering deploy..."
Invoke-RestMethod -Uri "https://api.render.com/v1/services/$ServiceId/deploys" -Method Post -Headers $headers -Body '{}' | Out-Null
Write-Host "Done. Render redeploy started."
