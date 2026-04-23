'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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
  return { supabase, user, role: adminRow.role };
}

/* ============ Record an upload in our DB ============ */
export async function recordUploadAction(meta) {
  const { supabase, user, error } = await requireAdmin();
  if (error) return { ok: false, error };

  const { data, error: insError } = await supabase
    .from('uploads')
    .insert({
      public_id:  meta.public_id,
      url:        meta.url,
      type:       meta.type,
      width:      meta.width || null,
      height:     meta.height || null,
      bytes:      meta.bytes || null,
      alt_text:   meta.alt_text || null,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (insError) return { ok: false, error: insError.message };
  return { ok: true, upload: data };
}

/* ============ Add photo to a trip ============ */
export async function addTripPhotoAction({ tripId, uploadId, url, caption, altText, isHero }) {
  const { supabase, error } = await requireAdmin();
  if (error) return { ok: false, error };

  // If marking as hero, unset existing hero first
  if (isHero) {
    await supabase
      .from('trip_photos')
      .update({ is_hero: false })
      .eq('trip_id', tripId)
      .eq('is_hero', true);
  }

  // Figure out next display_order
  const { data: existing } = await supabase
    .from('trip_photos')
    .select('display_order')
    .eq('trip_id', tripId)
    .order('display_order', { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;

  const { data, error: insError } = await supabase
    .from('trip_photos')
    .insert({
      trip_id:       tripId,
      upload_id:     uploadId,
      url,
      caption:       caption || null,
      alt_text:      altText || null,
      is_hero:       !!isHero,
      display_order: nextOrder,
    })
    .select('*, uploads(public_id, type, width, height)')
    .single();

  if (insError) return { ok: false, error: insError.message };

  // Also set the featured_image_url on the trip if this is the hero
  if (isHero) {
    await supabase
      .from('trips')
      .update({
        featured_image_url: url,
        featured_image_alt: altText || null,
      })
      .eq('id', tripId);
  }

  revalidatePath(`/admin/trips/${tripId}`);
  revalidatePath('/');
  return { ok: true, photo: data };
}

/* ============ Update an existing photo ============ */
export async function updateTripPhotoAction({ photoId, tripId, caption, altText, isHero }) {
  const { supabase, error } = await requireAdmin();
  if (error) return { ok: false, error };

  if (isHero) {
    // Unset other heroes first
    await supabase
      .from('trip_photos')
      .update({ is_hero: false })
      .eq('trip_id', tripId)
      .eq('is_hero', true)
      .neq('id', photoId);
  }

  const { error: updError } = await supabase
    .from('trip_photos')
    .update({
      caption:  caption || null,
      alt_text: altText || null,
      is_hero:  !!isHero,
    })
    .eq('id', photoId);

  if (updError) return { ok: false, error: updError.message };

  // Sync hero -> trips.featured_image_url
  if (isHero) {
    const { data: photo } = await supabase
      .from('trip_photos')
      .select('url, alt_text')
      .eq('id', photoId)
      .maybeSingle();
    if (photo) {
      await supabase
        .from('trips')
        .update({
          featured_image_url: photo.url,
          featured_image_alt: photo.alt_text,
        })
        .eq('id', tripId);
    }
  }

  revalidatePath(`/admin/trips/${tripId}`);
  revalidatePath('/');
  return { ok: true };
}

/* ============ Delete a photo ============ */
export async function deleteTripPhotoAction({ photoId, tripId }) {
  const { supabase, error } = await requireAdmin();
  if (error) return { ok: false, error };

  // Check if this was the hero; if so, also clear trips.featured_image_url
  const { data: photo } = await supabase
    .from('trip_photos')
    .select('is_hero')
    .eq('id', photoId)
    .maybeSingle();

  const { error: delError } = await supabase
    .from('trip_photos')
    .delete()
    .eq('id', photoId);

  if (delError) return { ok: false, error: delError.message };

  if (photo?.is_hero) {
    await supabase
      .from('trips')
      .update({ featured_image_url: null, featured_image_alt: null })
      .eq('id', tripId);
  }

  revalidatePath(`/admin/trips/${tripId}`);
  revalidatePath('/');
  return { ok: true };
}

/* ============ Reorder photos ============ */
export async function reorderTripPhotosAction({ tripId, orderedIds }) {
  const { supabase, error } = await requireAdmin();
  if (error) return { ok: false, error };

  // Update each photo's display_order
  const promises = orderedIds.map((id, idx) =>
    supabase
      .from('trip_photos')
      .update({ display_order: idx })
      .eq('id', id)
      .eq('trip_id', tripId)
  );

  const results = await Promise.all(promises);
  const firstError = results.find(r => r.error);
  if (firstError) return { ok: false, error: firstError.error.message };

  revalidatePath(`/admin/trips/${tripId}`);
  return { ok: true };
}