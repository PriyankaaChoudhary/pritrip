import { createPublicClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const revalidate = 60;

export async function generateStaticParams() {
  const supabase = createPublicClient();
  const { data } = await supabase.from('regions').select('slug').eq('is_live', true);
  return (data || []).map(r => ({ region: r.slug }));
}

export async function generateMetadata({ params }) {
  const { region: slug } = await params;
  const supabase = createPublicClient();
  const { data: region } = await supabase
    .from('regions')
    .select('name, description, hero_tagline')
    .eq('slug', slug)
    .eq('is_live', true)
    .maybeSingle();

  if (!region) return { title: 'Not found' };

  const title = `${region.name} · PriTrip`;
  const description = region.description || `Real travel guides for ${region.name}, from someone who's actually been.`;

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function RegionPage({ params }) {
  const { region: slug } = await params;
  const supabase = createPublicClient();

  const { data: region } = await supabase
    .from('regions')
    .select(`
      *,
      countries(name, flag_emoji),
      continents!regions_continent_id_fkey(name)
    `)
    .eq('slug', slug)
    .eq('is_live', true)
    .maybeSingle();

  if (!region) return notFound();

  const { data: trips } = await supabase
    .from('trips')
    .select(`
      id, slug, title, subtitle, location_text,
      featured_image_url, featured_image_alt,
      card_size, is_featured, published_at,
      trip_seasons(season),
      trip_tags(tags(slug, label, emoji))
    `)
    .eq('region_id', region.id)
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false });

  return (
    <main className="min-h-screen bg-[#fef8ed] text-[#0e0e12]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#fef8ed]/85 border-b-2 border-[#0e0e12]">
        <div className="max-w-[1200px] mx-auto px-6 py-3.5 flex items-center justify-between gap-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-2xl italic" style={{ fontFamily: 'Georgia, serif' }}>
            Pri
            <span
              className="bg-[#ff3b3b] text-[#fef8ed] px-2.5 py-0.5 rounded-full text-lg font-extrabold not-italic"
              style={{ transform: 'rotate(-4deg)', display: 'inline-block', fontFamily: 'system-ui' }}
            >
              Trip
            </span>
          </Link>
          <Link href="/" className="text-sm font-semibold hover:text-[#ff3b3b] transition inline-flex items-center gap-1.5">
            <ArrowLeft size={14}/> All destinations
          </Link>
        </div>
      </nav>

      <header className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="inline-flex items-center gap-2 bg-[#c7ff3f] border-2 border-[#0e0e12] px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-widest mb-6" style={{transform:'rotate(-1.5deg)'}}>
          <span className="w-2 h-2 rounded-full bg-[#ff3b3b] animate-pulse"/>
          Live guide
        </div>

        <h1 className="font-extrabold leading-[0.9] tracking-[-0.03em] mb-5" style={{ fontSize: 'clamp(48px, 9vw, 120px)' }}>
          {region.flag_emoji} <br className="sm:hidden"/>
          {region.name}
        </h1>

        {region.description && (
          <p className="max-w-[640px] text-lg sm:text-xl font-medium opacity-80 leading-snug mb-6">
            {region.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm font-mono uppercase tracking-widest opacity-60">
          <span>{trips?.length ?? 0} published guide{trips?.length === 1 ? '' : 's'}</span>
          {region.countries && <span>· {region.countries.name}</span>}
        </div>
      </header>

      <section className="max-w-[1200px] mx-auto px-6 pb-24">
        {trips && trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {trips.map(trip => (
              <TripCard key={trip.id} trip={trip} regionSlug={region.slug} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🚧</div>
            <h2 className="text-2xl font-extrabold mb-2">Nothing published yet</h2>
            <p className="opacity-60">New guides for {region.name} land here first. Check back soon.</p>
          </div>
        )}
      </section>

      <footer className="border-t-2 border-[#0e0e12] max-w-[1200px] mx-auto px-6 py-10">
        <div className="flex justify-between flex-wrap gap-3 font-mono text-[11px] opacity-60">
          <span>© 2026 PriTrip</span>
          <Link href="/" className="hover:text-[#ff3b3b] transition">← back to all destinations</Link>
        </div>
      </footer>
    </main>
  );
}

function TripCard({ trip, regionSlug }) {
  return (
    <Link
      href={`/${regionSlug}/${trip.slug}`}
      className="group border-[3px] border-[#0e0e12] rounded-3xl overflow-hidden bg-white transition-transform hover:-translate-y-1.5 block"
    >
      <div className="aspect-[4/3] relative overflow-hidden">
        {trip.featured_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={trip.featured_image_url.replace('/upload/', '/upload/c_fill,f_auto,q_auto,w_600,h_450/')}
            alt={trip.featured_image_alt || trip.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1e90ff] via-[#7cc7ff] to-[#c7ff3f] flex items-center justify-center text-white italic text-3xl" style={{fontFamily:'Georgia, serif'}}>
            {trip.title[0]}
          </div>
        )}
        {trip.is_featured && (
          <div className="absolute top-3 left-3 bg-[#ffcc3f] text-[#0e0e12] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border-2 border-[#0e0e12]">
            ★ Featured
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-extrabold text-xl mb-1 tracking-tight group-hover:text-[#ff3b3b] transition">{trip.title}</h3>
        {trip.subtitle && (
          <p className="text-sm opacity-70 mb-3 leading-snug">{trip.subtitle}</p>
        )}
        <div className="font-mono text-[11px] uppercase opacity-60 mb-3">{trip.location_text}</div>
        <div className="flex gap-1.5 flex-wrap">
          {trip.trip_seasons?.map(s => (
            <span key={s.season} className="text-[10px] font-semibold px-2 py-0.5 border border-[#0e0e12] rounded-full">
              {s.season}
            </span>
          ))}
          {trip.trip_tags?.slice(0, 2).map(tt => (
            <span key={tt.tags.slug} className="text-[10px] font-semibold px-2 py-0.5 bg-[#c7ff3f] border border-[#0e0e12] rounded-full">
              {tt.tags.emoji} {tt.tags.label}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}