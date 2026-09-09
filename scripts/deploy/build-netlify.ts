/**
 * Post-build step for a Netlify drop-in bundle.
 *
 * Unlike GitHub Pages, Netlify can serve real 301s, so the legacy WordPress
 * URLs are handled by `_redirects` rather than meta-refresh stubs. Prerendered
 * files still win over the SPA fallback, which is only a backstop.
 */
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { redirectRules, isKnownRoute, normalizePath } from '../../src/lib/redirects';

const rules = redirectRules().filter((rule) => !isKnownRoute(normalizePath(rule.source)));

const lines = [
  '# Legacy WordPress URLs → new paths. Generated from src/lib/redirects.ts.',
  '# 301, not 302: this is a permanent move, and a 302 would keep the old URL',
  '# in the index while the new one waited behind it.',
  ...rules.map((rule) => `${rule.source}  ${rule.destination}  301`),
  '',
  '# SPA fallback, last so every prerendered file takes precedence.',
  '/*  /index.html  200',
  '',
].join('\n');

await writeFile(join('dist', '_redirects'), lines, 'utf8');
console.log(`netlify: _redirects written with ${rules.length} permanent redirects`);
