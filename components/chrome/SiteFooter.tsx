/**
 * Site footer.
 *
 * Everything here comes from `site.contact` in content/pages.json — no contact
 * detail is typed into a component, so there is exactly one place to correct a
 * phone number. Phone and email are `.numeral`/LTR-isolated for the same reason
 * they are elsewhere: Latin digits inside RTL Hebrew get reordered otherwise.
 */
import { site } from '@/lib/content';

const YEAR = new Date().getFullYear();

export function SiteFooter() {
  const { phones = [], emails = [], address, social = [] } = site.contact ?? {};

  return (
    <footer className="section-dark border-t border-line">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="text-lg font-bold">{site.name}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">{site.tagline}</p>
        </div>

        {phones.length ? (
          <div>
            <h2 className="text-sm font-semibold">טלפון</h2>
            <ul className="mt-3 space-y-2">
              {phones.map((phone) => (
                <li key={phone}>
                  <a
                    href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                    className="numeral text-sm text-accent-text hover:underline"
                  >
                    {phone}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {emails.length || address ? (
          <div>
            <h2 className="text-sm font-semibold">כתובת ודוא&quot;ל</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-muted">
              {emails.map((email) => (
                <li key={email}>
                  <a href={`mailto:${email}`} className="numeral text-accent-text hover:underline">
                    {email}
                  </a>
                </li>
              ))}
              {address ? <li>{address}</li> : null}
            </ul>
          </div>
        ) : null}

        {social.length ? (
          <div>
            <h2 className="text-sm font-semibold">רשתות</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {social.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    rel="noopener noreferrer me"
                    target="_blank"
                    className="text-accent-text hover:underline"
                  >
                    {item.platform}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="border-t border-line">
        <p className="mx-auto w-full max-w-6xl px-6 py-6 text-xs text-ink-muted">
          <span className="numeral">© {YEAR}</span> {site.name}
        </p>
      </div>
    </footer>
  );
}
