import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from './_components/sidebar';
import Topbar from './_components/topbar';
import { ThemeProvider } from './_components/theme-provider';
import { ToastProvider } from './_components/toast';

export default async function ProtectedLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('role, display_name')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminRow) {
    await supabase.auth.signOut();
    redirect('/admin/login');
  }

  const adminInfo = {
    email: user.email,
    role: adminRow.role,
    displayName: adminRow.display_name || user.email.split('@')[0],
  };

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="min-h-screen bg-base text-ink font-sans">
          <div className="flex">
            <Sidebar admin={adminInfo} />
            <div className="flex-1 min-w-0 lg:ml-64">
              <Topbar admin={adminInfo} />
              <main className="p-6 lg:p-10 max-w-[1400px]">
                {children}
              </main>
            </div>
          </div>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}