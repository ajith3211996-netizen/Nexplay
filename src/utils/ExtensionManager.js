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
      const engine = provider === 'movies4u' ? Movies4u : (provider === 'hdhub4u' ? HDHub4u : FourKHDHub);
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
      // Try alternate provider fallback
      const altEngine = provider === 'hdhub4u' ? FourKHDHub : HDHub4u;
      const altProvider = provider === 'hdhub4u' ? '4khdhub' : 'hdhub4u';
      try {
        const altResults = await altEngine.search(searchQuery);
        return altResults.map(r => ({
          title: r.title,
          cleanTitle: r.cleanTitle || cleanTitleKeywords(r.title),
          link: r.url,
          image: r.thumbnail,
          quality: r.quality,
          year: r.year,
          type: r.type || (r.url?.includes('-series-') ? 'series' : 'movie'),
          mediaType: r.mediaType || (r.url?.includes('-series-') ? 'tv' : 'movie'),
          provider: altProvider
        }));
      } catch (e2) {
        return [];
      }
    }
  }

  /**
   * Smart Media Matcher:
   * Finds the authentic matching movie or TV show across providers with confidence threshold.
   */
  async findBestMatchingMedia({ provider, targetTitle, targetYear, isTVShow, seasonNumber = 1, originalLanguage, isIndianRegion }) {
    const cleanTitle = (targetTitle || '')
      .replace(/[:\-–—]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const targetType = isTVShow ? 'tv' : 'movie';
    const INDIAN_LANGS = ['ta', 'hi', 'te', 'ml', 'kn', 'mr', 'pa', 'bn', 'gu', 'or', 'as'];
    const isIndian = isIndianRegion || (originalLanguage && INDIAN_LANGS.includes(originalLanguage.toLowerCase()));
    
    const defaultProvider = provider === 'movies4u' ? 'movies4u' : (isIndian ? 'hdhub4u' : '4khdhub');
    const primaryProvider = provider || defaultProvider;
    const allProviders = ['movies4u', '4khdhub', 'hdhub4u'];
    const searchOrder = [primaryProvider, ...allProviders.filter(p => p !== primaryProvider)];

    console.log(`[ExtensionManager] Multi-Provider Search for: "${cleanTitle}" (${targetYear || 'N/A'}, Type: ${targetType}${isTVShow ? `, Season: ${seasonNumber}` : ''}) [${searchOrder.join(' -> ')}]`);

    const targetSeason = isTVShow ? seasonNumber : null;

    let primaryQuery = cleanTitle;
    if (isTVShow) {
      primaryQuery = `${cleanTitle} Season ${seasonNumber}`;
    } else if (targetYear) {
      primaryQuery = `${cleanTitle} ${targetYear}`;
    }

    for (const prov of searchOrder) {
      try {
        console.log(`[ExtensionManager] Searching on ${prov} for: "${primaryQuery}"`);
        let results = await this.getSearchPosts(prov, primaryQuery);
        let match = findBestMatch(cleanTitle, targetYear, targetType, results, 0.55, targetSeason);

        if (match) {
          console.log(`[ExtensionManager] ✅ Found verified match on ${prov} (Score: ${(match.matchScore * 100).toFixed(1)}%): "${match.title}"`);
          return { match, provider: prov };
        }

        // Fallback to base clean title on this provider if primaryQuery differed
        if (primaryQuery !== cleanTitle) {
          console.log(`[ExtensionManager] Query "${primaryQuery}" yielded no match on ${prov}. Trying base query: "${cleanTitle}"`);
          results = await this.getSearchPosts(prov, cleanTitle);
          match = findBestMatch(cleanTitle, targetYear, targetType, results, 0.55, targetSeason);

          if (match) {
            console.log(`[ExtensionManager] ✅ Found verified match on ${prov} (Score: ${(match.matchScore * 100).toFixed(1)}%): "${match.title}"`);
            return { match, provider: prov };
          }
        }
      } catch (e) {
        console.warn(`[ExtensionManager] Error searching ${prov}:`, e?.message || e);
      }
    }

    console.warn(`[ExtensionManager] ⚠️ No verified stream match found for "${cleanTitle}" (${targetYear || ''}${isTVShow ? `, Season: ${seasonNumber}` : ''}, Type: ${targetType}) on any provider.`);
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
      const lower = link.toLowerCase();
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
        return [{
          link: playable.streamUrl,
          quality: playable.quality || '1080p',
          server: playable.server || 'Movies4u Direct',
          headers: playable.headers,
          mimeType: playable.mimeType
        }];
      }
    }

    if (link.includes('hdhub4u.') || link.includes('4khdhub.')) {
      const playable = await this.getPlayableStream(provider, link, isTV, episodeNumber, seasonNumber);
      if (playable && playable.streamUrl) {
        const streamList = [];
        if (playable.qualities && Object.keys(playable.qualities).length > 0) {
          const orderedKeys = ['1080p', '4k', '720p', ...Object.keys(playable.qualities).filter(k => !['1080p', '4k', '720p'].includes(k))];
          for (const q of orderedKeys) {
            if (playable.qualities[q]) {
              streamList.push({
                link: playable.qualities[q],
                quality: q.toUpperCase() === '4K' ? '4K' : (q === '1080p' ? '1080p' : (q === '720p' ? '720p' : q)),
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
            quality: playable.quality || '1080p',
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

    const INDIAN_LANGS = ['ta', 'hi', 'te', 'ml', 'kn', 'mr', 'pa', 'bn', 'gu', 'or', 'as'];
    const isIndian = isIndianRegion || (originalLanguage && INDIAN_LANGS.includes(originalLanguage.toLowerCase()));

    // Build intelligent provider priority cascade
    const allProviders = ['movies4u', '4khdhub', 'hdhub4u'];
    let priorityOrder = [];
    if (provider && allProviders.includes(provider)) {
      priorityOrder = [provider, ...allProviders.filter(p => p !== provider)];
    } else if (isIndian) {
      priorityOrder = ['hdhub4u', 'movies4u', '4khdhub'];
    } else {
      priorityOrder = ['movies4u', '4khdhub', 'hdhub4u'];
    }

    console.log(`[ExtensionManager] Dynamic Multi-Provider Cascade for "${cleanTitle}": [${priorityOrder.join(' -> ')}]`);

    let lastError = null;

    for (const currentProvider of priorityOrder) {
      try {
        console.log(`[ExtensionManager] ⚡ Attempting stream resolution on provider: ${currentProvider}`);
        
        // 1. Find best matching media post on this provider
        const matchedData = await this.findBestMatchingMedia({
          provider: currentProvider,
          targetTitle: cleanTitle,
          targetYear,
          isTVShow,
          seasonNumber: targetSeason,
          originalLanguage,
          isIndianRegion
        });

        if (!matchedData || !matchedData.match) {
          console.log(`[ExtensionManager] ℹ️ No match found on ${currentProvider} for "${cleanTitle}". Proceeding to next provider...`);
          continue;
        }

        const { match, provider: matchedProvider } = matchedData;
        console.log(`[ExtensionManager] Found candidate post on ${matchedProvider}: "${match.title}" -> ${match.link}`);

        // 2. Extract playable stream from this provider
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
        } else {
          console.warn(`[ExtensionManager] ⚠️ ${matchedProvider} returned no playable stream for "${match.title}". Cascading to next provider...`);
        }
      } catch (err) {
        lastError = err;
        console.warn(`[ExtensionManager] Error resolving on ${currentProvider}:`, err?.message || err);
      }
    }

    throw new Error(`Could not resolve direct stream for "${cleanTitle}" across all providers.`);
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
