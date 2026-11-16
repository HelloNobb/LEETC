import { useState } from 'preact/hooks';
import { loadSettings, saveSettings } from '../api';

export function Settings() {
  const [settings, setSettings] = useState(loadSettings);
  const [saved, setSaved] = useState(false);

  function save(event: Event) {
    event.preventDefault();
    saveSettings({ workerUrl: settings.workerUrl.trim(), token: settings.token.trim() });
    setSaved(true);
  }

  return (
    <main class="page">
      <header class="topbar">
        <a href="#/" class="link">← 목록</a>
        <h1>설정</h1>
        <span />
      </header>
      <form class="settings" onSubmit={save}>
        <label>
          Worker 주소
          <input
            type="url"
            value={settings.workerUrl}
            onInput={(event) => setSettings({ ...settings, workerUrl: event.currentTarget.value })}
            placeholder="https://leetc-proxy.<subdomain>.workers.dev"
            autocapitalize="off"
          />
        </label>
        <label>
          접근 토큰
          <input
            type="password"
            value={settings.token}
            onInput={(event) => setSettings({ ...settings, token: event.currentTarget.value })}
            autocomplete="off"
          />
        </label>
        <p class="muted">이 기기에만 저장됩니다. LeetCode 쿠키는 여기 넣지 않습니다(Worker secret에만 있음).</p>
        <button>저장</button>
        {saved && <p class="notice">저장했습니다.</p>}
      </form>
    </main>
  );
}
