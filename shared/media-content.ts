import type { MediaFeedItem, PartnerRecord } from './types.js';

export const mediaSources = {
  youtube: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCrgxh4FbbI4j0prD_KkIqfA',
  appleLookup: 'https://itunes.apple.com/lookup?id=1514645020',
  apple: 'https://podcasts.apple.com/gb/podcast/the-carpentry-show-on-fix-radio-podcast/id1514645020',
  spotify: 'https://open.spotify.com/show/4XkTEAQCn7uxoXjxJ74VgV',
  fixRadio: 'https://www.fixradio.co.uk/listen/podcasts/the-carpentry-show/',
  fixRadioLive: 'https://www.fixradio.co.uk/listen/live/',
} as const;

export const curatedInterviews: MediaFeedItem[] = [
  {
    key: 'who-is-robin-clevett',
    kind: 'interview',
    title: 'Who Is Robin Clevett?',
    outlet: 'The Carpentry Show · Fix Radio',
    published: '2021-02-19T13:45:49.000Z',
    url: 'https://www.spreaker.com/episode/37-who-is-robin-clevett--43543300',
    description: 'A first-person conversation about Robin’s route into carpentry, his work and the trade.',
  },
  {
    key: 'carpentry-roundtable',
    kind: 'interview',
    title: 'Carpentry Roundtable with Robin Clevett',
    outlet: 'Fix Radio',
    published: '2022-01-18T18:00:00.000Z',
    url: 'https://www.fixradio.co.uk/features/carpentry-roundtable/',
    description: 'Robin hosts a trade roundtable on tools, product development and tool theft.',
  },
];

export const curatedPress: MediaFeedItem[] = [
  {
    key: 'professional-woodworking-expo-advisory-board',
    kind: 'press',
    title: 'Robin Clevett · Advisory Board member',
    outlet: 'Professional Woodworking Expo',
    published: '2026-06-01T00:00:00.000Z',
    url: 'https://www.professionalwoodworkingexpo.com/meet-pwe26-advisory-board/robin-clevett-6mvr',
  },
  {
    key: 'pwe-brand-ambassador',
    kind: 'press',
    title: 'Carpentry champion announced as Brand Ambassador',
    outlet: 'Professional Woodworking & Timber',
    published: '2025-09-04T00:00:00.000Z',
    url: 'https://www.pwtmag.co.uk/post/carpentry-champion-robin-clevett-announced-as-professional-woodworking-expo-2026-brand-ambassador',
  },
  {
    key: 'fit-show-ambassador',
    kind: 'press',
    title: 'Robin Clevett joins the FIT Show line-up',
    outlet: 'FIT Show News',
    published: '2025-02-01T00:00:00.000Z',
    url: 'https://profinder.eu/inst-feb25.pdf',
  },
];

const partnerDate = '2026-11-18T00:00:00.000Z';
export const seededPartners: PartnerRecord[] = [
  {
    id: 'hazardco', name: 'HazardCo', url: 'https://www.hazardco.com/uk/', logoPath: '/partners/hazardco.svg',
    evidenceUrl: 'https://www.hazardco.com/uk/', position: 10, active: true, createdAt: partnerDate, updatedAt: partnerDate,
  },
  {
    id: 'stairbox', name: 'StairBox', url: 'https://www.stairbox.com/', logoPath: '/partners/stairbox.svg',
    evidenceUrl: 'https://uk.linkedin.com/in/jadegriffin1', position: 20, active: true, createdAt: partnerDate, updatedAt: partnerDate,
  },
  {
    id: 'tools-and-jigs', name: 'Tools & Jigs', url: 'https://toolsandjigs.com/', logoPath: '/partners/tools-and-jigs.png',
    evidenceUrl: 'https://toolsandjigs.com/', position: 30, active: true, createdAt: partnerDate, updatedAt: partnerDate,
  },
  {
    id: 'festool', name: 'Festool', url: 'https://www.festool.co.uk/', logoPath: '/partners/festool.svg',
    evidenceUrl: 'https://www.fixradio.co.uk/listen/podcasts/the-carpentry-show/', position: 40, active: true, createdAt: partnerDate, updatedAt: partnerDate,
  },
  {
    id: 'hilti', name: 'Hilti', url: 'https://www.hilti.co.uk/', logoPath: '/partners/hilti.svg',
    evidenceUrl: 'https://www.linkedin.com/posts/robin-clevett-fioc-504a627_joinery-carpentry-building-activity-7438966391145172993-m5Lw', position: 50, active: true, createdAt: partnerDate, updatedAt: partnerDate,
  },
  {
    id: 'diamondback', name: 'Diamondback Toolbelts', url: 'https://toolbelts.com/', logoPath: '/partners/diamondback.png',
    evidenceUrl: 'https://www.fixradio.co.uk/fix-feed/construction-news/post/diamondbacks-connor-crook-outlines-plans-for-product-expansion-in-carpentry-show-interview/', position: 60, active: true, createdAt: partnerDate, updatedAt: partnerDate,
  },
];
