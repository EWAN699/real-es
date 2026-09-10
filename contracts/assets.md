# Asset contract

Where media lives, what formats it ships in, and how big it is allowed to be.

## Location and naming

```
public/media/{section-id}/{variant}.{ext}
```

- `{section-id}` matches the section's `id` in `content/pages.json` exactly.
- `{variant}` is kebab-case and describes the asset, not its position: `hero-loop`,
  `tower-dusk`, `lobby-detail`. Never `image1`, `img-final-v2`.
- Generated derivatives keep the stem: `hero-loop.mp4`, `hero-loop.webm`, `hero-loop-poster.webp`.

The `src` in `pages.json` is the path from `public/`, e.g. `/media/hero/hero-loop.mp4`.

## Formats

| Kind | Ships as | Source kept |
| --- | --- | --- |
| Image | `.webp` **and** `.avif`, plus a `.jpg` fallback for the hero only | Original in `assets/source/` (gitignored if over 5 MB) |
| Video | `.mp4` (h.264) **and** `.webm` (VP9) | Original Kling download in `assets/source/` |
| Poster | `.webp` | Extracted from frame 0 by `scripts/optimize-media.ts` |

Every video has a poster. A video without one fails the build.

## Size ceilings

| Asset | Max shipped | Dimensions |
| --- | --- | --- |
| Hero video | 3.5 MB per format | 1920×1080, ≤ 10s, silent, loops seamlessly |
| Hero poster | 150 KB | 1920×1080 |
| Section image | 400 KB per format | Longest edge 2000px |
| Thumbnail | 80 KB | Longest edge 800px |

Over budget means re-encode, not ship anyway.

## Required attributes

- **`alt` on every image and video**, in Hebrew, describing content rather than
  restating the heading. Decorative-only assets still need `alt` — say what they show.
- **Explicit `width`/`height` or an `aspect-ratio` box** on everything, so lazy loading
  never shifts layout.
- **`loading="lazy"`** on all media below the fold; the hero loads eagerly.
- **`origin`** recorded in `pages.json`: `kling`, `original-site`, or `placeholder`.

## Placeholders

`origin: "placeholder"` is allowed during the build so sections can be developed before
assets exist. The production build **fails** if any placeholder remains. This is a
build-time check in `lib/content.ts`, not a convention to remember.

## Kling specifics

- Result URLs expire ~24h after generation. Download immediately, never link to them.
- Log every job — generation id, model, prompt, cost-bearing parameters — to
  `content/asset-log.md` as it happens, so a failed run can be traced without re-running.
- Kling jobs cost money. No trial runs, no silent retries, no resubmission after an
  error without asking first.
