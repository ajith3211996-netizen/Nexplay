/**
 * TV Serials Metadata Cache & Multi-Server Engine
 * 
 * Supports:
 * - Server 1: Tamildhool (tamildhool.tech)
 * - Server 2: Tamilgun (arivumani.net)
 * - Cached metadata & hero images for both servers
 * - Channels (Sun TV, Star Vijay, Zee Tamil)
 * - TV Programmes & Special Shows
 */

export const SERVERS = [
  {
    id: 'tamildhool',
    name: 'Tamildhool',
    displayName: 'Server 1 (Tamildhool)',
    shortName: 'Server 1',
    domain: 'tamildhool.tech',
    protocol: 'JSON Scrape',
    cdn: 'Bunny Stream CDN',
    latency: '0ms',
    status: 'Online',
    color: '#2563eb'
  },
  {
    id: 'tamilgun',
    name: 'Tamilgun (arivumani.net)',
    displayName: 'Server 2 (Tamilgun)',
    shortName: 'Server 2',
    domain: 'arivumani.net',
    protocol: 'PlayAllu AES Decrypt',
    cdn: 'PlayAllu / Bunny CDN',
    latency: '0ms',
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
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6f/Sun_TV_logo.svg/300px-Sun_TV_logo.svg.png'
  },
  {
    id: 'vijay',
    code: 'vijay',
    name: 'Star Vijay',
    tamilName: 'விஜய் டிவி',
    color: '#ef4444',
    icon: 'star',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/87/Star_Vijay_logo_2017.png/300px-Star_Vijay_logo_2017.png'
  },
  {
    id: 'zee',
    code: 'zee',
    name: 'Zee Tamil',
    tamilName: 'ஜீ தமிழ்',
    color: '#a855f7',
    icon: 'sparkles',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b5/Zee_Tamil_logo.svg/300px-Zee_Tamil_logo.svg.png'
  }
];

// Rich Curated Metadata Cache for Server 1 (Tamildhool)
export const TAMILDHOOL_SERIALS_CACHE = [
  {
    id: 'td_kayal',
    serialCode: 'kayal',
    title: 'Kayal',
    tamilTitle: 'கயல்',
    channel: 'Sun TV',
    channelCode: 'sun',
    timeSlot: '07:30 PM',
    episodesCount: '1240 episodes logged',
    episodes: '1240 Eps',
    tag: 'Daily Soap',
    networkTag: 'SUN TV • PRIME',
    networkColor: '#f97316',
    description: 'A resilient elder sister shoulders her entire family responsibilities, overcoming personal and financial hurdles.',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    bgColor: '#1a162b',
    tamilColor: '#38bdf8',
    borderColor: 'rgba(168, 85, 247, 0.25)',
    server: 'tamildhool'
  },
  {
    id: 'td_baakiyalakshmi',
    serialCode: 'baakiyalakshmi',
    title: 'Baakiyalakshmi',
    tamilTitle: 'பாக்கியலட்சுமி',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    timeSlot: '08:30 PM',
    episodesCount: '1350 episodes logged',
    episodes: '1350 Eps',
    tag: 'Prime Slot',
    networkTag: 'VIJAY TV • FEATURED',
    networkColor: '#2563eb',
    description: 'A moving tale of a dedicated homemaker who seeks out her independent identity against challenging odds.',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    bgColor: '#161329',
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
    episodesCount: '480 episodes logged',
    episodes: '480 Eps',
    tag: 'Top TRP',
    networkTag: 'VIJAY TV • TRENDING',
    networkColor: '#ef4444',
    description: 'An emotional roller coaster between Muthu and Meena striving for love, acceptance and dignity amidst family conflicts.',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
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
    episodesCount: '510 episodes logged',
    episodes: '510 Eps',
    tag: 'Daily Soap',
    networkTag: 'ZEE TAMIL • PRIME',
    networkColor: '#a855f7',
    description: 'Deepa battles social prejudice against dark skin tones through her soulful musical talent and unwavering faith.',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
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
    episodesCount: '890 episodes logged',
    episodes: '890 Eps',
    tag: 'Family Drama',
    networkTag: 'SUN TV • EVENING',
    networkColor: '#f97316',
    description: 'The profound sibling bond between Chinrasu and Thulasi as they navigate marriage and family relationships.',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    bgColor: '#0c211a',
    tamilColor: '#6ee7b7',
    borderColor: 'rgba(110, 231, 183, 0.25)',
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
    episodesCount: '410 episodes logged',
    episodes: '410 Eps',
    tag: 'TRP Leader',
    networkTag: 'SUN TV • PRIME',
    networkColor: '#f97316',
    description: 'Anandam leaves her serene village to work in the Chennai garment industry to redeem her family farm.',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    bgColor: '#201614',
    tamilColor: '#fdba74',
    borderColor: 'rgba(253, 186, 116, 0.25)',
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
    episodesCount: '320 episodes logged',
    episodes: '320 Eps',
    tag: 'Family Drama',
    networkTag: 'VIJAY TV • HIT',
    networkColor: '#ef4444',
    description: 'Pandian and his sons work together to build their family grocery empire with traditional moral values.',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    bgColor: '#1c182d',
    tamilColor: '#fbbf24',
    borderColor: 'rgba(251, 191, 36, 0.25)',
    server: 'tamildhool'
  },
  {
    id: 'td_sundari',
    serialCode: 'sundari',
    title: 'Sundari',
    tamilTitle: 'சுந்தரி',
    channel: 'Sun TV',
    channelCode: 'sun',
    timeSlot: '07:00 PM',
    episodesCount: '1050 episodes logged',
    episodes: '1050 Eps',
    tag: 'Daily Soap',
    networkTag: 'SUN TV • PRIME',
    networkColor: '#f97316',
    description: 'A courageous village girl pursues her dream of clearing the IAS exam while confronting social stereotypes.',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    bgColor: '#1f1622',
    tamilColor: '#f472b6',
    borderColor: 'rgba(244, 114, 182, 0.25)',
    server: 'tamildhool'
  },
  {
    id: 'td_iniya',
    serialCode: 'iniya',
    title: 'Iniya',
    tamilTitle: 'இனியா',
    channel: 'Sun TV',
    channelCode: 'sun',
    timeSlot: '09:30 PM',
    episodesCount: '580 episodes logged',
    episodes: '580 Eps',
    tag: 'Daily Soap',
    networkTag: 'SUN TV • NIGHT',
    networkColor: '#f97316',
    description: 'Iniya strives to balance her independent identity and marital life with Vikram.',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
    bgColor: '#151f2b',
    tamilColor: '#38bdf8',
    borderColor: 'rgba(56, 189, 248, 0.25)',
    server: 'tamildhool'
  },
  {
    id: 'td_anna',
    serialCode: 'anna',
    title: 'Anna',
    tamilTitle: 'அண்ணா',
    channel: 'Zee Tamil',
    channelCode: 'zee',
    timeSlot: '08:30 PM',
    episodesCount: '490 episodes logged',
    episodes: '490 Eps',
    tag: 'Daily Soap',
    networkTag: 'ZEE TAMIL • PRIME',
    networkColor: '#a855f7',
    description: 'A dedicated brother fights against the village corrupt landlords to protect and marry his sisters.',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    bgColor: '#1e1628',
    tamilColor: '#c084fc',
    borderColor: 'rgba(192, 132, 252, 0.25)',
    server: 'tamildhool'
  }
];

// Rich Curated Metadata Cache for Server 2 (Tamilgun - arivumani.net)
export const TAMILGUN_SERIALS_CACHE = [
  {
    id: 'tg_kayal',
    serialCode: 'kayal',
    title: 'Kayal',
    tamilTitle: 'கயல்',
    channel: 'Sun TV',
    channelCode: 'sun',
    timeSlot: '07:30 PM',
    episodesCount: '1240 episodes logged',
    episodes: '1240 Eps',
    tag: 'Server 2 Mirror',
    networkTag: 'ARIVUMANI • SUN TV',
    networkColor: '#10b981',
    description: 'Server 2 mirror stream: Kayal daily broadcast with Bunny CDN and high quality audio channels.',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
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
    episodesCount: '1350 episodes logged',
    episodes: '1350 Eps',
    tag: 'Server 2 Mirror',
    networkTag: 'ARIVUMANI • VIJAY TV',
    networkColor: '#10b981',
    description: 'Server 2 mirror stream: Baakiyalakshmi serial high quality archive with PlayAllu decryption.',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
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
    episodesCount: '480 episodes logged',
    episodes: '480 Eps',
    tag: 'Server 2 Mirror',
    networkTag: 'ARIVUMANI • VIJAY TV',
    networkColor: '#10b981',
    description: 'Server 2 mirror stream: Siragadikka Aasai fast loading streams with zero commercial delays.',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
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
    episodesCount: '510 episodes logged',
    episodes: '510 Eps',
    tag: 'Server 2 Mirror',
    networkTag: 'ARIVUMANI • ZEE TAMIL',
    networkColor: '#10b981',
    description: 'Server 2 mirror stream: Karthigai Deepam full episode archive available for on-demand playback.',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    bgColor: '#111a22',
    tamilColor: '#38bdf8',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    server: 'tamilgun'
  },
  {
    id: 'tg_singapennae',
    serialCode: 'singapennae',
    title: 'Singapennae',
    tamilTitle: 'சிங்கப்பெண்ணே',
    channel: 'Sun TV',
    channelCode: 'sun',
    timeSlot: '08:00 PM',
    episodesCount: '410 episodes logged',
    episodes: '410 Eps',
    tag: 'Server 2 Mirror',
    networkTag: 'ARIVUMANI • SUN TV',
    networkColor: '#10b981',
    description: 'Server 2 mirror stream: Anandam inspiring journey in Chennai garment industry.',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    bgColor: '#201614',
    tamilColor: '#fdba74',
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
    episodesCount: '1050 episodes logged',
    episodes: '1050 Eps',
    tag: 'Server 2 Mirror',
    networkTag: 'ARIVUMANI • SUN TV',
    networkColor: '#10b981',
    description: 'A courageous village girl pursues her dream of clearing the IAS exam while confronting social stereotypes.',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    bgColor: '#201614',
    tamilColor: '#fdba74',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    server: 'tamilgun'
  }
];

// Popular Reality Shows
export const REALITY_SHOWS_CACHE = [
  {
    id: 'super_singer_10',
    serialCode: 'super_singer',
    title: 'Super Singer S10',
    tamilTitle: 'சூப்பர் சிங்கர் 10',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    genre: 'Variety',
    timeSlot: 'Sat-Sun 08:00 PM',
    episodesCount: '84 episodes logged',
    bgColor: '#13192e',
    tamilColor: '#93c5fd',
    borderColor: 'rgba(59, 130, 246, 0.25)'
  },
  {
    id: 'cooku_with_comali_5',
    serialCode: 'cooku_with_comali',
    title: 'Cooku With Comali S5',
    tamilTitle: 'குக் வித் கோமாளி 5',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    genre: 'Variety',
    timeSlot: 'Sat-Sun 09:30 PM',
    episodesCount: '52 episodes logged',
    bgColor: '#19152b',
    tamilColor: '#c084fc',
    borderColor: 'rgba(192, 132, 252, 0.25)'
  },
  {
    id: 'sa_re_ga_ma_pa',
    serialCode: 'sa_re_ga_ma_pa',
    title: 'Sa Re Ga Ma Pa S4',
    tamilTitle: 'ஸ ரி க ம ப 4',
    channel: 'Zee Tamil',
    channelCode: 'zee',
    genre: 'Variety',
    timeSlot: 'Sat-Sun 07:00 PM',
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
    timeSlot: 'Sunday 09:00 PM',
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
    timeSlot: 'Sunday 08:30 PM',
    episodesCount: '42 episodes logged',
    bgColor: '#101e2b',
    tamilColor: '#67e8f9',
    borderColor: 'rgba(6, 182, 212, 0.25)'
  }
];

// TV Programmes & Talk Shows Category
export const TV_PROGRAMMES_CACHE = [
  {
    id: 'prg_neeya_naana',
    serialCode: 'neeya_naana',
    title: 'Neeya Naana',
    tamilTitle: 'நீயா நானா',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    genre: 'Talk Show',
    timeSlot: 'Sunday 12:30 PM',
    episodesCount: '820 episodes logged',
    tag: 'Debate Show',
    bgColor: '#1a192b',
    tamilColor: '#93c5fd',
    borderColor: 'rgba(59, 130, 246, 0.25)'
  },
  {
    id: 'prg_tamizha_tamizha',
    serialCode: 'tamizha_tamizha',
    title: 'Tamizha Tamizha',
    tamilTitle: 'தமிழா தமிழா',
    channel: 'Zee Tamil',
    channelCode: 'zee',
    genre: 'Talk Show',
    timeSlot: 'Sunday 12:00 PM',
    episodesCount: '340 episodes logged',
    tag: 'Debate Show',
    bgColor: '#28121f',
    tamilColor: '#f472b6',
    borderColor: 'rgba(244, 114, 182, 0.25)'
  },
  {
    id: 'prg_vanakkam_tamizha',
    serialCode: 'vanakkam_tamizha',
    title: 'Vanakkam Tamizha',
    tamilTitle: 'வணக்கம் தமிழா',
    channel: 'Sun TV',
    channelCode: 'sun',
    genre: 'Morning Show',
    timeSlot: 'Daily 08:00 AM',
    episodesCount: '1950 episodes logged',
    tag: 'Celebrity Talk',
    bgColor: '#112224',
    tamilColor: '#38bdf8',
    borderColor: 'rgba(56, 189, 248, 0.25)'
  },
  {
    id: 'prg_sunday_kondattam',
    serialCode: 'sunday_kondattam',
    title: 'Sunday Kondattam',
    tamilTitle: 'சண்டே கொண்டாட்டம்',
    channel: 'Sun TV',
    channelCode: 'sun',
    genre: 'Game Show',
    timeSlot: 'Sunday 09:30 AM',
    episodesCount: '210 episodes logged',
    tag: 'Entertainment',
    bgColor: '#241a12',
    tamilColor: '#fbbf24',
    borderColor: 'rgba(251, 191, 36, 0.25)'
  }
];

export function getCachedSerialsForServer(serverId = 'tamildhool') {
  if (serverId === 'tamilgun') {
    return TAMILGUN_SERIALS_CACHE;
  }
  return TAMILDHOOL_SERIALS_CACHE;
}

export function findSerial(serialIdOrCode, serverId = 'tamildhool') {
  const list = getCachedSerialsForServer(serverId);
  const found = list.find(s => s.id === serialIdOrCode || s.serialCode === serialIdOrCode);
  if (found) return found;
  const inReality = REALITY_SHOWS_CACHE.find(r => r.id === serialIdOrCode || r.serialCode === serialIdOrCode);
  if (inReality) return inReality;
  const inPrg = TV_PROGRAMMES_CACHE.find(p => p.id === serialIdOrCode || p.serialCode === serialIdOrCode);
  return inPrg || list[0];
}
