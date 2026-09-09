import type { Division } from '@/content/types';

/**
 * The whole navigation, in one place.
 *
 * The legacy site carried roughly thirty-five items across four levels of
 * dropdown — unusable on a phone, and an information architecture that hid the
 * three things the business actually does. This is five destinations plus two
 * editorial ones, and no submenus.
 *
 * Paths are owned by this agent (they are what `src/routes.tsx` registers).
 * `caesar-data`'s legacy redirect map has to point at these.
 */
export type NavItem = {
  label: string;
  to: string;
  /** One line, used by the mobile menu and the homepage division cards. */
  description?: string | undefined;
};

export type DivisionNavItem = NavItem & { division: Division; imageSlug: string };

export const divisionNav: DivisionNavItem[] = [
  {
    division: 'management',
    label: 'ניהול נכסים',
    to: '/management',
    description: 'ניהול שוטף של דירות, משרדים ומבנים מניבים — גבייה, אחזקה ודיווח לבעלים.',
    imageSlug: 'division-management',
  },
  {
    division: 'construction',
    label: 'בנייה ויזמות',
    to: '/construction',
    description: 'ליווי פרויקטים מהקרקע ועד המסירה, כולל התחדשות עירונית ותמ״א 38.',
    imageSlug: 'division-construction',
  },
  {
    division: 'investment',
    label: 'עסקים והשקעות',
    to: '/investment',
    description: 'איתור עסקאות, בדיקת כדאיות וליווי משקיעים בנדל״ן מניב בישראל.',
    imageSlug: 'division-investment',
  },
];

export const primaryNav: NavItem[] = [
  ...divisionNav.map(({ label, to, description }) => ({ label, to, description })),
  { label: 'נכסים', to: '/listings', description: 'נכסים למכירה, להשכרה ולהשקעה.' },
  { label: 'הקבוצה', to: '/about', description: 'מי אנחנו, דבר המנכ״ל ולקוחות ממליצים.' },
];

export const editorialNav: NavItem[] = [
  { label: 'בלוג', to: '/blog' },
  { label: 'חדשות', to: '/news' },
];

export const legalNav: NavItem[] = [
  { label: 'הצהרת נגישות', to: '/accessibility' },
  { label: 'מדיניות פרטיות', to: '/privacy' },
];
