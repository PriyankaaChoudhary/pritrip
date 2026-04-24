import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import TripEditor from './editor';

export const revalidate = 0;

export default async function TripEditPage({ params }) {
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
      slug: '',
      region_id: regions[0]?.id || null,
      location_text: '',
      card_size: 'third',
      body: '',
      best_time: '',
      cost_estimate: '',
      difficulty: '',
      meta_title: '',
      meta_description: '',
      status: 'draft',
      is_featured: false,
      featured_image_url: '',
      featured_image_alt: '',
      content_source: 'researched',       // NEW
      last_verified_at: new Date().toISOString(), // NEW
      contributor_notes: '',              // NEW
      seasons: [],
      tag_ids: [],
      updated_at: null,
    };
    return <TripEditor initial={defaults} regions={regions} allTags={tags} mode="create" photos={[]} />;
  }

  const { data: trip } = await supabase
    .from('trips')
    .select(`
      *,
      trip_seasons(season),
      trip_tags(tag_id)
    `)
    .eq('id', id)
    .maybeSingle();

  if (!trip) return notFound();

  // Load trip photos separately (cleaner than nested joins here)
  const { data: photos } = await supabase
    .from('trip_photos')
    .select('*, uploads(public_id, type, width, height)')
    .eq('trip_id', id)
    .order('display_order');

  const initial = {
    id:                 trip.id,
    title:              trip.title || '',
    subtitle:           trip.subtitle || '',
    slug:               trip.slug || '',
    region_id:          trip.region_id,
    location_text:      trip.location_text || '',
    card_size:          trip.card_size || 'third',
    body:               trip.body_markdown || '',
    best_time:          trip.best_time || '',
    cost_estimate:      trip.cost_estimate || '',
    difficulty:         trip.difficulty || '',
    meta_title:         trip.meta_title || '',
    meta_description:   trip.meta_description || '',
    status:             trip.status || 'draft',
    is_featured:        !!trip.is_featured,
    featured_image_url: trip.featured_image_url || '',
    featured_image_alt: trip.featured_image_alt || '',
    content_source:     trip.content_source || 'researched',    // NEW
    last_verified_at:   trip.last_verified_at || null,          // NEW
    contributor_notes:  trip.contributor_notes || '',  
    seasons:            (trip.trip_seasons || []).map(s => s.season),
    tag_ids:            (trip.trip_tags || []).map(t => t.tag_id),
    updated_at:         trip.updated_at,
  };

  return <TripEditor initial={initial} regions={regions} allTags={tags} mode="edit" photos={photos || []} />;
}