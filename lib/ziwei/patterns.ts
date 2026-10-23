/**
 * 紫微斗數格局識別（v2 嚴格化版本）
 *
 * 設計原則：
 * 1. 古書條件優先：每個格局列出"必須 / 加分 / 破格"三層結構，出處可考
 * 2. 倪師立場：不使用宮幹自化、大限四化、來因宮等飛星派工具
 * 3. 廟旺利陷：用 brightness 欄位（bright=廟旺、normal=平、dim=陷）
 * 4. 三方四正會照：命宮 + 財帛 + 官祿 + 遷移
 * 5. 夾宮：命宮前後兩宮
 *
 * 主要古籍出處：
 *  - 《紫微斗數全集》（陳摶祖師傳，明代刊本）
 *  - 《紫微斗數全書》（羅洪先編，明代刊本）
 *  - 《骨髓賦》《女命骨髓賦》《十二宮諸星得地合格訣》
 *  - 倪師《天紀》紫微斗數講義
 */

import 'server-only';
import type { ZiweiChart, Palace, Star } from './types';

// ────────────────── 型別 ──────────────────
export interface PatternCondition {
  required: string[];   // 必須滿足條件（已通過的）
  bonus?: string[];     // 加分項（已觸發）
  breaking?: string[];  // 破格警示（已觸發）
}

export interface Pattern {
  name: string;
  level: 'excellent' | 'good' | 'neutral' | 'caution';
  description: string;
  palaces: string[];                 // 涉及宮位
  conditions?: PatternCondition;     // 成立條件分層（v2 新增）
  source?: string;                   // 古籍出處（v2 新增）
}

// ────────────────── 常量 ──────────────────
const SHA_NAMES = ['擎羊', '陀羅', '火星', '鈴星', '地空', '地劫'];
const SHA_HARD = ['擎羊', '陀羅', '火星', '鈴星'];   // 四煞
const SHA_KONG = ['地空', '地劫'];                  // 空劫
const ZUO_YOU = ['左輔', '右弼'];
const CHANG_QU = ['文昌', '文曲'];
const KUI_YUE = ['天魁', '天鉞'];

// ────────────────── 輔助函式 ──────────────────
function getMajorStarNames(palace: Palace): string[] {
  return palace.stars.filter(s => s.type === 'major').map(s => s.name);
}
function findStar(palace: Palace, name: string): Star | undefined {
  return palace.stars.find(s => s.name === name);
}
function hasStar(palace: Palace, name: string): boolean {
  return palace.stars.some(s => s.name === name);
}
function findStarPalace(chart: ZiweiChart, name: string): Palace | undefined {
  return chart.palaces.find(p => p.stars.some(s => s.name === name));
}
function getPalaceByBranch(chart: ZiweiChart, branch: number): Palace | undefined {
  return chart.palaces.find(p => p.branch === ((branch % 12) + 12) % 12);
}
function shaCountInPalace(palace: Palace, list: string[] = SHA_HARD): number {
  return palace.stars.filter(s => list.includes(s.name)).length;
}
function hasShaInPalace(palace: Palace, list: string[] = SHA_NAMES): boolean {
  return palace.stars.some(s => list.includes(s.name));
}
function getSanFangPalaces(chart: ZiweiChart): Palace[] {
  const m = chart.mingGongBranch;
  const branches = [m, (m + 4) % 12, (m + 8) % 12, (m + 6) % 12];
  return chart.palaces.filter(p => branches.includes(p.branch));
}
function isInSanFang(chart: ZiweiChart, branch: number): boolean {
  const m = chart.mingGongBranch;
  return [m, (m + 4) % 12, (m + 8) % 12, (m + 6) % 12].includes(branch);
}
function getDuiGong(chart: ZiweiChart, branch: number): Palace | undefined {
  return getPalaceByBranch(chart, (branch + 6) % 12);
}
function getJiaPalaces(chart: ZiweiChart, branch: number): { prev?: Palace; next?: Palace } {
  return {
    prev: getPalaceByBranch(chart, (branch + 11) % 12),
    next: getPalaceByBranch(chart, (branch + 1) % 12),
  };
}
function sanFangAllStars(chart: ZiweiChart): Set<string> {
  return new Set(getSanFangPalaces(chart).flatMap(p => p.stars.map(s => s.name)));
}
function sanFangShaCount(chart: ZiweiChart, list: string[] = SHA_HARD): number {
  return getSanFangPalaces(chart).reduce((sum, p) => sum + shaCountInPalace(p, list), 0);
}
function isBright(palace: Palace, starName: string): boolean {
  const s = findStar(palace, starName);
  return s?.brightness === 'bright';
}
function isDim(palace: Palace, starName: string): boolean {
  const s = findStar(palace, starName);
  return s?.brightness === 'dim';
}
function getStarSiHua(palace: Palace, starName: string): Star['siHua'] | undefined {
  return findStar(palace, starName)?.siHua;
}
const BRANCH_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// ────────────────── 正格識別器 ──────────────────

/** 君臣慶會：紫微入命，左輔右弼同會（同宮或三方） */
function detectJunChenQingHui(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  if (!hasStar(ming, '紫微')) return;
  const sanFangSet = sanFangAllStars(chart);
  const hasZuo = sanFangSet.has('左輔');
  const hasYou = sanFangSet.has('右弼');
  if (!hasZuo || !hasYou) return;

  const required = ['紫微入命', '左輔右弼同會三方四正'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangSet.has('文昌') || sanFangSet.has('文曲')) bonus.push('再會文昌或文曲');
  if (sanFangSet.has('天魁') || sanFangSet.has('天鉞')) bonus.push('魁鉞貴人加照');
  if (getStarSiHua(ming, '紫微') === '權') bonus.push('紫微化權');
  if (sanFangShaCount(chart, SHA_KONG) >= 2) breaking.push('地空地劫雙夾會照（紫微忌空劫）');

  patterns.push({
    name: '君臣慶會',
    level: breaking.length ? 'good' : 'excellent',
    description: '紫微入命，左輔右弼同會，帝王得賢臣輔佐，主大富大貴、統御之命。一生貴人不絕，宜走政商高位、跨界領袖之途。',
    palaces: ['命宮'],
    conditions: { required, bonus, breaking },
    source: '《紫微斗數全書·君臣慶會格》',
  });
}

/** 紫府同宮：紫微+天府於命宮（限寅、申宮） */
function detectZiFu(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const ziwei = findStarPalace(chart, '紫微');
  const tianfu = findStarPalace(chart, '天府');
  if (!ziwei || !tianfu || ziwei.branch !== tianfu.branch) return;

  const inMing = ziwei.branch === chart.mingGongBranch;
  const required = inMing
    ? ['紫微天府同入命宮']
    : ['紫微天府同宮（不在命宮，會照減力）'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  const sanFangSet = sanFangAllStars(chart);
  if (sanFangSet.has('左輔') && sanFangSet.has('右弼')) bonus.push('左輔右弼同會');
  if (sanFangSet.has('文昌') || sanFangSet.has('文曲')) bonus.push('再會昌曲');
  if (hasShaInPalace(ziwei, SHA_KONG)) breaking.push('紫府宮坐空劫（破紫府之貴氣）');
  if (shaCountInPalace(ziwei, SHA_HARD) >= 2) breaking.push('紫府宮見雙煞同坐');

  patterns.push({
    name: '紫府同宮',
    level: inMing && !breaking.length ? 'excellent' : 'good',
    description: inMing
      ? '紫微天府同入命宮，帝相併臨，尊貴之命。主品行端正、衣食無憂、有領導才能，宜擔任要職。需要左右輔弼來配合方為完整大格。'
      : '紫微天府同宮但未坐命，主一生有貴人貴氣依託，但本身不一定大富貴，需看會照吉煞而定。',
    palaces: [ziwei.name],
    conditions: { required, bonus, breaking },
    source: '《紫微斗數全書·紫府同宮格》',
  });
}

/** 府相朝垣：天府、天相分別坐守命宮的三方四正 */
function detectFuXiangChaoYuan(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const tianfu = findStarPalace(chart, '天府');
  const tianxiang = findStarPalace(chart, '天相');
  if (!tianfu || !tianxiang) return;
  if (!isInSanFang(chart, tianfu.branch) || !isInSanFang(chart, tianxiang.branch)) return;
  if (tianfu.branch === chart.mingGongBranch && tianxiang.branch === chart.mingGongBranch) return;
  if (tianfu.branch === tianxiang.branch) return;

  const required = ['天府坐命三方', '天相坐命三方', '兩星不同宮'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (hasStar(ming, '祿存') || hasStar(ming, '化祿')) bonus.push('命宮見祿');
  if (sanFangAllStars(chart).has('左輔')) bonus.push('再會左輔');
  if (hasShaInPalace(ming, SHA_HARD)) breaking.push('命宮坐煞星');
  if (sanFangShaCount(chart, SHA_HARD) >= 3) breaking.push('三方四正煞星過多');

  patterns.push({
    name: '府相朝垣',
    level: breaking.length ? 'good' : 'excellent',
    description: '天府天相分守命宮三方四正，文武並濟、權印雙輝，主一生衣食豐足、地位崇高。古書云"府相朝垣千鍾食祿"，常見於政界、企業管理者。',
    palaces: [tianfu.name, tianxiang.name],
    conditions: { required, bonus, breaking },
    source: '《紫微斗數全書·府相朝垣格》',
  });
}

/** 陽梁昌祿：太陽+天梁+文昌+祿存四星會命宮，大貴格 */
function detectYangLiangChangLu(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!sanFangSet.has('太陽') || !sanFangSet.has('天梁') ||
      !sanFangSet.has('文昌') || !sanFangSet.has('祿存')) return;

  const sun = findStarPalace(chart, '太陽')!;
  const liang = findStarPalace(chart, '天梁')!;
  const required = [
    '太陽會命宮三方',
    '天梁會命宮三方',
    '文昌會命宮三方',
    '祿存會命宮三方',
  ];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (isBright(sun, '太陽')) bonus.push('太陽廟旺');
  if (isBright(liang, '天梁')) bonus.push('天梁廟旺');
  if (sanFangSet.has('化科')) bonus.push('再會化科');
  if (isDim(sun, '太陽')) breaking.push('太陽落陷（陽梁失輝）');
  if (sanFangShaCount(chart, SHA_HARD) >= 2) breaking.push('三方煞重');

  patterns.push({
    name: '陽梁昌祿',
    level: breaking.length ? 'good' : 'excellent',
    description: '太陽、天梁、文昌、祿存四星齊會命宮三方，號稱"科舉之星"，主清貴顯達、考運極佳，宜走學術、文教、研究、專業認證之路，一生功名易就。',
    palaces: [sun.name, liang.name],
    conditions: { required, bonus, breaking },
    source: '《紫微斗數全書·陽梁昌祿格》',
  });
}

/** 火貪格 / 鈴貪格：貪狼+火星 或 貪狼+鈴星 同宮或會照 */
function detectHuoTanLingTan(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const tan = findStarPalace(chart, '貪狼');
  if (!tan) return;
  const huo = findStarPalace(chart, '火星');
  const ling = findStarPalace(chart, '鈴星');

  for (const [shaName, shaPalace] of [['火星', huo], ['鈴星', ling]] as const) {
    if (!shaPalace) continue;
    const sameOrTrine =
      tan.branch === shaPalace.branch ||
      (tan.branch + 4) % 12 === shaPalace.branch ||
      (tan.branch + 8) % 12 === shaPalace.branch ||
      (tan.branch + 6) % 12 === shaPalace.branch;
    if (!sameOrTrine) continue;
    if (!isInSanFang(chart, tan.branch)) continue;

    const required = [`貪狼${tan.branch === shaPalace.branch ? '同宮' : '會照'}${shaName}`, '貪狼會照命宮三方'];
    const bonus: string[] = [];
    const breaking: string[] = [];
    if (isBright(tan, '貪狼')) bonus.push('貪狼廟旺');
    if (getStarSiHua(tan, '貪狼') === '祿' || getStarSiHua(tan, '貪狼') === '權') bonus.push('貪狼化祿/化權');
    if (hasShaInPalace(tan, ['擎羊', '陀羅'])) breaking.push('貪狼宮又見羊陀（破橫發之力）');
    if (hasShaInPalace(tan, SHA_KONG)) breaking.push('貪狼遇空劫（財來財去）');

    patterns.push({
      name: shaName === '火星' ? '火貪格' : '鈴貪格',
      level: breaking.length ? 'good' : 'excellent',
      description: `貪狼遇${shaName}${tan.branch === shaPalace.branch ? '同宮' : '三方會照'}，主突發橫財、突如其來的機遇。古書云“貪狼遇火鈴，必發橫財”，但來得快去得也快，宜見好就收。${breaking.length ? '本盤破格條件已觸發，發力打折。' : ''}`,
      palaces: [tan.name, shaPalace.name],
      conditions: { required, bonus, breaking },
      source: '《紫微斗數骨髓賦》',
    });
  }
}

/** 武貪格：武曲+貪狼 同宮（丑、未） 或 對照 */
function detectWuTan(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const wu = findStarPalace(chart, '武曲');
  const tan = findStarPalace(chart, '貪狼');
  if (!wu || !tan) return;
  const sameOrOppose = wu.branch === tan.branch || (wu.branch + 6) % 12 === tan.branch;
  if (!sameOrOppose) return;
  if (!isInSanFang(chart, wu.branch) && !isInSanFang(chart, tan.branch)) return;

  const required = [
    wu.branch === tan.branch ? '武曲貪狼同宮（丑/未）' : '武曲貪狼對宮拱照',
    '會照命宮三方',
  ];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangAllStars(chart).has('火星') || sanFangAllStars(chart).has('鈴星'))
    bonus.push('再遇火星/鈴星（火貪/鈴貪疊加）');
  if (getStarSiHua(wu, '武曲') === '祿') bonus.push('武曲化祿');
  if (hasShaInPalace(wu, ['擎羊', '陀羅'])) breaking.push('武貪宮見羊陀');
  if (hasShaInPalace(wu, SHA_KONG)) breaking.push('武貪宮遇空劫');

  patterns.push({
    name: '武貪格',
    level: breaking.length ? 'good' : 'excellent',
    description: '武曲貪狼會命，財星與桃花慾望星交輝，古書云"武貪不發少年人"——三十歲後方能厚積薄發。主中年以後大富大貴，財源由人脈、應酬、慾望管理而來，適合金融、投機、銷售、娛樂業。',
    palaces: [wu.name, tan.name],
    conditions: { required, bonus, breaking },
    source: '《紫微斗數骨髓賦》',
  });
}

/** 殺破狼：七殺、破軍、貪狼三方齊聚 */
function detectShaPoLang(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  const has = ['七殺', '破軍', '貪狼'].filter(s => sanFangSet.has(s));
  if (has.length < 3) return;

  const required = ['七殺、破軍、貪狼三星齊入命宮三方四正'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangSet.has('化祿') || sanFangSet.has('化權')) bonus.push('三方有化祿或化權（動得有力）');
  if (sanFangSet.has('左輔') && sanFangSet.has('右弼')) bonus.push('輔弼同會（變動中得貴人）');
  if (sanFangShaCount(chart, SHA_HARD) >= 3) breaking.push('煞星過重（動而無成）');
  if (hasShaInPalace(ming, SHA_KONG)) breaking.push('命坐空劫（動得辛苦）');

  patterns.push({
    name: '殺破狼',
    level: breaking.length ? 'caution' : 'good',
    description: '七殺、破軍、貪狼三星會命，開創闖蕩之命格。一生變動多、不甘平凡，宜創業、軍警、業務、銷售。中年後才能穩定守成，年輕時易因衝動失利。',
    palaces: getSanFangPalaces(chart).filter(p => has.includes(getMajorStarNames(p)[0])).map(p => p.name),
    conditions: { required, bonus, breaking },
    source: '《紫微斗數全書·殺破狼》',
  });
}

/** 機月同梁：天機、太陰、天同、天梁四星齊入命遷財官 */
function detectJiYueTongLiang(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  const has = ['天機', '太陰', '天同', '天梁'].filter(s => sanFangSet.has(s));
  if (has.length < 4) return;

  const required = ['天機、太陰、天同、天梁四星齊入命宮三方四正'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangSet.has('文昌') || sanFangSet.has('文曲')) bonus.push('再會昌曲');
  if (sanFangSet.has('化科')) bonus.push('再會化科');
  if (sanFangShaCount(chart, SHA_HARD) >= 3) breaking.push('煞星過多（機月同梁忌煞）');
  if (hasShaInPalace(ming, SHA_HARD)) breaking.push('命宮坐煞');

  patterns.push({
    name: '機月同梁',
    level: breaking.length ? 'good' : 'excellent',
    description: '天機太陰天同天梁四星齊入命遷財官，文質彬彬、聰慧善謀。最適合公職、學術、文藝、醫療、服務等需穩定累積的行業，不宜大冒險大投機。',
    palaces: getSanFangPalaces(chart).filter(p => has.some(s => getMajorStarNames(p).includes(s))).map(p => p.name),
    conditions: { required, bonus, breaking },
    source: '《紫微斗數全書·機月同梁格》',
  });
}

/** 廉貞天相：同宮 */
function detectLianXiang(chart: ZiweiChart, patterns: Pattern[]) {
  const lian = findStarPalace(chart, '廉貞');
  const xiang = findStarPalace(chart, '天相');
  if (!lian || !xiang || lian.branch !== xiang.branch) return;

  const inMing = lian.branch === chart.mingGongBranch;
  const required = ['廉貞天相同宮'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (hasStar(lian, '祿存') || getStarSiHua(lian, '廉貞') === '祿') bonus.push('見祿存或廉貞化祿');
  if (sanFangAllStars(chart).has('左輔')) bonus.push('左輔會照');
  if (hasShaInPalace(lian, ['擎羊'])) breaking.push('廉相宮坐擎羊（廉殺羊傾向）');
  if (getStarSiHua(lian, '廉貞') === '忌') breaking.push('廉貞化忌');

  patterns.push({
    name: '廉貞天相格',
    level: breaking.length ? 'caution' : (inMing ? 'good' : 'neutral'),
    description: '廉貞天相同宮，印綬格局，主秉公處事、清廉之名，宜任公職、行政管理、法務、企劃。怕見擎羊化忌，則反主官非。',
    palaces: [lian.name],
    conditions: { required, bonus, breaking },
    source: '《紫微斗數全書》',
  });
}

/** 武曲七殺：同宮，將星配財星 */
function detectWuQiSha(chart: ZiweiChart, patterns: Pattern[]) {
  const wu = findStarPalace(chart, '武曲');
  const qi = findStarPalace(chart, '七殺');
  if (!wu || !qi || wu.branch !== qi.branch) return;

  const inMing = wu.branch === chart.mingGongBranch;
  const required = ['武曲七殺同宮'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (getStarSiHua(wu, '武曲') === '權') bonus.push('武曲化權');
  if (getStarSiHua(wu, '武曲') === '祿') bonus.push('武曲化祿');
  if (getStarSiHua(wu, '武曲') === '忌') breaking.push('武曲化忌（武曲化忌為財劫之兆）');
  if (hasShaInPalace(wu, ['擎羊', '陀羅', '火星', '鈴星'])) breaking.push('武殺宮煞星過多');

  patterns.push({
    name: '武曲七殺',
    level: breaking.length ? 'caution' : (inMing ? 'excellent' : 'good'),
    description: '武曲七殺同宮，將星配財星，主果決剛毅、理財能力強，適合金融、軍警、創業。但忌見化忌煞星，否則兇險。一生奮鬥、積財但操心。',
    palaces: [wu.name],
    conditions: { required, bonus, breaking },
    source: '《紫微斗數全書》',
  });
}

/** 天同天梁：同宮 */
function detectTongLiang(chart: ZiweiChart, patterns: Pattern[]) {
  const tong = findStarPalace(chart, '天同');
  const liang = findStarPalace(chart, '天梁');
  if (!tong || !liang || tong.branch !== liang.branch) return;

  const required = ['天同天梁同宮'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangAllStars(chart).has('文昌')) bonus.push('文昌會照');
  if (getStarSiHua(tong, '天同') === '祿') bonus.push('天同化祿');
  if (hasShaInPalace(tong, SHA_HARD)) breaking.push('煞星同坐');

  patterns.push({
    name: '天同天梁格',
    level: breaking.length ? 'neutral' : 'good',
    description: '天同天梁同宮，福星與蔭星共會，主寬厚和善、樂於助人，宜醫療、教育、宗教、社會公益。但偏溫和保守，難成大富大貴之局。',
    palaces: [tong.name],
    conditions: { required, bonus, breaking },
    source: '《紫微斗數全書》',
  });
}

/** 日月同宮：太陽太陰丑或未宮同宮 */
function detectRiYueTongGong(chart: ZiweiChart, patterns: Pattern[]) {
  const sun = findStarPalace(chart, '太陽');
  const moon = findStarPalace(chart, '太陰');
  if (!sun || !moon || sun.branch !== moon.branch) return;
  if (sun.branch !== 1 && sun.branch !== 7) return;  // 必須丑(1) 或 未(7)

  const inMing = sun.branch === chart.mingGongBranch;
  const required = [`太陽太陰同入${BRANCH_NAMES[sun.branch]}宮`];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sun.branch === 7) bonus.push('未宮日月同輝（古書云未宮日月雙美）');
  if (sanFangAllStars(chart).has('文昌') && sanFangAllStars(chart).has('文曲')) bonus.push('昌曲會照');
  if (hasShaInPalace(sun, SHA_HARD)) breaking.push('日月宮煞星同坐');

  patterns.push({
    name: '日月同宮',
    level: breaking.length ? 'good' : (inMing ? 'excellent' : 'good'),
    description: `太陽太陰於${BRANCH_NAMES[sun.branch]}宮同宮，陰陽平衡，文武兼備。主異性緣佳、事業順遂、名聲遠播。${sun.branch === 7 ? '未宮日月雙美尤佳。' : '丑宮日月同宮力量較平。'}`,
    palaces: [sun.name],
    conditions: { required, bonus, breaking },
    source: '《紫微斗數全書》',
  });
}

/** 日月夾命：太陽太陰在命宮前後兩宮 */
function detectRiYueJiaMing(chart: ZiweiChart, patterns: Pattern[]) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const prevHasSun = hasStar(prev, '太陽');
  const prevHasMoon = hasStar(prev, '太陰');
  const nextHasSun = hasStar(next, '太陽');
  const nextHasMoon = hasStar(next, '太陰');
  const ok = (prevHasSun && nextHasMoon) || (prevHasMoon && nextHasSun);
  if (!ok) return;

  const sunPalace = prevHasSun ? prev : next;
  const moonPalace = prevHasMoon ? prev : next;
  const required = ['太陽太陰分居命宮前後兩宮'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (isBright(sunPalace, '太陽')) bonus.push('太陽廟旺');
  if (isBright(moonPalace, '太陰')) bonus.push('太陰廟旺');
  if (isDim(sunPalace, '太陽') || isDim(moonPalace, '太陰')) breaking.push('日月落陷（夾命無光）');

  patterns.push({
    name: '日月夾命',
    level: breaking.length ? 'good' : 'excellent',
    description: '太陽太陰分居命宮兩側夾照，光明磊落，一生貴人相助，事業蓬勃。男主官貴，女主旺夫興家。日月須不落陷方為真夾。',
    palaces: [sunPalace.name, moonPalace.name],
    conditions: { required, bonus, breaking },
    source: '《紫微斗數全書·日月夾命》',
  });
}

/** 巨日同宮：巨門太陽同入寅或申 */
function detectJuRiTongGong(chart: ZiweiChart, patterns: Pattern[]) {
  const ju = findStarPalace(chart, '巨門');
  const sun = findStarPalace(chart, '太陽');
  if (!ju || !sun || ju.branch !== sun.branch) return;
  if (ju.branch !== 2 && ju.branch !== 8) return;  // 必須寅(2) 或 申(8)

  const inMing = ju.branch === chart.mingGongBranch;
  const required = [`巨門太陽同入${BRANCH_NAMES[ju.branch]}宮`];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (ju.branch === 2) bonus.push('寅宮太陽廟旺，巨門得日光化解是非');
  if (getStarSiHua(ju, '巨門') === '祿' || getStarSiHua(ju, '巨門') === '權') bonus.push('巨門化祿/化權（口才生財）');
  if (getStarSiHua(ju, '巨門') === '忌') breaking.push('巨門化忌（口舌官非）');
  if (ju.branch === 8) breaking.push('申宮太陽偏西，巨門暗曜更顯');

  patterns.push({
    name: '巨日同宮',
    level: breaking.length ? 'caution' : (inMing && ju.branch === 2 ? 'excellent' : 'good'),
    description: `巨門太陽同${BRANCH_NAMES[ju.branch]}宮，太陽化解巨門暗曜，主以口才、傳媒、外語、專業立業。寅宮為佳，申宮力減。怕巨門化忌則官非。`,
    palaces: [ju.name],
    conditions: { required, bonus, breaking },
    source: '《紫微斗數全書·巨日同宮》',
  });
}

/** 石中隱玉：巨門入命於子午宮 */
function detectShiZhongYinYu(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  if (!hasStar(ming, '巨門')) return;
  if (ming.branch !== 0 && ming.branch !== 6) return;  // 子(0) 或 午(6)

  const required = [`巨門入命於${BRANCH_NAMES[ming.branch]}宮`];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (getStarSiHua(ming, '巨門') === '祿' || getStarSiHua(ming, '巨門') === '權') bonus.push('巨門化祿/化權');
  if (sanFangAllStars(chart).has('文昌')) bonus.push('文昌會照（石中隱玉得明）');
  if (getStarSiHua(ming, '巨門') === '忌') breaking.push('巨門化忌（玉藏深泥）');
  if (hasShaInPalace(ming, SHA_HARD)) breaking.push('命坐煞星');

  patterns.push({
    name: '石中隱玉',
    level: breaking.length ? 'caution' : 'excellent',
    description: '巨門坐命子午，外表平凡而內蘊才學。早年默默無聞、中年方顯貴氣，宜走專業、研究、口才、傳媒。需有祿權或文昌相助方能"鑿石見玉"。',
    palaces: ['命宮'],
    conditions: { required, bonus, breaking },
    source: '《紫微斗數骨髓賦·石中隱玉》',
  });
}

/** 明珠出海：命宮在未空宮，對宮丑宮為太陽太陰 */
function detectMingZhuChuHai(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  if (ming.branch !== 7) return;   // 命在未
  if (getMajorStarNames(ming).length > 0) return;   // 命宮為空宮
  const dui = getDuiGong(chart, ming.branch);
  if (!dui) return;
  if (!hasStar(dui, '太陽') || !hasStar(dui, '太陰')) return;

  const required = ['命宮在未為空宮', '對宮丑宮為太陽太陰同度'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangAllStars(chart).has('文昌') || sanFangAllStars(chart).has('文曲')) bonus.push('再會昌曲');
  if (sanFangAllStars(chart).has('左輔') || sanFangAllStars(chart).has('右弼')) bonus.push('輔弼相助');
  if (sanFangShaCount(chart, SHA_HARD) >= 2) breaking.push('煞星會照（珠光黯淡）');

  patterns.push({
    name: '明珠出海',
    level: breaking.length ? 'good' : 'excellent',
    description: '命未空宮，對宮丑宮日月同輝拱照，號"明珠出海"。主出生平凡、後天努力出頭，宜遠赴他鄉、學術研究或大公司高位，主大富大貴。',
    palaces: ['命宮', dui.name],
    conditions: { required, bonus, breaking },
    source: '《紫微斗數全集·明珠出海》',
  });
}

/** 紫微獨坐入命 */
function detectZiWeiInMing(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  if (!hasStar(ming, '紫微') || hasStar(ming, '天府')) return;

  const required = ['紫微獨坐命宮（無天府同坐）'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  const sanFangSet = sanFangAllStars(chart);
  if (sanFangSet.has('左輔') && sanFangSet.has('右弼')) bonus.push('左輔右弼同會');
  if (sanFangSet.has('文昌') && sanFangSet.has('文曲')) bonus.push('文昌文曲同會');
  if (!sanFangSet.has('左輔') && !sanFangSet.has('右弼')) breaking.push('無輔弼（孤君無臣）');
  if (hasShaInPalace(ming, SHA_KONG)) breaking.push('紫微遇空劫（古書最忌）');

  patterns.push({
    name: '紫微入命',
    level: breaking.length ? 'caution' : (bonus.length ? 'excellent' : 'good'),
    description: '紫微獨坐命宮，帝王之星，自尊心強、有領導魅力。但紫微最忌"在野孤君"——若無左右輔弼相會，反成孤高自傲、易招毀謗。',
    palaces: ['命宮'],
    conditions: { required, bonus, breaking },
    source: '《紫微斗數全書》',
  });
}

/** 輔弼夾命 */
function detectFuBiJiaMing(chart: ZiweiChart, patterns: Pattern[]) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const prevHasZuo = hasStar(prev, '左輔');
  const prevHasYou = hasStar(prev, '右弼');
  const nextHasZuo = hasStar(next, '左輔');
  const nextHasYou = hasStar(next, '右弼');
  if (!((prevHasZuo && nextHasYou) || (prevHasYou && nextHasZuo))) return;

  const required = ['左輔右弼分居命宮前後兩宮'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangAllStars(chart).has('天魁') || sanFangAllStars(chart).has('天鉞')) bonus.push('再會魁鉞');

  patterns.push({
    name: '輔弼夾命',
    level: 'excellent',
    description: '左輔右弼夾命，傳統論述認為此格象徵貴人相助與福厚特質。適合走仕途、大企業管理等能發揮組織才能的方向。古書云"左輔右弼，終身福厚"——強調此格在組織協調中的優勢。',
    palaces: ['命宮', prev.name, next.name],
    conditions: { required, bonus, breaking },
    source: '《紫微斗數全書·輔弼夾命》',
  });
}

/** 昌曲夾命 */
function detectChangQuJiaMing(chart: ZiweiChart, patterns: Pattern[]) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const prevHasChang = hasStar(prev, '文昌');
  const prevHasQu = hasStar(prev, '文曲');
  const nextHasChang = hasStar(next, '文昌');
  const nextHasQu = hasStar(next, '文曲');
  if (!((prevHasChang && nextHasQu) || (prevHasQu && nextHasChang))) return;

  patterns.push({
    name: '昌曲夾命',
    level: 'excellent',
    description: '文昌文曲夾命宮，主聰明俊秀、文采斐然，宜走文教、學術、藝術、寫作。古書云"昌曲夾命主科甲"，最利考運。',
    palaces: ['命宮', prev.name, next.name],
    conditions: { required: ['文昌文曲分居命宮前後兩宮'] },
    source: '《紫微斗數全書》',
  });
}

/** 魁鉞夾命 */
function detectKuiYueJiaMing(chart: ZiweiChart, patterns: Pattern[]) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const okA = hasStar(prev, '天魁') && hasStar(next, '天鉞');
  const okB = hasStar(prev, '天鉞') && hasStar(next, '天魁');
  if (!okA && !okB) return;

  patterns.push({
    name: '魁鉞夾命',
    level: 'good',
    description: '天魁天鉞夾命，男稱天乙、女稱玉堂，一生貴人提攜。考試、求職、關鍵時刻常有意外貴人相助。',
    palaces: ['命宮', prev.name, next.name],
    conditions: { required: ['天魁天鉞分居命宮前後兩宮'] },
    source: '《紫微斗數全書》',
  });
}

/** 雙祿朝垣：化祿 + 祿存 同會三方 */
function detectShuangLuChaoYuan(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const sanFang = getSanFangPalaces(chart);
  let huaLuFound = false;
  let luCunFound = false;
  for (const p of sanFang) {
    if (p.stars.some(s => s.siHua === '祿')) huaLuFound = true;
    if (hasStar(p, '祿存')) luCunFound = true;
  }
  if (!huaLuFound || !luCunFound) return;

  patterns.push({
    name: '雙祿朝垣',
    level: 'excellent',
    description: '化祿、祿存同會命宮三方四正，財源湧動、衣食豐足。古書云"雙祿朝垣，富比陶朱"，主一生不愁財，多有正財橫財兼得。',
    palaces: sanFang.map(p => p.name),
    conditions: {
      required: ['化祿會照三方四正', '祿存會照三方四正'],
      breaking: hasShaInPalace(ming, SHA_KONG) ? ['命坐空劫（雙祿遇空，財來財去）'] : undefined,
    },
    source: '《紫微斗數全書·雙祿朝垣》',
  });
}

/** 三奇加會：化祿 化權 化科 同會三方 */
function detectSanQiJiaHui(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangPalaces = getSanFangPalaces(chart);
  let lu = false, quan = false, ke = false;
  for (const p of sanFangPalaces) {
    for (const s of p.stars) {
      if (s.siHua === '祿') lu = true;
      if (s.siHua === '權') quan = true;
      if (s.siHua === '科') ke = true;
    }
  }
  if (!(lu && quan && ke)) return;

  patterns.push({
    name: '三奇加會',
    level: 'excellent',
    description: '化祿、化權、化科三吉化齊會命宮三方四正，號稱"三奇加會"。主一生功名、財富、貴人三全，是紫微斗數最高吉格之一。',
    palaces: sanFangPalaces.map(p => p.name),
    conditions: { required: ['化祿、化權、化科三吉化齊會命宮三方四正'] },
    source: '《紫微斗數全書·三奇加會》',
  });
}

/** 化祿入命/官/財 */
function detectHuaLuRuMing(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const huaLuStar = ming.stars.find(s => s.siHua === '祿' && s.type === 'major');
  if (!huaLuStar) return;

  patterns.push({
    name: `${huaLuStar.name}化祿入命`,
    level: 'good',
    description: `${huaLuStar.name}化祿坐命，主生財順利、人緣佳、機緣多。${huaLuStar.name === '武曲' ? '武曲化祿屬正財，宜實業、金融。' : huaLuStar.name === '太陰' ? '太陰化祿屬陰財、不動產。' : huaLuStar.name === '貪狼' ? '貪狼化祿屬人脈財、桃花財。' : ''}`,
    palaces: ['命宮'],
    conditions: { required: [`${huaLuStar.name}化祿坐命宮`] },
    source: '《紫微斗數全書》',
  });
}

// ────────────────── 惡格識別器 ──────────────────

/** 化忌入命/遷 */
function detectHuaJiRuMingQian(chart: ZiweiChart, patterns: Pattern[]) {
  const qianBranch = (chart.mingGongBranch + 6) % 12;
  for (const palace of chart.palaces) {
    if (palace.branch !== chart.mingGongBranch && palace.branch !== qianBranch) continue;
    const jiStar = palace.stars.find(s => s.siHua === '忌' && s.type === 'major');
    if (!jiStar) continue;

    const inMing = palace.branch === chart.mingGongBranch;
    patterns.push({
      name: `${jiStar.name}化忌入${inMing ? '命' : '遷'}`,
      level: 'caution',
      description: inMing
        ? `${jiStar.name}化忌坐命宮，需留意自身固執、心理障礙或健康隱患，凡事退一步思考。化忌不一定壞，代表此星能量需要特別關注。`
        : `${jiStar.name}化忌坐遷移宮，外出、遠行、人際關係易有波折，宜守不宜動。`,
      palaces: [palace.name],
      conditions: { required: [`${jiStar.name}化忌坐${inMing ? '命' : '遷'}宮`] },
      source: '《紫微斗數全書》',
    });
  }
}

/** 羊陀夾忌：化忌坐宮，左右被擎羊陀羅夾 */
function detectYangTuoJiaJi(chart: ZiweiChart, patterns: Pattern[]) {
  for (const palace of chart.palaces) {
    const jiStar = palace.stars.find(s => s.siHua === '忌');
    if (!jiStar) continue;
    if (palace.branch !== chart.mingGongBranch) continue;   // 只看命宮被夾

    const { prev, next } = getJiaPalaces(chart, palace.branch);
    if (!prev || !next) continue;
    const aPrev = hasStar(prev, '擎羊') && hasStar(next, '陀羅');
    const aNext = hasStar(prev, '陀羅') && hasStar(next, '擎羊');
    if (!aPrev && !aNext) continue;

    patterns.push({
      name: '羊陀夾忌',
      level: 'caution',
      description: '化忌坐命，左右擎羊陀羅夾命，古書云"羊陀夾忌為敗局"，主一生勞碌奔波、坎坷不順、身心俱疲。需以德行修養與積極做事化解，凡事謹慎為上。',
      palaces: ['命宮', prev.name, next.name],
      conditions: { required: ['化忌坐命', '擎羊陀羅分居命宮前後兩宮'] },
      source: '《紫微斗數骨髓賦·羊陀夾忌》',
    });
    return;
  }
}

/** 火鈴夾命：火星鈴星分居命宮前後 */
function detectHuoLingJiaMing(chart: ZiweiChart, patterns: Pattern[]) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const okA = hasStar(prev, '火星') && hasStar(next, '鈴星');
  const okB = hasStar(prev, '鈴星') && hasStar(next, '火星');
  if (!okA && !okB) return;

  patterns.push({
    name: '火鈴夾命',
    level: 'caution',
    description: '火星鈴星分居命宮前後兩宮夾命，主性急、易衝動、突發意外或糾紛。需培養耐性、避免衝動決策。',
    palaces: ['命宮', prev.name, next.name],
    conditions: { required: ['火星鈴星分居命宮前後兩宮'] },
    source: '《紫微斗數全書》',
  });
}

/** 空劫夾命：地空地劫分居命宮前後 */
function detectKongJieJiaMing(chart: ZiweiChart, patterns: Pattern[]) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const okA = hasStar(prev, '地空') && hasStar(next, '地劫');
  const okB = hasStar(prev, '地劫') && hasStar(next, '地空');
  if (!okA && !okB) return;

  patterns.push({
    name: '空劫夾命',
    level: 'caution',
    description: '地空地劫夾命，主財來財去、思想脫俗、易遁入宗教哲學。古書云"空劫夾命，財不聚"。宜技藝、宗教、研究等不重物質之業。',
    palaces: ['命宮', prev.name, next.name],
    conditions: { required: ['地空地劫分居命宮前後兩宮'] },
    source: '《紫微斗數全書》',
  });
}

/** 廉殺羊：廉貞、七殺、擎羊三星會照（流年大限最兇） */
function detectLianShaYang(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!(sanFangSet.has('廉貞') && sanFangSet.has('七殺') && sanFangSet.has('擎羊'))) return;

  patterns.push({
    name: '廉殺羊',
    level: 'caution',
    description: '廉貞、七殺、擎羊三星會照命宮三方，傳統論述中標記為需要特別關注的組合。此格在大限流年觸發時提醒保持謹慎態度：駕駛安全、人際和平、醫療決策需理性——強調主動管理而非消極宿命。',
    palaces: ['命宮'],
    conditions: { required: ['廉貞、七殺、擎羊三星會照三方四正'] },
    source: '《紫微斗數全書·廉殺羊》',
  });
}

/** 巨火羊：巨門、火星、擎羊會照 */
function detectJuHuoYang(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!(sanFangSet.has('巨門') && sanFangSet.has('火星') && sanFangSet.has('擎羊'))) return;

  patterns.push({
    name: '巨火羊',
    level: 'caution',
    description: '巨門、火星、擎羊三星會照，傳統古籍記載此格為需要警惕之組合（古文"終身縊死"為宿命論表述，今已不適用）。現代理解為：此組合象徵直言易觸發衝突、情緒激烈時需要自我覺察。修養方向是：練習溫和表達、主動化解對立、培養情緒管理。',
    palaces: ['命宮'],
    conditions: { required: ['巨門、火星、擎羊三星會照三方四正'] },
    source: '《紫微斗數骨髓賦·巨火羊》',
  });
}

/** 鈴昌陀武：鈴星、文昌、陀羅、武曲會照（限至投河） */
function detectLingChangTuoWu(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!(sanFangSet.has('鈴星') && sanFangSet.has('文昌') && sanFangSet.has('陀羅') && sanFangSet.has('武曲'))) return;

  patterns.push({
    name: '鈴昌陀武',
    level: 'caution',
    description: '鈴星、文昌、陀羅、武曲四星齊會，傳統古籍記載此為需要特別關注之組合（古文"限至投河"為宿命論表述，非現代理解）。現代建議為：此組合在大限流年觸發時，提醒理性處理重大決策、關注情緒波動、維持生活的穩定性——強調主動管理而非消極等待。',
    palaces: ['命宮'],
    conditions: { required: ['鈴星、文昌、陀羅、武曲四星會照三方四正'] },
    source: '《紫微斗數骨髓賦·鈴昌陀武》',
  });
}

/** 馬頭帶箭：擎羊在午宮坐命 */
function detectMaTouDaiJian(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  if (ming.branch !== 6) return;   // 必須午
  if (!hasStar(ming, '擎羊')) return;

  const required = ['擎羊於午宮坐命'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangAllStars(chart).has('七殺') || sanFangAllStars(chart).has('破軍')) bonus.push('再會七殺或破軍（武職大貴）');
  if (sanFangAllStars(chart).has('天魁') || sanFangAllStars(chart).has('天鉞')) bonus.push('魁鉞加照');

  patterns.push({
    name: '馬頭帶箭',
    level: bonus.length ? 'good' : 'caution',
    description: '擎羊於午宮坐命，號"馬頭帶箭"，古書云"威鎮邊疆"。此格象徵果決行動力與競爭精神，適合需要執行力與果敢決策的職業方向。傳統論述同時提醒此格需要配合吉利星曜才能最優發揮——強調組合影響而非單星獨論。',
    palaces: ['命宮'],
    conditions: { required, bonus },
    source: '《紫微斗數骨髓賦·馬頭帶箭》',
  });
}

// ────────────────── 基礎格局（提升識別覆蓋率）──────────────────
// 設計：讓普通命盤也能識別出 1-3 個常見格局，而不是 30+ 嚴格古書格局都不匹配。
// 這些都是單一條件觸發的輕量識別，level 多為 neutral / good。

/** 祿存守身：祿存入身宮（或命宮與身宮同宮） */
function detectLuCunShouShen(chart: ZiweiChart, patterns: Pattern[]) {
  const luCunPalace = findStarPalace(chart, '祿存');
  if (!luCunPalace) return;
  const inMing = luCunPalace.branch === chart.mingGongBranch;
  const inShen = luCunPalace.branch === chart.shenGongBranch;
  if (!inMing && !inShen) return;
  patterns.push({
    name: inMing ? '祿存守命' : '祿存守身',
    level: 'good',
    description: inMing
      ? '祿存坐命，主一生衣食無憂、財祿穩定。性格保守，善積累，但羊陀夾祿須防小人。最宜配化祿、左輔右弼方為大格。'
      : '祿存入身宮，主中年後財源穩定、得祿自享。倪師說「祿存入身，財氣近身」——配偶或事業方向能帶來穩定財祿。',
    palaces: [inMing ? '命宮' : '身宮'],
    conditions: { required: [inMing ? '祿存入命宮' : '祿存入身宮'] },
    source: '《紫微斗數全書·祿存星》',
  });
}

/** 天馬入命/遷：驛馬星動 */
function detectTianMaRuMing(chart: ZiweiChart, patterns: Pattern[]) {
  const tianMaPalace = findStarPalace(chart, '天馬');
  if (!tianMaPalace) return;
  const inMing = tianMaPalace.branch === chart.mingGongBranch;
  const inQian = tianMaPalace.branch === ((chart.mingGongBranch + 6) % 12);
  if (!inMing && !inQian) return;
  patterns.push({
    name: inMing ? '天馬入命' : '天馬在遷',
    level: 'neutral',
    description: inMing
      ? '天馬坐命，主一生奔波、動中得財，宜走商旅、外勤、跨界發展。倪師說「天馬入命，無祿不發」——若再會祿存或化祿即「祿馬交馳」之富格。'
      : '天馬在遷移宮，主外出有利、遠行得財，宜異鄉發展。配化祿主異地生財，配煞星則旅途多波折。',
    palaces: [tianMaPalace.name],
    conditions: { required: [inMing ? '天馬入命宮' : '天馬入遷移宮'] },
    source: '《紫微斗數全書·天馬星》',
  });
}

/** 化祿入財：財帛宮主星化祿 */
function detectHuaLuRuCai(chart: ZiweiChart, patterns: Pattern[]) {
  const cai = chart.palaces.find(p => p.name === '財帛');
  if (!cai) return;
  const luStar = cai.stars.find(s => s.type === 'major' && s.siHua === '祿');
  if (!luStar) return;
  patterns.push({
    name: '化祿入財',
    level: 'good',
    description: `${luStar.name}化祿入財帛宮，主財源暢通、收入穩定。倪師講化祿是「正財」象徵——這個化祿星所代表的能力（${luStar.name}的核心特質）是你賺錢的主軸。配祿存或天馬則財源更廣。`,
    palaces: ['財帛'],
    conditions: { required: [`${luStar.name}化祿入財帛宮`] },
    source: '《紫微斗數全書·四化論》',
  });
}

/** 化權入官：官祿宮主星化權 */
function detectHuaQuanRuGuan(chart: ZiweiChart, patterns: Pattern[]) {
  const guan = chart.palaces.find(p => p.name === '官祿');
  if (!guan) return;
  const quanStar = guan.stars.find(s => s.type === 'major' && s.siHua === '權');
  if (!quanStar) return;
  patterns.push({
    name: '化權入官',
    level: 'good',
    description: `${quanStar.name}化權入官祿宮，主事業有掌控力、能擔當獨當一面的職位。化權代表權力與執行力——${quanStar.name}化權說明你在事業上能成為決策者或核心執行者，宜走管理或技術權威路線。`,
    palaces: ['官祿'],
    conditions: { required: [`${quanStar.name}化權入官祿宮`] },
    source: '《紫微斗數全書·四化論》',
  });
}

/** 化科入命/身：科名加身 */
function detectHuaKeRuMingShen(chart: ZiweiChart, patterns: Pattern[]) {
  const ming = chart.palaces.find(p => p.branch === chart.mingGongBranch);
  const shen = chart.palaces.find(p => p.branch === chart.shenGongBranch);
  const target = [ming, shen].filter((p): p is Palace => Boolean(p));
  for (const p of target) {
    const keStar = p.stars.find(s => s.type === 'major' && s.siHua === '科');
    if (!keStar) continue;
    const isMing = p.branch === chart.mingGongBranch;
    patterns.push({
      name: isMing ? '化科入命' : '化科入身',
      level: 'good',
      description: `${keStar.name}化科入${isMing ? '命' : '身'}宮，主名聲、文書、學術運。倪師講化科是「貴人星」——${keStar.name}化科帶來的是被人看重的特質，宜從事文書、教育、研究、諮詢、文創等“以名取利”的方向。`,
      palaces: [isMing ? '命宮' : '身宮'],
      conditions: { required: [`${keStar.name}化科入${isMing ? '命' : '身'}宮`] },
      source: '《紫微斗數全書·四化論》',
    });
    return; // 命和身重複時只識別一次
  }
}

/** 機月同梁三星會（3 星不全格，非四星真格）：天機/太陰/天同/天梁 任 3 星齊入三方四正 */
function detectJiYueTongLiangPartial(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  const has = ['天機', '太陰', '天同', '天梁'].filter(s => sanFangSet.has(s));
  if (has.length !== 3) return; // 4 星齊由 detectJiYueTongLiang 處理
  // 避免和上面 detectJiYueTongLiang 重複（4 星齊的不進這裡）
  const missing = ['天機', '太陰', '天同', '天梁'].filter(s => !sanFangSet.has(s));
  patterns.push({
    name: '機月同梁三星會',
    level: 'neutral',
    description: `機月同梁需天機、太陰、天同、天梁四星齊會三方四正方為完整真格；本盤只會齊其中 3 顆（${has.join('、')}），缺${missing.join('、')}未會，並非完整真格，力量減一檔。文質帶謀，宜公職、教研、醫療、服務等靠積累與穩定的行業，關鍵看缺位星與四化的配合。`,
    palaces: getSanFangPalaces(chart).filter(p => has.some(s => getMajorStarNames(p).includes(s))).map(p => p.name),
    conditions: { required: [`三方四正會${has.join('、')}（機月同梁缺${missing.join('、')}）`] },
    source: '《紫微斗數全書·機月同梁格》',
  });
  void ming;
}

/** 昌曲同會：文昌+文曲都在命三方四正 */
function detectChangQuTongHui(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!sanFangSet.has('文昌') || !sanFangSet.has('文曲')) return;
  const ming = chart.palaces.find(p => p.branch === chart.mingGongBranch);
  if (!ming) return;
  const inMing = hasStar(ming, '文昌') && hasStar(ming, '文曲');
  patterns.push({
    name: inMing ? '昌曲坐命' : '昌曲同會',
    level: 'good',
    description: inMing
      ? '文昌文曲同入命宮，主聰明俊秀、文采斐然，宜文學、教育、寫作、諮詢。最忌化忌——昌曲化忌主文書契約暗虧。'
      : '文昌文曲同會三方四正，主才華橫溢、口才文筆俱佳。宜走需要表達與文采的行業，化科加持則名聲大顯。',
    palaces: ['命宮'],
    conditions: { required: ['文昌、文曲同會命宮三方四正'] },
    source: '《紫微斗數全書·文星論》',
  });
}

/** 輔弼同會：左輔+右弼都在命三方四正 */
function detectFuBiTongHui(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!sanFangSet.has('左輔') || !sanFangSet.has('右弼')) return;
  patterns.push({
    name: '輔弼同會',
    level: 'good',
    description: '左輔右弼同會命宮三方四正，主一生貴人不絕、人緣極佳。最宜領導崗位與團隊合作型工作。倪師說「輔弼夾命，平生貴人多」——你不是單打獨鬥的命，要善用人際網路。',
    palaces: ['命宮'],
    conditions: { required: ['左輔、右弼同會命宮三方四正'] },
    source: '《紫微斗數全書·輔弼論》',
  });
}

/** 魁鉞同會：天魁+天鉞都在命三方四正 */
function detectKuiYueTongHui(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!sanFangSet.has('天魁') || !sanFangSet.has('天鉞')) return;
  patterns.push({
    name: '魁鉞同會',
    level: 'good',
    description: '天魁天鉞同會命宮三方四正，主"天乙貴人"加持，關鍵時刻總有貴人提攜。倪師說「魁鉞夾命，必為貴人」——遇到困難時身邊會出現得力相助者，宜主動維護人脈。',
    palaces: ['命宮'],
    conditions: { required: ['天魁、天鉞同會命宮三方四正'] },
    source: '《紫微斗數全書·魁鉞論》',
  });
}

/** 科權雙會：化科 + 化權 同會三方四正 */
function detectKeQuanShuangHui(chart: ZiweiChart, patterns: Pattern[]) {
  const sfPalaces = getSanFangPalaces(chart);
  let hasKe = false, hasQuan = false;
  for (const p of sfPalaces) {
    for (const s of p.stars) {
      if (s.type === 'major' && s.siHua === '科') hasKe = true;
      if (s.type === 'major' && s.siHua === '權') hasQuan = true;
    }
  }
  if (!hasKe || !hasQuan) return;
  patterns.push({
    name: '科權雙會',
    level: 'good',
    description: '化科 + 化權 同會三方四正，主名權雙美——既有學識/名聲（科），又有掌控力（權），宜走"專業權威"路線（如醫生、律師、教授、技術骨幹），名利雙收且根基紮實。',
    palaces: ['命宮'],
    conditions: { required: ['化科、化權同會命宮三方四正'] },
    source: '《紫微斗數全書·四化會照》',
  });
}

// ────────────────── 主入口 ──────────────────
export function detectPatterns(chart: ZiweiChart): Pattern[] {
  const patterns: Pattern[] = [];
  const ming = chart.palaces.find(p => p.branch === chart.mingGongBranch);
  if (!ming) return patterns;

  // 上格
  detectJunChenQingHui(chart, ming, patterns);
  detectZiFu(chart, ming, patterns);
  detectFuXiangChaoYuan(chart, ming, patterns);
  detectYangLiangChangLu(chart, ming, patterns);
  detectHuoTanLingTan(chart, ming, patterns);
  detectWuTan(chart, ming, patterns);
  detectShaPoLang(chart, ming, patterns);
  detectJiYueTongLiang(chart, ming, patterns);

  // 中格
  detectLianXiang(chart, patterns);
  detectWuQiSha(chart, patterns);
  detectTongLiang(chart, patterns);
  detectRiYueTongGong(chart, patterns);
  detectRiYueJiaMing(chart, patterns);
  detectJuRiTongGong(chart, patterns);
  detectShiZhongYinYu(chart, ming, patterns);
  detectMingZhuChuHai(chart, ming, patterns);
  detectZiWeiInMing(chart, ming, patterns);

  // 助力格
  detectFuBiJiaMing(chart, patterns);
  detectChangQuJiaMing(chart, patterns);
  detectKuiYueJiaMing(chart, patterns);
  detectShuangLuChaoYuan(chart, ming, patterns);
  detectSanQiJiaHui(chart, patterns);
  detectHuaLuRuMing(chart, ming, patterns);

  // 惡格
  detectHuaJiRuMingQian(chart, patterns);
  detectYangTuoJiaJi(chart, patterns);
  detectHuoLingJiaMing(chart, patterns);
  detectKongJieJiaMing(chart, patterns);
  detectLianShaYang(chart, patterns);
  detectJuHuoYang(chart, patterns);
  detectLingChangTuoWu(chart, patterns);
  detectMaTouDaiJian(chart, ming, patterns);

  // 基礎格局（提升識別覆蓋率，讓普通命盤也能識別 1-3 個）
  detectLuCunShouShen(chart, patterns);
  detectTianMaRuMing(chart, patterns);
  detectHuaLuRuCai(chart, patterns);
  detectHuaQuanRuGuan(chart, patterns);
  detectHuaKeRuMingShen(chart, patterns);
  detectJiYueTongLiangPartial(chart, ming, patterns);
  detectChangQuTongHui(chart, patterns);
  detectFuBiTongHui(chart, patterns);
  detectKuiYueTongHui(chart, patterns);
  detectKeQuanShuangHui(chart, patterns);

  return patterns;
}

// ────────────────── 命宮摘要（保持向後相容）──────────────────
export function getMingGongSummary(chart: ZiweiChart): {
  stars: string[];
  keywords: string[];
  nature: string;
} {
  const mingPalace = chart.palaces.find(p => p.branch === chart.mingGongBranch);
  if (!mingPalace) return { stars: [], keywords: [], nature: '' };

  const majorStars = mingPalace.stars.filter(s => s.type === 'major');
  const starNames = majorStars.map(s => s.name);

  const keywordMap: Record<string, string[]> = {
    '紫微': ['尊貴', '獨立', '領導'],
    '天機': ['智慧', '機變', '善謀'],
    '太陽': ['陽剛', '官貴', '慷慨'],
    '武曲': ['財富', '剛毅', '果斷'],
    '天同': ['溫和', '享福', '隨緣'],
    '廉貞': ['才藝', '桃花', '多變'],
    '天府': ['財庫', '穩重', '保守'],
    '太陰': ['柔美', '財富', '細膩'],
    '貪狼': ['慾望', '桃花', '多才'],
    '巨門': ['善辯', '多思', '口才'],
    '天相': ['輔佐', '行政', '穩健'],
    '天梁': ['蔭護', '醫藥', '長輩'],
    '七殺': ['將星', '果決', '孤克'],
    '破軍': ['開創', '變動', '破舊'],
  };

  const natureMap: Record<string, string> = {
    '紫微': '帝王星', '天機': '智慧星', '太陽': '貴人星',
    '武曲': '財帛星', '天同': '福德星', '廉貞': '桃花星',
    '天府': '財庫星', '太陰': '財富星', '貪狼': '桃花星',
    '巨門': '是非星', '天相': '印綬星', '天梁': '廕庇星',
    '七殺': '將帥星', '破軍': '變動星',
  };

  const keywords = starNames.flatMap(n => keywordMap[n] ?? []).slice(0, 5);
  const nature = starNames.length > 0 ? (natureMap[starNames[0]] ?? '') : '空宮';

  return { stars: starNames, keywords, nature };
}
