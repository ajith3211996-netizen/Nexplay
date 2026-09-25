/**
 * AudioTrackSelector.js
 * 
 * Intelligent language & origin-based audio track selection engine.
 * 
 * Rules:
 * 1. Clean Display Labels:
 *    - Strips ALL website names, domains, URLs, and scraper tags (e.g. movies4u, hdhub4u, 4khdhub, vegamovies, etc.).
 *    - Displays ONLY clean, human-readable language names (e.g. "English", "Hindi", "Tamil", "Telugu", etc.).
 * 
 * 2. Hollywood / Western Content:
 *    - Defaults to English when an English track exists.
 *    - Prefers best quality/format: Atmos/TrueHD > 5.1/7.1 Surround > Original/Default > Plain English.
 * 
 * 3. Indian Movies & Series:
 *    - Uses TMDB API metadata (original_language, origin_country, production_countries).
 *    - Defaults to the officially released original language (e.g. Tamil for Tamil movies, Telugu for Telugu movies, Malayalam for Malayalam movies, Hindi for Hindi movies, etc.).
 * 
 * 4. Manual Selection Lock:
 *    - When the user manually switches the audio track, respects that choice and never overrides it for the session.
 */

export const INDIAN_LANGUAGES = {
  'hi': ['hindi', 'hin', 'hi'],
  'ta': ['tamil', 'tam', 'ta'],
  'te': ['telugu', 'tel', 'te'],
  'ml': ['malayalam', 'mal', 'ml'],
  'kn': ['kannada', 'kan', 'kn'],
  'bn': ['bengali', 'bangla', 'ben', 'bn'],
  'mr': ['marathi', 'mar', 'mr'],
  'pa': ['punjabi', 'pan', 'pa'],
  'gu': ['gujarati', 'guj', 'gu'],
  'ur': ['urdu', 'urd', 'ur'],
  'or': ['odia', 'oriya', 'ori', 'or'],
  'as': ['assamese', 'asm', 'as'],
  'bho': ['bhojpuri', 'bho']
};

export const LANGUAGE_NAMES = {
  'en': 'English', 'eng': 'English',
  'hi': 'Hindi', 'hin': 'Hindi',
  'ta': 'Tamil', 'tam': 'Tamil',
  'te': 'Telugu', 'tel': 'Telugu',
  'ml': 'Malayalam', 'mal': 'Malayalam',
  'kn': 'Kannada', 'kan': 'Kannada',
  'bn': 'Bengali', 'ben': 'Bengali', 'bangla': 'Bengali',
  'mr': 'Marathi', 'mar': 'Marathi',
  'pa': 'Punjabi', 'pan': 'Punjabi',
  'gu': 'Gujarati', 'guj': 'Gujarati',
  'ur': 'Urdu', 'urd': 'Urdu',
  'or': 'Odia', 'ori': 'Odia', 'oriya': 'Odia',
  'as': 'Assamese', 'asm': 'Assamese',
  'bho': 'Bhojpuri',
  'es': 'Spanish', 'spa': 'Spanish', 'español': 'Spanish', 'espanol': 'Spanish',
  'fr': 'French', 'fra': 'French', 'fre': 'French', 'français': 'French', 'francais': 'French',
  'de': 'German', 'deu': 'German', 'ger': 'German', 'deutsch': 'German',
  'it': 'Italian', 'ita': 'Italian', 'italiano': 'Italian',
  'ja': 'Japanese', 'jpn': 'Japanese', 'nihongo': 'Japanese',
  'ko': 'Korean', 'kor': 'Korean', 'hangul': 'Korean',
  'zh': 'Chinese', 'zho': 'Chinese', 'chi': 'Chinese', 'mandarin': 'Chinese', 'cantonese': 'Chinese',
  'ru': 'Russian', 'rus': 'Russian',
  'pt': 'Portuguese', 'por': 'Portuguese', 'português': 'Portuguese',
  'ar': 'Arabic', 'ara': 'Arabic',
  'tr': 'Turkish', 'tur': 'Turkish',
  'th': 'Thai', 'tha': 'Thai',
  'vi': 'Vietnamese', 'vie': 'Vietnamese',
  'id': 'Indonesian', 'ind': 'Indonesian', 'bahasa': 'Indonesian',
  'nl': 'Dutch', 'nld': 'Dutch', 'dut': 'Dutch',
  'pl': 'Polish', 'pol': 'Polish',
  'sv': 'Swedish', 'swe': 'Swedish',
  'fil': 'Filipino', 'tl': 'Tagalog', 'tgl': 'Tagalog',
};

const KNOWN_LANGUAGES_LIST = [
  { name: 'English', regex: /\b(english|eng|en)\b/i },
  { name: 'Hindi', regex: /\b(hindi|hin|hi)\b/i },
  { name: 'Tamil', regex: /\b(tamil|tam|ta)\b/i },
  { name: 'Telugu', regex: /\b(telugu|tel|te)\b/i },
  { name: 'Malayalam', regex: /\b(malayalam|mal|ml)\b/i },
  { name: 'Kannada', regex: /\b(kannada|kan|kn)\b/i },
  { name: 'Bengali', regex: /\b(bengali|bangla|ben|bn)\b/i },
  { name: 'Marathi', regex: /\b(marathi|mar|mr)\b/i },
  { name: 'Punjabi', regex: /\b(punjabi|pan|pa)\b/i },
  { name: 'Gujarati', regex: /\b(gujarati|guj|gu)\b/i },
  { name: 'Urdu', regex: /\b(urdu|urd|ur)\b/i },
  { name: 'Odia', regex: /\b(odia|oriya|ori|or)\b/i },
  { name: 'Assamese', regex: /\b(assamese|asm|as)\b/i },
  { name: 'Bhojpuri', regex: /\b(bhojpuri|bho)\b/i },
  { name: 'Spanish', regex: /\b(spanish|español|espanol|spa|es)\b/i },
  { name: 'French', regex: /\b(french|français|francais|fra|fre|fr)\b/i },
  { name: 'German', regex: /\b(german|deutsch|deu|ger|de)\b/i },
  { name: 'Italian', regex: /\b(italian|italiano|ita|it)\b/i },
  { name: 'Japanese', regex: /\b(japanese|nihongo|jpn|ja)\b/i },
  { name: 'Korean', regex: /\b(korean|hangul|kor|ko)\b/i },
  { name: 'Chinese', regex: /\b(chinese|mandarin|cantonese|zho|chi|zh)\b/i },
  { name: 'Russian', regex: /\b(russian|rus|ru)\b/i },
  { name: 'Portuguese', regex: /\b(portuguese|português|por|pt)\b/i },
  { name: 'Arabic', regex: /\b(arabic|ara|ar)\b/i },
  { name: 'Turkish', regex: /\b(turkish|tur|tr)\b/i },
  { name: 'Thai', regex: /\b(thai|tha|th)\b/i },
  { name: 'Vietnamese', regex: /\b(vietnamese|vie|vi)\b/i },
  { name: 'Indonesian', regex: /\b(indonesian|bahasa|ind|id)\b/i },
  { name: 'Dutch', regex: /\b(dutch|nld|dut|nl)\b/i },
  { name: 'Polish', regex: /\b(polish|pol|pl)\b/i },
  { name: 'Swedish', regex: /\b(swedish|swe|sv)\b/i },
  { name: 'Filipino', regex: /\b(filipino|tagalog|tgl|fil|tl)\b/i }
];

const normalizeStr = (s) => (typeof s === 'string' ? s.toLowerCase().trim() : '');

/**
 * Strips all website URLs, domains, scraper tags, and release clutter from raw strings.
 */
export function stripWebsitesAndJunk(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/\[\s*[^\]]*(?:\.[a-z]{2,4}|movies4u|hdhub4u|4khdhub|vegamovies|bollyflix|katmoviehd|luxmovies)[^\]]*\]/gi, '')
    .replace(/\(\s*[^)]*(?:\.[a-z]{2,4}|movies4u|hdhub4u|4khdhub|vegamovies|bollyflix|katmoviehd|luxmovies)[^)]*\)/gi, '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\b(?:www\.)?[a-zA-Z0-9-]+\.(?:com|org|net|cc|tv|club|clinic|cl|one|foo|vip|tube|in|to|site|xyz|me|info|biz|co|pro|top|is)\b/gi, '')
    .replace(/@\S+/g, '')
    .replace(/\b(movies4u|hdhub4u|4khdhub|vegamovies|bollyflix|katmoviehd|luxmovies|extraprint|stitch|nexplay|hub|tube|clinic|cl|foo|one)\b/gi, '')
    .replace(/\b(web-dl|webrip|bluray|hdrip|brrip|dvdrip|x264|x265|h\.?264|h\.?265|hevc|2160p|1080p|720p|480p|4k|uhd|remux|proper|repack)\b/gi, '')
    .replace(/[\[\]\(\)\{\}\-_.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts pure, clean language name from any track metadata string.
 */
export function extractCleanLanguage(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return null;
  const cleaned = stripWebsitesAndJunk(rawInput).toLowerCase();

  for (const item of KNOWN_LANGUAGES_LIST) {
    if (item.regex.test(cleaned)) {
      return item.name;
    }
  }

  // Also check rawInput directly in case cleaning was overly aggressive
  const rawLower = rawInput.toLowerCase();
  for (const item of KNOWN_LANGUAGES_LIST) {
    if (item.regex.test(rawLower)) {
      return item.name;
    }
  }

  const rawKey = rawInput.toLowerCase().trim();
  if (LANGUAGE_NAMES[rawKey]) {
    return LANGUAGE_NAMES[rawKey];
  }

  return null;
}

/**
 * Returns formatted human-readable display label for an audio or subtitle track.
 * Guarantees zero website names, displaying only clean languages.
 */
export function getTrackDisplayLabel(track, defaultPrefix = 'Track', index = 0, allTracks = []) {
  if (!track) return `${defaultPrefix} ${index + 1}`;

  // 1. Try extracting clean language from label, name, or language property
  const langFromName = extractCleanLanguage(track.name);
  const langFromLabel = extractCleanLanguage(track.label);
  const langFromProp = extractCleanLanguage(track.language);

  const cleanLang = langFromName || langFromLabel || langFromProp;

  if (cleanLang) {
    // Check if there are duplicate tracks with the exact same language in the stream
    if (Array.isArray(allTracks) && allTracks.length > 1) {
      const sameLangTracks = allTracks.filter(t => {
        const otherLang = extractCleanLanguage(t.name) || extractCleanLanguage(t.label) || extractCleanLanguage(t.language);
        return otherLang === cleanLang;
      });

      if (sameLangTracks.length > 1) {
        const myIndexInSame = sameLangTracks.findIndex(t => (
          (t.id != null && track.id != null && String(t.id) === String(track.id)) ||
          (t.trackId != null && track.trackId != null && t.trackId === track.trackId) ||
          t === track
        ));
        const numSuffix = myIndexInSame >= 0 ? myIndexInSame + 1 : index + 1;

        // Check if there is an audio channel/codec descriptor (Atmos, 5.1, 7.1, Stereo)
        const combined = `${track.name || ''} ${track.label || ''}`.toLowerCase();
        let formatTag = '';
        if (combined.includes('atmos')) formatTag = 'Atmos';
        else if (combined.includes('7.1')) formatTag = '7.1';
        else if (combined.includes('5.1')) formatTag = '5.1';
        else if (combined.includes('stereo')) formatTag = 'Stereo';

        if (formatTag) {
          return `${cleanLang} (${formatTag})`;
        }
        return `${cleanLang} ${numSuffix}`;
      }
    }
    return cleanLang;
  }

  // 2. Check ISO 639 code directly from track.language
  const langKey = typeof track.language === 'string' ? track.language.toLowerCase().trim() : '';
  if (langKey && LANGUAGE_NAMES[langKey]) {
    return LANGUAGE_NAMES[langKey];
  }

  // 3. Fallback: completely stripped clean label (never showing websites or domains)
  const raw = typeof track.label === 'string' && track.label.trim()
    ? track.label.trim()
    : (typeof track.name === 'string' ? track.name.trim() : '');

  const cleaned = stripWebsitesAndJunk(raw);
  if (cleaned.length > 0 && !cleaned.toLowerCase().includes('und') && !cleaned.toLowerCase().includes('unknown')) {
    return cleaned;
  }

  return `${defaultPrefix} ${index + 1}`;
}

/**
 * Intelligently select optimal default audio track based on TMDB metadata:
 * - Hollywood movies & series: Defaults to English.
 * - Indian region movies & series: Defaults to official released language from TMDB (e.g. Hindi, Tamil, Telugu, Malayalam, etc.).
 * - If user wants, they can manually change the audio track (manual choice will be respected).
 */
export function selectOptimalDefaultAudioTrack(tracks, mediaInfo) {
  if (!Array.isArray(tracks) || tracks.length === 0) return null;
  if (tracks.length === 1) return tracks[0];

  // 1. Extract TMDB API officially released language and country metadata
  const origLang = normalizeStr(
    mediaInfo?.original_language ||
    mediaInfo?.originalLanguage ||
    mediaInfo?.movie?.original_language ||
    mediaInfo?.movie?.originalLanguage ||
    mediaInfo?.language ||
    (Array.isArray(mediaInfo?.spoken_languages) && mediaInfo.spoken_languages[0]?.iso_639_1) ||
    ''
  );

  const rawOriginCountries = [
    ...(Array.isArray(mediaInfo?.origin_country) ? mediaInfo.origin_country : (mediaInfo?.origin_country ? [mediaInfo.origin_country] : [])),
    ...(Array.isArray(mediaInfo?.production_countries) ? mediaInfo.production_countries.map(c => c?.iso_3166_1 || c?.name || '') : []),
    ...(Array.isArray(mediaInfo?.movie?.origin_country) ? mediaInfo.movie.origin_country : (mediaInfo?.movie?.origin_country ? [mediaInfo.movie.origin_country] : [])),
    ...(Array.isArray(mediaInfo?.movie?.production_countries) ? mediaInfo.movie.production_countries.map(c => c?.iso_3166_1 || c?.name || '') : [])
  ];
  const originCountries = rawOriginCountries.map(normalizeStr);
  const isIndianOrigin = originCountries.includes('in') || originCountries.includes('india') || Boolean(INDIAN_LANGUAGES[origLang]);

  console.log(`[AudioTrackSelector] Evaluating default audio track: origLang="${origLang}", isIndianOrigin=${isIndianOrigin}`);

  // =========================================================================
  // RULE 1: Indian Region Movies & Series
  // Official released language from TMDB API must play by default!
  // E.g.: Tamil movie -> Tamil, Telugu movie -> Telugu, Malayalam -> Malayalam, Hindi -> Hindi.
  // =========================================================================
  if (isIndianOrigin) {
    // 1a. Match the EXACT officially released language from TMDB API
    if (origLang && INDIAN_LANGUAGES[origLang]) {
      const keywords = INDIAN_LANGUAGES[origLang];
      const officialLangName = LANGUAGE_NAMES[origLang] || '';

      const officialMatch = tracks.find(track => {
        const clean = extractCleanLanguage(track.name || track.label || track.language);
        if (clean && officialLangName && clean.toLowerCase() === officialLangName.toLowerCase()) {
          return true;
        }
        const combined = `${track.name || ''} ${track.label || ''} ${track.language || ''}`.toLowerCase();
        return keywords.some(kw => combined.includes(kw) || track.language?.toLowerCase() === kw);
      });

      if (officialMatch) {
        console.log(`[AudioTrackSelector] ✅ Selected official Indian released language track (${origLang} -> ${officialLangName}):`, officialMatch.displayLabel || officialMatch.name);
        return officialMatch;
      }
    }

    // 1b. If the exact official original language track was not matched in the stream, search for ANY Indian track
    for (const [langCode, keywords] of Object.entries(INDIAN_LANGUAGES)) {
      const match = tracks.find(track => {
        const clean = extractCleanLanguage(track.name || track.label || track.language);
        const expected = LANGUAGE_NAMES[langCode];
        if (clean && expected && clean.toLowerCase() === expected.toLowerCase()) {
          return true;
        }
        const combined = `${track.name || ''} ${track.label || ''} ${track.language || ''}`.toLowerCase();
        return keywords.some(kw => combined.includes(kw) || track.language?.toLowerCase() === kw);
      });
      if (match) {
        console.log(`[AudioTrackSelector] ✅ Selected available Indian track (${langCode}):`, match.displayLabel || match.name);
        return match;
      }
    }
  }

  // =========================================================================
  // RULE 2: Hollywood Movies & Series (US, UK, International)
  // Default language must be English!
  // Prefers Atmos/TrueHD > 5.1/7.1 > Original/Stereo.
  // =========================================================================
  const englishMatches = tracks.filter(track => {
    const clean = extractCleanLanguage(track.name || track.label || track.language);
    if (clean === 'English') return true;
    const combined = `${track.name || ''} ${track.label || ''} ${track.language || ''}`.toLowerCase();
    return combined.includes('english') || combined.includes('eng') || track.language?.toLowerCase() === 'en';
  });

  if (englishMatches.length > 0) {
    const scored = englishMatches.map(track => {
      const combined = `${track.name || ''} ${track.label || ''}`.toLowerCase();
      let score = 1;
      if (combined.includes('atmos') || combined.includes('truehd') || combined.includes('dts-hd')) score += 4;
      else if (combined.includes('5.1') || combined.includes('7.1') || combined.includes('surround')) score += 3;
      else if (combined.includes('original') || combined.includes('default')) score += 2;
      return { track, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const bestEnglish = scored[0].track;
    console.log('[AudioTrackSelector] ✅ Selected default English audio track for Hollywood title:', bestEnglish.displayLabel || bestEnglish.name);
    return bestEnglish;
  }

  // =========================================================================
  // RULE 3: Other International Releases (Korean, Japanese, French, Spanish, etc.)
  // If not English and not Indian, prefer original released language from TMDB
  // =========================================================================
  if (origLang && origLang !== 'en') {
    const origMatch = tracks.find(track => {
      const clean = extractCleanLanguage(track.name || track.label || track.language);
      const expected = LANGUAGE_NAMES[origLang];
      if (clean && expected && clean.toLowerCase() === expected.toLowerCase()) return true;
      const combined = `${track.name || ''} ${track.label || ''} ${track.language || ''}`.toLowerCase();
      return combined.includes(origLang);
    });
    if (origMatch) {
      console.log(`[AudioTrackSelector] ✅ Selected original international language track (${origLang}):`, origMatch.displayLabel || origMatch.name);
      return origMatch;
    }
  }

  // Fallback to first available audio track
  return tracks[0];
}
