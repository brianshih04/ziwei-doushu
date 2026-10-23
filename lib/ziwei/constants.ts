// 天干 Heavenly Stems
export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

// 地支 Earthly Branches
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 時辰對應地支
export const SHICHEN = [
  { branch: 0, name: '子時', range: '23:00-01:00' },
  { branch: 1, name: '丑時', range: '01:00-03:00' },
  { branch: 2, name: '寅時', range: '03:00-05:00' },
  { branch: 3, name: '卯時', range: '05:00-07:00' },
  { branch: 4, name: '辰時', range: '07:00-09:00' },
  { branch: 5, name: '巳時', range: '09:00-11:00' },
  { branch: 6, name: '午時', range: '11:00-13:00' },
  { branch: 7, name: '未時', range: '13:00-15:00' },
  { branch: 8, name: '申時', range: '15:00-17:00' },
  { branch: 9, name: '酉時', range: '17:00-19:00' },
  { branch: 10, name: '戌時', range: '19:00-21:00' },
  { branch: 11, name: '亥時', range: '21:00-23:00' },
];

// 十二宮名順序；地支索引從命宮起每減 1 前進一宮（排盤介面為逆時針）
export const PALACE_NAMES_ORDER = [
  '命宮', '兄弟宮', '夫妻宮', '子女宮', '財帛宮', '疾厄宮',
  '遷移宮', '交友宮', '官祿宮', '田宅宮', '福德宮', '父母宮'
];

// 納音五行（30組干支對的五行）
export const NAYIN_ELEMENTS = [
  '金','火','木','土','金','火','水','土','金','木',
  '水','土','火','木','水','金','火','木','土','金',
  '火','水','土','金','木','水','土','火','木','水'
];

// 五行 → 局數
export const ELEMENT_TO_JU: Record<string, number> = {
  '水': 2, '木': 3, '金': 4, '土': 5, '火': 6
};

// 局數名稱
export const JU_NAMES: Record<number, string> = {
  2: '水二局', 3: '木三局', 4: '金四局', 5: '土五局', 6: '火六局'
};

// 四化表（年幹 → [化祿, 化權, 化科, 化忌]）
export const SI_HUA_TABLE: Record<number, [string, string, string, string]> = {
  0: ['廉貞', '破軍', '武曲', '太陽'],   // 甲
  1: ['天機', '天梁', '紫微', '太陰'],   // 乙
  2: ['天同', '天機', '文昌', '廉貞'],   // 丙
  3: ['太陰', '天同', '天機', '巨門'],   // 丁
  4: ['貪狼', '太陰', '右弼', '天機'],   // 戊
  5: ['武曲', '貪狼', '天梁', '文曲'],   // 己
  6: ['太陽', '武曲', '太陰', '天同'],   // 庚
  7: ['巨門', '太陽', '文曲', '文昌'],   // 辛
  8: ['天梁', '紫微', '左輔', '武曲'],   // 壬
  9: ['破軍', '巨門', '太陰', '貪狼'],   // 癸
};

// 天魁天鉞表（年幹 → [天魁branch, 天鉞branch]）
export const TIANKUI_TABLE: Record<number, [number, number]> = {
  0: [1, 7],   // 甲: 魁丑 鉞未
  1: [0, 8],   // 乙: 魁子 鉞申
  2: [11, 9],  // 丙: 魁亥 鉞酉
  3: [11, 9],  // 丁: 魁亥 鉞酉
  4: [1, 7],   // 戊: 魁丑 鉞未
  5: [0, 8],   // 己: 魁子 鉞申
  6: [1, 7],   // 庚: 魁丑 鉞未
  7: [6, 2],   // 辛: 魁午 鉞寅
  8: [3, 5],   // 壬: 魁卯 鉞巳
  9: [3, 5],   // 癸: 魁卯 鉞巳
};

// 祿存表（年幹 → 祿存branch）
export const LUCUN_TABLE: Record<number, number> = {
  0: 2,   // 甲: 寅
  1: 3,   // 乙: 卯
  2: 5,   // 丙: 巳
  3: 6,   // 丁: 午
  4: 5,   // 戊: 巳
  5: 6,   // 己: 午
  6: 8,   // 庚: 申
  7: 9,   // 辛: 酉
  8: 11,  // 壬: 亥
  9: 0,   // 癸: 子
};

// 天馬錶（年支三合 → 天馬branch）
// 寅午戌→申, 申子辰→寅, 巳酉丑→亥, 亥卯未→巳
export const TIANMA_TABLE: Record<number, number> = {
  2: 8,   // 寅年 → 申
  6: 8,   // 午年 → 申
  10: 8,  // 戌年 → 申
  8: 2,   // 申年 → 寅
  0: 2,   // 子年 → 寅
  4: 2,   // 辰年 → 寅
  5: 11,  // 巳年 → 亥
  9: 11,  // 酉年 → 亥
  1: 11,  // 丑年 → 亥
  11: 5,  // 亥年 → 巳
  3: 5,   // 卯年 → 巳
  7: 5,   // 未年 → 巳
};

// ★ 所有星曜亮度（主星 + 輔星）已遷移到 algorithm.ts → astro.config({ brightness })
// 覆寫範圍：9 顆主星 + 3 顆輔星（文曲/鈴星/擎羊），共 24 處差異修正。
// 其餘星曜（武曲/廉貞/貪狼/巨門/破軍/文昌/火星/陀羅）iztro 預設值與全書一致，無需覆寫。
// 舊 STAR_BRIGHTNESS 是死程式碼（從未被引用），已在 2026-05-08 清理。

// 主星描述（倪師體系）
export const STAR_DESCRIPTIONS: Record<string, { keywords: string; nature: string; element: string }> = {
  '紫微': { keywords: '帝王·尊貴·獨立', nature: '中性偏吉', element: '土' },
  '天機': { keywords: '智慧·機變·謀略', nature: '吉星', element: '木' },
  '太陽': { keywords: '陽剛·官貴·慷慨', nature: '吉星', element: '火' },
  '武曲': { keywords: '財富·剛毅·果斷', nature: '中性', element: '金' },
  '天同': { keywords: '溫和·享福·隨緣', nature: '吉星', element: '水' },
  '廉貞': { keywords: '才藝·刑囚·桃花', nature: '兇中帶吉', element: '火' },
  '天府': { keywords: '財庫·穩重·保守', nature: '吉星', element: '土' },
  '太陰': { keywords: '柔美·財富·陰柔', nature: '吉星', element: '水' },
  '貪狼': { keywords: '慾望·桃花·多才', nature: '中性', element: '木' },
  '巨門': { keywords: '口舌·是非·善辯', nature: '兇中帶吉', element: '水' },
  '天相': { keywords: '輔佐·行政·印綬', nature: '吉星', element: '水' },
  '天梁': { keywords: '蔭護·醫藥·長輩', nature: '吉星', element: '土' },
  '七殺': { keywords: '將星·果決·孤克', nature: '兇星', element: '金' },
  '破軍': { keywords: '開創·變動·破壞', nature: '兇星', element: '水' },
};
