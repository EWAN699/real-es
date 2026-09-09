import { PostDetail } from '@/components/posts/PostDetail';

/** A blog post at `/blog/<slug>`. Every legacy blog URL redirects here. */
export function Component() {
  return <PostDetail kind="blog" />;
}

Component.displayName = 'BlogPost';
