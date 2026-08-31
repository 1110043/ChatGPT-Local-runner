# ChatGPT 本機執行工具

這是一個 Windows 本機工具，會在 `https://chatgpt.com/` 的支援程式碼區塊旁加入 `▼` 按鈕。按下後，程式碼會經由 `127.0.0.1:9029` 傳給本機 Runner 執行，並在程式碼下方顯示 stdout/stderr。

## 支援語言

| ChatGPT 程式碼標籤 | 本機命令 |
|---|---|
| `python`、`py` | `python -c` |
| `powershell`、`pwsh`、`ps1` | `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command` |
| `cmd`、`bat` | `cmd.exe /C` |
| `javascript`、`js`、`node` | `node.exe -e` |

語言比對不分大小寫。其他語言會顯示停用的按鈕，不會執行。

## 建置

需求：Windows、Python 3.12、Node.js（若要執行 JavaScript）、PowerShell。

在本資料夾開啟 PowerShell：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\build.ps1
```

建置後的執行檔位於 `dist\ChatGPTLocalRunner.exe`。建置腳本會使用 PyInstaller 產生單一 EXE；若目前 Python 3.12 沒有 PyInstaller，會先安裝它。

## 使用方式

最簡單方式：雙擊 `dist\ChatGPTLocalRunner.exe`，保持視窗執行。

同一時間只能有一個程式監聽 `127.0.0.1:9029`。如果啟動 EXE 時顯示連接埠被占用，請先關閉其他 Local Runner；本機目前若已有相容的 Runner 在執行，則可直接使用它，不要再啟動第二個 Runner。

也可以執行 `.\install.ps1`，它會把 EXE 複製到 `%LOCALAPPDATA%\ChatGPTLocalRunner` 並建立桌面捷徑。

接著：

1. 開啟 Chrome，進入 `chrome://extensions/`。
2. 開啟「開發人員模式」。
3. 按「載入未封裝項目」，選擇本資料夾的 `extension` 資料夾。
4. 開啟或重新整理 `https://chatgpt.com/`。
5. 點擊 Chrome 工具列的 Extension 圖示，可修改 timeout 與工作目錄。

Runner 預設監聽 `127.0.0.1:9029`，預設 timeout 為 60 秒，預設工作目錄為 `%USERPROFILE%`。Runner 會在 timeout 時終止整個 process tree，stdout 與 stderr 各限制約 1 MiB。

## 解除安裝

執行：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\uninstall.ps1
```

再到 `chrome://extensions/` 移除「ChatGPT 本機執行」。

## 手動測試 Runner

啟動 EXE 後，可在 PowerShell 執行：

```powershell
Invoke-RestMethod http://127.0.0.1:9029/health
Invoke-RestMethod http://127.0.0.1:9029/run -Method Post -ContentType 'application/json' -Body (@{ language='python'; code='print("hello")'; timeout=60; cwd='' } | ConvertTo-Json)
```

## 已知範圍

- 本版本依需求未加入完整權限提示、沙盒或信任清單；請只執行你確認過的程式碼。
- ChatGPT 的 code block DOM 若變更，Content Script 會使用 `pre`、工具列按鈕與語言標籤的多層退回查找；若網站完全改變結構，可能需要更新選擇器。
- 原始碼使用 DOM `textContent` 取得，保留換行、縮排、Unicode 與空白，不使用 innerHTML 重建程式碼。
