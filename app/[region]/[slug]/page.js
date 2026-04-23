import { createPublicClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, DollarSign, Activity } from 'lucide-react';
import { cldThumb } from '@/lib/cloudinary';

export const revalidate = 60;

const SEASON_EMOJI = { summer: '☀️', fall: '🍂', winter: '❄️', spring: '🌸' };

/* ============ Pre-render known trips at build ============ */
export async function generateStaticParams() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('trips')
    .select('slug, regions(slug)')
    .eq('status', 'published');
  return (data || [])
    .filter(t => t.regions?.slug)
    .map(t => ({ region: t.regions.slug, slug: t.slug }));
}

/* ============ SEO metadata ============ */
export async function generateMetadata({ params }) {
  const { region: regionSlug, slug } = await params;
  const supabase = createPublicClient();

  const { data: trip } = await supabase
    .from('trips')
    .select(`
      title, subtitle, meta_title, meta_description,
      featured_image_url, featured_image_alt, location_text,
      published_at, updated_at,
      regions!inner(slug, name, flag_emoji)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .eq('regions.slug', regionSlug)
    .maybeSingle();

  if (!trip) return { title: 'Not found' };

  const title = trip.meta_title || `${trip.title} · ${trip.regions.name} · PriTrip`;
  const description = trip.meta_description
    || trip.subtitle
    || `An honest guide to ${trip.title}, from someone who's actually been.`;

  const image = trip.featured_image_url
    ? trip.featured_image_url.replace('/upload/', '/upload/c_fill,f_auto,q_auto,w_1200,h_630/')
    : null;

  return {
    title,
    description,
    alternates: {
      canonical: `/${trip.regions.slug}/${slug}`,
    },
    openGraph: {
      title: trip.title,
      description,
      type: 'article',
      publishedTime: trip.published_at,
      modifiedTime: trip.updated_at,
      images: image ? [{ url: image, alt: trip.featured_image_alt || trip.title, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: trip.title,
      description,
      images: image ? [image] : [],
    },
  };
}

/* ============ Page ============ */
export default async function TripPage({ params }) {
  const { region: regionSlug, slug } = await params;
  const supabase = createPublicClient();

  // Full trip data with nested joins
  const { data: trip } = await supabase
    .from('trips')
    .select(`
      *,
      regions!inner(id, slug, name, flag_emoji, description),
      trip_seasons(season, season_note),
      trip_tags(tags(slug, label, emoji, category)),
      trip_photos(id, url, caption, alt_text, is_hero, display_order, uploads(type))
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .eq('regions.slug', regionSlug)
    .maybeSingle();

  if (!trip) return notFound();

  // Related trips: other published trips in same region, not this one
  const { data: related } = await supabase
    .from('trips')
    .select(`
      id, slug, title, location_text,
      featured_image_url, featured_image_alt,
      regions(slug)
    `)
    .eq('region_id', trip.regions.id)
    .eq('status', 'published')
    .neq('id', trip.id)
    .limit(3);

  // Sort photos by display_order, hero first
  const photos = (trip.trip_photos || []).sort((a, b) => {
    if (a.is_hero && !b.is_hero) return -1;
    if (!a.is_hero && b.is_hero) return 1;
    return a.display_order - b.display_order;
  });
  const heroPhoto = photos.find(p => p.is_hero) || photos[0];
  const galleryPhotos = photos.filter(p => p.id !== heroPhoto?.id);

  const heroImageUrl = heroPhoto?.url || trip.featured_image_url;
  const heroImageAlt = heroPhoto?.alt_text || trip.featured_image_alt || trip.title;

  /* ============ JSON-LD for Google ============ */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: trip.title,
    description: trip.meta_description || trip.subtitle,
    image: heroImageUrl ? [heroImageUrl] : [],
    datePublished: trip.published_at,
    dateModified: trip.updated_at,
    author: { '@type': 'Organization', name: 'PriTrip' },
    publisher: { '@type': 'Organization', name: 'PriTrip' },
    about: {
      '@type': 'Place',
      name: trip.regions.name,
    },
  };

  return (
    <main className="min-h-screen bg-[#fef8ed] text-[#0e0e12]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Structured data — invisible, just for Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top nav */}
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
          <Link
            href={`/${trip.regions.slug}`}
            className="text-sm font-semibold hover:text-[#ff3b3b] transition inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14}/> All {trip.regions.name} trips
          </Link>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="max-w-[1200px] mx-auto px-6 pt-6 pb-2 text-xs font-mono uppercase tracking-wider opacity-60">
        <Link href="/" className="hover:text-[#ff3b3b] transition">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/${trip.regions.slug}`} className="hover:text-[#ff3b3b] transition">
          {trip.regions.flag_emoji} {trip.regions.name}
        </Link>
      </div>

      {/* Title block */}
      <header className="max-w-[1200px] mx-auto px-6 pt-4 pb-8">
        <h1 className="font-extrabold leading-[0.95] tracking-[-0.03em] mb-4" style={{ fontSize: 'clamp(40px, 7vw, 80px)' }}>
          {trip.title}
        </h1>

        {trip.subtitle && (
          <p className="text-xl sm:text-2xl opacity-75 max-w-3xl leading-snug mb-6" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            {trip.subtitle}
          </p>
        )}

        <div className="flex items-center gap-4 flex-wrap text-sm font-mono uppercase tracking-wider">
          {trip.location_text && (
            <span className="inline-flex items-center gap-1.5 opacity-70">
              <MapPin size={13}/> {trip.location_text}
            </span>
          )}
          {trip.trip_seasons?.length > 0 && (
            <span className="inline-flex items-center gap-2">
              {trip.trip_seasons.map(s => (
                <span key={s.season} className="inline-flex items-center gap-1 bg-white border-2 border-[#0e0e12] px-2.5 py-0.5 rounded-full normal-case">
                  {SEASON_EMOJI[s.season]} {s.season}
                </span>
              ))}
            </span>
          )}
        </div>
      </header>

      {/* Hero image */}
      {heroImageUrl && (
        <div className="max-w-[1200px] mx-auto px-6 mb-12">
          <div className="aspect-[16/9] rounded-3xl overflow-hidden border-[3px] border-[#0e0e12]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImageUrl.replace('/upload/', '/upload/c_fill,f_auto,q_auto,w_1400,h_788/')}
              alt={heroImageAlt}
              className="w-full h-full object-cover"
            />
          </div>
          {heroPhoto?.caption && (
            <p className="mt-2 text-sm italic opacity-60 text-center" style={{ fontFamily: 'Georgia, serif' }}>
              {heroPhoto.caption}
            </p>
          )}
        </div>
      )}

      {/* Article + sidebar */}
      <div className="max-w-[1200px] mx-auto px-6 pb-16 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12">

        {/* Main content */}
        <article className="min-w-0">
          {trip.body_markdown ? (
            <div
              className="prose-pritrip"
              style={{ fontSize: '17px', lineHeight: '1.75' }}
              dangerouslySetInnerHTML={{ __html: trip.body_markdown }}
            />
          ) : (
            <p className="opacity-60 italic">No guide written yet. Check back soon.</p>
          )}

          {/* Gallery */}
          {galleryPhotos.length > 0 && (
            <section className="mt-16 pt-10 border-t-2 border-[#0e0e12]">
              <h2 className="text-3xl font-extrabold tracking-tight mb-2">
                More from the trip
              </h2>
              <p className="opacity-60 mb-6 text-sm">
                {galleryPhotos.length} photo{galleryPhotos.length === 1 ? '' : 's'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {galleryPhotos.map(photo => {
                  const isVideo = photo.uploads?.type === 'video';
                  return (
                    <figure key={photo.id}>
                      <div className="aspect-[4/3] rounded-2xl overflow-hidden border-2 border-[#0e0e12]">
                        {isVideo ? (
                          <video src={photo.url} controls className="w-full h-full object-cover"/>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photo.url.replace('/upload/', '/upload/c_fill,f_auto,q_auto,w_800,h_600/')}
                            alt={photo.alt_text || ''}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      {photo.caption && (
                        <figcaption className="mt-2 text-sm italic opacity-70" style={{ fontFamily: 'Georgia, serif' }}>
                          {photo.caption}
                        </figcaption>
                      )}
                    </figure>
                  );
                })}
              </div>
            </section>
          )}

          {/* Tags footer */}
          {trip.trip_tags?.length > 0 && (
            <div className="mt-12 pt-8 border-t border-[#0e0e12]/20">
              <div className="text-xs font-mono uppercase tracking-[1.5px] opacity-50 mb-3">Tagged</div>
              <div className="flex flex-wrap gap-2">
                {trip.trip_tags.map(tt => (
                  <span
                    key={tt.tags.slug}
                    className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1 bg-white border-2 border-[#0e0e12] rounded-full"
                  >
                    {tt.tags.emoji} {tt.tags.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-white border-[3px] border-[#0e0e12] rounded-3xl p-6 space-y-4" style={{boxShadow:'6px 6px 0 #0e0e12'}}>
            <h3 className="font-extrabold text-lg tracking-tight border-b-2 border-[#0e0e12] pb-3">
              Quick facts
            </h3>

            {trip.best_time && (
              <InfoRow icon={Calendar} label="Best time" value={trip.best_time} />
            )}
            {trip.difficulty && (
              <InfoRow icon={Activity} label="Difficulty" value={trip.difficulty} />
            )}
            {trip.cost_estimate && (
              <InfoRow icon={DollarSign} label="Cost" value={trip.cost_estimate} />
            )}
            {trip.location_text && (
              <InfoRow icon={MapPin} label="Getting there" value={trip.location_text} />
            )}

            {/* Season notes */}
            {trip.trip_seasons?.some(s => s.season_note) && (
              <div className="pt-3 border-t border-[#0e0e12]/15">
                <div className="text-[10px] font-mono uppercase tracking-[1.5px] opacity-50 mb-2">Season tips</div>
                <ul className="space-y-2 text-sm">
                  {trip.trip_seasons.filter(s => s.season_note).map(s => (
                    <li key={s.season}>
                      <span className="font-bold">{SEASON_EMOJI[s.season]} {s.season}:</span>{' '}
                      <span className="opacity-80">{s.season_note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Related trips */}
      {related && related.length > 0 && (
        <section className="bg-[#f7ead1] border-t-2 border-[#0e0e12]">
          <div className="max-w-[1200px] mx-auto px-6 py-16">
            <div className="mb-8">
              <div className="text-xs font-mono uppercase tracking-[2px] opacity-60 mb-2">
                Keep exploring
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                More {trip.regions.name} trips
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {related.map(r => (
                <Link
                  key={r.id}
                  href={`/${r.regions.slug}/${r.slug}`}
                  className="group border-[3px] border-[#0e0e12] rounded-3xl overflow-hidden bg-white transition-transform hover:-translate-y-1.5 block"
                >
                  <div className="aspect-[4/3] relative">
                    {r.featured_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.featured_image_url.replace('/upload/', '/upload/c_fill,f_auto,q_auto,w_500,h_375/')}
                        alt={r.featured_image_alt || r.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#1e90ff] via-[#7cc7ff] to-[#c7ff3f]"/>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-extrabold text-lg tracking-tight group-hover:text-[#ff3b3b] transition">{r.title}</h3>
                    <div className="font-mono text-[11px] uppercase opacity-60 mt-1">{r.location_text}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t-2 border-[#0e0e12]">
        <div className="max-w-[1200px] mx-auto px-6 py-8 flex justify-between flex-wrap gap-3 font-mono text-[11px] opacity-60">
          <span>© 2026 PriTrip</span>
          <Link href={`/${trip.regions.slug}`} className="hover:text-[#ff3b3b] transition">
            ← more {trip.regions.name} trips
          </Link>
        </div>
      </footer>
    </main>
  );
}

/* ============ Sidebar info row ============ */
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-[1.5px] opacity-50 mb-1 flex items-center gap-1">
        <Icon size={10}/> {label}
      </div>
      <div className="text-sm font-semibold leading-snug">{value}</div>
    </div>
  );
}