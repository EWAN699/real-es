import type { RouteRecord } from 'vite-react-ssg';

import { RootLayout } from './components/layout/RootLayout';

/**
 * Route table. Owned by the `caesar-ui` agent.
 *
 * Every page is a child of the layout route, so the header, the single `<main>`
 * landmark, the footer and the WhatsApp affordance are declared exactly once.
 *
 * Only the routes with a real page behind them are registered. The five nav
 * destinations land on the catch-all until their pages are built — a 404 that
 * offers the way onward, rather than a blank screen from a route that resolves
 * to nothing. `caesar-data`'s legacy redirect map should point at these paths:
 * `/management`, `/construction`, `/investment`, `/listings`, `/about`,
 * `/blog`, `/news`, `/contact`, `/accessibility`, `/privacy`.
 */
export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <RootLayout />,
    entry: 'src/components/layout/RootLayout.tsx',
    children: [
      {
        index: true,
        lazy: () => import('./pages/Home'),
        entry: 'src/pages/Home.tsx',
      },
      {
        path: '*',
        lazy: () => import('./pages/NotFound'),
        entry: 'src/pages/NotFound.tsx',
      },
    ],
  },
];
