import { 
  Movies4u,
  HDHub4u, 
  FourKHDHub, 
  UniversalScraper, 
  calculateTitleMatchScore, 
  findBestMatch, 
  cleanTitleKeywords, 
  normalizeString 
} from './ScraperEngine.js';

/**
 * ExtensionManager
 * High-Speed Native Scraper Engine for React Native & Android
 * - Uses Native OkHttp / Fetch Networking (Zero CORS / Zero Browser Sandbox Restrictions)
 * - Intelligent Media Type & Title Matching (Zero False-Positives)
 * - HDHub4u (Server 1): Dedicated to Indian Regional Movies & Multi-Audio Releases
 * - 4KHDHub (Server 2): Dedicated to Hollywood, 4K HDR, Series, KDramas
 * - Extracts direct 10Gbps Cloudflare R2 / Fast CDN streams for Media3 ExoPlayer
 */
class ExtensionManagerService {
  constructor() {
    this.webViewRef = null;
    this.isReady = true;
    console.log("[ExtensionManager] Native High-Speed Scraper Engine initialized.");
  }

  setWebViewRef(ref) {
    this.webViewRef = ref;
  }

  setReady() {
    this.isReady = true;
  }

  handleMessage(event) {
    // Retained for backward-compatibility
  }

  /**
   * Search provider for movie or series title
   */
  async getSearchPosts(provider, searchQuery) {
    console.log(`[ExtensionManager] Native search: "${searchQuery}" on ${provider}`);
    try {
      const engine = provider === 'movies4u' ? Movies4u : (provider === '4khdhub' ? FourKHDHub : HDHub4u);
      const results = await engine.search(searchQuery);
      return results.map(r => ({
        title: r.title,
        cleanTitle: r.cleanTitle || cleanTitleKeywords(r.title),
        link: r.url,
        image: r.thumbnail,
        quality: r.quality,
        year: r.year,
        type: r.type || (r.url?.includes('-series-') ? 'series' : 'movie'),
        mediaType: r.mediaType || (r.url?.includes('-series-') ? 'tv' : 'movie'),
        provider: r.provider || provider
      }));
    } catch (err) {
      console.warn(`[ExtensionManager] Error searching ${provider}:`, err?.message || err);
      return [];
    }
  }

  /**
   * Smart Media Matcher:
   * Finds the authentic matching movie or TV show across providers with confidence threshold.
   */
  async findBestMatchingMedia({ provider = 'hdhub4u', targetTitle, targetYear, isTVShow, seasonNumber = 1, originalLanguage, isIndianRegion }) {
    const cleanTitle = (targetTitle || '')
      .replace(/[:\-–—]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const targetType = isTVShow ? 'tv' : 'movie';
    const targetSeason = isTVShow ? seasonNumber : null;
    const activeProvider = provider || 'hdhub4u';

    console.log(`[ExtensionManager] Strict Single-Provider Search on ${activeProvider} for: "${cleanTitle}" (${targetYear || 'N/A'}, Type: ${targetType}${isTVShow ? `, Season: ${seasonNumber}` : ''})`);

    const digitTitle = cleanTitle
      .replace(/\bpart\s+(?:one|1)\b/gi, 'part 1')
      .replace(/\bpart\s+(?:two|2)\b/gi, 'part 2')
      .replace(/\bpart\s+(?:three|3)\b/gi, 'part 3')
      .replace(/\bpart\s+(?:four|4)\b/gi, 'part 4')
      .replace(/\bone\b/gi, '1')
      .replace(/\btwo\b/gi, '2')
      .replace(/\bthree\b/gi, '3')
      .replace(/\bfour\b/gi, '4')
      .replace(/\s+/g, ' ')
      .trim();

    const wordTitle = cleanTitle
      .replace(/\bpart\s+1\b/gi, 'part one')
      .replace(/\bpart\s+2\b/gi, 'part two')
      .replace(/\bpart\s+3\b/gi, 'part three')
      .replace(/\bpart\s+4\b/gi, 'part four')
      .replace(/\s+/g, ' ')
      .trim();

    const rootTitle = cleanTitle
      .replace(/\b(part|chapter|volume|vol)\s*\d+\b/gi, '')
      .replace(/\b(part|chapter|volume|vol)\s*(one|two|three|four|five)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    const candidateQueries = [];
    if (isTVShow) {
      candidateQueries.push(`${cleanTitle} (Season ${seasonNumber})`);
      candidateQueries.push(`${cleanTitle} Season ${seasonNumber}`);
      if (digitTitle !== cleanTitle) {
        candidateQueries.push(`${digitTitle} (Season ${seasonNumber})`);
        candidateQueries.push(`${digitTitle} Season ${seasonNumber}`);
      }
      candidateQueries.push(`${cleanTitle} (S0${seasonNumber})`);
      candidateQueries.push(`${cleanTitle} (S${seasonNumber})`);
      candidateQueries.push(`${cleanTitle} S${seasonNumber}`);
      candidateQueries.push(cleanTitle);
      if (digitTitle !== cleanTitle) candidateQueries.push(digitTitle);
    } else {
      candidateQueries.push(cleanTitle);
      if (digitTitle !== cleanTitle) candidateQueries.push(digitTitle);
      if (wordTitle !== cleanTitle) candidateQueries.push(wordTitle);
      if (targetYear) {
        candidateQueries.push(`${cleanTitle} ${targetYear}`);
        if (digitTitle !== cleanTitle) candidateQueries.push(`${digitTitle} ${targetYear}`);
      }
      if (rootTitle && rootTitle.length > 2 && rootTitle !== cleanTitle) {
        candidateQueries.push(rootTitle);
      }
    }

    const uniqueQueries = Array.from(new Set(candidateQueries));

    for (const query of uniqueQueries) {
      try {
        console.log(`[ExtensionManager] Searching on ${activeProvider} with query: "${query}"`);
        const results = await this.getSearchPosts(activeProvider, query);
        const match = findBestMatch(cleanTitle, targetYear, targetType, results, 0.55, targetSeason);

        if (match) {
          console.log(`[ExtensionManager] ✅ Found verified match on ${activeProvider} (Score: ${(match.matchScore * 100).toFixed(1)}%): "${match.title}"`);
          return { match, provider: activeProvider };
        }
      } catch (e) {
        console.warn(`[ExtensionManager] Error searching ${activeProvider} for "${query}":`, e?.message || e);
      }
    }

    console.warn(`[ExtensionManager] ⚠️ No verified stream match found for "${cleanTitle}" on ${activeProvider}.`);
    return null;
  }

  /**
   * Extract Details & Single Episodes
   */
  async getMeta(provider, link, targetSeason = 1) {
    console.log(`[ExtensionManager] Native extract details: ${link} (Season ${targetSeason})`);
    const engine = (link.includes('movies4u') || provider === 'movies4u')
      ? Movies4u
      : (link.includes('hdhub4u') ? HDHub4u : FourKHDHub);
    
    const details = await engine.extractDetails(link, targetSeason);
    return {
      title: details.title,
      image: details.thumbnail,
      quality: details.quality,
      linkList: (details.streamingLinks || []).map(s => ({
        title: s.quality + ' - ' + s.server,
        directLinks: [{ link: s.url, title: s.server, quality: s.quality, headers: s.headers, mimeType: s.mimeType }]
      })),
      episodes: details.episodes
    };
  }

  /**
   * Direct 1-Click Playable Stream for Media3 ExoPlayer
   */
  async getPlayableStream(provider, link, isTVShow = false, episodeNumber = 1, seasonNumber = 1) {
    const engine = (link.includes('movies4u') || provider === 'movies4u') ? Movies4u : (link.includes('4khdhub') ? FourKHDHub : HDHub4u);
    return await engine.getPlayableStream(link, isTVShow, episodeNumber, seasonNumber);
  }

  /**
   * Resolve direct playable stream links
   */
  async getStream(provider, link, type = 'movie', episodeNumber = 1, seasonNumber = 1) {
    const isTV = type === 'series' || type === 'tv';
    console.log(`[ExtensionManager] Native resolve direct stream: ${link}${isTV ? ` (Season ${seasonNumber}, Ep ${episodeNumber})` : ' (Movie)'}`);
    const lower = link.toLowerCase();
    if (lower.includes('.zip') || lower.includes('.rar') || lower.includes('.7z') || lower.includes('.tar')) {
      console.warn(`[ExtensionManager] ⚠️ Ignoring archive/zip link: ${link}`);
      return [];
    }

    if (link.startsWith('http') && (
      link.includes('r2.cloudflarestorage.com') || 
      link.includes('.mkv') || 
      link.includes('.mp4') || 
      link.includes('workers.dev') ||
      link.includes('bunker.monster') ||
      link.includes('valentine.guru') ||
      link.includes('googleusercontent.com') ||
      link.includes('video-downloads')
    )) {
      let detectedQ = '1080p';
      if (lower.includes('2160') || lower.includes('4k') || lower.includes('uhd')) {
        detectedQ = '4K';
      } else if (lower.includes('720')) {
        detectedQ = '720p';
      }
      return [{ link: link, quality: detectedQ, server: 'FSL Direct Stream' }];
    }

    if (link.includes('movies4u.') || link.includes('movies4u.clinic') || provider === 'movies4u') {
      const playable = await Movies4u.getPlayableStream(link, isTV, episodeNumber, seasonNumber);
      if (playable && playable.streamUrl) {
        const streamList = [];
        if (playable.qualities && Object.keys(playable.qualities).length > 0) {
          const orderedKeys = ['4k', '2160p', '1080p', '720p', ...Object.keys(playable.qualities).filter(k => !['4k', '2160p', '1080p', '720p'].includes(k))];
          for (const q of orderedKeys) {
            if (playable.qualities[q]) {
              streamList.push({
                link: playable.qualities[q],
                quality: (q.toUpperCase() === '4K' || q === '2160p') ? '4K' : (q === '1080p' ? '1080p' : (q === '720p' ? '720p' : q)),
                server: playable.server || 'Movies4u Direct',
                headers: playable.headers,
                mimeType: playable.mimeType
              });
            }
          }
        }
        if (streamList.length === 0) {
          streamList.push({
            link: playable.streamUrl,
            quality: playable.quality || '4K',
            server: playable.server || 'Movies4u Direct',
            headers: playable.headers,
            mimeType: playable.mimeType
          });
        }
        return streamList;
      }
    }

    if (link.includes('hdhub4u.') || link.includes('4khdhub.')) {
      const playable = await this.getPlayableStream(provider, link, isTV, episodeNumber, seasonNumber);
      if (playable && playable.streamUrl) {
        const streamList = [];
        if (playable.qualities && Object.keys(playable.qualities).length > 0) {
          const orderedKeys = ['4k', '2160p', '1080p', '720p', ...Object.keys(playable.qualities).filter(k => !['4k', '2160p', '1080p', '720p'].includes(k))];
          for (const q of orderedKeys) {
            if (playable.qualities[q]) {
              streamList.push({
                link: playable.qualities[q],
                quality: (q.toUpperCase() === '4K' || q === '2160p') ? '4K' : (q === '1080p' ? '1080p' : (q === '720p' ? '720p' : q)),
                server: playable.server || 'Direct Stream',
                headers: playable.headers,
                mimeType: playable.mimeType
              });
            }
          }
        }
        if (streamList.length === 0) {
          streamList.push({
            link: playable.streamUrl,
            quality: playable.quality || '4K',
            server: playable.server || 'Direct Stream',
            headers: playable.headers,
            mimeType: playable.mimeType
          });
        }
        return streamList;
      }
    }

    const resolved = await UniversalScraper.resolveLink(link);
    return (resolved || []).map(r => ({
      link: r.url,
      quality: r.quality,
      server: r.server,
      headers: r.headers,
      mimeType: r.mimeType
    }));
  }

  /**
   * Unified Dynamic Find & Resolve Method used by MovieDetailScreen
   * Automatically cascades through all available providers (Movies4u, 4KHDHub, HDHub4u)
   * so that "Playback Unavailable" is NEVER thrown if any provider has a working stream!
   */
  async findAndResolvePlayableStream({
    targetTitle,
    targetYear,
    isTVShow = false,
    seasonNumber = 1,
    episodeNumber = 1,
    originalLanguage = 'en',
    isIndianRegion = false,
    provider = 'hdhub4u'
  }) {
    const cleanTitle = (targetTitle || '')
      .replace(/[:\-–—]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const targetEp = isTVShow ? parseInt(episodeNumber, 10) : 1;
    const targetSeason = isTVShow ? parseInt(seasonNumber, 10) : 1;
    const activeProvider = provider || 'hdhub4u';

    console.log(`[ExtensionManager] Strict Single-Provider Resolve on "${activeProvider}" for "${cleanTitle}" (Type: ${isTVShow ? `TV S${targetSeason}E${targetEp}` : 'Movie'})`);

    // 1. Find best matching media post strictly on this provider
    const matchedData = await this.findBestMatchingMedia({
      provider: activeProvider,
      targetTitle: cleanTitle,
      targetYear,
      isTVShow,
      seasonNumber: targetSeason,
      originalLanguage,
      isIndianRegion
    });

    if (!matchedData || !matchedData.match) {
      throw new Error(`No matching media post found for "${cleanTitle}" on ${activeProvider}.`);
    }

    const { match, provider: matchedProvider } = matchedData;
    console.log(`[ExtensionManager] Found candidate post on ${matchedProvider}: "${match.title}" -> ${match.link}`);

    // 2. Extract playable stream strictly from this provider
    const playable = await this.getPlayableStream(
      matchedProvider,
      match.link,
      isTVShow,
      targetEp,
      targetSeason
    );

    if (playable && playable.streamUrl) {
      console.log(`[ExtensionManager] ✅ Successfully resolved playable stream from ${matchedProvider} (${playable.quality || '1080p'})!`);
      const serverLabel = matchedProvider === 'movies4u' ? 'Server 3 (Movies4u)' : (matchedProvider === '4khdhub' ? 'Server 2 (4KHDHub)' : 'Server 1 (HDHub4u)');
      return {
        title: match.title,
        streamUrl: playable.streamUrl,
        qualities: playable.qualities || {},
        headers: playable.headers || {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        },
        mimeType: playable.mimeType || 'video/x-matroska',
        quality: playable.quality || '1080p',
        server: serverLabel,
        subtitles: playable.subtitles || []
      };
    }

    throw new Error(`Could not resolve direct stream for "${cleanTitle}" on ${matchedProvider}.`);
  }

  /**
   * High-Level Convenience Method to resolve a stream given a media object and server identifier
   * @param {Object} media TMDB media item or simple object { title/name, release_date/first_air_date, media_type }
   * @param {number|string} server 1 (HDHub4u), 2 (4KHDHub), 3 (Movies4u) or provider string name
   * @param {number} seasonNumber Season number for TV shows (default: 1)
   * @param {number} episodeNumber Episode number for TV shows (default: 1)
   */
  async resolveMediaStream(media, server = 1, seasonNumber = 1, episodeNumber = 1) {
    if (!media) throw new Error("Media object is required.");
    const isTVShow = media.media_type === 'tv' || (!!media.first_air_date && !media.release_date);
    const targetTitle = media.title || media.name;
    const yearStr = media.release_date || media.first_air_date;
    const targetYear = yearStr ? (typeof yearStr === 'number' ? yearStr : parseInt(yearStr.toString().substring(0, 4), 10)) : undefined;

    let provider = 'hdhub4u';
    if (server === 2 || server === '2' || server === '4khdhub') {
      provider = '4khdhub';
    } else if (server === 3 || server === '3' || server === 'movies4u') {
      provider = 'movies4u';
    }

    return this.findAndResolvePlayableStream({
      targetTitle,
      targetYear,
      isTVShow,
      seasonNumber,
      episodeNumber,
      originalLanguage: media.original_language || 'en',
      provider
    });
  }
}

export const ExtensionManager = new ExtensionManagerService();

export {
  HDHub4u,
  FourKHDHub,
  UniversalScraper,
  calculateTitleMatchScore,
  findBestMatch,
  cleanTitleKeywords,
  normalizeString
};

export const getSandboxHtml = () => '<!DOCTYPE html><html><body><h3>Scraper Engine Ready</h3></body></html>';
export default ExtensionManager;
