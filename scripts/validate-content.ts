/**
 * Standalone content gate, run from `prebuild`.
 *
 * lib/content.ts already throws on import, so `next build` would fail anyway;
 * this runs first so the failure arrives as a readable list rather than buried
 * in a webpack module-evaluation trace.
 *
 * `--production` forces the placeholder gate on, because `next build` runs with
 * NODE_ENV=production while this npm lifecycle script does not.
 */
import { ContentValidationError } from '../lib/content-error.js';

if (process.argv.includes('--production')) {
  // Setting this before the dynamic import below is exactly the point.
  process.env.CONTENT_GATE = 'production';
}

try {
  // Dynamic: lib/content.ts validates at module scope and throws, and a static
  // import would run before this try block is entered.
  const { content, allMedia, placeholderGateActive } = await import('../lib/content.js');
  const media = allMedia();
  const placeholders = media.filter((m) => m.media.origin === 'placeholder');
  console.log(
    `[validate:content] OK — ${content.pages.length} page(s), ` +
      `${content.pages.reduce((n, p) => n + p.sections.length, 0)} section(s), ` +
      `${media.length} media asset(s).`,
  );
  console.log(
    `[validate:content] placeholder gate: ${placeholderGateActive() ? 'ACTIVE' : 'off'}` +
      (placeholders.length ? ` — ${placeholders.length} placeholder asset(s) present` : ''),
  );
} catch (err) {
  if (err instanceof ContentValidationError) {
    console.error(`\n[validate:content] FAILED\n${err.message}`);
    for (const line of err.details) console.error(line);
    console.error('');
    process.exit(1);
  }
  throw err;
}
