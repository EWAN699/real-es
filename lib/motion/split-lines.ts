/**
 * Splits an element's text into LINE spans — never characters.
 *
 * contracts/motion.spec.md: "Lines only. Hebrew is cursive-joined in many faces
 * and per-character splitting breaks glyph shaping." This also keeps the text
 * a single run for the shaper within each line.
 *
 * Operates on plain text (`textContent`). Headings in content/pages.json are
 * typed `string`, so there is no inline markup to preserve. The original text
 * is restored by the returned `revert`.
 */
export interface SplitResult {
  /** The animatable inner span of each line, in reading order. */
  lines: HTMLElement[];
  /** Puts the element back exactly as it was. */
  revert: () => void;
}

const MASK_CLASS = 'motion-line';
const INNER_CLASS = 'motion-line-inner';

export function splitIntoLines(el: HTMLElement): SplitResult {
  const original = el.innerHTML;
  const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();

  if (!text) {
    return {
      lines: [],
      revert: () => {
        el.innerHTML = original;
      },
    };
  }

  // 1. one span per word, so the browser's own line breaking can be measured.
  const words = text.split(' ');
  el.textContent = '';
  const wordSpans = words.map((word, i) => {
    const span = document.createElement('span');
    span.textContent = i === words.length - 1 ? word : `${word} `;
    span.style.display = 'inline-block';
    el.appendChild(span);
    return span;
  });

  // 2. group by vertical position — that is where the browser broke the lines.
  const groups: HTMLElement[][] = [];
  let lastTop: number | null = null;
  for (const span of wordSpans) {
    const top = span.offsetTop;
    if (lastTop === null || Math.abs(top - lastTop) > 1) {
      groups.push([span]);
      lastTop = top;
    } else {
      groups.at(-1)!.push(span);
    }
  }

  // 3. rebuild as masked lines.
  el.textContent = '';
  const lines: HTMLElement[] = [];
  for (const group of groups) {
    const mask = document.createElement('span');
    mask.className = MASK_CLASS;
    const inner = document.createElement('span');
    inner.className = INNER_CLASS;
    inner.textContent = group
      .map((s) => s.textContent ?? '')
      .join('')
      .trimEnd();
    mask.appendChild(inner);
    el.appendChild(mask);
    lines.push(inner);
  }

  return {
    lines,
    revert: () => {
      el.innerHTML = original;
    },
  };
}
