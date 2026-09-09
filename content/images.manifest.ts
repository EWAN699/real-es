/**
 * The photography brief, as data.
 *
 * Every image on the site is generated from an entry here by
 * `npm run images:generate`. One entry, one slot. Nothing is generated that is
 * not listed, and nothing is listed that the site does not use.
 *
 * ── House style ────────────────────────────────────────────────────────────
 * `HOUSE_STYLE` is appended to every prompt, unedited. It is the reason the set
 * reads as one commissioned shoot rather than a bag of unrelated renders: one
 * camera, one lens, one hour of the day, one grade. It is tuned warm — limestone,
 * sand, plaster, olive — so the brand green sits inside the palette rather than
 * fighting it.
 *
 * ── No lettering, anywhere ─────────────────────────────────────────────────
 * `GLOBAL_NEGATIVE` suppresses every form of type. Kling renders Hebrew as
 * plausible-looking garbage, and a Hebrew site carrying nonsense Hebrew signage
 * is worse than a site with no signage at all. No shop signs, no street signs,
 * no house numbers, no plates, no captions.
 *
 * ── What may and may not be generated ──────────────────────────────────────
 * These slots are atmospheric, architectural and editorial: the hero, the three
 * division headers, the service images that replace the legacy icon PNGs,
 * textures, dividers and neutral city scenes.
 *
 * NOT here, deliberately:
 *   · Any specific marketed property. A synthetic photograph of a real listing
 *     is misleading and carries consumer-protection exposure in Israel. Listing
 *     galleries stay empty until real photography exists — `listing.gallery`
 *     never points at a slug from this file.
 *   · Team portraits. A synthetic face attached to a named, real colleague is a
 *     lie about a person, not a stylistic choice. `teamMember.portrait` is left
 *     unfilled.
 *   · Anything meant to read as documentary evidence — a finished project of
 *     theirs, an award, a specific site.
 *
 * ── Naming ─────────────────────────────────────────────────────────────────
 * Service slots are `service-<service slug>`, matching `src/content/services.ts`,
 * so wiring a service page to its image needs no lookup table. Division slots
 * are `division-<division>`, matching `src/components/layout/nav.ts`.
 *
 * ── alt text ───────────────────────────────────────────────────────────────
 * Hand-written Hebrew, describing what is in the frame for someone who cannot
 * see it. Not a keyword line, not the page title, never model-generated.
 * Decorative slots (textures, dividers) carry `decorative: true` and an empty
 * alt, which is the correct accessible treatment — a screen reader should skip
 * a texture, not narrate it.
 */

import type { MediaAspect } from '../src/content/media';

export type ImageSlot = {
  /** Kebab-case. This is the slug the UI passes to `getMedia`. */
  slug: string;
  /** The subject. The house style is appended by `composePrompt`. */
  prompt: string;
  /** Slot-specific exclusions, added to `GLOBAL_NEGATIVE`. */
  negativePrompt?: string;
  aspect: MediaAspect;
  /**
   * Candidates to generate. Only `selectedCandidate` is published; the rest are
   * kept in `scripts/images/.cache/` so a human can pick a different frame
   * without paying for the batch twice.
   */
  count: number;
  selectedCandidate?: number;
  /**
   * Kling's image endpoint documents no seed parameter, so this is never sent.
   * It is folded into the prompt hash: bumping it is how you force one slot to
   * be re-rolled without editing its prompt.
   */
  seed?: number;
  /** Pins this slot's look to another slot's output, via image reference. */
  referenceSlug?: string;
  /** Hebrew, hand-authored. Empty only when `decorative` is true. */
  alt: string;
  /** True for textures and dividers: presentational, hidden from assistive tech. */
  decorative?: boolean;
  /** object-position, when the subject is off-centre. */
  focal?: [number, number];
  /** Why this slot exists, for whoever inherits the file. */
  note?: string;
};

/**
 * Appended to every prompt. One camera, one hour, one grade.
 *
 * Kept under ~700 characters so even the longest subject line stays inside
 * Kling's 2500-character prompt limit.
 */
export const HOUSE_STYLE = [
  'Photographed on a full-frame camera with a 35mm prime at f/4, ISO 100.',
  'Late afternoon eastern-Mediterranean light about an hour before sunset:',
  'low warm sun, long soft shadows, clear sky with a little coastal haze.',
  'Palette of sunlit limestone, warm sand, off-white plaster, brushed aluminium',
  'and muted olive and eucalyptus greens.',
  'Warm neutral grade, restrained saturation, gentle filmic contrast,',
  'deep but open shadows, no colour cast in the whites.',
  'Architectural framing at standing eye level, true verticals, generous negative space.',
  'Fine natural grain, real optics, no digital sharpening halos.',
  'Calm, understated, unstaged editorial real-estate photography.',
].join(' ');

/**
 * Added to every slot's negative prompt.
 *
 * The first half is the lettering ban — non-negotiable, see the file header.
 * The second half is the usual generative-model failure set: bent verticals,
 * melted geometry, HDR sludge, illustration creeping into a photographic set.
 */
export const GLOBAL_NEGATIVE = [
  // No type of any kind.
  'text, lettering, letters, words, numerals, typography, captions, subtitles,',
  'watermark, signature, logo, brand mark, signage, shop signs, street signs,',
  'billboards, banners, posters, price labels, notices, house numbers,',
  'license plates, calligraphy, hebrew script, arabic script, latin script,',
  'chinese characters, gibberish writing, ui overlay, screen text,',
  // Structural and photographic failures.
  'distorted architecture, warped perspective, bent verticals, melting geometry,',
  'impossible structure, duplicated windows, extra limbs, deformed hands,',
  'extra fingers, waxy skin, celebrity likeness, oversaturated hdr, neon colours,',
  'purple sky, heavy vignette, fisheye, tilt-shift miniature effect, motion blur,',
  'out of focus, lowres, jpeg artifacts, cartoon, anime, illustration, painting,',
  '3d render, cgi, video game, stock photo watermark,',
  // Wrong place, wrong season.
  'snow, autumn foliage, gothic architecture, north european architecture,',
  'american suburbia, tropical rainforest',
].join(' ');

/** No people at all — used by every slot whose subject is a place, not a person. */
const NO_PEOPLE = 'people, crowds, faces, portraits, pedestrians in the foreground';

/** For the two slots that do show people: present, but never the subject. */
const DISCREET_PEOPLE =
  'close-up face, eye contact with the camera, corporate stock smile, posed group shot, ' +
  'suits and ties, handshake cliche';

export const imageManifest: ImageSlot[] = [
  /* ── Hero and atmosphere ──────────────────────────────────────────────── */
  {
    slug: 'hero-tel-aviv-skyline',
    prompt:
      'Wide view over central Tel Aviv from a high residential balcony: pale modernist ' +
      'apartment blocks in the foreground, slim glass towers layered back into the coastal ' +
      'haze, ficus canopies along the boulevards below, the Mediterranean a thin bright band ' +
      'on the horizon.',
    negativePrompt: NO_PEOPLE,
    aspect: '4:3',
    count: 2,
    seed: 1,
    alt: 'מבט ממרפסת גבוהה במרכז תל אביב על מבני המגורים, המגדלים והים באור אחר הצהריים',
    focal: [50, 40],
    note: 'Home hero. The reference image for the rest of the set — generate it first.',
  },
  {
    slug: 'hero-coastal-towers',
    prompt:
      'A calm Israeli coastal promenade at low tide seen along its length: pale stone paving, ' +
      'tamarisk and washingtonia palms, a line of low white residential terraces set back from ' +
      'the beach, the open sea to one side.',
    negativePrompt: NO_PEOPLE,
    aspect: '21:9',
    count: 1,
    referenceSlug: 'hero-tel-aviv-skyline',
    alt: 'טיילת חוף שקטה עם דקלים ובנייני מגורים לבנים ברקע',
    note: 'Wide banner for interior page headers.',
  },
  {
    slug: 'about-lobby-consultation',
    prompt:
      'Two people in quiet everyday clothes talking across a light oak table in the bright ' +
      'lobby of a residential building, stone floor, large plants, glass doors to the street ' +
      'behind them; seen from across the room, both turned away from the camera.',
    negativePrompt: DISCREET_PEOPLE,
    aspect: '16:9',
    count: 2,
    referenceSlug: 'hero-tel-aviv-skyline',
    alt: 'שני אנשים משוחחים סביב שולחן בלובי מואר של בניין מגורים',
    note: 'About / contact editorial. People are present but not identifiable.',
  },
  {
    slug: 'cta-evening-balcony',
    prompt:
      'A quiet apartment balcony just after sunset: warm interior light spilling through an ' +
      'open sliding door, planters along the railing, a simple table and one chair, the city ' +
      'soft and out of focus below.',
    negativePrompt: NO_PEOPLE,
    aspect: '16:9',
    count: 1,
    alt: 'מרפסת דירה בשעת דמדומים, עם אור חם מבפנים ועציצים על המעקה',
    note: 'Background for the closing call-to-action band.',
  },

  /* ── Division headers ─────────────────────────────────────────────────── */
  {
    slug: 'division-management',
    prompt:
      'The entrance courtyard of a well-kept Israeli residential building: clean plastered and ' +
      'stone façade, glass entrance doors, mailbox alcove in shadow, clipped planting, a swept ' +
      'path and a caretaker trolley parked neatly to one side.',
    negativePrompt: NO_PEOPLE,
    aspect: '16:9',
    count: 2,
    referenceSlug: 'hero-tel-aviv-skyline',
    alt: 'חצר כניסה מטופחת של בניין מגורים, עם דלתות זכוכית וצמחייה גזומה',
  },
  {
    slug: 'division-construction',
    prompt:
      'A residential building mid-project behind clean scaffolding and white safety netting, ' +
      'new stone cladding half installed on the lower floors, a tower crane arm crossing the ' +
      'sky above, an empty tidy site below.',
    negativePrompt: NO_PEOPLE,
    aspect: '16:9',
    count: 2,
    referenceSlug: 'hero-tel-aviv-skyline',
    alt: 'בניין מגורים בשלבי בנייה מאחורי פיגומים, עם זרוע עגורן מעליו',
  },
  {
    slug: 'division-investment',
    prompt:
      'A daylight meeting room high above a city: a long table holding an unmarked white ' +
      'architectural massing model of a residential block and a blank rolled drawing, ' +
      'floor-to-ceiling glass along one wall, no screens and no paperwork.',
    negativePrompt: `${NO_PEOPLE}, charts, graphs, spreadsheets, monitors`,
    aspect: '16:9',
    count: 2,
    referenceSlug: 'hero-tel-aviv-skyline',
    alt: 'חדר ישיבות מואר מעל העיר, עם דגם אדריכלי לבן של מבנה מגורים על השולחן',
  },

  /* ── Service images (replacing the legacy icon PNGs) ──────────────────── */
  {
    slug: 'service-rental-management',
    prompt:
      'A newly turned-over rental apartment ready for its next tenant: empty warm-toned rooms, ' +
      'clean tiled floor, open shutters throwing slats of light, a single set of keys left on ' +
      'the kitchen counter.',
    negativePrompt: NO_PEOPLE,
    aspect: '4:3',
    count: 1,
    referenceSlug: 'hero-tel-aviv-skyline',
    alt: 'דירה ריקה ומוכנה לכניסת שוכר, עם צרור מפתחות על משטח המטבח',
  },
  {
    slug: 'service-sales-marketing',
    prompt:
      'A bright empty living room prepared for sale: neutral linen sofa, one low table, a rug, ' +
      'the balcony door open to a green street, everything else cleared away.',
    negativePrompt: NO_PEOPLE,
    aspect: '4:3',
    count: 1,
    referenceSlug: 'hero-tel-aviv-skyline',
    alt: 'סלון מואר ומרוהט בפשטות בדירה שהוכנה למכירה',
  },
  {
    slug: 'service-valuation',
    prompt:
      'A desk beside a window in an empty apartment: a steel tape measure, a blank unfolded ' +
      'floor plan with no writing on it, a set of keys, morning light raking across pale wood.',
    negativePrompt: `${NO_PEOPLE}, dimensions, annotations, printed drawings`,
    aspect: '4:3',
    count: 1,
    referenceSlug: 'hero-tel-aviv-skyline',
    alt: 'שולחן ליד חלון עם סרט מדידה, תוכנית דירה ומפתחות',
  },
  {
    slug: 'service-investor-portfolio',
    prompt:
      'A quiet residential street seen from across the road: a row of small four-storey ' +
      'buildings with repeating balconies, parked cars, street trees, low evening sun along ' +
      'the façades.',
    negativePrompt: NO_PEOPLE,
    aspect: '4:3',
    count: 1,
    referenceSlug: 'hero-tel-aviv-skyline',
    alt: 'רחוב מגורים שקט עם שורת בניינים בני ארבע קומות באור ערב',
  },
  {
    slug: 'service-asset-improvement',
    prompt:
      'One apartment façade freshly renovated between two weathered ones on the same block: ' +
      'new plaster, new railings and new shutters against tired concrete and rust stains on ' +
      'either side, the contrast plain.',
    negativePrompt: NO_PEOPLE,
    aspect: '4:3',
    count: 1,
    referenceSlug: 'hero-tel-aviv-skyline',
    alt: 'חזית דירה משופצת בין שתי חזיתות ישנות באותו בניין',
  },
  {
    slug: 'service-new-projects',
    prompt:
      'A newly completed residential project on handover day: pale cladding catching low sun, ' +
      'a glazed lobby, young landscaping still bedding in, clean paving, nobody moved in yet.',
    negativePrompt: NO_PEOPLE,
    aspect: '4:3',
    count: 1,
    referenceSlug: 'hero-tel-aviv-skyline',
    alt: 'פרויקט מגורים חדש שהושלם, לפני אכלוס',
  },
  {
    slug: 'service-commercial-management',
    prompt:
      'The concourse of a modest shopping centre before opening: polished floor, a planted ' +
      'atrium, daylight falling from a glazed roof, shopfront shutters down, nobody inside.',
    negativePrompt: `${NO_PEOPLE}, shop displays, product packaging, brand storefronts`,
    aspect: '4:3',
    count: 1,
    referenceSlug: 'hero-tel-aviv-skyline',
    alt: 'מסדרון מרכז מסחרי לפני שעת הפתיחה, עם אור יום מהתקרה',
  },
  {
    slug: 'service-relocation',
    prompt:
      'Moving day in a bright empty apartment: a few closed cardboard boxes stacked by the ' +
      'wall, a rolled rug, windows open to a green street, sun across a bare floor.',
    negativePrompt: `${NO_PEOPLE}, box labels, shipping tape print`,
    aspect: '4:3',
    count: 1,
    referenceSlug: 'hero-tel-aviv-skyline',
    alt: 'דירה ריקה ביום מעבר, עם ארגזים סגורים וחלונות פתוחים',
  },
  {
    slug: 'service-urban-renewal',
    prompt:
      'An ageing four-storey walk-up standing directly beside its rebuilt replacement: ' +
      'weathered 1960s concrete and small windows on one side, a taller stone-clad block with ' +
      'wide balconies on the other, one continuous street.',
    negativePrompt: NO_PEOPLE,
    aspect: '4:3',
    count: 1,
    referenceSlug: 'hero-tel-aviv-skyline',
    alt: 'בניין ותיק בן ארבע קומות לצד בניין חדש וגבוה יותר באותו רחוב',
  },
  {
    slug: 'service-renovation',
    prompt:
      'An apartment mid-refit: fresh plaster and taped joints, a spirit level leaning on the ' +
      'wall, a neat stack of floor tiles, dust sheets folded, hard daylight from an unshuttered ' +
      'window.',
    negativePrompt: NO_PEOPLE,
    aspect: '4:3',
    count: 1,
    referenceSlug: 'hero-tel-aviv-skyline',
    alt: 'דירה בשלבי שיפוץ, עם טיח חדש, פלס וערימת אריחים',
  },
  {
    slug: 'service-tama-38',
    prompt:
      'An older apartment block being strengthened and extended: a new reinforced concrete ' +
      'frame and new balconies grafted onto the existing structure, scaffolding on one flank, ' +
      'the original building still legible underneath.',
    negativePrompt: NO_PEOPLE,
    aspect: '4:3',
    count: 1,
    referenceSlug: 'hero-tel-aviv-skyline',
    alt: 'בניין ותיק שמתחזקים ומרחיבים, עם מרפסות חדשות ופיגומים בצדו',
  },
  {
    slug: 'service-purchase-groups',
    prompt:
      'An empty urban plot hoarded off and ready to build: level compacted ground, a plain ' +
      'timber hoarding, surrounding residential blocks rising on three sides, late light across ' +
      'the site.',
    negativePrompt: `${NO_PEOPLE}, hoarding graphics, site notices`,
    aspect: '4:3',
    count: 1,
    referenceSlug: 'hero-tel-aviv-skyline',
    alt: 'מגרש ריק ומגודר בעיר, מוכן לבנייה, מוקף בבנייני מגורים',
  },

  /* ── Textures and dividers (decorative) ───────────────────────────────── */
  {
    slug: 'texture-concrete',
    prompt:
      'Flat-on close texture of smooth board-formed concrete: faint timber grain, tie-hole ' +
      'shadows, a soft raking light across the surface, filling the frame.',
    negativePrompt: `${NO_PEOPLE}, cracks, graffiti, stains, objects`,
    aspect: '21:9',
    count: 1,
    alt: '',
    decorative: true,
    note: 'Section divider. Decorative — alt is empty on purpose.',
  },
  {
    slug: 'texture-stone-facade',
    prompt:
      'Flat-on close texture of dressed limestone cladding in warm cream and sand tones: fine ' +
      'chisel marks, tight joints, low side light picking out the relief, filling the frame.',
    negativePrompt: `${NO_PEOPLE}, cracks, graffiti, stains, objects`,
    aspect: '21:9',
    count: 1,
    alt: '',
    decorative: true,
    note: 'Section divider. Decorative — alt is empty on purpose.',
  },
  {
    slug: 'divider-palms-dusk',
    prompt:
      'A narrow band of washingtonia palm crowns seen from below against a warm graduated sky ' +
      'a few minutes after sunset, silhouettes soft, nothing else in frame.',
    negativePrompt: `${NO_PEOPLE}, buildings, wires, birds`,
    aspect: '21:9',
    count: 1,
    alt: '',
    decorative: true,
    note: 'Full-bleed band between sections. Decorative — alt is empty on purpose.',
  },

  /* ── Neutral city scenes (blog, area and fallback slots) ──────────────── */
  {
    slug: 'city-tel-aviv-boulevard',
    prompt:
      'A shaded Tel Aviv boulevard: a broad ficus canopy over a central pedestrian strip, ' +
      'plastered Bauhaus balconies stepping away on both sides, dappled light on the path.',
    negativePrompt: NO_PEOPLE,
    aspect: '16:9',
    count: 1,
    referenceSlug: 'hero-tel-aviv-skyline',
    alt: 'שדרה מוצלת בתל אביב עם עצי פיקוס ומרפסות בסגנון באוהאוס',
  },
  {
    slug: 'city-jerusalem-stone',
    prompt:
      'A Jerusalem residential street stepping down a slope: limestone buildings with arched ' +
      'windows and iron balconies, cypress and olive trees, clear late-afternoon light.',
    negativePrompt: NO_PEOPLE,
    aspect: '16:9',
    count: 1,
    referenceSlug: 'hero-tel-aviv-skyline',
    alt: 'רחוב מגורים מדרוני בירושלים, עם בנייני אבן ועצי ברוש',
  },
  {
    slug: 'city-haifa-bay',
    prompt:
      'The slope of Haifa above its bay: terraced housing among pines stepping down the ' +
      'hillside, the port and the sea flattening into haze below, warm side light.',
    negativePrompt: NO_PEOPLE,
    aspect: '16:9',
    count: 1,
    referenceSlug: 'hero-tel-aviv-skyline',
    alt: 'מדרון הכרמל בחיפה עם בתים מדורגים בין עצי אורן ומפרץ הים למטה',
  },
  {
    slug: 'city-herzliya-marina',
    prompt:
      'A marina basin at the end of the day: moored sailing yachts, still water, low white ' +
      'apartment terraces stepping back behind the quay, long shadows on the boardwalk.',
    negativePrompt: `${NO_PEOPLE}, boat names, flags`,
    aspect: '16:9',
    count: 1,
    referenceSlug: 'hero-tel-aviv-skyline',
    alt: 'מרינה עם סירות עוגנות ובנייני מגורים לבנים ומדורגים ברקע',
  },
  {
    slug: 'city-ramat-gan-towers',
    prompt:
      'A cluster of tall office and residential towers rising behind low older housing, seen ' +
      'across a green park, warm side light and a clean sky.',
    negativePrompt: NO_PEOPLE,
    aspect: '16:9',
    count: 1,
    referenceSlug: 'hero-tel-aviv-skyline',
    alt: 'מגדלים גבוהים מתנשאים מעל שכונת מגורים ותיקה, במבט מהפארק',
  },
  {
    slug: 'blog-editorial-desk',
    prompt:
      'A quiet workspace beside a window: a closed laptop, a plain ceramic cup, a small potted ' +
      'plant and a blank closed notebook on pale wood, morning light and a soft shadow.',
    negativePrompt: `${NO_PEOPLE}, screen content, book covers, printed pages`,
    aspect: '16:9',
    count: 1,
    alt: 'פינת עבודה מוארת ליד חלון, עם מחשב נייד סגור, מחברת וכוס',
    note: 'Default header image for blog posts with no image of their own.',
  },
  {
    slug: 'fallback-city-generic',
    prompt:
      'A neutral, unremarkable view across a Mediterranean city of pale apartment blocks and ' +
      'water towers, gently hazy, nothing singular enough to identify a particular building.',
    negativePrompt: `${NO_PEOPLE}, landmarks, recognisable monuments`,
    aspect: '4:3',
    count: 1,
    referenceSlug: 'hero-tel-aviv-skyline',
    alt: 'מבט כללי על קו הרקיע של גוש דן — תמונת אווירה, לא תצלום של נכס מסוים',
    note:
      'Fallback where a record has no photograph. Deliberately generic, and its alt text says ' +
      'so: it must never be mistaken for a picture of a property being marketed.',
  },
];

/** The full prompt sent to Kling: subject first, house style last. */
export function composePrompt(slot: ImageSlot): string {
  return `${slot.prompt.trim()} ${HOUSE_STYLE}`;
}

/** The full negative prompt: the global ban plus anything the slot adds. */
export function composeNegativePrompt(slot: ImageSlot): string {
  const extra = slot.negativePrompt?.trim();
  return extra ? `${GLOBAL_NEGATIVE} ${extra}` : GLOBAL_NEGATIVE;
}
