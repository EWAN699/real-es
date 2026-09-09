/**
 * The data layer's public surface, for `caesar-ui`.
 *
 * `msw-handlers` is deliberately absent: it pulls in `msw`, a devDependency,
 * and must never be reachable from the shipped bundle. Import it directly from
 * `@/lib/msw-handlers` in test setup.
 */
export * from './listings';
export * from './redirects';
export * from './structured-data';
