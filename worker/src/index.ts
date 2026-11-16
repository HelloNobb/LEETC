// Stage 0: raw passthrough to verify LeetCode reachability from Cloudflare. Token/Origin checks come in stage 1.
interface Env {
  LEETCODE_SESSION: string;
  CSRF_TOKEN: string;
}

const LEETCODE = 'https://leetcode.com';

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

// Return status and a few headers too, so a Cloudflare 403 challenge is distinguishable from a LeetCode auth error.
async function relay(response: Response): Promise<Response> {
  const text = await response.text();
  let body: unknown = text.slice(0, 1000);
  try {
    body = JSON.parse(text);
  } catch {}
  return Response.json({
    status: response.status,
    server: response.headers.get('server'),
    cfMitigated: response.headers.get('cf-mitigated'),
    location: response.headers.get('location'),
    body,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const [, route, param] = url.pathname.split('/');

    if (request.method === 'GET' && route === 'problem' && param) {
      return relay(await fetch(`${LEETCODE}/graphql`, {
        method: 'POST',
        headers: leetcodeHeaders(env, param),
        body: JSON.stringify({ query: QUESTION_QUERY, variables: { titleSlug: param } }),
      }));
    }

    if (request.method === 'POST' && (route === 'run' || route === 'submit') && param) {
      const path = route === 'run' ? 'interpret_solution' : 'submit';
      return relay(await fetch(`${LEETCODE}/problems/${param}/${path}/`, {
        method: 'POST',
        headers: leetcodeHeaders(env, param),
        body: await request.text(),
        redirect: 'manual',
      }));
    }

    if (request.method === 'GET' && route === 'check' && param) {
      const slug = url.searchParams.get('slug') ?? '';
      return relay(await fetch(`${LEETCODE}/submissions/detail/${param}/check/`, {
        headers: leetcodeHeaders(env, slug),
        redirect: 'manual',
      }));
    }

    return new Response('not found', { status: 404 });
  },
};
