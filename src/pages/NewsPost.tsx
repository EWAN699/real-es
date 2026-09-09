import { PostDetail } from '@/components/posts/PostDetail';

/** A news item at `/news/<slug>`. Every legacy news URL redirects here. */
export function Component() {
  return <PostDetail kind="news" />;
}

Component.displayName = 'NewsPost';
