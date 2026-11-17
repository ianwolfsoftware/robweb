import redirects from '../content/redirects.json';

export type Route = {
  path: string;
  title: string;
  description: string;
  navLabel?: string;
  sitemap?: boolean;
};

export const routes: Route[] = [
  { path: '/', title: 'Robin Clevett | Tools & RC Calculators', description: 'Shop Robin Clevett’s Tools & Jigs products and discover the RC Calculators app.', navLabel: 'Home' },
  { path: '/shop/', title: 'Shop | Robin Clevett', description: 'Browse the live Tools & Jigs product range, then buy from the official Shopify store.', navLabel: 'Shop' },
  { path: '/app/', title: 'RC Calculators | Robin Clevett', description: 'Metric-first RC Calculators for practical construction work.', navLabel: 'App' },
  { path: '/contact/', title: 'Contact | Robin Clevett', description: 'How to get in touch with Robin Clevett.', navLabel: 'Contact' },
  { path: '/legal/privacy/', title: 'Privacy notice | Robin Clevett', description: 'How the Robin Clevett website handles personal information.' },
  { path: '/legal/terms/', title: 'Website terms | Robin Clevett', description: 'Terms for using the Robin Clevett website.' },
  { path: '/legal/disclaimer/', title: 'Disclaimer | Robin Clevett', description: 'Important limits for construction information on this website.' },
  { path: '/legal/cookies/', title: 'Cookie notice | Robin Clevett', description: 'Analytics and privacy choices on the Robin Clevett website.' },
  { path: '/calculator-app/', title: 'RC Calculators | Robin Clevett', description: 'The preserved RC Calculators app landing page.', sitemap: false },
  { path: '/calculator-app/privacy/', title: 'RC Calculators privacy | Robin Clevett', description: 'Privacy information for RC Calculators.' },
  { path: '/calculator-app/terms/', title: 'RC Calculators terms | Robin Clevett', description: 'Terms of use for RC Calculators.' },
  { path: '/404/', title: 'Page not found | Robin Clevett', description: 'That page could not be found.', sitemap: false },
  { path: '/admin/', title: 'Robweb admin', description: 'Secure content administration.', sitemap: false },
  { path: '/admin/pages/', title: 'Pages | Robweb admin', description: 'Manage structured Robweb content.', sitemap: false },
  { path: '/admin/media/', title: 'Media | Robweb admin', description: 'Manage Robweb media.', sitemap: false },
  { path: '/admin/forms/', title: 'Forms | Robweb admin', description: 'Manage form responses.', sitemap: false },
  { path: '/admin/analytics/', title: 'Analytics | Robweb admin', description: 'Review aggregate site analytics.', sitemap: false },
  { path: '/admin/users/', title: 'Users | Robweb admin', description: 'Manage admin users.', sitemap: false },
  { path: '/admin/settings/', title: 'Settings | Robweb admin', description: 'Manage Robweb settings.', sitemap: false },
  { path: '/admin/login/', title: 'Sign in | Robweb admin', description: 'Secure Robweb admin sign in.', sitemap: false },
  { path: '/admin/set-password/', title: 'Set password | Robweb admin', description: 'Complete a secure Robweb invitation.', sitemap: false },
];

export const legacyRedirects: Record<string, string> = redirects;

export const navRoutes = routes.filter((route) => route.navLabel);

export function normalisePath(path: string) {
  if (path === '/') return path;
  return path.endsWith('/') ? path : `${path}/`;
}

export function routeFor(path: string) {
  return routes.find((route) => route.path === normalisePath(path)) ?? null;
}

export const projectImages = [
  {
    src: '/source/2014/07/Breaking-through1-1024x768.jpg',
    alt: 'Brickwork detail during a construction project',
    label: 'Detail work',
  },
  {
    src: '/source/2014/07/New-pavilion-being-constructed-1024x768.jpg',
    alt: 'A pavilion construction project in progress',
    label: 'Pavilion build',
  },
  {
    src: '/source/2014/07/Completed-work-1024x768.jpg',
    alt: 'Completed work from a Robin Clevett project',
    label: 'Completed work',
  },
  {
    src: '/source/2014/07/New-interior1-1024x768.jpg',
    alt: 'A finished interior within a construction project',
    label: 'Interior finish',
  },
];

export function shopUrl(sourcePath: string, target = 'https://toolsandjigs.com/') {
  return `/go/shop?source=${encodeURIComponent(sourcePath)}&target=${encodeURIComponent(target)}`;
}

export function productUrl(handle: string, sourcePath = '/shop/product/') {
  return `/go/shop?product=${encodeURIComponent(handle)}&source=${encodeURIComponent(sourcePath)}`;
}
