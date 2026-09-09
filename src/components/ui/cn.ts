/**
 * Minimal class-name joiner.
 *
 * Deliberately not `tailwind-merge`: no extra dependency, and the primitives in
 * this folder are written so that a caller's `className` never has to fight a
 * variant class for the same CSS property. Where an override is legitimately
 * needed the primitive exposes a prop for it instead.
 */
export type ClassValue = string | number | false | null | undefined | ClassValue[];

export function cn(...values: ClassValue[]): string {
  const out: string[] = [];

  for (const value of values) {
    if (!value && value !== 0) continue;

    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
      continue;
    }

    out.push(String(value));
  }

  return out.join(' ').replace(/\s+/g, ' ').trim();
}
