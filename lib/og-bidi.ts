/**
 * RTL text for the OG image.
 *
 * Satori does not implement the Unicode Bidirectional Algorithm: it draws
 * codepoints in logical order, so Hebrew comes out letter-reversed even inside
 * a `direction: rtl` box. The fix is to hand satori text that is already in
 * VISUAL order, and lay it out LTR, flush end.
 *
 * Because the string is then in visual order, satori's own line wrapping would
 * break it in the wrong places — so lines are decided here, before reordering,
 * and each line is reordered independently.
 *
 * Only the OG renderer needs this. The site itself is real HTML in a real
 * browser, which does bidi properly.
 */
import bidiFactory from 'bidi-js';

const bidi = bidiFactory();

/** Logical string -> visual string, resolved in an RTL paragraph context. */
export function toVisual(text: string): string {
  return bidi.getReorderedString(text, bidi.getEmbeddingLevels(text, 'rtl'));
}

/**
 * Rough advance width. Satori gives us no measurement API, so this is an
 * estimate tuned for Heebo: Hebrew and Latin letters sit near 0.52em, digits
 * and spaces a little under.
 */
function estimateWidth(text: string, fontSize: number): number {
  let em = 0;
  for (const ch of text) {
    if (ch === ' ') em += 0.26;
    else if (/[.,:;!?'"()[\]{}|/\\-]/.test(ch)) em += 0.3;
    else if (/[0-9]/.test(ch)) em += 0.55;
    else em += 0.52;
  }
  return em * fontSize;
}

/**
 * Wrap in logical order, then reorder each line to visual order.
 * Returns lines ready to render LTR, flush end.
 */
export function visualLines(
  text: string,
  opts: { fontSize: number; maxWidth: number; maxLines?: number },
): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (!words.length) return [];

  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && estimateWidth(candidate, opts.fontSize) > opts.maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  if (opts.maxLines && lines.length > opts.maxLines) {
    const kept = lines.slice(0, opts.maxLines);
    kept[kept.length - 1] = `${kept[kept.length - 1]}…`;
    return kept.map(toVisual);
  }
  return lines.map(toVisual);
}
