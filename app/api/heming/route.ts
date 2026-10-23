/**
 * POST /api/heming — 合盤（婚姻配對）AI 分析（SSE 串流）
 * Body: { chartA: ZiweiChart, chartB: ZiweiChart, question?: string }
 * SSE 格式與 /api/interpret 相同：data: {"delta":{"text":...}} … data: [DONE]
 */
import { clientIp, rateLimit, streamChatToSse, type ChatMessage } from '@/lib/ai/client';
import { chartToPrompt } from '@/lib/ai/chart-prompt';
import {
  HEMING_METHODOLOGY,
  HEMING_SCORE_CRITERIA,
  MARRIAGE_STARS_BRIEF,
  SIHUA_IN_FUQI_GU,
  STAR_IN_FUQI_GU,
} from '@/lib/ziwei/heming-knowledge';
import type { ZiweiChart } from '@/lib/ziwei/types';

export const runtime = 'nodejs';

function validChart(c: unknown): c is ZiweiChart {
  return !!c && Array.isArray((c as ZiweiChart).palaces) && (c as ZiweiChart).palaces.length === 12;
}

/** 只挑與兩張盤實際相關的知識庫條目，控制 prompt 體積 */
function relevantKnowledge(charts: ZiweiChart[]): string {
  const fuqiStars = new Set<string>();
  const fuqiSihua = new Set<string>();
  for (const c of charts) {
    const fuqi = c.palaces.find(p => p.name === '夫妻宮');
    fuqi?.stars.forEach(s => {
      if (s.type === 'major') fuqiStars.add(s.name);
      if (s.siHua) fuqiSihua.add(`化${s.siHua}`);
    });
  }
  const starEntries = [...fuqiStars]
    .filter(n => STAR_IN_FUQI_GU[n])
    .map(n => {
      const k = STAR_IN_FUQI_GU[n];
      return `【${n}】${k.summary}\n- 吉: ${k.good}\n- 兇: ${k.bad}\n- 配偶特質: ${k.spouse_traits}\n- 婚期: ${k.timing}` +
        (k.ni_quote ? `\n- 倪師原話: ${k.ni_quote}` : '');
    });
  const sihuaTable = SIHUA_IN_FUQI_GU as Record<string, string>;
  const sihuaEntries = [...fuqiSihua].filter(k => sihuaTable[k]).map(k => `【夫妻宮${k}】${sihuaTable[k]}`);
  return [
    starEntries.length ? '### 雙方夫妻宮主星斷語\n' + starEntries.join('\n') : '',
    sihuaEntries.length ? '### 夫妻宮四化斷語\n' + sihuaEntries.join('\n') : '',
    '### 婚戀輔助星\n' + Object.entries(MARRIAGE_STARS_BRIEF).map(([k, v]) => `【${k}】${v}`).join('\n'),
    '### 評分標準\n' + Object.entries(HEMING_SCORE_CRITERIA).map(([k, v]) => `${k}: ${v}`).join('\n'),
  ].filter(Boolean).join('\n\n');
}

export async function POST(req: Request) {
  if (!rateLimit(clientIp(req), 6)) {
    return Response.json({ error: '分析太頻繁，請稍後再試' }, { status: 429 });
  }

  let body: { chartA?: ZiweiChart; chartB?: ZiweiChart; question?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: '請求體不是合法 JSON' }, { status: 400 });
  }

  const { chartA, chartB, question } = body;
  if (!validChart(chartA) || !validChart(chartB)) {
    return Response.json({ error: '缺少有效命盤資料（chartA/chartB）' }, { status: 400 });
  }

  const label = (c: ZiweiChart) => {
    const who = c.birthInfo.name || (c.birthInfo.gender === 'male' ? '男方' : '女方');
    return `${who}（${c.birthInfo.year}年生，${c.birthInfo.gender === 'male' ? '男' : '女'}）`;
  };

  const system = `你是基於倪海廈《天紀》體系的紫微斗數合盤（婚戀配對）分析 AI。對兩張命盤做合盤分析。

方法論與評分標準（必須遵守）：
${HEMING_METHODOLOGY}

${relevantKnowledge([chartA, chartB])}

輸出要求：
1. 繁體中文（台灣用語），結構按下方模板；語氣專業中肯，寧可保守不要聳動。
2. 分析時雙宮聯參：雙方的 命宮+夫妻宮+福德宮 必須逐一對照；引用上面知識庫中雙方夫妻宮主星/四化的斷語，有倪師原話的註明。
3. 煞星（擎羊/陀羅/火星/鈴星/地空/地劫）與化忌衝照要明確點出落在誰、哪一宮。
4. 最後給出總體評分（★~★★★★★，嚴格按評分標準）與 3 條具體建議。
5. 結尾固定加一句免責宣告：合盤結果基於傳統命理體系，僅供參考，婚姻幸福取決於雙方經營。

輸出模板：
【總評】兩段話概括這段關係的底色
【甲方視角】${label(chartA)}：夫妻宮與福德宮分析 → 配偶畫像與互動模式
【乙方視角】${label(chartB)}：同上
【雙盤聯參】命宮↔夫妻宮互映情況、四化交會、大限同步性
【亮點】
【風險與化解】
【綜合評分】★數量 + 一句話理由
【建議】3 條
【免責宣告】`;

  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    {
      role: 'user',
      content:
        `甲方命盤：\n${chartToPrompt(chartA)}\n\n乙方命盤：\n${chartToPrompt(chartB)}\n\n` +
        '請按模板完成合盤分析。' +
        (question ? `\n\n使用者額外關心的問題：${question.slice(0, 2000)}` : ''),
    },
  ];

  return streamChatToSse(messages, { temperature: 0.6, maxTokens: 6144 });
}
