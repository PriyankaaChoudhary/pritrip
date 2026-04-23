'use client';

import { useState, useCallback, useMemo } from 'react';
import { Save, ExternalLink, CheckCircle2, AlertCircle, Undo2, Sparkles } from 'lucide-react';
import { Field, TextInput, TextArea, Section, TwoCol } from '../_components/fields';
import { saveSettingAction } from './actions';

export default function HomepageEditor({ initialSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [savedSnapshot, setSavedSnapshot] = useState(
    // deep clone so comparisons are accurate
    JSON.parse(JSON.stringify(initialSettings))
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // {kind:'ok'|'err', text:''}

  // update helper: setField('hero', 'tag', 'new value')
  const setField = useCallback((group, field, value) => {
    setSettings(prev => ({
      ...prev,
      [group]: { ...(prev[group] || {}), [field]: value },
    }));
  }, []);

  // dirty check per group — which sections have unsaved changes?
  const dirty = useMemo(() => {
    const d = {};
    for (const key of Object.keys(settings)) {
      d[key] = JSON.stringify(settings[key]) !== JSON.stringify(savedSnapshot[key]);
    }
    return d;
  }, [settings, savedSnapshot]);

  const anyDirty = Object.values(dirty).some(Boolean);

  async function handleSaveAll() {
    setSaving(true);
    const dirtyGroups = Object.keys(dirty).filter(k => dirty[k]);

    let successCount = 0;
    let firstError = null;
    for (const group of dirtyGroups) {
      const res = await saveSettingAction(group, settings[group]);
      if (res.ok) {
        successCount++;
      } else if (!firstError) {
        firstError = res.error;
      }
    }

    setSaving(false);

    if (firstError) {
      setToast({ kind: 'err', text: `Couldn't save: ${firstError}` });
    } else {
      setSavedSnapshot(JSON.parse(JSON.stringify(settings)));
      setToast({
        kind: 'ok',
        text: `Saved ${successCount} section${successCount === 1 ? '' : 's'} · live site updated`,
      });
    }
    setTimeout(() => setToast(null), 4000);
  }

  function handleDiscardAll() {
    setSettings(JSON.parse(JSON.stringify(savedSnapshot)));
    setToast({ kind: 'ok', text: 'Reverted to last saved' });
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-6 flex-wrap">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-cherry-soft text-cherry text-[10px] font-mono uppercase tracking-[2px] px-2.5 py-1 rounded-full mb-3">
            <Sparkles size={10} /> Live editing
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-ink mb-2">
            Homepage editor
          </h1>
          <p className="text-base text-secondary leading-relaxed">
            Every word on the public homepage lives here. Change anything, hit save, and the site updates instantly. No code, no deploys.
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider px-4 py-2 border border-default rounded-full hover:border-lime hover:text-lime transition text-ink"
        >
          <ExternalLink size={13} /> Preview site
        </a>
      </div>

      <div className="space-y-5">
        {/* ========== HERO ========== */}
        <Section
          title="Hero section"
          description="The top of the homepage — tagline, big title, subtitle, buttons, and the three animated stickers."
          accent="cherry"
        >
          <DirtyBadge dirty={dirty.hero} />

          <Field label="Top tag line" hint="Shown in the green pill at the top (with the pulsing dot)">
            <TextInput
              value={settings.hero?.tag}
              onChange={v => setField('hero', 'tag', v)}
              placeholder="Currently exploring: Ontario, Canada"
            />
          </Field>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <Field label="Title line 1 — plain">
              <TextInput value={settings.hero?.title_line_1} onChange={v => setField('hero', 'title_line_1', v)} />
            </Field>
            <Field label="Title line 1 — italic red word" hint="Rendered in cursive red">
              <TextInput value={settings.hero?.title_line_1_italic} onChange={v => setField('hero', 'title_line_1_italic', v)} />
            </Field>
            <Field label="Title line 2" hint="Second plain line">
              <TextInput value={settings.hero?.title_line_2} onChange={v => setField('hero', 'title_line_2', v)} />
            </Field>
          </div>

          <Field label="Sticker word" hint="The yellow tilted sticker on the third line — keep it short (1–2 words)">
            <TextInput value={settings.hero?.title_line_3_sticker} onChange={v => setField('hero', 'title_line_3_sticker', v)} />
          </Field>

          <Field label="Subtitle paragraph">
            <TextArea rows={3} value={settings.hero?.subtitle} onChange={v => setField('hero', 'subtitle', v)} />
          </Field>

          <TwoCol>
            <Field label="Primary button — label">
              <TextInput value={settings.hero?.cta_primary_label} onChange={v => setField('hero', 'cta_primary_label', v)} />
            </Field>
            <Field label="Primary button — link" hint="Use # anchors like #world or full URLs">
              <TextInput value={settings.hero?.cta_primary_href} onChange={v => setField('hero', 'cta_primary_href', v)} />
            </Field>
          </TwoCol>
          <TwoCol>
            <Field label="Secondary button — label">
              <TextInput value={settings.hero?.cta_secondary_label} onChange={v => setField('hero', 'cta_secondary_label', v)} />
            </Field>
            <Field label="Secondary button — link">
              <TextInput value={settings.hero?.cta_secondary_href} onChange={v => setField('hero', 'cta_secondary_href', v)} />
            </Field>
          </TwoCol>

          <div className="pt-2">
            <div className="text-[11px] font-mono uppercase tracking-[1.5px] text-muted mb-2">
              Floating stickers
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <Field label="Sticker 1 — sky blue">
                <TextInput value={settings.hero?.floater_1} onChange={v => setField('hero', 'floater_1', v)} />
              </Field>
              <Field label="Sticker 2 — blossom pink">
                <TextInput value={settings.hero?.floater_2} onChange={v => setField('hero', 'floater_2', v)} />
              </Field>
              <Field label="Sticker 3 — lime green">
                <TextInput value={settings.hero?.floater_3} onChange={v => setField('hero', 'floater_3', v)} />
              </Field>
            </div>
          </div>
        </Section>

        {/* ========== COUNTER ========== */}
        <Section
          title="Counter strip"
          description="The 4 big stats below the hero."
          accent="lime"
        >
          <DirtyBadge dirty={dirty.counter} />
          {[1, 2, 3, 4].map(n => (
            <TwoCol key={n}>
              <Field label={`Stat ${n} — number`}>
                <TextInput value={settings.counter?.[`stat_${n}_number`]} onChange={v => setField('counter', `stat_${n}_number`, v)} />
              </Field>
              <Field label={`Stat ${n} — label`}>
                <TextInput value={settings.counter?.[`stat_${n}_label`]} onChange={v => setField('counter', `stat_${n}_label`, v)} />
              </Field>
            </TwoCol>
          ))}
        </Section>

        {/* ========== SECTION HEADINGS ========== */}
        <Section
          title="Section headings"
          description="The titles above each section further down the page."
          accent="sky"
        >
          <DirtyBadge dirty={dirty.sections} />

          <SubGroup label="World map section">
            <Field label="Eyebrow">
              <TextInput value={settings.sections?.world_eyebrow} onChange={v => setField('sections', 'world_eyebrow', v)} />
            </Field>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <Field label="Title line 1"><TextInput value={settings.sections?.world_title_1} onChange={v => setField('sections', 'world_title_1', v)} /></Field>
              <Field label="Title line 2 — plain"><TextInput value={settings.sections?.world_title_2} onChange={v => setField('sections', 'world_title_2', v)} /></Field>
              <Field label="Title line 2 — italic"><TextInput value={settings.sections?.world_title_2_italic} onChange={v => setField('sections', 'world_title_2_italic', v)} /></Field>
            </div>
            <Field label="Subtitle"><TextArea rows={2} value={settings.sections?.world_subtitle} onChange={v => setField('sections', 'world_subtitle', v)} /></Field>
          </SubGroup>

          <SubGroup label="Seasons section">
            <TwoCol>
              <Field label="Title — plain"><TextInput value={settings.sections?.seasons_title} onChange={v => setField('sections', 'seasons_title', v)} /></Field>
              <Field label="Title — italic"><TextInput value={settings.sections?.seasons_title_italic} onChange={v => setField('sections', 'seasons_title_italic', v)} /></Field>
            </TwoCol>
          </SubGroup>

          <SubGroup label="Activities section">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <Field label="Title part 1"><TextInput value={settings.sections?.activities_title_1} onChange={v => setField('sections', 'activities_title_1', v)} /></Field>
              <Field label="Title italic word"><TextInput value={settings.sections?.activities_title_1_italic} onChange={v => setField('sections', 'activities_title_1_italic', v)} /></Field>
              <Field label="Title part 2"><TextInput value={settings.sections?.activities_title_2} onChange={v => setField('sections', 'activities_title_2', v)} /></Field>
            </div>
            <Field label="Subtitle"><TextArea rows={2} value={settings.sections?.activities_subtitle} onChange={v => setField('sections', 'activities_subtitle', v)} /></Field>
          </SubGroup>

          <SubGroup label="Stories section">
            <Field label="Eyebrow"><TextInput value={settings.sections?.stories_eyebrow} onChange={v => setField('sections', 'stories_eyebrow', v)} /></Field>
            <TwoCol>
              <Field label="Title line 1"><TextInput value={settings.sections?.stories_title_1} onChange={v => setField('sections', 'stories_title_1', v)} /></Field>
              <Field label="Title line 2 italic"><TextInput value={settings.sections?.stories_title_2_italic} onChange={v => setField('sections', 'stories_title_2_italic', v)} /></Field>
            </TwoCol>
            <Field label="Subtitle"><TextArea rows={2} value={settings.sections?.stories_subtitle} onChange={v => setField('sections', 'stories_subtitle', v)} /></Field>
          </SubGroup>

          <SubGroup label="Journey timeline">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <Field label="Title part 1"><TextInput value={settings.sections?.journey_title_1} onChange={v => setField('sections', 'journey_title_1', v)} /></Field>
              <Field label="Title italic"><TextInput value={settings.sections?.journey_title_italic} onChange={v => setField('sections', 'journey_title_italic', v)} /></Field>
              <Field label="Title part 2"><TextInput value={settings.sections?.journey_title_2} onChange={v => setField('sections', 'journey_title_2', v)} /></Field>
            </div>
            <Field label="Subtitle"><TextArea rows={2} value={settings.sections?.journey_subtitle} onChange={v => setField('sections', 'journey_subtitle', v)} /></Field>
          </SubGroup>
        </Section>

        {/* ========== FOOTER ========== */}
        <Section
          title="Footer"
          description="Brand description, copyright line, and social links."
          accent="sun"
        >
          <DirtyBadge dirty={dirty.footer} />
          <Field label="Brand description" hint="Shown under the logo in the footer">
            <TextArea rows={2} value={settings.footer?.brand_description} onChange={v => setField('footer', 'brand_description', v)} />
          </Field>
          <TwoCol>
            <Field label="Copyright line"><TextInput value={settings.footer?.copyright} onChange={v => setField('footer', 'copyright', v)} /></Field>
            <Field label="Version label" hint="The small text on the right of the footer"><TextInput value={settings.footer?.version_label} onChange={v => setField('footer', 'version_label', v)} /></Field>
          </TwoCol>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2">
            <Field label="Instagram URL"><TextInput placeholder="https://instagram.com/..." value={settings.footer?.social_instagram} onChange={v => setField('footer', 'social_instagram', v)} /></Field>
            <Field label="TikTok URL"><TextInput placeholder="https://tiktok.com/@..." value={settings.footer?.social_tiktok} onChange={v => setField('footer', 'social_tiktok', v)} /></Field>
            <Field label="YouTube URL"><TextInput placeholder="https://youtube.com/@..." value={settings.footer?.social_youtube} onChange={v => setField('footer', 'social_youtube', v)} /></Field>
            <Field label="Newsletter URL"><TextInput placeholder="https://..." value={settings.footer?.social_newsletter} onChange={v => setField('footer', 'social_newsletter', v)} /></Field>
          </div>
        </Section>

        {/* ========== META (SEO) ========== */}
        <Section
          title="SEO & meta"
          description="Shows up in Google results and link previews. Keep meta description under 160 characters."
          accent="sky"
        >
          <DirtyBadge dirty={dirty.meta} />
          <Field label="Site title" hint="The browser tab title + Google headline">
            <TextInput value={settings.meta?.site_title} onChange={v => setField('meta', 'site_title', v)} />
          </Field>
          <Field label="Site description" hint={`${(settings.meta?.site_description || '').length} / 160 characters`}>
            <TextArea rows={2} value={settings.meta?.site_description} onChange={v => setField('meta', 'site_description', v)} />
          </Field>
          <Field label="Social share image URL" hint="Shown when links are pasted on WhatsApp, Twitter, etc. (we'll add uploader later)">
            <TextInput placeholder="https://..." value={settings.meta?.og_image_url} onChange={v => setField('meta', 'og_image_url', v)} />
          </Field>
        </Section>
      </div>

      {/* Sticky save bar */}
      <div className={`
        fixed bottom-0 left-0 lg:left-64 right-0 z-30
        transition-all duration-200
        ${anyDirty ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}
      `}>
        <div className="p-4 lg:p-5 bg-raised border-t-2 border-default shadow-popover backdrop-blur-sm">
          <div className="max-w-[1400px] flex items-center gap-3 flex-wrap">
            <div className="text-sm text-ink flex-1 min-w-0">
              <strong>Unsaved changes</strong>
              <span className="text-muted ml-2 text-xs font-mono">
                {Object.keys(dirty).filter(k => dirty[k]).length} section{Object.keys(dirty).filter(k => dirty[k]).length === 1 ? '' : 's'} edited
              </span>
            </div>
            <button
              onClick={handleDiscardAll}
              disabled={saving}
              className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-full border border-default hover:border-cherry hover:text-cherry transition text-ink font-semibold disabled:opacity-50"
            >
              <Undo2 size={13} /> Discard
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="inline-flex items-center gap-2 text-sm px-5 py-2 rounded-full bg-lime text-inverse-text font-bold transition active:scale-95 disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={`
            flex items-center gap-2 px-4 py-3 rounded-xl border-2 shadow-popover
            ${toast.kind === 'ok' ? 'bg-success-soft border-success text-success' : 'bg-danger-soft border-danger text-danger'}
          `}>
            {toast.kind === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span className="text-sm font-semibold">{toast.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ small sub-components ============ */
function DirtyBadge({ dirty }) {
  if (!dirty) return null;
  return (
    <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-cherry mb-1">
      <span className="w-1.5 h-1.5 rounded-full bg-cherry animate-pulse" />
      unsaved changes in this section
    </div>
  );
}

function SubGroup({ label, children }) {
  return (
    <div className="border-l-2 border-default pl-4 py-1 space-y-3">
      <div className="text-[10px] font-mono uppercase tracking-[2px] text-muted font-semibold">
        {label}
      </div>
      {children}
    </div>
  );
}