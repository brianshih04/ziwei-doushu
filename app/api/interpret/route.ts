/**
 * POST /api/interpret — AI 命盤解讀（SSE 串流）
 * Body: { chart: ZiweiChart, messages: {role, content}[] }
 * 前端解析約定見 components/ChatPanel.tsx / InsightPanel.tsx：
 *   data: {"delta":{"text":...}} … data: [DONE]
 */
import { clientIp, rateLimit, streamChatToSse, type ChatMessage } from '@/lib/ai/client';
import { chartToPrompt } from '@/lib/ai/chart-prompt';
import type { ZiweiChart } from '@/lib/ziwei/types';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `你是基於倪海廈《天紀》教學體系的紫微斗數解讀 AI，同時熟悉《紫微斗數全書》等古籍。使用者會給你一張已排好的命盤的結構化資料，並圍繞它提問。

回答要求：
1. 用繁體中文（台灣用語），語氣專業、親和，結構清晰（善用【小標題】與要點）。
2. 解讀立場以倪海廈體系為主：重命宮/身宮、三方四正、生年四化與宮幹自化、大限流年飛化；福德宮與夫妻宮聯參。
3. 引用倪師觀點時儘量註明出處（如《天紀》第幾集）；不確定的出處就不要寫，禁止編造引文。
4. 紫微斗數批六親（父母、兄弟、子女）本就偏弱——倪師原話「斗數批六親本來就比較差一點」，涉及六親的解讀要提醒僅供參考。
5. 給具體、可操作的建議；避免絕對化的宿命論斷，兼顧「知命而後運」的積極立場。
6. 命盤結構化資料是唯一事實依據，不要臆測盤面之外的資訊；盤面沒有的資訊（如具體流年事件）要說明斗數的侷限。
7. 涉及健康只作養生提醒，不構成醫療建議；涉及財運/事業不作投資建議。`;

const MAX_MESSAGES = 20;
const MAX_CONTENT_CHARS = 6000;

export async function POST(req: Request) {
  if (!rateLimit(clientIp(req))) {
    return Response.json({ error: '提問太頻繁，請稍後再試' }, { status: 429 });
  }

  let body: { chart?: ZiweiChart; messages?: { role: string; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: '請求體不是合法 JSON' }, { status: 400 });
  }

  const { chart, messages: userMessages } = body;
  if (!chart || !Array.isArray(chart.palaces) || chart.palaces.length !== 12) {
    return Response.json({ error: '缺少有效命盤資料（chart）' }, { status: 400 });
  }
  if (!Array.isArray(userMessages) || userMessages.length === 0) {
    return Response.json({ error: '缺少對話內容（messages）' }, { status: 400 });
  }

  const history: ChatMessage[] = userMessages
    .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_MESSAGES)
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content.slice(0, MAX_CONTENT_CHARS),
    }));

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content:
        `以下是命盤結構化資料（解讀的唯一事實依據）：\n\n${chartToPrompt(chart)}\n\n` +
        '請記住這份命盤。後續問題都圍繞它回答；若問題與命盤無關，先簡要說明再回到命盤視角。',
    },
    ...history,
  ];

  return streamChatToSse(messages, { temperature: 0.7 });
}
