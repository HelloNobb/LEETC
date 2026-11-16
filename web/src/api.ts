export interface Question {
  questionId: string;
  title: string;
  difficulty: string;
  content: string;
  exampleTestcases: string;
  codeSnippets: { langSlug: string; code: string }[];
}

// Raw /check/ payload from LeetCode; fields vary by status, see CLAUDE.md "LeetCode API facts".
export type CheckResult = Record<string, any>;

export interface Settings {
  workerUrl: string;
  token: string;
}

const MESSAGES: Record<string, string> = {
  SETTINGS: '설정에서 Worker 주소와 접근 토큰을 입력하세요.',
  TOKEN: '접근 토큰이 틀렸습니다. 설정을 확인하세요.',
  AUTH: '쿠키 갱신 필요: LeetCode 로그인 쿠키가 만료됐습니다. README의 "쿠키 갱신"대로 Worker secret을 바꾸세요.',
  RATE_LIMIT: 'LeetCode 요청 제한에 걸렸습니다. 잠시 후 다시 시도하세요.',
  BLOCKED: 'Cloudflare가 LeetCode 요청을 막았습니다.',
  NOT_FOUND: '문제를 찾을 수 없습니다. slug를 확인하세요.',
  UPSTREAM: 'LeetCode 응답이 이상합니다. 다시 시도하세요.',
  OFFLINE: '오프라인입니다. Run/Submit은 온라인에서만 됩니다.',
  TIMEOUT: '채점 결과를 60초 안에 못 받았습니다.',
};

export class ApiError extends Error {
  kind: string;
  constructor(kind: string) {
    super(MESSAGES[kind] ?? kind);
    this.kind = kind;
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// Worker URL is public, so the build bakes in a default (web/.env.production); only the token must be typed on the phone.
const DEFAULT_SETTINGS: Settings = { workerUrl: import.meta.env.VITE_WORKER_URL ?? '', token: '' };

export function loadSettings(): Settings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('settings') ?? '{}') };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings) {
  localStorage.setItem('settings', JSON.stringify(settings));
}

async function call(path: string, init: RequestInit = {}): Promise<any> {
  const { workerUrl, token } = loadSettings();
  if (!workerUrl || !token) throw new ApiError('SETTINGS');
  let response: Response;
  try {
    response = await fetch(workerUrl.replace(/\/+$/, '') + path, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
  } catch {
    throw new ApiError('OFFLINE');
  }
  const body = await response.json().catch(() => ({ error: 'UPSTREAM' }));
  if (!response.ok) throw new ApiError(body.error ?? 'UPSTREAM');
  return body;
}

export function fetchQuestion(slug: string): Promise<Question> {
  return call(`/problem/${slug}`);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// Transient failures while polling: keep polling so a dropped connection on the subway doesn't lose the result.
const RETRYABLE = ['OFFLINE', 'RATE_LIMIT', 'UPSTREAM'];

export async function judge(
  kind: 'run' | 'submit',
  slug: string,
  payload: { lang: string; questionId: string; code: string; testcases?: string },
): Promise<CheckResult> {
  const { id } = await call(`/${kind}/${slug}`, { method: 'POST', body: JSON.stringify(payload) });
  for (let attempt = 0; attempt < 60; attempt++) {
    await sleep(1000);
    try {
      const result = await call(`/check/${encodeURIComponent(id)}?slug=${slug}`);
      if (result.state === 'SUCCESS') return result;
    } catch (error) {
      if (!(error instanceof ApiError) || !RETRYABLE.includes(error.kind)) throw error;
    }
  }
  throw new ApiError('TIMEOUT');
}
