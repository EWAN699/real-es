import { PostArchive } from '@/components/posts/PostArchive';

/** The blog archive. Everything visible comes from `posts.ts` via `PostArchive`. */
export function Component() {
  return <PostArchive kind="blog" />;
}

Component.displayName = 'Blog';
