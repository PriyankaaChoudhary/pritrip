import './globals.css';

export const metadata = {
  title: 'PriTrip — trip planning, but honest',
  description: "Real trip guides from someone who's actually been.",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

// This script runs before React and sets the theme class on <html>,
// preventing a "flash of wrong theme" on page load
const themeInitScript = `
(function() {
  try {
    var scope = window.location.pathname.startsWith('/admin') ? 'admin' : 'public';
    var key = 'pritrip-theme-' + scope;
    var stored = localStorage.getItem(key);
    var theme;
    if (stored === 'light' || stored === 'dark') {
      theme = stored;
    } else {
      theme = scope === 'admin' ? 'dark' : 'light';
    }
    var html = document.documentElement;
    html.classList.remove('light', 'dark');
    html.classList.add(theme);
    html.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}