import { createClient } from '@/lib/supabase/server';
import BlogsList from './blogs-list';

export const revalidate = 0;

export default async function BlogsPage() {
  const supabase = await createClient();

  const { data: blogs } = await supabase
    .from('blog_posts')
    .select(`
      id, slug, title, subtitle, kicker, status, updated_at, created_at,
      is_featured, reading_minutes, cover_image_url,
      regions(name, flag_emoji),
      blog_post_tags(tags(slug, label, emoji))
    `)
    .order('updated_at', { ascending: false });

  return <BlogsList initialBlogs={blogs || []} />;
}