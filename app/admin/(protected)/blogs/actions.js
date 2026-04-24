'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { slugify } from '@/lib/slugify';

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

export async function checkBlogSlugAvailable({ slug, excludeId }) {
  const { supabase, error } = await requireAdmin();
  if (error) return { ok: false, error };
  if (!slug) return { ok: true, available: true };

  let q = supabase
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .eq('slug', slug);
  if (excludeId) q = q.neq('id', excludeId);

  const { count, error: qError } = await q;
  if (qError) return { ok: false, error: qError.message };
  return { ok: true, available: count === 0 };
}

export async function saveBlogAction(payload) {
  const { supabase, error } = await requireAdmin();
  if (error) return { ok: false, error };

  const isCreate = !payload.id;

  if (!payload.title?.trim()) return { ok: false, error: 'Title is required' };

  let slug = (payload.slug || '').trim();
  if (!slug) slug = slugify(payload.title);
  if (!slug) return { ok: false, error: 'Could not generate slug from title' };

  const availRes = await checkBlogSlugAvailable({ slug, excludeId: payload.id });
  if (!availRes.ok) return { ok: false, error: availRes.error };
  if (!availRes.available) {
    return { ok: false, error: `Slug "${slug}" is already used. Try another.` };
  }

  // Estimate reading time from body (~200 words/min)
  const wordCount = (payload.body || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.round(wordCount / 200));

  const row = {
    slug,
    title:              payload.title.trim(),
    kicker:             payload.kicker?.trim() || null,
    subtitle:           payload.subtitle?.trim() || null,
    excerpt:            payload.excerpt?.trim() || null,
    body_html:          payload.body || null,
    cover_image_url:    payload.cover_image_url || null,
    cover_image_alt:    payload.cover_image_alt?.trim() || null,
    author_name:        payload.author_name?.trim() || 'PriTrip',
    region_id:          payload.region_id || null,
    meta_title:         payload.meta_title?.trim() || null,
    meta_description:   payload.meta_description?.trim() || null,
    status:             payload.status || 'draft',
    is_featured:        !!payload.is_featured,
    reading_minutes:    readingMinutes,
  };

  // Handle publish timestamp
  if (row.status === 'published') {
    if (isCreate) {
      row.published_at = new Date().toISOString();
    } else {
      const { data: existing } = await supabase
        .from('blog_posts')
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

  let blogId = payload.id;
  if (isCreate) {
    const { data, error: insError } = await supabase
      .from('blog_posts')
      .insert(row)
      .select('id')
      .single();
    if (insError) return { ok: false, error: insError.message };
    blogId = data.id;
  } else {
    const { error: updError } = await supabase
      .from('blog_posts')
      .update(row)
      .eq('id', blogId);
    if (updError) return { ok: false, error: updError.message };
  }

  // Replace tags
  await supabase.from('blog_post_tags').delete().eq('blog_post_id', blogId);
  if (payload.tag_ids?.length > 0) {
    const tagRows = payload.tag_ids.map(tag_id => ({ blog_post_id: blogId, tag_id }));
    const { error: tError } = await supabase.from('blog_post_tags').insert(tagRows);
    if (tError) return { ok: false, error: `Saved blog but tags failed: ${tError.message}` };
  }

  revalidatePath('/admin/blogs');
  revalidatePath('/');
  revalidatePath('/blog');
  revalidatePath(`/blog/${slug}`);

  return { ok: true, id: blogId, slug };
}

export async function deleteBlogAction(blogId) {
  const { supabase, error } = await requireAdmin();
  if (error) return { ok: false, error };

  const { error: delError } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', blogId);
  if (delError) return { ok: false, error: delError.message };

  revalidatePath('/admin/blogs');
  revalidatePath('/');
  revalidatePath('/blog');
  return { ok: true };
}