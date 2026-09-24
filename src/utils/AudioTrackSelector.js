/**
 * AudioTrackSelector.js
 * 
 * Intelligent language & origin-based audio track selection engine.
 * 
 * Rules:
 * 1. Hollywood / Western Content:
 *    - Defaults to English when an English track exists.
 *    - Prefers best quality/format: Atmos/TrueHD > 5.1/7.1 Surround > AAC/Original > Plain English.
 *    - Never automatically selects dubbed tracks (Hindi, Tamil, Telugu, Spanish, etc.) for Hollywood content.
 * 
 * 2. Indian Movies & Series:
 *    - Defaults to original/native audio language (Hindi -> Hindi, Tamil -> Tamil, Telugu -> Telugu, Malayalam -> Malayalam, etc.).
 *    - Never switches Indian content to English just because an English dub exists.
 * 
 * 3. Manual Selection Lock:
 *    - If the user manually picks a track, respect and lock that track for the session.
 */

export const INDIAN_LANGUAGES = {
  'hi': ['hindi', 'hin'],
  'ta': ['tamil', 'tam'],
  'te': ['telugu', 'tel'],
  'ml': ['malayalam', 'mal'],
  'kn': ['kannada', 'kan'],
  'bn': ['bengali', 'ben', 'bangla'],
  'mr': ['marathi', 'mar'],
  'pa': ['punjabi', 'pan'],
  'gu': ['gujarati', 'guj'],
  'ur': ['urdu', 'urd'],
  'or': ['odia', 'ori']
};

export const LANGUAGE_NAMES = {
  'en': 'English', 'eng': 'English',
  'hi': 'Hindi', 'hin': 'Hindi',
  'ta': 'Tamil', 'tam': 'Tamil',
  'te': 'Telugu', 'tel': 'Telugu',
  'ml': 'Malayalam', 'mal': 'Malayalam',
  'kn': 'Kannada', 'kan': 'Kannada',
  'bn': 'Bengali', 'ben': 'Bengali',
  'mr': 'Marathi', 'mar': 'Marathi',
  'pa': 'Punjabi', 'pan': 'Punjabi',
  'gu': 'Gujarati', 'guj': 'Gujarati',
  'ur': 'Urdu', 'urd': 'Urdu',
  'or': 'Odia', 'ori': 'Odia',
  'es': 'Spanish', 'spa': 'Spanish',
  'fr': 'French', 'fra': 'French', 'fre': 'French',
  'de': 'German', 'deu': 'German', 'ger': 'German',
  'it': 'Italian', 'ita': 'Italian',
  'ja': 'Japanese', 'jpn': 'Japanese',
  'ko': 'Korean', 'kor': 'Korean',
  'zh': 'Chinese', 'zho': 'Chinese', 'chi': 'Chinese',
  'ru': 'Russian', 'rus': 'Russian',
  'pt': 'Portuguese', 'por': 'Portuguese',
  'ar': 'Arabic', 'ara': 'Arabic',
  'tr': 'Turkish', 'tur': 'Turkish',
};

const normalizeStr = (s) => (typeof s === 'string' ? s.toLowerCase().trim() : '');

/**
 * Returns formatted human-readable display label for a track.
 */
export function getTrackDisplayLabel(track, defaultPrefix = 'Track', index = 0) {
  if (!track) return `${defaultPrefix} ${index + 1}`;
  
  const rawLabel = typeof track.label === 'string' ? track.label.trim() : '';
  if (rawLabel.length > 0 && !rawLabel.toLowerCase().includes('und') && !rawLabel.toLowerCase().includes('unknown')) {
    return rawLabel;
  }
  
  const langKey = typeof track.language === 'string' ? track.language.toLowerCase().trim() : '';
  if (langKey && LANGUAGE_NAMES[langKey]) {
    return LANGUAGE_NAMES[langKey];
  }
  
  const name = typeof track.name === 'string' ? track.name.trim() : '';
  if (name.length > 0) {
    return name;
  }
  
  return langKey ? langKey.toUpperCase() : `${defaultPrefix} ${index + 1}`;
}

/**
 * Intelligently select optimal default audio track based on content metadata.
 */
export function selectOptimalDefaultAudioTrack(tracks, details) {
  if (!Array.isArray(tracks) || tracks.length === 0) return null;
  if (tracks.length === 1) return tracks[0];

  const origLang = normalizeStr(
    details?.original_language ||
    details?.originalLanguage ||
    details?.movie?.original_language ||
    details?.movie?.originalLanguage ||
    details?.language ||
    (Array.isArray(details?.spoken_languages) && details.spoken_languages[0]?.iso_639_1) ||
    ''
  );

  const rawOriginCountries = [
    ...(Array.isArray(details?.origin_country) ? details.origin_country : (details?.origin_country ? [details.origin_country] : [])),
    ...(Array.isArray(details?.production_countries) ? details.production_countries.map(c => c?.iso_3166_1 || c?.name || '') : []),
    ...(Array.isArray(details?.movie?.origin_country) ? details.movie.origin_country : (details?.movie?.origin_country ? [details.movie.origin_country] : [])),
    ...(Array.isArray(details?.movie?.production_countries) ? details.movie.production_countries.map(c => c?.iso_3166_1 || c?.name || '') : [])
  ];
  const originCountries = rawOriginCountries.map(normalizeStr);
  const isIndianOrigin = originCountries.includes('in') || originCountries.includes('india') || Boolean(INDIAN_LANGUAGES[origLang]);

  // Case 1: Indian Content -> Native original language is default
  if (isIndianOrigin) {
    // 1a. If specific original language is identified in INDIAN_LANGUAGES
    if (origLang && INDIAN_LANGUAGES[origLang]) {
      const keywords = INDIAN_LANGUAGES[origLang];
      const nativeMatch = tracks.find(track => {
        const label = normalizeStr(track.label || track.name || track.displayLabel);
        const lang = normalizeStr(track.language);
        return keywords.some(kw => label.includes(kw) || lang.includes(kw) || lang === origLang);
      });
      if (nativeMatch) {
        console.log(`[AudioTrackSelector] 🇮🇳 Selected native Indian original track (${origLang}):`, nativeMatch.label || nativeMatch.name);
        return nativeMatch;
      }
    }

    // 1b. If general Indian content but specific origLang track not matched yet, search for ANY Indian track
    for (const [langCode, keywords] of Object.entries(INDIAN_LANGUAGES)) {
      const match = tracks.find(track => {
        const label = normalizeStr(track.label || track.name || track.displayLabel);
        const lang = normalizeStr(track.language);
        return keywords.some(kw => label.includes(kw) || lang.includes(kw) || lang === langCode);
      });
      if (match) {
        console.log(`[AudioTrackSelector] 🇮🇳 Selected Indian track (${langCode}):`, match.label || match.name);
        return match;
      }
    }
  }

  // Case 2: Hollywood / Western Content -> Default to English (preferring high-fidelity Atmos > 5.1/7.1 > stereo)
  const englishMatches = tracks.filter(track => {
    const label = normalizeStr(track.label || track.name || track.displayLabel);
    const lang = normalizeStr(track.language);
    return label.includes('english') || label.includes('eng') || lang === 'en' || lang === 'eng';
  });

  if (englishMatches.length > 0) {
    const scored = englishMatches.map(track => {
      const label = normalizeStr(track.label || track.name || track.displayLabel);
      let score = 1;
      if (label.includes('atmos') || label.includes('truehd') || label.includes('dts-hd') || label.includes('dts')) score += 4;
      else if (label.includes('5.1') || label.includes('7.1') || label.includes('surround')) score += 3;
      else if (label.includes('original') || label.includes('default')) score += 2;
      return { track, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const bestEnglish = scored[0].track;
    console.log('[AudioTrackSelector] 🎬 Selected optimal English track for Hollywood content:', bestEnglish.label || bestEnglish.name);
    return bestEnglish;
  }

  // Case 3: Other International Content (Korean, Japanese, French, etc.) -> Prefer original if available
  if (origLang && origLang !== 'en') {
    const origMatch = tracks.find(track => {
      const label = normalizeStr(track.label || track.name || track.displayLabel);
      const lang = normalizeStr(track.language);
      return lang === origLang || label.includes(origLang);
    });
    if (origMatch) {
      console.log(`[AudioTrackSelector] 🌐 Selected original language track (${origLang}):`, origMatch.label || origMatch.name);
      return origMatch;
    }
  }

  // Case 4: Default fallback
  return tracks[0];
}
