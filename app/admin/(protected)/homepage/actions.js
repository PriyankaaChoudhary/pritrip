'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function saveSettingAction(key, value) {
  const supabase = await createClient();

  // Verify user is an admin (defense in depth — RLS already enforces it)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'Not authenticated' };
  }
  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!adminRow) {
    return { ok: false, error: 'Not an admin' };
  }

  // Validate the key is one we expect (prevent arbitrary writes)
  const allowedKeys = ['hero', 'counter', 'sections', 'footer', 'meta'];
  if (!allowedKeys.includes(key)) {
    return { ok: false, error: 'Invalid settings key' };
  }

  // Upsert
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() });

  if (error) {
    return { ok: false, error: error.message };
  }

  // Invalidate the public homepage cache so changes appear immediately
  revalidatePath('/');
  revalidatePath('/admin/homepage');

  return { ok: true };
}