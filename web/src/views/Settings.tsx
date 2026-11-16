import { useState } from 'preact/hooks';
import { errorMessage, fetchQuestion, loadSettings, saveSettings } from '../api';

export function Settings() {
  const [settings, setSettings] = useState(loadSettings);
  const [status, setStatus] = useState('');

  async function save(event: Event) {
    event.preventDefault();
    const trimmed = { workerUrl: settings.workerUrl.trim(), token: settings.token.replace(/\s/g, '') };
    saveSettings(trimmed);
    setSettings(trimmed);
    // Check right away so a wrong token shows up here, not later on Run.
    setStatus('저장함. 연결 확인 중…');
    try {
      await fetchQuestion('two-sum');
      setStatus('저장함. Worker 연결 확인됨.');
    } catch (error) {
      setStatus(`저장함. 하지만 연결 실패: ${errorMessage(error)}`);
    }
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
          접근 토큰 ({settings.token.replace(/\s/g, '').length}/32자)
          {/* Plain text, not password: iOS offers to replace password fields with a generated "strong password". */}
          <input
            type="text"
            value={settings.token}
            onInput={(event) => setSettings({ ...settings, token: event.currentTarget.value })}
            autocomplete="off"
            autocapitalize="off"
            autocorrect="off"
            spellcheck={false}
            class="token-input"
          />
        </label>
        <p class="muted">이 기기에 저장돼서 한 번만 넣으면 됩니다. LeetCode 쿠키는 여기 넣지 않습니다(Worker secret에만 있음).</p>
        <button>저장</button>
        {status && <p class="notice">{status}</p>}
      </form>
    </main>
  );
}
