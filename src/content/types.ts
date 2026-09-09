import { z } from 'zod';

/**
 * CONTRACT — frozen in Phase 0. Owned by `caesar-data`, consumed by `caesar-ui`.
 *
 * Changing a schema here breaks another agent's work in progress. If a change is
 * genuinely needed, stop and raise it rather than editing unilaterally.
 *
 * Every record carries `needsReview`. Copy migrated from the client's own site is
 * `false`; anything drafted here for pages we could not read is `true`, so the
 * client can see at a glance what still needs their sign-off. Nothing invented is
 * ever presented as if it came from them.
 */

const hebrewText = z.string().trim().min(1);

/** Media is referenced by slug only. Resolve through `getMedia` in media.ts. */
export const mediaSlug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'kebab-case slug');

export const dealType = z.enum(['sale', 'rent', 'investment', 'commercial', 'new-project']);
export type DealType = z.infer<typeof dealType>;

export const assetType = z.enum([
  'apartment',
  'penthouse',
  'house',
  'office',
  'retail',
  'commercial-building',
  'land',
  'hotel',
  'logistics',
]);
export type AssetType = z.infer<typeof assetType>;

export const listingStatus = z.enum(['available', 'under-offer', 'sold', 'rented']);

/** The three divisions the group is organised around. */
export const division = z.enum(['management', 'construction', 'investment']);
export type Division = z.infer<typeof division>;

export const serviceSchema = z.object({
  slug: z.string(),
  division,
  title: hebrewText,
  /** One sentence for cards and meta description. Plain language, no keyword stuffing. */
  summary: hebrewText,
  body: z.array(hebrewText),
  image: mediaSlug.optional(),
  /** Old WordPress URLs this page replaces, for the redirect map. */
  legacyPaths: z.array(z.string()).default([]),
  needsReview: z.boolean(),
});
export type Service = z.infer<typeof serviceSchema>;

export const listingSchema = z.object({
  slug: z.string(),
  title: hebrewText,
  summary: hebrewText,
  city: hebrewText,
  neighborhood: hebrewText.optional(),
  dealType,
  assetType,
  rooms: z.number().positive().optional(),
  sizeSqm: z.number().positive().optional(),
  /** Omit entirely when the price is on application — never render a fake number. */
  price: z.object({ amount: z.number().positive(), currency: z.enum(['ILS', 'USD']) }).optional(),
  status: listingStatus,
  /**
   * Real photography only. AI-generated imagery must never stand in for a
   * specific marketed property — see the media registry's `aiGenerated` flag.
   */
  gallery: z.array(mediaSlug).default([]),
  geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
  publishedAt: z.string().date(),
  featured: z.boolean().default(false),
  legacyPaths: z.array(z.string()).default([]),
  needsReview: z.boolean(),
});
export type Listing = z.infer<typeof listingSchema>;

export const testimonialSchema = z.object({
  slug: z.string(),
  /** As published by the client. Anonymised entries keep their existing label. */
  author: hebrewText,
  city: hebrewText.optional(),
  quote: hebrewText,
  needsReview: z.boolean(),
});
export type Testimonial = z.infer<typeof testimonialSchema>;

export const postSchema = z.object({
  slug: z.string(),
  kind: z.enum(['blog', 'news']),
  title: hebrewText,
  excerpt: hebrewText,
  publishedAt: z.string().date(),
  image: mediaSlug.optional(),
  legacyPaths: z.array(z.string()).default([]),
  needsReview: z.boolean(),
});
export type Post = z.infer<typeof postSchema>;

/**
 * Track-record figures.
 *
 * The legacy site's counters contradicted its own body copy (7 years' experience
 * against "over ten"; a counter reading 69 where the text described a 9.6 score).
 * `confirmed` gates rendering: unconfirmed figures are withheld, not guessed at.
 */
export const statSchema = z.object({
  id: z.string(),
  value: z.number(),
  suffix: z.string().optional(),
  label: hebrewText,
  confirmed: z.boolean(),
});
export type Stat = z.infer<typeof statSchema>;

export const teamMemberSchema = z.object({
  slug: z.string(),
  name: hebrewText,
  role: hebrewText,
  phone: z.string().optional(),
  email: z.string().email().optional(),
  portrait: mediaSlug.optional(),
  needsReview: z.boolean(),
});
export type TeamMember = z.infer<typeof teamMemberSchema>;

/** Single source of truth for contact details, used by the footer, JSON-LD and forms. */
export const contactSchema = z.object({
  nationalPhone: z.string(),
  directPhone: z.string(),
  email: z.string().email(),
  whatsapp: z.string(),
  addressLocality: hebrewText,
});
export type Contact = z.infer<typeof contactSchema>;

/**
 * Parse-or-throw helper. Content is authored, not user input: a schema violation
 * is a build-time bug and should fail the build loudly rather than degrade.
 */
export function parseAll<Schema extends z.ZodTypeAny>(
  schema: Schema,
  records: readonly unknown[],
  label: string,
): z.infer<Schema>[] {
  return records.map((record, index) => {
    const result = schema.safeParse(record);
    if (!result.success) {
      throw new Error(`Invalid ${label} at index ${index}: ${result.error.message}`);
    }
    return result.data;
  });
}
