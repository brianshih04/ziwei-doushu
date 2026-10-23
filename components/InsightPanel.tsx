'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AiThinking from './AiThinking';
import type { ZiweiChart, Palace } from '@/lib/ziwei/types';
import type { TimeView } from './TimeNav';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  hidden?: boolean; // don't show user bubble for auto/topic messages
}

interface SelectedSiHua {
  starName: string;
  siHua: string;
  view: TimeView;
}

interface InsightPanelProps {
  chart: ZiweiChart;
  selectedPalace?: Palace | null;
  selectedSiHua?: SelectedSiHua | null;
}

const TOPICS = [
  { key: 'overview',     label: '命格' },
  { key: 'love',        label: '感情' },
  { key: 'career',      label: '事業' },
  { key: 'wealth',      label: '財運' },
  { key: 'health',      label: '健康' },
  { key: 'personality', label: '性格' },
] as const;

const TOPIC_PROMPTS: Record<string, string> = {
  overview: `請生成命格總覽，按以下結構輸出：

**【命格定性】**
用一句話概括這個命盤的核心格局與命主氣質。

**【主星解讀】**
命宮主星的核心特質，引用倪海廈原話或觀點。

**【三方四正】**
財、官、遷三宮的聯動分析及整體格局。

**【當前大限】**
當下大限運勢方向與最值得關注的事項。

**【優勢與注意】**
命盤天賦優勢，以及需要注意的風險或功課。`,

  love: `請深度分析感情婚姻運，按以下結構輸出：

**【感情格局】**
一句話定性感情命格。

**【夫妻宮分析】**
夫妻宮主星、四化，以及倪海廈體系的具體解讀。

**【三方聯動】**
相關宮位對感情的影響。

**【當前大限感情運】**
當下10年感情走向與關鍵節點。

**【實際建議】**
具體可行的感情建議。`,

  career: `請深度分析事業運，按以下結構輸出：

**【事業格局】**
一句話定性事業命格，宜任職或宜創業。

**【官祿宮分析】**
官祿宮主星、四化，以及倪師對這種配置的判斷。

**【財帛宮聯動】**
財運與事業的關係，財路來源分析。

**【當前大限事業運】**
當下10年事業走向。

**【實際建議】**
適合的方向、行業與策略。`,

  wealth: `請深度分析財運，按以下結構輸出：

**【財運格局】**
一句話定性財運模式，是主動財還是被動財。

**【財帛宮分析】**
財帛宮主星、四化，財富來源與流動模式。

**【田宅宮（財庫）】**
積蓄能力與不動產運勢分析。

**【當前大限財運】**
當下財運走向與注意事項。

**【理財建議】**
具體的財務建議。`,

  health: `請分析健康運勢，按以下結構輸出：

**【疾厄宮主星】**
疾厄宮星曜與健康含義。

**【主要風險】**
結合倪海廈子午流注理論，分析主要健康隱患與需關注的部位。

**【大限健康走勢】**
當下健康趨勢與關鍵時間段。

**【預防建議】**
具體注意事項與養生方向。`,

  personality: `請深度解析性格特質，按以下結構輸出：

**【命宮主星性格】**
命宮主星的核心性格特質，引用倪師原話。

**【三方性格綜合】**
財、官、遷三宮對性格的影響，全貌描繪。

**【人際關係模式】**
與他人互動方式、待人處世風格。

**【優勢與人生課題】**
天賦優勢，以及需要面對的人生功課。`,
};

const PALACE_ROLES: Record<string, string> = {
  '命宮':   '自我、性格、先天格局',
  '兄弟宮': '兄弟關係、合夥人',
  '夫妻宮': '感情關係、婚姻狀態',
  '子女宮': '子女緣分、下屬關係',
  '財帛宮': '財運來源、收入方式',
  '疾厄宮': '身體健康、意外',
  '遷移宮': '外出機遇、人際格局',
  '交友宮': '朋友圈、貴人、小人',
  '官祿宮': '事業成就、社會地位',
  '田宅宮': '不動產、家庭環境',
  '福德宮': '精神享受、內心福分',
  '父母宮': '父母關係、文書契約',
};

/** Render AI markdown: **【Title】** → gold header, **bold** → strong */
function AiContent({ text, streaming }: { text: string; streaming?: boolean }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        const sectionMatch = line.match(/^\*\*【(.+?)】\*\*$/);
        if (sectionMatch) {
          return (
            <div key={i} className="pt-3 pb-0.5 first:pt-0">
              <span className="text-[11px] font-semibold tracking-wide" style={{ color: 'var(--t-gold)' }}>
                【{sectionMatch[1]}】
              </span>
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;
        const parts = line.split(/\*\*(.+?)\*\*/);
        return (
          <div key={i} className="text-[11px] leading-relaxed" style={{ color: 'var(--t-text2)' }}>
            {parts.map((part, j) =>
              j % 2 === 0
                ? part
                : <strong key={j} className="font-medium" style={{ color: 'var(--t-text)' }}>{part}</strong>
            )}
          </div>
        );
      })}
      {streaming && (
        <span
          className="inline-block w-1.5 h-3 ml-0.5 animate-pulse rounded-sm align-middle"
          style={{ background: 'var(--t-gold)', opacity: 0.6 }}
        />
      )}
    </div>
  );
}

export default function InsightPanel({ chart, selectedPalace, selectedSiHua }: InsightPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string>('overview');
  const messagesRef = useRef<Message[]>([]); // always-current copy for closures
  const loadingRef = useRef(false);
  const autoLoaded = useRef(false);
  const lastPalaceBranch = useRef<number | undefined>(undefined);
  const lastSiHuaKey = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep refs in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-generate 命格總覽 on mount
  useEffect(() => {
    if (autoLoaded.current) return;
    autoLoaded.current = true;
    sendMessage(TOPIC_PROMPTS.overview, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Inject palace analysis when palace selected
  useEffect(() => {
    if (!selectedPalace || selectedPalace.branch === lastPalaceBranch.current) return;
    lastPalaceBranch.current = selectedPalace.branch;

    const majorStars = selectedPalace.stars.filter(s => s.type === 'major');
    const starDesc = majorStars.length > 0
      ? majorStars.map(s => `${s.name}${s.siHua ? '化' + s.siHua : ''}`).join('、')
      : '空宮（借對宮）';
    const role = PALACE_ROLES[selectedPalace.name] ?? '';

    const prompt = `請重點分析【${selectedPalace.name}】（主管：${role}），該宮主星為${starDesc}，按以下結構輸出：

**【宮位定性】**
${selectedPalace.name}在命盤中的意義，以及這種星曜配置的整體判斷。

**【主星解讀】**
主星在此宮的倪海廈體系解讀，引用具體觀點。

**【三方四正聯動】**
三方四正宮位對此宮的影響。

**【實際建議】**
基於此宮的具體建議。`;

    sendMessage(prompt, true);
  }, [selectedPalace]); // eslint-disable-line react-hooks/exhaustive-deps

  // 注入四化飛化分析
  useEffect(() => {
    if (!selectedSiHua) return;
    const key = `${selectedSiHua.starName}-${selectedSiHua.siHua}-${selectedSiHua.view}`;
    if (key === lastSiHuaKey.current) return;
    lastSiHuaKey.current = key;

    // 找出該星所在宮位
    const palaceOfStar = chart.palaces.find(p =>
      p.stars.some(s => s.name === selectedSiHua.starName)
    );
    const palaceName = palaceOfStar?.name ?? '未知宮位';
    const viewLabel = selectedSiHua.view === 'daxian' ? '大限' : '流年';

    const prompt = `請分析【${viewLabel}${selectedSiHua.starName}化${selectedSiHua.siHua}】的飛化影響，按以下結構輸出：

**【化${selectedSiHua.siHua}基本含義】**
化${selectedSiHua.siHua}在倪海廈體系中的核心含義，以及${selectedSiHua.starName}化${selectedSiHua.siHua}的特殊含義。

**【落宮影響】**
${selectedSiHua.starName}化${selectedSiHua.siHua}落在【${palaceName}】，該宮主管的領域受到何種影響，倪師如何解讀。

**【三方四正飛化路徑】**
化${selectedSiHua.siHua}入${palaceName}後，對其三方四正（對宮、兩個三合宮）的聯動影響。

**【當前運勢影響】**
在${viewLabel}時間維度下，此化${selectedSiHua.siHua}對命主近期運勢的具體影響。

**【實際建議】**
基於此四化的具體可操作建議。`;

    sendMessage(prompt, true);
  }, [selectedSiHua]); // eslint-disable-line react-hooks/exhaustive-deps

  const streamResponse = async (apiMessages: { role: 'user' | 'assistant'; content: string }[]) => {
    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chart, messages: apiMessages }),
      });
      if (res.status === 404) throw new Error('api-missing');
      if (!res.ok) throw new Error('請求失敗');
      if (!res.body) throw new Error('無響應流');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const delta = JSON.parse(data).delta?.text ?? '';
            assistantText += delta;
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'assistant', content: assistantText };
              return updated;
            });
          } catch { /* skip */ }
        }
      }
    } catch (e) {
      const missing = e instanceof Error && e.message === 'api-missing';
      setMessages(prev => [...prev, { role: 'assistant', content: missing ? '開源版不含 AI 解讀介面（/api/interpret），需要你自己實現後才能用，詳見 README「快速開始」。排盤本身不需要任何 API Key。' : '解讀失敗，請稍後重試。' }]);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const sendMessage = (text: string, hidden = false) => {
    if (!text.trim() || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    const userMsg: Message = { role: 'user', content: text, hidden };
    // Capture current messages synchronously via ref (avoids stale closure)
    const apiMessages = [...messagesRef.current, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    streamResponse(apiMessages);
  };

  const handleTopicClick = (topicKey: string) => {
    if (loadingRef.current) return;
    setActiveTopic(topicKey);
    sendMessage(TOPIC_PROMPTS[topicKey], true);
  };

  const handleSend = () => {
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden card-glass">

      {/* ── Topic buttons ── */}
      <div className="flex-shrink-0 px-2 pt-2.5 pb-2" style={{ borderBottom: '1px solid var(--t-border)' }}>
        <div className="grid grid-cols-6 gap-1">
          {TOPICS.map(t => {
            const isActive = activeTopic === t.key;
            return (
              <button
                key={t.key}
                onClick={() => handleTopicClick(t.key)}
                disabled={loading}
                className="py-1.5 text-[10px] font-medium rounded-lg transition-all duration-150 disabled:opacity-40"
                style={{
                  background: isActive ? 'rgba(212,168,67,0.12)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(212,168,67,0.3)' : 'var(--t-border)'}`,
                  color: isActive ? 'var(--t-gold)' : 'var(--t-faint)',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">

        {/* Loading state before first message */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3" style={{ color: 'var(--t-gold)', opacity: 0.1 }}>✦</div>
            <p className="text-[10px] animate-pulse" style={{ color: 'var(--t-faint)' }}>命格解讀生成中…</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            if (msg.role === 'user' && msg.hidden) return null;

            if (msg.role === 'user') {
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end"
                >
                  <div
                    className="max-w-[85%] rounded-xl px-3 py-2 text-[11px]"
                    style={{
                      background: 'rgba(212,168,67,0.08)',
                      border: '1px solid rgba(212,168,67,0.18)',
                      color: 'var(--t-gold)',
                    }}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              );
            }

            // Assistant message
            const isLastMsg = i === messages.length - 1;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div
                  className="text-[9px] tracking-widest mb-2 flex items-center gap-1.5"
                  style={{ color: 'var(--t-faint)' }}
                >
                  <span style={{ color: 'var(--t-gold)', opacity: 0.4 }}>✦</span>
                  命理解讀
                </div>
                <AiContent text={msg.content} streaming={loading && isLastMsg} />
              </motion.div>
            );
          })}
        </AnimatePresence>
        {/* 等 AI 首字回應期間（串流開始前）的明確回饋；有內容後交給串流游標 */}
        {loading && !(messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].content) && (
          <AiThinking label="AI 正在解讀" />
        )}
      </div>

      {/* ── Input ── */}
      <div className="flex-shrink-0 px-3 pb-3 pt-2" style={{ borderTop: '1px solid var(--t-border)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="繼續追問，如：今年適合換工作嗎？"
            disabled={loading}
            className="flex-1 rounded-lg px-3 py-2 text-[11px] focus:outline-none transition-colors"
            style={{
              background: 'var(--t-card)',
              border: '1px solid var(--t-border)',
              color: 'var(--t-text)',
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-3 py-2 rounded-lg text-[11px] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(212,168,67,0.15)',
              border: '1px solid rgba(212,168,67,0.25)',
              color: 'var(--t-gold)',
            }}
          >
            {loading ? '…' : '追問'}
          </button>
        </div>
      </div>

    </div>
  );
}
