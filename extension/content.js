(() => {
  'use strict';

  const RUNNER_URL = 'http://127.0.0.1:9029';
  const DEFAULTS = { timeout: 60, cwd: '' };
  const SUPPORTED = new Map([
    ['python', 'python'], ['py', 'python'],
    ['powershell', 'powershell'], ['pwsh', 'powershell'], ['ps1', 'powershell'],
    ['cmd', 'cmd'], ['bat', 'cmd'],
    ['javascript', 'javascript'], ['js', 'javascript'], ['node', 'javascript']
  ]);

  const settings = { ...DEFAULTS };

  function normalizeLanguage(value) {
    const first = String(value || '').trim().toLowerCase().split(/[\s./\\]+/, 1)[0];
    return SUPPORTED.get(first) || null;
  }

  async function getSettings() {
    const stored = await chrome.storage.local.get(DEFAULTS);
    settings.timeout = Number.isFinite(Number(stored.timeout)) ? Number(stored.timeout) : DEFAULTS.timeout;
    settings.cwd = typeof stored.cwd === 'string' ? stored.cwd : DEFAULTS.cwd;
  }

  function findToolbar(pre) {
    const shell = pre.querySelector('div.relative.w-full.mt-4.mb-1');
    if (shell) {
      return Array.from(shell.querySelectorAll('div')).find((element) => {
        const directButtons = Array.from(element.children).filter((child) => child.tagName === 'BUTTON');
        return directButtons.length > 0;
      }) || null;
    }
    let root = pre.parentElement;
    for (let depth = 0; root && depth < 4; depth += 1, root = root.parentElement) {
      const toolbar = Array.from(root.querySelectorAll('div')).find((element) => {
        const directButtons = Array.from(element.children).filter((child) => child.tagName === 'BUTTON');
        return directButtons.length > 0;
      });
      if (toolbar) return toolbar;
    }
    return null;
  }

  function findLanguage(pre, toolbar) {
    const header = toolbar.parentElement;
    if (!header) return '';
    const candidates = Array.from(header.children).filter((child) => child !== toolbar);
    return candidates.map((child) => child.textContent.trim()).find(Boolean) || '';
  }

  function findCode(pre) {
    const code = pre.querySelector('code');
    return code ? code.textContent : pre.textContent;
  }

  function setButtonState(button, state) {
    button.dataset.state = state;
    button.textContent = state === 'running' ? '⏳' : state === 'success' ? '✓' : state === 'error' ? '!' : '▼';
  }

  function createOutput(pre) {
    const old = pre.querySelector('div.relative.w-full.mt-4.mb-1')?.querySelector(':scope > .chatgpt-local-run-output');
    if (old) old.remove();
    const output = document.createElement('div');
    output.className = 'chatgpt-local-run-output';
    output.setAttribute('role', 'status');
    output.setAttribute('aria-live', 'polite');
    return output;
  }

  function renderOutput(output, result) {
    const status = document.createElement('div');
    status.className = 'chatgpt-local-run-output__status';
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'chatgpt-local-run-output__copy';
    copy.textContent = '複製結果';
    copy.setAttribute('aria-label', '複製本機執行結果');
    const body = document.createElement('pre');
    body.className = 'chatgpt-local-run-output__body';
    const stdout = result.stdout || '';
    const stderr = result.stderr || '';
    const combined = [stdout && `stdout:\n${stdout}`, stderr && `stderr:\n${stderr}`].filter(Boolean).join('\n');
    body.textContent = combined || '(沒有輸出)';
    if (result.outputTruncated) body.textContent += '\n\n[輸出已截斷]';
    if (result.timedOut) body.textContent += '\n\n[已因逾時終止 process tree]';
    status.textContent = result.timedOut ? '逾時' : result.exitCode === 0 ? '成功' : `失敗（結束碼 ${result.exitCode ?? '未知'}）`;
    status.append(copy);
    copy.addEventListener('click', async () => {
      await navigator.clipboard.writeText(body.textContent);
      copy.textContent = '已複製';
      setTimeout(() => { copy.textContent = '複製結果'; }, 1200);
    });
    output.replaceChildren(status, body);
  }

  async function runLocal(button, pre, language) {
    if (!language || button.disabled) return;
    const output = createOutput(pre);
    const host = pre.querySelector('div.relative.w-full.mt-4.mb-1') || pre.parentElement;
    host.append(output);
    setButtonState(button, 'running');
    button.disabled = true;
    output.textContent = '執行中…';
    try {
      const response = await fetch(`${RUNNER_URL}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code: findCode(pre), timeout: settings.timeout, cwd: settings.cwd })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      renderOutput(output, result);
      setButtonState(button, result.exitCode === 0 && !result.timedOut ? 'success' : 'error');
    } catch (error) {
      output.textContent = '本機 Runner 未啟動';
      output.title = error instanceof Error ? error.message : String(error);
      setButtonState(button, 'error');
    } finally {
      button.disabled = false;
    }
  }

  function enhance(pre) {
    if (!pre || pre.dataset.chatgptLocalRunEnhanced === 'true') return;
    const toolbar = findToolbar(pre);
    if (!toolbar) return;
    const language = normalizeLanguage(findLanguage(pre, toolbar));
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chatgpt-local-run-button';
    button.textContent = '▼';
    button.title = '以本機執行';
    button.setAttribute('aria-label', '以本機執行');
    if (!language) {
      button.disabled = true;
      button.title = '以本機執行（不支援的語言）';
    } else {
      button.addEventListener('click', () => runLocal(button, pre, language));
    }
    toolbar.append(button);
    pre.dataset.chatgptLocalRunEnhanced = 'true';
  }

  function scan(root = document) {
    root.querySelectorAll?.('pre').forEach(enhance);
    if (root.matches?.('pre')) enhance(root);
  }

  async function start() {
    await getSettings();
    scan();
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) scan(node);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  start();
})();
