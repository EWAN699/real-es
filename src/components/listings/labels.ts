import type { AssetType, Listing } from '@/content/types';

/**
 * Hebrew labels for the listing enums that the content layer does not label.
 *
 * `dealTypeLabels` lives in `src/content/listings.ts` because the deal taxonomy
 * came off the client's own site; these two are interface vocabulary for schema
 * enums, so they live with the interface. They describe a category, never a
 * claim about a property: nothing here can be wrong about someone's asset.
 */
export const assetTypeLabels: Readonly<Record<AssetType, string>> = {
  apartment: 'דירה',
  penthouse: 'פנטהאוז',
  house: 'בית פרטי',
  office: 'משרד',
  retail: 'שטח מסחרי',
  'commercial-building': 'בניין מסחרי',
  land: 'קרקע',
  hotel: 'מלונאות',
  logistics: 'לוגיסטיקה',
};

export const listingStatusLabels: Readonly<Record<Listing['status'], string>> = {
  available: 'זמין',
  'under-offer': 'במשא ומתן',
  sold: 'נמכר',
  rented: 'הושכר',
};

/**
 * What a listing with no published price says.
 *
 * None of the four properties the client markets publishes a price, so this is
 * the normal case rather than an edge one. It is a sentence, not a dash and not
 * a zero: "0 ₪" on a real property is a false statement about someone's asset,
 * and a dash reads as missing data.
 */
export const PRICE_ON_APPLICATION = 'מחיר לפי פנייה';

/** `123 מ״ר`, formatted for the locale so the digits group correctly. */
export function formatArea(sizeSqm: number): string {
  return `${new Intl.NumberFormat('he-IL').format(sizeSqm)} מ״ר`;
}
