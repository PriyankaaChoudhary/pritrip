import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import BlogEditor from './editor';

export const revalidate = 0;

export default async function BlogEditPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const [regionsRes, tagsRes] = await Promise.all([
    supabase.from('regions').select('id, name, flag_emoji, slug').order('display_order'),
    supabase.from('tags').select('id, slug, label, emoji, category').order('display_order'),
  ]);

  const regions = regionsRes.data || [];
  const tags = tagsRes.data || [];

  if (id === 'new') {
    const defaults = {
      id: null,
      title: '',
      subtitle: '',
      kicker: 'Roundup',
      slug: '',
      excerpt: '',
      body: '',
      cover_image_url: '',
      cover_image_alt: '',
      author_name: 'PriTrip',
      region_id: null,
      meta_title: '',
      meta_description: '',
      status: 'draft',
      is_featured: false,
      tag_ids: [],
    };
    return <BlogEditor initial={defaults} regions={regions} allTags={tags} mode="create" />;
  }

  const { data: blog } = await supabase
    .from('blog_posts')
    .select(`*, blog_post_tags(tag_id)`)
    .eq('id', id)
    .maybeSingle();

  if (!blog) return notFound();

  const initial = {
    id:               blog.id,
    title:            blog.title || '',
    subtitle:         blog.subtitle || '',
    kicker:           blog.kicker || '',
    slug:             blog.slug || '',
    excerpt:          blog.excerpt || '',
    body:             blog.body_html || '',
    cover_image_url:  blog.cover_image_url || '',
    cover_image_alt:  blog.cover_image_alt || '',
    author_name:      blog.author_name || 'PriTrip',
    region_id:        blog.region_id,
    meta_title:       blog.meta_title || '',
    meta_description: blog.meta_description || '',
    status:           blog.status || 'draft',
    is_featured:      !!blog.is_featured,
    tag_ids:          (blog.blog_post_tags || []).map(t => t.tag_id),
  };

  return <BlogEditor initial={initial} regions={regions} allTags={tags} mode="edit" />;
}