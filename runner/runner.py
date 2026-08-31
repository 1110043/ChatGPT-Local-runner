from __future__ import annotations

import json
import os
import subprocess
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

HOST = "127.0.0.1"
PORT = 9029
DEFAULT_TIMEOUT = 60
MAX_OUTPUT = 1024 * 1024
MAX_REQUEST = 16 * 1024 * 1024
LANGUAGES = {"python", "powershell", "cmd", "javascript"}


def command_for(language: str, code: str) -> list[str]:
    mapping = {
        "python": ["python", "-c", code],
        "powershell": ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", code],
        "cmd": ["cmd.exe", "/C", code],
        "javascript": ["node.exe", "-e", code],
    }
    return mapping[language]


class CappedBuffer:
    def __init__(self, limit: int) -> None:
        self.limit = limit
        self.data = bytearray()
        self.truncated = False

    def append(self, chunk: bytes) -> None:
        remaining = self.limit - len(self.data)
        if remaining > 0:
            self.data.extend(chunk[:remaining])
        if len(chunk) > remaining:
            self.truncated = True

    def text(self) -> str:
        return bytes(self.data).decode("utf-8", errors="replace")


def drain(stream: Any, output: CappedBuffer) -> None:
    try:
        while True:
            chunk = stream.read(8192)
            if not chunk:
                break
            output.append(chunk)
    finally:
        stream.close()


def terminate_tree(process: subprocess.Popen[bytes]) -> None:
    if process.poll() is not None:
        return
    try:
        subprocess.run(
            ["taskkill.exe", "/PID", str(process.pid), "/T", "/F"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=5,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        process.kill()


def run_code(language: str, code: str, timeout: int, cwd: str) -> dict[str, Any]:
    if language not in LANGUAGES:
        raise ValueError("不支援的語言")
    if not isinstance(code, str):
        raise ValueError("code 必須是字串")
    if not cwd:
        cwd = os.environ.get("USERPROFILE", os.getcwd())
    workdir = Path(os.path.expandvars(os.path.expanduser(cwd))).resolve()
    if not workdir.is_dir():
        raise ValueError(f"工作目錄不存在：{workdir}")

    started = time.monotonic()
    process = subprocess.Popen(
        command_for(language, code),
        cwd=str(workdir),
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
    )
    stdout = CappedBuffer(MAX_OUTPUT)
    stderr = CappedBuffer(MAX_OUTPUT)
    threads = [
        threading.Thread(target=drain, args=(process.stdout, stdout), daemon=True),
        threading.Thread(target=drain, args=(process.stderr, stderr), daemon=True),
    ]
    for thread in threads:
        thread.start()

    timed_out = False
    try:
        process.wait(timeout=timeout)
    except subprocess.TimeoutExpired:
        timed_out = True
        terminate_tree(process)
        process.wait(timeout=5)
    for thread in threads:
        thread.join(timeout=5)

    return {
        "exitCode": process.returncode,
        "stdout": stdout.text(),
        "stderr": stderr.text(),
        "timedOut": timed_out,
        "outputTruncated": stdout.truncated or stderr.truncated,
        "durationMs": round((time.monotonic() - started) * 1000),
        "cwd": str(workdir),
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "ChatGPTLocalRunner/1.0"

    def send_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_json(204, {})

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/health":
            self.send_json(200, {"ok": True, "port": PORT})
            return
        self.send_json(404, {"error": "Not found"})

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/run":
            self.send_json(404, {"error": "Not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > MAX_REQUEST:
                raise ValueError("請求內容大小不合法")
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            language = str(payload.get("language", "")).lower()
            code = payload.get("code", "")
            timeout = min(600, max(1, int(payload.get("timeout", DEFAULT_TIMEOUT))))
            cwd = str(payload.get("cwd", ""))
            self.send_json(200, run_code(language, code, timeout, cwd))
        except (ValueError, KeyError, json.JSONDecodeError, OSError) as error:
            self.send_json(400, {"error": str(error)})
        except Exception as error:  # Keep HTTP server alive for unexpected child-process errors.
            self.send_json(500, {"error": str(error)})

    def log_message(self, format: str, *args: Any) -> None:
        print(f"[{self.log_date_time_string()}] {format % args}")


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"ChatGPT Local Runner listening on http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Stopping…")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
