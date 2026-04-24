import { createPublicClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';

export const revalidate = 60;

export async function generateStaticParams() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('blog_posts')
    .select('slug')
    .eq('status', 'published');
  return (data || []).map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const supabase = createPublicClient();

  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, subtitle, excerpt, meta_title, meta_description, cover_image_url, cover_image_alt, published_at, updated_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!post) return { title: 'Not found' };

  const title = post.meta_title || `${post.title} · PriTrip`;
  const description = post.meta_description || post.excerpt || post.subtitle || '';
  const image = post.cover_image_url
    ? post.cover_image_url.replace('/upload/', '/upload/c_fill,f_auto,q_auto,w_1200,h_630/')
    : null;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      images: image ? [{ url: image, alt: post.cover_image_alt || post.title, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const supabase = createPublicClient();

  const { data: post } = await supabase
    .from('blog_posts')
    .select(`
      *,
      regions(slug, name, flag_emoji),
      blog_post_tags(tags(slug, label, emoji))
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!post) return notFound();

  // Related posts — other published posts, up to 3
  const { data: related } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, kicker, cover_image_url, reading_minutes')
    .eq('status', 'published')
    .neq('id', post.id)
    .limit(3);

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.meta_description || post.excerpt,
    image: post.cover_image_url ? [post.cover_image_url] : [],
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { '@type': 'Person', name: post.author_name || 'PriTrip' },
    publisher: { '@type': 'Organization', name: 'PriTrip' },
  };

  return (
    <main className="pritrip-public">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="pt-nav">
        <div className="pt-nav-inner">
          <Link href="/" className="pt-logo">Pri<span>Trip</span></Link>
          <Link href="/blog" style={{ fontSize: 14, fontWeight: 600 }}>
            ← All posts
          </Link>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 28px 0', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.6 }}>
        <Link href="/">Home</Link>
        <span style={{ margin: '0 8px' }}>/</span>
        <Link href="/blog">Blog</Link>
      </div>

      {/* Header */}
      <header style={{ maxWidth: 900, margin: '0 auto', padding: '20px 28px 32px' }}>
        {post.kicker && (
          <div style={{ display: 'inline-block', background: 'var(--p-lime)', border: '2px solid var(--p-ink)', padding: '4px 14px', borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20 }}>
            {post.kicker}
          </div>
        )}
        <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 20 }}>
          {post.title}
        </h1>
        {post.subtitle && (
          <p style={{ fontSize: 22, opacity: 0.75, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.3, maxWidth: 720, marginBottom: 24 }}>
            {post.subtitle}
          </p>
        )}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.7 }}>
          {post.published_at && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Calendar size={12} /> {new Date(post.published_at).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          )}
          {post.reading_minutes && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={12} /> {post.reading_minutes} min read
            </span>
          )}
          <span>by {post.author_name || 'PriTrip'}</span>
        </div>
      </header>

      {/* Cover */}
      {post.cover_image_url && (
        <div style={{ maxWidth: 1200, margin: '0 auto 40px', padding: '0 28px' }}>
          <div style={{ aspectRatio: '16/9', borderRadius: 24, overflow: 'hidden', border: '3px solid var(--p-ink)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.cover_image_url.replace('/upload/', '/upload/c_fill,f_auto,q_auto,w_1400,h_788/')}
              alt={post.cover_image_alt || post.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>
      )}

      {/* Body */}
      <article style={{ maxWidth: 720, margin: '0 auto', padding: '0 28px 40px' }}>
        {post.body_html ? (
          <div
            className="prose-pritrip"
            style={{ fontSize: 17, lineHeight: 1.75 }}
            dangerouslySetInnerHTML={{ __html: post.body_html }}
          />
        ) : (
          <p style={{ opacity: 0.6, fontStyle: 'italic' }}>This post doesn't have a body yet.</p>
        )}

        {/* Tags */}
        {post.blog_post_tags?.length > 0 && (
          <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(14,14,18,0.15)' }}>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.5, marginBottom: 12 }}>
              Tagged
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {post.blog_post_tags.map(t => (
                <span key={t.tags.slug} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 600, padding: '4px 12px', background: 'white', border: '2px solid var(--p-ink)', borderRadius: 999 }}>
                  {t.tags.emoji} {t.tags.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Related */}
      {related && related.length > 0 && (
        <section style={{ background: 'var(--p-paper-warm)', borderTop: '2px solid var(--p-ink)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 28px' }}>
            <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: 2, opacity: 0.6, marginBottom: 12 }}>
              Keep reading
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, marginBottom: 32 }}>
              More from the blog
            </h2>
            <div className="pt-blogs-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {related.map(r => (
                <Link key={r.id} href={`/blog/${r.slug}`} className="pt-blog-card">
                  <div className="cover">
                    {r.cover_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.cover_image_url.replace('/upload/', '/upload/c_fill,f_auto,q_auto,w_500,h_310/')}
                        alt={r.title}
                      />
                    )}
                  </div>
                  <div className="body">
                    <div className="kicker">{r.kicker || 'Post'}</div>
                    <h3>{r.title}</h3>
                    {r.excerpt && <p className="excerpt">{r.excerpt}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="pt-footer">
        <div className="pt-foot-bottom">
          <span>© 2026 PriTrip</span>
          <Link href="/blog">← All posts</Link>
        </div>
      </footer>
    </main>
  );
}