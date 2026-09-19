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

export function getStreamPriority(url, serverLabel = '') {
    const u = (url || '').toLowerCase();
    const s = (serverLabel || '').toLowerCase();
    // 1. [Download FSL server] (Cloudflare R2 Direct)
    if (u.includes('r2.cloudflarestorage.com') || u.includes('r2.dev') || s.includes('fsl server') || s.includes('fsl 4k') || s.includes('fsl 1080p') || s.includes('fsl direct')) {
        return 1;
    }
    // 2. [Download FSL v2 server] (FastDL / Bunker / Valentine / Lenin CDN / Pongala)
    if (u.includes('fastdl') || u.includes('bunker.monster') || u.includes('valentine.guru') || u.includes('pongala.life') || u.includes('lenin.buzz') || s.includes('fslv2') || s.includes('fsl v2') || s.includes('fastdl')) {
        return 2;
    }
    // 3. pixeldrain (PixelDrain Direct CDN Stream)
    if (u.includes('pixeldrain.dev/api/file') || u.includes('pixeldrain.com/api/file') || s.includes('pixel') || s.includes('pixeldrain')) {
        return 3;
    }
    // 4. Watch online (Direct player / HLS stream)
    if (u.includes('.m3u8') || s.includes('watch online') || s.includes('hdstream4u') || s.includes('hubstream') || s.includes('m4uplay')) {
        return 4;
    }
    // 5. Cloudflare Workers / HubCDN Direct
    if (u.includes('workers.dev') || u.includes('hubcdn') || s.includes('worker')) {
        return 5;
    }
    // 99. [Download server : 10gbps] Google CDN (Strict last resort - no HTTP 206 range support)
    if (u.includes('googleusercontent.com') || u.includes('video-downloads') || s.includes('10gbps') || s.includes('google cdn')) {
        return 99;
    }
    return 50;
}

export function getQualityWeight(qStr) {
    const q = (qStr || '').toLowerCase();
    if (q === '4k' || q === '2160p' || q === 'uhd') return 40;
    if (q === '1080p' || q === 'fhd') return 30;
    if (q === '720p' || q === 'hd') return 20;
    if (q === '480p' || q === 'sd') return 10;
    return 25;
}

export function selectBestStreamCandidate(candidateStreams) {
    if (!Array.isArray(candidateStreams) || candidateStreams.length === 0) return null;
    const sorted = [...candidateStreams].sort((a, b) => {
        // 1. Strict Priority: Streams supporting HTTP 206 Partial Content rank ahead of non-seekable streams
        const a206 = a.supports206 ?? (a.url?.includes('.m3u8') || (!a.url?.includes('googleusercontent.com') && !a.url?.includes('video-downloads')));
        const b206 = b.supports206 ?? (b.url?.includes('.m3u8') || (!b.url?.includes('googleusercontent.com') && !b.url?.includes('video-downloads')));
        if (a206 && !b206) return -1;
        if (!a206 && b206) return 1;

        const prioA = a.priority ?? getStreamPriority(a.url, a.server);
        const prioB = b.priority ?? getStreamPriority(b.url, b.server);
        if (prioA !== prioB) {
            return prioA - prioB; // 1 (FSL) < 2 (FSLv2) < 3 (Pixeldrain) < 4 (Watch online) < 5 < 99 (Google CDN)
        }
        return getQualityWeight(b.quality || b.q) - getQualityWeight(a.quality || a.q);
    });
    return sorted[0];
}

export function sortBridgesByFidelity(bridges) {
    if (!bridges || !Array.isArray(bridges)) return [];
    const isZip = (b) => {
        const text = `${b.quality || ''} ${b.label || ''} ${b.bridgeUrl || ''}`.toLowerCase();
        return text.includes('.zip') || text.includes('.rar') || text.includes('.7z') || text.includes('.tar') || text.includes('zippack') || text.includes('zip_pack') || text.includes('zip pack') || text.includes('batch zip') || text.includes('season zip');
    };
    const validBridges = bridges.filter(b => !isZip(b));
    const scoreBridge = (b) => {
        const text = `${b.quality || ''} ${b.label || ''} ${b.bridgeUrl || ''}`.toLowerCase();
        let score = 0;
        if (/\b(2160p|4k|uhd)\b/i.test(text)) score += 500;
        else if (/\b(1080p|fhd)\b/i.test(text)) score += 250;
        else if (/\b(720p)\b/i.test(text)) score += 100;
        else if (/\b(480p)\b/i.test(text)) score += 50;

        const targetKeywords = ['hevc', 'hdr', 'hdr10', 'hdr10+', 'sdr', 'dv', 'dolby vision', 'multi audio', 'multi', 'dual audio', 'x265', 'x264', 'h.265', 'h.264', '10bit', '10-bit', 'atmos', 'dts', 'ddp5.1', 'web-dl', 'bluray', 'remux'];
        for (const kw of targetKeywords) {
            if (text.includes(kw)) score += 25;
        }
        const sizeMatch = text.match(/([\d.]+)\s*gb/i);
        if (sizeMatch) score += Math.min(100, Math.round(parseFloat(sizeMatch[1]) * 10));
        return score;
    };
    return [...validBridges].sort((a, b) => scoreBridge(b) - scoreBridge(a));
}

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
/**
 * Movies4u Provider & Stream Extractor
 * Optimized for Android Media3 ExoPlayer & Stitch-Nexplay Integration
 */
export class Movies4uClient {
    liveBaseUrl = 'https://new6.movies4u.clinic';
    mirrors = ['https://new6.movies4u.clinic', 'https://movies4u.co', 'https://movies4u.clinic', 'https://movies4u.vip'];
    domainResolved = false;
    constructor(customBaseUrl) {
        if (customBaseUrl) {
            this.liveBaseUrl = customBaseUrl.replace(/\/+$/, '');
            this.domainResolved = true;
        }
    }

    setBaseUrl(url) {
        if (url && typeof url === 'string') {
            this.liveBaseUrl = url.replace(/\/+$/, '');
            this.domainResolved = true;
            if (!this.mirrors.includes(this.liveBaseUrl)) {
                this.mirrors.unshift(this.liveBaseUrl);
            }
        }
    }

    setMirrors(mirrors) {
        if (Array.isArray(mirrors) && mirrors.length > 0) {
            this.mirrors = mirrors.map(m => m.replace(/\/+$/, ''));
            if (this.mirrors.length > 0) {
                this.liveBaseUrl = this.mirrors[0];
                this.domainResolved = true;
            }
        }
    }

    applyRemoteConfig(config = {}) {
        if (config.baseUrl) this.setBaseUrl(config.baseUrl);
        if (Array.isArray(config.mirrors)) this.setMirrors(config.mirrors);
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
        const sectionRegex = /<h4[^>]*>([\s\S]*?)<\/h4>\s*(?:<div[^>]*>)?\s*<a[^>]+href=["'](https?:\/\/m4ulinks\.site\/number\/\d+)["']/gi;
        let sMatch;
        const bridgeList = [];
        while ((sMatch = sectionRegex.exec(html)) !== null) {
            const label = sMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            const bridgeUrl = sMatch[2];
            const lowerLabel = label.toLowerCase();
            const lowerBridge = bridgeUrl.toLowerCase();
            if (
                lowerLabel.includes('.zip') || lowerLabel.includes('zip pack') || lowerLabel.includes('zippack') || lowerLabel.includes('batch') || lowerLabel.includes('season zip') || lowerLabel.includes('all in one zip') ||
                lowerBridge.includes('.zip') || lowerBridge.includes('.rar') || lowerBridge.includes('zippack')
            ) {
                continue;
            }
            const quality = this.detectQuality(label);
            const sizeMatch = label.match(/\[([\d.]+\s*(?:GB|MB)(?:\/[Ee])?)\]/i);
            const size = sizeMatch ? sizeMatch[1] : undefined;
            bridgeList.push({ label, quality, size, bridgeUrl });
        }
        if (!isSeries) {
            // For movies, fetch the primary 4K / highest quality download bridge
            const sortedBridges = sortBridgesByFidelity(bridgeList);
            const primaryBridge = sortedBridges[0];
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
        const sortedSeasonBridges = sortBridgesByFidelity(targetSeasonBridges);
        const preferredBridge = sortedSeasonBridges[0];
        if (preferredBridge) {
            currentEpisodes = await this.extractEpisodesFromBridge(preferredBridge.bridgeUrl, preferredBridge.quality, fetcher);
        }
        for (const [sNum, bridges] of seasonsMap.entries()) {
            seasons.push({
                seasonNumber: sNum,
                qualityBridges: sortBridgesByFidelity(bridges),
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
        if (lowerUrl.includes('hubcloud') || lowerUrl.includes('gamerxyt.com') || lowerUrl.includes('hubdrive') || lowerUrl.includes('hubcdn') || lowerUrl.includes('drive')) {
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
    extractDirectCdnUrl(url) {
        if (!url || typeof url !== 'string') return null;
        const clean = url.trim();
        if (clean.includes("video-downloads.googleusercontent.com") && !clean.includes("dl.php") && !clean.includes("?url=") && !clean.includes("?link=")) {
            return clean;
        }
        try {
            const u = new URL(clean);
            const linkParam = u.searchParams.get('link') || u.searchParams.get('url') || u.searchParams.get('file');
            if (linkParam && linkParam.startsWith('http')) {
                return this.extractDirectCdnUrl(linkParam);
            }
        } catch (e) {
            const m = clean.match(/(?:[?&](?:link|url|file)=)(https?%3A%2F%2F[^\s"'<>]+|https?:\/\/[^\s"'<>]+)/i);
            if (m && m[1]) {
                const decoded = decodeURIComponent(m[1]);
                if (decoded.startsWith('http')) return this.extractDirectCdnUrl(decoded);
            }
        }
        return clean;
    }

    async verifyMediaStream(streamUrl, headers = {}, timeoutMs = 3500) {
        if (!streamUrl || !streamUrl.startsWith("http")) return { isLive: false, supports206: false };
        let controller = null;
        let timeoutId = null;
        try {
            const isHls = streamUrl.toLowerCase().includes('.m3u8');
            if (typeof AbortController !== "undefined") {
                controller = new AbortController();
                timeoutId = setTimeout(() => {
                    try { controller.abort(); } catch (_) {}
                }, timeoutMs);
            }
            const reqHeaders = {
                "User-Agent": headers["User-Agent"] || DEFAULT_USER_AGENT,
                "Range": "bytes=0-1024",
                ...(headers["Referer"] && !streamUrl.includes("pixeldrain") && !streamUrl.includes("googleusercontent.com") ? { "Referer": headers["Referer"] } : {})
            };
            const res = await fetch(streamUrl, {
                method: "GET",
                headers: reqHeaders,
                signal: controller ? controller.signal : void 0,
                redirect: "follow"
            });
            const status = res.status;
            const acceptRanges = (res.headers.get("accept-ranges") || "").toLowerCase();
            const contentRange = res.headers.get("content-range");
            const contentType = (res.headers.get("content-type") || "").toLowerCase();
            if (contentType.includes("zip") || contentType.includes("html") || contentType.includes("json")) {
                return { isLive: false, supports206: false };
            }
            if (streamUrl.includes("testzip.php") || streamUrl.includes("negn6f")) {
                return { isLive: false, supports206: false };
            }
            const isLive = (status >= 200 && status < 400);
            const supports206 = isHls || status === 206 || Boolean(contentRange) || (status === 200 && acceptRanges.includes("bytes"));
            return { isLive, supports206, status, contentType };
        } catch {
            return { isLive: false, supports206: false };
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
            try { if (controller) controller.abort(); } catch (_) {}
        }
    }

    /**
     * High-level 1-Click Playable Stream Generator for Media3 ExoPlayer
     */
    async getPlayableStream(pageUrl, isTVShow = false, episodeNumber = 1, seasonNumber = 1, customHttpGet) {
        const fetcher = customHttpGet || this.defaultHttpGet.bind(this);
        const details = await this.extractDetails(pageUrl, seasonNumber, fetcher);
        
        if (!isTVShow && details.mediaType === 'movie') {
            const qualities = {};
            let primaryHeaders = { 'User-Agent': DEFAULT_USER_AGENT };
            let primaryMime = 'video/x-matroska';
            let primaryServer = 'Server 3 (Movies4u)';

            const candidates = [
                ...(details.streamingLinks || []),
                ...(details.downloadLinks || [])
            ];
            // Prioritize HubCloud bridges -> 4K/UHD -> 1080p -> M4UPlay Embed -> 720p
            candidates.sort((a, b) => {
                const aHub = (a.server || '').toLowerCase().includes('hubcloud') || (a.server || '').toLowerCase().includes('fsl') || (a.url || '').toLowerCase().includes('hubcloud') || (a.url || '').toLowerCase().includes('gamerxyt') || (a.url || '').toLowerCase().includes('hubdrive');
                const bHub = (b.server || '').toLowerCase().includes('hubcloud') || (b.server || '').toLowerCase().includes('fsl') || (b.url || '').toLowerCase().includes('hubcloud') || (b.url || '').toLowerCase().includes('gamerxyt') || (b.url || '').toLowerCase().includes('hubdrive');
                if (aHub && !bHub) return -1;
                if (!aHub && bHub) return 1;
                const a4K = /\b(2160p|4k|uhd)\b/i.test(`${a.quality || ''} ${a.server || ''}`);
                const b4K = /\b(2160p|4k|uhd)\b/i.test(`${b.quality || ''} ${b.server || ''}`);
                if (a4K && !b4K) return -1;
                if (!a4K && b4K) return 1;
                return 0;
            });

            const liveCandidates = [];
            for (const candidate of candidates) {
                try {
                    const qHint = candidate.quality || details.quality || '1080p';
                    const resolved = await this.resolveStream(candidate.url, qHint, fetcher);
                    if (resolved.length > 0) {
                        for (const primary of resolved) {
                            const check = await this.verifyMediaStream(primary.url, primary.headers);
                            if (check.isLive) {
                                const qLower = (primary.quality || qHint || '').toLowerCase();
                                const qKey = qLower.includes('4k') || qLower.includes('2160') 
                                    ? '4k' 
                                    : (qLower.includes('1080') ? '1080p' : (qLower.includes('720') ? '720p' : (qLower.includes('480') || qLower.includes('490') || qLower.includes('sd') ? '480p' : '1080p')));
                                if (!qualities[qKey]) {
                                    qualities[qKey] = primary.url;
                                }
                                liveCandidates.push({
                                    quality: qKey === '4k' ? '4K' : (qKey === '1080p' ? '1080p' : (qKey === '720p' ? '720p' : '480p')),
                                    url: primary.url,
                                    headers: primary.headers || primaryHeaders,
                                    mimeType: primary.mimeType || primaryMime,
                                    server: primary.server || (qKey === '4k' ? 'Server 3 (Movies4u 4K Direct)' : 'Server 3 (Movies4u)'),
                                    priority: primary.priority ?? getStreamPriority(primary.url, primary.server),
                                    supports206: check.supports206
                                });
                            }
                        }
                    }
                } catch (e) {}
                const hasHighPrio = liveCandidates.some(c => c.priority <= 3 && c.supports206);
                if (hasHighPrio && liveCandidates.length >= 2) break;
            }

            const bestCandidate = selectBestStreamCandidate(liveCandidates);
            if (bestCandidate) {
                const primaryUrl = bestCandidate.url;
                const isHls = primaryUrl.includes('.m3u8');
                return {
                    title: details.title,
                    mediaType: 'movie',
                    streamUrl: primaryUrl,
                    qualities,
                    headers: bestCandidate.headers || primaryHeaders,
                    mimeType: isHls ? 'application/vnd.apple.mpegurl' : (bestCandidate.mimeType || primaryMime),
                    quality: bestCandidate.quality || '1080p',
                    server: bestCandidate.server || 'Server 3 (Movies4u)',
                    supports206: bestCandidate.supports206 ?? true,
                    thumbnail: details.thumbnail
                };
            }
        }

        // TV Series Handling
        if (isTVShow || details.mediaType === 'series') {
            const season = details.seasons?.find(s => s.seasonNumber === seasonNumber) || details.seasons?.[0];
            const sortedBridges = season && season.qualityBridges.length > 0 ? sortBridgesByFidelity(season.qualityBridges) : [];
            const qualities = {};
            const liveCandidates = [];

            // Iterate across candidate bridges in fidelity order (1080p / 4K / 720p)
            for (const bridge of sortedBridges) {
                try {
                    const episodes = await this.extractEpisodesFromBridge(bridge.bridgeUrl, bridge.quality, fetcher);
                    const ep = episodes.find(e => e.episodeNumber === episodeNumber) || episodes[0];
                    if (ep && ep.links && ep.links.length > 0) {
                        for (const l of ep.links) {
                            try {
                                const resolved = await this.resolveStream(l.url, bridge.quality || '1080p', fetcher);
                                if (resolved.length > 0) {
                                    for (const candidateStream of resolved) {
                                        const check = await this.verifyMediaStream(candidateStream.url, candidateStream.headers);
                                        if (check.isLive) {
                                            const qLower = (bridge.quality || '').toLowerCase();
                                            const qKey = qLower.includes('4k') || qLower.includes('2160') 
                                                ? '4k' 
                                                : (qLower.includes('1080') ? '1080p' : (qLower.includes('720') ? '720p' : (qLower.includes('480') || qLower.includes('490') || qLower.includes('sd') ? '480p' : '1080p')));
                                            if (!qualities[qKey]) {
                                                qualities[qKey] = candidateStream.url;
                                            }
                                            liveCandidates.push({
                                                quality: qKey === '4k' ? '4K' : (qKey === '1080p' ? '1080p' : (qKey === '720p' ? '720p' : '480p')),
                                                url: candidateStream.url,
                                                headers: candidateStream.headers || { 'User-Agent': DEFAULT_USER_AGENT },
                                                mimeType: candidateStream.mimeType || 'video/x-matroska',
                                                server: candidateStream.server || 'Server 3 (Movies4u)',
                                                priority: candidateStream.priority ?? getStreamPriority(candidateStream.url, candidateStream.server),
                                                supports206: check.supports206
                                            });
                                        }
                                    }
                                }
                            } catch (e) {}
                            if (qualities['4k'] && qualities['1080p']) break;
                        }
                    }
                } catch (bErr) {}
                const hasHighPrio = liveCandidates.some(c => c.priority <= 3 && c.supports206);
                if (hasHighPrio && liveCandidates.length >= 2) break;
            }

            const bestCandidate = selectBestStreamCandidate(liveCandidates);
            if (bestCandidate) {
                const ep = bestCandidate.ep || details.episodes?.find(e => e.episodeNumber === episodeNumber) || { episodeNumber };
                return {
                    title: `${details.title} - S${seasonNumber}E${ep.episodeNumber}`,
                    mediaType: 'series',
                    seasonNumber,
                    episodeNumber: ep.episodeNumber,
                    streamUrl: bestCandidate.url,
                    qualities,
                    headers: bestCandidate.headers || { 'User-Agent': DEFAULT_USER_AGENT },
                    mimeType: bestCandidate.mimeType || 'video/x-matroska',
                    quality: bestCandidate.quality || '1080p',
                    server: bestCandidate.server || 'Server 3 (Movies4u)',
                    supports206: bestCandidate.supports206 ?? true,
                    thumbnail: details.thumbnail
                };
            }

            // Fallback to ep.links on details
            const ep = details.episodes?.find(e => e.episodeNumber === episodeNumber) || details.episodes?.[0];
            if (ep && ep.links && ep.links.length > 0) {
                for (const bridge of ep.links) {
                    try {
                        const resolved = await this.resolveStream(bridge.url, bridge.quality || '1080p', fetcher);
                        if (resolved.length > 0) {
                            for (const candidateStream of resolved) {
                                const check = await this.verifyMediaStream(candidateStream.url, candidateStream.headers);
                                if (check.isLive) {
                                    return {
                                        title: `${details.title} - S${seasonNumber}E${ep.episodeNumber}`,
                                        mediaType: 'series',
                                        seasonNumber,
                                        episodeNumber: ep.episodeNumber,
                                        streamUrl: candidateStream.url,
                                        qualities: { '1080p': candidateStream.url },
                                        headers: candidateStream.headers || { 'User-Agent': DEFAULT_USER_AGENT },
                                        mimeType: candidateStream.mimeType || 'video/x-matroska',
                                        quality: candidateStream.quality || '1080p',
                                        server: candidateStream.server || 'Server 3 (Movies4u)',
                                        supports206: check.supports206,
                                        thumbnail: details.thumbnail,
                                        backupStreams: resolved.slice(1)
                                    };
                                }
                            }
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
    async resolveGpdlLink(gpdlUrl, refererUrl) {
        if (!gpdlUrl || !gpdlUrl.startsWith('http')) return null;
        const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => {
            try { controller.abort(); } catch (_) {}
        }, 6000) : null;
        try {
            const res = await fetch(gpdlUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': DEFAULT_USER_AGENT,
                    'Referer': refererUrl || 'https://gamerxyt.com/',
                    'Range': 'bytes=0-1024'
                },
                redirect: 'manual',
                signal: controller ? controller.signal : void 0
            });
            const location = res.headers.get('location');
            if (location) {
                const unwrapped = this.extractDirectCdnUrl(location);
                if (unwrapped && unwrapped.startsWith('http') && !unwrapped.includes('gpdl') && !unwrapped.includes('pixel.hubcloud') && !unwrapped.includes('pixel.rohitkiskk.workers.dev/?id=')) {
                    return unwrapped;
                }
                return await this.resolveGpdlLink(unwrapped || location, gpdlUrl);
            }
            if (res.url && res.url !== gpdlUrl) {
                const unwrapped = this.extractDirectCdnUrl(res.url);
                if (unwrapped && unwrapped.startsWith('http')) return unwrapped;
            }
        } catch {} finally {
            if (timeoutId) clearTimeout(timeoutId);
            try { if (controller) controller.abort(); } catch (_) {}
        }
        return null;
    }

    async resolveHubCloud(hubUrl, qualityHint, customHttpGet) {
        const fetcher = customHttpGet || this.defaultHttpGet.bind(this);
        const results = [];
        try {
            let currentUrl = hubUrl;
            let html = await fetcher(currentUrl, {
                'User-Agent': DEFAULT_USER_AGENT,
                'Referer': 'https://m4ulinks.site/'
            });
            // HubCloud redirects or links to gamerxyt.com, sportverse.cc or hubcloud.php
            if ((currentUrl.includes('hubcloud.') || currentUrl.includes('/video/') || currentUrl.includes('/drive/')) && !currentUrl.includes('gamerxyt.com') && !currentUrl.includes('sportverse.cc')) {
                const gamerMatch = html.match(/href=["'](https?:\/\/[^"']*(?:gamerxyt|sportverse|hubcloud\.php)[^"']*)["']/i);
                if (gamerMatch) {
                    currentUrl = gamerMatch[1].replace(/&amp;/g, '&');
                    html = await fetcher(currentUrl, {
                        'User-Agent': DEFAULT_USER_AGENT,
                        'Referer': hubUrl
                    });
                }
            }
            if (!currentUrl.includes('gamerxyt.com') && !currentUrl.includes('sportverse.cc')) {
                const anyGamer = html.match(/href=["'](https?:\/\/[^"']*(?:gamerxyt|sportverse)[^"']*)["']/i)
                    || html.match(/<a[^>]*id=["']download["'][^>]*href=["']([^"']+)["']/i)
                    || html.match(/var\s+url\s*=\s*['"]([^'"]+)['"]/i);
                if (anyGamer && anyGamer[1]) {
                    currentUrl = anyGamer[1].replace(/&amp;/g, '&');
                    html = await fetcher(currentUrl, {
                        'User-Agent': DEFAULT_USER_AGENT,
                        'Referer': hubUrl
                    });
                }
            }
            // Extract direct stream candidates from landing/gamerxyt/sportverse page
            const links = [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
            for (const [_, href, rawLabel] of links) {
                const label = rawLabel.replace(/<[^>]+>/g, '').trim();
                const lowerHref = href.toLowerCase();
                const lowerLabel = label.toLowerCase();
                
                // Strictly ignore ZIP and compressed archive links
                if (
                    lowerHref.includes('.zip') || lowerHref.includes('.rar') || lowerHref.includes('.7z') || lowerHref.includes('.tar') || lowerHref.includes('.gz') || lowerHref.includes('zippack') ||
                    lowerLabel.includes('.zip') || lowerLabel.includes('zip pack') || lowerLabel.includes('zippack') || lowerLabel.includes('batch')
                ) {
                    continue;
                }

                // 1. [Download FSL server] (Cloudflare R2 Direct Stream) - Priority 1 (Instant Range Seeking)
                if (href.includes('r2.cloudflarestorage.com') || href.includes('r2.dev') || lowerLabel.includes('fsl server') || lowerLabel.includes('fsl 4k')) {
                    results.push({
                        quality: qualityHint,
                        url: href,
                        originalUrl: hubUrl,
                        server: 'Download [FSL Server] (10Gbps Cloudflare R2 Direct)',
                        type: 'direct',
                        headers: { 'User-Agent': DEFAULT_USER_AGENT },
                        mimeType: 'video/x-matroska',
                        priority: 1
                    });
                }
                // 2. [Download FSL v2 server] (FastDL / Bunker / Valentine / Lenin CDN) - Priority 2 (Instant Range Seeking)
                else if (href.includes('fastdl') || href.includes('fsl.') || href.includes('bunker.monster') || href.includes('valentine.guru') || href.includes('cdn.lenin.buzz') || lowerLabel.includes('fastdl') || lowerLabel.includes('fslv2') || lowerLabel.includes('fsl v2')) {
                    results.push({
                        quality: qualityHint,
                        url: href,
                        originalUrl: hubUrl,
                        server: 'Download [FSL v2 server] (Fast CDN Direct Stream)',
                        type: 'direct',
                        headers: { 'User-Agent': DEFAULT_USER_AGENT },
                        mimeType: 'video/x-matroska',
                        priority: 2
                    });
                }
                // 3. pixeldrain (PixelDrain Direct CDN Stream) - Priority 3 (Instant Range Seeking)
                else if (lowerHref.includes('pixeld') || lowerLabel.includes('pixel')) {
                    let fileId = (href.includes('/u/') ? href.split('/u/')[1] : href.split('/api/file/')[1])?.split('?')[0]?.replace(/\/+$/, '');
                    if (!fileId || fileId === 'negn6f') {
                        const pxlMatch = html.match(/var\s+pxl\s*=\s*['"]([^'"]+)['"];?/i);
                        if (pxlMatch && pxlMatch[1]) {
                            fileId = pxlMatch[1].split('/u/')[1]?.split('?')[0]?.replace(/\/+$/, '');
                        }
                    }
                    if (fileId && fileId !== 'negn6f' && fileId.length >= 6) {
                        const pxlUrl = `https://pixeldrain.dev/api/file/${fileId}`;
                        if (!results.some(r => r.url === pxlUrl)) {
                            results.push({
                                quality: qualityHint,
                                url: pxlUrl,
                                originalUrl: hubUrl,
                                server: 'Download [PixelServer] (PixelDrain Direct CDN Stream)',
                                type: 'direct',
                                headers: { 'User-Agent': DEFAULT_USER_AGENT },
                                mimeType: 'video/x-matroska',
                                priority: 3
                            });
                        }
                    }
                }
                // 4. Watch Online streaming link - Priority 4
                else if (lowerHref.includes('hdstream4u') || lowerHref.includes('hubstream') || lowerHref.includes('m4uplay') || lowerLabel.includes('watch online')) {
                    if (href.startsWith('http') && !lowerHref.includes('winexch') && !lowerHref.includes('snvhost') && !lowerHref.includes('tutorial')) {
                        results.push({
                            quality: qualityHint,
                            url: href,
                            originalUrl: hubUrl,
                            server: 'Watch Online (High-Speed Stream)',
                            type: 'hls',
                            headers: { 'User-Agent': DEFAULT_USER_AGENT },
                            mimeType: 'application/x-mpegURL',
                            priority: 4
                        });
                    }
                }
                // 5. Cloudflare Worker Stream (.workers.dev)
                else if (href.includes('workers.dev') && !href.includes('/?id=')) {
                    results.push({
                        quality: qualityHint,
                        url: href,
                        originalUrl: hubUrl,
                        server: 'Download File (Cloudflare Worker Stream)',
                        type: 'direct',
                        headers: { 'User-Agent': DEFAULT_USER_AGENT, 'Referer': 'https://gamerxyt.com/' },
                        mimeType: 'video/x-matroska',
                        priority: 5
                    });
                }
                // 6. Direct Google CDN / GPDL / 10Gbps Server - Strict Last Resort (Priority 99, No 206 Partial Content)
                else if (
                    lowerHref.includes('googleusercontent.com') ||
                    lowerHref.includes('video-downloads') ||
                    lowerHref.includes('dl.php?link=') ||
                    lowerHref.includes('gpdl') ||
                    lowerHref.includes('pixel.hubcloud') ||
                    lowerHref.includes('/?id=') ||
                    lowerLabel.includes('10gbps')
                ) {
                    let directCdn = (lowerHref.includes('googleusercontent.com') || lowerHref.includes('video-downloads')) && !lowerHref.includes('dl.php') && !lowerHref.includes('?url=')
                        ? href
                        : this.extractDirectCdnUrl(href);
                    if (!directCdn || directCdn.includes('gpdl') || directCdn.includes('/?id=')) {
                        directCdn = await this.resolveGpdlLink(href, currentUrl);
                    }
                    if (directCdn && !directCdn.includes('dl.php') && !directCdn.includes('?url=')) {
                        results.push({
                            quality: qualityHint,
                            url: directCdn,
                            originalUrl: hubUrl,
                            server: 'Download [Server : 10Gbps] (Google CDN Stream - No 206 Partial Content)',
                            type: 'direct',
                            headers: { 'User-Agent': DEFAULT_USER_AGENT },
                            mimeType: 'video/mp4',
                            priority: 99
                        });
                    }
                }
            }

            // Check dynamic script var pxl if Pixeldrain not yet added
            if (!results.some(r => r.url.includes('pixeldrain'))) {
                const pxlMatch = html.match(/var\s+pxl\s*=\s*['"]([^'"]+)['"];?/i);
                if (pxlMatch && pxlMatch[1]) {
                    const clean = pxlMatch[1].replace(/[?&]download.*$/i, '').trim();
                    const fileId = clean.split('/u/')[1]?.split('?')[0]?.replace(/\/+$/, '') || clean.split('/').pop()?.split('?')[0];
                    if (fileId && fileId !== 'negn6f' && fileId.length >= 6) {
                        results.push({
                            quality: qualityHint,
                            url: `https://pixeldrain.dev/api/file/${fileId}`,
                            originalUrl: hubUrl,
                            server: 'Download [PixelServer] (PixelDrain Direct CDN Stream)',
                            type: 'direct',
                            headers: { 'User-Agent': DEFAULT_USER_AGENT },
                            mimeType: 'video/x-matroska',
                            priority: 3
                        });
                    }
                }
            }

            results.sort((a, b) => (a.priority || 50) - (b.priority || 50));
        }
        catch {
            // ignore
        }
        return results;
    }
    async resolveGDFlix(gdFlixUrl, qualityHint, customHttpGet) {
        const fetcher = customHttpGet || this.defaultHttpGet.bind(this);
        try {
            const html = await fetcher(gdFlixUrl, {
                'User-Agent': DEFAULT_USER_AGENT,
                'Referer': 'https://m4ulinks.site/'
            });
            const instantMatch = html.match(/href=["'](https?:\/\/[^"']*busycdn\.[^"']*)["']/i);
            if (instantMatch && instantMatch[1]) {
                const busyUrl = instantMatch[1];
                let directCdn = this.extractDirectCdnUrl(busyUrl);
                if (!directCdn || directCdn.includes('busycdn')) {
                    const busyController = typeof AbortController !== "undefined" ? new AbortController() : null;
                    const busyTimer = busyController ? setTimeout(() => {
                        try { busyController.abort(); } catch (_) {}
                    }, 5000) : null;
                    try {
                        const res = await fetch(busyUrl, {
                            method: 'GET',
                            headers: { 
                                'User-Agent': DEFAULT_USER_AGENT,
                                'Range': 'bytes=0-1024'
                            },
                            signal: busyController ? busyController.signal : void 0,
                            redirect: 'follow'
                        });
                        if (res.url) {
                            directCdn = this.extractDirectCdnUrl(res.url);
                        }
                    } catch (e) {} finally {
                        if (busyTimer) clearTimeout(busyTimer);
                        try { if (busyController) busyController.abort(); } catch (_) {}
                    }
                }
                const finalUrl = (directCdn && directCdn.startsWith('http')) ? directCdn : busyUrl;
                return [{
                    quality: qualityHint,
                    url: finalUrl,
                    originalUrl: gdFlixUrl,
                    server: 'GDFlix [Instant 10GBPS 4K]',
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
    async extractHubCloudFromBridge(bridgeUrl, quality, customHttpGet) {
        const fetcher = customHttpGet || this.defaultHttpGet.bind(this);
        try {
            const html = await fetcher(bridgeUrl, {
                'User-Agent': DEFAULT_USER_AGENT,
                'Referer': this.liveBaseUrl
            });
            const links = [...html.matchAll(/<a[^>]+href=["'](https?:\/\/[^"']*(?:hubcloud|gdflix|drive|hubcdn)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)];
            return links
                .filter(([_, url, rawText]) => {
                    const lUrl = url.toLowerCase();
                    const lText = rawText.toLowerCase();
                    return !lUrl.includes('.zip') && !lUrl.includes('.rar') && !lUrl.includes('.7z') && !lUrl.includes('zippack') && !lText.includes('.zip') && !lText.includes('zip pack') && !lText.includes('batch');
                })
                .map(([_, url, rawText]) => {
                    const text = rawText.replace(/<[^>]+>/g, '').trim();
                    return {
                        quality,
                        url,
                        originalUrl: bridgeUrl,
                        server: text || (url.includes('gdflix') ? 'GDFlix' : 'Hub-Cloud [DD]'),
                        type: 'download',
                        headers: { 'User-Agent': DEFAULT_USER_AGENT }
                    };
                });
        }
        catch {
            return [];
        }
    }
    async extractEpisodesFromBridge(bridgeUrl, quality, customHttpGet) {
        const fetcher = customHttpGet || this.defaultHttpGet.bind(this);
        try {
            const html = await fetcher(bridgeUrl, {
                'User-Agent': DEFAULT_USER_AGENT,
                'Referer': this.liveBaseUrl
            });
            const episodes = [];
            const parts = html.split(/<h[1-6][^>]*>\s*-:\s*Episodes?:?\s*(\d+)\s*:-?\s*<\/h[1-6]>/i);
            for (let i = 1; i < parts.length; i += 2) {
                const epNum = parseInt(parts[i], 10);
                const epContent = parts[i + 1] || '';
                const links = [...epContent.matchAll(/<a[^>]+href=["'](https?:\/\/[^"']*(?:hubcloud|gdflix|drive|hubcdn)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)];
                const episodeLinks = links
                    .filter(([_, href, rawLabel]) => {
                        const lHref = href.toLowerCase();
                        const lLabel = rawLabel.toLowerCase();
                        return !lHref.includes('.zip') && !lHref.includes('.rar') && !lHref.includes('.7z') && !lHref.includes('zippack') && !lLabel.includes('.zip') && !lLabel.includes('zip pack') && !lLabel.includes('batch');
                    })
                    .map(([_, href, rawLabel]) => ({
                        title: rawLabel.replace(/<[^>]+>/g, '').trim(),
                        url: href,
                        server: href.includes('hubcloud') ? 'Hub-Cloud [DD]' : (href.includes('gdflix') ? 'GDFlix' : 'Fast CDN'),
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
        if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;
        const lower = url.toLowerCase().split('?')[0];
        if (
            lower.includes('.zip') ||
            lower.includes('.rar') ||
            lower.includes('.7z') ||
            lower.includes('.tar') ||
            lower.includes('.gz') ||
            lower.includes('.iso') ||
            lower.includes('zippack') ||
            lower.includes('zip_pack')
        ) {
            return false;
        }
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
        const timer = setTimeout(() => {
            try { controller.abort(); } catch (_) {}
        }, timeoutMs);
        try {
            const res = await fetch(url, {
                headers: headers || { 'User-Agent': DEFAULT_USER_AGENT },
                signal: controller.signal
            });
            if (!res.ok)
                throw new Error(`HTTP ${res.status} fetching ${url}`);
            const contentType = (res.headers.get('content-type') || '').toLowerCase();
            if (contentType.includes('video') || contentType.includes('octet-stream') || contentType.includes('audio')) {
                try { controller.abort(); } catch (_) {}
                return '';
            }
            return await res.text();
        }
        finally {
            clearTimeout(timer);
            try { controller.abort(); } catch (_) {}
        }
    }
}

export const Movies4u = new Movies4uClient();

