'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Filter, MapPin, ExternalLink, Edit3, Trash2,
  Star, ArrowUpDown, X as XIcon
} from 'lucide-react';
import { PageHeader, Button, StatusPill, EmptyState } from '../_components/ui';
import { ConfirmDialog } from '../_components/confirm-dialog';
import { useToast } from '../_components/toast';
import { deleteTripAction } from './actions';

const SEASONS = ['summer','fall','winter','spring'];

export default function TripsList({ initialTrips, regions }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [trips, setTrips] = useState(initialTrips);
  const [query, setQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [seasonFilter, setSeasonFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated');
  const [confirm, setConfirm] = useState(null);

  const filtered = useMemo(() => {
    let out = trips;
    const q = query.trim().toLowerCase();
    if (q) {
      out = out.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        (t.location_text || '').toLowerCase().includes(q)
      );
    }
    if (regionFilter !== 'all') {
      out = out.filter(t => t.regions?.slug === regionFilter);
    }
    if (seasonFilter !== 'all') {
      out = out.filter(t => t.trip_seasons?.some(s => s.season === seasonFilter));
    }
    if (statusFilter !== 'all') {
      out = out.filter(t => t.status === statusFilter);
    }
    out = [...out].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return new Date(b.updated_at) - new Date(a.updated_at);
    });
    return out;
  }, [trips, query, regionFilter, seasonFilter, statusFilter, sortBy]);

  const counts = useMemo(() => ({
    all:       trips.length,
    published: trips.filter(t => t.status === 'published').length,
    draft:     trips.filter(t => t.status === 'draft').length,
    scheduled: trips.filter(t => t.status === 'scheduled').length,
    archived:  trips.filter(t => t.status === 'archived').length,
  }), [trips]);

  function clearFilters() {
    setQuery(''); setRegionFilter('all'); setSeasonFilter('all'); setStatusFilter('all');
  }

  const hasFilters = query || regionFilter !== 'all' || seasonFilter !== 'all' || statusFilter !== 'all';

  async function handleDelete(trip) {
    startTransition(async () => {
      const res = await deleteTripAction(trip.id);
      if (res.ok) {
        setTrips(cur => cur.filter(t => t.id !== trip.id));
        setConfirm(null);
        toast({ kind: 'ok', text: `Deleted "${trip.title}"` });
      } else {
        toast({ kind: 'err', text: res.error || 'Delete failed' });
      }
    });
  }

  return (
    <div>
      <PageHeader
        title="Trips"
        description="Every trip card on PriTrip. Add new ones, edit old ones, and publish when ready."
        actions={
          <>
            <Button variant="ghost" size="md" href="/">
              <ExternalLink size={13}/> View site
            </Button>
            <Button variant="primary" size="lg" href="/admin/trips/new">
              <Plus size={15}/> New trip
            </Button>
          </>
        }
      />

      <div className="flex gap-1 mb-5 flex-wrap">
        <StatusTab label="All" count={counts.all} active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
        <StatusTab label="Published" count={counts.published} active={statusFilter === 'published'} onClick={() => setStatusFilter('published')} accent="success" />
        <StatusTab label="Drafts" count={counts.draft} active={statusFilter === 'draft'} onClick={() => setStatusFilter('draft')} />
        <StatusTab label="Scheduled" count={counts.scheduled} active={statusFilter === 'scheduled'} onClick={() => setStatusFilter('scheduled')} accent="lime" />
        {counts.archived > 0 && (
          <StatusTab label="Archived" count={counts.archived} active={statusFilter === 'archived'} onClick={() => setStatusFilter('archived')} />
        )}
      </div>

      <div className="bg-raised border-2 border-subtle rounded-2xl p-3 mb-5 flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-base border border-default rounded-xl px-3 py-2">
          <Search size={14} className="text-muted"/>
          <input
            type="text"
            placeholder="Search by title, slug, location…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-ink placeholder:text-faint"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-muted hover:text-ink">
              <XIcon size={13} />
            </button>
          )}
        </div>

        <FilterDropdown
          label="Region"
          value={regionFilter}
          onChange={setRegionFilter}
          options={[{ value: 'all', label: 'All regions' }, ...regions.map(r => ({ value: r.slug, label: `${r.flag_emoji || '📍'} ${r.name}` }))]}
        />
        <FilterDropdown
          label="Season"
          value={seasonFilter}
          onChange={setSeasonFilter}
          options={[{ value: 'all', label: 'Any season' }, ...SEASONS.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))]}
        />
        <FilterDropdown
          label="Sort"
          value={sortBy}
          onChange={setSortBy}
          icon={ArrowUpDown}
          options={[
            { value: 'updated', label: 'Last updated' },
            { value: 'title', label: 'Title A-Z' },
          ]}
        />

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs font-mono uppercase tracking-wider px-3 py-2 border border-default rounded-full hover:border-cherry hover:text-cherry text-ink transition flex items-center gap-1"
          >
            <XIcon size={11} /> Clear
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mb-3 px-1">
        <div className="text-xs font-mono text-muted">
          {filtered.length} of {trips.length} trips
        </div>
      </div>

      {filtered.length === 0 ? (
        trips.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No trips yet"
            body="Add your first trip to start showing up on Google. Every trip is a chance to rank."
            cta={<Button variant="primary" size="lg" href="/admin/trips/new"><Plus size={15}/> Create first trip</Button>}
          />
        ) : (
          <EmptyState
            icon={Filter}
            title="No trips match your filters"
            body="Try clearing a filter or adjusting your search."
            cta={<Button variant="ghost" onClick={clearFilters}><XIcon size={13}/> Clear filters</Button>}
          />
        )
      ) : (
        <div className="bg-raised border-2 border-subtle rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-3 bg-hover border-b border-subtle text-[10px] font-mono uppercase tracking-[1.5px] text-muted">
            <div>Trip</div>
            <div>Region</div>
            <div>Seasons</div>
            <div>Tags</div>
            <div>Status</div>
            <div className="w-20 text-right">Actions</div>
          </div>

          <ul className="divide-y divide-subtle">
            {filtered.map(trip => (
              <li
                key={trip.id}
                className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto_auto_auto] gap-2 md:gap-4 px-5 py-4 hover:bg-hover transition items-center"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/trips/${trip.id}`}
                    className="group flex items-center gap-2"
                  >
                    {trip.is_featured && (
                      <Star size={12} className="text-sun fill-sun shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-ink truncate group-hover:text-lime transition flex items-center gap-1.5">
                        {trip.title}
                      </div>
                      <div className="text-xs text-muted font-mono truncate">
                        /{trip.regions?.slug || 'no-region'}/{trip.slug}
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="hidden md:block text-sm text-secondary whitespace-nowrap">
                  {trip.regions ? (
                    <span className="flex items-center gap-1">
                      <span>{trip.regions.flag_emoji}</span>
                      <span>{trip.regions.name}</span>
                    </span>
                  ) : (
                    <span className="text-faint italic">none</span>
                  )}
                </div>

                <div className="hidden md:flex gap-1 flex-wrap max-w-[160px]">
                  {trip.trip_seasons?.length > 0 ? (
                    trip.trip_seasons.map(s => (
                      <SeasonChip key={s.season} season={s.season} />
                    ))
                  ) : (
                    <span className="text-xs text-faint font-mono">—</span>
                  )}
                </div>

                <div className="hidden md:flex gap-1 flex-wrap max-w-[180px]">
                  {trip.trip_tags?.length > 0 ? (
                    <>
                      {trip.trip_tags.slice(0, 2).map(tt => (
                        <span
                          key={tt.tags.slug}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-hover border border-subtle text-secondary whitespace-nowrap"
                        >
                          {tt.tags.emoji} {tt.tags.label}
                        </span>
                      ))}
                      {trip.trip_tags.length > 2 && (
                        <span className="text-[10px] font-mono text-muted">+{trip.trip_tags.length - 2}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-faint font-mono">—</span>
                  )}
                </div>

                <div>
                  <StatusPill status={trip.status} />
                </div>

                <div className="flex gap-1 justify-end">
                  {trip.status === 'published' && (
                    <a
                      href={`/${trip.regions?.slug}/${trip.slug}`}
                      target="_blank"
                      className="p-2 rounded-lg text-muted hover:text-ink hover:bg-base transition"
                      title="View live"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <Link
                    href={`/admin/trips/${trip.id}`}
                    className="p-2 rounded-lg text-muted hover:text-lime hover:bg-base transition"
                    title="Edit"
                  >
                    <Edit3 size={14} />
                  </Link>
                  <button
                    onClick={() => setConfirm({ trip })}
                    className="p-2 rounded-lg text-muted hover:text-cherry hover:bg-base transition"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={`Delete "${confirm?.trip.title}"?`}
        description="This removes the trip and all its seasons, tags, and photo references. This cannot be undone."
        confirmLabel="Delete trip"
        cancelLabel="Keep it"
        danger
        loading={isPending}
        onConfirm={() => confirm && handleDelete(confirm.trip)}
        onCancel={() => !isPending && setConfirm(null)}
      />
    </div>
  );
}

function StatusTab({ label, count, active, onClick, accent }) {
  const accentRing = accent === 'success' ? 'text-success' : accent === 'lime' ? 'text-lime' : 'text-ink';
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-full text-sm font-semibold transition flex items-center gap-2
        ${active
          ? 'bg-inverse-bg text-inverse-text'
          : `bg-raised border border-subtle hover:border-default ${accentRing}`}
      `}
    >
      {label}
      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${active ? 'bg-inverse-text/15' : 'bg-base'}`}>
        {count}
      </span>
    </button>
  );
}

function FilterDropdown({ label, value, onChange, options, icon: Icon = Filter }) {
  return (
    <div className="relative flex items-center gap-1 bg-base border border-default rounded-xl px-3 py-2">
      <Icon size={12} className="text-muted"/>
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted">{label}:</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-transparent text-sm text-ink outline-none appearance-none pr-4 cursor-pointer"
        style={{ backgroundImage: 'none' }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-raised text-ink">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SeasonChip({ season }) {
  const styles = {
    summer: 'bg-sun/20 text-sun',
    fall:   'bg-cherry/15 text-cherry',
    winter: 'bg-sky/20 text-sky',
    spring: 'bg-plum/15 text-plum',
  };
  const emoji = { summer: '☀️', fall: '🍂', winter: '❄️', spring: '🌸' }[season];
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${styles[season]}`}>
      {emoji} {season}
    </span>
  );
}