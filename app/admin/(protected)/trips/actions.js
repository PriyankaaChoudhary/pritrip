'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { slugify } from '@/lib/slugify';

/* ============ Auth helper ============ */
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, error: 'Not authenticated' };
  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!adminRow) return { supabase, error: 'Not an admin' };
  return { supabase, role: adminRow.role };
}

/* ============ Slug availability check ============ */
export async function checkSlugAvailable({ slug, regionId, excludeId }) {
  const { supabase, error } = await requireAdmin();
  if (error) return { ok: false, error };
  if (!slug || !regionId) return { ok: true, available: true };

  let q = supabase
    .from('trips')
    .select('id', { count: 'exact', head: true })
    .eq('region_id', regionId)
    .eq('slug', slug);

  if (excludeId) q = q.neq('id', excludeId);

  const { count, error: qError } = await q;
  if (qError) return { ok: false, error: qError.message };
  return { ok: true, available: count === 0 };
}

/* ============ Save (create or update) ============ */
export async function saveTripAction(payload) {
  const { supabase, error } = await requireAdmin();
  if (error) return { ok: false, error };

  const isCreate = !payload.id;

  // Validate required fields
  if (!payload.title?.trim()) return { ok: false, error: 'Title is required' };
  if (!payload.region_id)     return { ok: false, error: 'Region is required' };

  // Generate slug if blank
  let slug = (payload.slug || '').trim();
  if (!slug) slug = slugify(payload.title);
  if (!slug) return { ok: false, error: 'Slug could not be generated from title' };

  // Verify slug uniqueness within region
  const availRes = await checkSlugAvailable({
    slug,
    regionId: payload.region_id,
    excludeId: payload.id,
  });
  if (!availRes.ok) return { ok: false, error: availRes.error };
  if (!availRes.available) {
    return { ok: false, error: `Slug "${slug}" is already used in this region. Try another.` };
  }

  // Whitelist fields we actually write (defense against injected keys)
  const row = {
    title:              payload.title.trim(),
    subtitle:           payload.subtitle?.trim() || null,
    slug,
    region_id:          payload.region_id,
    location_text:      payload.location_text?.trim() || null,
    latitude:           payload.latitude ?? null,
    longitude:          payload.longitude ?? null,
    card_size:          payload.card_size || 'third',
    body_markdown:      payload.body || null, // stores HTML despite the column name (legacy)
    best_time:          payload.best_time?.trim() || null,
    cost_estimate:      payload.cost_estimate?.trim() || null,
    difficulty:         payload.difficulty?.trim() || null,
    meta_title:         payload.meta_title?.trim() || null,
    meta_description:   payload.meta_description?.trim() || null,
    status:             payload.status || 'draft',
    is_featured:        !!payload.is_featured,
    featured_image_url: payload.featured_image_url || null,
    featured_image_alt: payload.featured_image_alt?.trim() || null,
    content_source:     payload.content_source || 'researched',       // NEW
    last_verified_at:   payload.last_verified_at || null,              // NEW
    contributor_notes:  payload.contributor_notes?.trim() || null, 
  };

  // Handle publish timestamp
  if (row.status === 'published') {
    // Only set published_at if moving TO published
    if (isCreate) {
      row.published_at = new Date().toISOString();
    } else {
      const { data: existing } = await supabase
        .from('trips')
        .select('status, published_at')
        .eq('id', payload.id)
        .maybeSingle();
      if (existing && existing.status !== 'published') {
        row.published_at = new Date().toISOString();
      }
    }
  } else if (row.status === 'draft') {
    row.published_at = null;
  }

  // Upsert the trip
  let tripId = payload.id;
  if (isCreate) {
    const { data, error: insError } = await supabase
      .from('trips')
      .insert(row)
      .select('id')
      .single();
    if (insError) return { ok: false, error: insError.message };
    tripId = data.id;
  } else {
    const { error: updError } = await supabase
      .from('trips')
      .update(row)
      .eq('id', tripId);
    if (updError) return { ok: false, error: updError.message };
  }

  // Replace seasons (delete all, re-insert)
  await supabase.from('trip_seasons').delete().eq('trip_id', tripId);
  if (payload.seasons?.length > 0) {
    const seasonRows = payload.seasons.map(season => ({
      trip_id: tripId,
      season,
    }));
    const { error: sError } = await supabase.from('trip_seasons').insert(seasonRows);
    if (sError) return { ok: false, error: `Saved trip but seasons failed: ${sError.message}` };
  }

  // Replace tags
  await supabase.from('trip_tags').delete().eq('trip_id', tripId);
  if (payload.tag_ids?.length > 0) {
    const tagRows = payload.tag_ids.map(tag_id => ({
      trip_id: tripId,
      tag_id,
    }));
    const { error: tError } = await supabase.from('trip_tags').insert(tagRows);
    if (tError) return { ok: false, error: `Saved trip but tags failed: ${tError.message}` };
  }

  // Invalidate caches
  revalidatePath('/admin/trips');
  revalidatePath('/');

  return { ok: true, id: tripId, slug };
}

/* ============ Delete ============ */
export async function deleteTripAction(tripId) {
  const { supabase, error } = await requireAdmin();
  if (error) return { ok: false, error };

  const { error: delError } = await supabase
    .from('trips')
    .delete()
    .eq('id', tripId);
  if (delError) return { ok: false, error: delError.message };

  revalidatePath('/admin/trips');
  revalidatePath('/');
  return { ok: true };
}