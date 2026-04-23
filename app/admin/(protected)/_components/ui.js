'use client';

import Link from 'next/link';

/* ============ Status Pill ============ */
export function StatusPill({ status }) {
  const styles = {
    published: 'bg-success-soft text-success',
    draft:     'bg-hover text-muted',
    scheduled: 'bg-lime-soft text-lime',
    archived:  'bg-danger-soft text-danger',
  };
  return (
    <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
}

/* ============ Button ============ */
export function Button({ variant = 'primary', size = 'md', href, children, className = '', ...rest }) {
  const variants = {
    primary:   'bg-lime text-inverse-text hover:opacity-90',
    cherry:    'bg-cherry text-white hover:opacity-90',
    ghost:     'border border-default text-ink hover:border-lime hover:text-lime',
    danger:    'border border-danger/40 text-danger hover:bg-danger-soft',
    subtle:    'bg-hover text-ink hover:bg-base',
  };
  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-full',
    md: 'text-sm px-4 py-2 rounded-full',
    lg: 'text-sm px-5 py-2.5 rounded-full font-bold',
  };
  const base = 'inline-flex items-center gap-1.5 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed';
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return <Link href={href} className={classes}>{children}</Link>;
  }
  return <button className={classes} {...rest}>{children}</button>;
}

/* ============ Page header ============ */
export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-8 flex items-start justify-between gap-6 flex-wrap">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight text-ink mb-2">{title}</h1>
        {description && (
          <p className="text-base text-secondary leading-relaxed">{description}</p>
        )}
      </div>
      {actions && <div className="flex gap-2 items-center flex-wrap">{actions}</div>}
    </div>
  );
}

/* ============ Empty state ============ */
export function EmptyState({ icon: Icon, title, body, cta }) {
  return (
    <div className="py-20 text-center">
      {Icon && <Icon size={40} className="mx-auto text-faint mb-4" strokeWidth={1.5}/>}
      <div className="text-lg font-bold text-ink mb-2">{title}</div>
      <p className="text-sm text-muted mb-6 max-w-sm mx-auto">{body}</p>
      {cta}
    </div>
  );
}