import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import {
  MapPin, Globe2, Film, Compass, Tag, Image as ImageIcon,
  Plus, ArrowRight, Sparkles, TrendingUp, AlertCircle
} from 'lucide-react';

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('display_name, role')
    .eq('user_id', user.id)
    .maybeSingle();

  const [
    { count: tripsTotal },
    { count: tripsPublished },
    { count: tripsDraft },
    { count: regionsTotal },
    { count: regionsLive },
    { count: storiesTotal },
    { count: venuesTotal },
    { count: tagsTotal },
    { count: mediaTotal },
    { data: recentTrips },
  ] = await Promise.all([
    supabase.from('trips').select('*', { count: 'exact', head: true }),
    supabase.from('trips').select('*', { count: 'exact', head: true }).eq('status','published'),
    supabase.from('trips').select('*', { count: 'exact', head: true }).eq('status','draft'),
    supabase.from('regions').select('*', { count: 'exact', head: true }),
    supabase.from('regions').select('*', { count: 'exact', head: true }).eq('is_live', true),
    supabase.from('stories').select('*', { count: 'exact', head: true }),
    supabase.from('venues').select('*', { count: 'exact', head: true }),
    supabase.from('tags').select('*', { count: 'exact', head: true }),
    supabase.from('uploads').select('*', { count: 'exact', head: true }),
    supabase.from('trips').select('id, title, status, updated_at, regions(flag_emoji, name)').order('updated_at', { ascending: false }).limit(5),
  ]);

  const name = adminRow?.display_name || user.email.split('@')[0];

  return (
    <div>
      <div className="mb-8">
        <div className="inline-block text-[10px] font-mono uppercase tracking-[2px] text-muted mb-2">
          Signed in as {user.email}
        </div>
        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-2 text-ink">
          Hey <span className="text-lime">{name}</span>.
        </h1>
        <p className="text-base text-secondary">
          Here's what PriTrip looks like right now.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard icon={MapPin}  label="Trips"   total={tripsTotal}   accent="var(--accent-lime)"   sub={`${tripsPublished} live · ${tripsDraft} drafts`} />
        <StatCard icon={Globe2}  label="Regions" total={regionsTotal} accent="var(--accent-sky)"    sub={`${regionsLive} live`} />
        <StatCard icon={Film}    label="Stories" total={storiesTotal} accent="var(--accent-cherry)" sub="vertical videos" />
        <StatCard icon={Compass} label="Venues"  total={venuesTotal}  accent="var(--accent-sun)"    sub="activity spots" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-10">
        <QuickAction
          href="/admin/homepage"
          title="Edit the homepage"
          description="Change every heading, sticker, and counter on the public site."
          icon={Sparkles}
          tone="cherry"
        />
        <QuickAction
          href="/admin/trips/new"
          title="Add a new trip"
          description="Drop photos, videos, and notes from your latest travel."
          icon={Plus}
          tone="lime"
        />
        <QuickAction
          href="/admin/regions"
          title="Open a new region"
          description="Go global — add Japan, Iceland, anywhere next on your list."
          icon={Globe2}
          tone="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-raised border-2 border-subtle rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[2px] text-muted mb-1">
                Recent activity
              </div>
              <h2 className="text-xl font-extrabold text-ink">Last 5 trips edited</h2>
            </div>
            <Link
              href="/admin/trips"
              className="text-xs font-mono uppercase tracking-wider px-3 py-1.5 border border-default rounded-full hover:border-lime hover:text-lime transition flex items-center gap-1.5 text-ink"
            >
              View all <ArrowRight size={12}/>
            </Link>
          </div>

          {recentTrips && recentTrips.length > 0 ? (
            <ul className="divide-y divide-subtle">
              {recentTrips.map(t => (
                <li key={t.id}>
                  <Link
                    href={`/admin/trips/${t.id}`}
                    className="py-3 flex items-center gap-4 hover:bg-hover -mx-3 px-3 rounded-xl transition"
                  >
                    <div className="w-9 h-9 rounded-lg bg-base border border-default flex items-center justify-center text-sm">
                      {t.regions?.flag_emoji || '📍'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate text-ink">{t.title}</div>
                      <div className="text-xs text-muted font-mono">
                        {t.regions?.name || 'no region'} · updated {formatTime(t.updated_at)}
                      </div>
                    </div>
                    <StatusBadge status={t.status} />
                    <ArrowRight size={14} className="text-faint"/>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No trips yet"
              body="Add your first trip to see it appear here."
              cta={{ href: '/admin/trips/new', label: 'Create trip' }}
            />
          )}
        </div>

        <div className="bg-raised border-2 border-subtle rounded-3xl p-6">
          <div className="mb-5">
            <div className="text-[10px] font-mono uppercase tracking-[2px] text-muted mb-1">
              Taxonomy
            </div>
            <h2 className="text-xl font-extrabold text-ink">Content library</h2>
          </div>

          <ul className="space-y-3">
            <MiniStat icon={Tag}       label="Tags"  value={tagsTotal}  />
            <MiniStat icon={ImageIcon} label="Media" value={mediaTotal} />
          </ul>

          <div className="mt-6 pt-6 border-t-2 border-subtle">
            <div className="text-[10px] font-mono uppercase tracking-[2px] text-muted mb-2 flex items-center gap-1.5">
              <TrendingUp size={10}/> Growth tip
            </div>
            <p className="text-sm text-secondary leading-relaxed">
              Aim for <strong className="text-lime">3 published trips per region</strong> before launching it. Google rewards depth over breadth.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-subtle flex flex-wrap gap-4 text-[11px] font-mono uppercase tracking-wider text-faint">
        <span>pritrip admin v0.1</span>
        <span>·</span>
        <span>you are {adminRow?.role || 'signed in'}</span>
        <span>·</span>
        <span>env: local</span>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, total, sub, accent }) {
  return (
    <div className="bg-raised border-2 border-subtle rounded-2xl p-5 hover:border-default transition">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${accent} 15%, transparent)`, color: accent }}
        >
          <Icon size={18}/>
        </div>
      </div>
      <div className="text-3xl font-extrabold tracking-tight leading-none mb-1.5 text-ink">
        {total ?? 0}
      </div>
      <div className="text-sm font-semibold text-ink">{label}</div>
      {sub && <div className="text-[11px] font-mono text-muted mt-1">{sub}</div>}
    </div>
  );
}

function QuickAction({ href, title, description, icon: Icon, tone }) {
  const toneStyles = {
    cherry:  'bg-cherry text-white',
    lime:    'bg-lime text-inverse-text',
    neutral: 'bg-raised text-ink border-2 border-subtle hover:border-default',
  };
  return (
    <Link
      href={href}
      className={`group p-6 rounded-2xl transition relative overflow-hidden ${toneStyles[tone]}`}
    >
      <Icon size={22} className="mb-4" />
      <div className="font-extrabold text-lg mb-1">{title}</div>
      <p className="text-sm opacity-80 leading-snug pr-6">{description}</p>
      <ArrowRight size={18} className="absolute bottom-5 right-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition"/>
    </Link>
  );
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <li className="flex items-center gap-3 py-1">
      <Icon size={14} className="text-muted"/>
      <span className="text-sm text-secondary flex-1">{label}</span>
      <span className="font-mono text-sm font-bold text-ink">{value ?? 0}</span>
    </li>
  );
}

function StatusBadge({ status }) {
  const styles = {
    published: 'bg-success-soft text-success',
    draft:     'bg-hover text-muted',
    scheduled: 'bg-lime-soft text-lime',
    archived:  'bg-danger-soft text-danger',
  };
  return (
    <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
}

function EmptyState({ title, body, cta }) {
  return (
    <div className="py-8 text-center">
      <AlertCircle size={24} className="mx-auto text-faint mb-3"/>
      <div className="font-semibold mb-1 text-ink">{title}</div>
      <p className="text-sm text-muted mb-4">{body}</p>
      {cta && (
        <Link
          href={cta.href}
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider px-4 py-2 bg-lime text-inverse-text rounded-full font-bold"
        >
          <Plus size={12}/> {cta.label}
        </Link>
      )}
    </div>
  );
}

function formatTime(ts) {
  if (!ts) return 'unknown';
  const d = new Date(ts);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}