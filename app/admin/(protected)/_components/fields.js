'use client';

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-mono uppercase tracking-[1.5px] text-muted mb-1.5">
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-[11px] text-faint mt-1.5 font-mono">{hint}</span>
      )}
    </label>
  );
}

export function TextInput({ value = '', onChange, placeholder, ...rest }) {
  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-base border-2 border-default focus:border-lime rounded-xl px-4 py-2.5 text-sm outline-none transition text-ink placeholder:text-faint"
      {...rest}
    />
  );
}

export function TextArea({ value = '', onChange, placeholder, rows = 3, ...rest }) {
  return (
    <textarea
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-base border-2 border-default focus:border-lime rounded-xl px-4 py-2.5 text-sm outline-none transition text-ink placeholder:text-faint resize-y leading-relaxed"
      {...rest}
    />
  );
}

/**
 * Section — groups fields into a card with a title and optional description.
 * Use it to organize forms visually.
 */
export function Section({ title, description, accent, children }) {
  const accentColors = {
    lime:   'text-lime',
    cherry: 'text-cherry',
    sky:    'text-sky',
    sun:    'text-sun',
  };
  return (
    <section className="bg-raised border-2 border-subtle rounded-3xl p-6 lg:p-7">
      <header className="mb-5">
        <h2 className={`text-xl font-extrabold tracking-tight mb-1 ${accent ? accentColors[accent] : 'text-ink'}`}>
          {title}
        </h2>
        {description && (
          <p className="text-sm text-secondary">{description}</p>
        )}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/**
 * TwoCol — for putting two related fields side-by-side (number + label, etc.)
 */
export function TwoCol({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}