/**
 * SEO 知識頁 — 資料 helper
 *
 * 14 主星 × 13 topic = 182 個獨立 SEO URL
 * 每頁都是 STAR_DB 中對應欄位的 4 段 markers（一句話定調/核心論斷/命盤依據/經典出處）
 */

import { STAR_DB } from '@/lib/ziwei/db-analysis';
import type { TopicKey } from '@/lib/ziwei/db-analysis';
import { TOPIC_PALACE_NAME, TOPIC_LABEL } from '@/lib/ziwei/db-analysis';

export const ALL_STARS = [
  '紫微', '天機', '太陽', '武曲', '天同', '廉貞', '天府',
  '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '破軍',
];

// 主星名 ↔ 拼音 slug 對映（URL 用 slug，避免中文 URL 在 Vercel/CDN 上的邊界問題）
export const STAR_TO_SLUG: Record<string, string> = {
  '紫微': 'ziwei',
  '天機': 'tianji',
  '太陽': 'taiyang',
  '武曲': 'wuqu',
  '天同': 'tiantong',
  '廉貞': 'lianzhen',
  '天府': 'tianfu',
  '太陰': 'taiyin',
  '貪狼': 'tanlang',
  '巨門': 'jumen',
  '天相': 'tianxiang',
  '天梁': 'tianliang',
  '七殺': 'qisha',
  '破軍': 'pojun',
};

export const SLUG_TO_STAR: Record<string, string> = Object.fromEntries(
  Object.entries(STAR_TO_SLUG).map(([k, v]) => [v, k])
);

export const ALL_TOPICS: TopicKey[] = [
  'overview', 'personality', 'love', 'career', 'wealth', 'health',
  'family', 'children', 'move', 'friends', 'home', 'spirit', 'parents',
];

interface StarContent {
  mingGong: string;
  personality: string;
  xiongDi?: string;
  fuQi: string;
  ziNv?: string;
  caiBo: string;
  jiE: string;
  qianYi?: string;
  jiaoYou?: string;
  guanLu: string;
  tianZhai?: string;
  fuDe?: string;
  fuMu?: string;
}

const TOPIC_TO_FIELD: Record<TopicKey, keyof StarContent> = {
  overview:    'mingGong',
  personality: 'personality',
  love:        'fuQi',
  career:      'guanLu',
  wealth:      'caiBo',
  health:      'jiE',
  family:      'xiongDi' as keyof StarContent,
  children:    'ziNv' as keyof StarContent,
  move:        'qianYi' as keyof StarContent,
  friends:     'jiaoYou' as keyof StarContent,
  home:        'tianZhai' as keyof StarContent,
  spirit:      'fuDe' as keyof StarContent,
  parents:     'fuMu' as keyof StarContent,
};

interface ParsedContent {
  dingdiao: string;
  lundian: string;
  yiju: string;
  chuchu: string;
  raw: string;
  hasMarkers: boolean;
}

function parseStarContent(content: string): ParsedContent {
  const out: ParsedContent = { dingdiao: '', lundian: '', yiju: '', chuchu: '', raw: content, hasMarkers: false };
  if (!content) return out;
  if (!content.includes('**【一句話定調】**') && !content.includes('**【核心論斷】**')) {
    out.lundian = content;
    return out;
  }
  out.hasMarkers = true;
  const re = /\*\*【([^】]+)】\*\*/g;
  const parts: { name: string; markerEnd: number; start: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    parts.push({ name: m[1], start: m.index, markerEnd: m.index + m[0].length });
  }
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const end = i + 1 < parts.length ? parts[i + 1].start : content.length;
    const text = content.slice(p.markerEnd, end).trim();
    if (p.name === '一句話定調') out.dingdiao = text;
    else if (p.name === '核心論斷') out.lundian = text;
    else if (p.name === '命盤依據') out.yiju = text;
    else if (p.name === '經典出處') out.chuchu = text;
  }
  return out;
}

export interface KnowledgeData {
  star: string;
  topic: TopicKey;
  topicLabel: string;
  palaceName: string;
  parsed: ParsedContent;
  exists: boolean;
}

export function getKnowledge(star: string, topic: TopicKey): KnowledgeData {
  const profile = STAR_DB[star] as StarContent | undefined;
  const field = TOPIC_TO_FIELD[topic];
  const content = profile && field ? (profile[field] as string | undefined) ?? '' : '';
  return {
    star,
    topic,
    topicLabel: TOPIC_LABEL[topic],
    palaceName: TOPIC_PALACE_NAME[topic],
    parsed: parseStarContent(content),
    exists: Boolean(content),
  };
}

/** 生成所有 14×13 組合（用於 generateStaticParams） */
export function getAllKnowledgeRoutes() {
  const routes: { star: string; slug: string; topic: TopicKey }[] = [];
  for (const star of ALL_STARS) {
    for (const topic of ALL_TOPICS) {
      const data = getKnowledge(star, topic);
      if (data.exists) routes.push({ star, slug: STAR_TO_SLUG[star], topic });
    }
  }
  return routes;
}

/** 主星屬性簡介（用於 SEO 頁"瞭解 XX 星"section） */
export const STAR_BRIEF_SEO: Record<string, string> = {
  '紫微': '紫微為帝星，主尊貴，化氣為尊。落命主有領導氣場、宜大平臺高位。',
  '天機': '天機為智慧星，主善變機靈，化氣為善。落命主聰明機變、宜輔佐策劃。',
  '太陽': '太陽為男貴星，主名譽公務，化氣為貴。落命主光明磊落、宜公職名聲。',
  '武曲': '武曲為財星，主剛毅果決，化氣為財。落命主理財能力強、宜實業金融。',
  '天同': '天同為福星，主溫和享樂，化氣為福。落命主性情溫和、有福氣。',
  '廉貞': '廉貞為次桃花星，文武兼備，化氣為囚。落命主多才多藝、感情豐富。',
  '天府': '天府為南帝守財星，主穩重保守，化氣為令。落命主品行端正、善守財庫。',
  '太陰': '太陰為月亮富貴星，主田宅富貴，化氣為富。落命主感情細膩、女命最吉。',
  '貪狼': '貪狼為桃花慾望星，多才多社交，化氣為桃花。落命主多才藝、社交廣。',
  '巨門': '巨門為是非口才星，主辯論傳媒，化氣為暗。落命主口才好、宜律師教師。',
  '天相': '天相為印星輔佐，主忠厚老實，化氣為印。落命主品行端正、宜行政法務。',
  '天梁': '天梁為老人星蔭星，善逢凶化吉，化氣為蔭。落命主慈悲善良、宜法律醫學。',
  '七殺': '七殺為將星，主孤獨果決冒險，化氣為肅殺。落命主剛毅果決、宜軍警創業。',
  '破軍': '破軍為破壞創新星，主六親緣薄，化氣為耗。落命主開創變動、宜技術專長。',
};
