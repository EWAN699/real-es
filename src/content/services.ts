import { parseAll, serviceSchema, type Division, type Service } from './types';

/**
 * The service pages, keyed to the three divisions the group is organised around.
 *
 * PROVENANCE. Only one page of the legacy site could be read — the homepage.
 * Two records below therefore carry the client's own words and are
 * `needsReview: false`:
 *
 *   `property-management` and `construction`, whose bodies are the numbered
 *   division descriptions printed verbatim in the homepage's "אודות קבוצת קיסר"
 *   block, spelling, emphasis and all. Their summaries are trimmed clauses of
 *   those same sentences, not new writing.
 *
 * Everything else is `needsReview: true`. For those pages we had the client's
 * navigation label and tile caption and nothing more, so the body is a short,
 * deliberately unembellished draft that makes no claim the homepage does not
 * make. Replace it with the real page copy from the client's export; do not
 * treat it as theirs.
 *
 * The third division's own description was cut off behind a "קרא עוד…" link, so
 * `investment` is drafted too.
 *
 * TITLES. The legacy `<title>`s and link text stacked every city served into one
 * string ("ניהול נכסים בתל אביב | ניהול נכסים בהרצליה | ניהול נכסים ברמת גן…").
 * Titles here name the service once, for a person. The geographic long tail is a
 * job for real area pages, not for a title tag.
 *
 * All new pages live at `/services/<slug>`.
 */
export const services: Service[] = parseAll(
  serviceSchema,
  [
    // ---------------------------------------------------------------- management
    {
      slug: 'property-management',
      division: 'management' satisfies Division,
      title: 'ניהול נכסים',
      // Trimmed from the client's own sentence, below.
      summary: 'ניהול והשבחה של כל סוגי הנכסים – למכירה, להשכרה או להשקעה.',
      body: [
        'המחלקה לניהול נכסים מתמחה בניהול והשבחה של כל סוגי הנכסים למכירה, להשכרה או להשקעה וכולל שיווק פרויקטים חדשים ונדל"ן מסחרי, בשיטות עבודה ייחודיות ומתקדמת שפתחנו, וללא דמי ניהול או עמלות תיווך.',
        'בין היתר המחלקה מנהלת דירות להשקעה ומלווה משקיעי דירות וגם מתמחה בשדרוג ועיצוב בתים, ניהול מתחמי ומגורי יוקרה, ועדי בתים ושטחי מסחר.',
      ],
      image: 'division-management',
      legacyPaths: ['/ניהול-נכסים-ניהול-נכסים/'],
      needsReview: false,
    },
    {
      slug: 'rental-management',
      division: 'management',
      title: 'ניהול נכסים להשכרה',
      summary: 'החבילה המלאה לבעל דירה מושכרת: שוכרים, חוזה, גבייה ותחזוקה.',
      body: [
        'הדף מרכז את חבילת ניהול ההשכרה של קבוצת קיסר – איתור שוכרים, חוזה, גבייה וטיפול שוטף בנכס.',
      ],
      legacyPaths: ['/ניהול-נכסים-ניהול-נכסים/ניהול-נכסים-להשכרה-החבילה-שלנו/'],
      needsReview: true,
    },
    {
      slug: 'sales-marketing',
      division: 'management',
      title: 'שיווק וניהול נכסים למכירה',
      summary: 'ליווי בעל נכס משלב ההכנה למכירה ועד חתימת העסקה.',
      body: ['הדף מרכז את שירותי השיווק והמכירה של קבוצת קיסר לבעלי נכסים.'],
      legacyPaths: ['/ניהול-נכסים-ניהול-נכסים/ניהול-נכסים-למכירה/'],
      needsReview: true,
    },
    {
      slug: 'valuation',
      division: 'management',
      // The client's own page name, kept because it is how people search for it.
      title: 'רוצה לדעת כמה הדירה שלך שווה?',
      summary: 'בקשה להערכת שווי לנכס שלך.',
      body: ['טופס פנייה לקבלת הערכת שווי לנכס. הפנייה מגיעה ישירות לצוות הניהול.'],
      legacyPaths: [
        '/ניהול-נכסים-ניהול-נכסים/רוצה-לדעת-כמה-הדירה-שלך-שווה/',
        '/רוצה-לדעת-כמה-הדירה-שלך-שווה/',
      ],
      needsReview: true,
    },
    {
      slug: 'investor-portfolio',
      division: 'management',
      title: 'ניהול דירות להשקעה וליווי משקיעים',
      summary: 'ניהול תיק דירות להשקעה וליווי אישי של המשקיע.',
      body: ['הדף מרכז את ליווי המשקיעים של קבוצת קיסר וניהול תיק ההשקעות מבוסס הנדל"ן.'],
      legacyPaths: ['/ניהול-נכסים-ניהול-נכסים/דירה-להשקעה-ניהול-תיק-השקעות-אישי/'],
      needsReview: true,
    },
    {
      slug: 'asset-improvement',
      division: 'management',
      // Legacy title was "ניהול נכסים בתל אביב והשבחה". The city belongs on an
      // area page, not stapled to the service name.
      title: 'ניהול והשבחת נכסים',
      summary: 'שדרוג נכס קיים כדי להעלות את התשואה ואת שוויו.',
      body: ['הדף מרכז את עבודות ההשבחה שקבוצת קיסר מבצעת בנכסים שבניהולה.'],
      legacyPaths: ['/ניהול-נכסים-ניהול-נכסים/ניהול-נכסים-בתל-אביב-השבחת-נכסים/'],
      needsReview: true,
    },
    {
      slug: 'new-projects',
      division: 'management',
      title: 'ניהול ושיווק פרויקטים חדשים',
      summary: 'שיווק פרויקטים חדשים למגורים, מהקבלן אל הרוכש.',
      body: ['הדף מרכז את שיווק הפרויקטים החדשים למגורים שקבוצת קיסר מלווה.'],
      legacyPaths: ['/ניהול-ושיווק-פרויקטים-חדשים/'],
      needsReview: true,
    },
    {
      slug: 'commercial-management',
      division: 'management',
      title: 'ניהול ואחזקת נכסים מסחריים',
      summary: 'ניהול ואחזקה של מבנים מסחריים, מרכזים וקניונים.',
      body: ['הדף מרכז את ניהול הנכסים המסחריים של הקבוצה – מרכזים מסחריים, קניונים ומבני משרדים.'],
      legacyPaths: ['/ניהול-נכסים-ניהול-נכסים/ניהול-מרכזים-מסחריים/'],
      needsReview: true,
    },
    {
      slug: 'relocation',
      division: 'management',
      title: 'רילוקיישן לישראל',
      summary: 'ליווי בעלי נכסים ושוכרים שעוברים לישראל או חיים מחוצה לה.',
      body: ['הדף מרכז את הליווי שקבוצת קיסר מציעה למי שעובר לישראל או מנהל נכס מחו"ל.'],
      legacyPaths: ['/ניהול-נכסים-ניהול-נכסים/רילוקשיין-לארץ-ישראל-relocation/'],
      needsReview: true,
    },
    {
      slug: 'property-management-faq',
      division: 'management',
      title: 'ניהול נכסים – שאלות ותשובות',
      summary: 'התשובות לשאלות שחוזרות אצל בעלי נכסים.',
      body: ['ריכוז השאלות הנפוצות על ניהול נכסים ודירות. התוכן ממתין לייצוא מהאתר הקיים.'],
      legacyPaths: ['/ניהול-נכסים-ניהול-נכסים/ניהול-נכסים-שאלות-ותשובות/'],
      needsReview: true,
    },

    // -------------------------------------------------------------- construction
    {
      slug: 'construction',
      division: 'construction' satisfies Division,
      title: 'בנייה, ניהול ויזמות',
      // Trimmed from the client's own sentence, below.
      summary: 'ניהול פרויקטים, פיקוח בנייה ויזמות בנייה, כולל פינוי בינוי ותמ"א 38.',
      body: [
        'מחלקת בנייה-ניהול-יזמות מתמחה בניהול פרויקטים, פיקוח בניה, יזמות בניה, השבחה, עיצוב, שיפוץ ושדרוג מבנים, וכולל פינוי בינוי ותמ"א 38.',
      ],
      image: 'division-construction',
      legacyPaths: ['/נדלן-בניה-ניהול-יזמות/'],
      needsReview: false,
    },
    {
      slug: 'urban-renewal',
      division: 'construction',
      title: 'ניהול פינוי בינוי',
      summary: 'ליווי דיירים ובעלי זכויות בפרויקט פינוי בינוי.',
      body: ['הדף מרכז את ניהול פרויקטי הפינוי בינוי של הקבוצה מול הדיירים והיזם.'],
      legacyPaths: ['/נדלן-בניה-ניהול-יזמות/פינוי-בינוי-תמא-38/'],
      needsReview: true,
    },
    {
      slug: 'purchase-groups',
      division: 'construction',
      title: 'ניהול קבוצות רכישה ובעלי זכויות',
      summary: 'ניהול קבוצת בעלי הזכויות בפרויקט, משלב ההתארגנות ועד המסירה.',
      body: ['הדף מרכז את ניהול קבוצות הרכישה ובעלי הזכויות שקבוצת קיסר מלווה.'],
      legacyPaths: ['/נדלן-בניה-ניהול-יזמות/ניהול-קבוצת-רכישה/'],
      needsReview: true,
    },
    {
      slug: 'tama-38',
      division: 'construction',
      title: 'ניהול תמ"א 38',
      summary: 'ניהול פרויקט תמ"א 38 עבור בעלי הדירות בבניין.',
      body: ['הדף מרכז את ניהול פרויקטי תמ"א 38 של הקבוצה מטעם בעלי הדירות.'],
      legacyPaths: ['/נדלן-בניה-ניהול-יזמות/ניהול-תמא-38/'],
      needsReview: true,
    },
    {
      slug: 'renovation',
      division: 'construction',
      title: 'שיפוצים ושדרוג מבנים',
      summary: 'שיפוץ, עיצוב אדריכלי ושדרוג של דירות ומבנים.',
      body: ['הדף מרכז את עבודות השיפוץ והשדרוג שהקבוצה מבצעת.'],
      legacyPaths: ['/נדלן-בניה-ניהול-יזמות/שיפוצים-כלליים/'],
      needsReview: true,
    },

    // --------------------------------------------------------------- investment
    {
      slug: 'investment',
      division: 'investment' satisfies Division,
      title: 'יזמות עסקים והשקעות',
      summary: 'ניהול, קידום וליווי של עסקים ויזמים.',
      // The homepage cut this division's description off behind "קרא עוד…", so
      // unlike the other two hubs there is no client copy to migrate here.
      body: ['המחלקה השלישית של הקבוצה עוסקת ביזמות עסקית, ליווי יזמים והשקעות.'],
      image: 'division-investment',
      legacyPaths: ['/יזמות-עסקים-פטנטים-והשקעות/'],
      needsReview: true,
    },
    {
      slug: 'investment-who-its-for',
      division: 'investment',
      title: 'קיסר בעסקים – למי זה מתאים?',
      summary: 'מי מתאים לליווי העסקי של הקבוצה.',
      body: ['הדף מתאר למי מיועד הליווי העסקי של קיסר בעסקים.'],
      legacyPaths: ['/יזמות-עסקים-פטנטים-והשקעות/קיסר-בעסקים-למי-מתאים/'],
      needsReview: true,
    },
    {
      slug: 'investors-club',
      division: 'investment',
      title: 'מועדון משקיעים',
      summary: 'מועדון המשקיעים של הקבוצה.',
      body: ['הדף מציג את מועדון המשקיעים ואת דרך ההצטרפות אליו.'],
      legacyPaths: ['/יזמות-עסקים-פטנטים-והשקעות/מועדון-משקיעים/'],
      needsReview: true,
    },
    {
      slug: 'caesar-fund',
      division: 'investment',
      title: 'קרן קיסר',
      summary: 'קרן ההשקעות של הקבוצה.',
      body: ['הדף מציג את קרן קיסר. התוכן ממתין לייצוא מהאתר הקיים.'],
      legacyPaths: ['/יזמות-עסקים-פטנטים-והשקעות/קרן-קיסר/'],
      needsReview: true,
    },
    {
      slug: 'investment-portfolio',
      division: 'investment',
      title: 'ההשקעות שלנו',
      summary: 'ההשקעות שהקבוצה מלווה.',
      body: ['הדף מציג את תיק ההשקעות של קיסר בעסקים.'],
      legacyPaths: ['/יזמות-עסקים-פטנטים-והשקעות/קיסר-בעסקים-ההשקעות-שלנו/'],
      needsReview: true,
    },
    {
      slug: 'investment-faq',
      division: 'investment',
      title: 'קיסר בעסקים – שאלות ותשובות',
      summary: 'התשובות לשאלות שחוזרות אצל יזמים ומשקיעים.',
      body: ['ריכוז השאלות הנפוצות על הליווי העסקי. התוכן ממתין לייצוא מהאתר הקיים.'],
      legacyPaths: ['/יזמות-עסקים-פטנטים-והשקעות/קיסר-בעסקים-שאלות-ותשובות/'],
      needsReview: true,
    },
  ],
  'service',
);

/** Human-readable division names, for headings and breadcrumbs. */
export const divisionNames: Readonly<Record<Division, string>> = {
  management: 'ניהול נכסים',
  construction: 'בנייה, ניהול ויזמות',
  investment: 'יזמות עסקים והשקעות',
};

/** The hub page of each division — the one whose slug names the division. */
export const divisionHubs: Readonly<Record<Division, string>> = {
  management: 'property-management',
  construction: 'construction',
  investment: 'investment',
};

/** Every service page lives at `/services/<slug>`. */
export function servicePath(slug: string): string {
  return `/services/${slug}`;
}

export function getService(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}

export function servicesByDivision(division: Division): Service[] {
  return services.filter((service) => service.division === division);
}
