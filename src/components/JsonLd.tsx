import { Head } from 'vite-react-ssg';

import { serializeJsonLd, type JsonLd as JsonLdNode } from '@/lib/structured-data';

/**
 * A JSON-LD block in the document head.
 *
 * Inline, and built at prerender time, so it costs nothing on first paint and
 * is present in the HTML a crawler receives without executing anything. The
 * serialiser escapes `<`, so a Hebrew quote containing markup cannot close the
 * script tag early.
 *
 * Every node here is a machine-readable claim about a business or about someone
 * else's property: pass only what `src/lib/structured-data.ts` builds from real
 * content records. It withholds prices, ratings and addresses that the client
 * has not published, and this component must not add them back.
 */
export function JsonLd({ data }: { data: JsonLdNode | JsonLdNode[] }) {
  return (
    <Head>
      <script type="application/ld+json">{serializeJsonLd(data)}</script>
    </Head>
  );
}
