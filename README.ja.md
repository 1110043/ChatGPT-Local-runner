# ChatGPT ローカル Runner

[繁體中文](README.md) | [简体中文](README.zh-CN.md) | [English](README.en.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

これは Windows 向けのローカルツールです。`https://chatgpt.com/` の対応するコードブロックの横に `▼` ボタンを追加します。クリックすると、コードは `127.0.0.1:9029` を介してローカル Runner に送信されて実行され、stdout/stderr がコードブロックの下に表示されます。

## 対応言語

| ChatGPT コードブロックのタグ | ローカルコマンド |
|---|---|
| `python`、`py` | `python -c` |
| `powershell`、`pwsh`、`ps1` | `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command` |
| `cmd`、`bat` | `cmd.exe /C` |
| `javascript`、`js`、`node` | `node.exe -e` |

言語の照合では大文字と小文字を区別しません。その他の言語では無効化されたボタンが表示され、実行されません。

## ビルド

必要環境：Windows、Python 3.12、Node.js（JavaScript の実行が必要な場合）、PowerShell。

このフォルダーで PowerShell を開きます：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\build.ps1
```

ビルドされた実行ファイルは `dist\ChatGPTLocalRunner.exe` にあります。ビルドスクリプトは PyInstaller を使用して単一の EXE を生成します。現在の Python 3.12 環境に PyInstaller がインストールされていない場合は、先にインストールします。

## 使用方法

最も簡単な方法は、`dist\ChatGPTLocalRunner.exe` をダブルクリックして、ウィンドウを開いたままにすることです。

同時に `127.0.0.1:9029` をリッスンできるプロセスは 1 つだけです。EXE の起動時にポートが使用中であると表示された場合は、先に他の Local Runner を終了してください。ローカルですでに互換性のある Runner が実行されている場合は、それをそのまま使用し、2 つ目の Runner を起動しないでください。

`.\install.ps1` を実行することもできます。EXE を `%LOCALAPPDATA%\ChatGPTLocalRunner` にコピーし、デスクトップショートカットを作成します。

その後：

1. Chrome を開き、`chrome://extensions/` に移動します。
2. 「デベロッパーモード」を有効にします。
3. 「パッケージ化されていない拡張機能を読み込む」をクリックし、このフォルダー内の `extension` フォルダーを選択します。
4. `https://chatgpt.com/` を開くか、ページを再読み込みします。
5. Chrome ツールバーの拡張機能アイコンをクリックすると、timeout と作業ディレクトリを変更できます。

Runner はデフォルトで `127.0.0.1:9029` をリッスンし、デフォルトの timeout は 60 秒、デフォルトの作業ディレクトリは `%USERPROFILE%` です。timeout が発生すると、Runner はプロセスツリー全体を終了します。stdout と stderr はそれぞれ約 1 MiB に制限されます。

## アンインストール

実行：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\uninstall.ps1
```

その後、`chrome://extensions/` に移動して「ChatGPT 本機執行」を削除します。

## Runner の手動テスト

EXE を起動した後、PowerShell で次を実行できます：

```powershell
Invoke-RestMethod http://127.0.0.1:9029/health
Invoke-RestMethod http://127.0.0.1:9029/run -Method Post -ContentType 'application/json' -Body (@{ language='python'; code='print("hello")'; timeout=60; cwd='' } | ConvertTo-Json)
```

## 既知の範囲

- 要件に従い、このバージョンには完全な権限プロンプト、サンドボックス、または許可リストは含まれていません。確認済みのコードのみを実行してください。
- ChatGPT のコードブロック DOM が変更された場合、Content Script は `pre`、ツールバーボタン、言語ラベルを利用した複数段階のフォールバック検索を使用します。Web サイトの構造が完全に変更された場合は、セレクターの更新が必要になる可能性があります。
- ソースコードは DOM の `textContent` を使用してコードを取得し、`innerHTML` でコードを再構築することなく、改行、インデント、Unicode、空白を保持します。
