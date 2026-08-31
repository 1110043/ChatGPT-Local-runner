$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$exe = Join-Path $root 'dist\ChatGPTLocalRunner.exe'
if (-not (Test-Path -LiteralPath $exe)) { & (Join-Path $root 'build.ps1') }
$installDir = Join-Path $env:LOCALAPPDATA 'ChatGPTLocalRunner'
New-Item -ItemType Directory -Path $installDir -Force | Out-Null
Copy-Item -LiteralPath $exe -Destination (Join-Path $installDir 'ChatGPTLocalRunner.exe') -Force
$shortcutPath = Join-Path ([Environment]::GetFolderPath('Desktop')) 'ChatGPT Local Runner.lnk'
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = Join-Path $installDir 'ChatGPTLocalRunner.exe'
$shortcut.WorkingDirectory = $installDir
$shortcut.Description = '啟動 ChatGPT 本機執行 Runner'
$shortcut.Save()
Write-Host "已安裝到：$installDir"
Write-Host "桌面捷徑：$shortcutPath"
