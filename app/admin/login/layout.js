// Force this route to be rendered on demand (never at build time).
// Prevents prerender errors from hooks like useSearchParams.
export const dynamic = 'force-dynamic';

export default function LoginLayout({ children }) {
  return children;
}