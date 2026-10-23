/**
 * 紫微斗數排盤演算法 — 基於 iztro 開源庫
 * https://github.com/SylarLong/iztro
 */

import { astro } from 'iztro';
import { Solar, LunarMonth } from 'lunar-javascript';
import type { BirthInfo, LunarInfo, Star, Palace, DaXian, DaXianSiHua, ZiweiChart } from './types';
import { BRANCHES, STEMS } from './constants';
import { schoolStarBrightness, type BrightnessSchool } from './school-data';
import { SCHOOL_AX } from './school-tables.generated';
import { DEFAULT_LEAP_MONTH } from './school-config';
// 飛星派工具僅供匯出，不再在排盤時呼叫（倪師《天紀 03》：四化星永遠固定不動）
// import { detectSelfSihua, getSiHuaByStem } from './sihua';

// 紫微斗數主流派（中州派/全書派/主流排盤軟體）採用"正月初一換年"規則（農曆年口徑）。
// 例：1999/2/11 立春已過（立春=2/4），但春節(2/16)未到 → 仍屬戊寅年臘月，非己卯年。
// 影響 iztro 內部排盤的五行局/命主/身主/四化/紫微定位 — 這是與主流排盤軟體對齊的關鍵。
//
// ★ 修正歷史（2026-05-12）：
// 原配置 yearDivide:'exact'（立春換年）→ 改為 'normal'（正月初一換年）
// 原因：使用者反饋與主流排盤軟體的盤"宮位一樣、其他完全不一樣"，
// 經診斷（scripts/diff-chart-vs-other.ts）確認根因是換年規則，主流派一律用農曆年。
//
// ★ 星曜亮度修正（2026-05-08）
// iztro 預設亮度表與《紫微斗數全書》存在 24 處差異（14 主星 + 6 輔星），
// 已通過 config.brightness 全量覆寫修正。
// 陣列索引從寅起：0=寅 1=卯 2=辰 3=巳 4=午 5=未 6=申 7=酉 8=戌 9=亥 10=子 11=丑
// 交叉驗證來源：紫微取象派全書解讀、令東來廟旺表、iztro 官方文件、金標準盤
// ★ 抽成具名常量（2026-06-11）：供 setBrightnessSchool('default') 顯式還原，根治「切流派後全域性亮度洩漏」。
//   必須完整覆蓋全部 14 主星——流派表（schoolBrightnessTableToIztroFormat）覆寫 14 主星，
//   若此處缺某主星鍵，切流派後該星被汙染卻無鍵可蓋回（實測：武曲/廉貞/巨門/破軍 曾缺失）。
const DEFAULT_BRIGHTNESS: Record<string, string[]> = {
    //            寅     卯     辰     巳     午     未     申     酉     戌     亥     子     丑
    // ── 紫微系六星 ──────────────────────────────────────────
    // 紫微：寅宮 旺→廟（全書：廟於寅午丑未）
    '紫微': ['廟','旺','得','旺','廟','廟','旺','旺','得','旺','平','廟'],
    // 天機：辰宮 利→廟、戌宮 利→廟（依「天機廟於子午辰戌」通行廟旺總訣；善本《全書》天機條無逐宮原文，此句系後世總訣轉述，非善本直證）
    '天機': ['得','旺','廟','平','廟','陷','得','旺','廟','平','廟','陷'],
    // 太陽：午宮 旺→廟（全書：廟於卯午）
    '太陽': ['旺','廟','旺','旺','廟','得','得','陷','不','陷','陷','不'],
    // 武曲：iztro 預設與全書一致 ✓
    // 天同：寅宮 利→旺（全書：旺於子寅申）、午宮 陷→不（全書：不得地於午丑未）
    '天同': ['旺','平','平','廟','不','不','旺','平','平','廟','旺','不'],
    // 廉貞：iztro 預設與全書一致 ✓

    // ── 天府系八星 ──────────────────────────────────────────
    // 天府：辰宮 廟→旺、戌宮 廟→旺（全書：旺於辰戌午酉）
    '天府': ['廟','得','旺','得','旺','廟','得','旺','旺','得','廟','廟'],
    // 太陰：寅宮 旺→陷、酉宮 不→旺（全書：廟於亥子丑，旺於酉戌，陷於寅卯辰巳午）★ 重大修正
    // ★ 2026-06-10 doctrine 複核（使用者留言「太陽太陰廟旺有誤」觸發，詳見 docs/audits/taiyin-brightness-review.md）：
    //   善本《全書·諸星問答論·太陰》逐字（quanshu-juan1-source.ts）：「以卯辰巳午未為陷地，以酉戌亥子丑為得垣」
    //   → 午宮原值'不'與上行自引出處及善本兩源皆牴觸，系 05 月校訂漏網，校訂為'陷'。
    //   存疑保留：未宮善本作陷地、此表沿用'不'（通行廟旺表多不入陷，流派分歧）；寅宮善本未提，沿用 05 月校訂'陷'。
    '太陰': ['陷','陷','陷','陷','陷','不','利','旺','旺','廟','廟','廟'],
    // 貪狼：iztro 原始表為 6 位對稱構造（平利廟陷旺廟重複），與古籍差異顯著，按通行 XD1 表修正
    // ★ 2026-06-11 複核（二次）：XD1 巳宮=地（表內數值 3），iztro Brightness 無'地'，對映為'平'（同屬 normal 區，與金標準盤顯示一致）
    '貪狼': ['不','平','得','平','平','廟','不','平','得','利','平','廟'],
    // 巨門：iztro 預設與全書一致 ✓（全書各源分歧已複核，iztro 取值合理）
    // 天相：卯宮 陷→平、酉宮 陷→平（依「天相平於卯酉」通行廟旺總訣；善本《全書》天相條無逐宮原文，且通行四派亮度表此處亦全作「平」，故「平」站得住）
    '天相': ['廟','平','得','得','廟','得','廟','平','得','得','廟','廟'],
    // 天梁：卯宮 廟→得、戌宮 廟→得（全書：得地於卯戌）
    '天梁': ['廟','得','廟','陷','廟','旺','陷','得','得','陷','廟','旺'],
    // 七殺：酉宮 廟→旺（全書：旺於子午卯酉）
    '七殺': ['廟','旺','廟','平','旺','廟','廟','旺','廟','平','旺','廟'],
    // 破軍：iztro 預設與全書一致 ✓

    // ── 輔星（六吉六煞）────────────────────────────────────
    // 文昌：iztro 預設與全書一致 ✓
    // 文曲：辰宮 得→廟、子宮 得→廟（全書：廟於巳酉丑子辰，共五廟位）
    '文曲': ['平','旺','廟','廟','陷','旺','得','廟','陷','旺','廟','廟'],
    // 火星：iztro 預設與全書一致 ✓
    // 鈴星：iztro 錯誤地複製了火星亮度！全書鈴星與火星不同 ★ 重大修正
    //   辰申 陷→得、未 利→得、丑 得→陷、亥 利→陷（全書：廟寅午戌，地辰巳未申，陷丑亥子）
    //   酉宮：iztro/主流排盤軟體/元亨利貞 均為"得"，從眾修正
    '鈴星': ['廟','利','得','得','廟','得','得','得','廟','陷','陷','陷'],
    // 擎羊：酉宮 陷→旺、子宮 陷→旺（全書：廟辰戌丑未，旺酉子，陷卯午）
    '擎羊': ['','陷','廟','','陷','廟','','旺','廟','','旺','廟'],
    // 陀羅：iztro 預設與全書一致 ✓

    // ── 武曲 / 廉貞 / 巨門 / 破軍 ───────────────────────────────
    // 這 4 顆主星 iztro 原生值與《全書》一致，原先未顯式覆寫（靠 iztro 內建 fallback）。
    // ★ 2026-06-11 補入原生值（探針 scripts 實測，寅起）：使 DEFAULT 表完整含 14 主星，
    //   流派切換後 setBrightnessSchool('default') 才能全量蓋回、還原預設。
    '武曲': ['得','利','廟','平','旺','廟','得','利','廟','平','旺','廟'],
    '廉貞': ['廟','平','利','陷','平','利','廟','平','利','陷','平','利'],
    '巨門': ['廟','廟','陷','旺','旺','不','廟','廟','陷','旺','旺','不'],
    '破軍': ['得','陷','旺','平','廟','旺','得','陷','旺','平','廟','旺'],
};

// 模組載入即寫入預設亮度表 + 農曆正月初一換年規則（astro.config 為全域性副作用）
astro.config({
  yearDivide: 'normal',
  brightness: DEFAULT_BRIGHTNESS,
});

// ─── 亮度流派切換（2026-05-12，金標準盤核對後引入）─────────────────────────
// 預設 = 我們當前的自定義表（基於全書 + 金標準盤交叉驗證）
// 切換 = 調 setBrightnessSchool('qs' | 'xd1' | 'zz' | 'xd2') 覆寫為通行四派任一套
//
// 注意：astro.config 是全域性副作用，每次呼叫影響所有後續 generateChart
//       服務端多使用者場景下要小心 race condition（chart 生成是同步的，影響小）

export type SchoolBrightnessKind = 'default' | BrightnessSchool;

// ★ 2026-06-20 星曜亮度全套對齊主流排盤口徑：全盤亮度改由裝配層直接查 SB_[school] 表
//   （schoolStarBrightness：主星+輔星+煞星+空劫統一一套表/一套對映/子起一索引），
//   不再走 iztro 的 astro.config 覆寫（舊的 DEFAULT_BRIGHTNESS 善本手敲表 + schoolBrightnessTableToIztroFormat
//   方向讀反的對映，都已棄用）。
// ★ 2026-10-20 default = 《斗數全書》QS（站長定：主流排盤預設口徑是什麼，我們預設就是什麼）。
//   證據：主流排盤軟體設定頁「重置設定 → 重置為系統預設值」後，星曜亮度停在
//   「依據斗數全書 (預設)」（截圖已存檔）；會員發來的金標準盤
//   53 顆星亮度與 QS 表 53/53 一致、與 XD2 只 44/53。6-20 那次改成 XD2 的「使用者實證 27/27」是一臺手選了
//   現代修訂亮度表（第二版）的機器，不是預設口徑。流派切換隻改此值（同步主輔煞，避免不一致）。
let currentBrightSchool: BrightnessSchool = 'QS';

export function setBrightnessSchool(school: SchoolBrightnessKind): void {
  currentBrightSchool = school === 'default' ? 'QS' : school;
}

export type LunarMonthPolicy = 'split' | 'next-month' | 'prev-month' | 'origin-month';

export interface EffectiveLunarDate {
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  isLeapMonth: boolean;
  rawLunarMonth: number;
  rawLunarDay: number;
}

/**
 * Resolve the lunar month used by the chart and all month-based patches.
 * The raw lunar date remains available so callers can keep split behavior on
 * the real leap month while non-split policies use the same effective date.
 */
export function resolveEffectiveLunarDate(
  year: number,
  month: number,
  day: number,
  policy: LunarMonthPolicy = 'prev-month',
): EffectiveLunarDate {
  const lunar = Solar.fromYmd(year, month, day).getLunar();
  const rawLunarMonth = Number(lunar.getMonth());
  const rawLunarDay = Number(lunar.getDay());
  const isRawLeapMonth = rawLunarMonth < 0;
  const absoluteMonth = Math.abs(rawLunarMonth);

  if (!isRawLeapMonth) {
    return {
      lunarYear: Number(lunar.getYear()),
      lunarMonth: absoluteMonth,
      lunarDay: rawLunarDay,
      isLeapMonth: false,
      rawLunarMonth,
      rawLunarDay,
    };
  }

  let lunarYear = Number(lunar.getYear());
  let lunarMonth = absoluteMonth;
  let isLeapMonth = false;

  if (policy === 'split') {
    // Keep iztro's established split rule: days 1-15 use the prior month,
    // and the second half uses the following month.
    if (rawLunarDay > 15) lunarMonth = absoluteMonth + 1;
  } else if (policy === 'next-month') {
    lunarMonth = absoluteMonth + 1;
  } else if (policy === 'origin-month') {
    isLeapMonth = true;
  }

  if (lunarMonth > 12) {
    lunarMonth = 1;
    lunarYear += 1;
  }

  let lunarDay = rawLunarDay;
  try {
    const monthKey = isLeapMonth ? -lunarMonth : lunarMonth;
    const dayCount = LunarMonth.fromYm(lunarYear, monthKey)?.getDayCount?.();
    if (typeof dayCount === 'number' && dayCount > 0 && lunarDay > dayCount) lunarDay = dayCount;
  } catch { /* 查不到月資訊則保留原日，維持下游既有容錯 */ }

  return {
    lunarYear,
    lunarMonth,
    lunarDay,
    isLeapMonth,
    rawLunarMonth,
    rawLunarDay,
  };
}

// ─── 農曆資訊（相容保留）────────────────────────────────────────
export function getLunarInfo(
  year: number,
  month: number,
  day: number,
  hour?: number,
  policy: LunarMonthPolicy = 'prev-month',
): LunarInfo {
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  const effective = resolveEffectiveLunarDate(year, month, day, policy);
  // lunar-javascript 沒有 .d.ts，立春換年方法只在 runtime 上有，用 any 繞過
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lu = lunar as any;
  // 紫微斗數排盤年（正月初一換年，與上方 astro.config:yearDivide='normal' 同口徑）
  // 注意：節氣四柱(下方)用 getEightChar() 精確到立春/節的時刻，八字四柱永遠立春換年，跟紫微的"農曆年"是兩套
  const yearStem = STEMS.indexOf(lu.getYearGan());
  const yearBranch = BRANCHES.indexOf(lu.getYearZhi());
  // ★ 節氣四柱（年柱/月柱/日柱/時柱）+ 非節氣四柱（農曆口徑月柱）
  let fourPillars: [string, string, string, string] | undefined;
  let fourPillarsLunar: [string, string, string, string] | undefined;
  try {
    // ★ 2026-09-01 立春/節氣邊界修正：節氣四柱的年柱、月柱改用 getEightChar()（精確到立春/節的時刻）。
    //   原用 getYearGanByLiChun()/getMonthGan() 是「按立春當天整天」切換、不看時刻 —— 立春當天凌晨出生
    //   的會被算進新的一年，年/月柱各差一位（會員實測：2004-02-04 丑時應為癸未/乙丑，卻排成甲申/丙寅）。
    //   立春=2004-02-04 19:56，此人凌晨 2:40 生，本該上一年癸未。lunar-javascript 的 getYearGanByLiChun
    //   即使傳入時間也按日切換（實測無效），getEightChar 才精確到分。
    //   時刻用「時辰中點」(index*2 點)近似，與排盤既有的真太陽時時辰同口徑；日柱/時柱不受立春影響、保持原演算法。
    //   非節氣日新舊完全一致（只有落在立春/十二節當天、交節時刻前後的人才會變），已抽樣 12 例逐一比對驗證。
    const effHour = (hour !== undefined && hour >= 0 && hour <= 11) ? hour * 2 : 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ec = (Solar as any).fromYmdHms(year, month, day, effHour, 0, 0).getLunar().getEightChar();
    const yearGZ = ec.getYear() as string;    // 節氣四柱年柱：立春精確換年
    const monthGZ = ec.getMonth() as string;  // 節氣四柱月柱：節氣精確換月 + 五虎遁用立春校正後的年幹
    const dayGZ = `${lu.getDayGan()}${lu.getDayZhi()}`;
    // 時柱：日干 + 時支共同決定；時幹由 day stem + hour 推
    // 規則：甲己日子時 → 甲子；乙庚日子時 → 丙子；丙辛 → 戊；丁壬 → 庚；戊癸 → 壬
    const dayStem = STEMS.indexOf(lu.getDayGan());
    const branchIdx = hour !== undefined && hour >= 0 && hour <= 11 ? hour : 0;
    const timeStemBase = (dayStem % 5) * 2; // 子時起的天干
    const timeStemIdx = (timeStemBase + branchIdx) % 10;
    const timeGZ = `${STEMS[timeStemIdx]}${BRANCHES[branchIdx]}`;
    fourPillars = [yearGZ, monthGZ, dayGZ, timeGZ];

    // ★ 非節氣四柱（對齊主流排盤軟體「非節氣四柱」）：年柱用農曆年(正月初一換年，與紫微同口徑)、
    //   月柱按農曆月(初一換月)重算 —— 節氣交界日(如生在小暑後數十分鐘)節氣版會進下一月、農曆版仍在本月，月柱差一位。
    //   日/時柱不受年月口徑影響，複用上方。lunar-javascript 無農曆口徑月柱方法，用五虎遁手算。
    const absM = effective.lunarMonth;
    const yearGZLunar = `${STEMS[yearStem]}${BRANCHES[yearBranch]}`;        // 農曆年干支(正月初一換年)
    const monthBranchIdx = (absM + 1) % 12;                                 // 農曆月→月支(正月=寅)
    const monthStemBase = ((yearStem % 5) * 2 + 2) % 10;                    // 五虎遁：農曆年幹定正月(寅)天干
    const monthStemIdx = (monthStemBase + (absM - 1)) % 10;
    const monthGZLunar = `${STEMS[monthStemIdx]}${BRANCHES[monthBranchIdx]}`;
    fourPillarsLunar = [yearGZLunar, monthGZLunar, dayGZ, timeGZ];
  } catch { /* lunar-javascript 介面異常時跳過 */ }

  return {
    lunarYear: effective.lunarYear,
    lunarMonth: effective.lunarMonth,
    lunarDay: effective.lunarDay,
    yearStem: yearStem >= 0 ? yearStem : 0,
    yearBranch: yearBranch >= 0 ? yearBranch : 0,
    isLeapMonth: effective.isLeapMonth,
    fourPillars,
    fourPillarsLunar,
  };
}

// ─── 命主星 / 身主星（按地支查表）─────────────────────────
const MING_ZHU_TABLE: Record<number, string> = {
  0: '貪狼', 1: '巨門', 2: '祿存', 3: '文曲', 4: '廉貞', 5: '武曲',
  6: '破軍', 7: '武曲', 8: '廉貞', 9: '文曲', 10: '祿存', 11: '巨門',
};
const SHEN_ZHU_TABLE: Record<number, string> = {
  0: '火星', 6: '火星', 1: '天相', 7: '天相',
  2: '天梁', 8: '天梁', 3: '天同', 9: '天同',
  4: '文昌', 10: '文昌', 5: '天機', 11: '天機',
};
export function calcMingZhu(branch: number): string { return MING_ZHU_TABLE[branch] ?? ''; }
export function calcShenZhu(branch: number): string { return SHEN_ZHU_TABLE[branch] ?? ''; }
export function calcYinYangGender(yearStem: number, gender: 'male' | 'female'): string {
  return `${yearStem % 2 === 0 ? '陽' : '陰'}${gender === 'male' ? '男' : '女'}`;
}

// ─── 亮度對映 ────────────────────────────────────────────────────
function mapBrightness(b?: string): 'bright' | 'normal' | 'dim' {
  if (!b) return 'normal';
  if (b === '廟' || b === '旺') return 'bright';
  if (b === '陷' || b === '不' || b === '閒') return 'dim';
  return 'normal';
}

/** 從 iztro 原始亮度文本中提取標準 7 檔之一 */
function extractRawBrightness(b?: string): import('./types').StarBrightness | undefined {
  if (!b) return undefined;
  const valid: import('./types').StarBrightness[] = ['廟', '旺', '得', '利', '平', '不', '閒', '陷', '地'];
  for (const x of valid) {
    if (b.includes(x)) return x;
  }
  return undefined;
}

// ─── 星曜型別對映 ────────────────────────────────────────────────
const SHA_STARS = new Set(['擎羊', '陀羅', '火星', '鈴星', '地空', '地劫',
  '天空', '旬空', '副旬', '截路', '截空', '副截', '大耗', '天使', '天傷',
  // ★ 擴充（之前只判主煞，半兇雜耀漏判）
  '天刑', '天哭', '天虛', '天月', '陰煞', '蜚廉', '空亡',
  '孤辰', '寡宿']);
const LUCKY_STARS = new Set(['文昌', '文曲', '左輔', '右弼', '天魁', '天鉞',
  '祿存', '天馬', '天官', '天福', '天才', '天壽', '三臺', '八座', '恩光',
  '天貴', '臺輔', '龍池', '鳳閣', '紅鸞', '天喜',
  // ★ 擴充：吉雜耀
  '解神', '天德', '月德', '年解', '天巫', '華蓋', '封誥']);

function mapStarType(starName: string, iztroType: string): Star['type'] {
  if (SHA_STARS.has(starName)) return 'sha';
  if (LUCKY_STARS.has(starName)) return 'lucky';
  const t = (iztroType ?? '').toLowerCase();
  if (t === '主星' || t === 'major') return 'major';
  if (t === '煞星' || t === 'tough') return 'sha';
  if (t === '吉星' || t === 'soft' || t === '祿存' || t === '天馬') return 'lucky';
  return 'minor';
}

// ─── 五行局名稱 → 數字 ──────────────────────────────────────────
function parseWuxingJu(name: string): number {
  if (name.includes('二')) return 2;
  if (name.includes('三')) return 3;
  if (name.includes('四')) return 4;
  if (name.includes('五')) return 5;
  if (name.includes('六')) return 6;
  return 3;
}

// ─── 主函式：生成命盤 ────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────
// 天魁天鉞 · 預設派(KY1)修正
//
// 使用者決策(2026-05-30):排盤對齊主流排盤預設口徑(金標準盤對照實證,見 docs/school-parity-report.md)。
// 實測 10 天干年僅【辛年】與 iztro 現狀不同:
//   辛年  預設口徑 = 天魁在寅 / 天鉞在午;iztro(主流) = 天魁在午 / 天鉞在寅。
// ⚠️ 預設派在辛年與主流「辛馬虎 = 魁午鉞寅」口訣相反(魁鉞對調)。這是主流排盤軟體的
//    既定排法,此處遵使用者「對齊預設口徑」決定。其餘 9 個天干年預設口徑與 iztro 本就一致。
// 回退:刪除 generateChart 內 applySchoolKuiyue(...) 呼叫即恢復 iztro 主流派。
// ─────────────────────────────────────────────────────────────────────────
function relocateStar(palaces: Palace[], name: string, targetBranch: number): void {
  let moved: Star | undefined;
  for (const p of palaces) {
    const i = p.stars.findIndex((s) => s.name === name);
    if (i >= 0) {
      if (p.branch === targetBranch) return; // 已在目標宮,無需移動
      moved = p.stars[i];
      p.stars.splice(i, 1);
      break;
    }
  }
  if (!moved) return;
  const target = palaces.find((p) => p.branch === targetBranch);
  if (target) {
    target.stars.push(moved);
    // ★ 2026-06-20 天魁天鉞換位（預設派 KY1）後,亮度仍是 iztro 舊宮位算的（錯位）。按新宮地支重算亮度。
    const rb = schoolStarBrightness(moved.name, targetBranch, currentBrightSchool);
    moved.brightnessRaw = extractRawBrightness(rb);
    moved.brightness = rb ? mapBrightness(rb) : undefined;
  }
}

function applySchoolKuiyue(palaces: Palace[], yearStemCn: string): void {
  const gan = STEMS.indexOf(yearStemCn); // 甲=0 … 癸=9
  if (gan < 0) return;
  const row = SCHOOL_AX.KY_ARR1[gan + 1]; // KY 表「甲=1」起;子起一編碼
  if (!row) return;
  relocateStar(palaces, '天魁', row[0] - 1); // 子起一(子=1) → BRANCHES 索引(子=0)
  relocateStar(palaces, '天鉞', row[1] - 1);
}

/**
 * 本命頂欄「大耗」（年支星，不是宮底博士十二神那顆）。
 * 2026-08-14 按金標準盤核對十二年支：陽支歲破+1，陰支歲破−1。
 * 子=0 起偶數為陽支（子寅辰午申戌）。
 */
export function schoolDahaoBranch(yearBranch: number): number {
  const suiPo = (yearBranch + 6) % 12;
  return yearBranch % 2 === 0 ? (suiPo + 1) % 12 : (suiPo + 11) % 12;
}

function pushNatalStar(palaces: Palace[], branch: number, name: string): void {
  const target = palaces.find((p) => p.branch === branch);
  if (!target || target.stars.some((s) => s.name === name)) return;
  const rb = schoolStarBrightness(name, branch, currentBrightSchool);
  target.stars.push({
    name,
    type: mapStarType(name, ''),
    brightness: rb ? mapBrightness(rb) : undefined,
    brightnessRaw: extractRawBrightness(rb),
  });
}

function applySchoolDahao(palaces: Palace[], yearBranch: number): void {
  pushNatalStar(palaces, schoolDahaoBranch(yearBranch), '大耗');
}

/**
 * 本命頂欄截空/副截。
 * 對子仍是甲己申酉、乙庚午未、丙辛辰巳、丁壬寅卯、戊癸子丑（iztro 已排對）。
 * 陽幹截空落陽宮、副截落陰宮；陰乾對調。iztro 一律截路=陽宮、空亡=陰宮，陰乾要換宮。
 * 2026-08-14 金標準盤：辛丑巳截空/辰副截，己亥酉截空/申副截，乙巳未截空/午副截。
 */
function applySchoolJiekong(palaces: Palace[], yearStem: number): void {
  for (const p of palaces) {
    for (const s of p.stars) {
      if (s.name === '截路') s.name = '截空';
      else if (s.name === '空亡') s.name = '副截';
      else continue;
      // ★ 2026-10-20 改名後按新名字補亮度：iztro 原名查不到亮度，陽幹年（不換宮、下面直接 return）
      //   截空 / 副截一直留白，主流排盤預設口徑是有亮度的（真盤：丙寅 辰截空=陷、巳副截=廟）。陰乾換宮後下面再按新宮重算。
      const rb = schoolStarBrightness(s.name, p.branch, currentBrightSchool);
      s.brightness = rb ? mapBrightness(rb) : undefined;
      s.brightnessRaw = extractRawBrightness(rb);
    }
  }
  if (yearStem % 2 === 0) return;
  const jie = palaces.find((p) => p.stars.some((s) => s.name === '截空'));
  const fu = palaces.find((p) => p.stars.some((s) => s.name === '副截'));
  if (!jie || !fu || jie === fu) return;
  const jieStar = jie.stars.find((s) => s.name === '截空');
  const fuStar = fu.stars.find((s) => s.name === '副截');
  if (!jieStar || !fuStar) return;
  jie.stars = jie.stars.filter((s) => s !== jieStar);
  fu.stars = fu.stars.filter((s) => s !== fuStar);
  const rbJ = schoolStarBrightness('截空', fu.branch, currentBrightSchool);
  const rbF = schoolStarBrightness('副截', jie.branch, currentBrightSchool);
  jieStar.brightness = rbJ ? mapBrightness(rbJ) : undefined;
  jieStar.brightnessRaw = extractRawBrightness(rbJ);
  fuStar.brightness = rbF ? mapBrightness(rbF) : undefined;
  fuStar.brightnessRaw = extractRawBrightness(rbF);
  fu.stars.push(jieStar);
  jie.stars.push(fuStar);
}

/** 旬空成對（子丑/寅卯/辰巳/午未/申酉/戌亥）。副旬落在另一支：旬空陽支+1、陰支−1。 */
function applySchoolFuxun(palaces: Palace[]): void {
  const xun = palaces.find((p) => p.stars.some((s) => s.name === '旬空'));
  if (!xun) return;
  const fu = xun.branch % 2 === 0 ? (xun.branch + 1) % 12 : (xun.branch + 11) % 12;
  pushNatalStar(palaces, fu, '副旬');
}

export function generateChart(
  birthInfo: BirthInfo,
  opts?: { leapMonth?: LunarMonthPolicy },
): ZiweiChart {
  const { year, month, day, hour, gender } = birthInfo;
  if (!Number.isInteger(hour) || hour < 0 || hour > 11) {
    throw new RangeError(`hour must be an integer branch index from 0 to 11; received ${hour}`);
  }
  // 公曆日期必須真實存在：2 月 30 日、非閏年 2 月 29 日、4 月 31 日這類日期，
  // iztro 不報錯而是順延成下個月的頭幾天排盤，結果會和真實日期的盤重複。
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    !Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day) ||
    probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day
  ) {
    throw new RangeError(`solar date does not exist: ${year}-${month}-${day}`);
  }
  const iztroGender = gender === 'male' ? '男' : '女';

  // 閏月處理（流派分歧：歸本月 / 歸下月 / 前後半分）
  // 預設 = DEFAULT_LEAP_MONTH（2026-09-05 起 split：主流排盤預設口徑「月中分界」，150 組金標準盤對照驗證；倪師派歸下月可經流派抽屜切 next-month）
  // 非 split 時先算農曆，閏月才切 byLunar；非閏月仍走 bySolar，與 split 行為完全一致
  const leapMode = opts?.leapMonth ?? DEFAULT_LEAP_MONTH;
  const effectiveLunar = resolveEffectiveLunarDate(year, month, day, leapMode);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let astrolabe: any;

  if (leapMode !== 'split' && effectiveLunar.rawLunarMonth < 0) {
      // 閏月生人 → 按使用者選項切換月份歸屬
      const lunarDateStr = `${effectiveLunar.lunarYear}-${effectiveLunar.lunarMonth}-${effectiveLunar.lunarDay}`;
      astrolabe = astro.byLunar(
        lunarDateStr,
        hour,
        iztroGender,
        effectiveLunar.isLeapMonth,
        false,
        'zh-TW',
      );
  } else {
    // 非閏月或 split 模式：直接 bySolar，保持 iztro 的既有行為
    astrolabe = astro.bySolar(`${year}-${month}-${day}`, hour, iztroGender, true, 'zh-TW');
  }

  // 讓序列化後的 chart.birthInfo 繼續攜帶同一閏月策略，供客戶端運限 helper 重建本命盤。
  const chartBirthInfo = {
    ...birthInfo,
    leapMonthPolicy: leapMode,
  } as BirthInfo & { leapMonthPolicy: LunarMonthPolicy };

  // ── 組裝十二宮 ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const palaces: Palace[] = astrolabe.palaces.map((p: any) => {
    const branch = BRANCHES.indexOf(p.earthlyBranch as string);
    const stem   = STEMS.indexOf(p.heavenlyStem as string);

    // 合併所有星：主星 + 次星 + 雜耀
    const allStars: Star[] = [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(p.majorStars ?? []).map((s: any) => {
        // ★ 2026-06-20 全套對齊主流排盤口徑:亮度統一查 SB_[currentBrightSchool] 表(全書派預設),不再用 iztro/善本表
        const rb = schoolStarBrightness(s.name as string, branch, currentBrightSchool);
        return {
          name:          s.name as string,
          type:          'major' as const,
          brightness:    rb ? mapBrightness(rb) : undefined,
          brightnessRaw: extractRawBrightness(rb),
          siHua:         s.mutagen as Star['siHua'],
        };
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(p.minorStars ?? []).map((s: any) => {
        // ★ 2026-06-20 輔星(左輔右弼天魁天鉞祿存天馬) + 煞星(火鈴羊陀空劫) 同走 SB 表(同一套對映/索引)
        const rb = schoolStarBrightness(s.name as string, branch, currentBrightSchool);
        return {
          name:          s.name as string,
          type:          mapStarType(s.name as string, s.type as string),
          brightness:    rb ? mapBrightness(rb) : undefined,
          brightnessRaw: extractRawBrightness(rb),
          siHua:         s.mutagen as Star['siHua'],
        };
      }),
      // ★ 之前 adjectiveStars 全部強制 type='minor'，繞過了 mapStarType，
      //   導致紅鸞/天喜（lucky）、天刑/天哭（sha）等被錯分類。改成走對映函式，
      //   讓所有星正確按性質分到 lucky / sha / minor 三類，UI 也能正常分割槽顯示
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(p.adjectiveStars ?? []).map((s: any) => {
        // ★ 2026-06-20 雜耀亮度對齊主流排盤口徑：行號 = SB 亮度表 ID（SCHOOL_STAR_ID_TO_NAME 反查），
        //   落宮沿用 iztro（與金標準盤一致），金標準盤 24/24 驗證。名字不在表裡的雜耀 → undefined（留白，同現狀）。
        const rb = schoolStarBrightness(s.name as string, branch, currentBrightSchool);
        return {
          name:          s.name as string,
          type:          mapStarType(s.name as string, (s.type as string) ?? ''),
          brightness:    rb ? mapBrightness(rb) : undefined,
          brightnessRaw: extractRawBrightness(rb),
          siHua:         s.mutagen as Star['siHua'],
        };
      }),
    ];

    // ★ 2026-06-20 對齊主流排盤口徑：預設口徑把「歲前12神/將前12神」裡的特定神煞當本命星顯示
    //   （劫煞@將前、龍德@歲前），iztro 把這兩套放在 jiangqian12/suiqian12 單獨欄位，
    //   原裝配只取 major/minor/adjective 三類 → 整套漏了。在此補回（這兩顆金標準盤亦不標亮度，留白）。
    //   年支大耗不走歲前12神（iztro 歲前大耗=歲破，預設口徑不是），見 applySchoolDahao。
    for (const sname of [p.suiqian12, p.jiangqian12] as (string | undefined)[]) {
      if (sname === '劫煞' || sname === '龍德') {
        allStars.push({ name: sname, type: mapStarType(sname, '') });
      }
    }

    const range = p.decadal?.range;
    return {
      branch:        branch >= 0 ? branch : 0,
      stem:          stem >= 0 ? stem : 0,
      name:          p.name as string,
      stars:         allStars,
      daXianAge:     range ? [range[0], range[1]] as [number, number] : undefined,
      isMingGong:    p.name === '命宮',
      isShenGong:    p.isBodyPalace ?? false,
      isCurrentDaXian: false,
    };
  });

  // ★ 天魁天鉞對齊預設派(KY1)——使用者決策 2026-05-30,實測僅辛年與現狀不同(見上方函式註釋)
  const yearStemCn = (astrolabe.rawDates?.chineseDate?.yearly?.[0]) as string | undefined;
  if (yearStemCn) applySchoolKuiyue(palaces, yearStemCn);

  // ── 當前年齡 & 大限 ──
  // ★ 用 iztro horoscope.age.nominalAge（中國虛歲口徑，與 daXianAge 範圍一致）
  // 舊實現 `currentYear - year` 是年份差（少 1），導致大限邊界年份錯位 → 使用者感覺
  // "大限沒走對，似乎還在走上一個大限"。統一用 iztro 自身口徑修復。
  let currentAge: number;
  try {
    const horo = (astrolabe as unknown as { horoscope: () => { age: { nominalAge: number } } }).horoscope();
    currentAge = horo.age.nominalAge;
  } catch {
    // fallback：iztro 介面異常時回退到虛歲推導
    currentAge = new Date().getFullYear() - year + 1;
  }

  palaces.forEach(p => {
    if (p.daXianAge && currentAge >= p.daXianAge[0] && currentAge <= p.daXianAge[1]) {
      p.isCurrentDaXian = true;
    }
  });

  // ── 借對宮結構化欄位（codex P0：避免文案層從自然語言反查借宮資訊）──
  palaces.forEach(p => {
    p.oppositeBranch = (p.branch + 6) % 12;
    const mainStars = p.stars.filter(s => s.type === 'major');
    p.isEmpty = mainStars.length === 0;
    if (p.isEmpty) {
      const oppPalace = palaces.find(q => q.branch === p.oppositeBranch);
      if (oppPalace) {
        p.borrowedFromBranch = oppPalace.branch;
        p.borrowedFromName = oppPalace.name;
        p.borrowedStars = oppPalace.stars.filter(s => s.type === 'major').map(s => s.name);
      }
    }
  });

  // ── 關鍵宮支 ──
  const mingGongBranch = BRANCHES.indexOf(astrolabe.earthlyBranchOfSoulPalace as string);
  const shenGongBranch = BRANCHES.indexOf(astrolabe.earthlyBranchOfBodyPalace as string);
  const wuxingJuName   = astrolabe.fiveElementsClass as string;
  const wuxingJu       = parseWuxingJu(wuxingJuName);

  // ── 紫微星位置 ──
  const ziweiPalace = palaces.find(p => p.stars.some(s => s.name === '紫微' && s.type === 'major'));
  const ziweiPos    = ziweiPalace?.branch ?? 0;

  // ── 大限陣列（倪師《天紀》正統：四化永遠固定，大限只看宮位移動）──
  // 不再生成 daXians[].siHua / stemIndex / stemName（飛星派欄位已下線）
  const daXians: DaXian[] = palaces
    .filter(p => p.daXianAge)
    .sort((a, b) => a.daXianAge![0] - b.daXianAge![0])
    .map(p => ({
      startAge:    p.daXianAge![0],
      endAge:      p.daXianAge![1],
      palaceBranch: p.branch,
      palaceName:   p.name,
    }));

  // 宮幹自化已下線（倪師不主張飛星派宮幹自化論）

  const currentDaXianIndex = daXians.findIndex(
    dx => currentAge >= dx.startAge && currentAge <= dx.endAge,
  );

  // ── 農曆資訊（含節氣四柱）──
  const lunarInfo = getLunarInfo(year, month, day, hour, leapMode);

  // ★ 2026-08-14 金標準盤核對：截空/副截陰乾對調 + 年支大耗 + 旬空成對副旬
  applySchoolJiekong(palaces, lunarInfo.yearStem);
  applySchoolDahao(palaces, lunarInfo.yearBranch);
  applySchoolFuxun(palaces);

  // ── 命主 / 身主 / 陰陽性別 ──
  const mingZhu = calcMingZhu(mingGongBranch >= 0 ? mingGongBranch : 0);
  const shenZhu = calcShenZhu(lunarInfo.yearBranch);
  const yinYangGender = calcYinYangGender(lunarInfo.yearStem, gender);

  return {
    birthInfo: chartBirthInfo,
    lunarInfo,
    mingGongBranch: mingGongBranch >= 0 ? mingGongBranch : 0,
    shenGongBranch: shenGongBranch >= 0 ? shenGongBranch : 0,
    wuxingJu,
    wuxingJuName,
    ziweiPos,
    palaces,
    daXians,
    currentAge,
    currentDaXianIndex,
    mingZhu,
    shenZhu,
    yinYangGender,
  };
}
