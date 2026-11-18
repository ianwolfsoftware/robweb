import { curatedInterviews, curatedPress, mediaSources } from '../shared/media-content.js';
import type { MediaFeedItem } from '../shared/types.js';

const HOUR = 60 * 60_000;

type FeedResult = {
  fetchedAt: string;
  youtube: MediaFeedItem[];
  episodes: MediaFeedItem[];
  counts: { youtube: number; episodes: number };
  podcastFeedUrl: string;
};

function decode(value = '') {
  return value
    .replace(/^<!\[CDATA\[|\]\]>$/g, '')
    .replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<').replaceAll('&gt;', '>').trim();
}

function tag(xml: string, name: string) {
  const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return decode(match?.[1]);
}

function attribute(xml: string, name: string, attributeName: string) {
  const match = xml.match(new RegExp(`<${name}\\b[^>]*\\b${attributeName}=["']([^"']+)["'][^>]*>`, 'i'));
  return decode(match?.[1]);
}

function isoDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? new Date(0).toISOString() : date.toISOString();
}

function parseYoutube(xml: string) {
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].map((match) => match[1]);
  return entries.map((entry): MediaFeedItem => {
    const key = tag(entry, 'yt:videoId');
    return {
      key,
      kind: 'youtube',
      title: tag(entry, 'title'),
      url: `https://www.youtube.com/watch?v=${encodeURIComponent(key)}`,
      published: isoDate(tag(entry, 'published')),
      outlet: 'Robin Clevett · YouTube',
      thumbnailUrl: attribute(entry, 'media:thumbnail', 'url') || `https://i.ytimg.com/vi/${encodeURIComponent(key)}/hqdefault.jpg`,
    };
  }).filter((item) => item.key && item.title);
}

function parsePodcast(xml: string) {
  const items = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);
  return items.map((item): MediaFeedItem => {
    const guid = tag(item, 'guid');
    const key = guid.match(/(\d+)(?:\D*)$/)?.[1] || Buffer.from(guid || tag(item, 'link')).toString('base64url').slice(0, 48);
    return {
      key,
      kind: 'episode',
      title: tag(item, 'title'),
      url: tag(item, 'link'),
      published: isoDate(tag(item, 'pubDate')),
      outlet: 'The Carpentry Show · Fix Radio',
      description: tag(item, 'description').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 280),
      audioUrl: attribute(item, 'enclosure', 'url'),
      thumbnailUrl: attribute(item, 'itunes:image', 'href'),
      duration: tag(item, 'itunes:duration'),
    };
  }).filter((item) => item.key && item.title && item.url);
}

export class MediaFeeds {
  private cached: { expiresAt: number; value: FeedResult } | null = null;

  constructor(private readonly fetcher: typeof fetch = fetch) {}

  async get() {
    if (this.cached && this.cached.expiresAt > Date.now()) return this.cached.value;
    const [youtubeResponse, lookupResponse] = await Promise.all([
      this.fetcher(mediaSources.youtube, { headers: { 'user-agent': 'Robweb/0.2 media-cache' }, signal: AbortSignal.timeout(8_000) }),
      this.fetcher(mediaSources.appleLookup, { headers: { 'user-agent': 'Robweb/0.2 media-cache' }, signal: AbortSignal.timeout(8_000) }),
    ]);
    if (!youtubeResponse.ok || !lookupResponse.ok) throw new Error('Media feed upstream unavailable');
    const lookup = await lookupResponse.json() as { results?: Array<{ feedUrl?: string }> };
    const podcastFeedUrl = lookup.results?.[0]?.feedUrl;
    if (!podcastFeedUrl || !podcastFeedUrl.startsWith('https://')) throw new Error('Apple lookup did not return a safe podcast feed URL');
    const podcastResponse = await this.fetcher(podcastFeedUrl, { headers: { 'user-agent': 'Robweb/0.2 media-cache' }, signal: AbortSignal.timeout(8_000) });
    if (!podcastResponse.ok) throw new Error('Podcast feed upstream unavailable');
    const [youtubeXml, podcastXml] = await Promise.all([youtubeResponse.text(), podcastResponse.text()]);
    const youtube = parseYoutube(youtubeXml);
    const episodes = parsePodcast(podcastXml);
    const value = {
      fetchedAt: new Date().toISOString(), youtube: youtube.slice(0, 24), episodes: episodes.slice(0, 24),
      counts: { youtube: youtube.length, episodes: episodes.length }, podcastFeedUrl,
    };
    this.cached = { expiresAt: Date.now() + HOUR, value };
    return value;
  }
}

export const staticMedia = { interviews: curatedInterviews, press: curatedPress };
export const mediaFeedParsers = { parseYoutube, parsePodcast };
