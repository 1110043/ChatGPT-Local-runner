$ErrorActionPreference = 'Stop'
$installDir = Join-Path $env:LOCALAPPDATA 'ChatGPTLocalRunner'
$shortcutPath = Join-Path ([Environment]::GetFolderPath('Desktop')) 'ChatGPT Local Runner.lnk'
Get-Process -Name 'ChatGPTLocalRunner' -ErrorAction SilentlyContinue | Stop-Process -Force
if (Test-Path -LiteralPath $shortcutPath) { Remove-Item -LiteralPath $shortcutPath -Force }
if (Test-Path -LiteralPath $installDir) { Remove-Item -LiteralPath $installDir -Recurse -Force }
Write-Host 'ChatGPT Local Runner 已解除安裝。'
