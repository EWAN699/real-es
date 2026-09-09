import { parseAll, testimonialSchema, type Testimonial } from './types';

/**
 * Real customer testimonials, migrated from the "מה הלקוחות אומרים עלינו"
 * carousel on the client's homepage. Nothing here is written by us.
 *
 * Two things to know about `needsReview` in this file:
 *
 *  1. The homepage prints most of these truncated, ending in an ellipsis
 *     mid-sentence (and sometimes mid-word). The full letters live on each
 *     testimonial's own page, which we could not read. Where the visible text
 *     was cut off, the trailing fragment is dropped rather than published as if
 *     it were the end of the sentence, and the record is `needsReview: true` —
 *     meaning "restore the full quote from the client's export".
 *  2. Where the homepage showed a complete short quote, it is reproduced in
 *     full and marked `needsReview: false`.
 *
 * Customers' own spelling and punctuation are left exactly as published. Fixing
 * a stranger's typo in a signed letter is not ours to do.
 *
 * `author` keeps the label the client published, including the anonymised ones
 * ("לקוח שאינו מוכן לחשוף את שמו") and the "(מתוך הסקר)" attributions.
 */
export const testimonials: Testimonial[] = parseAll(
  testimonialSchema,
  [
    {
      slug: 'aliza-and-dan-shiran',
      author: 'עליזה ודן שירן',
      city: 'תל אביב',
      quote:
        'לכל מאן דבעי. לפני כשנה בחיפושנו אחר תיווך למציאת שוכר לדירתנו בהרצליה, נתקלנו בכתובת של קיסר ניהול נכסים, והחלטנו לפנות אליה לטפל בנושא. כשהגיע אלינו, מיד הבנו, שמדובר לא רק במתווך ראוי, אלא גם באדם מקסים, שמיד נקשרנו אליו מתוך הערכה רבה. הוא הצליח תוך תקופה קצרה ביותר למצוא לנו שוכרת, למרות שדרשנו מחיר גבוה מן המקובל לאזור.',
      // Truncated on the homepage mid-word ("קבל על עצ…"). Restore in full.
      needsReview: true,
    },
    {
      slug: 'nati-weiner',
      author: 'נתי ויינר',
      city: 'תל אביב',
      quote:
        'אבי קיסר היקר, היום, אחרי מכירת הדירה, אני רוצה להודות לך על שנים ארוכות של שירות מסור בניהול הנכס שלי ועל כך שחסכת לי הרבה כאב ראש, זמן וכסף. באמת שאין לי מושג מה ההייתי עושה בלעדיך. תודה על הכל!',
      // Homepage shows a trailing ellipsis: there may be more letter after this.
      needsReview: true,
    },
    {
      slug: 'haker-meir',
      author: 'הקר מאיר',
      city: 'חיפה',
      quote: 'לקיסר היקר, תודה על הטיפול וההשקעה בכל נושא השכרת הדירה. בדרך עוד דירה לטיפולך.',
      needsReview: false,
    },
    {
      slug: 'baruch-friedman',
      author: 'ברוך פרידמן',
      city: 'תל אביב',
      quote:
        'לקיסר היקרים: לפני כ־5 שנים קניתי נכס להשקעה בתל אביב בדרום העיר בשכונה בעייתית מבחינת האוכלוסייה ופוטנציאל השכירות המיידית. אך ידעתי כי אני משקיע לטווח הארוך ולכן דרוש אורך רוח. בהיותי עובד בתעשיית ההייטק יש לי מעט מאוד זמן פנוי לטפל בענייני הדירה, אחזקה, מציאת שוכרים, גביית חובות ודמי שכירות ועוד אלף משימות כאלה ואחרות הקשורות לאחזקה וניהול.',
      // Truncated on the homepage. Restore in full.
      needsReview: true,
    },
    {
      slug: 'eyal-israeli',
      author: 'אייל ישראלי',
      city: 'חיפה',
      quote:
        'בכל מקרה תודה רבה אבי, חבל על הזמן. אם יש משהוא שיודע להוציא מים מסלע… אני כבר הייתי ממש מיואש מזה, ואתה נתת לי תקווה וכוחות. כל הכבוד אבי כל הכבוד…',
      // Transcribed by the client from a WhatsApp voice note; the page links to
      // the recording. Confirm the transcript and whether the audio may be used.
      needsReview: true,
    },
    {
      slug: 'moshe-keren',
      author: 'משה קרן',
      city: 'חיפה',
      quote:
        "קניתי דירה להשקעה בשנת 1998, קשה למכור דירה כזו במחיר טוב מטעמים שונים: זה עסקי, קשה לקבל משכנתא, אישורים וכו'. במשך חודשים ניסו 6 מתווכים שונים ואני באופן עצמאי, להגיע לקונה טוב, לצערי לא הצלחנו, הגיעו בודדים. לאחר שפניתי לקיסר, להפתעתי, לאחר 4 חודשים העסקה בוצעה בהצלחה לשביעות רצוני. נכון שעבדתם קשה והבאתם כ־120 קונים, אין לי מושג איך?",
      // Truncated on the homepage. Restore in full.
      needsReview: true,
    },
    {
      slug: 'external-survey',
      author: 'בסקר חיצוני שנערך',
      quote:
        'בסקר חיצוני שנערך ע"פ חשבוניות ברצף זכתה קיסר בציון 9.6 בשקלול סופי, דבר המעיד על רמת שירות גבוהה. הארה: לאור העובדה כי חברתנו מתמחה בשירותי ניהול לטווח ארוך ולא לתיקון חד פעמי ציון זה נחשב לגבוה במיוחד. ניתן לעיין בתוצאות הסקר המלא במשרדנו.',
      // This is the client's own note about the survey, not a customer letter,
      // and it is the source of the 9.6 figure that the legacy "69" counter
      // contradicts. Truncated on the homepage; confirm the wording and who
      // conducted the survey before this is presented as third-party evidence.
      needsReview: true,
    },
    {
      slug: 'haim-hacham',
      author: 'חיים חכם',
      city: 'פתח תקווה',
      quote:
        'חברה מצוינת, הם מנהלים עבורי מספר דירות שברשותי לצורך השכרה והם עושים עבודה טובה מאוד, אני נותן להם ציון עשר בכל הפרמטרים. מומלץ.',
      needsReview: false,
    },
    {
      slug: 'nissim-elkalai',
      author: 'ניסים אלקלעי (מתוך הסקר)',
      city: 'תל אביב',
      quote:
        'אני מרוצה מהם הם מנהלים לי את התהליך מול השוכרים בדירה שאני משכיר ואני סומך עליהם בעניים עצומות. אני ממליץ עליהם.',
      needsReview: false,
    },
    {
      slug: 'yael-gonen',
      author: 'יעל גונן (מתוך הסקר)',
      city: 'תל אביב',
      quote:
        'חברה עם שירות יעיל, מקצועי ואמין. עשו עבודה מצוינת והיו בקשר רציף איתי לאורך כל הדרך. אני כבר המלצתי עליהם לחברים.',
      needsReview: false,
    },
    {
      slug: 'anonymous-survey-1',
      author: 'לקוח שאינו מוכן לחשוף את שמו (מתוך הסקר)',
      quote:
        'הם סייעו לי מעל ומעבר. תמיד היו זמינים ואחראים מאד. השכרתי את הדירה בקלות ואני מאוד מרוצה מהם.',
      needsReview: false,
    },
    {
      slug: 'anonymous-survey-2',
      author: 'לקוח שאינו מוכן לחשוף את שמו (מתוך הסקר)',
      quote: 'השירות מקסים, הם אדיבים ומקצועיים. אחלה שירות',
      needsReview: false,
    },
    {
      slug: 'eli-rosner',
      author: 'אלי רוזנר',
      city: 'חיפה',
      quote:
        'לכל מי שמתעניין, קיסר מטפל בניהול דירה להשכרה שלי במשך יותר משלוש שנים. הטיפול שלו ושל אנשי צוותו מקצועי ויעיל מאוד. אני ממליץ בחום להשתמש בשירותים של קיסר לניהול נכסים.',
      needsReview: false,
    },
    {
      slug: 'lea-iremesco',
      author: 'לאה אירמסקו',
      city: 'חדרה',
      quote:
        'אני עובדת עם קיסר שש שנים. הוא מנהל לי את הנכסים בצורה המקצועית והטובה ביותר. הוא תמיד מתעניין ושומר על קשר רציף כל הזמן. בורכתי ביום שנפגשנו. ממליצה בחום לכל המעוניין.',
      needsReview: false,
    },
    {
      slug: 'yehuda-and-ofra-brandes',
      author: 'יהודה ועופרה ברנדס',
      city: 'ירושלים',
      quote:
        'השירות של קיסר הוגן, אדיב ויעיל. מאז שהחלו לטפל בנכסים שלנו – הוסרו מאיתנו כל הדאגות.',
      needsReview: false,
    },
    {
      slug: 'dr-moshe-schein',
      author: 'ד"ר משה שיין',
      // Published under "ארה״ב" — a country, not a city, but it is the label the
      // client used and it is the point of the testimonial: an overseas owner.
      city: 'ארה"ב',
      quote:
        'לפני שנים מספר החלטנו לתת לחברת קיסר לנהל עבורנו את השכרת דירתנו בחיפה. מאז פסקו בלבולי המוח והצרות. החברה דואגת להכל: חיפוש שוכרים, חוזה, תיקונים בדירה – הכל. פשוט שקט תעשייתי מוחלט. התקשורת מיידית עם החברה, יחס חברותי ומנומס. אני סומך על אבי קיסר! אני מתגורר בצפון ארה"ב.',
      // Truncated on the homepage. Restore in full.
      needsReview: true,
    },
    {
      slug: 'ruti-abarbanel',
      author: 'רותי אברבנאל',
      city: 'ראשון לציון',
      quote:
        'אני לקוחה של שירותי קיסר ניהול נכסים כבר למעלה מ־6 שנים. השירות רציני, מקצועי ואישי – תמיד יש עם מי לדבר, כל שאלה או בעיה נענית במיידי. אני יכולה לומר שאני בהחלט נהנית משקט נפשי לגבי הנכס שמנוהל על ידם.',
      // Truncated on the homepage. Restore in full.
      needsReview: true,
    },
    {
      slug: 'hali-grinberg',
      author: 'חלי גרינברג',
      quote:
        'קיסר היקר, אני מבקשת בזאת להודות לך על השירות הנפלא שאתה מעניק לנו בניהול הנכס המשפחתי שלנו. מזה מס\' שנים שהינך דואג במסירות, במקצועיות וביעילות לדירה שלנו ברמת גן. התחושה ש"אפשר לישון בשקט בלילה" הינה התחושה שאופפת אותנו כאשר אנחנו חושבים על ניהול הנכס שלנו. הידיעה שתמיד ישנו מישהו ש"נמצא שם", שדואג לפתרון הבעיות.',
      // Truncated on the homepage mid-word ("ועונה לצרכי הדי…"). Restore in full.
      needsReview: true,
    },
  ],
  'testimonial',
);

/**
 * Legacy WordPress permalink for each testimonial, feeding the redirect map.
 *
 * These are the decoded forms of the percent-encoded Hebrew URLs in the scrape.
 * The legacy links also carry an `?imtst_cpt=…` query string from the
 * testimonials plugin; redirect resolution ignores the query.
 */
export const testimonialLegacyPaths: Readonly<Record<string, string>> = {
  'aliza-and-dan-shiran': '/testimonials/עליזה-ודן-שירן/',
  'nati-weiner': '/testimonials/נתי-ויינר/',
  'haker-meir': '/testimonials/הקר-מאיר/',
  'baruch-friedman': '/testimonials/ברוך-פרידמן/',
  'eyal-israeli': '/testimonials/אייל-ישראלי-מחיפה/',
  'moshe-keren': '/testimonials/משה-קרן-מחיפה/',
  'external-survey': '/testimonials/בסקר-חיצוני-שנערך/',
  'haim-hacham': '/testimonials/חיים-חכם/',
  'nissim-elkalai': '/testimonials/ניסים-אלקלעי-מתוך-הסקר/',
  'yael-gonen': '/testimonials/יעל-גונן-מתוך-הסקר/',
  'anonymous-survey-1': '/testimonials/לקוח-שאינו-מוכן-לחשוף-את-שמו-מתוך-הסקר/',
  'anonymous-survey-2': '/testimonials/לקוח-שאינו-מוכן-לחשוף-את-שמו-מתוך-הסקר-2/',
  'eli-rosner': '/testimonials/אלי-רוזנר/',
  'lea-iremesco': '/testimonials/לאה-אירמסקו/',
  'yehuda-and-ofra-brandes': '/testimonials/יהודה-ועופרה-ברנדס/',
  'dr-moshe-schein': '/testimonials/דר-משה-שיין/',
  'ruti-abarbanel': '/testimonials/רותי-אברבנאל/',
  'hali-grinberg': '/testimonials/חלי-גרינברג/',
};

/** Complete quotes only — safe to feature without a client sign-off first. */
export const readyTestimonials: Testimonial[] = testimonials.filter((t) => !t.needsReview);
