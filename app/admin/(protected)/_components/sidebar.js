'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Home, MapPin, Globe2, Compass,
  Film, Dumbbell, Tag, Image as ImageIcon, Clock,
  Settings, Menu, X
} from 'lucide-react';

const NAV = [
  { section: 'Overview', items: [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  ]},
  { section: 'Content', items: [
    { href: '/admin/homepage', label: 'Homepage',     icon: Home,     accent: 'cherry' },
    { href: '/admin/trips',    label: 'Trips',        icon: MapPin,   badge: 'main' },
    { href: '/admin/regions',  label: 'Regions',      icon: Globe2 },
    { href: '/admin/stories',  label: 'Stories',      icon: Film },
    { href: '/admin/venues',   label: 'Venues',       icon: Compass },
    { href: '/admin/journey',  label: 'Journey',      icon: Clock },
  ]},
  { section: 'Taxonomy', items: [
    { href: '/admin/tags',    label: 'Tags',         icon: Tag },
    { href: '/admin/media',   label: 'Media library',icon: ImageIcon },
  ]},
  { section: 'System', items: [
    { href: '/admin/settings', label: 'Settings',     icon: Settings },
  ]},
];

export default function Sidebar({ admin }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-full bg-raised border-2 border-default flex items-center justify-center text-ink"
        aria-label="Toggle menu"
      >
        {open ? <X size={18}/> : <Menu size={18}/>}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 z-30"
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-screen w-64 z-40
        bg-raised border-r-2 border-subtle
        flex flex-col
        transform transition-transform
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="p-5 border-b-2 border-subtle">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-2xl" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Pri
            <span
              className="bg-cherry text-white px-2 py-0.5 rounded-full text-lg font-extrabold not-italic"
              style={{ transform: 'rotate(-4deg)', display: 'inline-block', fontFamily: 'system-ui' }}
            >
              Trip
            </span>
          </Link>
          <div className="mt-2 text-[10px] font-mono tracking-[2px] uppercase text-faint">
            admin · v0.1
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {NAV.map(section => (
            <div key={section.section} className="mb-5">
              <div className="px-5 text-[10px] font-mono uppercase tracking-[1.5px] text-faint mb-2">
                {section.section}
              </div>
              <ul>
                {section.items.map(item => {
                  const active = pathname === item.href ||
                    (item.href !== '/admin' && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`
                          mx-2 px-3 py-2 rounded-xl flex items-center gap-3 text-sm
                          transition relative
                          ${active
                            ? 'bg-lime text-inverse-text font-bold'
                            : 'hover:bg-hover text-secondary hover:text-ink'}
                        `}
                      >
                        <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                        <span className="flex-1">{item.label}</span>
                        {item.accent === 'cherry' && !active && (
                          <span className="w-1.5 h-1.5 rounded-full bg-cherry" />
                        )}
                        {item.badge && !active && (
                          <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-default text-lime">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t-2 border-subtle">
          <div className="bg-hover rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-lime to-cherry flex items-center justify-center text-inverse-text font-extrabold text-sm">
              {admin.displayName[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate text-ink">{admin.displayName}</div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted">{admin.role}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}