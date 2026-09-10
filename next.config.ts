import type { NextConfig } from 'next';
import { PHASE_PRODUCTION_BUILD } from 'next/constants.js';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Local media only; nothing is fetched from a remote host.
    formats: ['image/avif', 'image/webp'],
  },
};

/**
 * The config is exported as a function so we can see the PHASE.
 *
 * `next build` and `next start` both run with NODE_ENV=production, and Next 16
 * does not expose NEXT_PHASE as an environment variable, so NODE_ENV alone
 * cannot tell "we are producing a build" from "we are serving one". That
 * distinction matters: the placeholder gate in lib/content.ts must stop a
 * build from being produced, but must NOT 500 a server that is running a build
 * which was already allowed through.
 *
 * The phase is therefore stamped into the environment here, where Next hands
 * it to us, and inherited by the build workers.
 */
export default function config(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD) {
    process.env.CONTENT_GATE = 'production';
  }
  return nextConfig;
}
