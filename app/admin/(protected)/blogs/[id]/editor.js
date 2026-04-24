'use client';

import { useState, useCallback, useMemo, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, ExternalLink, Trash2, Lock, Unlock, Star,
  Upload, X, AlertCircle, CheckCircle2, Info, Loader2, Image as ImageIcon
} from 'lucide-react';
import { Field, TextInput, TextArea, Section, TwoCol } from '../../_components/fields';
import { StatusPill } from '../../_components/ui';
import { ConfirmDialog } from '../../_components/confirm-dialog';
import { useToast } from '../../_components/toast';
import { RichEditor } from '../../_components/rich-editor';
import { slugify } from '@/lib/slugify';
import { uploadToCloudinary, validateFile, cldThumb } from '@/lib/cloudinary';
import { saveBlogAction, deleteBlogAction, checkBlogSlugAvailable } from '../actions';

export default function BlogEditor({ initial, regions, allTags, mode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [blog, setBlog] = useState(initial);
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.parse(JSON.stringify(initial)));
  const [slugLocked, setSlugLocked] = useState(mode === 'edit');
  const [slugStatus, setSlugStatus] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(null);

  const setField = useCallback((field, value) => {
    setBlog(prev => ({ ...prev, [field]: value }));
  }, []);

  const dirty = useMemo(
    () => JSON.stringify(blog) !== JSON.stringify(savedSnapshot),
    [blog, savedSnapshot]
  );

  // Auto-slug
  useEffect(() => {
    if (slugLocked) return;
    const auto = slugify(blog.title);
    if (auto !== blog.slug) setBlog(prev => ({ ...prev, slug: auto }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blog.title, slugLocked]);

  // Slug uniqueness
  const slugCheckRef = useRef();
  useEffect(() => {
    if (!blog.slug) { setSlugStatus(null); return; }
    setSlugStatus('checking');
    clearTimeout(slugCheckRef.current);
    slugCheckRef.current = setTimeout(async () => {
      const res = await checkBlogSlugAvailable({ slug: blog.slug, excludeId: blog.id });
      if (!res.ok) { setSlugStatus(null); return; }
      setSlugStatus(res.available ? 'ok' : 'taken');
    }, 400);
    return () => clearTimeout(slugCheckRef.current);
  }, [blog.slug, blog.id]);

  // Unsaved changes warning
  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(e) { e.preventDefault(); e.returnValue = ''; }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  // Cover upload
  async function handleCoverUpload(file) {
    const validation = validateFile(file);
    if (!validation.ok) {
      toast({ kind: 'err', text: validation.error });
      return;
    }
    if (validation.isVideo) {
      toast({ kind: 'err', text: 'Cover must be an image, not a video' });
      return;
    }
    setUploadingCover(true);
    try {
      const result = await uploadToCloudinary(file);
      setField('cover_image_url', result.url);
      toast({ kind: 'ok', text: 'Cover uploaded' });
    } catch (err) {
      toast({ kind: 'err', text: err.message });
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleSave(afterStatus) {
    const payload = { ...blog, status: afterStatus || blog.status };
    startTransition(async () => {
      const res = await saveBlogAction(payload);
      if (!res.ok) { toast({ kind: 'err', text: res.error }); return; }
      const updated = { ...blog, status: payload.status, id: res.id, slug: res.slug };
      setBlog(updated);
      setSavedSnapshot(JSON.parse(JSON.stringify(updated)));
      toast({
        kind: 'ok',
        text: mode === 'create' ? 'Post created · opening editor' : 'Post saved',
      });
      if (mode === 'create') router.replace(`/admin/blogs/${res.id}`);
    });
  }

  async function handleDelete() {
    startTransition(async () => {
      const res = await deleteBlogAction(blog.id);
      if (!res.ok) { toast({ kind: 'err', text: res.error }); return; }
      toast({ kind: 'ok', text: `Deleted "${blog.title}"` });
      router.push('/admin/blogs');
    });
  }

  function handleBack() {
    if (dirty) setConfirmLeave('/admin/blogs');
    else router.push('/admin/blogs');
  }

  const publicHref = blog.status === 'published' && blog.slug ? `/blog/${blog.slug}` : null;

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
    setBlog(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(id) ? prev.tag_ids.filter(x => x !== id) : [...prev.tag_ids, id],
    }));
  }

  const excerptLen = (blog.excerpt || '').length;
  const metaDescLen = (blog.meta_description || '').length;

  return (
    <div className="pb-32">
      {/* Top strip */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <button
          onClick={handleBack}
          className="text-xs font-mono uppercase tracking-wider text-muted hover:text-ink transition flex items-center gap-1.5"
        >
          <ArrowLeft size={12} /> All posts
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusPill status={blog.status} />
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

      {/* Title */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Kicker (e.g. Roundup, Guide, List)"
          value={blog.kicker}
          onChange={e => setField('kicker', e.target.value)}
          className="w-full bg-transparent border-none outline-none text-xs font-mono uppercase tracking-[2px] text-muted placeholder:text-faint mb-2"
        />
        <input
          type="text"
          placeholder="Post title…"
          value={blog.title}
          onChange={e => setField('title', e.target.value)}
          className="w-full bg-transparent border-none outline-none text-4xl lg:text-5xl font-extrabold tracking-tight text-ink placeholder:text-faint"
        />
        <input
          type="text"
          placeholder="Optional subtitle…"
          value={blog.subtitle}
          onChange={e => setField('subtitle', e.target.value)}
          className="w-full bg-transparent border-none outline-none text-lg text-secondary placeholder:text-faint mt-1"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

        {/* Left column */}
        <div className="space-y-5 min-w-0">
          <Section
            title="Excerpt"
            description="The 1-2 sentence blurb shown on cards. Also used as fallback meta description."
            accent="lime"
          >
            <Field label="" hint={`${excerptLen} / 200 characters recommended`}>
              <TextArea
                rows={2}
                value={blog.excerpt}
                onChange={v => setField('excerpt', v)}
                placeholder="A short hook that makes people want to click."
              />
            </Field>
          </Section>

          <Section
            title="The post"
            description="The full article. Use H2 for sections, H3 for sub-sections."
            accent="lime"
          >
            <RichEditor
              value={blog.body}
              onChange={v => setField('body', v)}
              placeholder="Write the article…"
            />
          </Section>

          <Section
            title="SEO & search"
            description="How this post appears in Google and when shared on social."
            accent="sky"
          >
            <Field label="Meta title" hint="Google headline · under 60 chars recommended. Leave blank to use post title.">
              <TextInput value={blog.meta_title} onChange={v => setField('meta_title', v)} placeholder={blog.title || 'e.g. 10 Best Hiking Trails in Ontario (2026)'} />
            </Field>
            <Field label="Meta description" hint={`${metaDescLen} / 160 characters`}>
              <TextArea rows={2} value={blog.meta_description} onChange={v => setField('meta_description', v)} placeholder="Concise summary shown below the link on Google." />
            </Field>
          </Section>
        </div>

        {/* Right column */}
        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">

          {/* Cover image */}
          <Section title="Cover image">
            <CoverUploader
              url={blog.cover_image_url}
              alt={blog.cover_image_alt}
              onAltChange={v => setField('cover_image_alt', v)}
              onUpload={handleCoverUpload}
              onClear={() => setField('cover_image_url', '')}
              uploading={uploadingCover}
            />
          </Section>

          {/* URL */}
          <Section title="URL">
            <Field label="URL slug" hint={`Full URL: /blog/${blog.slug || '…'}`}>
              <div className="flex gap-2">
                <input
                  value={blog.slug}
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
                >
                  {slugLocked ? <Unlock size={14}/> : <Lock size={14}/>}
                </button>
              </div>
              <SlugFeedback status={slugStatus} />
            </Field>
          </Section>

          {/* Region (optional) */}
          <Section title="Region association" description="Optional — helps with region pages.">
            <Field label="Primary region">
              <select
                value={blog.region_id || ''}
                onChange={e => setField('region_id', e.target.value || null)}
                className="w-full bg-base border-2 border-default focus:border-lime rounded-xl px-4 py-2.5 text-sm outline-none transition text-ink"
              >
                <option value="">No specific region</option>
                {regions.map(r => (
                  <option key={r.id} value={r.id}>{r.flag_emoji} {r.name}</option>
                ))}
              </select>
            </Field>
          </Section>

          {/* Tags */}
          <Section title="Tags" description="How this post is categorized & filtered.">
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
                        ${blog.tag_ids.includes(tag.id)
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

          {/* Feature toggle */}
          <Section title="Display">
            <Field label="Feature on homepage">
              <button
                type="button"
                onClick={() => setField('is_featured', !blog.is_featured)}
                className={`
                  w-full flex items-center gap-2.5 p-3 rounded-xl border-2 transition text-left
                  ${blog.is_featured
                    ? 'bg-sun/15 border-sun text-ink'
                    : 'bg-base border-default text-secondary hover:border-strong'}
                `}
              >
                <Star size={16} className={blog.is_featured ? 'fill-sun text-sun' : ''} />
                <span className="text-sm font-semibold flex-1">
                  {blog.is_featured ? 'Featured' : 'Not featured'}
                </span>
              </button>
            </Field>
          </Section>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className={`
        fixed bottom-0 left-0 lg:left-64 right-0 z-30
        transition-all duration-200
        ${(dirty || mode === 'create') ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}
      `}>
        <div className="p-4 lg:p-5 bg-raised border-t-2 border-default shadow-popover backdrop-blur-sm">
          <div className="max-w-[1400px] flex items-center gap-3 flex-wrap">
            <div className="text-sm text-ink flex-1 min-w-0">
              <strong>{mode === 'create' ? 'New post' : (dirty ? 'Unsaved changes' : 'No changes')}</strong>
              {slugStatus === 'taken' && (
                <span className="text-cherry ml-2 text-xs font-mono">· slug conflict</span>
              )}
            </div>
            {blog.status === 'draft' ? (
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

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete "${blog.title || 'this post'}"?`}
        description="This cannot be undone. The post will vanish from the site immediately."
        confirmLabel="Delete post"
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

/* ============ Sub-components ============ */

function CoverUploader({ url, alt, onAltChange, onUpload, onClear, uploading }) {
  const inputRef = useRef();
  const [dragOver, setDragOver] = useState(false);

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) onUpload(e.dataTransfer.files[0]);
  }

  return (
    <div className="space-y-3">
      {url ? (
        <div className="relative group">
          <div className="aspect-video rounded-xl overflow-hidden border-2 border-default bg-hover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cldThumb(url, { width: 640, height: 360 })} alt={alt || ''} className="w-full h-full object-cover" />
          </div>
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-cherry text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
            title="Remove cover"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            aspect-video border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition
            ${dragOver ? 'border-lime bg-lime-soft' : 'border-default hover:border-lime hover:bg-hover'}
          `}
        >
          {uploading ? (
            <Loader2 size={24} className="text-lime animate-spin" />
          ) : (
            <>
              <Upload size={24} className="text-muted mb-2" />
              <div className="text-xs font-semibold text-ink mb-0.5">Drop image or click</div>
              <div className="text-[10px] text-muted font-mono">JPG or PNG, up to 10MB</div>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) onUpload(e.target.files[0]); e.target.value = ''; }}
      />
      {url && (
        <Field label="Alt text" hint="Describe the image (SEO + accessibility)">
          <TextInput value={alt} onChange={onAltChange} placeholder="What's in the image" />
        </Field>
      )}
    </div>
  );
}

function SlugFeedback({ status }) {
  if (!status) return null;
  const messages = {
    checking: { icon: Info,         text: 'Checking availability…', color: 'text-muted' },
    ok:       { icon: CheckCircle2, text: 'Available',              color: 'text-success' },
    taken:    { icon: AlertCircle,  text: 'Already used',           color: 'text-cherry' },
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