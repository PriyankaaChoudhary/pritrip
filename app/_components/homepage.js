'use client';
import Link from 'next/link';


export default function HomePage({ settings, continents, regions, trips }) {
  const hero = settings.hero || {};
  const counter = settings.counter || {};
  const sections = settings.sections || {};
  const footer = settings.footer || {};

  return (
    <main className="min-h-screen bg-[#fef8ed] text-[#0e0e12] overflow-x-hidden" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* ====== NAV ====== */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#fef8ed]/80 border-b-2 border-[#0e0e12]">
        <div className="max-w-[1400px] mx-auto px-7 py-3.5 flex items-center justify-between gap-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-2xl italic" style={{ fontFamily: 'Georgia, serif' }}>
            Pri
            <span
              className="bg-[#ff3b3b] text-[#fef8ed] px-2.5 py-0.5 rounded-full text-lg font-extrabold not-italic"
              style={{ transform: 'rotate(-4deg)', display: 'inline-block', fontFamily: 'system-ui' }}
            >
              Trip
            </span>
          </Link>
          <div className="hidden md:flex gap-7 text-sm font-semibold">
            <a href="#world" className="hover:text-[#ff3b3b] transition">Destinations</a>
            <a href="#seasons" className="hover:text-[#ff3b3b] transition">Seasons</a>
            <a href="#activities" className="hover:text-[#ff3b3b] transition">Activities</a>
            <a href="#stories" className="hover:text-[#ff3b3b] transition">Stories</a>
          </div>
          <a href="#world" className="bg-[#0e0e12] text-[#fef8ed] px-5 py-2 rounded-full font-bold text-sm border-2 border-[#0e0e12] transition hover:-translate-x-0.5 hover:-translate-y-0.5" style={{boxShadow:'none'}}>
            Plan a trip →
          </a>
        </div>
      </nav>

      {/* ====== HERO ====== */}
      <header className="relative max-w-[1400px] mx-auto px-7 pt-20 pb-16">
        {hero.tag && (
          <div className="inline-flex items-center gap-2 bg-[#c7ff3f] border-2 border-[#0e0e12] px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest mb-7" style={{transform:'rotate(-2deg)',boxShadow:'4px 4px 0 #0e0e12'}}>
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff3b3b] animate-pulse"/>
            {hero.tag}
          </div>
        )}
        <h1 className="font-extrabold leading-[0.88] tracking-[-0.04em] mb-7" style={{ fontSize: 'clamp(56px, 11vw, 180px)' }}>
          {hero.title_line_1} <span className="italic font-normal text-[#ff3b3b]" style={{ fontFamily: 'Georgia, serif' }}>{hero.title_line_1_italic}</span><br/>
          {hero.title_line_2}<br/>
          <span className="inline-block bg-[#ffcc3f] border-[3px] border-[#0e0e12] rounded-2xl px-4" style={{transform:'rotate(-3deg)'}}>{hero.title_line_3_sticker}</span>
        </h1>
        {hero.subtitle && (
          <p className="max-w-[640px] mb-8 font-medium" style={{ fontSize: 'clamp(18px, 2vw, 22px)' }}>{hero.subtitle}</p>
        )}

        {/* Counter */}
        <div className="flex flex-wrap gap-8 mb-10 py-5 border-y-2 border-[#0e0e12] max-w-[720px]">
          {[1,2,3,4].map(n => counter[`stat_${n}_number`] ? (
            <div key={n} className="flex flex-col gap-0.5">
              <div className="text-4xl font-extrabold tracking-tight leading-none">{counter[`stat_${n}_number`]}</div>
              <div className="text-[11px] font-mono uppercase tracking-wider opacity-60">{counter[`stat_${n}_label`]}</div>
            </div>
          ) : null)}
        </div>

        <div className="flex gap-4 flex-wrap">
          {hero.cta_primary_label && (
            <a href={hero.cta_primary_href || '#'} className="bg-[#ff3b3b] text-[#fef8ed] px-9 py-4 rounded-full font-bold text-base border-[3px] border-[#0e0e12] inline-flex items-center gap-2.5 transition hover:-translate-x-0.5 hover:-translate-y-0.5" style={{ boxShadow: '6px 6px 0 #0e0e12' }}>
              {hero.cta_primary_label} →
            </a>
          )}
          {hero.cta_secondary_label && (
            <a href={hero.cta_secondary_href || '#'} className="bg-[#fef8ed] text-[#0e0e12] px-9 py-4 rounded-full font-bold text-base border-[3px] border-[#0e0e12] hover:bg-[#0e0e12] hover:text-[#fef8ed] transition">
              {hero.cta_secondary_label}
            </a>
          )}
        </div>

        {/* Floating stickers — hidden on mobile */}
        <Floater text={hero.floater_1} color="#7cc7ff" className="top-[110px] right-[8%]" rotate="6deg" delay="0s"/>
        <Floater text={hero.floater_2} color="#ffcfe6" className="top-[260px] right-[22%]" rotate="-8deg" delay=".8s"/>
        <Floater text={hero.floater_3} color="#c7ff3f" className="bottom-[80px] right-[4%]" rotate="4deg" delay="1.4s"/>
      </header>

      {/* ====== DESTINATIONS (stub) ====== */}
      <section id="world" className="max-w-[1400px] mx-auto px-7 py-14">
        {sections.world_eyebrow && (
          <div className="flex items-center gap-3.5 mb-5 font-mono text-xs uppercase tracking-[2px] font-semibold">
            <span className="w-10 h-0.5 bg-[#0e0e12]"/> {sections.world_eyebrow}
          </div>
        )}
        <h2 className="font-extrabold tracking-tight leading-[0.95] mb-6" style={{fontSize:'clamp(40px,6vw,80px)'}}>
          {sections.world_title_1}<br/>
          {sections.world_title_2} <span className="italic font-normal text-[#6f47ff]" style={{fontFamily:'Georgia, serif'}}>{sections.world_title_2_italic}</span>
        </h2>
        {sections.world_subtitle && (
          <p className="max-w-md opacity-70 mb-10">{sections.world_subtitle}</p>
        )}
        <div className="bg-[#f7ead1] border-[3px] border-[#0e0e12] rounded-3xl p-8 text-center" style={{boxShadow:'10px 10px 0 #0e0e12'}}>
          <div className="text-sm font-mono uppercase tracking-[2px] opacity-60 mb-3">Regions live</div>
          <div className="flex gap-3 flex-wrap justify-center">
            {regions.length === 0 && <span className="opacity-50">No live regions yet</span>}
            {regions.map(r => (
              <span key={r.id} className="bg-[#c7ff3f] border-2 border-[#0e0e12] px-4 py-2 rounded-full font-bold">
                {r.flag_emoji} {r.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ====== TRIPS (minimal preview) ====== */}
      <section id="seasons" className="max-w-[1400px] mx-auto px-7 py-14">
        <h2 className="font-extrabold tracking-tight leading-none mb-10" style={{fontSize:'clamp(32px,4.5vw,56px)'}}>
          {sections.seasons_title} <span className="italic font-normal text-[#ff3b3b]" style={{fontFamily:'Georgia, serif'}}>{sections.seasons_title_italic}</span>
        </h2>
        {trips.length === 0 ? (
          <div className="opacity-50 text-center py-12">No published trips yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {trips.map(t => (
              <Link
  key={t.id}
  href={t.regions?.slug ? `/${t.regions.slug}/${t.slug}` : '#'}
  className="group border-[3px] border-[#0e0e12] rounded-3xl overflow-hidden bg-white transition-transform hover:-translate-y-1.5 block"
>
  <div className="aspect-[4/3] relative overflow-hidden">
    {t.featured_image_url ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={t.featured_image_url.replace('/upload/', '/upload/c_fill,f_auto,q_auto,w_600,h_450/')}
        alt={t.featured_image_alt || t.title}
        className="absolute inset-0 w-full h-full object-cover"
      />
    ) : (
      <div className="absolute inset-0 bg-gradient-to-br from-[#1e90ff] via-[#7cc7ff] to-[#c7ff3f] flex items-center justify-center text-white italic text-lg" style={{fontFamily:'Georgia, serif'}}>
        {t.title[0]}
      </div>
    )}
  </div>
  <div className="p-5">
    <h3 className="font-extrabold text-xl mb-1.5 tracking-tight group-hover:text-[#ff3b3b] transition">{t.title}</h3>
    <div className="font-mono text-xs uppercase opacity-60 mb-3">{t.location_text}</div>
    <div className="flex gap-1.5 flex-wrap">
      {t.trip_seasons?.map(ts => (
        <span key={ts.season} className="text-xs font-semibold px-2.5 py-1 border-[1.5px] border-[#0e0e12] rounded-full">
          {ts.season}
        </span>
      ))}
      {t.trip_tags?.slice(0,3).map(tt => (
        <span key={tt.tags.slug} className="text-xs font-semibold px-2.5 py-1 bg-[#c7ff3f] border-[1.5px] border-[#0e0e12] rounded-full">
          {tt.tags.emoji} {tt.tags.label}
        </span>
      ))}
    </div>
  </div>
</Link>
            ))}
          </div>
        )}
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="border-t-2 border-[#0e0e12] max-w-[1400px] mx-auto px-7 py-12 mt-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-2xl italic mb-3" style={{fontFamily:'Georgia, serif'}}>
              Pri<span className="bg-[#ff3b3b] text-[#fef8ed] px-2 py-0.5 rounded-full text-lg font-extrabold not-italic" style={{transform:'rotate(-4deg)',display:'inline-block',fontFamily:'system-ui'}}>Trip</span>
            </div>
            <p className="text-sm opacity-70 max-w-[300px]">{footer.brand_description}</p>
          </div>
          {footer.social_instagram || footer.social_tiktok || footer.social_youtube || footer.social_newsletter ? (
            <div className="md:col-start-4">
              <h5 className="font-mono text-xs uppercase tracking-[2px] mb-3.5">Follow</h5>
              <ul className="space-y-2 text-sm font-medium">
                {footer.social_instagram && <li><a href={footer.social_instagram} className="hover:text-[#ff3b3b]">Instagram</a></li>}
                {footer.social_tiktok && <li><a href={footer.social_tiktok} className="hover:text-[#ff3b3b]">TikTok</a></li>}
                {footer.social_youtube && <li><a href={footer.social_youtube} className="hover:text-[#ff3b3b]">YouTube</a></li>}
                {footer.social_newsletter && <li><a href={footer.social_newsletter} className="hover:text-[#ff3b3b]">Newsletter</a></li>}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="border-t border-black/10 pt-5 flex justify-between flex-wrap gap-2.5 font-mono text-[11px] opacity-60">
          <span>{footer.copyright}</span>
          <span>{footer.version_label}</span>
        </div>
      </footer>
    </main>
  );
}

function Floater({ text, color, className, rotate, delay }) {
  if (!text) return null;
  return (
    <div
      className={`hidden lg:block absolute border-[3px] border-[#0e0e12] rounded-[20px] px-5 py-3 font-bold text-sm pointer-events-none ${className}`}
      style={{
        background: color,
        boxShadow: '5px 5px 0 #0e0e12',
        transform: `rotate(${rotate})`,
        animation: `pritrip-bob 4s ease-in-out infinite`,
        animationDelay: delay,
      }}
    >
      {text}
      <style jsx>{`
        @keyframes pritrip-bob {
          0%, 100% { transform: translateY(0) rotate(${rotate}); }
          50% { transform: translateY(-12px) rotate(${rotate}); }
        }
      `}</style>
    </div>
  );
}