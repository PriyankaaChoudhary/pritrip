'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Filter, FileText, ExternalLink, Edit3, Trash2,
  Star, X as XIcon, Clock
} from 'lucide-react';
import { PageHeader, Button, StatusPill, EmptyState } from '../_components/ui';
import { ConfirmDialog } from '../_components/confirm-dialog';
import { useToast } from '../_components/toast';
import { deleteBlogAction } from './actions';

export default function BlogsList({ initialBlogs }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [blogs, setBlogs] = useState(initialBlogs);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirm, setConfirm] = useState(null);

  const filtered = useMemo(() => {
    let out = blogs;
    const q = query.trim().toLowerCase();
    if (q) {
      out = out.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        (b.subtitle || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      out = out.filter(b => b.status === statusFilter);
    }
    return [...out].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }, [blogs, query, statusFilter]);

  const counts = useMemo(() => ({
    all:       blogs.length,
    published: blogs.filter(b => b.status === 'published').length,
    draft:     blogs.filter(b => b.status === 'draft').length,
    scheduled: blogs.filter(b => b.status === 'scheduled').length,
  }), [blogs]);

  async function handleDelete(blog) {
    startTransition(async () => {
      const res = await deleteBlogAction(blog.id);
      if (res.ok) {
        setBlogs(cur => cur.filter(b => b.id !== blog.id));
        setConfirm(null);
        toast({ kind: 'ok', text: `Deleted "${blog.title}"` });
      } else {
        toast({ kind: 'err', text: res.error || 'Delete failed' });
      }
    });
  }

  return (
    <div>
      <PageHeader
        title="Blog posts"
        description="Roundups, guides, and long-form travel content. Perfect for 'best X in Y' queries."
        actions={
          <>
            <Button variant="ghost" size="md" href="/blog">
              <ExternalLink size={13}/> View blog
            </Button>
            <Button variant="primary" size="lg" href="/admin/blogs/new">
              <Plus size={15}/> New post
            </Button>
          </>
        }
      />

      {/* Status tabs */}
      <div className="flex gap-1 mb-5 flex-wrap">
        <StatusTab label="All" count={counts.all} active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
        <StatusTab label="Published" count={counts.published} active={statusFilter === 'published'} onClick={() => setStatusFilter('published')} />
        <StatusTab label="Drafts" count={counts.draft} active={statusFilter === 'draft'} onClick={() => setStatusFilter('draft')} />
        <StatusTab label="Scheduled" count={counts.scheduled} active={statusFilter === 'scheduled'} onClick={() => setStatusFilter('scheduled')} />
      </div>

      {/* Search */}
      <div className="bg-raised border-2 border-subtle rounded-2xl p-3 mb-5 flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-base border border-default rounded-xl px-3 py-2">
          <Search size={14} className="text-muted"/>
          <input
            type="text"
            placeholder="Search by title, slug, subtitle…"
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
      </div>

      <div className="text-xs font-mono text-muted mb-3 px-1">
        {filtered.length} of {blogs.length} posts
      </div>

      {filtered.length === 0 ? (
        blogs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No blog posts yet"
            body="Blog posts are great for 'best hiking trails in Ontario' queries. One quality post can bring traffic for years."
            cta={<Button variant="primary" size="lg" href="/admin/blogs/new"><Plus size={15}/> Write first post</Button>}
          />
        ) : (
          <EmptyState
            icon={Filter}
            title="No posts match your search"
            body="Try clearing the search or switching to a different status."
            cta={<Button variant="ghost" onClick={() => { setQuery(''); setStatusFilter('all'); }}><XIcon size={13}/> Clear</Button>}
          />
        )
      ) : (
        <div className="bg-raised border-2 border-subtle rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[60px_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 bg-hover border-b border-subtle text-[10px] font-mono uppercase tracking-[1.5px] text-muted">
            <div>Cover</div>
            <div>Post</div>
            <div>Read time</div>
            <div>Region</div>
            <div>Status</div>
            <div className="w-20 text-right">Actions</div>
          </div>

          <ul className="divide-y divide-subtle">
            {filtered.map(blog => (
              <li
                key={blog.id}
                className="grid grid-cols-[60px_1fr] md:grid-cols-[60px_1fr_auto_auto_auto_auto] gap-3 md:gap-4 px-5 py-4 hover:bg-hover transition items-center"
              >
                {/* Cover thumbnail */}
                <div className="w-12 h-12 rounded-lg border border-default overflow-hidden bg-base flex items-center justify-center">
                  {blog.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={blog.cover_image_url.replace('/upload/', '/upload/c_fill,f_auto,q_auto,w_96,h_96/')}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileText size={16} className="text-faint"/>
                  )}
                </div>

                {/* Title + meta */}
                <div className="min-w-0">
                  <Link
                    href={`/admin/blogs/${blog.id}`}
                    className="group flex items-center gap-2"
                  >
                    {blog.is_featured && (
                      <Star size={12} className="text-sun fill-sun shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-ink truncate group-hover:text-lime transition">
                        {blog.kicker && (
                          <span className="text-[10px] font-mono uppercase tracking-wider text-muted mr-2">
                            {blog.kicker}
                          </span>
                        )}
                        {blog.title}
                      </div>
                      {blog.subtitle && (
                        <div className="text-xs text-muted truncate">{blog.subtitle}</div>
                      )}
                    </div>
                  </Link>
                </div>

                {/* Reading time */}
                <div className="hidden md:flex items-center gap-1 text-xs text-muted font-mono">
                  <Clock size={11} />
                  {blog.reading_minutes || '–'} min
                </div>

                {/* Region */}
                <div className="hidden md:block text-sm text-secondary whitespace-nowrap">
                  {blog.regions ? `${blog.regions.flag_emoji} ${blog.regions.name}` : <span className="text-faint italic">any</span>}
                </div>

                {/* Status */}
                <div>
                  <StatusPill status={blog.status} />
                </div>

                {/* Actions */}
                <div className="flex gap-1 justify-end col-span-2 md:col-span-1">
                  {blog.status === 'published' && (
                    <a
                      href={`/blog/${blog.slug}`}
                      target="_blank"
                      className="p-2 rounded-lg text-muted hover:text-ink hover:bg-base transition"
                      title="View live"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <Link
                    href={`/admin/blogs/${blog.id}`}
                    className="p-2 rounded-lg text-muted hover:text-lime hover:bg-base transition"
                    title="Edit"
                  >
                    <Edit3 size={14} />
                  </Link>
                  <button
                    onClick={() => setConfirm({ blog })}
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
        title={`Delete "${confirm?.blog.title}"?`}
        description="This cannot be undone. The post will vanish from the site immediately."
        confirmLabel="Delete post"
        cancelLabel="Keep it"
        danger
        loading={isPending}
        onConfirm={() => confirm && handleDelete(confirm.blog)}
        onCancel={() => !isPending && setConfirm(null)}
      />
    </div>
  );
}

function StatusTab({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-full text-sm font-semibold transition flex items-center gap-2
        ${active
          ? 'bg-inverse-bg text-inverse-text'
          : 'bg-raised border border-subtle hover:border-default text-ink'}
      `}
    >
      {label}
      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${active ? 'bg-inverse-text/15' : 'bg-base'}`}>
        {count}
      </span>
    </button>
  );
}