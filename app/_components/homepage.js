'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';

const SEASON_META = {
  summer: { emoji: '☀️', label: 'Summer', meta: 'Jun – Aug · Beaches & cottages' },
  fall:   { emoji: '🍂', label: 'Fall',   meta: 'Sep – Nov · Leaf season mania' },
  winter: { emoji: '❄️', label: 'Winter', meta: 'Dec – Feb · Snow, skates, saunas' },
  spring: { emoji: '🌸', label: 'Spring', meta: 'Mar – May · Blooms & waterfalls' },
};

const CONTINENTS_MAP = {
  na: { name: 'North America', title: 'Live & loaded 🚀',
        path: 'M80,100 L180,80 L260,90 L320,130 L310,200 L280,260 L220,290 L160,280 L110,230 L80,160 Z',
        label: { x: 195, y: 180 }, badge: { cx: 260, cy: 130 } },
  sa: { name: 'South America', title: 'On the shortlist 🗳️',
        path: 'M230,310 L290,305 L310,360 L290,420 L255,455 L220,440 L210,380 Z',
        label: { x: 260, y: 380 } },
  eu: { name: 'Europe', title: 'Coming 2026 ✈️',
        path: 'M400,90 L470,80 L510,100 L515,150 L470,180 L420,175 L395,140 Z',
        label: { x: 455, y: 135 } },
  af: { name: 'Africa', title: 'Big plans brewing 🌍',
        path: 'M430,200 L500,195 L530,240 L525,320 L490,380 L450,400 L415,370 L400,300 L405,240 Z',
        label: { x: 465, y: 300 } },
  as: { name: 'Asia', title: 'Top of the wishlist 🍜',
        path: 'M530,80 L680,70 L780,100 L800,170 L760,220 L680,240 L600,220 L540,180 L525,120 Z',
        label: { x: 660, y: 160 } },
  oc: { name: 'Oceania', title: 'The long haul 🌊',
        path: 'M720,320 L800,315 L820,360 L790,390 L740,385 L715,355 Z',
        label: { x: 770, y: 355 } },
};

// Placeholder fallbacks for coming-soon regions
const PLACEHOLDER_REGIONS = {
  sa: [{ slug: null, name: 'Patagonia, Argentina 🇦🇷' }, { slug: null, name: 'Cusco & Machu Picchu 🇵🇪' }],
  eu: [{ slug: null, name: 'Iceland 🇮🇸' }, { slug: null, name: 'Portugal 🇵🇹' }, { slug: null, name: 'Italy 🇮🇹' }],
  af: [{ slug: null, name: 'Morocco 🇲🇦' }, { slug: null, name: 'Kenya safari 🇰🇪' }],
  as: [{ slug: null, name: 'Japan 🇯🇵' }, { slug: null, name: 'Vietnam 🇻🇳' }, { slug: null, name: 'Thailand 🇹🇭' }],
  oc: [{ slug: null, name: 'Australia 🇦🇺' }, { slug: null, name: 'New Zealand 🇳🇿' }],
};

export default function HomePage({ settings, continents, regions, trips, venues, blogs }) {
  const hero = settings.hero || {};
  const counter = settings.counter || {};
  const sections = settings.sections || {};
  const footer = settings.footer || {};

  const [season, setSeason] = useState('summer');
  const [activeContinent, setActiveContinent] = useState('na');
  const [activityFilter, setActivityFilter] = useState('all');

  // Group trips by season
  const tripsBySeason = useMemo(() => {
    const g = { summer: [], fall: [], winter: [], spring: [] };
    for (const t of trips || []) {
      for (const s of t.trip_seasons || []) {
        if (g[s.season]) g[s.season].push(t);
      }
    }
    return g;
  }, [trips]);

  const shownTrips = tripsBySeason[season] || [];

  // Filter venues
  const filteredVenues = useMemo(() => {
    if (activityFilter === 'all') return venues || [];
    return (venues || []).filter(v => (v.activity_categories || []).includes(activityFilter));
  }, [venues, activityFilter]);

  // Continent regions (live from DB + placeholders for empty continents)
  const activeContinentRegions = useMemo(() => {
    const live = (regions || []).filter(r => r.continent_id === activeContinent);
    if (live.length > 0) {
      return live.map(r => ({ slug: r.slug, name: `${r.flag_emoji || '📍'} ${r.name}`, live: true }));
    }
    return (PLACEHOLDER_REGIONS[activeContinent] || []).map(r => ({ ...r, live: false }));
  }, [regions, activeContinent]);

  const activeContinentMeta = CONTINENTS_MAP[activeContinent] || CONTINENTS_MAP.na;
  const naContentCount = (regions || []).filter(r => r.continent_id === 'na').length;

  return (
    <main className={`pritrip-public season-${season}`}>

      {/* ============ NAV ============ */}
      <nav className="pt-nav">
        <div className="pt-nav-inner">
          <Link href="/" className="pt-logo">Pri<span>Trip</span></Link>
          <div className="pt-nav-links">
            <a href="#world">Destinations</a>
            <a href="#seasons">Seasons</a>
            <a href="#activities">Activities</a>
            <a href="#blogs">Blog</a>
          </div>
          <a href="#seasons" className="pt-nav-cta">Plan a trip →</a>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <header className="pt-hero">
        {hero.tag && (
          <div className="pt-hero-tag">
            <span className="dot"></span>
            {hero.tag}
          </div>
        )}

        <h1 className="pt-hero-title">
          {hero.title_line_1} <span className="italic">{hero.title_line_1_italic}</span><br />
          {hero.title_line_2}<br />
          <span className="sticker">{hero.title_line_3_sticker}</span>
        </h1>

        {hero.subtitle && <p className="pt-hero-sub">{hero.subtitle}</p>}

        <div className="pt-counter">
          {[1, 2, 3, 4].map(n => counter[`stat_${n}_number`] ? (
            <div key={n} className="stat">
              <div className="num">{counter[`stat_${n}_number`]}</div>
              <div className="lbl">{counter[`stat_${n}_label`]}</div>
            </div>
          ) : null)}
        </div>

        <div className="pt-hero-actions">
          {hero.cta_primary_label && (
            <a href={hero.cta_primary_href || '#world'} className="pt-btn-primary">{hero.cta_primary_label} →</a>
          )}
          {hero.cta_secondary_label && (
            <a href={hero.cta_secondary_href || '#blogs'} className="pt-btn-secondary">{hero.cta_secondary_label}</a>
          )}
        </div>

        {hero.floater_1 && <div className="pt-floater f1">{hero.floater_1}</div>}
        {hero.floater_2 && <div className="pt-floater f2">{hero.floater_2}</div>}
        {hero.floater_3 && <div className="pt-floater f3">{hero.floater_3}</div>}
      </header>

      {/* ============ WORLD MAP ============ */}
      <section className="pt-world" id="world">
        <div className="pt-section-label">01 — {sections.world_eyebrow || 'Destinations'}</div>
        <div className="pt-world-header">
          <h2>
            {sections.world_title_1 || 'The map grows'}<br />
            {sections.world_title_2 || 'as I'} <span className="italic">{sections.world_title_2_italic || 'go.'}</span>
          </h2>
          <p>{sections.world_subtitle || 'Yellow continents have live guides. Grey ones are on the list — pick where I should fly next.'}</p>
        </div>

        <div className="pt-world-grid">
          <div className="pt-world-map-wrap">
            <svg className="pt-world-svg" viewBox="0 0 900 480" xmlns="http://www.w3.org/2000/svg">
              {Object.entries(CONTINENTS_MAP).map(([key, meta]) => {
                const isActive = activeContinent === key;
                const hasContent = key === 'na' && naContentCount > 0;
                return (
                  <g key={key}>
                    <g
                      className={`pt-continent ${isActive ? 'active' : ''} ${hasContent ? 'has-content' : ''}`}
                      onClick={() => setActiveContinent(key)}
                    >
                      <path d={meta.path} />
                    </g>
                    <text className="pt-cont-label" x={meta.label.x} y={meta.label.y}>
                      {meta.name.toUpperCase()}
                    </text>
                    {hasContent && key === 'na' && (
                      <>
                        <circle cx={meta.badge.cx} cy={meta.badge.cy} r="14" fill="#ff3b3b" stroke="#0e0e12" strokeWidth="2" />
                        <text className="pt-count-badge" x={meta.badge.cx} y={meta.badge.cy + 4}>{naContentCount}</text>
                      </>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="pt-region-panel">
            <div className="sub">{activeContinentMeta.name}</div>
            <h3>{activeContinentMeta.title}</h3>
            <div className="pt-region-list">
              {activeContinentRegions.map((r, idx) => {
                const className = `pt-region-item ${r.live ? 'live' : ''}`;
                if (r.live && r.slug) {
                  return (
                    <Link key={idx} href={`/${r.slug}`} className={className}>
                      <span className="name">{r.name}</span>
                      <span className="status">✓ Live</span>
                    </Link>
                  );
                }
                return (
                  <div key={idx} className={className}>
                    <span className="name">{r.name}</span>
                    <span className="status">Coming soon</span>
                  </div>
                );
              })}
            </div>
            <div className="pt-region-vote">
              Want me somewhere else? <a href="#">Vote for the next destination →</a>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SEASONS ============ */}
      <section className="pt-seasons" id="seasons">
        <div className="pt-seasons-header">
          <h2>{sections.seasons_title || 'Plan by'} <span className="italic">{sections.seasons_title_italic || 'season.'}</span></h2>
          <div className="pt-now-showing"><span className="flag">🇨🇦</span> Showing: Ontario, Canada</div>
        </div>

        <div className="pt-season-tabs">
          {Object.entries(SEASON_META).map(([key, s]) => (
            <button
              key={key}
              className={`pt-season-tab ${season === key ? 'active' : ''}`}
              data-season={key}
              onClick={() => setSeason(key)}
              type="button"
            >
              <span className="pt-season-emoji">{s.emoji}</span>
              <div className="pt-season-name">{s.label}</div>
              <div className="pt-season-meta">{s.meta}</div>
            </button>
          ))}
        </div>

        <div className="pt-trips-grid">
          {shownTrips.length === 0 ? (
            <div style={{ gridColumn: 'span 12', textAlign: 'center', padding: '60px 20px', opacity: .55 }}>
              No {season} trips published yet.
            </div>
          ) : shownTrips.map((t, idx) => {
            const sizeClass = idx === 0 ? 'big' : idx === 1 ? 'sm' : 'third';
            const placeholderIdx = (idx % 3) + 1;
            return (
              <Link
                key={t.id}
                href={t.regions?.slug ? `/${t.regions.slug}/${t.slug}` : '#'}
                className={`pt-trip-card ${sizeClass}`}
              >
                <div className={`media media-placeholder-${placeholderIdx}`}>
                  {t.featured_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.featured_image_url.replace('/upload/', '/upload/c_fill,f_auto,q_auto,w_700,h_525/')}
                      alt={t.featured_image_alt || t.title}
                    />
                  ) : (
                    <>{t.title[0]}</>
                  )}
                </div>
                <div className="body">
                  <h3>{t.title}</h3>
                  <div className="loc">{t.location_text}</div>
                  <div className="tags">
                    {(t.trip_tags || []).slice(0, 3).map(tt => (
                      <span key={tt.tags.slug} className="tag">
                        {tt.tags.emoji} {tt.tags.label}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ============ ACTIVITIES (dark filterable venues) ============ */}
      <section className="pt-activities" id="activities">
        <h2>{sections.activities_title_1 || 'Pick a'} <span className="italic">{sections.activities_title_1_italic || 'vibe'}</span>{sections.activities_title_2 || ', not a destination.'}</h2>
        <p className="intro">{sections.activities_subtitle || 'Filter by what you actually want to do. Works across every region — more venues added every trip.'}</p>

        <div className="pt-filter-chips">
          <FilterChip active={activityFilter === 'all'}      onClick={() => setActivityFilter('all')}      label="✨ Everything" />
          <FilterChip active={activityFilter === 'hiking'}   onClick={() => setActivityFilter('hiking')}   label="🥾 Hiking" />
          <FilterChip active={activityFilter === 'food'}     onClick={() => setActivityFilter('food')}     label="🍜 Food" />
          <FilterChip active={activityFilter === 'culture'}  onClick={() => setActivityFilter('culture')}  label="🎨 Culture" />
          <FilterChip active={activityFilter === 'family'}   onClick={() => setActivityFilter('family')}   label="👨‍👩‍👧 Family" />
          <FilterChip active={activityFilter === 'nightlife'} onClick={() => setActivityFilter('nightlife')} label="🌙 Nightlife" />
          <FilterChip active={activityFilter === 'adventure'} onClick={() => setActivityFilter('adventure')} label="🎢 Adventure" />
        </div>

        <div className="pt-venues">
          {filteredVenues.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', opacity: .6, textAlign: 'center' }}>
              No venues match this filter yet.
            </div>
          ) : filteredVenues.map(v => (
            <Link key={v.id} href={`/venues/${v.id}`} className="pt-venue">
              {v.emoji && <span className="emoji">{v.emoji}</span>}
              <h4>{v.name}</h4>
              <div className="where">{v.location_text}</div>
              <div className="desc">{v.description}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ BLOGS ============ */}
      <section className="pt-blogs" id="blogs">
        <div className="pt-section-label">02 — From the blog</div>
        <div className="pt-blogs-header">
          <h2>Deep dives, <span className="italic">roundups & lists.</span></h2>
          <p style={{ maxWidth: '340px', fontSize: '16px', opacity: .75 }}>
            "Best trails in Ontario" type content — researched, cross-referenced, zero blog fluff.
          </p>
        </div>

        {(!blogs || blogs.length === 0) ? (
          <div className="pt-blogs-empty">
            <p style={{ fontSize: '16px', fontWeight: 600 }}>
              📝 No blog posts yet — they&apos;ll appear here as soon as you publish them from admin.
            </p>
          </div>
        ) : (
          <div className="pt-blogs-grid">
            {blogs.slice(0, 6).map(b => (
              <Link key={b.id} href={`/blog/${b.slug}`} className="pt-blog-card">
                <div className="cover">
                  {b.cover_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.cover_image_url} alt={b.title} />
                  )}
                </div>
                <div className="body">
                  <div className="kicker">{b.kicker || 'Roundup'}</div>
                  <h3>{b.title}</h3>
                  {b.excerpt && <p className="excerpt">{b.excerpt}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="pt-footer">
        <div className="pt-foot-top">
          <div className="pt-foot-brand">
            <Link href="/" className="pt-logo">Pri<span>Trip</span></Link>
            <p>{footer.brand_description || "Honest trip guides from someone who's actually been. Starting in Ontario, going global."}</p>
          </div>
          <div>
            <h5>Explore</h5>
            <ul>
              <li><a href="#world">Destinations</a></li>
              <li><a href="#seasons">Seasons</a></li>
              <li><a href="#activities">Activities</a></li>
              <li><a href="#blogs">Blog</a></li>
            </ul>
          </div>
          <div>
            <h5>Planning</h5>
            <ul>
              <li><a href="#seasons">Weekend trips</a></li>
              <li><a href="#activities">Day hikes</a></li>
              <li><a href="#activities">Food crawls</a></li>
              <li><a href="#activities">Family-friendly</a></li>
            </ul>
          </div>
          {(footer.social_instagram || footer.social_tiktok || footer.social_youtube || footer.social_newsletter) && (
            <div>
              <h5>Follow</h5>
              <ul>
                {footer.social_instagram && <li><a href={footer.social_instagram}>Instagram</a></li>}
                {footer.social_tiktok && <li><a href={footer.social_tiktok}>TikTok</a></li>}
                {footer.social_youtube && <li><a href={footer.social_youtube}>YouTube</a></li>}
                {footer.social_newsletter && <li><a href={footer.social_newsletter}>Newsletter</a></li>}
              </ul>
            </div>
          )}
        </div>
        <div className="pt-foot-bottom">
          <div>{footer.copyright || '© 2026 PriTrip · Made in Ontario'}</div>
          <div>{footer.version_label || 'v0.3'}</div>
        </div>
      </footer>
    </main>
  );
}

function FilterChip({ active, onClick, label }) {
  return (
    <button type="button" className={`pt-chip ${active ? 'active' : ''}`} onClick={onClick}>
      {label}
    </button>
  );
}