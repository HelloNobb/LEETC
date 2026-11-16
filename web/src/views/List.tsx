import { useEffect, useState } from 'preact/hooks';
import { parseProblems, type ParseResult } from '../problems';
import { getAccepted } from '../store';
import { loadSettings } from '../api';

const PROBLEMS_URL = 'https://raw.githubusercontent.com/HelloNobb/ALGO/main/PROBLEMS.md';

export function List() {
  const [result, setResult] = useState<ParseResult | null>(null);
  const [loadError, setLoadError] = useState('');
  const [accepted, setAccepted] = useState<Record<string, number>>({});
  const [slugInput, setSlugInput] = useState('');

  useEffect(() => {
    // no-cache: raw.githubusercontent sends max-age=300, so an edited list would otherwise stay stale in the browser.
    fetch(PROBLEMS_URL, { cache: 'no-cache' })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then((text) => setResult(parseProblems(text)))
      .catch((error) => setLoadError(`문제 목록을 불러오지 못했습니다 (${error.message}).`));
    getAccepted().then(setAccepted);
  }, []);

  function openSlug(event: Event) {
    event.preventDefault();
    // Accept a bare slug or a pasted problem URL.
    const slug = slugInput.match(/problems\/([a-z0-9-]+)/)?.[1] ?? slugInput.trim().toLowerCase();
    if (/^[a-z0-9-]+$/.test(slug)) location.hash = `#/p/${slug}`;
  }

  const weeks = result?.weeks ?? [];
  const thisWeek = weeks.at(-1);
  // Bonus problems are extra: they don't count toward the weekly goal.
  const goal = thisWeek?.problems.filter((problem) => !problem.bonus) ?? [];
  const done = goal.filter((problem) => accepted[problem.slug]).length;
  const total = goal.length;
  // Newest first; old weeks with no parsable problems are hidden, the current week always shows.
  const shownWeeks = [...weeks].reverse().filter((week, index) => index === 0 || week.problems.length > 0);
  const settingsMissing = !loadSettings().token;

  return (
    <main class="page">
      <header class="topbar">
        <h1>LEETC</h1>
        <a href="#/settings" class="link">설정</a>
      </header>

      {settingsMissing && <p class="notice">먼저 <a href="#/settings">설정</a>에서 Worker 주소와 토큰을 입력하세요.</p>}

      <form class="open-form" onSubmit={openSlug}>
        <input
          value={slugInput}
          onInput={(event) => setSlugInput(event.currentTarget.value)}
          placeholder="slug 또는 문제 링크"
          autocapitalize="off"
          autocorrect="off"
          spellcheck={false}
        />
        <button>열기</button>
      </form>

      {loadError && <p class="notice error">{loadError}</p>}
      {!result && !loadError && <p class="muted">불러오는 중…</p>}

      {thisWeek && (
        <section class="progress">
          <div>
            이번 주 <b>{thisWeek.name}</b> <span class="muted">{thisWeek.label}</span>
          </div>
          <div class="progress-count">
            <b>{done}</b> / {total} Accepted
          </div>
          <div class="meter">
            <div style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
          </div>
        </section>
      )}

      {shownWeeks.map((week, index) => (
        <details class="week" open={index === 0} key={`${week.name}-${index}`}>
          <summary>
            {week.name} <span class="muted">{week.label}</span>
          </summary>
          {week.problems.length === 0 && <p class="muted">문제 없음</p>}
          <ul>
            {week.problems.map((problem) => (
              <li key={problem.slug}>
                <a href={`#/p/${problem.slug}`} class="problem-row">
                  <span class={`level level-${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
                  <span class="problem-title">
                    {problem.bonus && <span class="bonus">보너스</span>}
                    {problem.title}
                  </span>
                  {accepted[problem.slug] && <span class="check">✓</span>}
                </a>
              </li>
            ))}
          </ul>
        </details>
      ))}

      {result && result.warnings.length > 0 && (
        <details class="notice warn">
          <summary>형식이 맞지 않아 무시한 줄 {result.warnings.length}개</summary>
          <ul class="warn-lines">
            {result.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </details>
      )}
    </main>
  );
}
