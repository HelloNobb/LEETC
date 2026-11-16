# LEETC

A personal PWA for solving LeetCode problems on a phone while commuting. Goal: 5 problems a week.

- Problem list: `PROBLEMS.md` in [HelloNobb/ALGO](https://github.com/HelloNobb/ALGO) (main)
- `web/`: Vite + Preact + TypeScript PWA, deployed to GitHub Pages
- `worker/`: Cloudflare Worker proxy. The browser can't call leetcode.com directly (CORS, no `Cookie` header from JS), so the Worker calls it with your session cookie.

```
phone (Pages PWA) ──Bearer token──▶ Cloudflare Worker ──cookie──▶ leetcode.com
        │
        └─ raw.githubusercontent.com/HelloNobb/ALGO/main/PROBLEMS.md
```

The LeetCode cookie lives only in Worker secrets. The phone only holds the Worker access token.

---

## 1. Copy the LeetCode cookies (PC Chrome)

1. Log in to https://leetcode.com in Chrome.
2. Press `F12` to open DevTools. Open the **Application** tab (it may be hidden under `»`).
3. In the left panel, open **Storage → Cookies → https://leetcode.com**.
4. In the row whose Name is `LEETCODE_SESSION`, double-click **Value** and copy it.
5. Do the same for the row whose Name is `csrftoken`.

Do not paste these values into chat, issues, or commits. They give full access to your LeetCode account.

## 2. Deploy the Worker

```bash
cd worker
npm install
npx wrangler login
npx wrangler deploy
```

`deploy` prints the address: `https://leetc-proxy.<subdomain>.workers.dev`. Until the secrets below are set, every request returns 401, so nothing is exposed.

Set the 3 secrets. Each command asks for a value; paste it and press Enter.

```bash
npx wrangler secret put LEETCODE_SESSION
```

```bash
npx wrangler secret put CSRF_TOKEN
```

The access token is a password you make up. Generate one, copy the output (you'll type it on the phone), then store it:

```bash
openssl rand -hex 32
```

```bash
npx wrangler secret put ACCESS_TOKEN
```

Check it works (replace the URL and token):

```bash
curl -H "Authorization: Bearer <token>" https://leetc-proxy.<subdomain>.workers.dev/problem/two-sum
```

If the Worker address changes, update `VITE_WORKER_URL` in `web/.env.production` and push.

Allowed browser origins are set in `worker/wrangler.toml` (`ALLOWED_ORIGINS`). If the Pages address changes, edit it and run `npx wrangler deploy` again.

To change the `<subdomain>` part, go to Cloudflare dashboard → Workers & Pages → **Subdomain** (right side) → Change.

## 3. Deploy the web app to GitHub Pages

1. Push this repo to `HelloNobb/LEETC` on the `main` branch.
2. On GitHub: repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Any push that changes `web/` runs `.github/workflows/pages.yml` (test → build → deploy). To run it by hand, use **Actions → Deploy web to GitHub Pages → Run workflow**.
4. The app is at https://hellonobb.github.io/LEETC/.

## 4. Set up the phone

1. Open https://hellonobb.github.io/LEETC/.
2. Tap **설정**. The Worker address is prefilled from `web/.env.production`. Enter the access token, then tap 저장.
   The current token is in `worker/.access-token` on the PC (git-ignored). Set a new one with `npx wrangler secret put ACCESS_TOKEN`.
3. Install it to the home screen:
   - Android Chrome: ⋮ → **홈 화면에 추가 / 앱 설치**
   - iOS Safari: Share → **홈 화면에 추가**

## 5. Refresh the cookie ("쿠키 갱신 필요")

When Run/Submit shows a red **쿠키 갱신 필요** banner, the LeetCode session has expired.

1. Copy both cookies again (section 1).
2. Update them. Each `secret put` deploys right away; nothing else to redeploy.

```bash
cd worker && npx wrangler secret put LEETCODE_SESSION
```

```bash
cd worker && npx wrangler secret put CSRF_TOKEN
```

If the access token leaks, run `npx wrangler secret put ACCESS_TOKEN` with a new value and update the phone's settings.

---

## PROBLEMS.md format

```
## W7 (26-11-w2) - LeetCode
* [Easy] 70. Climbing Stairs
* (보너스) [Medium] 322. Coin Change
- [Medium] Two Sum https://leetcode.com/problems/two-sum/
```

- `##` heading = one week. The **last** section is "this week" for the progress bar.
- The link is optional. Without it, the slug is made from the title (`70. Climbing Stairs` → `climbing-stairs`). Add a link if a problem doesn't open (rare titles with unusual punctuation).
- A `(보너스)`-style prefix marks a bonus problem: listed, but not counted in the weekly goal.
- Old `[level N]` (Programmers) lines are ignored. Other list lines that don't match are listed as a warning at the bottom of the list screen.
- Any other problem can be opened by typing its slug (or pasting its link) into the box on the list screen.
- The list is fetched with revalidation, but GitHub's raw CDN can still serve the old file for up to ~5 minutes after a push.

## Local development

`worker/.dev.vars` (git-ignored):

```
LEETCODE_SESSION=...
CSRF_TOKEN=...
ACCESS_TOKEN=local-dev-token
```

```bash
cd worker && npm run dev:local
```

```bash
cd web && npm install && npm run dev
```

Open http://localhost:5173/LEETC/, then in 설정 use `http://localhost:8787` and the `ACCESS_TOKEN` from `.dev.vars`.

- `cd web && npm test`: PROBLEMS.md parser tests
- `cd worker && ./verify.sh`: Worker guard + problem + Run check against a running Worker (`SUBMIT=1 ./verify.sh` also submits Two Sum for real)
- `npm run dev` in `worker` runs on Cloudflare's edge instead (`wrangler dev --remote`)
