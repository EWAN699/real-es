# Deploying

The site is a stock Next.js 16 App Router project with no custom server, no
database and no build plugins. Any host that runs Next.js will take it as-is.
Vercel is the path of least resistance and is what this guide assumes.

---

## 1. Vercel, from the repo

1. **Import.** vercel.com → _Add New…_ → _Project_ → pick `ewan699/real-es`, and
   set the production branch to `claude/repo-reset-scratch-juhxr3` (or merge it
   to `main` first and use that).
2. **Framework preset:** Next.js. `vercel.json` in the repo root pins this, so
   leave the build, install and output settings alone — the committed file is
   the authority. **Do not set an Output Directory.** Next.js builds to `.next`
   and Vercel consumes that itself; naming an output directory is what breaks
   the deploy (see §8).
3. **Add the environment variables** in §2 before the first deploy. One of them
   affects generated URLs, so getting it right first saves a redeploy.
4. **Deploy.**

Node 22+ is required (`engines` in `package.json`). Vercel's current default
satisfies this; if you pin a version, pin 22 or later.

If the project was already imported with the wrong preset, the settings chosen
at import time can stick. Fix it in _Settings → Build & Deployment_: Framework
Preset **Next.js**, Root Directory **`./`**, and clear any Output Directory
override. Then redeploy — see §8.

---

## 2. Environment variables

Set these in _Project → Settings → Environment Variables_. Only the first one
matters for a first look; the rest concern the contact form.

| Variable               | Required          | What it does                                                                                                                                                                                                                                   |
| ---------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | **Yes**           | Canonical origin for `sitemap.xml`, `robots.txt` and absolute OG URLs. Without it these fall back to `http://localhost:3000`, which is wrong in a way nothing will warn you about. Set it to the real domain, e.g. `https://www.caesar.co.il`. |
| `EMAIL_PROVIDER`       | No                | `console` (default), or `resend`. See §3.                                                                                                                                                                                                      |
| `EMAIL_API_KEY`        | Only for `resend` | Resend API key.                                                                                                                                                                                                                                |
| `CONTACT_TO_EMAIL`     | Only for `resend` | Where submissions go.                                                                                                                                                                                                                          |
| `CONTACT_FROM_EMAIL`   | Only for `resend` | Verified sender on your Resend domain.                                                                                                                                                                                                         |

**Never set `ALLOW_PLACEHOLDER_MEDIA`.** It exists so the site could be
developed before the imagery existed, and it disables the check described in §4.
The pipeline must not set it.

---

## 3. The contact form is not delivering mail yet

This is the one thing that looks finished and is not, so it is worth stating
plainly rather than leaving to be discovered.

`/api/contact` validates, rate-limits and accepts submissions correctly, and the
form reports success. But `EMAIL_PROVIDER` defaults to `console`, which **logs
the message to the server log and delivers nothing**. It is an honest stub — it
says so in the log line — not a silent failure. Until it is configured, a
customer filling in that form reaches nobody.

To actually deliver, set `EMAIL_PROVIDER=resend` plus the three variables above.
`smtp` is reserved and currently returns 501.

Until then the phone numbers and the `mailto:` link are the working contact
paths, and they are on the page in three places.

---

## 4. The build refuses to ship placeholder imagery

`npm run build` fails if any asset in `content/pages.json` still carries
`origin: "placeholder"`. That check lives in `lib/content.ts`, not in a CI
config, so it cannot be skipped by editing a workflow file.

All seven assets are real, so the build passes today. If someone later adds a
section with a placeholder, the deploy will fail with a message naming the
offending assets. That is intended. The fix is to add the asset, not to set
`ALLOW_PLACEHOLDER_MEDIA`.

`npm run build:draft` is the development escape hatch and must never be the
deploy command.

---

## 5. Other hosts

Nothing here is Vercel-specific.

- **Netlify / Cloudflare Pages / Amplify** — use their Next.js adapter, build
  `npm run build`, and set the same environment variables.
- **A Node server of your own** — `npm ci && npm run build && npm start`, behind
  a reverse proxy. It listens on `$PORT`, default 3000.
- **A container** — the project has no native dependencies beyond `sharp`, which
  ships prebuilt binaries for linux-x64 and linux-arm64.

**A purely static host (S3, GitHub Pages) needs one change.** The site is
otherwise fully static, but `/api/contact` and `/api/og` are server routes. Add
`output: 'export'` to `next.config.ts` and remove those two routes; you lose the
form endpoint (see §3 — it delivers nothing yet anyway) and dynamic OG images,
and keep every section, asset and animation.

---

## 6. Verifying a deploy

Match these against what was measured locally on the production build:

```
Performance 95   Accessibility 100   Best Practices 100   SEO 100
LCP 2.8s   TBT 50ms   CLS 0.002
```

Worth checking by hand after the first deploy:

- **`/sitemap.xml` and `/robots.txt`** show your real domain, not `localhost`.
  If they don't, `NEXT_PUBLIC_SITE_URL` was missing at build time — it is
  inlined at build, so you must **redeploy**, not just add the variable.
- **The hero video plays** on a phone. It is muted, `playsInline` and starts on
  idle; if it sits on its poster frame, that is the designed fallback and not a
  bug.
- **Reduced motion.** Turn on "reduce motion" in the OS and reload: nothing
  should pin, slide or fade, and every section should read complete. The
  horizontal services row becomes an ordinary swipeable row.
- **RTL.** The services track must advance right-to-left.

---

## 7. Repository facts a deploy pipeline may want

|               |                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------ |
| Node          | `>= 22`                                                                                    |
| Install       | `npm ci`                                                                                   |
| Build         | `npm run build`                                                                            |
| Start         | `npm start`                                                                                |
| Output        | `.next/` (standard, not standalone)                                                        |
| Static assets | `public/` — 15 files for 7 media entries, all inside the ceilings in `contracts/assets.md` |
| Routes        | one page (`/`), plus `/api/contact`, `/api/og`, `/sitemap.xml`, `/robots.txt`              |

---

## 8. Troubleshooting

### `No Output Directory named "dist" found after the Build completed`

The project is being built as a generic/Vite app, not as Next.js. `dist` is the
default output Vercel looks for under the **Other** and **Vite** presets;
Next.js does not produce one — it builds to `.next`, which Vercel reads itself
when the framework is set correctly.

Nothing in this repo asks for `dist`. The preset came from what was selected at
import, and Vercel keeps a project-settings value once it is set.

Fix:

1. Pull the latest `vercel.json` (it pins `"framework": "nextjs"`).
2. In _Settings → Build & Deployment_, set Framework Preset to **Next.js**,
   Root Directory to **`./`**, and **clear the Output Directory override** so it
   is empty rather than `dist`. Overrides toggled on in the dashboard win over
   the config file, so an override left set will keep failing.
3. Redeploy. Do **not** tick "use existing build cache" for this one.

A correct build logs `Creating an optimized production build` and finishes with
the route table (`○ /_not-found`, `● /`, `ƒ /api/contact`, …). If you see that
table and it still fails afterwards, the build worked and only the output
setting is wrong.

### The build fails naming placeholder assets

Working as intended — see §4. Add the real asset; do not set
`ALLOW_PLACEHOLDER_MEDIA`.

### Hebrew renders but the layout is left-to-right

`dir="rtl"` and `lang="he"` are set on `<html>` in `app/layout.tsx`. If a proxy
or wrapper is re-serving the HTML and stripping them, RTL will break everywhere
at once — that is the thing to check first, not the CSS.
