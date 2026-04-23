import { createPublicClient } from '@/lib/supabase/server';

export default async function sitemap() {
  const supabase = createPublicClient();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const [regionsRes, tripsRes] = await Promise.all([
    supabase.from('regions').select('slug, updated_at').eq('is_live', true),
    supabase
      .from('trips')
      .select('slug, updated_at, regions!inner(slug, is_live)')
      .eq('status', 'published')
      .eq('regions.is_live', true),
  ]);

  const regions = regionsRes.data || [];
  const trips = tripsRes.data || [];

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...regions.map(r => ({
      url: `${baseUrl}/${r.slug}`,
      lastModified: r.updated_at ? new Date(r.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    })),
    ...trips
      .filter(t => t.regions?.slug)
      .map(t => ({
        url: `${baseUrl}/${t.regions.slug}/${t.slug}`,
        lastModified: t.updated_at ? new Date(t.updated_at) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.9,
      })),
  ];
}