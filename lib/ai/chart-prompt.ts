/**
 * 命盤 → 緊湊中文文本（餵給 AI 的結構化資料）
 * 保留排盤引擎的全部關鍵事實：十二宮星曜/亮度/四化/自化、大限、四柱、五行局等。
 */
import { STEMS, BRANCHES } from '@/lib/ziwei/constants';
import type { Star, ZiweiChart } from '@/lib/ziwei/types';

function starText(s: Star): string {
  let t = s.name;
  if (s.brightnessRaw) t += `(${s.brightnessRaw})`;
  if (s.siHua) t += `[化${s.siHua}]`;
  return t;
}

function palaceLine(p: ZiweiChart['palaces'][number]): string {
  const stem = STEMS[p.stem] ?? '?';
  const branch = BRANCHES[p.branch] ?? '?';
  const parts: string[] = [];
  parts.push(`${p.name}（${stem}${branch}）: `);

  const majors = p.stars.filter(s => s.type === 'major');
  const others = p.stars.filter(s => s.type !== 'major');
  if (p.stars.length === 0) {
    parts.push('空宮');
    if (p.borrowedStars?.length) parts.push(`，借對宮（${p.borrowedFromName ?? ''}）[${p.borrowedStars.join(' ')}]`);
  } else {
    if (majors.length) parts.push(majors.map(starText).join(' '));
    if (others.length) parts.push('；輔煞: ' + others.map(starText).join(' '));
  }
  if (p.selfSihua?.length) {
    parts.push('；自化: ' + p.selfSihua.map(m => `自化${m.siHua}(${m.starName})`).join(' '));
  }
  const marks: string[] = [];
  if (p.isMingGong) marks.push('命宮');
  if (p.isShenGong) marks.push('身宮');
  if (p.isCurrentDaXian) marks.push('當前大限');
  if (p.daXianAge) marks.push(`大限${p.daXianAge[0]}-${p.daXianAge[1]}歲`);
  if (marks.length) parts.push(`〔${marks.join('·')}〕`);
  return parts.join('');
}

export function chartToPrompt(chart: ZiweiChart): string {
  const b = chart.birthInfo;
  const l = chart.lunarInfo;
  const shichen = `${BRANCHES[b.hour] ?? '?'}時`;

  const lines: string[] = [];
  lines.push('【基本盤】');
  const place = b.province ? ` | 出生地: ${b.province}${b.city ? b.city : ''}${b.longitude ? `（東經${b.longitude.toFixed(1)}°）` : ''}` : '';
  lines.push(
    `公曆 ${b.year}年${b.month}月${b.day}日 ${shichen} | ${b.gender === 'male' ? '男命' : '女命'}${chart.yinYangGender ? `（${chart.yinYangGender}）` : ''}${place}`,
  );
  lines.push(
    `農曆 ${STEMS[l.yearStem]}${BRANCHES[l.yearBranch]}年 ${l.isLeapMonth ? '閏' : ''}${Math.abs(l.lunarMonth)}月${l.lunarDay}日` +
    (l.fourPillars ? ` | 節氣四柱: ${l.fourPillars.join(' ')}` : ''),
  );
  lines.push(
    `五行局: ${chart.wuxingJuName} | 命主: ${chart.mingZhu ?? '未知'} | 身主: ${chart.shenZhu ?? '未知'} | 命宮在${BRANCHES[chart.mingGongBranch]}，身宮在${BRANCHES[chart.shenGongBranch]}`,
  );
  const dx = chart.daXians?.[chart.currentDaXianIndex];
  if (dx) {
    const dxSihua = dx.siHua ? `，大限四化: 祿=${dx.siHua.lu} 權=${dx.siHua.quan} 科=${dx.siHua.ke} 忌=${dx.siHua.ji}` : '';
    lines.push(`當前虛歲 ${chart.currentAge}，行「${dx.palaceName}」大限（${dx.startAge}-${dx.endAge}歲）${dxSihua}`);
  }

  lines.push('');
  lines.push('【十二宮】');
  for (const p of chart.palaces) lines.push(palaceLine(p));

  return lines.join('\n');
}
