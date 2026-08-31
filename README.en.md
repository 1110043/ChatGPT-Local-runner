# ChatGPT Local Runner

[繁體中文](README.md) | [简体中文](README.zh-CN.md) | [English](README.en.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

This is a Windows local tool that adds a `▼` button next to supported code blocks on `https://chatgpt.com/`. When clicked, the code is sent to the local Runner through `127.0.0.1:9029` for execution, and stdout/stderr are displayed below the code block.

## Supported Languages

| ChatGPT code block tag | Local command |
|---|---|
| `python`, `py` | `python -c` |
| `powershell`, `pwsh`, `ps1` | `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command` |
| `cmd`, `bat` | `cmd.exe /C` |
| `javascript`, `js`, `node` | `node.exe -e` |

Language matching is case-insensitive. Other languages display a disabled button and will not be executed.

## Build

Requirements: Windows, Python 3.12, Node.js (if JavaScript execution is required), and PowerShell.

Open PowerShell in this directory:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\build.ps1
```

The built executable is located at `dist\ChatGPTLocalRunner.exe`. The build script uses PyInstaller to create a single EXE; if PyInstaller is not installed for the current Python 3.12 installation, it will install it first.

## Usage

The simplest method is to double-click `dist\ChatGPTLocalRunner.exe` and keep the window running.

Only one process can listen on `127.0.0.1:9029` at a time. If the EXE reports that the port is already in use, close any other Local Runner first. If a compatible Runner is already running locally, you can use it directly; do not start a second Runner.

You can also run `.\install.ps1`. It copies the EXE to `%LOCALAPPDATA%\ChatGPTLocalRunner` and creates a desktop shortcut.

Then:

1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `extension` folder in this directory.
4. Open or refresh `https://chatgpt.com/`.
5. Click the Extension icon in the Chrome toolbar to change the timeout and working directory.

The Runner listens on `127.0.0.1:9029` by default, with a default timeout of 60 seconds and a default working directory of `%USERPROFILE%`. On timeout, the Runner terminates the entire process tree. stdout and stderr are each limited to approximately 1 MiB.

## Uninstallation

Run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\uninstall.ps1
```

Then go to `chrome://extensions/` and remove **ChatGPT 本機執行**.

## Manual Runner Test

After starting the EXE, run the following in PowerShell:

```powershell
Invoke-RestMethod http://127.0.0.1:9029/health
Invoke-RestMethod http://127.0.0.1:9029/run -Method Post -ContentType 'application/json' -Body (@{ language='python'; code='print("hello")'; timeout=60; cwd='' } | ConvertTo-Json)
```

## Known Scope

- As required, this version does not include complete permission prompts, sandboxing, or an allowlist; only execute code you have verified.
- If ChatGPT's code block DOM changes, the Content Script uses multiple fallback lookup strategies involving `pre`, the toolbar button, and the language label. If the website structure changes completely, the selectors may need to be updated.
- The source code obtains code through DOM `textContent`, preserving line breaks, indentation, Unicode, and whitespace rather than reconstructing the code with innerHTML.
