export type Route = {
  path: string;
  title: string;
  description: string;
  navLabel?: string;
};

export const routes: Route[] = [
  { path: '/', title: 'Robin Clevett | Construction', description: 'Construction projects, practical videos, tools and RC Calculators.', navLabel: 'Home' },
  { path: '/about/', title: 'About Robin Clevett', description: 'Robin Clevett: construction industry fanatic, sharing work and practical knowledge.', navLabel: 'About' },
  { path: '/services/', title: 'Construction services | Robin Clevett', description: 'A clear overview of Robin Clevett construction services.', navLabel: 'Services' },
  { path: '/projects/', title: 'Projects | Robin Clevett', description: 'Selected construction project imagery from Robin Clevett.', navLabel: 'Projects' },
  { path: '/videos/', title: 'Videos | Robin Clevett', description: 'Recent practical videos from Robin Clevett.', navLabel: 'Videos' },
  { path: '/tools-and-jigs/', title: 'Tools and Jigs | Robin Clevett', description: 'Visit Robin Clevett’s Tools and Jigs store.', navLabel: 'Tools & Jigs' },
  { path: '/contact/', title: 'Contact | Robin Clevett', description: 'How to get in touch with Robin Clevett.', navLabel: 'Contact' },
  { path: '/calculator-app/', title: 'RC Calculators | Robin Clevett', description: 'The RC Calculators app landing page.' },
  { path: '/calculator-app/privacy/', title: 'RC Calculators privacy | Robin Clevett', description: 'Privacy information for RC Calculators.' },
  { path: '/calculator-app/terms/', title: 'RC Calculators terms | Robin Clevett', description: 'Terms of use for RC Calculators.' },
];

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

export const shopUrl = 'https://toolsandjigs.com/?utm_source=robweb&utm_medium=website&utm_campaign=public-shell';
