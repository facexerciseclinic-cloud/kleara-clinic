param(
  [string]$EnvFile = ".env.production",
  [switch]$Confirm = $true
)

function Read-EnvFile($path) {
  if (-Not (Test-Path $path)) { Write-Host "Env file $path not found"; return @{} }
  $lines = Get-Content $path | Where-Object { $_ -and $_ -notmatch '^\s*#' }
  $h = @{}
  foreach ($l in $lines) {
    $parts = $l -split '=', 2
    if ($parts.Length -eq 2) { $h[$parts[0].Trim()] = $parts[1].Trim() }
  }
  return $h
}

$envs = Read-EnvFile $EnvFile
if ($envs.Count -eq 0) { Write-Host "No envs to set. Exiting."; exit 1 }

if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
  Write-Host 'vercel CLI not found. Install with: npm i -g vercel' ; exit 1
}

$token = $env:VERCEL_TOKEN
if (-not $token) { Write-Host 'VERCEL_TOKEN not present in environment; vercel will prompt for login if needed.' }

Write-Host 'Setting environment variables on Vercel (production)...'
foreach ($k in $envs.Keys) {
  $v = $envs[$k]
  Write-Host "Setting $k"
  if ($token) {
    # Non-interactive add: echo value into vercel env add
    $proc = Start-Process -FilePath vercel -ArgumentList @('env','add',$k,'production','--token',$token,'--yes') -NoNewWindow -PassThru -RedirectStandardInput "$env:TEMP\vercel_input.txt"
    # If the CLI supports non-interactive, it will pick up --yes
  } else {
    vercel env add $k production --yes
  }
}

if ($Confirm) { Read-Host 'Press Enter to continue to deploy to production (vercel --prod) or Ctrl+C to abort' }

if ($token) {
  vercel --prod --token $token
} else {
  vercel --prod
}
