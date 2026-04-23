import { createServerClient } from '@supabase/ssr';
import { createClient as createJsClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Auth-aware client — respects the logged-in user's session via cookies.
 * Use this in admin pages, server actions, and anywhere you need to know
 * who's logged in. CANNOT be used in generateStaticParams or any
 * build-time context (cookies() requires a request).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — ignore, middleware refreshes cookies
          }
        },
      },
    }
  );
}

/**
 * Cookie-less client using the anon key. Works anywhere, including
 * build-time contexts like generateStaticParams and generateMetadata.
 * Respects RLS — only sees public data (is_live=true, status=published, etc).
 * Use this for public page data reads.
 */
export function createPublicClient() {
  return createJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
}

/**
 * Admin client — bypasses RLS using the service role key.
 * Use ONLY in server code where you need to bypass security
 * (like Cloudinary signing or admin-only operations). Never import
 * into a 'use client' component.
 */
export function createServiceClient() {
  return createJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}