/**
 * TV Serials Metadata Cache & Multi-Server Engine
 * 
 * Supports:
 * - Server 1: Tamildhool (tamildhool.tech)
 * - Server 2: Tamilgun (arivumani.net)
 * - Cached metadata & hero images for both servers (zero-latency offline-first)
 * - Channel logos & metadata
 * - Episode date resolver
 */

export const SERVERS = [
  {
    id: 'tamildhool',
    name: 'Tamildhool',
    displayName: 'Server 1: Tamildhool',
    domain: 'tamildhool.tech',
    protocol: 'JSON Scrape',
    cdn: 'Bunny Stream CDN',
    latency: '12ms',
    status: 'Online',
    color: '#3b82f6'
  },
  {
    id: 'tamilgun',
    name: 'Tamilgun (arivumani.net)',
    displayName: 'Server 2: Tamilgun',
    domain: 'arivumani.net',
    protocol: 'PlayAllu AES Decrypt',
    cdn: 'PlayAllu / Bunny CDN',
    latency: '18ms',
    status: 'Online',
    color: '#10b981'
  }
];

export const CHANNELS = [
  {
    id: 'sun',
    code: 'sun',
    name: 'Sun TV',
    tamilName: 'சன் டிவி',
    color: '#f97316',
    icon: 'sunny',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6f/Sun_TV_logo.svg/300px-Sun_TV_logo.svg.png',
    secondaryLogoUrl: 'https://static.wikia.nocookie.net/logopedia/images/4/4b/Sun_TV_2010.png'
  },
  {
    id: 'vijay',
    code: 'vijay',
    name: 'Star Vijay',
    tamilName: 'விஜய் டிவி',
    color: '#ef4444',
    icon: 'star',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/87/Star_Vijay_logo_2017.png/300px-Star_Vijay_logo_2017.png',
    secondaryLogoUrl: 'https://static.wikia.nocookie.net/logopedia/images/b/b3/Star_Vijay.png'
  },
  {
    id: 'zee',
    code: 'zee',
    name: 'Zee Tamil',
    tamilName: 'ஜீ தமிழ்',
    color: '#a855f7',
    icon: 'sparkles',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b5/Zee_Tamil_logo.svg/300px-Zee_Tamil_logo.svg.png',
    secondaryLogoUrl: 'https://static.wikia.nocookie.net/logopedia/images/e/e0/Zee_Tamil.png'
  },
  {
    id: 'ktv',
    code: 'ktv',
    name: 'KTV',
    tamilName: 'கே டிவி',
    color: '#0ea5e9',
    icon: 'film',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9f/KTV_logo.svg/300px-KTV_logo.svg.png',
    secondaryLogoUrl: 'https://static.wikia.nocookie.net/logopedia/images/a/ab/Ktv.png'
  }
];

// Rich Curated Metadata Cache with Hero Backdrops & Posters for Server 1 (Tamildhool)
export const TAMILDHOOL_SERIALS_CACHE = [
  {
    id: 'td_baakiyalakshmi',
    serialCode: 'baakiyalakshmi',
    title: 'Baakiyalakshmi',
    tamilTitle: 'பாக்கியலட்சுமி',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    timeSlot: '08:30 PM',
    episodesCount: '1240 episodes logged',
    episodes: '1240 Eps',
    tag: 'Prime Slot',
    networkTag: 'VIJAY TV • FEATURED',
    networkColor: '#2563eb',
    description: 'A moving tale of a dedicated homemaker who seeks out her independent identity against challenging odds.',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/5y3tXb0p1jD7Wn5x7Q4k4W1H3mO.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0w243l.jpg',
    bgColor: '#161329',
    tamilColor: '#38bdf8',
    borderColor: 'rgba(168, 85, 247, 0.25)',
    server: 'tamildhool'
  },
  {
    id: 'td_kayal',
    serialCode: 'kayal',
    title: 'Kayal',
    tamilTitle: 'கயல்',
    channel: 'Sun TV',
    channelCode: 'sun',
    timeSlot: '07:30 PM',
    episodesCount: '620 episodes logged',
    episodes: '620 Eps',
    tag: 'Top Daily Soap',
    networkTag: 'SUN TV • POPULAR',
    networkColor: '#f97316',
    description: 'A resilient elder sister shoulders her entire family responsibilities, overcoming personal and financial hurdles.',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/6KEJ63b53w5Wp4K31E0tZ1Wq43D.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w500/eW3k7zW5w4l1q6E7E0w243lK.jpg',
    bgColor: '#1a162b',
    tamilColor: '#38bdf8',
    borderColor: 'rgba(168, 85, 247, 0.25)',
    server: 'tamildhool'
  },
  {
    id: 'td_siragadikka_aasai',
    serialCode: 'siragadikka_aasai',
    title: 'Siragadikka Aasai',
    tamilTitle: 'சிறகடிக்க ஆசை',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    timeSlot: '09:00 PM',
    episodesCount: '410 episodes logged',
    episodes: '410 Eps',
    tag: 'High TRP',
    networkTag: 'VIJAY TV • TRENDING',
    networkColor: '#ef4444',
    description: 'An emotional roller coaster between Muthu and Meena striving for love, acceptance and dignity amidst family conflicts.',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/8k1b53w5Wp4K31E0tZ1Wq43D.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w500/fW3k7zW5w4l1q6E7E0w243lK.jpg',
    bgColor: '#281119',
    tamilColor: '#fda4af',
    borderColor: 'rgba(244, 63, 94, 0.25)',
    server: 'tamildhool'
  },
  {
    id: 'td_karthigai_deepam',
    serialCode: 'karthigai_deepam',
    title: 'Karthigai Deepam',
    tamilTitle: 'கார்த்திகை தீபம்',
    channel: 'Zee Tamil',
    channelCode: 'zee',
    timeSlot: '08:00 PM',
    episodesCount: '380 episodes logged',
    episodes: '380 Eps',
    tag: 'Prime Slot',
    networkTag: 'ZEE TAMIL • PRIME',
    networkColor: '#a855f7',
    description: 'Deepa battles social prejudice against dark skin tones through her soulful musical talent and unwavering faith.',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/7KEJ63b53w5Wp4K31E0tZ1Wq43D.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w500/dW3k7zW5w4l1q6E7E0w243lK.jpg',
    bgColor: '#111a22',
    tamilColor: '#38bdf8',
    borderColor: 'rgba(56, 189, 248, 0.25)',
    server: 'tamildhool'
  },
  {
    id: 'td_vanathai_pola',
    serialCode: 'vanathai_pola',
    title: 'Vanathai Pola',
    tamilTitle: 'வானத்தைப்போல',
    channel: 'Sun TV',
    channelCode: 'sun',
    timeSlot: '06:30 PM',
    episodesCount: '710 episodes logged',
    episodes: '710 Eps',
    tag: 'Long Running',
    networkTag: 'SUN TV • EVENING',
    networkColor: '#f97316',
    description: 'The profound sibling bond between Chinrasu and Thulasi as they navigate marriage and family relationships.',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/9KEJ63b53w5Wp4K31E0tZ1Wq43D.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w500/cW3k7zW5w4l1q6E7E0w243lK.jpg',
    bgColor: '#0c211a',
    tamilColor: '#6ee7b7',
    borderColor: 'rgba(110, 231, 183, 0.25)',
    server: 'tamildhool'
  },
  {
    id: 'td_pandian_stores_2',
    serialCode: 'pandian_stores_2',
    title: 'Pandian Stores 2',
    tamilTitle: 'பாண்டியன் ஸ்டோர்ஸ் 2',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    timeSlot: '08:00 PM',
    episodesCount: '250 episodes logged',
    episodes: '250 Eps',
    tag: 'Prime Family',
    networkTag: 'VIJAY TV • HIT',
    networkColor: '#ef4444',
    description: 'Pandian and his sons work together to build their family grocery empire with traditional moral values.',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/4KEJ63b53w5Wp4K31E0tZ1Wq43D.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w500/bW3k7zW5w4l1q6E7E0w243lK.jpg',
    bgColor: '#1c182d',
    tamilColor: '#fbbf24',
    borderColor: 'rgba(251, 191, 36, 0.25)',
    server: 'tamildhool'
  },
  {
    id: 'td_singapennae',
    serialCode: 'singapennae',
    title: 'Singapennae',
    tamilTitle: 'சிங்கப்பெண்ணே',
    channel: 'Sun TV',
    channelCode: 'sun',
    timeSlot: '08:00 PM',
    episodesCount: '310 episodes logged',
    episodes: '310 Eps',
    tag: 'TRP Leader',
    networkTag: 'SUN TV • PRIME',
    networkColor: '#f97316',
    description: 'Anandam leaves her serene village to work in the Chennai garment industry to redeem her family farm.',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/3KEJ63b53w5Wp4K31E0tZ1Wq43D.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w500/aW3k7zW5w4l1q6E7E0w243lK.jpg',
    bgColor: '#201614',
    tamilColor: '#fdba74',
    borderColor: 'rgba(253, 186, 116, 0.25)',
    server: 'tamildhool'
  }
];

// Rich Curated Metadata Cache with Hero Backdrops & Posters for Server 2 (Tamilgun - arivumani.net)
export const TAMILGUN_SERIALS_CACHE = [
  {
    id: 'tg_kayal',
    serialCode: 'kayal',
    title: 'Kayal',
    tamilTitle: 'கயல்',
    channel: 'Sun TV',
    channelCode: 'sun',
    timeSlot: '07:30 PM',
    episodesCount: '620 episodes logged',
    episodes: '620 Eps',
    tag: 'Daily Broadcast',
    networkTag: 'ARIVUMANI • SUN TV',
    networkColor: '#10b981',
    description: 'Server 2 mirror stream: Kayal daily broadcast with Bunny CDN and high quality audio channels.',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/6KEJ63b53w5Wp4K31E0tZ1Wq43D.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w500/eW3k7zW5w4l1q6E7E0w243lK.jpg',
    bgColor: '#161329',
    tamilColor: '#38bdf8',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    server: 'tamilgun'
  },
  {
    id: 'tg_baakiyalakshmi',
    serialCode: 'baakiyalakshmi',
    title: 'Baakiyalakshmi',
    tamilTitle: 'பாக்கியலட்சுமி',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    timeSlot: '08:30 PM',
    episodesCount: '1240 episodes logged',
    episodes: '1240 Eps',
    tag: 'Daily Broadcast',
    networkTag: 'ARIVUMANI • VIJAY TV',
    networkColor: '#10b981',
    description: 'Server 2 mirror stream: Baakiyalakshmi serial high quality archive with PlayAllu decryption.',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/5y3tXb0p1jD7Wn5x7Q4k4W1H3mO.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0w243l.jpg',
    bgColor: '#1c182d',
    tamilColor: '#fbbf24',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    server: 'tamilgun'
  },
  {
    id: 'tg_siragadikka_aasai',
    serialCode: 'siragadikka_aasai',
    title: 'Siragadikka Aasai',
    tamilTitle: 'சிறகடிக்க ஆசை',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    timeSlot: '09:00 PM',
    episodesCount: '410 episodes logged',
    episodes: '410 Eps',
    tag: 'Daily Broadcast',
    networkTag: 'ARIVUMANI • VIJAY TV',
    networkColor: '#10b981',
    description: 'Server 2 mirror stream: Siragadikka Aasai fast loading streams with zero commercial delays.',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/8k1b53w5Wp4K31E0tZ1Wq43D.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w500/fW3k7zW5w4l1q6E7E0w243lK.jpg',
    bgColor: '#281119',
    tamilColor: '#fda4af',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    server: 'tamilgun'
  },
  {
    id: 'tg_karthigai_deepam',
    serialCode: 'karthigai_deepam',
    title: 'Karthigai Deepam',
    tamilTitle: 'கார்த்திகை தீபம்',
    channel: 'Zee Tamil',
    channelCode: 'zee',
    timeSlot: '08:00 PM',
    episodesCount: '380 episodes logged',
    episodes: '380 Eps',
    tag: 'Daily Broadcast',
    networkTag: 'ARIVUMANI • ZEE TAMIL',
    networkColor: '#10b981',
    description: 'Server 2 mirror stream: Karthigai Deepam full episode archive available for on-demand playback.',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/7KEJ63b53w5Wp4K31E0tZ1Wq43D.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w500/dW3k7zW5w4l1q6E7E0w243lK.jpg',
    bgColor: '#111a22',
    tamilColor: '#38bdf8',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    server: 'tamilgun'
  },
  {
    id: 'tg_sundari',
    serialCode: 'sundari',
    title: 'Sundari',
    tamilTitle: 'சுந்தரி',
    channel: 'Sun TV',
    channelCode: 'sun',
    timeSlot: '07:00 PM',
    episodesCount: '950 episodes logged',
    episodes: '950 Eps',
    tag: 'Daily Broadcast',
    networkTag: 'ARIVUMANI • SUN TV',
    networkColor: '#10b981',
    description: 'A courageous village girl pursues her dream of clearing the IAS exam while confronting social stereotypes.',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/2KEJ63b53w5Wp4K31E0tZ1Wq43D.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w500/zW3k7zW5w4l1q6E7E0w243lK.jpg',
    bgColor: '#201614',
    tamilColor: '#fdba74',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    server: 'tamilgun'
  }
];

// Popular Reality Shows for both servers
export const REALITY_SHOWS_CACHE = [
  {
    id: 'super_singer_10',
    serialCode: 'super_singer_10',
    title: 'Super Singer S10',
    tamilTitle: 'சூப்பர் சிங்கர்',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    genre: 'Variety',
    timeSlot: 'Sat-Sun 8 PM',
    episodesCount: '84 episodes logged',
    bgColor: '#13192e',
    tamilColor: '#93c5fd',
    borderColor: 'rgba(59, 130, 246, 0.25)'
  },
  {
    id: 'cooku_with_comali_5',
    serialCode: 'cooku_with_comali_5',
    title: 'Cooku With Comali S5',
    tamilTitle: 'குக் வித் கோமாளி',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    genre: 'Variety',
    timeSlot: 'Sat-Sun 9:30 PM',
    episodesCount: '52 episodes logged',
    bgColor: '#19152b',
    tamilColor: '#c084fc',
    borderColor: 'rgba(192, 132, 252, 0.25)'
  },
  {
    id: 'sa_re_ga_ma_pa',
    serialCode: 'sa_re_ga_ma_pa',
    title: 'Sa Re Ga Ma Pa S4',
    tamilTitle: 'ஸ ரி க ம ப',
    channel: 'Zee Tamil',
    channelCode: 'zee',
    genre: 'Variety',
    timeSlot: 'Sat-Sun 7 PM',
    episodesCount: '60 episodes logged',
    bgColor: '#291118',
    tamilColor: '#fde047',
    borderColor: 'rgba(244, 63, 94, 0.25)'
  },
  {
    id: 'mr_mrs_chinnathirai',
    serialCode: 'mr_mrs_chinnathirai',
    title: 'Mr & Mrs Chinnathirai',
    tamilTitle: 'மிஸ்டர் & மிஸஸ் சின்னத்...',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    genre: 'Variety',
    timeSlot: 'Sunday 9 PM',
    episodesCount: '48 episodes logged',
    bgColor: '#281b11',
    tamilColor: '#fcd34d',
    borderColor: 'rgba(245, 158, 11, 0.25)'
  },
  {
    id: 'top_cooku_dupe_cooku',
    serialCode: 'top_cooku_dupe_cooku',
    title: 'Top Cooku Dupe Cooku',
    tamilTitle: 'டாப் குக்கு டூப் குக்கு',
    channel: 'Sun TV',
    channelCode: 'sun',
    genre: 'Variety',
    timeSlot: 'Sunday 8:30 PM',
    episodesCount: '42 episodes logged',
    bgColor: '#101e2b',
    tamilColor: '#67e8f9',
    borderColor: 'rgba(6, 182, 212, 0.25)'
  }
];

/**
 * Get Cached Serials for the active server
 */
export function getCachedSerialsForServer(serverId = 'tamildhool') {
  if (serverId === 'tamilgun') {
    return TAMILGUN_SERIALS_CACHE;
  }
  return TAMILDHOOL_SERIALS_CACHE;
}

/**
 * Find serial by id or code
 */
export function findSerial(serialIdOrCode, serverId = 'tamildhool') {
  const list = getCachedSerialsForServer(serverId);
  const found = list.find(s => s.id === serialIdOrCode || s.serialCode === serialIdOrCode);
  if (found) return found;
  const inReality = REALITY_SHOWS_CACHE.find(r => r.id === serialIdOrCode || r.serialCode === serialIdOrCode);
  return inReality || list[0];
}
