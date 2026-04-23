'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const search = useSearchParams();
  const nextPath = search.get('next') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Apply the admin's saved theme preference on load
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pritrip-theme-admin');
      const theme = stored === 'light' ? 'light' : 'dark';
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    } catch {}
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const { data: adminRow } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!adminRow) {
      await supabase.auth.signOut();
      setError("That account isn't an admin. Ask Pri to add you.");
      setLoading(false);
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-base text-ink flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 text-4xl italic" style={{ fontFamily: 'Georgia, serif' }}>
            Pri
            <span
              className="bg-cherry text-white px-3 py-0.5 rounded-full text-2xl font-extrabold not-italic"
              style={{ transform: 'rotate(-4deg)', display: 'inline-block', fontFamily: 'system-ui' }}
            >
              Trip
            </span>
          </div>
          <div className="mt-3 text-xs font-mono tracking-[2px] uppercase text-muted">
            admin · v0.1
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-raised border-2 border-subtle rounded-3xl p-8 space-y-5"
        >
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">Welcome back.</h1>
            <p className="text-sm text-muted">
              Log in to manage trips, stories, and everything in between.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="block text-xs font-mono uppercase tracking-wider text-muted mb-1.5">
                Email
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-base border-2 border-default focus:border-lime rounded-xl px-4 py-3 text-base outline-none transition text-ink"
                placeholder="you@pritrip.com"
              />
            </label>

            <label className="block">
              <span className="block text-xs font-mono uppercase tracking-wider text-muted mb-1.5">
                Password
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-base border-2 border-default focus:border-lime rounded-xl px-4 py-3 text-base outline-none transition text-ink"
              />
            </label>
          </div>

          {error && (
            <div className="bg-danger-soft border-2 border-danger/40 rounded-xl p-3 text-sm text-danger">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-lime text-inverse-text rounded-full py-3.5 font-bold text-base transition active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>

          <div className="text-center text-xs text-faint font-mono pt-2">
            Unauthorized access is logged.
          </div>
        </form>

        <div className="text-center mt-6 text-xs text-faint font-mono">
          <a href="/" className="hover:text-ink transition">← back to pritrip.com</a>
        </div>
      </div>
    </main>
  );
}