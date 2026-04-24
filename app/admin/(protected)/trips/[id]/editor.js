'use client';
import { PhotoGallery } from '../../_components/photo-gallery';

import { useState, useCallback, useMemo, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Save, ExternalLink, Trash2, Lock, Unlock, Star,
  Image as ImageIcon, AlertCircle, CheckCircle2, X, Info
} from 'lucide-react';
import { Field, TextInput, TextArea, Section, TwoCol } from '../../_components/fields';
import { Button, StatusPill } from '../../_components/ui';
import { ConfirmDialog } from '../../_components/confirm-dialog';
import { useToast } from '../../_components/toast';
import { RichEditor } from '../../_components/rich-editor';
import { slugify } from '@/lib/slugify';
import { saveTripAction, deleteTripAction, checkSlugAvailable } from '../actions';

const SEASONS = [
  { value: 'summer', label: 'Summer', emoji: '☀️' },
  { value: 'fall',   label: 'Fall',   emoji: '🍂' },
  { value: 'winter', label: 'Winter', emoji: '❄️' },
  { value: 'spring', label: 'Spring', emoji: '🌸' },
];

const CARD_SIZES = [
  { value: 'big',   label: 'Big',   width: 'w-full',  description: '7/12 cols · use for hero trips' },
  { value: 'sm',    label: 'Small', width: 'w-3/5',   description: '5/12 cols · standard' },
  { value: 'third', label: 'Third', width: 'w-2/5',   description: '4/12 cols · grid fillers' },
];

export default function TripEditor({ initial, regions, allTags, mode,  photos = [] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [trip, setTrip] = useState(initial);
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.parse(JSON.stringify(initial)));
  const [slugLocked, setSlugLocked] = useState(mode === 'edit'); // locked by default when editing
  const [slugStatus, setSlugStatus] = useState(null); // null | 'checking' | 'ok' | 'taken'
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(null); // href to navigate to

  const setField = useCallback((field, value) => {
    setTrip(prev => ({ ...prev, [field]: value }));
  }, []);

  // Dirty check
  const dirty = useMemo(
    () => JSON.stringify(trip) !== JSON.stringify(savedSnapshot),
    [trip, savedSnapshot]
  );

  // ============ Auto-slug from title ============
  useEffect(() => {
    if (slugLocked) return;
    const auto = slugify(trip.title);
    if (auto !== trip.slug) {
      setTrip(prev => ({ ...prev, slug: auto }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.title, slugLocked]);

  // ============ Slug uniqueness check (debounced) ============
  const slugCheckRef = useRef();
  useEffect(() => {
    if (!trip.slug || !trip.region_id) { setSlugStatus(null); return; }
    setSlugStatus('checking');
    clearTimeout(slugCheckRef.current);
    slugCheckRef.current = setTimeout(async () => {
      const res = await checkSlugAvailable({
        slug: trip.slug,
        regionId: trip.region_id,
        excludeId: trip.id,
      });
      if (!res.ok) { setSlugStatus(null); return; }
      setSlugStatus(res.available ? 'ok' : 'taken');
    }, 400);
    return () => clearTimeout(slugCheckRef.current);
  }, [trip.slug, trip.region_id, trip.id]);

  // ============ Meta description char counter ============
  const metaDescLen = (trip.meta_description || '').length;

  // ============ Warn on unsaved nav ============
  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(e) {
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  // ============ Save ============
  async function handleSave(afterStatus) {
    const payload = {
      ...trip,
      status: afterStatus || trip.status,
    };

    startTransition(async () => {
      const res = await saveTripAction(payload);
      if (!res.ok) {
        toast({ kind: 'err', text: res.error });
        return;
      }
      const updated = { ...trip, status: payload.status, id: res.id, slug: res.slug };
      setTrip(updated);
      setSavedSnapshot(JSON.parse(JSON.stringify(updated)));

      toast({
        kind: 'ok',
        text: mode === 'create' ? 'Trip created · opening editor' : 'Changes saved · site updated',
      });

      if (mode === 'create') {
        // Switch to the real trip URL so refreshes work
        router.replace(`/admin/trips/${res.id}`);
      }
    });
  }

  async function handleDelete() {
    startTransition(async () => {
      const res = await deleteTripAction(trip.id);
      if (!res.ok) {
        toast({ kind: 'err', text: res.error });
        return;
      }
      toast({ kind: 'ok', text: `Deleted "${trip.title}"` });
      router.push('/admin/trips');
    });
  }

  function handleBack() {
    if (dirty) {
      setConfirmLeave('/admin/trips');
    } else {
      router.push('/admin/trips');
    }
  }

  const selectedRegion = regions.find(r => r.id === trip.region_id);
  const publicHref = trip.status === 'published' && selectedRegion
    ? `/${selectedRegion.slug}/${trip.slug}`
    : null;

  // Group tags by category for nicer UI
  const tagsByCategory = useMemo(() => {
    const g = {};
    for (const t of allTags) {
      const c = t.category || 'other';
      if (!g[c]) g[c] = [];
      g[c].push(t);
    }
    return g;
  }, [allTags]);

  function toggleTag(id) {
    setTrip(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(id)
        ? prev.tag_ids.filter(x => x !== id)
        : [...prev.tag_ids, id],
    }));
  }

  function toggleSeason(season) {
    setTrip(prev => ({
      ...prev,
      seasons: prev.seasons.includes(season)
        ? prev.seasons.filter(x => x !== season)
        : [...prev.seasons, season],
    }));
  }

  return (
    <div className="pb-32">
      {/* ============ TOP NAV STRIP ============ */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <button
          onClick={handleBack}
          className="text-xs font-mono uppercase tracking-wider text-muted hover:text-ink transition flex items-center gap-1.5"
        >
          <ArrowLeft size={12} /> All trips
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusPill status={trip.status} />
          {publicHref && (
            <a
              href={publicHref}
              target="_blank"
              className="text-xs font-mono uppercase tracking-wider px-3 py-1.5 border border-default rounded-full hover:border-lime hover:text-lime transition text-ink inline-flex items-center gap-1.5"
            >
              <ExternalLink size={12}/> View live
            </a>
          )}
          {mode === 'edit' && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs font-mono uppercase tracking-wider px-3 py-1.5 border border-default rounded-full hover:border-cherry hover:text-cherry transition text-ink inline-flex items-center gap-1.5"
            >
              <Trash2 size={12}/> Delete
            </button>
          )}
        </div>
      </div>

      {/* ============ TITLE ============ */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Trip title…"
          value={trip.title}
          onChange={e => setField('title', e.target.value)}
          className="w-full bg-transparent border-none outline-none text-4xl lg:text-5xl font-extrabold tracking-tight text-ink placeholder:text-faint"
        />
        <input
          type="text"
          placeholder="Optional subtitle…"
          value={trip.subtitle}
          onChange={e => setField('subtitle', e.target.value)}
          className="w-full bg-transparent border-none outline-none text-lg text-secondary placeholder:text-faint mt-1"
        />
      </div>

      {/* ============ MAIN GRID ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

        {/* ==== LEFT COLUMN: body + content ==== */}
        <div className="space-y-5 min-w-0">

          {/* Body editor */}
          <Section
            title="The trip guide"
            description="The main article visitors will read. Use H2 for section headings, H3 for sub-sections. Write like you're texting a friend."
            accent="lime"
          >
            <RichEditor
              value={trip.body}
              onChange={v => setField('body', v)}
            />
          </Section>

          {/* Practical info */}
          <Section
            title="Practical info"
            description="Shown as a side panel on the trip page."
          >
            <TwoCol>
              <Field label="Location" hint="Short travel description (e.g. '3h from Toronto')">
                <TextInput value={trip.location_text} onChange={v => setField('location_text', v)} placeholder="3h from Toronto" />
              </Field>
              <Field label="Best time" hint="When should people go?">
                <TextInput value={trip.best_time} onChange={v => setField('best_time', v)} placeholder="Mid-October for peak colours" />
              </Field>
            </TwoCol>
            <TwoCol>
              <Field label="Cost estimate">
                <TextInput value={trip.cost_estimate} onChange={v => setField('cost_estimate', v)} placeholder="$200 / couple / weekend" />
              </Field>
              <Field label="Difficulty">
                <TextInput value={trip.difficulty} onChange={v => setField('difficulty', v)} placeholder="Easy day trip" />
              </Field>
            </TwoCol>
            <TwoCol>
              <Field label="Latitude" hint="Decimal degrees (for map pin)">
                <TextInput value={trip.latitude} onChange={v => setField('latitude', v)} placeholder="45.8" />
              </Field>
              <Field label="Longitude">
                <TextInput value={trip.longitude} onChange={v => setField('longitude', v)} placeholder="-78.5" />
              </Field>
            </TwoCol>
          </Section>
          <Section
  title="Content source"
  description="Be honest with visitors about where this info comes from. It builds trust."
  accent="lime"
>
  <Field label="How was this guide compiled?">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {[
        { value: 'visited',    label: '✓ Visited in person',  hint: 'Photos, direct experience, first-hand notes' },
        { value: 'researched', label: '🔍 Researched',         hint: 'Cross-referenced sources, not personally visited' },
        { value: 'community',  label: '💬 Community-sourced',  hint: 'Mostly from visitor submissions' },
        { value: 'mixed',      label: '✦ Mixed sources',       hint: 'Combination of research + visits + community' },
      ].map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setField('content_source', opt.value)}
          className={`
            p-3 rounded-xl border-2 transition text-left
            ${trip.content_source === opt.value
              ? 'bg-lime-soft border-lime text-ink'
              : 'bg-base border-default text-secondary hover:border-strong'}
          `}
        >
          <div className="text-sm font-bold mb-0.5">{opt.label}</div>
          <div className="text-[11px] text-muted leading-snug">{opt.hint}</div>
        </button>
      ))}
    </div>
  </Field>

  <Field label="Last verified" hint="When was this info last checked? Visitors see this to gauge freshness.">
    <input
      type="datetime-local"
      value={trip.last_verified_at ? new Date(trip.last_verified_at).toISOString().slice(0, 16) : ''}
      onChange={e => setField('last_verified_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
      className="w-full bg-base border-2 border-default focus:border-lime rounded-xl px-4 py-2.5 text-sm outline-none transition text-ink"
    />
  </Field>

  <Field label="Attribution note" hint="Optional: e.g. 'Updated by 3 visitors in Oct 2025' or 'Park websites cross-referenced Dec 2025'">
    <TextInput
      value={trip.contributor_notes}
      onChange={v => setField('contributor_notes', v)}
      placeholder="Free-text credit or update history"
    />
  </Field>
</Section>

          {/* SEO */}
          <Section
            title="SEO & search"
            description="How this trip appears in Google and when shared on social."
            accent="sky"
          >
            <Field label="Meta title" hint="Google headline · best under 60 characters. Leave blank to use trip title.">
              <TextInput value={trip.meta_title} onChange={v => setField('meta_title', v)} placeholder={trip.title || 'e.g. Grotto at Tobermory: 2026 Guide'} />
            </Field>
            <Field label="Meta description" hint={`${metaDescLen} / 160 characters`}>
              <TextArea rows={2} value={trip.meta_description} onChange={v => setField('meta_description', v)} placeholder="Concise summary that appears below the link on Google." />
            </Field>
          </Section>
        </div>

        {/* ==== RIGHT COLUMN: sidebar ==== */}
        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">

          {/* Region + slug */}
          <Section title="Location & URL">
            <Field label="Region *" hint="Which region does this trip belong to?">
              <select
                value={trip.region_id || ''}
                onChange={e => setField('region_id', e.target.value || null)}
                className="w-full bg-base border-2 border-default focus:border-lime rounded-xl px-4 py-2.5 text-sm outline-none transition text-ink"
              >
                <option value="">Select a region…</option>
                {regions.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.flag_emoji} {r.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="URL slug" hint={`Full URL: /${selectedRegion?.slug || '…'}/${trip.slug || '…'}`}>
              <div className="flex gap-2">
                <input
                  value={trip.slug}
                  onChange={e => setField('slug', slugify(e.target.value))}
                  disabled={!slugLocked}
                  className={`
                    flex-1 bg-base border-2 rounded-xl px-4 py-2.5 text-sm outline-none transition font-mono
                    ${slugStatus === 'taken' ? 'border-cherry text-cherry' : 'border-default focus:border-lime text-ink'}
                    disabled:opacity-70
                  `}
                  placeholder="auto-from-title"
                />
                <button
                  type="button"
                  onClick={() => setSlugLocked(v => !v)}
                  className={`w-10 rounded-xl border-2 transition flex items-center justify-center ${slugLocked ? 'bg-lime border-lime text-inverse-text' : 'bg-base border-default text-muted hover:text-ink'}`}
                  title={slugLocked ? 'Manual (click to auto)' : 'Auto from title (click to manual)'}
                >
                  {slugLocked ? <Unlock size={14}/> : <Lock size={14}/>}
                </button>
              </div>
              <SlugFeedback status={slugStatus} />
            </Field>
          </Section>

          {/* Seasons */}
          <Section title="Seasons" description="Which seasons does this trip work in?">
            <div className="grid grid-cols-2 gap-1.5">
              {SEASONS.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => toggleSeason(s.value)}
                  className={`
                    p-3 rounded-xl border-2 transition text-left
                    ${trip.seasons.includes(s.value)
                      ? 'bg-lime-soft border-lime text-ink'
                      : 'bg-base border-default text-secondary hover:border-strong'}
                  `}
                >
                  <div className="text-lg mb-0.5">{s.emoji}</div>
                  <div className="text-sm font-semibold">{s.label}</div>
                </button>
              ))}
            </div>
          </Section>

          {/* Tags */}
          <Section title="Tags" description="How visitors filter & find this trip.">
            {Object.entries(tagsByCategory).map(([category, categoryTags]) => (
              <div key={category} className="mb-3 last:mb-0">
                <div className="text-[10px] font-mono uppercase tracking-[1.5px] text-muted mb-1.5">
                  {category}
                </div>
                <div className="flex flex-wrap gap-1">
                  {categoryTags.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`
                        text-xs font-semibold px-2.5 py-1 rounded-full border transition
                        ${trip.tag_ids.includes(tag.id)
                          ? 'bg-lime text-inverse-text border-lime'
                          : 'bg-base border-default text-secondary hover:border-strong'}
                      `}
                    >
                      {tag.emoji} {tag.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </Section>

          {/* Display */}
          <Section title="Display">
            <Field label="Card size on homepage">
              <div className="space-y-1.5">
                {CARD_SIZES.map(size => (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => setField('card_size', size.value)}
                    className={`
                      w-full p-3 rounded-xl border-2 transition text-left
                      ${trip.card_size === size.value
                        ? 'bg-lime-soft border-lime'
                        : 'bg-base border-default hover:border-strong'}
                    `}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="text-sm font-bold text-ink">{size.label}</div>
                      <div className={`h-2 rounded-full bg-lime ${size.width}`} />
                    </div>
                    <div className="text-[11px] text-muted">{size.description}</div>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Feature on homepage">
              <button
                type="button"
                onClick={() => setField('is_featured', !trip.is_featured)}
                className={`
                  w-full flex items-center gap-2.5 p-3 rounded-xl border-2 transition text-left
                  ${trip.is_featured
                    ? 'bg-sun/15 border-sun text-ink'
                    : 'bg-base border-default text-secondary hover:border-strong'}
                `}
              >
                <Star size={16} className={trip.is_featured ? 'fill-sun text-sun' : ''} />
                <span className="text-sm font-semibold flex-1">
                  {trip.is_featured ? 'Featured' : 'Not featured'}
                </span>
                {trip.is_featured && (
                  <span className="text-[10px] font-mono uppercase tracking-wider opacity-60">Pinned</span>
                )}
              </button>
            </Field>
          </Section>

          {/* Hero image placeholder */}
        <Section
            title="Photos & videos"
            description="First upload becomes the hero automatically. Drag to reorder."
            accent="cherry"
            >
        <PhotoGallery
            tripId={trip.id}
            initialPhotos={photos}
            disabled={mode === 'create' || !trip.id}
            />
        </Section>
        </div>
      </div>

      {/* ============ STICKY SAVE BAR ============ */}
      <div className={`
        fixed bottom-0 left-0 lg:left-64 right-0 z-30
        transition-all duration-200
        ${(dirty || mode === 'create') ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}
      `}>
        <div className="p-4 lg:p-5 bg-raised border-t-2 border-default shadow-popover backdrop-blur-sm">
          <div className="max-w-[1400px] flex items-center gap-3 flex-wrap">
            <div className="text-sm text-ink flex-1 min-w-0">
              <strong>
                {mode === 'create' ? 'New trip' : (dirty ? 'Unsaved changes' : 'No changes')}
              </strong>
              {dirty && mode !== 'create' && (
                <span className="text-muted ml-2 text-xs font-mono">edits pending</span>
              )}
              {slugStatus === 'taken' && (
                <span className="text-cherry ml-2 text-xs font-mono">· slug conflict</span>
              )}
            </div>

            {trip.status === 'draft' ? (
              <>
                <button
                  onClick={() => handleSave('draft')}
                  disabled={isPending}
                  className="text-sm font-semibold px-4 py-2 rounded-full border border-default hover:border-ink text-ink transition disabled:opacity-50"
                >
                  Save draft
                </button>
                <button
                  onClick={() => handleSave('published')}
                  disabled={isPending || slugStatus === 'taken'}
                  className="text-sm font-bold px-5 py-2 rounded-full bg-lime text-inverse-text transition active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <Save size={14}/> {isPending ? 'Publishing…' : 'Save & publish'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleSave('draft')}
                  disabled={isPending}
                  className="text-sm font-semibold px-4 py-2 rounded-full border border-default hover:border-cherry hover:text-cherry text-ink transition disabled:opacity-50"
                >
                  Move to draft
                </button>
                <button
                  onClick={() => handleSave()}
                  disabled={isPending || slugStatus === 'taken'}
                  className="text-sm font-bold px-5 py-2 rounded-full bg-lime text-inverse-text transition active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <Save size={14}/> {isPending ? 'Saving…' : 'Save changes'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ============ DIALOGS ============ */}
      <ConfirmDialog
        open={confirmDelete}
        title={`Delete "${trip.title || 'this trip'}"?`}
        description="This removes the trip and all its seasons, tags, and photo references. This cannot be undone."
        confirmLabel="Delete trip"
        cancelLabel="Keep it"
        danger
        loading={isPending}
        onConfirm={handleDelete}
        onCancel={() => !isPending && setConfirmDelete(false)}
      />

      <ConfirmDialog
        open={!!confirmLeave}
        title="Leave without saving?"
        description="You have unsaved changes that will be lost."
        confirmLabel="Discard changes"
        cancelLabel="Stay"
        danger
        onConfirm={() => { const href = confirmLeave; setConfirmLeave(null); router.push(href); }}
        onCancel={() => setConfirmLeave(null)}
      />
    </div>
  );
}

/* ============ small sub-components ============ */
function SlugFeedback({ status }) {
  if (!status) return null;
  const messages = {
    checking: { icon: Info,         text: 'Checking availability…', color: 'text-muted' },
    ok:       { icon: CheckCircle2, text: 'Available',              color: 'text-success' },
    taken:    { icon: AlertCircle,  text: 'Already used in this region', color: 'text-cherry' },
  };
  const m = messages[status];
  if (!m) return null;
  const Icon = m.icon;
  return (
    <div className={`mt-1.5 text-[11px] font-mono flex items-center gap-1 ${m.color}`}>
      <Icon size={11} /> {m.text}
    </div>
  );
}