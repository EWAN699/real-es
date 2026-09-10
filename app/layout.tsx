import type { Metadata, Viewport } from 'next';

// Self-hosted Hebrew webfont. next/font/google is not usable here — the build
// environment has no route to fonts.googleapis.com — so the family comes from
// npm and is served from our own origin. Fallback stack: app/globals.css.
import '@fontsource-variable/heebo';
import './globals.css';

import { LenisProvider } from '@/components/motion/LenisProvider';
import { organisationJsonLd, rootMetadata } from '@/lib/seo';

export const metadata: Metadata = rootMetadata();

export const viewport: Viewport = {
  themeColor: '#101317',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <a href="#main" className="visually-hidden focus:not-sr-only">
          דלג לתוכן הראשי
        </a>
        <LenisProvider>{children}</LenisProvider>
        <script
          type="application/ld+json"
          // Static, generated from content/pages.json — no user input reaches it.
          dangerouslySetInnerHTML={{ __html: organisationJsonLd() }}
        />
      </body>
    </html>
  );
}
