import { useEffect, useRef, useState } from 'preact/hooks';
import DOMPurify from 'dompurify';
import { ApiError, errorMessage, fetchQuestion, judge, type Question } from '../api';
import { cacheQuestion, getCachedQuestion, markAccepted } from '../store';
import { Editor } from './Editor';
import { Result, type Outcome } from './Result';

const LANGUAGES = [
  { slug: 'python3', label: 'Python3' },
  { slug: 'cpp', label: 'C++' },
];

// Problem text rarely changes, so a cached copy wins; this is what makes opened problems readable offline.
async function loadQuestion(slug: string): Promise<Question> {
  const cached = await getCachedQuestion(slug);
  if (cached) return cached;
  try {
    const question = await fetchQuestion(slug);
    await cacheQuestion(slug, question);
    return question;
  } catch (error) {
    if (error instanceof ApiError && error.kind === 'OFFLINE') throw new Error('오프라인이고, 이 문제는 아직 열어 본 적이 없어 저장본이 없습니다.');
    throw error;
  }
}

export function Problem({ slug }: { slug: string }) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState<'description' | 'code' | 'judge'>('description');
  const [lang, setLang] = useState(() => localStorage.getItem('lang') ?? 'python3');
  const [testcases, setTestcases] = useState('');
  const [busy, setBusy] = useState<'run' | 'submit' | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const codeRef = useRef('');

  useEffect(() => {
    loadQuestion(slug)
      .then((loaded) => {
        setQuestion(loaded);
        setTestcases(loaded.exampleTestcases);
      })
      .catch((error) => setLoadError(errorMessage(error)));
  }, [slug]);

  function changeLanguage(next: string) {
    localStorage.setItem('lang', next);
    setLang(next);
  }

  async function execute(kind: 'run' | 'submit') {
    if (!question || busy) return;
    setBusy(kind);
    setTab('judge');
    setOutcome(null);
    try {
      const data = await judge(kind, slug, {
        lang,
        questionId: question.questionId,
        code: codeRef.current,
        testcases: kind === 'run' ? testcases : undefined,
      });
      setOutcome({ kind, data, testcases });
      if (kind === 'submit' && data.status_code === 10) await markAccepted(slug);
    } catch (error) {
      setOutcome({ kind, error: errorMessage(error), authExpired: error instanceof ApiError && error.kind === 'AUTH' });
    } finally {
      setBusy(null);
    }
  }

  const template = question?.codeSnippets.find((snippet) => snippet.langSlug === lang)?.code ?? '';

  return (
    <main class="page problem-page">
      <header class="topbar">
        <a href="#/" class="link">← 목록</a>
        <h1 class="problem-heading">{question ? `${question.questionId}. ${question.title}` : slug}</h1>
        <span class={`level level-${question?.difficulty.toLowerCase() ?? ''}`}>{question?.difficulty}</span>
      </header>

      {loadError && <p class="notice error">{loadError}</p>}

      {question && (
        <>
          <nav class="tabs">
            <button class={tab === 'description' ? 'active' : ''} onClick={() => setTab('description')}>문제</button>
            <button class={tab === 'code' ? 'active' : ''} onClick={() => setTab('code')}>코드</button>
            <button class={tab === 'judge' ? 'active' : ''} onClick={() => setTab('judge')}>실행{busy && ' …'}</button>
            <select value={lang} onChange={(event) => changeLanguage(event.currentTarget.value)}>
              {LANGUAGES.map((language) => (
                <option value={language.slug} key={language.slug}>{language.label}</option>
              ))}
            </select>
          </nav>

          <section class="tab-body" hidden={tab !== 'description'}>
            <article class="content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question.content ?? '') }} />
            <h3>예제 테스트 케이스</h3>
            <pre class="testcases">{question.exampleTestcases}</pre>
          </section>

          {/* Kept mounted while hidden so cursor and undo history survive tab switches. */}
          <section class="tab-body code-tab" hidden={tab !== 'code'}>
            <Editor slug={slug} lang={lang} template={template} codeRef={codeRef} />
          </section>

          <section class="tab-body" hidden={tab !== 'judge'}>
            <label class="testcase-label">
              Run 테스트 케이스 <button type="button" class="link small" onClick={() => setTestcases(question.exampleTestcases)}>예제로 되돌리기</button>
            </label>
            <textarea class="testcase-input" value={testcases} onInput={(event) => setTestcases(event.currentTarget.value)} rows={6} spellcheck={false} autocapitalize="off" />
            {busy && <p class="muted">{busy === 'run' ? 'Run' : 'Submit'} 채점 중…</p>}
            {outcome && <Result outcome={outcome} />}
          </section>

          <footer class="actions">
            <button onClick={() => execute('run')} disabled={!!busy}>Run</button>
            <button class="primary" onClick={() => execute('submit')} disabled={!!busy}>Submit</button>
          </footer>
        </>
      )}
    </main>
  );
}
