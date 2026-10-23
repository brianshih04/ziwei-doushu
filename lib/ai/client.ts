/**
 * AI 推理共用客戶端（OpenAI 相容協議）
 *
 * 預設對接 z.ai Coding Plan（GLM 系列）。所有配置可用環境變數覆蓋：
 *   AI_BASE_URL / AI_API_KEY / AI_MODEL
 * 未設 AI_API_KEY 時依次回退 ZAI_API_KEY、DEEPSEEK_API_KEY。
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export function resolveAiConfig(): AiConfig | null {
  if (process.env.AI_API_KEY || process.env.ZAI_API_KEY) {
    return {
      baseUrl: (process.env.AI_BASE_URL || process.env.ZAI_BASE_URL || 'https://api.z.ai/api/coding/paas/v4').replace(/\/$/, ''),
      apiKey: (process.env.AI_API_KEY || process.env.ZAI_API_KEY)!,
      model: process.env.AI_MODEL || 'glm-5.3-flash',
    };
  }
  if (process.env.DEEPSEEK_API_KEY) {
    return {
      baseUrl: 'https://api.deepseek.com/v1',
      apiKey: process.env.DEEPSEEK_API_KEY,
      model: process.env.AI_MODEL || 'deepseek-chat',
    };
  }
  return null;
}

/**
 * 呼叫 OpenAI 相容 /chat/completions（stream），
 * 把上游 delta.content 轉成本站前端約定的 SSE 事件：{"delta":{"text":...}}，
 * 結尾發 data: [DONE]。
 */
export async function streamChatToSse(
  messages: ChatMessage[],
  opts?: { temperature?: number; maxTokens?: number },
): Promise<Response> {
  const cfg = resolveAiConfig();
  if (!cfg) {
    return Response.json(
      { error: 'AI 未配置：請在 .env.local 設定 AI_API_KEY（預設走 z.ai Coding Plan）' },
      { status: 500 },
    );
  }

  const isZai = cfg.baseUrl.includes('z.ai');
  const upstream = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      stream: true,
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.maxTokens ?? 4096,
      // GLM 預設深度思考，首 token 可達分鐘級且推理吃掉 max_tokens；
      // 解讀場景要即時串流，對 z.ai 端點顯式關閉。
      ...(isZai ? { thinking: { type: 'disabled' } } : {}),
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    return Response.json(
      { error: `上游模型請求失敗（${upstream.status}）`, detail: detail.slice(0, 500) },
      { status: 502 },
    );
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            const text = sseLineToText(line);
            if (text === null) continue;
            if (text === '[DONE]') continue; // 統一由結尾補發一次
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: { text } })}\n\n`));
            }
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch {
        // 上游中斷也要讓前端收到終止符，避免介面一直轉圈
        try { controller.enqueue(encoder.encode('data: [DONE]\n\n')); } catch { /* closed */ }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

/** 解析上游一行 SSE：返回要下發的文本、''（跳過）、'[DONE]' 或 null（非資料行） */
function sseLineToText(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) return null;
  const data = trimmed.slice(5).trim();
  if (!data) return null;
  if (data === '[DONE]') return '[DONE]';
  try {
    const parsed = JSON.parse(data);
    // 只轉發正文內容；思考模型的 reasoning_content 不進解讀介面
    return parsed?.choices?.[0]?.delta?.content ?? '';
  } catch {
    return '';
  }
}

/** 極簡記憶體限流（按 IP）。單例項有效，重啟清零；公網濫用兜底用。 */
const hits = new Map<string, number[]>();

export function rateLimit(ip: string, limit = 12, windowMs = 5 * 60_000): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter(t => now - t < windowMs);
  if (list.length >= limit) {
    hits.set(ip, list);
    return false;
  }
  list.push(now);
  hits.set(ip, list);
  return true;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('cf-connecting-ip') ?? 'unknown';
}
