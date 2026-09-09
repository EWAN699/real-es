import { contactSchema, type Contact } from './types';

/**
 * Contact details — the single source of truth for the footer, the lead form
 * and the Organization JSON-LD.
 *
 * Provenance: every value below except `addressLocality` is
 * printed on the client's own homepage, above the enquiry form:
 *
 *   "לייעוץ אישי ללא התחייבות: 1599-556655 | 052-5416313 | info@caesar.co.il"
 *
 * `whatsapp` is the direct mobile in E.164. Confirmed by the client as the
 * number that answers WhatsApp, so the button is cleared to ship.
 *
 * REVIEW — `addressLocality`. The homepage publishes no street address, only
 * "בפריסה ארצית". Rather than invent an office, this records the country and
 * `buildOrganization` emits `areaServed` instead of a PostalAddress. Replace
 * with the registered office locality when the client supplies it.
 */
export const contact: Contact = contactSchema.parse({
  nationalPhone: '1599-55-66-55',
  directPhone: '052-5416313',
  email: 'info@caesar.co.il',
  whatsapp: '+972525416313',
  addressLocality: 'ישראל',
});

/** Digits only, `tel:`-safe, in E.164 where the number has an international form. */
export function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return `tel:${digits}`;
  // 1-599 service numbers have no international form; leave them national.
  if (digits.startsWith('1')) return `tel:${digits}`;
  return `tel:+972${digits.replace(/^0/, '')}`;
}

/** `https://wa.me/<digits>` — wa.me rejects a leading `+`. */
export function whatsappHref(message?: string): string {
  const to = contact.whatsapp.replace(/[^\d]/g, '');
  return message
    ? `https://wa.me/${to}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${to}`;
}

/**
 * The group's commercial arm markets under its own brand and domain. Linked,
 * not absorbed: it is a separate site with its own listings.
 */
export const commercialArm = {
  name: 'קיסר מסחריים',
  url: 'https://www.caesarmenivim.co.il/',
} as const;

/** The CEO, named on the homepage ("דבר המנכ״ל", and the Channel 10 interview). */
export const ceoName = 'אבי קיסר';
