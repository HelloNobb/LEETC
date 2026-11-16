# LEETC

Personal PWA for solving LeetCode on a phone. Problem list comes from `HelloNobb/ALGO` `PROBLEMS.md` (main).

## Architecture

- `worker/` — Cloudflare Worker proxy (free plan). Single file `src/index.ts`. Calls leetcode.com with the session cookie because the browser cannot (CORS, no `Cookie` header from JS).
- `web/` — Vite + Preact + TypeScript PWA, deployed to GitHub Pages.
  - Reads `PROBLEMS.md` directly from `raw.githubusercontent.com` (public repo, CORS allowed). No Worker hop.
  - Run/Submit polling is done by the client: one short Worker request per poll (`/check/:id`).
  - Weekly progress = local Accepted records in IndexedDB. No LeetCode status query.
  - "This week" = last `##` section of PROBLEMS.md.

## Security rules (never break)

- `LEETCODE_SESSION` and `csrftoken` live only in Worker secrets / `worker/.dev.vars`. Never in `web/`, the bundle, logs, or commits.
- Claude never reads, prints, or edits the values in `worker/.dev.vars`.
- Worker access token: the real guard. Pages bundle is public, so the token is typed into the app's settings screen and stored on the device. Origin allowlist is a second layer only (curl can fake Origin).
- Problem HTML is sanitized (DOMPurify) before `innerHTML`.

## PROBLEMS.md format

```
## W7 (26-11-w2) - LeetCode
* [Easy] 70. Climbing Stairs
* (보너스) [Medium] 322. Coin Change
- [Medium] Two Sum https://leetcode.com/problems/two-sum/
```
- `##` heading = week; text after the name is the label. Last section = this week.
- Slug: from the link if present, else derived from the title (`slugFromTitle`, only for Easy/Medium/Hard).
- `(...)` prefix = bonus: shown, not counted toward the weekly goal.
- `[level N]` lines (old Programmers weeks) are skipped silently. Other list lines that fail are shown as warnings.

## LeetCode API facts (verified 2026-11-16 from Cloudflare edge)

- Problem query (GraphQL) works without cookies. Run/Submit need cookie + `x-csrftoken` + `Referer: https://leetcode.com/problems/{slug}/`.
- Missing/bad cookie → Django "403 Forbidden" HTML page (status came through as 499), no `cf-mitigated` header. That is the "cookie refresh needed" signal.
- Run (`interpret_solution`) → `interpret_id`; Submit → `submission_id`; both polled at `/submissions/detail/{id}/check/` until `state == "SUCCESS"`.
- Run says `status_msg: "Accepted"` even for wrong output. Judge Run by `correct_answer` / `compare_result` vs `expected_code_answer`.
- `status_code`: 10 Accepted, 15 Runtime Error (`runtime_error`, `full_runtime_error`), 20 Compile Error (`compile_error`, `full_compile_error`).
- Rapid back-to-back Runs got a non-JSON reply once (likely rate limit, not confirmed). Client must handle non-JSON errors.

## Worker API (what web calls)

All need `Authorization: Bearer <ACCESS_TOKEN>`. Errors are `{error: TOKEN|AUTH|RATE_LIMIT|BLOCKED|NOT_FOUND|UPSTREAM}` (DECISIONS D6).
- `GET /problem/:slug` → question (codeSnippets filtered to python3/cpp)
- `POST /run/:slug` `{lang, questionId, code, testcases}` / `POST /submit/:slug` `{lang, questionId, code}` → `{id}`
- `GET /check/:id?slug=` → raw LeetCode check payload

## Web files

- `src/api.ts` Worker calls, error messages, polling (`judge`). `src/store.ts` IndexedDB keys. `src/problems.ts` parser (+ `node --test`).
- `src/views/`: `List`, `Settings`, `Problem` (tabs), `Editor` (CodeMirror + shortcut bar, autosave), `Result`.
- Settings (Worker URL, token) in localStorage; problem cache, code, Accepted records in IndexedDB.

## Commands

- `cd web && npm test` / `npm run build` (tsc + vite). `cd worker && npm run dev:local` + `./verify.sh`.

## Code rules

- Comments: `//` one line, "why" only. No JSDoc blocks. Delete dead code.
- No exported function/component that nothing calls yet.
- Ask before adding any npm package (what / why / alternative / cost).
