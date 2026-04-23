'use client';

import { usePathname } from 'next/navigation';
import { Search, ExternalLink } from 'lucide-react';
import LogoutButton from '../logout-button';
import ThemeToggle from './theme-toggle';

const TITLES = {
  '/admin':          { title: 'Dashboard',      crumb: [] },
  '/admin/homepage': { title: 'Homepage editor',crumb: ['Content'] },
  '/admin/trips':    { title: 'Trips',          crumb: ['Content'] },
  '/admin/regions':  { title: 'Regions',        crumb: ['Content'] },
  '/admin/stories':  { title: 'Stories',        crumb: ['Content'] },
  '/admin/venues':   { title: 'Venues',         crumb: ['Content'] },
  '/admin/journey':  { title: 'Journey timeline',crumb:['Content'] },
  '/admin/tags':     { title: 'Tags',           crumb: ['Taxonomy'] },
  '/admin/media':    { title: 'Media library',  crumb: ['Taxonomy'] },
  '/admin/settings': { title: 'Settings',       crumb: ['System'] },
};

export default function Topbar({ admin }) {
  const pathname = usePathname();
  const meta = TITLES[pathname] || { title: 'Admin', crumb: [] };

  return (
    <header className="sticky top-0 z-20 bg-base/90 backdrop-blur-md border-b-2 border-subtle">
      <div className="h-16 px-6 lg:px-10 flex items-center gap-4 pl-16 lg:pl-10">
        <div className="min-w-0 flex-1">
          {meta.crumb.length > 0 && (
            <div className="text-[10px] font-mono uppercase tracking-[1.5px] text-muted mb-0.5">
              {meta.crumb.join(' / ')}
            </div>
          )}
          <h1 className="text-lg font-extrabold tracking-tight truncate text-ink">
            {meta.title}
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-2 bg-raised border border-default rounded-full px-4 py-1.5 w-64">
          <Search size={14} className="text-muted"/>
          <input
            placeholder="Search trips, regions…"
            className="flex-1 bg-transparent outline-none text-sm text-ink placeholder:text-faint"
          />
          <kbd className="text-[10px] font-mono text-muted bg-base px-1.5 py-0.5 rounded border border-default">⌘K</kbd>
        </div>

        <a
          href="/"
          target="_blank"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider px-3 py-1.5 border border-default rounded-full hover:border-lime hover:text-lime transition text-ink"
        >
          <ExternalLink size={12}/>
          View site
        </a>

        <ThemeToggle />

        <LogoutButton />
      </div>
    </header>
  );
}