/**
 * TvSerialsLiveScraper.js
 * High-Speed Live Scraper & Aggregator for Tamildhool & Tamilgun (Arivumani)
 *
 * Scrapes, normalizes, and maps all:
 * - Daily Serials (Sun TV, Star Vijay, Zee Tamil)
 * - Reality Shows (Bigg Boss, Super Singer, Cooku with Comali, Sa Re Ga Ma Pa)
 * - TV Programmes (Neeya Naana, Tamizha Tamizha, Vanakkam Tamizha, Sunday Kondattam)
 * - Special Events & Mega Shows (Viruthugal, Audio Launches, Sunday Specials)
 */

import axios from 'axios';
import { TAMIL_SERIALS_CACHE, REALITY_SHOWS_CACHE, TV_PROGRAMMES_CACHE } from './TvSerialsMetadataCache.js';

// Comprehensive Database of All Tamil Serials & Shows across Broadcasters
export const COMPREHENSIVE_ALL_SERIALS = [
  // --- SUN TV SERIALS ---
  {
    id: 'sun_kayal',
    title: 'Kayal',
    tamilTitle: 'கயல்',
    channel: 'Sun TV',
    channelCode: 'sun',
    timeSlot: '07:30 PM',
    episodes: '1240+ Eps',
    episodesCount: '1240 episodes logged',
    category: 'serial',
    tag: 'Top TRP',
    bgColor: '#172033',
    borderColor: '#38bdf8',
    tamilColor: '#38bdf8',
    description: 'A resilient elder sister shoulders her family responsibilities amidst life trials.',
    tamildhoolQuery: 'Kayal',
    tamilgunQuery: 'Kayal Sun Tv',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  },
  {
    id: 'sun_singapennae',
    title: 'Singapennae',
    tamilTitle: 'சிங்கப்பெண்ணே',
    channel: 'Sun TV',
    channelCode: 'sun',
    timeSlot: '08:00 PM',
    episodes: '540+ Eps',
    episodesCount: '540 episodes logged',
    category: 'serial',
    tag: 'Prime Slot',
    bgColor: '#172033',
    borderColor: '#38bdf8',
    tamilColor: '#38bdf8',
    description: 'Anandi leaves her rural hometown to conquer corporate challenges in Chennai.',
    tamildhoolQuery: 'Singapennae',
    tamilgunQuery: 'Singappenne Sun Tv',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
  },
  {
    id: 'sun_vanathai_pola',
    title: 'Vanathai Pola',
    tamilTitle: 'வானத்தை போல',
    channel: 'Sun TV',
    channelCode: 'sun',
    timeSlot: '06:30 PM',
    episodes: '1150+ Eps',
    episodesCount: '1150 episodes logged',
    category: 'serial',
    tag: 'Family Drama',
    bgColor: '#172033',
    borderColor: '#38bdf8',
    tamilColor: '#38bdf8',
    description: 'An unbreakable bond of love and sacrifice between brother Chinrasu and sister Thulasi.',
    tamildhoolQuery: 'Vanathai Pola',
    tamilgunQuery: 'Vanathai Pola Sun Tv',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  },
  {
    id: 'sun_marumagal',
    title: 'Marumagal',
    tamilTitle: 'மருமகள்',
    channel: 'Sun TV',
    channelCode: 'sun',
    timeSlot: '07:00 PM',
    episodes: '380+ Eps',
    episodesCount: '380 episodes logged',
    category: 'serial',
    tag: 'Daily Soap',
    bgColor: '#172033',
    borderColor: '#38bdf8',
    tamilColor: '#38bdf8',
    description: 'A devoted daughter-in-law strives to bring harmony and values to her new household.',
    tamildhoolQuery: 'Marumagal',
    tamilgunQuery: 'Marumagal Sun Tv',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
  },
  {
    id: 'sun_moondru_mudichu',
    title: 'Moondru Mudichu',
    tamilTitle: 'மூன்று முடிச்சு',
    channel: 'Sun TV',
    channelCode: 'sun',
    timeSlot: '08:30 PM',
    episodes: '290+ Eps',
    episodesCount: '290 episodes logged',
    category: 'serial',
    tag: 'Daily Drama',
    bgColor: '#172033',
    borderColor: '#38bdf8',
    tamilColor: '#38bdf8',
    description: 'A high-voltage triangular matrimonial drama exploring fate, passion, and revenge.',
    tamildhoolQuery: 'Moondru Mudichu',
    tamilgunQuery: 'Moondru Mudichu Sun Tv',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
  },
  {
    id: 'sun_annam',
    title: 'Annam',
    tamilTitle: 'அன்னம்',
    channel: 'Sun TV',
    channelCode: 'sun',
    timeSlot: '01:30 PM',
    episodes: '310+ Eps',
    episodesCount: '310 episodes logged',
    category: 'serial',
    tag: 'Afternoon Special',
    bgColor: '#172033',
    borderColor: '#38bdf8',
    tamilColor: '#38bdf8',
    description: 'A poignant tale of maternal compassion and enduring strength in village heartlands.',
    tamildhoolQuery: 'Annam',
    tamilgunQuery: 'Annam Sun Tv',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4'
  },
  {
    id: 'sun_lakshmi',
    title: 'Lakshmi',
    tamilTitle: 'லட்சுமி',
    channel: 'Sun TV',
    channelCode: 'sun',
    timeSlot: '09:00 PM',
    episodes: '420+ Eps',
    episodesCount: '420 episodes logged',
    category: 'serial',
    tag: 'Prime Hit',
    bgColor: '#172033',
    borderColor: '#38bdf8',
    tamilColor: '#38bdf8',
    description: 'A woman named Lakshmi overcomes insurmountable domestic odds with courage and dignity.',
    tamildhoolQuery: 'Lakshmi',
    tamilgunQuery: 'Lakshmi Sun Tv',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'
  },
  {
    id: 'sun_thulasi',
    title: 'Thulasi',
    tamilTitle: 'துளசி',
    channel: 'Sun TV',
    channelCode: 'sun',
    timeSlot: '02:00 PM',
    episodes: '260+ Eps',
    episodesCount: '260 episodes logged',
    category: 'serial',
    tag: 'Daily Drama',
    bgColor: '#172033',
    borderColor: '#38bdf8',
    tamilColor: '#38bdf8',
    description: 'A devoted village girl battles societal prejudice with truth and compassion.',
    tamildhoolQuery: 'Thulasi',
    tamilgunQuery: 'Thulasi Sun Tv',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
  },
  {
    id: 'sun_iru_malargal',
    title: 'Iru Malargal',
    tamilTitle: 'இரு மலர்கள்',
    channel: 'Sun TV',
    channelCode: 'sun',
    timeSlot: '02:30 PM',
    episodes: '180+ Eps',
    episodesCount: '180 episodes logged',
    category: 'serial',
    tag: 'Romantic Drama',
    bgColor: '#172033',
    borderColor: '#38bdf8',
    tamilColor: '#38bdf8',
    description: 'Two intertwined souls confront destiny and deep-rooted family rivalries.',
    tamildhoolQuery: 'Iru Malargal',
    tamilgunQuery: 'Iru Malargal Sun Tv',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4'
  },
  {
    id: 'sun_sundari',
    title: 'Sundari',
    tamilTitle: 'சுந்தரி',
    channel: 'Sun TV',
    channelCode: 'sun',
    timeSlot: '09:30 PM',
    episodes: '1020+ Eps',
    episodesCount: '1020 episodes logged',
    category: 'serial',
    tag: 'Inspirational',
    bgColor: '#172033',
    borderColor: '#38bdf8',
    tamilColor: '#38bdf8',
    description: 'A dusky, ambitious girl fights against appearance-based discrimination to become an IAS officer.',
    tamildhoolQuery: 'Sundari',
    tamilgunQuery: 'Sundari Sun Tv',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
  },
  {
    id: 'sun_sevvanthi',
    title: 'Sevvanthi',
    tamilTitle: 'செவ்வந்தி',
    channel: 'Sun TV',
    channelCode: 'sun',
    timeSlot: '12:30 PM',
    episodes: '780+ Eps',
    episodesCount: '780 episodes logged',
    category: 'serial',
    tag: 'Noon Soap',
    bgColor: '#172033',
    borderColor: '#38bdf8',
    tamilColor: '#38bdf8',
    description: 'Sevvanthi navigates the complex relationships and traditions of an extended joint family.',
    tamildhoolQuery: 'Sevvanthi',
    tamilgunQuery: 'Sevvanthi Sun Tv',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4'
  },
  {
    id: 'sun_ilakkiya',
    title: 'Ilakkiya',
    tamilTitle: 'இலக்கியா',
    channel: 'Sun TV',
    channelCode: 'sun',
    timeSlot: '01:00 PM',
    episodes: '650+ Eps',
    episodesCount: '650 episodes logged',
    category: 'serial',
    tag: 'Daily Soap',
    bgColor: '#172033',
    borderColor: '#38bdf8',
    tamilColor: '#38bdf8',
    description: 'A gentle-hearted girl enters matrimony where secrets and jealousy threaten her happiness.',
    tamildhoolQuery: 'Ilakkiya',
    tamilgunQuery: 'Ilakkiya Sun Tv',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4'
  },
  {
    id: 'sun_iniya',
    title: 'Iniya',
    tamilTitle: 'இனிய',
    channel: 'Sun TV',
    channelCode: 'sun',
    timeSlot: '10:00 PM',
    episodes: '590+ Eps',
    episodesCount: '590 episodes logged',
    category: 'serial',
    tag: 'Night Soap',
    bgColor: '#172033',
    borderColor: '#38bdf8',
    tamilColor: '#38bdf8',
    description: 'A lively daughter protects her sisters while learning the realities of married life.',
    tamildhoolQuery: 'Iniya',
    tamilgunQuery: 'Iniya Sun Tv',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  },

  // --- STAR VIJAY SERIALS ---
  {
    id: 'vijay_siragadikka_aasai',
    title: 'Siragadikka Aasai',
    tamilTitle: 'சிறகடிக்க ஆசை',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    timeSlot: '09:00 PM',
    episodes: '480+ Eps',
    episodesCount: '480 episodes logged',
    category: 'serial',
    tag: 'Top TRP',
    bgColor: '#1e1b4b',
    borderColor: '#818cf8',
    tamilColor: '#818cf8',
    description: 'Muthu, a taxi driver, and Meena, a floral artist, build a resilient life together against family odds.',
    tamildhoolQuery: 'Siragadikka Aasai',
    tamilgunQuery: 'Siragadikka Aasai Vijay Tv',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
  },
  {
    id: 'vijay_baakiyalakshmi',
    title: 'Baakiyalakshmi',
    tamilTitle: 'பாக்கியலட்சுமி',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    timeSlot: '08:30 PM',
    episodes: '1350+ Eps',
    episodesCount: '1350 episodes logged',
    category: 'serial',
    tag: 'Prime Slot',
    bgColor: '#1e1b4b',
    borderColor: '#818cf8',
    tamilColor: '#818cf8',
    description: 'A dedicated homemaker reclaims her identity, self-worth, and entrepreneurial success after betrayal.',
    tamildhoolQuery: 'Baakiyalakshmi',
    tamilgunQuery: 'Baakiyalakshmi Vijay Tv',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  },
  {
    id: 'vijay_pandian_stores_2',
    title: 'Pandian Stores 2',
    tamilTitle: 'பாண்டியன் ஸ்டோர்ஸ் 2',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    timeSlot: '08:00 PM',
    episodes: '340+ Eps',
    episodesCount: '340 episodes logged',
    category: 'serial',
    tag: 'Family Saga',
    bgColor: '#1e1b4b',
    borderColor: '#818cf8',
    tamilColor: '#818cf8',
    description: 'Pandian strictly guides his sons through discipline, modern entrepreneurship, and marriage.',
    tamildhoolQuery: 'Pandian Stores 2',
    tamilgunQuery: 'Pandian Stores Vijay Tv',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
  },
  {
    id: 'vijay_mahanathi',
    title: 'Mahanathi',
    tamilTitle: 'மகாநதி',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    timeSlot: '07:00 PM',
    episodes: '510+ Eps',
    episodesCount: '510 episodes logged',
    category: 'serial',
    tag: 'Daily Drama',
    bgColor: '#1e1b4b',
    borderColor: '#818cf8',
    tamilColor: '#818cf8',
    description: 'Four sisters struggle to maintain unity and rebuild their shattered lives after their father dies.',
    tamildhoolQuery: 'Mahanathi',
    tamilgunQuery: 'Mahanathi Vijay Tv',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
  },
  {
    id: 'vijay_aaha_kalyanam',
    title: 'Aaha Kalyanam',
    tamilTitle: 'ஆஹா கல்யாணம்',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    timeSlot: '07:30 PM',
    episodes: '420+ Eps',
    episodesCount: '420 episodes logged',
    category: 'serial',
    tag: 'Romantic Drama',
    bgColor: '#1e1b4b',
    borderColor: '#818cf8',
    tamilColor: '#818cf8',
    description: 'An unconventional wedding arrangement blossoms into unexpected, heartfelt romance.',
    tamildhoolQuery: 'Aaha Kalyanam',
    tamilgunQuery: 'Aaha Kalyanam Vijay Tv',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4'
  },
  {
    id: 'vijay_modhalum_kaadhalum',
    title: 'Modhalum Kaadhalum',
    tamilTitle: 'மோதலும் காதலும்',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    timeSlot: '06:30 PM',
    episodes: '390+ Eps',
    episodesCount: '390 episodes logged',
    category: 'serial',
    tag: 'Youth Romance',
    bgColor: '#1e1b4b',
    borderColor: '#818cf8',
    tamilColor: '#818cf8',
    description: 'Dr. Vikram and Vedha cross paths with sharp ego clashes that gradually turn into love.',
    tamildhoolQuery: 'Modhalum Kaadhalum',
    tamilgunQuery: 'Modhalum Kaadhalum Vijay Tv',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'
  },
  {
    id: 'vijay_malli',
    title: 'Malli',
    tamilTitle: 'மல்லி',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    timeSlot: '06:00 PM',
    episodes: '210+ Eps',
    episodesCount: '210 episodes logged',
    category: 'serial',
    tag: 'Daily Drama',
    bgColor: '#1e1b4b',
    borderColor: '#818cf8',
    tamilColor: '#818cf8',
    description: 'Malli strives to bring joy and integrity to everyone around her despite deep secrets.',
    tamildhoolQuery: 'Malli',
    tamilgunQuery: 'Malli Vijay Tv',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
  },
  {
    id: 'vijay_chinna_marumagal',
    title: 'Chinna Marumagal',
    tamilTitle: 'சின்ன மருமகள்',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    timeSlot: '09:30 PM',
    episodes: '290+ Eps',
    episodesCount: '290 episodes logged',
    category: 'serial',
    tag: 'Prime Soap',
    bgColor: '#1e1b4b',
    borderColor: '#818cf8',
    tamilColor: '#818cf8',
    description: 'A young schoolgirl forced into marriage battles to pursue her education and freedom.',
    tamildhoolQuery: 'Chinna Marumagal',
    tamilgunQuery: 'Chinna Marumagal Vijay Tv',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4'
  },
  {
    id: 'vijay_thendrale_mella_pesu',
    title: 'Thendrale Mella Pesu',
    tamilTitle: 'தென்றலே மெல்ல பேசு',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    timeSlot: '03:00 PM',
    episodes: '140+ Eps',
    episodesCount: '140 episodes logged',
    category: 'serial',
    tag: 'Romantic Drama',
    bgColor: '#1e1b4b',
    borderColor: '#818cf8',
    tamilColor: '#818cf8',
    description: 'A soft breeze of romance, family loyalties, and untold sacrifices in modern Chennai.',
    tamildhoolQuery: 'Thendrale Mella Pesu',
    tamilgunQuery: 'Thendrale Mella Pesu Vijay Tv',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
  },

  // --- ZEE TAMIL SERIALS ---
  {
    id: 'zee_karthigai_deepam',
    title: 'Karthigai Deepam',
    tamilTitle: 'கார்த்திகை தீபம்',
    channel: 'Zee Tamil',
    channelCode: 'zee',
    timeSlot: '08:00 PM',
    episodes: '510+ Eps',
    episodesCount: '510 episodes logged',
    category: 'serial',
    tag: 'Prime Hit',
    bgColor: '#2a122e',
    borderColor: '#c084fc',
    tamilColor: '#c084fc',
    description: 'Deepa, a gifted singer who faces societal judgment, finds light with businessman Karthik.',
    tamildhoolQuery: 'Karthigai Deepam',
    tamilgunQuery: 'Karthigai Deepam Zee Tamil',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4'
  },
  {
    id: 'zee_sandhya_raagam',
    title: 'Sandhya Raagam',
    tamilTitle: 'சந்தியா ராகம்',
    channel: 'Zee Tamil',
    channelCode: 'zee',
    timeSlot: '07:30 PM',
    episodes: '430+ Eps',
    episodesCount: '430 episodes logged',
    category: 'serial',
    tag: 'Emotional Drama',
    bgColor: '#2a122e',
    borderColor: '#c084fc',
    tamilColor: '#c084fc',
    description: 'Two sisters separated by circumstances reunite to navigate marriage and societal pressures.',
    tamildhoolQuery: 'Sandhya Raagam',
    tamilgunQuery: 'Sandhya Raagam Zee Tamil',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4'
  },
  {
    id: 'zee_ayali',
    title: 'Ayali',
    tamilTitle: 'அயலி',
    channel: 'Zee Tamil',
    channelCode: 'zee',
    timeSlot: '06:30 PM',
    episodes: '160+ Eps',
    episodesCount: '160 episodes logged',
    category: 'serial',
    tag: 'Inspiring Drama',
    bgColor: '#2a122e',
    borderColor: '#c084fc',
    tamilColor: '#c084fc',
    description: 'A bright young girl defies age-old village taboos to pursue her dream of becoming a doctor.',
    tamildhoolQuery: 'Ayali',
    tamilgunQuery: 'Ayali Zee Tamil',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  },
  {
    id: 'zee_thirumangalyam',
    title: 'Thirumangalyam',
    tamilTitle: 'திருமாங்கல்யம்',
    channel: 'Zee Tamil',
    channelCode: 'zee',
    timeSlot: '07:00 PM',
    episodes: '220+ Eps',
    episodesCount: '220 episodes logged',
    category: 'serial',
    tag: 'Family Drama',
    bgColor: '#2a122e',
    borderColor: '#c084fc',
    tamilColor: '#c084fc',
    description: 'A traditional bond of holy matrimony is tested by deceit, greed, and true love.',
    tamildhoolQuery: 'Thirumangalyam',
    tamilgunQuery: 'Thirumangalyam Zee Tamil',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
  },
  {
    id: 'zee_samanthi',
    title: 'Samanthi',
    tamilTitle: 'சாமந்தி',
    channel: 'Zee Tamil',
    channelCode: 'zee',
    timeSlot: '08:30 PM',
    episodes: '190+ Eps',
    episodesCount: '190 episodes logged',
    category: 'serial',
    tag: 'Daily Drama',
    bgColor: '#2a122e',
    borderColor: '#c084fc',
    tamilColor: '#c084fc',
    description: 'Samanthi confronts unexpected challenges in her marital home with wisdom and resilience.',
    tamildhoolQuery: 'Samanthi',
    tamilgunQuery: 'Samanthi Zee Tamil',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  },
  {
    id: 'zee_vaagai_sooda_vaa',
    title: 'Vaagai Sooda Vaa',
    tamilTitle: 'வாகை சூட வா',
    channel: 'Zee Tamil',
    channelCode: 'zee',
    timeSlot: '09:00 PM',
    episodes: '120+ Eps',
    episodesCount: '120 episodes logged',
    category: 'serial',
    tag: 'High TRP',
    bgColor: '#2a122e',
    borderColor: '#c084fc',
    tamilColor: '#c084fc',
    description: 'An inspiring journey of justice, honor, and victory against corporate greed in modern society.',
    tamildhoolQuery: 'Vaagai Sooda Vaa',
    tamilgunQuery: 'Vaagai Sooda Vaa Zee Tamil',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
  },
  {
    id: 'zee_vasudha',
    title: 'Vasudha',
    tamilTitle: 'வசுதா',
    channel: 'Zee Tamil',
    channelCode: 'zee',
    timeSlot: '09:30 PM',
    episodes: '75+ Eps',
    episodesCount: '75 episodes logged',
    category: 'serial',
    tag: 'New Prime Soap',
    bgColor: '#2a122e',
    borderColor: '#c084fc',
    tamilColor: '#c084fc',
    description: 'A bold, kind-hearted woman stands up for truth and fairness in an aristocratic mansion.',
    tamildhoolQuery: 'Vasudha',
    tamilgunQuery: 'Vasudha Zee Tamil',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
  },
  {
    id: 'zee_parijatham',
    title: 'Parijatham',
    tamilTitle: 'பாரிஜாதம்',
    channel: 'Zee Tamil',
    channelCode: 'zee',
    timeSlot: '06:00 PM',
    episodes: '280+ Eps',
    episodesCount: '280 episodes logged',
    category: 'serial',
    tag: 'Evening Soap',
    bgColor: '#2a122e',
    borderColor: '#c084fc',
    tamilColor: '#c084fc',
    description: 'The tender blossoming of affection and sacrifice between contrasting family branches.',
    tamildhoolQuery: 'Parijatham',
    tamilgunQuery: 'Parijatham Zee Tamil',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4'
  },
  {
    id: 'zee_anna',
    title: 'Anna',
    tamilTitle: 'அண்ணா',
    channel: 'Zee Tamil',
    channelCode: 'zee',
    timeSlot: '10:00 PM',
    episodes: '460+ Eps',
    episodesCount: '460 episodes logged',
    category: 'serial',
    tag: 'Family Saga',
    bgColor: '#2a122e',
    borderColor: '#c084fc',
    tamilColor: '#c084fc',
    description: 'An elder brother goes to great lengths to care for and protect his four younger sisters.',
    tamildhoolQuery: 'Anna',
    tamilgunQuery: 'Anna Zee Tamil',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'
  }
];

// Comprehensive Database of All Reality Shows
export const COMPREHENSIVE_ALL_REALITY = [
  {
    id: 'reality_bigg_boss',
    title: 'Bigg Boss Tamil',
    tamilTitle: 'பிக் பாஸ் தமிழ்',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    genre: '24/7 Reality',
    timeSlot: '09:30 PM (Daily)',
    category: 'reality',
    tag: 'Mega Reality',
    bgColor: '#1e1b4b',
    borderColor: '#818cf8',
    tamilColor: '#818cf8',
    description: 'Celebrities live together under 24/7 camera surveillance, facing tasks, drama, and public votes.',
    tamildhoolQuery: 'Bigg Boss Tamil',
    tamilgunQuery: 'BIGG BOSS'
  },
  {
    id: 'reality_super_singer',
    title: 'Super Singer',
    tamilTitle: 'சூப்பர் சிங்கர்',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    genre: 'Music Talent Show',
    timeSlot: '06:30 PM (Sat-Sun)',
    category: 'reality',
    tag: 'Weekend Prime',
    bgColor: '#1e1b4b',
    borderColor: '#818cf8',
    tamilColor: '#818cf8',
    description: 'The pinnacle of Tamil musical excellence where the finest aspiring voices compete for stardom.',
    tamildhoolQuery: 'Super Singer',
    tamilgunQuery: 'Super Singer'
  },
  {
    id: 'reality_cwc',
    title: 'Cooku with Comali',
    tamilTitle: 'குக் வித் கோமாளி',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    genre: 'Culinary Comedy',
    timeSlot: '08:00 PM (Sat-Sun)',
    category: 'reality',
    tag: 'Comedy Riot',
    bgColor: '#1e1b4b',
    borderColor: '#818cf8',
    tamilColor: '#818cf8',
    description: 'A hilarious culinary competition pairing celebrity cooks with eccentric and comic partners.',
    tamildhoolQuery: 'Cooku with Comali',
    tamilgunQuery: 'Cooku with Comali'
  },
  {
    id: 'reality_top_cooku',
    title: 'Top Cooku Dupe Cooku',
    tamilTitle: 'டாப் குக் டூப் குக்',
    channel: 'Sun TV',
    channelCode: 'sun',
    genre: 'Celebrity Cooking',
    timeSlot: '01:30 PM (Sunday)',
    category: 'reality',
    tag: 'Sunday Special',
    bgColor: '#172033',
    borderColor: '#38bdf8',
    tamilColor: '#38bdf8',
    description: 'Sun TVs riotous culinary entertainer featuring top chefs, hilarious dupe cooks, and lively banter.',
    tamildhoolQuery: 'Top Cooku Dupe Cooku',
    tamilgunQuery: 'Top Cooku Dupe Cooku Sun Tv'
  },
  {
    id: 'reality_saregamapa',
    title: 'Sa Re Ga Ma Pa',
    tamilTitle: 'ச ரி க ம ப',
    channel: 'Zee Tamil',
    channelCode: 'zee',
    genre: 'Vocal Showdown',
    timeSlot: '07:00 PM (Sat-Sun)',
    category: 'reality',
    tag: 'Musical Gala',
    bgColor: '#2a122e',
    borderColor: '#c084fc',
    tamilColor: '#c084fc',
    description: 'Zee Tamils premier vocal talent hunt celebrating legendary melodies and extraordinary singers.',
    tamildhoolQuery: 'Sa Re Ga Ma Pa',
    tamilgunQuery: 'Sa Re Ga Ma Pa Zee Tamil'
  },
  {
    id: 'reality_dance_jodi_dance',
    title: 'Dance Jodi Dance',
    tamilTitle: 'டான்ஸ் ஜோடி டான்ஸ்',
    channel: 'Zee Tamil',
    channelCode: 'zee',
    genre: 'Choreography Contest',
    timeSlot: '08:30 PM (Sat-Sun)',
    category: 'reality',
    tag: 'Dance Battle',
    bgColor: '#2a122e',
    borderColor: '#c084fc',
    tamilColor: '#c084fc',
    description: 'Dynamic dance couples ignite the stage with mind-blowing choreography and acrobatic skill.',
    tamildhoolQuery: 'Dance Jodi Dance',
    tamilgunQuery: 'Dance Jodi Dance Zee Tamil'
  },
  {
    id: 'reality_start_music',
    title: 'Start Music',
    tamilTitle: 'ஸ்டார்ட் மியூசிக்',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    genre: 'Game Show',
    timeSlot: '08:00 PM (Sunday)',
    category: 'reality',
    tag: 'Fun Game',
    bgColor: '#1e1b4b',
    borderColor: '#818cf8',
    tamilColor: '#818cf8',
    description: 'TV stars battle in musical buzzer games and funny vault challenges with high energy.',
    tamildhoolQuery: 'Start Music',
    tamilgunQuery: 'Start Music Vijay Tv'
  }
];

// Comprehensive Database of All TV Programmes
export const COMPREHENSIVE_ALL_PROGRAMMES = [
  {
    id: 'prog_neeya_naana',
    title: 'Neeya Naana',
    tamilTitle: 'நீயா நானா',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    genre: 'Social Debate Talk Show',
    timeSlot: '03:00 PM (Sunday)',
    category: 'programme',
    tag: 'Debate Gala',
    bgColor: '#1e1b4b',
    borderColor: '#818cf8',
    tamilColor: '#818cf8',
    description: 'Iconic talk show hosted by Gopinath debating intense societal viewpoints and contemporary culture.',
    tamildhoolQuery: 'Neeya Naana',
    tamilgunQuery: 'Neeya Naana'
  },
  {
    id: 'prog_tamizha_tamizha',
    title: 'Tamizha Tamizha',
    tamilTitle: 'தமிழா தமிழா',
    channel: 'Zee Tamil',
    channelCode: 'zee',
    genre: 'Thought Forum',
    timeSlot: '12:00 PM (Sunday)',
    category: 'programme',
    tag: 'Sunday Special',
    bgColor: '#2a122e',
    borderColor: '#c084fc',
    tamilColor: '#c084fc',
    description: 'A hard-hitting opinion forum bringing real people together to voice pressing cultural and social themes.',
    tamildhoolQuery: 'Tamizha Tamizha',
    tamilgunQuery: 'Tamizha Tamizha'
  },
  {
    id: 'prog_vanakkam_tamizha',
    title: 'Vanakkam Tamizha',
    tamilTitle: 'வணக்கம் தமிழா',
    channel: 'Sun TV',
    channelCode: 'sun',
    genre: 'Live Breakfast Show',
    timeSlot: '08:00 AM (Mon-Fri)',
    category: 'programme',
    tag: 'Morning Live',
    bgColor: '#172033',
    borderColor: '#38bdf8',
    tamilColor: '#38bdf8',
    description: 'Sun TVs flagship morning magazine featuring celebrity interviews, astrology, and inspiring stories.',
    tamildhoolQuery: 'Vanakkam Tamizha',
    tamilgunQuery: 'Vanakkam Tamizha'
  },
  {
    id: 'prog_sunday_kondattam',
    title: 'Sunday Kondattam',
    tamilTitle: 'சண்டே கொண்டாட்டம்',
    channel: 'Sun TV',
    channelCode: 'sun',
    genre: 'Sunday Variety Show',
    timeSlot: '09:00 AM (Sunday)',
    category: 'programme',
    tag: 'Festive Variety',
    bgColor: '#172033',
    borderColor: '#38bdf8',
    tamilColor: '#38bdf8',
    description: 'A vibrant weekend celebration of music, comedy sketches, celebrity banter, and family games.',
    tamildhoolQuery: 'Sunday Kondattam',
    tamilgunQuery: 'Sunday Kondattam'
  },
  {
    id: 'prog_cine_mini',
    title: 'Cine Mini',
    tamilTitle: 'சினி மினி',
    channel: 'Sun TV',
    channelCode: 'sun',
    genre: 'Cinema & Celebrity News',
    timeSlot: '11:00 AM (Saturday)',
    category: 'programme',
    tag: 'Cinema Buzz',
    bgColor: '#172033',
    borderColor: '#38bdf8',
    tamilColor: '#38bdf8',
    description: 'Exclusive behind-the-scenes glimpses, interviews, and reviews from the heart of Kollywood.',
    tamildhoolQuery: 'Cine Mini',
    tamilgunQuery: 'Cine Mini'
  }
];

// Comprehensive Database of All Special Events & Mega Shows
export const COMPREHENSIVE_ALL_EVENTS = [
  {
    id: 'event_vijay_awards',
    title: 'Vijay Television Awards',
    tamilTitle: 'விஜய் தொலைக்காட்சி விருதுகள்',
    channel: 'Star Vijay',
    channelCode: 'vijay',
    genre: 'Annual Grand Gala',
    timeSlot: 'Annual Mega Event',
    category: 'event',
    tag: 'Mega Event',
    bgColor: '#1e1b4b',
    borderColor: '#818cf8',
    tamilColor: '#818cf8',
    description: 'The star-studded red carpet celebration honoring the finest actors, directors, and technicians of Vijay TV.',
    tamildhoolQuery: 'Vijay Television Awards',
    tamilgunQuery: 'Vijay Television Awards'
  },
  {
    id: 'event_sun_viruthugal',
    title: 'Sun Kudumba Viruthugal',
    tamilTitle: 'சன் குடும்ப விருதுகள்',
    channel: 'Sun TV',
    channelCode: 'sun',
    genre: 'Star Honors Ceremony',
    timeSlot: 'Prime Mega Event',
    category: 'event',
    tag: 'Award Ceremony',
    bgColor: '#172033',
    borderColor: '#38bdf8',
    tamilColor: '#38bdf8',
    description: 'Sun Networks most prestigious awards night celebrating beloved TV families, actors, and serial directors.',
    tamildhoolQuery: 'Sun Kudumba Viruthugal',
    tamilgunQuery: 'Sun Kudumba Viruthugal'
  },
  {
    id: 'event_zee_viruthugal',
    title: 'Zee Kudumba Viruthugal',
    tamilTitle: 'ஜீ குடும்ப விருதுகள்',
    channel: 'Zee Tamil',
    channelCode: 'zee',
    genre: 'Grand Celebration',
    timeSlot: 'Annual Gala Night',
    category: 'event',
    tag: 'Award Night',
    bgColor: '#2a122e',
    borderColor: '#c084fc',
    tamilColor: '#c084fc',
    description: 'A dazzling extravaganza of performances, emotional reunions, and awards for Zee Tamils star artists.',
    tamildhoolQuery: 'Zee Kudumba Viruthugal',
    tamilgunQuery: 'Zee Kudumba Viruthugal'
  },
  {
    id: 'event_audio_launch',
    title: 'Kollywood Audio Launches',
    tamilTitle: 'திரைப்பட இசை வெளியீட்டு விழா',
    channel: 'Sun TV',
    channelCode: 'sun',
    genre: 'Exclusive Cinema Event',
    timeSlot: 'Weekend Special',
    category: 'event',
    tag: 'Cinema Special',
    bgColor: '#172033',
    borderColor: '#38bdf8',
    tamilColor: '#38bdf8',
    description: 'Grand movie audio release events, celebrity speeches, and live musical concerts from leading Kollywood stars.',
    tamildhoolQuery: 'Audio Launch',
    tamilgunQuery: 'Audio Launch'
  }
];

/**
 * Live Scraper Engine:
 * Fetches dynamic recent posts from Arivumani (TamilGun Server 2)
 * and maps them into rich categorized entities.
 */
export async function scrapeLiveCatalogFromServers() {
  const scrapedSerials = [];
  const scrapedShows = [];
  const scrapedEvents = [];

  try {
    const urls = [
      { url: 'https://arivumani.net/categories/sun-tv/', channel: 'Sun TV', code: 'sun' },
      { url: 'https://arivumani.net/categories/vijay-tv/', channel: 'Star Vijay', code: 'vijay' },
      { url: 'https://arivumani.net/categories/zee-tamil/', channel: 'Zee Tamil', code: 'zee' },
      { url: 'https://arivumani.net/', channel: 'TamilGun Feed', code: 'all' }
    ];

    const results = await Promise.allSettled(
      urls.map(u =>
        axios.get(u.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          timeout: 6000
        }).then(res => ({ ...u, html: res.data }))
      )
    );

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value?.html) {
        const { channel, code, html } = r.value;
        const postRegex = /<article[^>]*class=["'][^"']*(?:video|post)[^"']*["'][^>]*>([\s\S]*?)<\/article>/gi;
        let m;

        while ((m = postRegex.exec(html)) !== null) {
          const postBody = m[1];
          const linkMatch = postBody.match(/<a\s+[^>]*href=["'](https?:\/\/[^"']*arivumani\.net\/[^"']+)["'][^>]*>/i);
          const titleMatch = postBody.match(/<h[1-6][^>]*class=["'][^"']*post-title[^"']*["'][^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i);
          const imgMatch = postBody.match(/src=["'](https?:\/\/[^"']+\.(?:jpg|png|webp|jpeg))["']/i);

          if (linkMatch && titleMatch) {
            const rawTitle = titleMatch[1].replace(/<[^>]+>/g, '').trim();
            const link = linkMatch[1];
            const image = imgMatch ? imgMatch[1] : null;

            // Classify by title
            const lower = rawTitle.toLowerCase();
            const isReality = lower.includes('bigg boss') || lower.includes('super singer') || lower.includes('cooku') || lower.includes('saregamapa') || lower.includes('dance');
            const isProgramme = lower.includes('neeya naana') || lower.includes('tamizha tamizha') || lower.includes('vanakkam') || lower.includes('kondattam');
            const isEvent = lower.includes('award') || lower.includes('viruthu') || lower.includes('launch') || lower.includes('special');

            const item = {
              title: rawTitle.replace(/\s+\d{2}-\d{2}-\d{4}.*$/i, '').trim(),
              rawTitle,
              pageUrl: link,
              image,
              channel: channel === 'TamilGun Feed' ? (lower.includes('sun') ? 'Sun TV' : lower.includes('vijay') ? 'Star Vijay' : 'Zee Tamil') : channel,
              channelCode: code === 'all' ? (lower.includes('sun') ? 'sun' : lower.includes('vijay') ? 'vijay' : 'zee') : code
            };

            if (isEvent) {
              scrapedEvents.push(item);
            } else if (isProgramme) {
              scrapedShows.push(item);
            } else if (isReality) {
              scrapedShows.push(item);
            } else {
              scrapedSerials.push(item);
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('[TvSerialsLiveScraper] Scraper error:', e.message);
  }

  return {
    scrapedSerials,
    scrapedShows,
    scrapedEvents
  };
}
