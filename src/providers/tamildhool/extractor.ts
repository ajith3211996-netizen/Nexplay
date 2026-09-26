export type MediaKind = "movie" | "episode";

export interface MediaRequest {
  pageUrl: string;
  kind: MediaKind;
  name: string;
  channel?: string;
  date?: string;
  season?: number;
  episode?: number;
}

export interface StreamCandidate {
  url: string;
  height: 480 | 720 | 1080 | 2160;
  quality: "480p" | "720p" | "1080p" | "4K";
  format: "mkv" | "mpd" | "m3u8" | "mp4";
  type?: string;
  headers?: Record<string, string>;
  server?: string;
}

export interface ExtractionResult {
  request?: MediaRequest;
  best: StreamCandidate | null;
  streams: StreamCandidate[];
  videoId?: string;
  thumbnail?: string;
}

export const DEFAULT_BUNNY_CDN_HOST = "vz-8cf4325c-bc5.b-cdn.net";
export const REQUIRED_STREAM_HEADERS: Record<string, string> = {
  Referer: "https://futuregentrends.com/",
  Origin: "https://futuregentrends.com"
};

const providerHost = /(^|\.)tamildhool\.tech$/i;
const serialEpisodePath = /^\/([a-z0-9-]+)\/([a-z0-9-]+-serial)\/([a-z0-9-]+)\/([a-z0-9-]+)-(\d{2}-\d{2}-\d{4})-.*?\/?$/i;
const moviePath = /^\/movie\/([^/]+)\/?$/i;
const genericEpisodePath = /^\/episode\/([^/]+)\/(\d+)-(\d+)\/?$/i;

export function parseMediaRequest(rawUrl: string): MediaRequest {
  const url = new URL(rawUrl.trim());
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Only HTTP/HTTPS page URLs are supported.");
  }
  if (!providerHost.test(url.hostname)) {
    throw new Error("The URL must belong to tamildhool.tech.");
  }

  // 1. TamilDhool serial format: /sun-tv/sun-tv-serial/kayal/kayal-08-07-2026-sun-tv-serial/
  const serialMatch = url.pathname.match(serialEpisodePath);
  if (serialMatch) {
    const [, channel, , serialName, , date] = serialMatch;
    return {
      pageUrl: url.toString(),
      kind: "episode",
      name: decodeURIComponent(serialName),
      channel: channel.toLowerCase(),
      date
    };
  }

  // 2. Generic movie format: /movie/{name}
  const mMatch = url.pathname.match(moviePath);
  if (mMatch) {
    return {
      pageUrl: url.toString(),
      kind: "movie",
      name: decodeURIComponent(mMatch[1])
    };
  }

  // 3. Generic episode format: /episode/{name}/{season}-{episode}
  const epMatch = url.pathname.match(genericEpisodePath);
  if (epMatch) {
    return {
      pageUrl: url.toString(),
      kind: "episode",
      name: decodeURIComponent(epMatch[1]),
      season: Number(epMatch[2]),
      episode: Number(epMatch[3])
    };
  }

  // 4. General fallback for other TamilDhool post URLs
  const segments = url.pathname.split("/").filter(Boolean);
  const lastSlug = segments[segments.length - 1] || "unknown";
  const dateMatch = lastSlug.match(/(\d{2}-\d{2}-\d{4})/);

  return {
    pageUrl: url.toString(),
    kind: "episode",
    name: decodeURIComponent(segments[segments.length - 2] || lastSlug),
    date: dateMatch ? dateMatch[1] : undefined
  };
}

export interface BuildUrlOptions {
  channel?: string;
  date?: string;
  season?: number;
  episode?: number;
}

export function buildProviderUrl(
  kind: MediaKind,
  name: string,
  options?: BuildUrlOptions | number,
  legacyEpisode?: number
): string {
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!slug) throw new Error("A serial or movie name is required.");

  let opts: BuildUrlOptions = {};
  if (typeof options === "number") {
    opts = { season: options, episode: legacyEpisode };
  } else if (options) {
    opts = options;
  }

  if (kind === "episode") {
    if (opts.date) {
      const channel = (opts.channel || "sun-tv").toLowerCase().trim();
      return `https://www.tamildhool.tech/${channel}/${channel}-serial/${slug}/${slug}-${opts.date}-${channel}-serial/`;
    }
    if (Number.isInteger(opts.season) && Number.isInteger(opts.episode)) {
      return `https://www.tamildhool.tech/episode/${slug}/${opts.season}-${opts.episode}`;
    }
    return `https://www.tamildhool.tech/?s=${encodeURIComponent(slug)}`;
  }

  return `https://www.tamildhool.tech/movie/${slug}`;
}

export function extractStreamsFromHtml(html: string, pageUrl?: string): ExtractionResult {
  // 1. Extract all Video IDs from teamstoday.com or futuregentrends.com links
  const videoMatches = [...html.matchAll(/[?&]video=([a-f0-9-]{16,40}|[a-zA-Z0-9_-]{10,50})/gi)].map(m => m[1]);
  const uniqueVideoIds = Array.from(new Set(videoMatches));

  // 2. Extract Bunny CDN edge host and thumbnail if present
  const cdnHostMatch = html.match(/https?:\/\/([a-z0-9.-]*b-cdn\.net)\/([a-f0-9-]{16,40}|[a-zA-Z0-9_-]{10,50})/i);
  const cdnHost = cdnHostMatch ? cdnHostMatch[1] : DEFAULT_BUNNY_CDN_HOST;
  if (cdnHostMatch && !uniqueVideoIds.includes(cdnHostMatch[2])) {
    uniqueVideoIds.push(cdnHostMatch[2]);
  }

  let thumbnail: string | undefined;
  const thumbMatch = html.match(/https?:\/\/[^\s"'<>]+\.(?:b-cdn\.net|vibrantpulselab\.com)\/[^\s"'<>]+\.(?:jpg|webp|png)/i);
  if (thumbMatch) {
    thumbnail = thumbMatch[0];
  }

  const streams: StreamCandidate[] = [];

  for (const id of uniqueVideoIds) {
    // A. VibrantPulseLab 16-hex ID pattern (e.g. 177e0f80b20fb266)
    if (/^[a-f0-9]{16}$/i.test(id)) {
      if (!thumbnail) thumbnail = `https://media.vibrantpulselab.com/thumbs/${id}.webp`;
      streams.push({
        url: `https://media.vibrantpulselab.com/${id}/playlist.m3u8`,
        height: 720,
        quality: "720p",
        format: "m3u8",
        type: "application/vnd.apple.mpegurl",
        headers: {
          Referer: "https://player.vibrantpulselab.com/",
          Origin: "https://player.vibrantpulselab.com"
        },
        server: "VibrantPulseLab (720p HD)"
      });
      streams.push({
        url: `https://media.vibrantpulselab.com/${id}/480p/index.m3u8`,
        height: 480,
        quality: "480p",
        format: "m3u8",
        type: "application/vnd.apple.mpegurl",
        headers: {
          Referer: "https://player.vibrantpulselab.com/",
          Origin: "https://player.vibrantpulselab.com"
        },
        server: "VibrantPulseLab (480p)"
      });
    }
    // B. Bunny Stream UUID pattern (e.g. 319e7980-1458-4f75-94dd-be8c07343e26)
    else if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)) {
      if (!thumbnail) thumbnail = `https://${cdnHost}/${id}/thumbnail.jpg`;
      streams.push({
        url: `https://${cdnHost}/${id}/playlist.m3u8`,
        height: 720,
        quality: "720p",
        format: "m3u8",
        type: "application/vnd.apple.mpegurl",
        headers: REQUIRED_STREAM_HEADERS,
        server: "Bunny Stream HLS (Master)"
      });
      streams.push({
        url: `https://${cdnHost}/${id}/480p/video.m3u8`,
        height: 480,
        quality: "480p",
        format: "m3u8",
        type: "application/vnd.apple.mpegurl",
        headers: REQUIRED_STREAM_HEADERS,
        server: "Bunny Stream (480p)"
      });
    }
    // C. Dailymotion ID pattern (e.g. k4dieY4GFJM23bJHQdA)
    else if (/^[a-zA-Z0-9]{15,25}$/.test(id)) {
      if (!thumbnail) thumbnail = `https://www.dailymotion.com/thumbnail/video/${id}`;
      streams.push({
        url: `https://www.dailymotion.com/embed/video/${id}`,
        height: 720,
        quality: "720p",
        format: "mp4",
        headers: {
          Referer: "https://www.tamildhool.tech/"
        },
        server: "Dailymotion Embed"
      });
    }
  }

  // Prioritize direct HLS m3u8 streams for native ExoPlayer / Media3 playback
  streams.sort((a, b) => {
    const aIsHls = a.format === "m3u8" ? 0 : 1;
    const bIsHls = b.format === "m3u8" ? 0 : 1;
    if (aIsHls !== bIsHls) return aIsHls - bIsHls;
    return b.height - a.height;
  });

  let request: MediaRequest | undefined;
  if (pageUrl) {
    try {
      request = parseMediaRequest(pageUrl);
    } catch {
      // Ignore if not a valid URL
    }
  }

  return {
    request,
    best: streams[0] || null,
    streams,
    videoId: uniqueVideoIds[0] || undefined,
    thumbnail
  };
}

export function buildWebViewExtractorScript(preferredHeight: 480 | 720 | 1080 | 2160 = 1080): string {
  return `(() => {
    const preferred = ${preferredHeight};
    const html = document.documentElement.outerHTML || '';
    const defaultHost = ${JSON.stringify(DEFAULT_BUNNY_CDN_HOST)};
    const headers = ${JSON.stringify(REQUIRED_STREAM_HEADERS)};

    // 1. Extract Video ID from teamstoday / futuregentrends links
    const videoMatch = html.match(/[?&]video=([a-f0-9-]{16,40}|[a-zA-Z0-9_-]{10,50})/i);
    let videoId = videoMatch ? videoMatch[1] : null;

    // 2. Extract CDN edge host & thumbnail
    const cdnMatch = html.match(/https?:\\/\\/([a-z0-9.-]*b-cdn\\.net)\\/([a-f0-9-]{16,40}|[a-zA-Z0-9_-]{10,50})/i);
    const cdnHost = cdnMatch ? cdnMatch[1] : defaultHost;
    if (!videoId && cdnMatch) videoId = cdnMatch[2];

    let thumbnail = null;
    const thumbMatch = html.match(/https?:\\/\\/[^\\s"'<>]+\\.b-cdn\\.net\\/[^\\s"'<>]+\\/thumbnail\\.jpg/i);
    if (thumbMatch) thumbnail = thumbMatch[0];
    else if (videoId) thumbnail = 'https://' + cdnHost + '/' + videoId + '/thumbnail.jpg';

    const streams = [];
    if (videoId) {
      streams.push({
        url: 'https://' + cdnHost + '/' + videoId + '/playlist.m3u8',
        height: 720,
        quality: '720p',
        format: 'm3u8',
        type: 'application/vnd.apple.mpegurl',
        headers: headers,
        server: 'Bunny Stream HLS (Master)'
      });
      streams.push({
        url: 'https://' + cdnHost + '/' + videoId + '/480p/video.m3u8',
        height: 480,
        quality: '480p',
        format: 'm3u8',
        type: 'application/vnd.apple.mpegurl',
        headers: headers,
        server: 'Bunny Stream (480p)'
      });
    }

    // Check for exposed authorized streams if any
    if (Array.isArray(window.__AUTHORIZED_STREAMS__)) {
      for (const item of window.__AUTHORIZED_STREAMS__) {
        if (item && item.url) {
          streams.push({
            url: item.url,
            height: Number(item.height) || 1080,
            quality: (Number(item.height) === 2160 ? '4K' : (item.height + 'p')),
            format: 'm3u8',
            type: item.type,
            headers: headers,
            server: 'Direct Stream'
          });
        }
      }
    }

    streams.sort((a, b) => {
      const aDiff = Math.abs(a.height - preferred);
      const bDiff = Math.abs(b.height - preferred);
      return aDiff - bDiff;
    });

    const result = {
      pageUrl: location.href,
      videoId: videoId,
      thumbnail: thumbnail,
      best: streams[0] || null,
      streams: streams
    };

    return JSON.stringify(result);
  })()`;
}
