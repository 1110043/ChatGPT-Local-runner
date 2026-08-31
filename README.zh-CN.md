# ChatGPT 本地运行工具

[繁體中文](README.md) | [简体中文](README.zh-CN.md) | [English](README.en.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

这是一个 Windows 本地工具，会在 `https://chatgpt.com/` 的受支持代码块旁添加 `▼` 按钮。点击后，代码会通过 `127.0.0.1:9029` 发送给本地 Runner 执行，并在代码块下方显示 stdout/stderr。

## 支持的语言

| ChatGPT 代码块标签 | 本地命令 |
|---|---|
| `python`、`py` | `python -c` |
| `powershell`、`pwsh`、`ps1` | `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command` |
| `cmd`、`bat` | `cmd.exe /C` |
| `javascript`、`js`、`node` | `node.exe -e` |

语言匹配不区分大小写。其他语言会显示禁用的按钮，不会被执行。

## 构建

要求：Windows、Python 3.12、Node.js（如果需要执行 JavaScript）以及 PowerShell。

在此文件夹中打开 PowerShell：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\build.ps1
```

构建后的可执行文件位于 `dist\ChatGPTLocalRunner.exe`。构建脚本使用 PyInstaller 生成单个 EXE；如果当前 Python 3.12 环境中没有安装 PyInstaller，会先安装它。

## 使用方法

最简单的方法是双击 `dist\ChatGPTLocalRunner.exe`，并保持窗口运行。

同一时间只能有一个进程监听 `127.0.0.1:9029`。如果启动 EXE 时显示端口已被占用，请先关闭其他 Local Runner；如果本机已经有兼容的 Runner 在运行，则可以直接使用它，不要再启动第二个 Runner。

也可以运行 `.\install.ps1`。它会将 EXE 复制到 `%LOCALAPPDATA%\ChatGPTLocalRunner`，并创建桌面快捷方式。

然后：

1. 打开 Chrome，进入 `chrome://extensions/`。
2. 开启“开发者模式”。
3. 点击“加载已解压的扩展程序”，选择此文件夹中的 `extension` 文件夹。
4. 打开或刷新 `https://chatgpt.com/`。
5. 点击 Chrome 工具栏中的扩展程序图标，可以修改 timeout 和工作目录。

Runner 默认监听 `127.0.0.1:9029`，默认 timeout 为 60 秒，默认工作目录为 `%USERPROFILE%`。发生 timeout 时，Runner 会终止整个进程树；stdout 和 stderr 的大小均限制为约 1 MiB。

## 卸载

运行：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\uninstall.ps1
```

然后进入 `chrome://extensions/`，移除“ChatGPT 本机执行”。

## 手动测试 Runner

启动 EXE 后，可以在 PowerShell 中运行：

```powershell
Invoke-RestMethod http://127.0.0.1:9029/health
Invoke-RestMethod http://127.0.0.1:9029/run -Method Post -ContentType 'application/json' -Body (@{ language='python'; code='print("hello")'; timeout=60; cwd='' } | ConvertTo-Json)
```

## 已知范围

- 按照需求，此版本未加入完整的权限提示、沙盒或允许列表；请仅执行你确认过的代码。
- 如果 ChatGPT 的代码块 DOM 发生变化，Content Script 会使用涉及 `pre`、工具栏按钮和语言标签的多层回退查找策略；如果网站结构发生彻底变化，可能需要更新选择器。
- 源代码使用 DOM `textContent` 获取代码，保留换行、缩进、Unicode 和空白，而不是使用 innerHTML 重建代码。
