const RUNNER_URL = 'http://127.0.0.1:9029';
const DEFAULTS = { timeout: 60, cwd: '' };

async function load() {
  const values = await chrome.storage.local.get(DEFAULTS);
  document.querySelector('#timeout').value = values.timeout;
  document.querySelector('#cwd').value = values.cwd;
  try {
    const response = await fetch(`${RUNNER_URL}/health`);
    if (!response.ok) throw new Error('offline');
    const status = document.querySelector('#status');
    status.textContent = 'Runner 執行中';
    status.className = 'ok';
  } catch {
    const status = document.querySelector('#status');
    status.textContent = 'Runner 未啟動';
    status.className = 'offline';
  }
}

document.querySelector('#settings-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const timeout = Math.min(600, Math.max(1, Number(document.querySelector('#timeout').value) || DEFAULTS.timeout));
  const cwd = document.querySelector('#cwd').value.trim();
  await chrome.storage.local.set({ timeout, cwd });
  document.querySelector('#timeout').value = timeout;
  document.querySelector('#saved').textContent = '已儲存';
});

load();
