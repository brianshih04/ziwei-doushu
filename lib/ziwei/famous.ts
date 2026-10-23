/**
 * 名人命盤資料庫
 * 基於公開記錄的出生日期，時辰為估算值（部分有文獻記載）
 */

import 'server-only';

export interface FamousPerson {
  id: string;
  name: string;
  nameEn: string;
  category: '商業' | '文藝' | '歷史' | '體育' | '科技';
  description: string;           // 一句話身份介紹
  descriptionEn: string;
  year: number;
  month: number;
  day: number;
  hour: number;                  // 時辰地支索引 0-11
  gender: 'male' | 'female';
  notable: string;               // 命盤亮點提示（啟發使用者興趣）
  notableEn: string;
}

export const FAMOUS_PERSONS: FamousPerson[] = [
  // ─── 商業傳奇 ─────────────────────────────────────────────
  {
    id: 'ma-yun',
    name: '馬雲',
    nameEn: 'Jack Ma',
    category: '商業',
    description: '阿里巴巴創始人',
    descriptionEn: 'Founder of Alibaba',
    year: 1964, month: 9, day: 10, hour: 5,  // 約巳時
    gender: 'male',
    notable: '命盤顯示極強的破格重建之力，官祿宮星曜與網際網路商業帝國高度對應',
    notableEn: 'The chart shows an exceptional ability to break established patterns and rebuild, while the Career Palace closely parallels the rise of an internet business empire.',
  },
  {
    id: 'li-jiacheng',
    name: '李嘉誠',
    nameEn: 'Li Ka-shing',
    category: '商業',
    description: '香港超級富豪，長和系創始人',
    descriptionEn: 'Hong Kong billionaire and founder of the CK Hutchison business empire',
    year: 1928, month: 7, day: 29, hour: 3,  // 約卯時
    gender: 'male',
    notable: '財帛宮四化是研究東方首富命盤的絕佳案例，祿存守財，越積越厚',
    notableEn: 'The Four Transformations in the Wealth Palace make this a compelling case study of extraordinary wealth; Lu Cun preserves assets and supports steady accumulation.',
  },
  {
    id: 'ren-zhengfei',
    name: '任正非',
    nameEn: 'Ren Zhengfei',
    category: '商業',
    description: '華為創始人',
    descriptionEn: 'Founder of Huawei',
    year: 1944, month: 10, day: 25, hour: 3, // 卯時
    gender: 'male',
    notable: '七殺入命格局，一生逆風而行，越打壓越強大，倪師七殺理論的活教材',
    notableEn: 'Qi Sha in the Life Palace points to a life strengthened by adversity—the greater the pressure, the stronger the response—making this a vivid case study of traditional Qi Sha theory.',
  },

  // ─── 文藝名人 ─────────────────────────────────────────────
  {
    id: 'zhang-ailing',
    name: '張愛玲',
    nameEn: 'Eileen Chang',
    category: '文藝',
    description: '中國現代文學巨匠',
    descriptionEn: 'A master of modern Chinese literature',
    year: 1920, month: 9, day: 30, hour: 1, // 丑時
    gender: 'female',
    notable: '命盤孤獨星曜組合與其傳奇感情經歷、文學成就形成神奇對照',
    notableEn: 'The chart’s combination of solitary stars forms a striking parallel with her celebrated romantic history and literary achievements.',
  },
  {
    id: 'jay-chou',
    name: '周杰倫',
    nameEn: 'Jay Chou',
    category: '文藝',
    description: '華語流行音樂天王',
    descriptionEn: 'Mandopop singer-songwriter and cultural icon',
    year: 1979, month: 1, day: 18, hour: 1,  // 丑時（據報道夜間出生）
    gender: 'male',
    notable: '文曲星與貪狼的組合，天生才藝之命，命盤解釋了他為何能橫跨音樂各風格',
    notableEn: 'The combination of Wen Qu and Tan Lang suggests natural artistic talent and helps explain his ability to move across musical styles.',
  },
  {
    id: 'wang-fei',
    name: '王菲',
    nameEn: 'Faye Wong',
    category: '文藝',
    description: '華語樂壇最具傳奇色彩的女歌手',
    descriptionEn: 'One of the most iconic singers in Chinese pop',
    year: 1969, month: 8, day: 8, hour: 4,   // 辰時
    gender: 'female',
    notable: '夫妻宮星曜與其兩段傳奇婚姻高度對應，感情格局極具研究價值',
    notableEn: 'The stars in the Marriage Palace closely parallel her two high-profile marriages, making the relationship pattern especially valuable for study.',
  },
  {
    id: 'lin-zhiling',
    name: '林志玲',
    nameEn: 'Lin Chi-ling',
    category: '文藝',
    description: '臺灣名模、演員',
    descriptionEn: 'Taiwanese model and actress',
    year: 1974, month: 11, day: 29, hour: 5, // 巳時
    gender: 'female',
    notable: '太陰守命的女性美貌典範，命盤完美印證倪師"太陰入命女孩最漂亮"的論斷',
    notableEn: 'Tai Yin guarding the Life Palace is a classic symbol of feminine grace, closely echoing the traditional view that this placement bestows exceptional beauty.',
  },

  // ─── 科技精英 ─────────────────────────────────────────────
  {
    id: 'steve-jobs',
    name: '喬布斯',
    nameEn: 'Steve Jobs',
    category: '科技',
    description: '蘋果公司聯合創始人',
    descriptionEn: 'Co-founder of Apple',
    year: 1955, month: 2, day: 24, hour: 6,  // 午時
    gender: 'male',
    notable: '破軍入命格局，被親生父母遺棄又建立蘋果帝國，破而後立的命盤典範',
    notableEn: 'Po Jun in the Life Palace, adoption at birth, and the creation of the Apple empire make this an archetypal chart of renewal after disruption.',
  },
  {
    id: 'elon-musk',
    name: '馬斯克',
    nameEn: 'Elon Musk',
    category: '科技',
    description: '特斯拉、SpaceX創始人',
    descriptionEn: 'Founder of SpaceX and CEO of Tesla',
    year: 1971, month: 6, day: 28, hour: 4,  // 辰時（7:30AM 有文獻記錄）
    gender: 'male',
    notable: '殺破狼格局的極致體現，命盤中驛馬星旺盛，一生在改變人類未來邊界',
    notableEn: 'An intense expression of the Sha Po Lang pattern, with a powerful Travel Horse star and a life devoted to pushing the boundaries of humanity’s future.',
  },

  // ─── 體育明星 ─────────────────────────────────────────────
  {
    id: 'yao-ming',
    name: '姚明',
    nameEn: 'Yao Ming',
    category: '體育',
    description: 'NBA傳奇中鋒，中國籃球代言人',
    descriptionEn: 'Legendary NBA center and ambassador for Chinese basketball',
    year: 1980, month: 9, day: 12, hour: 5,  // 巳時
    gender: 'male',
    notable: '天梁守命，高大威嚴，官祿宮星象與其職業成就高度吻合',
    notableEn: 'Tian Liang guarding the Life Palace suggests stature and dignity, while the Career Palace closely aligns with his professional achievements.',
  },
  {
    id: 'li-na',
    name: '李娜',
    nameEn: 'Li Na',
    category: '體育',
    description: '中國網球大滿貫得主',
    descriptionEn: 'Chinese Grand Slam tennis champion',
    year: 1982, month: 2, day: 26, hour: 2,  // 寅時
    gender: 'female',
    notable: '七殺化氣，命中註定與人競爭，大限流年與法網奪冠時間點精準對應',
    notableEn: 'Qi Sha channels a powerful competitive drive, while the major periods and annual cycles closely align with the timing of her French Open victory.',
  },
];

/** 按分類獲取名人 */
export function getFamousByCategory(category: FamousPerson['category']): FamousPerson[] {
  return FAMOUS_PERSONS.filter(p => p.category === category);
}

/** 獲取所有分類 */
export const FAMOUS_CATEGORIES: FamousPerson['category'][] = [
  '商業', '文藝', '科技', '體育',
];
