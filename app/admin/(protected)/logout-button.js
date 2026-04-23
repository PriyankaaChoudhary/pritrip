'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const supabase = createClient();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs font-mono uppercase tracking-wider px-3 py-1.5 border border-default rounded-full hover:border-cherry hover:text-cherry transition text-ink"
    >
      Log out
    </button>
  );
}