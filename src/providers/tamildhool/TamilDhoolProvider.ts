/**
 * TamilDhool Provider for Stitch-Nexplay & React Native
 * 
 * Features:
 * - Direct integration with Stitch-Nexplay ExtensionManager & ScraperEngine
 * - Native Bunny Stream CDN (.m3u8) extraction with zero ads or popups
 * - Automatic HTTP headers generation (Referer & Origin) for ExoPlayer / Media3
 * - Serial Episode & Movie title matching
 */

import { 
  DEFAULT_BUNNY_CDN_HOST, 
  REQUIRED_STREAM_HEADERS, 
  extractStreamsFromHtml,
  parseMediaRequest,
  buildProviderUrl
} from './extractor.js';
import { parseDateInput } from './TamilGunProvider.js';

export interface TamilDhoolSearchResult {
  title: string;
  cleanTitle: string;
  link: string;
  image: string;
  quality: string;
  year: number;
  type: 'series' | 'movie';
  mediaType: 'tv' | 'movie';
  provider: 'tamildhool';
}

export interface TamilDhoolStreamLink {
  quality: string;
  server: string;
  url: string;
  headers: Record<string, string>;
  mimeType: string;
}

export interface TamilDhoolDetails {
  title: string;
  url: string;
  quality: string;
  thumbnail?: string;
  streamingLinks: TamilDhoolStreamLink[];
  downloadLinks: any[];
  episodes: Array<{
    seasonNumber: number;
    episodeNumber: number;
    title: string;
    bridges: any[];
    links: TamilDhoolStreamLink[];
  }>;
}

export interface TamilDhoolPlayableStream {
  streamUrl: string;
  quality: string;
  server: string;
  headers: Record<string, string>;
  mimeType: string;
  qualities: Record<string, string>;
  thumbnail?: string;
}

type HttpGetFunction = (url: string, referer?: string, timeoutMs?: number) => Promise<string>;

export class TamilDhoolClient {
  public readonly baseUrl: string = "https://www.tamildhool.tech";
  public readonly providerName: string = "tamildhool";
  public readonly mirrors: string[] = [
    "https://www.tamildhool.tech",
    "https://tamildhool.tech"
  ];

  /**
   * Internal HTTP GET helper with standard headers
   */
  private async defaultHttpGet(url: string, referer: string = ""): Promise<string> {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        ...(referer ? { 'Referer': referer } : {})
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
    return await res.text();
  }

  /**
   * Search for Tamil serials or movies on TamilDhool
   * Fully compatible with Stitch-Nexplay's ExtensionManager.getSearchPosts()
   */
  async search(query: string, customHttpGet?: HttpGetFunction): Promise<TamilDhoolSearchResult[]> {
    const fetchFn = customHttpGet || this.defaultHttpGet.bind(this);
    const cleanQuery = query.replace(/[:\-?"']/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanQuery) return [];

    const searchUrl = `${this.baseUrl}/?s=${encodeURIComponent(cleanQuery)}`;
    let html = '';
    try {
      html = await fetchFn(searchUrl, this.baseUrl, 5000);
    } catch (err) {
      console.warn(`[TamilDhool] Search error for "${cleanQuery}":`, err);
      return [];
    }

    if (!html || html.includes("<title>Just a moment...</title>")) {
      return [];
    }

    const results: TamilDhoolSearchResult[] = [];
    const postRegex = /<article[^>]*id="post-(\d+)"[^>]*>([\s\S]*?)<\/article>/gi;
    let m: RegExpExecArray | null;

    while ((m = postRegex.exec(html)) !== null) {
      const postBody = m[2];
      const linkMatch = postBody.match(/<a\s+[^>]*href=["'](https?:\/\/[^"']*tamildhool\.tech\/[^"']+)["'][^>]*>/i);
      const titleMatch = postBody.match(/<h[1-6][^>]*class=["'][^"']*entry-title[^"']*["'][^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i) ||
                         postBody.match(/title=["']([^"']+)["']/i);
      const imgMatch = postBody.match(/src=["'](https?:\/\/[^"']+\.(?:jpg|png|webp))["']/i);
      const catMatch = postBody.match(/rel=["']category tag["'][^>]*>([\s\S]*?)<\/a>/i);

      if (linkMatch && titleMatch) {
        const rawTitle = titleMatch[1].replace(/<[^>]+>/g, '').trim();
        const link = linkMatch[1];
        const image = imgMatch ? imgMatch[1] : '';
        const yearMatch = rawTitle.match(/\b(19\d{2}|20\d{2})\b/);
        const year = yearMatch ? parseInt(yearMatch[1], 10) : 2026;
        const isMovie = link.includes('/movie/') || catMatch?.[1]?.toLowerCase().includes('movie');

        results.push({
          title: rawTitle,
          cleanTitle: rawTitle.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(),
          link,
          image,
          quality: '720p',
          year,
          type: isMovie ? 'movie' : 'series',
          mediaType: isMovie ? 'movie' : 'tv',
          provider: 'tamildhool'
        });
      }
    }

    return results;
  }

  /**
   * Extract Episode / Media Details
   * Fully compatible with Stitch-Nexplay's ExtensionManager.getMeta()
   */
  async extractDetails(pageUrl: string, targetSeason: number = 1, customHttpGet?: HttpGetFunction): Promise<TamilDhoolDetails> {
    const fetchFn = customHttpGet || this.defaultHttpGet.bind(this);
    let html = '';
    try {
      html = await fetchFn(pageUrl, this.baseUrl, 5000);
    } catch (err) {
      console.warn(`[TamilDhool] Error fetching details for ${pageUrl}:`, err);
    }

    const titleMatch = html.match(/<h1[^>]*class=["'][^"']*entry-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i) ||
                       html.match(/<title>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim().replace(/&#038;/g, '&') : "TamilDhool Episode";

    const extracted = extractStreamsFromHtml(html, pageUrl);
    const streamingLinks: TamilDhoolStreamLink[] = [];

    if (extracted.best) {
      streamingLinks.push({
        quality: extracted.best.quality,
        server: extracted.best.server || "Bunny Stream (Master)",
        url: extracted.best.url,
        headers: extracted.best.headers || REQUIRED_STREAM_HEADERS,
        mimeType: "application/x-mpegURL"
      });
    }

    for (const s of extracted.streams) {
      if (s.url !== extracted.best?.url) {
        streamingLinks.push({
          quality: s.quality,
          server: s.server || "Bunny Stream",
          url: s.url,
          headers: s.headers || REQUIRED_STREAM_HEADERS,
          mimeType: "application/x-mpegURL"
        });
      }
    }

    // Parse adjacent episode links for episode navigation
    const episodes = [];
    const epLinks = [...html.matchAll(/<a\s+[^>]*href=["'](https?:\/\/[^"']*tamildhool\.tech\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
    let epCount = 1;
    for (const [ , epUrl, epText ] of epLinks) {
      if (epUrl.includes('-serial/') && !epUrl.endsWith('/kayal/') && !epUrl.endsWith('/sun-tv/')) {
        const cleanEpText = epText.replace(/<[^>]+>/g, '').trim();
        if (cleanEpText && cleanEpText.length > 5) {
          episodes.push({
            seasonNumber: targetSeason || 1,
            episodeNumber: epCount++,
            title: cleanEpText,
            bridges: [{ url: epUrl, label: cleanEpText }],
            links: streamingLinks
          });
        }
      }
    }

    return {
      title,
      url: pageUrl,
      quality: extracted.best?.quality || "720p",
      thumbnail: extracted.thumbnail,
      streamingLinks,
      downloadLinks: [],
      episodes
    };
  }

  /**
   * Direct 1-Click Playable Stream for Media3 ExoPlayer / Expo Video
   * Fully compatible with Stitch-Nexplay's ExtensionManager.getPlayableStream()
   */
  async getPlayableStream(
    pageUrl: string, 
    isTVShow: boolean = false, 
    episodeNumber: number = 1, 
    seasonNumber: number = 1, 
    customHttpGet?: HttpGetFunction
  ): Promise<TamilDhoolPlayableStream | null> {
    const fetchFn = customHttpGet || this.defaultHttpGet.bind(this);
    let html = '';
    try {
      html = await fetchFn(pageUrl, this.baseUrl, 5000);
    } catch (err) {
      console.warn(`[TamilDhool] Error extracting stream for ${pageUrl}:`, err);
      return null;
    }

    const extracted = extractStreamsFromHtml(html, pageUrl);
    if (extracted.streams.length === 0) {
      return null;
    }

    const bestStream = extracted.best || extracted.streams[0];
    const qualities: Record<string, string> = {};
    for (const s of extracted.streams) {
      if (!qualities[s.quality]) {
        qualities[s.quality] = s.url;
      }
    }

    return {
      streamUrl: bestStream.url,
      quality: bestStream.quality,
      server: bestStream.server || "TamilDhool Stream",
      headers: {
        ...(bestStream.headers || REQUIRED_STREAM_HEADERS),
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      },
      mimeType: bestStream.type || "application/x-mpegURL",
      qualities,
      thumbnail: extracted.thumbnail
    };
  }

  /**
   * Universal resolver for direct links
   */
  async resolveLink(rawUrl: string): Promise<TamilDhoolStreamLink[]> {
    if (rawUrl.includes('b-cdn.net') || rawUrl.includes('playlist.m3u8')) {
      return [{
        quality: '720p',
        server: 'Bunny Stream',
        url: rawUrl,
        headers: REQUIRED_STREAM_HEADERS,
        mimeType: 'application/x-mpegURL'
      }];
    }
    return [];
  }

  /**
   * High-accuracy Serial & Date Finder for Media3 Player on TamilDhool
   */
  async findEpisodeByDate(
    serialName: string,
    dateStr?: string,
    channel?: string,
    customHttpGet?: HttpGetFunction
  ): Promise<any | null> {
    const parsedDate = parseDateInput(dateStr);
    const queries: string[] = [];

    if (parsedDate) {
      queries.push(`${serialName} ${parsedDate.formatted}`);
      queries.push(`${serialName} ${parsedDate.formattedShort}`);
      queries.push(`${serialName} ${parsedDate.formattedText}`);
      queries.push(`${serialName} ${parsedDate.day}`);
    }
    queries.push(serialName);

    const candidatePosts: TamilDhoolSearchResult[] = [];
    const seenUrls = new Set<string>();

    for (const q of queries) {
      const results = await this.search(q, customHttpGet);
      for (const r of results) {
        if (!seenUrls.has(r.link)) {
          seenUrls.add(r.link);
          candidatePosts.push(r);
        }
      }
      if (candidatePosts.length >= 10) break;
    }

    if (candidatePosts.length === 0) return null;

    const nameTokens = serialName.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
    let bestMatch: TamilDhoolSearchResult | null = null;
    let highestScore = -1;

    for (const post of candidatePosts) {
      const titleLower = post.title.toLowerCase();
      const linkLower = post.link.toLowerCase();
      let score = 0;

      const matchedTokens = nameTokens.filter(t => titleLower.includes(t) || linkLower.includes(t));
      if (matchedTokens.length === nameTokens.length) {
        score += 50;
      } else {
        score += (matchedTokens.length / nameTokens.length) * 30;
      }

      if (parsedDate) {
        const d1 = parsedDate.formatted.toLowerCase();
        const d2 = parsedDate.formattedShort.toLowerCase();
        const d3 = parsedDate.formattedText.toLowerCase();
        const d4 = `${parsedDate.day}-${parsedDate.month}`;
        const d5 = `${parsedDate.day}`;
        const dayNum = parseInt(parsedDate.day, 10);
        const dayPattern = new RegExp(`day\\s*0?${dayNum}\\b`, 'i');

        if (titleLower.includes(d1) || linkLower.includes(d1)) {
          score += 60;
        } else if (titleLower.includes(d2) || linkLower.includes(d2)) {
          score += 60;
        } else if (titleLower.includes(d3) || linkLower.includes(d3) || linkLower.includes(`${parsedDate.day}th-sep`)) {
          score += 55;
        } else if (dayPattern.test(titleLower) || dayPattern.test(linkLower)) {
          score += 50;
        } else if (titleLower.includes(d4) || linkLower.includes(d4)) {
          score += 40;
        } else if (titleLower.includes(d5) || linkLower.includes(d5)) {
          score += 15;
        }
      } else {
        score += 20;
      }

      if (channel && (titleLower.includes(channel.toLowerCase()) || linkLower.includes(channel.toLowerCase()))) {
        score += 10;
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = post;
      }
    }

    if (!bestMatch) return null;

    const stream = await this.getPlayableStream(bestMatch.link, true, 1, 1, customHttpGet);
    if (!stream) return null;

    return {
      ...stream,
      matchedTitle: bestMatch.title,
      matchedPageUrl: bestMatch.link,
      requestedSerial: serialName,
      requestedDate: dateStr,
      requestedChannel: channel,
      score: highestScore
    };
  }
}

export const TamilDhool = new TamilDhoolClient();
export {
  parseMediaRequest,
  buildProviderUrl,
  extractStreamsFromHtml
};
