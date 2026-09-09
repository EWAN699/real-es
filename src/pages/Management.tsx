import { DivisionPage } from '@/components/divisions/DivisionPage';

/**
 * The management division landing page.
 *
 * A route module rather than a copy of the page: everything visible comes from
 * `DivisionPage`, which reads the division's services out of the content layer.
 * Each division gets its own module so its chunk, its `entry` hint and its
 * prerendered HTML are its own.
 */
export function Component() {
  return <DivisionPage division="management" />;
}

Component.displayName = 'Management';
