/**
 * Post-build step for the GitHub Pages demo.
 *
 * Pages serves static files only. It cannot issue a 301 and it has no
 * serverless runtime, so two things need synthesising after `vite-react-ssg`
 * has run:
 *
 *   1. `404.html`, which Pages serves for any unmatched path. Every route is
 *      prerendered, so this is a backstop rather than the primary mechanism.
 *
 *   2. A stub page per legacy WordPress URL. A meta refresh plus a canonical
 *      link is NOT equivalent to a 301 — it is the best a static host can do.
 *      Search engines treat it as a weaker signal, and the production host
 *      should serve real 301s from `redirectRules()`. This exists so the demo
 *      does not 404 on a decade of indexed Hebrew URLs.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { redirects, isKnownRoute } from '../../src/lib/redirects';
import { verifyDestinations } from './verify-destinations';

const DIST = 'dist';
const BASE = process.env.PAGES_BASE ?? '/';

const withBase = (path: string): string =>
  `${BASE.replace(/\/$/, '')}/${path.replace(/^\//, '')}`.replace(/\/{2,}/g, '/');

function stub(destination: string): string {
  const target = withBase(destination);
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<title>הדף עבר</title>
<link rel="canonical" href="${target}">
<meta name="robots" content="noindex,follow">
<meta http-equiv="refresh" content="0; url=${target}">
</head>
<body style="font-family:Assistant,Arial,sans-serif;padding:2rem">
<p>הדף עבר לכתובת חדשה. <a href="${target}">המשך לדף</a></p>
</body>
</html>
`;
}

const indexHtml = await readFile(join(DIST, 'index.html'), 'utf8');
await writeFile(join(DIST, '404.html'), indexHtml, 'utf8');

let written = 0;
let skipped = 0;

for (const [from, to] of redirects) {
  // A legacy path that is already a real prerendered route must not be
  // overwritten by a redirect stub.
  if (isKnownRoute(from)) {
    skipped += 1;
    continue;
  }
  // Directory named with the decoded path: the host matches after decoding,
  // so an encoded request resolves to this file.
  const dir = join(DIST, from.replace(/^\//, '').replace(/\/$/, ''));
  await mkdir(dirname(join(dir, 'index.html')), { recursive: true });
  await writeFile(join(dir, 'index.html'), stub(to), 'utf8');
  written += 1;
}

console.log(`pages: 404.html written`);
console.log(`pages: ${written} legacy redirect stubs written, ${skipped} skipped as real routes`);

verifyDestinations();
