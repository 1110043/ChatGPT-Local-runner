# ChatGPT 로컬 Runner

[繁體中文](README.md) | [简体中文](README.zh-CN.md) | [English](README.en.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

Windows용 로컬 도구입니다. `https://chatgpt.com/`의 지원되는 코드 블록 옆에 `▼` 버튼을 추가합니다. 버튼을 클릭하면 코드가 `127.0.0.1:9029`를 통해 로컬 Runner로 전송되어 실행되며, stdout/stderr가 코드 블록 아래에 표시됩니다.

## 지원 언어

| ChatGPT 코드 블록 태그 | 로컬 명령 |
|---|---|
| `python`, `py` | `python -c` |
| `powershell`, `pwsh`, `ps1` | `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command` |
| `cmd`, `bat` | `cmd.exe /C` |
| `javascript`, `js`, `node` | `node.exe -e` |

언어 일치는 대소문자를 구분하지 않습니다. 그 외의 언어에서는 비활성화된 버튼이 표시되며 실행되지 않습니다.

## 빌드

요구 사항: Windows, Python 3.12, Node.js(JavaScript 실행이 필요한 경우), PowerShell.

이 폴더에서 PowerShell을 엽니다.

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\build.ps1
```

빌드된 실행 파일은 `dist\ChatGPTLocalRunner.exe`에 있습니다. 빌드 스크립트는 PyInstaller를 사용하여 단일 EXE를 생성합니다. 현재 Python 3.12 환경에 PyInstaller가 설치되어 있지 않으면 먼저 설치합니다.

## 사용 방법

가장 간단한 방법은 `dist\ChatGPTLocalRunner.exe`를 더블 클릭하고 창을 계속 실행 상태로 두는 것입니다.

동시에 `127.0.0.1:9029`를 수신할 수 있는 프로세스는 하나뿐입니다. EXE를 시작할 때 포트가 이미 사용 중이라고 표시되면 먼저 다른 Local Runner를 종료하십시오. 현재 로컬에서 호환되는 Runner가 이미 실행 중이라면 그대로 사용할 수 있으며, 두 번째 Runner를 시작하지 마십시오.

`.\install.ps1`을 실행할 수도 있습니다. 이 스크립트는 EXE를 `%LOCALAPPDATA%\ChatGPTLocalRunner`에 복사하고 바탕 화면 바로 가기를 만듭니다.

그다음:

1. Chrome을 열고 `chrome://extensions/`로 이동합니다.
2. **개발자 모드**를 활성화합니다.
3. **압축해제된 확장 프로그램을 로드**를 클릭하고 이 폴더의 `extension` 폴더를 선택합니다.
4. `https://chatgpt.com/`을 열거나 새로 고칩니다.
5. Chrome 도구 모음의 확장 프로그램 아이콘을 클릭하여 timeout과 작업 디렉터리를 변경할 수 있습니다.

Runner는 기본적으로 `127.0.0.1:9029`에서 수신하며, 기본 timeout은 60초이고 기본 작업 디렉터리는 `%USERPROFILE%`입니다. timeout이 발생하면 Runner는 전체 process tree를 종료합니다. stdout과 stderr는 각각 약 1 MiB로 제한됩니다.

## 제거

실행:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\uninstall.ps1
```

그런 다음 `chrome://extensions/`로 이동하여 **ChatGPT 本機執行**을 제거합니다.

## Runner 수동 테스트

EXE를 시작한 후 PowerShell에서 다음을 실행할 수 있습니다.

```powershell
Invoke-RestMethod http://127.0.0.1:9029/health
Invoke-RestMethod http://127.0.0.1:9029/run -Method Post -ContentType 'application/json' -Body (@{ language='python'; code='print("hello")'; timeout=60; cwd='' } | ConvertTo-Json)
```

## 알려진 범위

- 요구 사항에 따라 이 버전에는 완전한 권한 프롬프트, 샌드박스 또는 허용 목록이 포함되어 있지 않습니다. 확인한 코드만 실행하십시오.
- ChatGPT의 코드 블록 DOM이 변경되면 Content Script는 `pre`, 도구 모음 버튼 및 언어 레이블을 활용한 여러 단계의 대체 검색 전략을 사용합니다. 웹 사이트 구조가 완전히 변경되면 선택자를 업데이트해야 할 수 있습니다.
- 소스 코드는 DOM의 `textContent`를 사용하여 코드를 가져오며, `innerHTML`로 코드를 다시 구성하지 않고 줄 바꿈, 들여쓰기, Unicode 및 공백을 유지합니다.
