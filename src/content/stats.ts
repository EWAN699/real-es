import { parseAll, statSchema, type Stat } from './types';

/**
 * The "ההצלחות שלנו" counters, migrated verbatim from the legacy homepage.
 *
 * Every one of them is `confirmed: false`, and that is not caution for its own
 * sake — the legacy page contradicts itself:
 *
 *  - The counter reads **7 שנות ניסיון**, while the about copy two sections
 *    above it says the brand "נבנה במשך מעל עשר שנים" — over ten years.
 *  - The counter reads **69** under the label "ציון בסקר לקוחות", while the
 *    customer-survey testimonial on the same page says the score was **9.6**
 *    ("זכתה קיסר בציון 9.6 בשקלול סופי"). 69 is not a score on any scale the
 *    page describes.
 *  - 7 franchisees, 9 in-house experts and 216 managed projects are stated
 *    nowhere else and cannot be checked against anything.
 *
 * These are not reconciled here, and no figure is quietly corrected. The values
 * are recorded as published so the client can see exactly what their site has
 * been claiming, and `confirmed` gates rendering: the UI withholds an
 * unconfirmed figure rather than guessing at it. Flip a flag to `true` only
 * when the client confirms that specific number.
 *
 * The 9.6 survey score is *not* added here as a substitute figure. It lives
 * where it actually appears — in the survey testimonial, in the client's own
 * words, attributed.
 */
export const stats: Stat[] = parseAll(
  statSchema,
  [
    {
      id: 'franchisees',
      value: 7,
      label: 'זכיינים לרשותכם',
      // Unsubstantiated: appears only in the counter widget.
      confirmed: false,
    },
    {
      id: 'experts',
      value: 9,
      label: 'מומחים בתחום העומדים לרשותנו',
      // Unsubstantiated: appears only in the counter widget.
      confirmed: false,
    },
    {
      id: 'projects',
      value: 216,
      label: 'פרויקטים מנוהלים בהצלחה',
      // Unsubstantiated: appears only in the counter widget.
      confirmed: false,
    },
    {
      id: 'survey-score',
      value: 69,
      label: 'ציון בסקר לקוחות ומאות ממליצים',
      // Contradicted on the same page: the survey testimonial states 9.6.
      confirmed: false,
    },
    {
      id: 'years',
      value: 7,
      suffix: '+',
      label: 'שנות ניסיון והמלצות',
      // Contradicted on the same page: the about copy says "מעל עשר שנים".
      confirmed: false,
    },
  ],
  'stat',
);

/** What the UI may render today. Empty until the client confirms a figure. */
export const confirmedStats: Stat[] = stats.filter((stat) => stat.confirmed);

/** Everything still waiting on the client, for the content-review report. */
export const unconfirmedStats: Stat[] = stats.filter((stat) => !stat.confirmed);
