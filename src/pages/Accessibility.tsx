import { Link } from 'react-router-dom';

import { PageHeader } from '@/components/PageHeader';
import { Seo } from '@/components/Seo';
import { Heading } from '@/components/ui/Heading';
import { Prose } from '@/components/ui/Prose';
import { Section } from '@/components/ui/Section';
import { contact, telHref } from '@/content/contact';

/**
 * הצהרת נגישות — the accessibility statement.
 *
 * Legally required of an Israeli commercial site under the Equal Rights for
 * Persons with Disabilities (Service Accessibility Adjustments) Regulations,
 * which adopt IS 5568 — the Israeli standard that tracks WCAG 2.0 level AA.
 * This build targets WCAG 2.1 AA, a superset.
 *
 * It is written to be true rather than reassuring. Every claim below describes
 * something in this codebase and is covered by a test: the contrast of the
 * palette (`src/styles/tokens.test.ts`), the logical-property and colour rules
 * (`src/styles/conventions.test.ts`), keyboard operation and a zero-violation
 * axe pass on every page (`e2e/`). The known limitations are listed because a
 * statement that claims full conformance while content is still being migrated
 * is worth nothing to the person reading it.
 *
 * REVIEW — the regulations require a named accessibility coordinator (רכז
 * נגישות) with their own contact details. The client has not supplied one, so
 * this page publishes the group's own channels and says who to write to. Add the
 * coordinator's name here before go-live.
 *
 * The date is the date this statement was written. Update it whenever the
 * statement changes — an accessibility statement carrying a stale date is a
 * finding in itself.
 */
const STATEMENT_UPDATED = '2026-09-09';
const STATEMENT_UPDATED_LABEL = '9 בספטמבר 2026';

export function Component() {
  return (
    <>
      <Seo
        title="הצהרת נגישות"
        description="הצהרת הנגישות של אתר קבוצת קיסר — רמת הנגישות, מה נעשה, מגבלות ידועות ודרך לפנות אלינו."
        path="/accessibility"
      />

      <PageHeader
        eyebrow="נגישות"
        title="הצהרת נגישות"
        lede="אנחנו רואים בנגישות האתר חלק מהשירות, ולא תוסף שמורכב עליו. זו התמונה המלאה, כולל מה שעדיין לא הושלם."
        crumbs={[
          { label: 'דף הבית', to: '/' },
          { label: 'הצהרת נגישות', to: '/accessibility' },
        ]}
      />

      <Section labelledBy="a11y-standard-title" tone="default" width="narrow">
        <Heading level={2} id="a11y-standard-title">
          רמת הנגישות של האתר
        </Heading>

        <Prose className="mt-6">
          <p>
            האתר נבנה כך שיעמוד בתקן הישראלי ת״י 5568 ברמה AA, המבוסס על הנחיות{' '}
            <span dir="ltr">WCAG 2.0</span>, ובנוסף בהנחיות <span dir="ltr">WCAG 2.1</span> ברמה
            AA — בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות),
            התשע״ג־2013.
          </p>
          <p>
            הנגישות מוטמעת בקוד האתר עצמו. לא מותקן באתר תוסף או ווידג׳ט נגישות חיצוני: תוסף כזה
            אינו הופך אתר לנגיש — הוא יושב מעל אותו קוד — ובדרך כלל גם מאט את הטעינה ומעביר מידע
            על הגולשים לצד שלישי.
          </p>
        </Prose>
      </Section>

      <Section labelledBy="a11y-done-title" tone="contrast" width="narrow">
        <Heading level={2} id="a11y-done-title">
          מה נעשה באתר
        </Heading>

        <Prose className="mt-6">
          <ul>
            <li>
              מבנה סמנטי מלא: אזורי ניווט, תוכן ראשי וכותרת תחתונה מסומנים, ובכל דף כותרת ראשית
              אחת והיררכיית כותרות מסודרת.
            </li>
            <li>
              הפעלה מלאה מהמקלדת, כולל קישור דילוג לתוכן, סימון מיקוד ברור בכל רכיב, ותפריט נייד
              שנפתח, לוכד מיקוד וניתן לסגירה במקש <span dir="ltr">Esc</span>.
            </li>
            <li>
              ניגודיות צבע: צבע הטקסט והקישורים נבחר כך שיעמוד ביחס של 4.5:1 לפחות. הירוק של
              הלוגו שימש באתר הקודם כצבע טקסט ביחס של כ־2:1, והוא משמש כאן כצבע מילוי בלבד.
            </li>
            <li>טקסט חלופי לתמונות, ותמונות שנועדו לקישוט בלבד מוסתרות מקוראי מסך.</li>
            <li>
              טפסים עם תוויות קבועות, הודעות שגיאה בעברית שמוצמדות לשדה ומוכרזות, ומעבר מיקוד
              לשדה הראשון שדורש תיקון.
            </li>
            <li>
              כיבוד העדפת המערכת להפחתת תנועה: מי שהגדיר <span dir="ltr">prefers-reduced-motion</span>{' '}
              לא יראה אנימציות. התוכן עצמו אינו תלוי באנימציה ומוצג במלואו גם כאשר JavaScript אינו
              פועל.
            </li>
            <li>תמיכה בהגדלת טקסט ובשינוי גודל תצוגה, בלי אובדן תוכן ובלי גלילה לרוחב.</li>
            <li>
              כל דף באתר נבדק אוטומטית בכלי בדיקת נגישות ובבדיקות הפעלה מהמקלדת, בשלושה רוחבי
              מסך, ותקלה בבדיקה מונעת את פרסום הגרסה.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section labelledBy="a11y-limits-title" tone="default" width="narrow">
        <Heading level={2} id="a11y-limits-title">
          מגבלות ידועות
        </Heading>

        <Prose className="mt-6">
          <ul>
            <li>
              חלק מהתוכן, ובכללו כתבות הבלוג והחדשות, נמצא בהעברה מהאתר הקודם. עד להשלמת ההעברה
              מוצגת בדפים אלה הכותרת בלבד, ולא תאריך או תקציר שאיננו יודעים שהם נכונים.
            </li>
            <li>
              תמונות של נכסים מסוימים טרם פורסמו. בדפים אלה נאמר במפורש שאין תמונות, במקום להציג
              תמונה שאינה של הנכס.
            </li>
            <li>
              תוכן המתפרסם בערוצים חיצוניים של הקבוצה (רשתות חברתיות, וידאו) אינו בשליטתנו ורמת
              הנגישות שלו נקבעת על ידי אותם שירותים.
            </li>
          </ul>
          <p>
            אנחנו ממשיכים לתקן ולשפר. אם נתקלתם בקושי, זה בדיוק המידע שאנחנו צריכים.
          </p>
        </Prose>
      </Section>

      <Section labelledBy="a11y-contact-title" tone="contrast" width="narrow">
        <Heading level={2} id="a11y-contact-title">
          פנייה בנושא נגישות
        </Heading>

        <Prose className="mt-6">
          <p>
            נשמח לקבל פנייה על כל תקלה, קושי או דרישה להתאמת נגישות באתר. נטפל בפנייה ונחזור עם
            תשובה.
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
              טופס יצירת קשר: <Link to="/contact">דף צרו קשר</Link>
            </li>
          </ul>
          <p>
            תאריך עדכון ההצהרה:{' '}
            <time dateTime={STATEMENT_UPDATED}>{STATEMENT_UPDATED_LABEL}</time>.
          </p>
        </Prose>
      </Section>
    </>
  );
}

Component.displayName = 'Accessibility';
