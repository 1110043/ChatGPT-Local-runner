$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$runnerDir = Join-Path $root 'runner'
$distDir = Join-Path $root 'dist'
$py = (Get-Command py -ErrorAction Stop).Source

Write-Host '檢查 Python runner 語法…'
& $py -3.12 -m py_compile (Join-Path $runnerDir 'runner.py')

if (-not (Get-Command pyinstaller -ErrorAction SilentlyContinue)) {
  Write-Host '找不到 PyInstaller，安裝到目前 Python 3.12 使用者環境…'
  & $py -3.12 -m pip install --user pyinstaller
}

Remove-Item -LiteralPath $distDir -Recurse -Force -ErrorAction SilentlyContinue
$spec = Join-Path $runnerDir 'runner.spec'
& $py -3.12 -m PyInstaller --clean --noconfirm --onefile --name ChatGPTLocalRunner --distpath $distDir --workpath (Join-Path $root 'build') --specpath $runnerDir (Join-Path $runnerDir 'runner.py')
if (-not (Test-Path -LiteralPath (Join-Path $distDir 'ChatGPTLocalRunner.exe'))) {
  throw 'PyInstaller 沒有產生 ChatGPTLocalRunner.exe'
}
Write-Host "完成：$distDir\ChatGPTLocalRunner.exe"
