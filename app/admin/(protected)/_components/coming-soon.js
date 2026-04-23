'use client';

import { Construction, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ComingSoon({ title, phase, description }) {
  return (
    <div className="max-w-2xl">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted hover:text-ink transition mb-6"
      >
        <ArrowLeft size={12}/> Back to dashboard
      </Link>

      <div className="bg-raised border-2 border-subtle rounded-3xl p-10">
        <div className="w-14 h-14 rounded-2xl bg-lime-soft text-lime flex items-center justify-center mb-6">
          <Construction size={24}/>
        </div>
        <div className="inline-block bg-hover text-lime text-[10px] font-mono uppercase tracking-[1.5px] px-2.5 py-1 rounded-full mb-4">
          {phase}
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-3 text-ink">{title}</h1>
        <p className="text-base text-secondary leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}