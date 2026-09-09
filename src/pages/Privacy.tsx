import { Link } from 'react-router-dom';

import { PageHeader } from '@/components/PageHeader';
import { Seo } from '@/components/Seo';
import { Heading } from '@/components/ui/Heading';
import { Prose } from '@/components/ui/Prose';
import { Section } from '@/components/ui/Section';
import { contact, telHref } from '@/content/contact';

/**
 * מדיניות פרטיות.
 *
 * Describes what this site actually does, which is unusually little: one form,
 * one endpoint, no analytics, no advertising pixels, no cookies of our own and
 * no third-party CAPTCHA. Everything stated here is verifiable in the codebase —
 * `api/lead.ts` for what happens to a submission, `src/components/ui/Field.tsx`
 * for the honeypot that replaces reCAPTCHA, and the e2e suite for the assertion
 * that no third-party script loads on first paint.
 *
 * REVIEW — a privacy policy is a legal document. This one is written to match
 * the implementation rather than to be comprehensive boilerplate; the client's
 * counsel should review it, and it must be revisited the moment analytics, a
 * chat widget or a remarketing pixel is added, because each of those changes
 * every answer on this page.
 */
const POLICY_UPDATED = '2026-09-09';
const POLICY_UPDATED_LABEL = '9 בספטמבר 2026';

export function Component() {
  return (
    <>
      <Seo
        title="מדיניות פרטיות"
        description="איזה מידע נאסף באתר קבוצת קיסר, למה הוא משמש, למי הוא מועבר וכיצד אפשר לבקש לעיין בו או למחוק אותו."
        path="/privacy"
      />

      <PageHeader
        eyebrow="פרטיות"
        title="מדיניות פרטיות"
        lede="בקצרה: האתר אוסף רק את מה שאתם ממלאים בטופס, לא עוקב אחריכם, ולא מטמיע כלי פרסום או מדידה של צד שלישי."
        crumbs={[
          { label: 'דף הבית', to: '/' },
          { label: 'מדיניות פרטיות', to: '/privacy' },
        ]}
      />

      <Section labelledBy="privacy-collect-title" tone="default" width="narrow">
        <Heading level={2} id="privacy-collect-title">
          איזה מידע נאסף
        </Heading>

        <Prose className="mt-6">
          <p>
            <strong>מה שאתם מוסרים בטופס.</strong> שם, טלפון, ובאופן אופציונלי אימייל, נושא
            הפנייה והודעה חופשית. אלה השדות היחידים בטופס, והם נשלחים רק כאשר אתם לוחצים על
            כפתור השליחה.
          </p>
          <p>
            <strong>כתובת ה־IP של הפנייה.</strong> נשמרת לזמן קצר בשרת הטיפול בטפסים לצורך הגבלת
            קצב פניות ומניעת הצפה אוטומטית, ואינה מצורפת לפנייה עצמה.
          </p>
          <p>
            <strong>מה לא נאסף.</strong> אין באתר מערכת ניתוח תנועה, אין פיקסלים פרסומיים, אין
            כפתורי שיתוף שמדווחים לרשתות חברתיות ואין CAPTCHA של צד שלישי — במקומו יש שדה מלכודת
            נסתר שאינו נגיש למשתמשים אנושיים. איננו יוצרים פרופיל גולש ואיננו מבצעים החלטות
            אוטומטיות לגביכם.
          </p>
        </Prose>
      </Section>

      <Section labelledBy="privacy-use-title" tone="contrast" width="narrow">
        <Heading level={2} id="privacy-use-title">
          למה המידע משמש ולמי הוא מועבר
        </Heading>

        <Prose className="mt-6">
          <p>
            הפרטים משמשים כדי לחזור אליכם בעניין הפנייה שלכם ולנהל את הקשר איתנו — ולא לשום מטרה
            אחרת. איננו מוכרים מידע ואיננו מעבירים אותו לצדדים שלישיים למטרות שיווק.
          </p>
          <p>
            הפנייה מועברת אלינו בדואר אלקטרוני באמצעות ספק שירות דואר (Resend), שמשמש כמעבד מידע
            עבורנו לצורך המשלוח בלבד. פרטי הפנייה אינם נרשמים ביומני השרת: היומן מתעד את נושא
            הפנייה, את הדף שממנו נשלחה ואת תוצאת השליחה, ולא את תוכנה.
          </p>
        </Prose>
      </Section>

      <Section labelledBy="privacy-cookies-title" tone="default" width="narrow">
        <Heading level={2} id="privacy-cookies-title">
          עוגיות ואחסון מקומי
        </Heading>

        <Prose className="mt-6">
          <p>
            האתר אינו מציב עוגיות מעקב ואינו זקוק לעוגיות כדי לפעול. שירות האחסון שמגיש את הדפים
            עשוי להשתמש בעוגיות טכניות או ביומני שרת לצורכי אבטחה ותפעול תקין.
          </p>
          <p>
            קישורים באתר מובילים לעיתים לאתרים חיצוניים — למשל וואטסאפ, רשתות חברתיות או האתר
            המסחרי של הקבוצה. מרגע המעבר חלה מדיניות הפרטיות של אותו שירות.
          </p>
        </Prose>
      </Section>

      <Section labelledBy="privacy-rights-title" tone="contrast" width="narrow">
        <Heading level={2} id="privacy-rights-title">
          הזכויות שלכם
        </Heading>

        <Prose className="mt-6">
          <p>
            לפי חוק הגנת הפרטיות, התשמ״א־1981, אתם רשאים לבקש לעיין במידע שנמסר עליכם, לבקש את
            תיקונו אם אינו נכון, ולבקש את מחיקתו. אפשר גם לבקש שנפסיק לפנות אליכם — נעשה זאת בלי
            לשאול שאלות.
          </p>
          <p>
            שמירת המידע היא לפרק הזמן הדרוש לטיפול בפנייה ולניהול הקשר העסקי, ולאחר מכן המידע
            נמחק או נשמר לפי חובה שבדין.
          </p>
          <ul>
            <li>
              טלפון:{' '}
              <a href={telHref(contact.nationalPhone)} className="tabular" dir="ltr">
                {contact.nationalPhone}
              </a>
            </li>
            <li>
              אימייל: <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </li>
            <li>
              טופס: <Link to="/contact">דף צרו קשר</Link>
            </li>
          </ul>
          <p>
            מדיניות זו עשויה להתעדכן. תאריך העדכון האחרון:{' '}
            <time dateTime={POLICY_UPDATED}>{POLICY_UPDATED_LABEL}</time>.
          </p>
        </Prose>
      </Section>
    </>
  );
}

Component.displayName = 'Privacy';
