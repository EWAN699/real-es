/**
 * Media pipeline for public/media/, implementing contracts/assets.md.
 *
 *   npm run media:optimize        convert, generate posters, report
 *   npm run media:check           report only, no writes; exits 1 if over budget
 *   npm run media:optimize -- --force   re-encode even if the derivative exists
 *
 * Layout it expects and produces (contracts/assets.md):
 *
 *   public/media/{section-id}/{variant}.{ext}
 *   images  -> .webp + .avif   (+ .jpg for the hero section only)
 *   videos  -> .mp4 + .webm    + {variant}-poster.webp
 *
 * Size ceilings are reported per asset. "Over budget means re-encode, not ship
 * anyway", so --check exits non-zero and CI can hold the line.
 */
import { existsSync, readdirSync } from 'node:fs';
import { mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawn } from 'node:child_process';
import { createRequire } from 'node:module';

import sharp, { type Sharp } from 'sharp';

const require_ = createRequire(import.meta.url);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MEDIA_DIR = path.join(ROOT, 'public/media');

const CHECK_ONLY = process.argv.includes('--check');
const FORCE = process.argv.includes('--force');

const KB = 1024;
const MB = 1024 * KB;

/** contracts/assets.md § Size ceilings */
const BUDGETS = {
  heroVideo: 3.5 * MB,
  heroPoster: 150 * KB,
  sectionImage: 400 * KB,
  thumbnail: 80 * KB,
} as const;

const MAX_EDGE = { image: 2000, thumbnail: 800 } as const;

/** Quality ladder used when a first encode lands over its size ceiling. */
const QUALITY_STEP = 8;
const QUALITY_FLOOR = 40;

const IMAGE_SOURCES = new Set(['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.webp', '.avif']);
const VIDEO_SOURCES = new Set(['.mp4', '.mov', '.m4v', '.webm', '.mkv']);
/** Derived files we produce; never treated as sources for another pass. */
const DERIVED = /-poster\.webp$/;

/**
 * When several extensions share a stem, only one of them is the source — the
 * rest are derivatives from an earlier run. Least-lossy first, so a second run
 * never re-encodes from its own output.
 */
const IMAGE_PREFERENCE = ['.tif', '.tiff', '.png', '.jpg', '.jpeg', '.webp', '.avif'];
const VIDEO_PREFERENCE = ['.mov', '.mkv', '.m4v', '.mp4', '.webm'];

function pickSources(files: string[], preference: string[]): string[] {
  const byStem = new Map<string, string[]>();
  for (const f of files) {
    const key = path.join(path.dirname(f), path.basename(f, path.extname(f)));
    byStem.set(key, [...(byStem.get(key) ?? []), f]);
  }
  return [...byStem.values()].map((group) => {
    const ranked = [...group].sort(
      (a, b) =>
        preference.indexOf(path.extname(a).toLowerCase()) -
        preference.indexOf(path.extname(b).toLowerCase()),
    );
    return ranked[0];
  });
}

interface Report {
  file: string;
  bytes: number;
  budget: number;
  label: string;
}

const written: string[] = [];
const reencoded: string[] = [];
const overBudget: Report[] = [];
const notes: string[] = [];
const problems: string[] = [];

/* ------------------------------------------------------------------ *
 * ffmpeg
 * ------------------------------------------------------------------ */

/**
 * ffmpeg resolution, in order of preference:
 *
 *   1. FFMPEG_PATH, if set and present.
 *   2. `ffmpeg-static` (devDependency) — a full GPL build, fetched from GitHub
 *      at install time. This is the one the project expects.
 *   3. Whatever `ffmpeg` is on PATH.
 *   4. The binary Playwright ships. NOTE: that build is stripped down to what
 *      Playwright's video recording needs — no libx264, no mp4 muxer, no h.264
 *      decoder — so it CANNOT transcode or poster our media. It is the last
 *      resort only so the failure is a clear message rather than a crash.
 *
 * If nothing usable is found, images are still processed and video work is
 * reported as a problem rather than silently skipped.
 */
function resolveFfmpeg(): string | null {
  if (process.env.FFMPEG_PATH && existsSync(process.env.FFMPEG_PATH))
    return process.env.FFMPEG_PATH;

  try {
    const fromPkg = require_('ffmpeg-static') as string | null;
    if (fromPkg && existsSync(fromPkg)) return fromPkg;
  } catch {
    /* not installed */
  }

  for (const dir of (process.env.PATH ?? '').split(path.delimiter)) {
    const p = path.join(dir, 'ffmpeg');
    if (dir && existsSync(p)) return p;
  }

  const browsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (browsersPath && existsSync(browsersPath)) {
    const candidates = ['ffmpeg-linux', 'ffmpeg-mac', 'ffmpeg-win64.exe'];
    try {
      for (const dir of readdirSync(browsersPath)) {
        if (!dir.startsWith('ffmpeg')) continue;
        for (const bin of candidates) {
          const p = path.join(browsersPath, dir, bin);
          if (existsSync(p)) return p;
        }
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

/** What the resolved binary can actually do. A stripped build fails loudly here. */
function probeFfmpeg(bin: string): { x264: boolean; vp9: boolean; mp4: boolean } {
  const read = (args: string[]) => {
    try {
      return execFileSync(bin, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    } catch {
      return '';
    }
  };
  const encoders = read(['-hide_banner', '-encoders']);
  const muxers = read(['-hide_banner', '-muxers']);
  return {
    x264: encoders.includes('libx264'),
    vp9: encoders.includes('libvpx-vp9'),
    mp4: /^\s*\S*E\s+mp4\s/m.test(muxers),
  };
}

const FFMPEG = resolveFfmpeg();
const CAPS = FFMPEG ? probeFfmpeg(FFMPEG) : null;

function run(bin: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (d: Buffer) => {
      stderr += d.toString();
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${path.basename(bin)} exited ${code}\n${stderr.slice(-2000)}`)),
    );
  });
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

async function* walk(dir: string): AsyncGenerator<string> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

function rel(p: string): string {
  return path.relative(ROOT, p);
}

function fmt(bytes: number): string {
  return bytes >= MB ? `${(bytes / MB).toFixed(2)} MB` : `${Math.round(bytes / KB)} KB`;
}

/** Section id is the directory name directly under public/media/. */
function sectionOf(file: string): string {
  const r = path.relative(MEDIA_DIR, file);
  return r.split(path.sep)[0] ?? '';
}

function isThumb(stem: string): boolean {
  return /(^|-)(thumb|thumbnail)$/.test(stem);
}

async function record(file: string, budget: number, label: string) {
  const { size } = await stat(file);
  const report: Report = { file: rel(file), bytes: size, budget, label };
  if (size > budget) overBudget.push(report);
  return report;
}

/* ------------------------------------------------------------------ *
 * Images
 * ------------------------------------------------------------------ */

async function processImage(src: string) {
  const dir = path.dirname(src);
  const stem = path.basename(src, path.extname(src));
  const section = sectionOf(src);
  const thumb = isThumb(stem);
  const maxEdge = thumb ? MAX_EDGE.thumbnail : MAX_EDGE.image;
  const budget = thumb
    ? BUDGETS.thumbnail
    : section === 'hero'
      ? BUDGETS.heroPoster
      : BUDGETS.sectionImage;

  // .jpg fallback only for the hero, per contracts/assets.md.
  const targets: Array<{ ext: string; base: number; make: (p: Sharp, q: number) => Sharp }> = [
    { ext: '.webp', base: 82, make: (p, q) => p.webp({ quality: q, effort: 5 }) },
    { ext: '.avif', base: 55, make: (p, q) => p.avif({ quality: q, effort: 5 }) },
  ];
  if (section === 'hero') {
    targets.push({
      ext: '.jpg',
      base: 82,
      make: (p, q) => p.jpeg({ quality: q, mozjpeg: true, progressive: true }),
    });
  }

  for (const t of targets) {
    const out = path.join(dir, stem + t.ext);
    if (path.resolve(out) === path.resolve(src)) continue;
    if (!FORCE && existsSync(out)) {
      await record(out, budget, `image ${thumb ? '(thumb)' : ''}`.trim());
      continue;
    }
    if (CHECK_ONLY) {
      notes.push(`would write ${rel(out)}`);
      continue;
    }
    // contracts/assets.md: "Over budget means re-encode, not ship anyway." A
    // fixed quality is fine for most frames but blows the ceiling on dense ones
    // (city lights, foliage), so step down until it fits rather than reporting
    // a file we then ship anyway.
    let quality = t.base;
    for (;;) {
      const pipeline = sharp(src, { failOn: 'error' }).rotate().resize({
        width: maxEdge,
        height: maxEdge,
        fit: 'inside',
        withoutEnlargement: true,
      });
      await t.make(pipeline, quality).toFile(out);
      const { size } = await stat(out);
      if (size <= budget || quality <= QUALITY_FLOOR) break;
      quality = Math.max(QUALITY_FLOOR, quality - QUALITY_STEP);
    }
    if (quality !== t.base) {
      reencoded.push(
        `${rel(out)}: quality ${t.base} → ${quality} to fit the ${fmt(budget)} ceiling`,
      );
    }
    written.push(rel(out));
    await record(out, budget, `image ${thumb ? '(thumb)' : ''}`.trim());
  }
}

/* ------------------------------------------------------------------ *
 * Video
 * ------------------------------------------------------------------ */

async function processVideo(src: string) {
  const dir = path.dirname(src);
  const stem = path.basename(src, path.extname(src));
  const section = sectionOf(src);
  const budget = section === 'hero' ? BUDGETS.heroVideo : BUDGETS.heroVideo;
  const posterBudget = section === 'hero' ? BUDGETS.heroPoster : BUDGETS.sectionImage;

  const mp4 = path.join(dir, `${stem}.mp4`);
  const webm = path.join(dir, `${stem}.webm`);
  const posterPng = path.join(dir, `${stem}-poster.png`);
  const poster = path.join(dir, `${stem}-poster.webp`);

  if (!FFMPEG || !CAPS) {
    problems.push(
      `no ffmpeg found — cannot transcode or poster ${rel(src)}. ` +
        `Run \`npm i -D ffmpeg-static\` or set FFMPEG_PATH.`,
    );
    return;
  }
  if (!CAPS.x264 || !CAPS.vp9 || !CAPS.mp4) {
    problems.push(
      `${FFMPEG} is missing ` +
        [!CAPS.x264 && 'libx264', !CAPS.vp9 && 'libvpx-vp9', !CAPS.mp4 && 'the mp4 muxer']
          .filter(Boolean)
          .join(', ') +
        ` — cannot produce the formats contracts/assets.md requires for ${rel(src)}. ` +
        `Set FFMPEG_PATH to a full build (\`npm i -D ffmpeg-static\` installs one).`,
    );
    return;
  }

  // -- .mp4 (h.264) ------------------------------------------------------
  if (path.resolve(src) !== path.resolve(mp4) && (FORCE || !existsSync(mp4))) {
    if (CHECK_ONLY) notes.push(`would write ${rel(mp4)}`);
    else {
      await run(FFMPEG, [
        '-y',
        '-i',
        src,
        '-an', // silent, per contracts/assets.md
        '-c:v',
        'libx264',
        '-profile:v',
        'high',
        '-pix_fmt',
        'yuv420p',
        '-crf',
        '23',
        '-preset',
        'slow',
        '-movflags',
        '+faststart',
        mp4,
      ]);
      written.push(rel(mp4));
    }
  }

  // -- .webm (VP9) -------------------------------------------------------
  if (path.resolve(src) !== path.resolve(webm) && (FORCE || !existsSync(webm))) {
    if (CHECK_ONLY) notes.push(`would write ${rel(webm)}`);
    else {
      await run(FFMPEG, [
        '-y',
        '-i',
        src,
        '-an',
        '-c:v',
        'libvpx-vp9',
        '-crf',
        '34',
        '-b:v',
        '0',
        '-row-mt',
        '1',
        '-pix_fmt',
        'yuv420p',
        webm,
      ]);
      written.push(rel(webm));
    }
  }

  // -- poster from frame 0 ----------------------------------------------
  if (FORCE || !existsSync(poster)) {
    if (CHECK_ONLY) notes.push(`would write ${rel(poster)}`);
    else {
      await run(FFMPEG, ['-y', '-i', src, '-frames:v', '1', '-update', '1', posterPng]);
      await sharp(posterPng)
        .resize({
          width: MAX_EDGE.image,
          height: MAX_EDGE.image,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80, effort: 5 })
        .toFile(poster);
      await rm(posterPng, { force: true });
      written.push(rel(poster));
    }
  }

  for (const f of [mp4, webm]) if (existsSync(f)) await record(f, budget, 'video');
  if (existsSync(poster)) await record(poster, posterBudget, 'poster');
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

async function main() {
  await mkdir(MEDIA_DIR, { recursive: true });

  const files: string[] = [];
  for await (const f of walk(MEDIA_DIR)) files.push(f);

  const sources = files.filter((f) => !DERIVED.test(f));
  const images = pickSources(
    sources.filter((f) => IMAGE_SOURCES.has(path.extname(f).toLowerCase())),
    IMAGE_PREFERENCE,
  );
  const videos = pickSources(
    sources.filter((f) => VIDEO_SOURCES.has(path.extname(f).toLowerCase())),
    VIDEO_PREFERENCE,
  );

  console.log(
    `[media] ${rel(MEDIA_DIR)} — ${images.length} image source(s), ${videos.length} video source(s)` +
      (CHECK_ONLY ? '  [check only, no writes]' : ''),
  );
  if (FFMPEG) {
    console.log(
      `[media] ffmpeg: ${FFMPEG}` +
        (CAPS
          ? `  (h264 ${CAPS.x264 ? 'yes' : 'NO'}, vp9 ${CAPS.vp9 ? 'yes' : 'NO'}, mp4 ${CAPS.mp4 ? 'yes' : 'NO'})`
          : ''),
    );
  } else {
    console.log('[media] ffmpeg: not found — video work will be reported as a problem');
  }

  if (!images.length && !videos.length) {
    console.log('[media] nothing to do. Drop assets in public/media/{section-id}/ and re-run.');
  }

  // Sequential: sharp and ffmpeg are both already multi-threaded, and running
  // them in parallel on a small box just makes everything slower.
  for (const f of images) {
    try {
      await processImage(f);
    } catch (err) {
      problems.push(`${rel(f)}: ${(err as Error).message}`);
    }
  }
  for (const f of videos) {
    try {
      await processVideo(f);
    } catch (err) {
      problems.push(`${rel(f)}: ${(err as Error).message}`);
    }
  }

  // Every video must have a poster (contracts/assets.md). Check the shipped set.
  for (const v of videos) {
    const stem = path.basename(v, path.extname(v));
    const poster = path.join(path.dirname(v), `${stem}-poster.webp`);
    if (!existsSync(poster) && !CHECK_ONLY) problems.push(`${rel(v)}: no poster was produced`);
  }

  if (written.length) {
    console.log(`\n[media] wrote ${written.length} file(s):`);
    for (const w of written) console.log(`  + ${w}`);
  }
  if (notes.length) {
    console.log(`\n[media] would write ${notes.length} file(s):`);
    for (const n of notes) console.log(`  · ${n}`);
  }

  if (reencoded.length) {
    console.log(`\n[media] stepped quality down to stay inside the ceiling:`);
    for (const r of reencoded) console.log(`  ~ ${r}`);
  }

  if (overBudget.length) {
    console.error(`\n[media] OVER BUDGET — contracts/assets.md says re-encode, not ship anyway:`);
    for (const r of overBudget) {
      console.error(`  ! ${r.file}  ${fmt(r.bytes)}  (${r.label} ceiling ${fmt(r.budget)})`);
    }
  } else {
    console.log('\n[media] all shipped assets are within their size ceilings.');
  }

  if (problems.length) {
    console.error(`\n[media] problems:`);
    for (const p of problems) console.error(`  ! ${p}`);
  }

  if (problems.length || (CHECK_ONLY && overBudget.length)) process.exit(1);
  if (overBudget.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error('[media] failed:', err);
  process.exit(1);
});
