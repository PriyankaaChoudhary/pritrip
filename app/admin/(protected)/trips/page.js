import { createClient } from '@/lib/supabase/server';
import TripsList from './trips-list';

export const revalidate = 0;

export default async function TripsPage() {
  const supabase = await createClient();

  const [
    { data: trips },
    { data: regions },
  ] = await Promise.all([
    supabase
      .from('trips')
      .select(`
        id, slug, title, subtitle, status, updated_at, created_at,
        card_size, is_featured, location_text,
        regions(name, flag_emoji, slug),
        trip_seasons(season),
        trip_tags(tags(slug, label, emoji))
      `)
      .order('updated_at', { ascending: false }),
    supabase.from('regions').select('id, name, flag_emoji, slug').order('display_order'),
  ]);

  return <TripsList initialTrips={trips || []} regions={regions || []} />;
}