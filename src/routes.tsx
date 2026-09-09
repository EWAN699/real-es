import type { RouteRecord } from 'vite-react-ssg';

import { RootLayout } from './components/layout/RootLayout';

/**
 * Route table. Owned by the `caesar-ui` agent.
 *
 * Every page is a child of the layout route, so the header, the single `<main>`
 * landmark, the footer and the WhatsApp affordance are declared exactly once.
 *
 * PATHS ARE A CONTRACT. `src/lib/redirects.ts` maps a decade of WordPress URLs
 * onto the paths registered here, and `redirects.test.ts` fails if the map ever
 * points at something this table does not serve. Renaming a path here without
 * renaming it there is how a redirect becomes a 404 on cutover day.
 *
 * DYNAMIC ROUTES ARE PRERENDERED, NOT CLIENT-RESOLVED. Each one declares
 * `getStaticPaths`, so every service, listing, testimonial and post is written
 * out as its own HTML file at build time — the whole point of this build is that
 * a crawler receives content, not an empty div. The content modules are pulled
 * in with a dynamic `import()` because `getStaticPaths` runs only in Node during
 * the build: a static import would drag all 101 post records and every listing
 * into the browser's entry chunk, on every page, to answer a question the
 * browser never asks.
 *
 * The catch-all stays last. Unknown URLs — and the legacy ones the redirect map
 * does not know — land on a 404 that offers the way onward.
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

      // The three divisions the group is organised around.
      {
        path: '/management',
        lazy: () => import('./pages/Management'),
        entry: 'src/pages/Management.tsx',
      },
      {
        path: '/construction',
        lazy: () => import('./pages/Construction'),
        entry: 'src/pages/Construction.tsx',
      },
      {
        path: '/investment',
        lazy: () => import('./pages/Investment'),
        entry: 'src/pages/Investment.tsx',
      },

      // The service pages beneath the divisions: 21 of them, and the target of
      // most of the legacy site's four-level menu.
      {
        path: '/services/:slug',
        lazy: () => import('./pages/ServiceDetail'),
        entry: 'src/pages/ServiceDetail.tsx',
        getStaticPaths: async () => {
          const { services, servicePath } = await import('./content/services');
          return services.map((service) => servicePath(service.slug));
        },
      },

      {
        path: '/listings',
        lazy: () => import('./pages/Listings'),
        entry: 'src/pages/Listings.tsx',
      },
      {
        path: '/listings/:slug',
        lazy: () => import('./pages/ListingDetail'),
        entry: 'src/pages/ListingDetail.tsx',
        getStaticPaths: async () => {
          const { listings, listingPath } = await import('./content/listings');
          return listings.map((listing) => listingPath(listing.slug));
        },
      },

      {
        path: '/about',
        lazy: () => import('./pages/About'),
        entry: 'src/pages/About.tsx',
      },
      {
        path: '/testimonials',
        lazy: () => import('./pages/Testimonials'),
        entry: 'src/pages/Testimonials.tsx',
      },
      {
        path: '/testimonials/:slug',
        lazy: () => import('./pages/TestimonialDetail'),
        entry: 'src/pages/TestimonialDetail.tsx',
        getStaticPaths: async () => {
          const { testimonials } = await import('./content/testimonials');
          return testimonials.map((testimonial) => `/testimonials/${testimonial.slug}`);
        },
      },

      {
        path: '/blog',
        lazy: () => import('./pages/Blog'),
        entry: 'src/pages/Blog.tsx',
      },
      {
        path: '/blog/:slug',
        lazy: () => import('./pages/BlogPost'),
        entry: 'src/pages/BlogPost.tsx',
        getStaticPaths: async () => {
          const { blogPosts, postPath } = await import('./content/posts');
          return blogPosts.map((post) => postPath(post));
        },
      },
      {
        path: '/news',
        lazy: () => import('./pages/News'),
        entry: 'src/pages/News.tsx',
      },
      {
        path: '/news/:slug',
        lazy: () => import('./pages/NewsPost'),
        entry: 'src/pages/NewsPost.tsx',
        getStaticPaths: async () => {
          const { newsPosts, postPath } = await import('./content/posts');
          return newsPosts.map((post) => postPath(post));
        },
      },

      {
        path: '/contact',
        lazy: () => import('./pages/Contact'),
        entry: 'src/pages/Contact.tsx',
      },

      // Both legally required of an Israeli commercial site, and both linked
      // from the footer of every page.
      {
        path: '/accessibility',
        lazy: () => import('./pages/Accessibility'),
        entry: 'src/pages/Accessibility.tsx',
      },
      {
        path: '/privacy',
        lazy: () => import('./pages/Privacy'),
        entry: 'src/pages/Privacy.tsx',
      },

      {
        path: '*',
        lazy: () => import('./pages/NotFound'),
        entry: 'src/pages/NotFound.tsx',
      },
    ],
  },
];
