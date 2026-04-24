import { createPublicClient } from '@/lib/supabase/server';
import HomePage from './_components/homepage';

export const revalidate = 60;

export async function generateMetadata() {
  const supabase = createPublicClient();
  const { data: metaRow } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'meta')
    .maybeSingle();
  const meta = metaRow?.value || {};
  return {
    title: meta.site_title || 'PriTrip',
    description: meta.site_description || '',
    openGraph: {
      title: meta.site_title,
      description: meta.site_description,
      images: meta.og_image_url ? [meta.og_image_url] : [],
    },
  };
}

export default async function Page() {
  const supabase = createPublicClient();

  const [
    { data: settingsRows },
    { data: continents },
    { data: regions },
    { data: trips },
    { data: venues },
  ] = await Promise.all([
    supabase.from('site_settings').select('key, value'),
    supabase.from('continents').select('*').order('display_order'),
    supabase.from('regions').select('*').eq('is_live', true).order('display_order'),
    supabase
      .from('trips')
      .select(`
        id, slug, title, subtitle, location_text,
        featured_image_url, featured_image_alt, is_featured,
        regions(name, flag_emoji, slug),
        trip_seasons(season),
        trip_tags(tags(slug, label, emoji))
      `)
      .eq('status', 'published')
      .order('is_featured', { ascending: false }),
    supabase
      .from('venues')
      .select('id, name, emoji, location_text, description, activity_categories, region_id')
      .eq('status', 'published')
      .order('display_order'),
  ]);

  // Blogs table might not exist yet — safe fallback
  let blogs = [];
  try {
    const { data } = await supabase
      .from('blog_posts')
      .select('id, slug, title, excerpt, kicker, cover_image_url, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    blogs = data || [];
  } catch {
    blogs = [];
  }

  const settings = (settingsRows || []).reduce((acc, r) => {
    acc[r.key] = r.value;
    return acc;
  }, {});

  return (
    <HomePage
      settings={settings}
      continents={continents || []}
      regions={regions || []}
      trips={trips || []}
      venues={venues || []}
      blogs={blogs}
    />
  );
}