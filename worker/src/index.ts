interface Env {
  LEETCODE_SESSION: string;
  CSRF_TOKEN: string;
  ACCESS_TOKEN: string;
  ALLOWED_ORIGINS: string;
}

const LEETCODE = 'https://leetcode.com';
const LANGUAGES = ['python3', 'cpp'];

const QUESTION_QUERY = `query question($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionId title difficulty content exampleTestcases
    codeSnippets { langSlug code }
  }
}`;

// LeetCode rejects POSTs without matching csrftoken cookie+header and a same-site Referer.
function leetcodeHeaders(env: Env, slug: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Cookie: `LEETCODE_SESSION=${env.LEETCODE_SESSION}; csrftoken=${env.CSRF_TOKEN}`,
    'x-csrftoken': env.CSRF_TOKEN,
    Referer: `${LEETCODE}/problems/${slug}/`,
    Origin: LEETCODE,
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
  };
}

function json(body: unknown, status: number, origin: string | null): Response {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  return new Response(JSON.stringify(body), { status, headers });
}

async function tokenMatches(given: string, expected: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const a = encoder.encode(given);
  const b = encoder.encode(expected);
  // timingSafeEqual throws on length mismatch, so compare lengths first.
  return a.byteLength === b.byteLength && crypto.subtle.timingSafeEqual(a, b);
}

// Expired/missing cookie comes back as Django's 403 HTML page; a Cloudflare challenge carries cf-mitigated.
async function readLeetcode(response: Response): Promise<{ ok: true; data: any } | { ok: false; error: string; status: number }> {
  if (response.headers.get('cf-mitigated')) return { ok: false, error: 'BLOCKED', status: 502 };
  if (response.status === 429) return { ok: false, error: 'RATE_LIMIT', status: 429 };
  if ([401, 403, 499].includes(response.status) || (response.status >= 300 && response.status < 400)) {
    return { ok: false, error: 'AUTH', status: 401 };
  }
  const text = await response.text();
  try {
    if (response.ok) return { ok: true, data: JSON.parse(text) };
  } catch {}
  return { ok: false, error: 'UPSTREAM', status: 502 };
}

async function handle(request: Request, env: Env, origin: string | null): Promise<Response> {
  const auth = request.headers.get('Authorization') ?? '';
  if (!env.ACCESS_TOKEN || !(await tokenMatches(auth.replace(/^Bearer /, ''), env.ACCESS_TOKEN))) {
    return json({ error: 'TOKEN' }, 401, origin);
  }

  const url = new URL(request.url);
  const [, route, param = ''] = url.pathname.split('/');
  // Params go into LeetCode URLs, so allow only slug/id characters.
  if (!/^[\w.-]+$/.test(param)) return json({ error: 'NOT_FOUND' }, 404, origin);

  if (request.method === 'GET' && route === 'problem') {
    const result = await readLeetcode(await fetch(`${LEETCODE}/graphql`, {
      method: 'POST',
      headers: leetcodeHeaders(env, param),
      body: JSON.stringify({ query: QUESTION_QUERY, variables: { titleSlug: param } }),
    }));
    if (!result.ok) return json({ error: result.error }, result.status, origin);
    const question = result.data?.data?.question;
    if (!question) return json({ error: 'NOT_FOUND' }, 404, origin);
    question.codeSnippets = (question.codeSnippets ?? []).filter((snippet: { langSlug: string }) => LANGUAGES.includes(snippet.langSlug));
    return json(question, 200, origin);
  }

  if (request.method === 'POST' && (route === 'run' || route === 'submit')) {
    const input = (await request.json()) as { lang: string; questionId: string; code: string; testcases?: string };
    const body = route === 'run'
      ? { lang: input.lang, question_id: input.questionId, typed_code: input.code, data_input: input.testcases ?? '' }
      : { lang: input.lang, question_id: input.questionId, typed_code: input.code };
    const result = await readLeetcode(await fetch(`${LEETCODE}/problems/${param}/${route === 'run' ? 'interpret_solution' : 'submit'}/`, {
      method: 'POST',
      headers: leetcodeHeaders(env, param),
      body: JSON.stringify(body),
      redirect: 'manual',
    }));
    if (!result.ok) return json({ error: result.error }, result.status, origin);
    const id = result.data.interpret_id ?? result.data.submission_id;
    if (!id) return json({ error: 'UPSTREAM' }, 502, origin);
    return json({ id: String(id) }, 200, origin);
  }

  if (request.method === 'GET' && route === 'check') {
    const slug = url.searchParams.get('slug') ?? '';
    if (!/^[\w-]+$/.test(slug)) return json({ error: 'NOT_FOUND' }, 404, origin);
    const result = await readLeetcode(await fetch(`${LEETCODE}/submissions/detail/${param}/check/`, {
      headers: leetcodeHeaders(env, slug),
      redirect: 'manual',
    }));
    if (!result.ok) return json({ error: result.error }, result.status, origin);
    return json(result.data, 200, origin);
  }

  return json({ error: 'NOT_FOUND' }, 404, origin);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    // Origin check only stops other websites; the token is what stops curl.
    if (origin && !env.ALLOWED_ORIGINS.split(',').includes(origin)) {
      return new Response('forbidden origin', { status: 403 });
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin ?? '',
          'Access-Control-Allow-Methods': 'GET, POST',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
          'Access-Control-Max-Age': '86400',
          Vary: 'Origin',
        },
      });
    }

    return handle(request, env, origin);
  },
};
