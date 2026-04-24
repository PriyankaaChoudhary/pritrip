import { createPublicClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';

export const revalidate = 60;

export async function generateMetadata() {
  return {
    title: 'Blog · PriTrip',
    description: 'Roundups, guides, and long-form travel writing from PriTrip.',
  };
}

export default async function BlogIndexPage() {
  const supabase = createPublicClient();

  const { data: blogs } = await supabase
    .from('blog_posts')
    .select('id, slug, title, subtitle, kicker, excerpt, cover_image_url, cover_image_alt, reading_minutes, published_at, is_featured, regions(flag_emoji, name)')
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false });

  return (
    <main className="pritrip-public">
      <nav className="pt-nav">
        <div className="pt-nav-inner">
          <Link href="/" className="pt-logo">Pri<span>Trip</span></Link>
          <Link href="/" className="pt-nav-cta">← Back home</Link>
        </div>
      </nav>

      <header className="pt-hero" style={{ paddingBottom: 40 }}>
        <div className="pt-hero-tag">
          <span className="dot"></span> From the blog
        </div>
        <h1 className="pt-hero-title" style={{ fontSize: 'clamp(44px, 9vw, 120px)' }}>
          Deep dives, <br/>
          <span className="italic">roundups</span> & <br/>
          <span className="sticker">lists.</span>
        </h1>
        <p className="pt-hero-sub">
          Researched, cross-referenced travel articles. Best read with coffee.
        </p>
      </header>

      <section style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 28px 80px' }}>
        {!blogs || blogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, opacity: 0.6 }}>
            <p style={{ fontSize: 18, fontWeight: 600 }}>No posts published yet.</p>
          </div>
        ) : (
          <div className="pt-blogs-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {blogs.map(b => (
              <Link key={b.id} href={`/blog/${b.slug}`} className="pt-blog-card">
                <div className="cover">
                  {b.cover_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.cover_image_url.replace('/upload/', '/upload/c_fill,f_auto,q_auto,w_800,h_500/')}
                      alt={b.cover_image_alt || b.title}
                    />
                  )}
                </div>
                <div className="body">
                  <div className="kicker" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{b.kicker || 'Post'}</span>
                    {b.reading_minutes && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} /> {b.reading_minutes} min
                      </span>
                    )}
                  </div>
                  <h3>{b.title}</h3>
                  {b.excerpt && <p className="excerpt">{b.excerpt}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="pt-footer">
        <div className="pt-foot-bottom">
          <span>© 2026 PriTrip</span>
          <Link href="/">← Home</Link>
        </div>
      </footer>
    </main>
  );
}