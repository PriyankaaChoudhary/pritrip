import { createClient } from '@/lib/supabase/server';
import HomepageEditor from './editor';

export const revalidate = 0;

export default async function HomepageEditorPage() {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['hero', 'counter', 'sections', 'footer', 'meta']);

  const initialSettings = (rows || []).reduce((acc, r) => {
    acc[r.key] = r.value;
    return acc;
  }, {});

  return <HomepageEditor initialSettings={initialSettings} />;
}