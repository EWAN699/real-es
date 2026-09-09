import type { RouteRecord } from 'vite-react-ssg';

/**
 * Route table. Owned by the `caesar-ui` agent from Phase 1 onward.
 *
 * Phase 0 ships a single placeholder route so the prerender pipeline is proven
 * end to end before three agents start pushing to the same branch.
 */
export const routes: RouteRecord[] = [
  {
    path: '/',
    lazy: () => import('./pages/Home'),
    entry: 'src/pages/Home.tsx',
  },
];
