/**
 * TamilDhool Stream Extractor
 * Extracts Bunny Stream CDN HLS (.m3u8), VibrantPulseLab, and Dailymotion streams from tamildhool.tech
 */

export const DEFAULT_BUNNY_CDN_HOST = "vz-8cf4325c-bc5.b-cdn.net";

export const REQUIRED_STREAM_HEADERS = {
  Referer: "https://futuregentrends.com/",
  Origin: "https://futuregentrends.com"
};

const providerHost = /(^|\.)tamildhool\.tech$/i;
const serialEpisodePath = /^\/([a-z0-9-]+)\/([a-z0-9-]+-serial)\/([a-z0-9-]+)\/([a-z0-9-]+)-(\d{2}-\d{2}-\d{4})-.*?\/?$/i;
const moviePath = /^\/movie\/([^/]+)\/?$/i;
const genericEpisodePath = /^\/episode\/([^/]+)\/(\d+)-(\d+)\/?$/i;

/**
 * Parses a TamilDhool page URL into structured media request parameters
 * @param {string} rawUrl
 * @returns {object}
 */
export function parseMediaRequest(rawUrl) {
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

/**
 * Builds canonical TamilDhool URL from media details
 */
export function buildProviderUrl(kind, name, options, legacyEpisode) {
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!slug) throw new Error("A serial or movie name is required.");

  let opts = {};
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

/**
 * Extracts streaming candidate URLs from TamilDhool HTML page content
 * @param {string} html
 * @param {string} [pageUrl]
 * @returns {object}
 */
export function extractStreamsFromHtml(html, pageUrl) {
  // 1. Extract all Video IDs from teamstoday.com or futuregentrends.com links
  const videoMatches = [...html.matchAll(/[?&]video=([a-f0-9-]{16,40}|[a-zA-Z0-9_-]{10,50})/gi)].map(m => m[1]);
  const uniqueVideoIds = Array.from(new Set(videoMatches));

  // 2. Extract Bunny CDN edge host and thumbnail if present
  const cdnHostMatch = html.match(/https?:\/\/([a-z0-9.-]*b-cdn\.net)\/([a-f0-9-]{16,40}|[a-zA-Z0-9_-]{10,50})/i);
  const cdnHost = cdnHostMatch ? cdnHostMatch[1] : DEFAULT_BUNNY_CDN_HOST;
  if (cdnHostMatch && !uniqueVideoIds.includes(cdnHostMatch[2])) {
    uniqueVideoIds.push(cdnHostMatch[2]);
  }

  let thumbnail;
  const thumbMatch = html.match(/https?:\/\/[^\s"'<>]+\.(?:b-cdn\.net|vibrantpulselab\.com)\/[^\s"'<>]+\.(?:jpg|webp|png)/i);
  if (thumbMatch) {
    thumbnail = thumbMatch[0];
  }

  const streams = [];

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

  let request;
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

export function buildWebViewExtractorScript(preferredHeight = 1080) {
  return `(() => {
    const preferred = ${preferredHeight};
    const html = document.documentElement.outerHTML || '';
    const defaultHost = ${JSON.stringify(DEFAULT_BUNNY_CDN_HOST)};
    const headers = ${JSON.stringify(REQUIRED_STREAM_HEADERS)};

    const videoMatch = html.match(/[?&]video=([a-f0-9-]{16,40}|[a-zA-Z0-9_-]{10,50})/i);
    let videoId = videoMatch ? videoMatch[1] : null;

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
