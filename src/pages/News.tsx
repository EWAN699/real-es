import { PostArchive } from '@/components/posts/PostArchive';

/** The news archive. Everything visible comes from `posts.ts` via `PostArchive`. */
export function Component() {
  return <PostArchive kind="news" />;
}

Component.displayName = 'News';
