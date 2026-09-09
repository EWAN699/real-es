import { describe, expect, it } from 'vitest';

import { LEGACY_PATHS } from './legacy-inventory';
import {
  encodePath,
  isKnownRoute,
  normalizePath,
  redirectRules,
  redirects,
  resolveRedirect,
  SITE_ROUTES,
} from './redirects';

describe('legacy URL coverage', () => {
  // The contract this whole module exists for. A failure here is a page that
  // drops out of the index on cutover day.
  it.each(LEGACY_PATHS)('%s resolves', (legacyPath) => {
    expect(resolveRedirect(legacyPath)).not.toBeNull();
  });

  it('resolves every legacy path in its decoded form too', () => {
    const unresolved = LEGACY_PATHS.map((path) => decodeURIComponent(path)).filter(
      (path) => resolveRedirect(path) === null,
    );
    expect(unresolved).toEqual([]);
  });

  it('resolves legacy paths whether or not they carry a trailing slash', () => {
    const unresolved = LEGACY_PATHS.map((path) => path.replace(/\/$/, '')).filter(
      (path) => resolveRedirect(path) === null,
    );
    expect(unresolved).toEqual([]);
  });

  it('ignores the query strings the legacy testimonial links carried', () => {
    expect(
      resolveRedirect('/testimonials/%d7%94%d7%a7%d7%a8-%d7%9e%d7%90%d7%99%d7%a8/?imtst_cpt=x'),
    ).toBe('/testimonials/haker-meir');
  });

  it('resolves an absolute legacy URL, not just a path', () => {
    expect(resolveRedirect('https://www.caesar.co.il/%d7%a6%d7%95%d7%a8-%d7%a7%d7%a9%d7%a8/')).toBe(
      '/contact',
    );
  });

  it('covers every legacy path exactly once', () => {
    const keys = LEGACY_PATHS.map(normalizePath);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('redirect targets', () => {
  it('only ever points at a route the site declares', () => {
    const strays = [...redirects.values()].filter((target) => !isKnownRoute(target));
    expect(strays).toEqual([]);
  });

  it('never redirects to another redirect', () => {
    const loops = [...redirects.values()].filter((target) => resolveRedirect(target) !== null);
    expect(loops).toEqual([]);
  });

  it('never targets the homepage as a catch-all', () => {
    // Sending an unmatched old URL to `/` is a soft 404: it strands the visitor
    // and search engines treat it as one.
    expect([...redirects.values()]).not.toContain('/');
  });

  it('sends the buy taxonomy archive to the sale filter', () => {
    expect(resolveRedirect('/property_buyorrent/buy/')).toBe('/listings?deal=sale');
    expect(resolveRedirect('/property_buyorrent/new-projects')).toBe('/listings?deal=new-project');
  });
});

describe('unmapped input', () => {
  it('returns null rather than guessing', () => {
    expect(resolveRedirect('/nothing-like-this')).toBeNull();
  });

  it('does not resurrect the WordPress authentication endpoints', () => {
    expect(resolveRedirect('/wp-login.php?action=lostpassword')).toBeNull();
    expect(resolveRedirect('/wp-register.php')).toBeNull();
  });

  it('survives a malformed percent escape', () => {
    expect(() => resolveRedirect('/%zz')).not.toThrow();
    expect(resolveRedirect('/%zz')).toBeNull();
  });

  it('leaves live routes alone', () => {
    for (const route of SITE_ROUTES) expect(resolveRedirect(route)).toBeNull();
  });
});

describe('normalizePath', () => {
  it.each([
    ['/צור-קשר/', '/צור-קשר'],
    ['צור-קשר', '/צור-קשר'],
    ['//a//b//', '/a/b'],
    ['/', '/'],
    ['/a?b=c#d', '/a'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizePath(input)).toBe(expected);
  });
});

describe('host rules', () => {
  it('emits one permanent, percent-encoded rule per mapping', () => {
    const rules = redirectRules();
    expect(rules).toHaveLength(redirects.size);
    for (const rule of rules) {
      expect(rule.permanent).toBe(true);
      expect(rule.source).not.toMatch(/[֐-׿]/);
      expect(rule.source.startsWith('/')).toBe(true);
    }
  });

  it('round-trips an encoded source back to its key', () => {
    for (const key of redirects.keys()) {
      expect(normalizePath(encodePath(key))).toBe(key);
    }
  });
});
