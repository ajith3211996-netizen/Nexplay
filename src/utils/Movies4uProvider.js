/**
 * Movies4u Provider & Stream Extractor for Stitch-Nexplay (Server 3)
 * Bundled for React Native & Android Media3 ExoPlayer
 */

/**
 * Dean Edwards Packer (P.A.C.K.E.R.) Unpacker
 * Safely unpacks obfuscated JavaScript strings without calling eval()
 */
function toBase(num, radix) {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let res = '';
    while (num > 0) {
        res = chars[num % radix] + res;
        num = Math.floor(num / radix);
    }
    return res || '0';
}
export function unpack(packedCode) {
    if (!packedCode || typeof packedCode !== 'string')
        return null;
    // Search for the packer signature pattern
    // Matches: eval(function(p,a,c,k,e,d)...}('payload', radix, count, 'keywords'.split('|')))
    const match = packedCode.match(/}\s*\('(.*)',\s*(\d+),\s*(\d+),\s*'([^']+)'\.split\('\|'\)/s);
    if (!match) {
        // Alternate format: function(p,a,c,k,e,r)...
        const altMatch = packedCode.match(/return\s+p}\s*\('(.*)',\s*(\d+),\s*(\d+),\s*'([^']+)'\.split\('\|'\)/s);
        if (!altMatch)
            return null;
        return decodePacker(altMatch[1], parseInt(altMatch[2], 10), parseInt(altMatch[3], 10), altMatch[4].split('|'));
    }
    const [, payload, radixStr, countStr, dictStr] = match;
    return decodePacker(payload, parseInt(radixStr, 10), parseInt(countStr, 10), dictStr.split('|'));
}
function decodePacker(payload, radix, count, dict) {
    let unescaped = payload
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    let c = count;
    while (c--) {
        const key = toBase(c, radix);
        const val = dict[c] !== undefined && dict[c] !== '' ? dict[c] : key;
        unescaped = unescaped.replace(new RegExp('\\b' + key + '\\b', 'g'), val);
    }
    return unescaped;
}
/**
 * Extracts all stream candidate URLs (e.g. .m3u8, .mp4, .mkv) from unpacked code
 */
export function extractStreamUrls(code) {
    if (!code)
        return [];
    const matches = [...code.matchAll(/https?:\/\/[^\s"'`<>\\]+\.(?:m3u8|mp4|mkv)(?:\?[^\s"'`<>\\]*)?/gi)];
    return Array.from(new Set(matches.map(m => m[0])));
}

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
/**
 * Movies4u Provider & Stream Extractor
 * Optimized for Android Media3 ExoPlayer & Stitch-Nexplay Integration
 */
export class Movies4uClient {
    liveBaseUrl = 'https://new6.movies4u.clinic';
    domainResolved = false;
    constructor(customBaseUrl) {
        if (customBaseUrl) {
            this.liveBaseUrl = customBaseUrl.replace(/\/+$/, '');
            this.domainResolved = true;
        }
    }
    /**
     * Resolves the active live mirror from the entry point https://movies4u.foo
     */
    async resolveLiveDomain(customHttpGet) {
        if (this.domainResolved)
            return this.liveBaseUrl;
        const fetchHtml = customHttpGet || this.defaultHttpGet.bind(this);
        try {
            const html = await fetchHtml('https://movies4u.foo/', { 'User-Agent': DEFAULT_USER_AGENT }, 8000);
            // Look for base64 encoded redirect script: window.open(atob('aHR0cHM6Ly90aW55dXJsLmNvbS9yb2NreWJoYWlwcm8x'))
            const atobMatches = [...html.matchAll(/atob\s*\(\s*['"]([A-Za-z0-9+/=]+)['"]\s*\)/g)];
            for (const m of atobMatches) {
                try {
                    const decoded = this.decodeBase64(m[1]);
                    if (decoded.includes('tinyurl.com') || decoded.includes('http')) {
                        const tinyMatch = decoded.match(/https?:\/\/[^\s"'>]+/i);
                        if (tinyMatch) {
                            const res = await fetch(tinyMatch[0], {
                                method: 'HEAD',
                                redirect: 'follow',
                                headers: { 'User-Agent': DEFAULT_USER_AGENT }
                            });
                            if (res.url && !res.url.includes('tinyurl.com')) {
                                const resolvedOrigin = new URL(res.url).origin;
                                this.liveBaseUrl = resolvedOrigin;
                                this.domainResolved = true;
                                return this.liveBaseUrl;
                            }
                        }
                    }
                }
                catch {
                    // ignore decoding errors
                }
            }
        }
        catch {
            // fallback to preconfigured liveBaseUrl
        }
        this.domainResolved = true;
        return this.liveBaseUrl;
    }
    /**
     * Search Movies4u for movies and TV series
     */
    async search(query, page = 1, customHttpGet) {
        const cleanQuery = query.trim();
        if (!cleanQuery)
            return [];
        const baseUrl = await this.resolveLiveDomain(customHttpGet);
        const searchUrl = `${baseUrl}/lookup.php?q=${encodeURIComponent(cleanQuery)}&page=${page}&per_page=30`;
        try {
            const fetcher = customHttpGet || this.defaultHttpGet.bind(this);
            const resText = await fetcher(searchUrl, {
                'User-Agent': DEFAULT_USER_AGENT,
                'Referer': `${baseUrl}/search.html?q=${encodeURIComponent(cleanQuery)}`
            });
            const data = JSON.parse(resText);
            const hits = Array.isArray(data?.hits) ? data.hits : [];
            return hits.map((hit) => {
                const rawTitle = hit.post_title || '';
                const yearMatch = rawTitle.match(/\b(19\d{2}|20\d{2})\b/);
                const year = yearMatch ? parseInt(yearMatch[1], 10) : undefined;
                const isSeries = /\b(?:season|s\d+|series|episodes?)\b/i.test(rawTitle);
                const permalink = hit.permalink?.startsWith('http')
                    ? hit.permalink
                    : `${baseUrl}${hit.permalink?.startsWith('/') ? '' : '/'}${hit.permalink || ''}`;
                return {
                    id: String(hit.id || ''),
                    title: rawTitle,
                    cleanTitle: this.cleanTitle(rawTitle),
                    url: permalink,
                    thumbnail: hit.post_thumbnail || undefined,
                    quality: hit.movie_quality || this.detectQuality(rawTitle),
                    year,
                    mediaType: isSeries ? 'series' : 'movie',
                    provider: 'movies4u'
                };
            });
        }
        catch {
            return [];
        }
    }
    /**
     * Extracts detailed metadata, download links, and episode map from a movie/series page
     */
    async extractDetails(pageUrl, targetSeason = 1, customHttpGet) {
        const baseUrl = await this.resolveLiveDomain(customHttpGet);
        const targetUrl = pageUrl.startsWith('http') ? pageUrl : `${baseUrl}/${pageUrl.replace(/^\/+/, '')}`;
        const fetcher = customHttpGet || this.defaultHttpGet.bind(this);
        const html = await fetcher(targetUrl, {
            'User-Agent': DEFAULT_USER_AGENT,
            'Referer': `${baseUrl}/`
        });
        const rawTitle = html.match(/<h1[^>]*class=["'][^"']*entry-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, '').trim()
            || html.match(/<title>(.*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, '').trim()
            || '';
        const thumbnail = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1]
            || html.match(/<img[^>]+class=["'][^"']*post-thumbnail[^"']*["'][^>]+src=["']([^"']+)["']/i)?.[1]
            || html.match(/https:\/\/image\.tmdb\.org\/t\/p\/[^\s"'>]+/i)?.[0];
        const yearMatch = rawTitle.match(/\b(19\d{2}|20\d{2})\b/);
        const year = yearMatch ? parseInt(yearMatch[1], 10) : undefined;
        const isSeries = /\b(?:season|s\d+|series|complete all episodes)\b/i.test(rawTitle);
        const streamingLinks = [];
        // 1. Extract Watch Online embed player (m4uplay.store)
        const watchOnlineMatch = html.match(/href=["'](https?:\/\/m4uplay\.store\/file\/[a-zA-Z0-9]+)["']/i);
        if (watchOnlineMatch) {
            streamingLinks.push({
                quality: this.detectQuality(rawTitle) || '1080p',
                url: watchOnlineMatch[1],
                server: 'M4UPlay (Watch Online Embed)',
                type: 'embedded',
                headers: {
                    'User-Agent': DEFAULT_USER_AGENT,
                    'Referer': targetUrl
                },
                mimeType: 'application/vnd.apple.mpegurl'
            });
        }
        // 2. Extract Download Links / Quality Bridges (m4ulinks.site)
        // Structure: <h4>{Title/Season/Quality} [{Size}]</h4> followed by <a href="https://m4ulinks.site/number/{id}">
        const sectionRegex = /<h4[^>]*>([\s\S]*?)<\/h4>\s*(?:<div[^>]*>)?\s*<a[^>]+href=["'](https?:\/\/m4ulinks\.site\/number\/\d+)["']/gi;
        let sMatch;
        const bridgeList = [];
        while ((sMatch = sectionRegex.exec(html)) !== null) {
            const label = sMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            const bridgeUrl = sMatch[2];
            const quality = this.detectQuality(label);
            const sizeMatch = label.match(/\[([\d.]+\s*(?:GB|MB)(?:\/[Ee])?)\]/i);
            const size = sizeMatch ? sizeMatch[1] : undefined;
            bridgeList.push({ label, quality, size, bridgeUrl });
        }
        if (!isSeries) {
            // For movies, fetch the primary download bridge (e.g. 1080p or highest available)
            const primaryBridge = bridgeList.find(b => b.quality === '1080p') || bridgeList[0];
            if (primaryBridge) {
                const hubLinks = await this.extractHubCloudFromBridge(primaryBridge.bridgeUrl, primaryBridge.quality, fetcher);
                streamingLinks.push(...hubLinks);
            }
            return {
                title: rawTitle,
                cleanTitle: this.cleanTitle(rawTitle),
                url: targetUrl,
                mediaType: 'movie',
                thumbnail,
                year,
                quality: this.detectQuality(rawTitle),
                streamingLinks
            };
        }
        // TV Series Handling: Group bridges by Season
        const seasonsMap = new Map();
        for (const b of bridgeList) {
            const sNumMatch = b.label.match(/Season\s*(\d+)/i);
            const sNum = sNumMatch ? parseInt(sNumMatch[1], 10) : 1;
            if (!seasonsMap.has(sNum)) {
                seasonsMap.set(sNum, []);
            }
            seasonsMap.get(sNum).push(b);
        }
        const seasons = [];
        let currentEpisodes = [];
        // Parse target season episodes
        const seasonToFetch = seasonsMap.has(targetSeason) ? targetSeason : (Array.from(seasonsMap.keys())[0] || 1);
        const targetSeasonBridges = seasonsMap.get(seasonToFetch) || [];
        // Prefer 1080p bridge for episode list, or first available
        const preferredBridge = targetSeasonBridges.find(b => b.quality === '1080p')
            || targetSeasonBridges.find(b => b.quality === '720p')
            || targetSeasonBridges[0];
        if (preferredBridge) {
            currentEpisodes = await this.extractEpisodesFromBridge(preferredBridge.bridgeUrl, preferredBridge.quality, fetcher);
        }
        for (const [sNum, bridges] of seasonsMap.entries()) {
            seasons.push({
                seasonNumber: sNum,
                qualityBridges: bridges,
                episodes: sNum === seasonToFetch ? currentEpisodes : []
            });
        }
        return {
            title: rawTitle,
            cleanTitle: this.cleanTitle(rawTitle),
            url: targetUrl,
            mediaType: 'series',
            thumbnail,
            year,
            quality: this.detectQuality(rawTitle),
            streamingLinks,
            seasons,
            episodes: currentEpisodes
        };
    }
    /**
     * Resolves a bridge URL (M4UPlay, HubCloud, or Gamerxyt) to direct playable stream URLs
     */
    async resolveStream(bridgeUrl, qualityHint = '1080p', customHttpGet) {
        const fetcher = customHttpGet || this.defaultHttpGet.bind(this);
        const lowerUrl = bridgeUrl.toLowerCase();
        // 1. M4UPlay Embed Resolver -> Direct HLS (.m3u8)
        if (lowerUrl.includes('m4uplay.store') || lowerUrl.includes('vidhide') || lowerUrl.includes('dramiyos')) {
            return this.resolveM4uPlay(bridgeUrl, qualityHint, fetcher);
        }
        // 2. HubCloud / HubDrive / Gamerxyt Resolver -> Direct Cloudflare R2 / Lenin CDN / 10Gbps
        if (lowerUrl.includes('hubcloud') || lowerUrl.includes('gamerxyt.com') || lowerUrl.includes('hubdrive')) {
            return this.resolveHubCloud(bridgeUrl, qualityHint, fetcher);
        }
        // 3. GDFlix Resolver
        if (lowerUrl.includes('gdflix') || lowerUrl.includes('new4.gdflix.io')) {
            return this.resolveGDFlix(bridgeUrl, qualityHint, fetcher);
        }
        // Direct link fallback
        if (this.isDirectMediaStream(bridgeUrl)) {
            return [{
                    quality: qualityHint,
                    url: bridgeUrl,
                    originalUrl: bridgeUrl,
                    server: 'Direct Media Stream',
                    type: 'direct',
                    headers: { 'User-Agent': DEFAULT_USER_AGENT },
                    mimeType: this.detectMimeType(bridgeUrl)
                }];
        }
        return [];
    }
    /**
     * High-level 1-Click Playable Stream Generator for Media3 ExoPlayer
     */
    async getPlayableStream(pageUrl, isTVShow = false, episodeNumber = 1, seasonNumber = 1, customHttpGet) {
        const details = await this.extractDetails(pageUrl, seasonNumber, customHttpGet);
        if (!isTVShow && details.mediaType === 'movie') {
            // Resolve movie streams
            // 1. Check M4UPlay first for immediate adaptive HLS stream
            const m4uEmbed = details.streamingLinks?.find(s => s.url.includes('m4uplay.store'));
            if (m4uEmbed) {
                try {
                    const resolved = await this.resolveStream(m4uEmbed.url, details.quality || '1080p', customHttpGet);
                    if (resolved.length > 0) {
                        const primary = resolved[0];
                        return {
                            title: details.title,
                            mediaType: 'movie',
                            streamUrl: primary.url,
                            headers: primary.headers || { 'User-Agent': DEFAULT_USER_AGENT, 'Referer': 'https://m4uplay.store/' },
                            mimeType: primary.mimeType || 'application/vnd.apple.mpegurl',
                            quality: primary.quality,
                            server: primary.server,
                            thumbnail: details.thumbnail,
                            backupStreams: resolved.slice(1)
                        };
                    }
                } catch (e) {}
            }
            // 2. Iterate ALL streaming & download link candidates until a stream is resolved
            const candidates = [
                ...(details.streamingLinks || []).filter(s => !s.url.includes('m4uplay.store')),
                ...(details.downloadLinks || [])
            ];
            // Prioritize hubcloud and gdflix bridges
            candidates.sort((a, b) => {
                const aP = (a.url.includes('hubcloud') || a.url.includes('gdflix')) ? 1 : 0;
                const bP = (b.url.includes('hubcloud') || b.url.includes('gdflix')) ? 1 : 0;
                return bP - aP;
            });

            for (const candidate of candidates) {
                try {
                    const resolved = await this.resolveStream(candidate.url, candidate.quality || details.quality || '1080p', customHttpGet);
                    if (resolved.length > 0) {
                        const primary = resolved[0];
                        return {
                            title: details.title,
                            mediaType: 'movie',
                            streamUrl: primary.url,
                            headers: primary.headers || { 'User-Agent': DEFAULT_USER_AGENT },
                            mimeType: primary.mimeType || 'video/x-matroska',
                            quality: primary.quality,
                            server: primary.server,
                            thumbnail: details.thumbnail,
                            backupStreams: resolved.slice(1)
                        };
                    }
                } catch (e) {}
            }
        }
        // TV Series Handling
        if (isTVShow || details.mediaType === 'series') {
            const ep = details.episodes?.find(e => e.episodeNumber === episodeNumber) || details.episodes?.[0];
            if (ep && ep.links && ep.links.length > 0) {
                // Dynamically iterate through all bridge links (HubCloud, GDFlix, etc.) until one resolves
                for (const bridge of ep.links) {
                    try {
                        const resolved = await this.resolveStream(bridge.url, bridge.quality || '1080p', customHttpGet);
                        if (resolved.length > 0) {
                            const primary = resolved[0];
                            return {
                                title: `${details.title} - S${seasonNumber}E${ep.episodeNumber}`,
                                mediaType: 'series',
                                seasonNumber,
                                episodeNumber: ep.episodeNumber,
                                streamUrl: primary.url,
                                headers: primary.headers || { 'User-Agent': DEFAULT_USER_AGENT },
                                mimeType: primary.mimeType || 'video/x-matroska',
                                quality: primary.quality,
                                server: primary.server,
                                thumbnail: details.thumbnail,
                                backupStreams: resolved.slice(1)
                            };
                        }
                    } catch (e) {}
                }
            }
        }
        return null;
    }
    /**
     * Extracts direct streaming links across all available qualities (480p, 720p, 1080p, 2160p 4K)
     * for a specific season and episode of a TV series
     */
    async getEpisodeStreamsAllQualities(pageUrl, seasonNumber = 1, episodeNumber = 1, customHttpGet) {
        const fetcher = customHttpGet || this.defaultHttpGet.bind(this);
        const details = await this.extractDetails(pageUrl, seasonNumber, customHttpGet);
        const season = details.seasons?.find(s => s.seasonNumber === seasonNumber);
        if (!season || season.qualityBridges.length === 0)
            return {};
        const results = {};
        const bridgePromises = season.qualityBridges.map(async (bridge) => {
            try {
                const episodes = await this.extractEpisodesFromBridge(bridge.bridgeUrl, bridge.quality, fetcher);
                const ep = episodes.find(e => e.episodeNumber === episodeNumber);
                if (ep && ep.links && ep.links.length > 0) {
                    // Iterate all candidate bridge links per episode until one resolves
                    for (const candidate of ep.links) {
                        try {
                            const directStreams = await this.resolveStream(candidate.url, bridge.quality, fetcher);
                            if (directStreams.length > 0) {
                                return { quality: bridge.quality, streams: directStreams };
                            }
                        } catch (e) {}
                    }
                }
            }
            catch {
                // continue
            }
            return null;
        });
        const settled = await Promise.allSettled(bridgePromises);
        for (const item of settled) {
            if (item.status === 'fulfilled' && item.value) {
                results[item.value.quality] = item.value.streams;
            }
        }
        return results;
    }
    /**
     * Generates Media3 ExoPlayer configuration
     */
    getMedia3Config(link) {
        return {
            uri: link.url,
            headers: link.headers || {
                'User-Agent': DEFAULT_USER_AGENT
            },
            mimeType: link.mimeType || this.detectMimeType(link.url),
            quality: link.quality,
            server: link.server
        };
    }
    /* -------------------------------------------------------------------------- */
    /*                              INTERNAL RESOLVERS                            */
    /* -------------------------------------------------------------------------- */
    async resolveM4uPlay(embedUrl, qualityHint, fetcher) {
        try {
            const html = await fetcher(embedUrl, {
                'User-Agent': DEFAULT_USER_AGENT,
                'Referer': 'https://movies4u.foo/'
            });
            // Unpack Dean Edwards packed script
            const unpacked = unpack(html);
            if (unpacked) {
                // Look for links.hls2 or direct master.m3u8 URL in unpacked code
                const m3u8Matches = extractStreamUrls(unpacked);
                const masterM3u8 = m3u8Matches.find(u => u.includes('.m3u8'))
                    || unpacked.match(/https?:\/\/[^\s"'`\\]+master\.m3u8[^\s"'`\\]*/i)?.[0];
                if (masterM3u8) {
                    return [{
                            quality: qualityHint,
                            url: masterM3u8,
                            originalUrl: embedUrl,
                            server: 'M4UPlay (Adaptive HLS Master Stream)',
                            type: 'direct',
                            headers: {
                                'User-Agent': DEFAULT_USER_AGENT,
                                'Referer': 'https://m4uplay.store/'
                            },
                            mimeType: 'application/vnd.apple.mpegurl'
                        }];
                }
            }
        }
        catch {
            // ignore
        }
        return [];
    }
    async resolveHubCloud(hubUrl, qualityHint, fetcher) {
        const results = [];
        try {
            let currentUrl = hubUrl;
            let html = await fetcher(currentUrl, {
                'User-Agent': DEFAULT_USER_AGENT,
                'Referer': 'https://m4ulinks.site/'
            });
            // HubCloud redirects or links to gamerxyt.com/hubcloud.php
            if (currentUrl.includes('hubcloud.') && !currentUrl.includes('gamerxyt.com')) {
                const gamerMatch = html.match(/href=["'](https?:\/\/[^"']*gamerxyt\.com\/hubcloud\.php[^"']*)["']/i);
                if (gamerMatch) {
                    currentUrl = gamerMatch[1].replace(/&amp;/g, '&');
                    html = await fetcher(currentUrl, {
                        'User-Agent': DEFAULT_USER_AGENT,
                        'Referer': hubUrl
                    });
                }
            }
            // Extract direct stream candidates from gamerxyt page
            const links = [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
            for (const [_, href, rawLabel] of links) {
                const label = rawLabel.replace(/<[^>]+>/g, '').trim();
                // 1. Cloudflare R2 Direct Stream
                if (href.includes('r2.cloudflarestorage.com')) {
                    results.push({
                        quality: qualityHint,
                        url: href,
                        originalUrl: hubUrl,
                        server: 'Download [FSL Server] (Cloudflare R2 Direct Stream)',
                        type: 'direct',
                        headers: { 'User-Agent': DEFAULT_USER_AGENT },
                        mimeType: 'video/x-matroska'
                    });
                }
                // 2. Lenin Buzz CDN
                else if (href.includes('cdn.lenin.buzz') || (href.includes('.mkv') && href.includes('token='))) {
                    results.push({
                        quality: qualityHint,
                        url: href,
                        originalUrl: hubUrl,
                        server: 'Download [FSLv2 Server] (Lenin CDN Direct Stream)',
                        type: 'direct',
                        headers: { 'User-Agent': DEFAULT_USER_AGENT },
                        mimeType: 'video/x-matroska'
                    });
                }
                // 3. PixelDrain Direct File API
                else if (href.includes('pixeldrain.dev/u/')) {
                    const fileId = href.split('/u/')[1]?.split('?')[0];
                    if (fileId) {
                        results.push({
                            quality: qualityHint,
                            url: `https://pixeldrain.dev/api/file/${fileId}`,
                            originalUrl: hubUrl,
                            server: 'Download [PixelServer] (PixelDrain Direct)',
                            type: 'direct',
                            headers: { 'User-Agent': DEFAULT_USER_AGENT },
                            mimeType: 'video/x-matroska'
                        });
                    }
                }
                // 4. 10Gbps Google Direct Stream
                else if (href.includes('gpdl.hubcloud')) {
                    results.push({
                        quality: qualityHint,
                        url: href,
                        originalUrl: hubUrl,
                        server: 'Download [Server : 10Gbps] (Direct CDN Stream)',
                        type: 'direct',
                        headers: { 'User-Agent': DEFAULT_USER_AGENT },
                        mimeType: 'video/x-matroska'
                    });
                }
            }
        }
        catch {
            // ignore
        }
        return results;
    }
    async resolveGDFlix(gdFlixUrl, qualityHint, fetcher) {
        try {
            const html = await fetcher(gdFlixUrl, {
                'User-Agent': DEFAULT_USER_AGENT,
                'Referer': 'https://m4ulinks.site/'
            });
            const instantMatch = html.match(/href=["'](https?:\/\/[^"']*busycdn\.[^"']*)["']/i);
            if (instantMatch) {
                return [{
                        quality: qualityHint,
                        url: instantMatch[1],
                        originalUrl: gdFlixUrl,
                        server: 'GDFlix [Instant 10GBPS]',
                        type: 'direct',
                        headers: { 'User-Agent': DEFAULT_USER_AGENT },
                        mimeType: 'video/x-matroska'
                    }];
            }
        }
        catch {
            // ignore
        }
        return [];
    }
    async extractHubCloudFromBridge(bridgeUrl, quality, fetcher) {
        try {
            const html = await fetcher(bridgeUrl, {
                'User-Agent': DEFAULT_USER_AGENT,
                'Referer': this.liveBaseUrl
            });
            const links = [...html.matchAll(/<a[^>]+href=["'](https?:\/\/[^"']*(?:hubcloud|gdflix)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)];
            return links.map(([_, url, rawText]) => {
                const text = rawText.replace(/<[^>]+>/g, '').trim();
                return {
                    quality,
                    url,
                    originalUrl: bridgeUrl,
                    server: text || 'Hub-Cloud [DD]',
                    type: 'download',
                    headers: { 'User-Agent': DEFAULT_USER_AGENT }
                };
            });
        }
        catch {
            return [];
        }
    }
    async extractEpisodesFromBridge(bridgeUrl, quality, fetcher) {
        try {
            const html = await fetcher(bridgeUrl, {
                'User-Agent': DEFAULT_USER_AGENT,
                'Referer': this.liveBaseUrl
            });
            const episodes = [];
            const parts = html.split(/<h5>\s*-:\s*Episodes?:?\s*(\d+)\s*:-?\s*<\/h5>/i);
            for (let i = 1; i < parts.length; i += 2) {
                const epNum = parseInt(parts[i], 10);
                const epContent = parts[i + 1] || '';
                const links = [...epContent.matchAll(/<a[^>]+href=["'](https?:\/\/[^"']*(?:hubcloud|gdflix)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)];
                const episodeLinks = links.map(([_, href, rawLabel]) => ({
                    title: rawLabel.replace(/<[^>]+>/g, '').trim(),
                    url: href,
                    server: href.includes('hubcloud') ? 'Hub-Cloud [DD]' : 'GDFlix',
                    quality
                }));
                episodes.push({
                    episodeNumber: epNum,
                    title: `Episode ${epNum}`,
                    links: episodeLinks
                });
            }
            return episodes;
        }
        catch {
            return [];
        }
    }
    /* -------------------------------------------------------------------------- */
    /*                               HELPER METHODS                               */
    /* -------------------------------------------------------------------------- */
    cleanTitle(title) {
        return title
            .replace(/\b(480p|720p|1080p|2160p|4k|uhd|hdtc|bluray|web-dl|webrip|hdrip|hevc|x264|x265|10bit)\b/gi, ' ')
            .replace(/\b(hindi|english|tamil|telugu|korean|malayalam|kannada|dual audio|multi audio|org|dubbed|line)\b/gi, ' ')
            .replace(/\b(season\s*\d+(?:-\d+)?|s\d+(?:\s*ep\d+)?|complete|all episodes|full movie|movie)\b/gi, ' ')
            .replace(/[\[\](){}\-_+]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    detectQuality(text) {
        const s = text.toLowerCase();
        if (s.includes('2160p') || s.includes('4k'))
            return '2160p';
        if (s.includes('1080p'))
            return '1080p';
        if (s.includes('720p'))
            return '720p';
        if (s.includes('480p'))
            return '480p';
        return '1080p';
    }
    detectMimeType(url) {
        const lower = url.toLowerCase().split('?')[0];
        if (lower.endsWith('.m3u8'))
            return 'application/vnd.apple.mpegurl';
        if (lower.endsWith('.mpd'))
            return 'application/dash+xml';
        if (lower.endsWith('.mkv'))
            return 'video/x-matroska';
        if (lower.endsWith('.mp4'))
            return 'video/mp4';
        return 'video/mp4';
    }
    isDirectMediaStream(url) {
        const lower = url.toLowerCase().split('?')[0];
        return lower.endsWith('.m3u8')
            || lower.endsWith('.mp4')
            || lower.endsWith('.mkv')
            || lower.endsWith('.mpd')
            || url.includes('r2.cloudflarestorage.com')
            || url.includes('cdn.lenin.buzz');
    }
    decodeBase64(str) {
        if (typeof atob === 'function') {
            return atob(str);
        }
        const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let output = '';
        let clean = String(str).replace(/=+$/, '');
        for (let bc = 0, bs = 0, buffer = 0, idx = 0; buffer = clean.charCodeAt(idx++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
            buffer = b64.indexOf(String.fromCharCode(buffer));
        }
        return output;
    }
    async defaultHttpGet(url, headers, timeoutMs = 10000) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(url, {
                headers: headers || { 'User-Agent': DEFAULT_USER_AGENT },
                signal: controller.signal
            });
            if (!res.ok)
                throw new Error(`HTTP ${res.status} fetching ${url}`);
            return await res.text();
        }
        finally {
            clearTimeout(timer);
        }
    }
}

export const Movies4u = new Movies4uClient();

