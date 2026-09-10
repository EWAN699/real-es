/**
 * Hebrew font data for the OG image route, decoded from the WOFF base64 baked
 * in by scripts/gen-og-font.ts. No filesystem access, no bundler path
 * resolution and no network — all three are unreliable in a serverless bundle.
 */
import {
  hebrew400Base64,
  hebrew700Base64,
  latin400Base64,
  latin700Base64,
} from '@/lib/generated/og-font';

export interface OgFont {
  name: 'Heebo';
  data: ArrayBuffer;
  style: 'normal';
  weight: 400 | 700;
}

function toArrayBuffer(base64: string): ArrayBuffer {
  const buf = Buffer.from(base64, 'base64');
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

let cache: OgFont[] | null = null;

/** Hebrew and Latin cuts at 400 and 700. Decoded once per process. */
export function heeboFonts(): OgFont[] {
  cache ??= [
    { name: 'Heebo', data: toArrayBuffer(hebrew400Base64), style: 'normal', weight: 400 },
    { name: 'Heebo', data: toArrayBuffer(latin400Base64), style: 'normal', weight: 400 },
    { name: 'Heebo', data: toArrayBuffer(hebrew700Base64), style: 'normal', weight: 700 },
    { name: 'Heebo', data: toArrayBuffer(latin700Base64), style: 'normal', weight: 700 },
  ];
  return cache;
}
