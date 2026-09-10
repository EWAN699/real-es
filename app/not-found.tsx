import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      id="main"
      className="mx-auto grid min-h-dvh max-w-2xl place-content-center px-6 text-center"
    >
      <h1 className="text-5xl font-bold">404</h1>
      <p className="mt-4 text-lg text-ink-muted">הדף שחיפשתם לא נמצא.</p>
      <p className="mt-8">
        <Link href="/" className="text-accent underline underline-offset-4">
          חזרה לדף הבית
        </Link>
      </p>
    </main>
  );
}
