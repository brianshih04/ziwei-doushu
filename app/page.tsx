'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import StarField from '@/components/StarField';
import { useTheme, type Theme } from '@/components/ThemeProvider';
import AnnouncementModal from '@/components/AnnouncementModal';

// ─── 滾動入場 wrapper ────────────────────────────────────
function FadeIn({
  children, delay = 0, y = 28, className = '',
}: {
  children: React.ReactNode; delay?: number; y?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function WeakBoundary({ line }: { line: string }) {
  // 之前的版本有 1px 實線 + 12px 漸變陰影，主題切換時形成清晰橫線很硬。
  // 改為更柔和的 24px 漸變 + 低 opacity，section 銜接更自然。
  return (
    <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none"
      style={{ background: `linear-gradient(to bottom, ${line}, transparent)`, opacity: 0.45 }} />
  );
}

// ─── 主題切換按鈕 ────────────────────────────────────────
function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.93 }}
      aria-label={isDark ? '切換亮色主題' : '切換暗色主題'}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
      style={{
        borderColor: isDark ? 'rgba(212,168,67,0.3)' : 'rgba(140,100,20,0.35)',
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,252,242,0.85)',
        transition: 'background 0.35s ease, border-color 0.35s ease',
      }}
    >
      <div className="relative w-10 h-5 rounded-full flex-shrink-0"
        style={{
          background: isDark ? 'rgba(12,24,64,0.95)' : 'rgba(230,195,80,0.55)',
          transition: 'background 0.35s ease',
        }}>
        <motion.div
          animate={{ x: isDark ? 2 : 22 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="absolute top-1 w-3.5 h-3.5 rounded-full"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, #b8a050, #e8d090)'
              : 'linear-gradient(135deg, #e89010, #f8d050)',
          }}
        />
      </div>
      <span className="text-[11px] font-medium tracking-wide select-none"
        style={{
          color: isDark ? 'rgba(212,180,100,0.85)' : 'rgba(110,72,8,0.8)',
          transition: 'color 0.35s ease',
        }}>
        {isDark ? '暗色' : '亮色'}
      </span>
    </motion.button>
  );
}

// ─── 主星資料 ────────────────────────────────────────────
const STARS = [
  { name: '紫微' }, { name: '天機' }, { name: '太陽' }, { name: '武曲' },
  { name: '天同' }, { name: '廉貞' }, { name: '天府' }, { name: '太陰' },
  { name: '貪狼' }, { name: '巨門' }, { name: '天相' }, { name: '天梁' },
  { name: '七殺' }, { name: '破軍' },
];

// ─── 功能模組 ────────────────────────────────────────────
const FEATURES = [
  {
    tag: '排盤體系',
    title: '倪海廈正宗\n紫微斗數',
    subtitle: '非簡化版，嚴格遵循倪海廈老師傳承',
    points: [
      '納音五行局起盤，不採用網路簡化演算法',
      '命宮逆數生時、身宮順數生時，嚴格對齊教學規則',
      '十四主星與四化飛星按原法推演，結構完整可複核',
    ],
  },
  {
    tag: '命盤呈現',
    title: '完整十四主星\n四化飛星',
    subtitle: '結構清晰，一眼看懂主軸與重點',
    points: [
      '十四主星完整入宮，主星關係清楚可讀',
      '輔星與煞星同屏呈現，避免關鍵資訊缺失',
      '廟旺利陷亮度分級，快速識別強弱',
      '點選任意主星即可檢視倪海廈老師對該星的詳細解讀',
    ],
  },
  {
    tag: 'AI 解讀',
    title: '深度解盤\n不止於算',
    subtitle: '倪海廈體系知識庫 × Claude AI',
    points: [
      '命格分析：從命宮主星出發，結合三方四正，給出全面的性格與人生格局判斷',
      '六大維度解讀：事業方向、感情婚姻、財運模式、健康注意、家庭關係、子女緣分',
      '大限流年追蹤：當前10年大限重點、今年流年宮位的具體提示與行動建議',
      '自由追問：針對你的命盤直接提問，「今年能換工作嗎」「什麼時候結婚運最好」',
    ],
  },
  {
    tag: '格局識別',
    title: '自動檢測\n命盤格局',
    subtitle: '從星曜組合中發現你的命中註定',
    points: [
      '自動識別11種經典格局：紫府同宮、殺破狼格、機月同梁、廉相格、武曲七殺等',
      '輔弼夾命、日月夾命等特殊格局精準檢測，並給出倪海廈體系下的標準解讀',
      '四化入命宮遷移宮的特殊狀況自動標註，提示需關注的人生議題',
      '格局按吉凶等級分層展示，讓你一目瞭然自己命盤中的優勢與挑戰',
    ],
  },
];

// ─── 4 大學習板塊（hero 後時間軸）──────────────────────────
const SECTIONS = [
  {
    key: 'ziwei',
    name: '紫微',
    en: 'Zi Wei',
    desc: '14 主星 · 13 宮位 · AI 解讀',
    status: 'ready' as const,
    when: '5 月',
    icon: '◉',  // 實心圓+內點，紫微星視覺
    note: '',
  },
  {
    key: 'tianji',
    name: '天紀',
    en: 'Tian Ji',
    desc: '紫微 · 周易 · 奇門遁甲',
    status: 'soon' as const,
    when: '6 月',
    icon: '⊙',  // 圓+內點（古文"日"），與 ◉ 同字寬
    note: '',
  },
  {
    key: 'diji',
    name: '地紀',
    en: 'Di Ji',
    desc: '倪師未竟之業 · 後輩補註',
    status: 'soon' as const,
    when: '6 月',
    icon: '⊞',  // 方+井（地/田視覺），與 ⊙ 同字寬
    note: '遺稿研讀',
  },
  {
    key: 'renji',
    name: '人紀',
    en: 'Ren Ji',
    desc: '內經 · 傷寒 · 金匱 · 針灸',
    status: 'soon' as const,
    when: '7 月',
    icon: '⊕',  // 圓+十字（醫道/陰陽調和），與 ⊙/⊞ 同字寬
    note: '',
  },
];

// ─── 倪海廈核心教義 ──────────────────────────────────────
const NI_TEACHINGS = [
  {
    title: '命宮為本，三方為用',
    body: '倪師始終強調，看命必先看命宮。命宮主星決定一個人的基本格局與天生性格，三方（財帛、官祿、遷移）則決定此人的「用武之地」。四宮聯動才是完整的人生圖景。',
  },
  {
    title: '對宮借星，不可忽視',
    body: '倪師的獨到之處在於重視「對宮」。任何宮位若為空宮，必須借對宮星曜來論斷，命宮的對面是遷移宮，兩者互相影響，這是很多初學者容易忽略的關鍵。',
  },
  {
    title: '四化才是命運的手',
    body: '星曜只是基礎，四化（化祿、化權、化科、化忌）才是決定運勢好壞的關鍵。同一顆星，有化祿與有化忌，人生軌跡可以截然不同。倪師反覆強調：不看四化，命盤只解了一半。',
  },
  {
    title: '大限十年，運勢有節',
    body: '倪師將人生劃分為12個大限，每個大限10年。他認為人在不同的大限宮位，際遇完全不同。瞭解自己現在走的是哪個大限、該宮位有何星曜，才能真正把握當下的運勢。',
  },
];

// ─── 主題色彩 helper ─────────────────────────────────────
function useColors(theme: Theme) {
  const d = theme === 'dark';
  return {
    bgBase:       d ? '#020810'                                : '#f5efe0',
    // nav 用與 bgBase 完全相同的不透明色，避免半透明疊加產生色差帶
    navBg:        d ? '#020810'                                : '#f5efe0',
    navBorder:    d ? 'rgba(255,255,255,0.05)'                : 'rgba(160,120,30,0.15)',
    goldGrad:     d ? 'linear-gradient(160deg,#c8993a 0%,#f0d070 40%,#c8993a 70%,#f0c755 100%)'
                    : 'linear-gradient(160deg,#6a4206 0%,#9a6a10 40%,#6a4206 70%,#885010 100%)',
    goldSolid:    d ? '#d4a843'                               : '#8b6410',
    goldLine:     d ? 'rgba(212,168,67,0.4)'                  : 'rgba(140,100,20,0.4)',
    tagText:      d ? 'rgba(212,168,67,0.6)'                  : 'rgba(120,80,10,0.65)',
    // 亮色文字用冷灰系（A 方案核心）：暖底 + 冷字 → 視覺不審美疲勞
    textPrimary:  d ? '#e8eef6'                               : '#1a1d24',
    textSecond:   d ? '#b8c6df'                               : '#3a3f4a',
    textMuted:    d ? '#9db0d0'                               : '#5a6275',
    textFaint:    d ? 'rgba(240,246,255,0.56)'                : '#9da4b3',
    // 冷色 accent（B 方案核心）：呼應暗色 quan 藍；用於裝飾性 glow / 連結 / 高亮
    accent:       d ? '#3a78d4'                               : '#3a5a82',
    accentSoft:   d ? 'rgba(58,120,212,0.18)'                 : 'rgba(58,90,130,0.10)',
    cardBg:       d ? 'rgba(255,255,255,0.05)'                : 'rgba(255,255,255,0.88)',
    cardBorder:   d ? 'rgba(255,255,255,0.10)'                : 'rgba(200,160,60,0.25)',
    cardShadow:   d ? '0 4px 32px rgba(0,0,0,0.5)'           : '0 4px 24px rgba(140,100,20,0.12)',
    featureBg:    d ? 'rgba(255,255,255,0.04)'                : 'rgba(255,255,255,0.75)',
    featureBord:  d ? 'rgba(255,255,255,0.08)'                : 'rgba(200,160,60,0.2)',
    glowTint:     d ? 'rgba(212,168,67,0.07)'                 : 'rgba(180,140,40,0.06)',
    // 亮色 glow 真用藍/紫——給整體氛圍加冷色點綴
    glowBlue:     d ? 'rgba(40,80,160,0.12)'                  : 'rgba(58,90,130,0.06)',
    glowPurple:   d ? 'rgba(120,50,180,0.08)'                 : 'rgba(96,80,140,0.04)',
    niBg:         d ? 'rgba(255,255,255,0.04)'                : 'rgba(255,255,255,0.8)',
    niBorder:     d ? 'rgba(212,168,67,0.2)'                  : 'rgba(180,130,40,0.25)',
    niDivider:    d ? 'rgba(255,255,255,0.08)'                : 'rgba(180,130,40,0.12)',
    niCardBg:     d ? 'rgba(255,255,255,0.04)'                : 'rgba(255,255,255,0.9)',
    niCardBord:   d ? 'rgba(255,255,255,0.08)'                : 'rgba(200,160,60,0.2)',
    niCardShadow: d ? '0 2px 20px rgba(0,0,0,0.4)'           : '0 2px 16px rgba(140,100,20,0.1)',
    starBg:       d ? 'rgba(255,255,255,0.04)'                : 'rgba(255,255,255,0.7)',
    starBorder:   d ? 'rgba(212,168,67,0.22)'                 : 'rgba(160,120,30,0.3)',
    starText:     d ? 'rgba(212,168,67,0.7)'                  : 'rgba(120,80,10,0.7)',
    ctaBg:        d ? 'linear-gradient(135deg,#b8892a,#f0d070,#b8892a)'
                    : 'linear-gradient(135deg,#6a4206,#9a6810,#6a4206)',
    ctaText:      d ? '#08080a'                               : '#f8f3e8',
    footerText:   d ? 'rgba(255,255,255,0.08)'                : '#d0b878',
    scrollLine:   d ? 'rgba(212,168,67,0.3)'                  : 'rgba(140,100,20,0.3)',
    scrollText:   d ? 'rgba(255,255,255,0.12)'                : '#c0a870',
    altSection:   d ? 'rgba(255,255,255,0.02)'                : 'rgba(255,255,255,0.4)',
    quoteBg:      d ? 'rgba(212,168,67,0.04)'                 : 'rgba(255,255,255,0.9)',
  };
}

// ─── 四化簡介資料 ─────────────────────────────────────────
const SIHUA_BRIEF: Record<string, { attr: string; brief: string }> = {
  '化祿': { attr: '吉化·增益', brief: '福星到宮，主財運與福氣增益。所在宮位事物順遂，能力增強，是命盤中最受歡迎的化星。' },
  '化權': { attr: '吉化·權威', brief: '權力星到宮，主掌控與領導力。所在宮位主強勢與決斷，喜入官祿宮與命宮，主事業上的實權。' },
  '化科': { attr: '吉化·名譽', brief: '科名星到宮，主聲譽與貴人緣。所在宮位主文名與考運，有貴人扶持，宜學術、考試與公開場合。' },
  '化忌': { attr: '兇化·阻礙', brief: '劫數星到宮，主執念與阻礙。所在宮位需特別關注，該宮人生課題將成為重要考驗。' },
};

// ─── 主星簡介資料 ─────────────────────────────────────────
const STAR_BRIEF: Record<string, { attr: string; brief: string }> = {
  '紫微': { attr: '土·帝王星', brief: '天皇貴星，統御眾星。坐命者有孤傲之氣，主權威顯達，天生具備領導氣質，適合獨當一面的領導崗位。' },
  '天機': { attr: '木·智慧星', brief: '益壽星，主智謀與變動。聰慧機靈，善於籌謀，心思細膩，宜從事策劃、顧問、技術類工作。' },
  '太陽': { attr: '火·官祿主', brief: '官祿主星，主聲譽與名望。慷慨大度，重視公眾形象，利官場與公職，男命力強，入廟時光明磊落。' },
  '武曲': { attr: '金·財帛主', brief: '財帛主星，主財務與決斷。意志堅定，行動果敢，適合財務、金融、軍警類職業，孤克之星，利晚婚。' },
  '天同': { attr: '水·福星', brief: '福德主星，主享樂與人緣。性情溫和，人緣極好，注重生活品質，感情細膩，晚年運勢佳。' },
  '廉貞': { attr: '火·才藝星', brief: '次桃花星，主才藝與情慾。才華出眾，感情豐富，適合藝術、政界，多才多藝但需防桃花是非。' },
  '天府': { attr: '土·財庫星', brief: '南斗主星，主財庫與積蓄。穩重保守，理財能力強，是命盤的穩定力量，適合管理財務與行政。' },
  '太陰': { attr: '水·田宅主', brief: '田宅主星，主財富與陰柔。細膩溫柔，感受力強，女命尤佳，利不動產與積蓄，適合文藝或服務業。' },
  '貪狼': { attr: '木水·桃花', brief: '桃花星，主慾望與才藝。多才多藝，慾望旺盛，社交活躍，宜從事藝術、公關、商業，人緣極好。' },
  '巨門': { attr: '水·是非星', brief: '暗星，主口才與是非。口才出眾，思辨能力強，適合律師、教育、媒體，注意口舌是非，以辯才立身。' },
  '天相': { attr: '水·印星', brief: '印星，主輔佐與印綬。善於協調，重視禮節，正直守法，適合幕僚、行政、法律類工作，貴人運佳。' },
  '天梁': { attr: '土·蔭星', brief: '蔭星，主老成與蔭蔽。正直穩重，慈悲心強，老天爺會保佑，適合醫療、社會工作、宗教領域。' },
  '七殺': { attr: '金火·將星', brief: '將星，主剛烈與開創。性格剛毅，行動力強，勇於挑戰，適合創業、軍警、競爭性行業，逢凶化吉。' },
  '破軍': { attr: '水·耗星', brief: '耗星，主變動與開拓。勇於突破，不懼改變，一生變動大但有魄力，適合開拓型工作，走別人沒走過的路。' },
};

// ─── 功能視覺裝飾 ────────────────────────────────────────
function FeatureVisual({ index, colors: c }: { index: number; colors: ReturnType<typeof useColors> }) {
  if (index === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5">
        <div className="grid grid-cols-4 gap-1.5 w-72 mx-auto">
          {Array.from({ length: 16 }).map((_, i) => {
            const isCenter = [5, 6, 9, 10].includes(i);
            const isActive = [0, 3, 12, 15].includes(i);
            return (
              <motion.div key={i}
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="h-14 rounded-sm flex items-center justify-center text-xs transition-all duration-300"
                style={{
                  border: `1px solid ${isActive ? c.goldLine : c.cardBorder}`,
                  background: isCenter ? 'transparent' : isActive ? c.starBg : c.featureBg,
                  color: isActive ? c.goldSolid : c.textFaint,
                  opacity: isCenter ? 0 : 1,
                }}>
                {isActive ? '★' : ''}
              </motion.div>
            );
          })}
        </div>
        <p className="text-[10px] tracking-widest transition-colors duration-300"
          style={{ color: c.textFaint }}>倪海廈排盤法</p>
      </div>
    );
  }

  if (index === 1) {
    const [sel, setSel] = useState<string | null>(null);
    const selInfo = sel ? (STAR_BRIEF[sel] ?? SIHUA_BRIEF[sel] ?? null) : null;
    return (
      <div className="flex flex-col gap-4 h-full justify-center">
        {[
          { group: '紫微系', stars: ['紫微', '天機', '太陽', '武曲', '天同', '廉貞'] },
          { group: '天府系', stars: ['天府', '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '破軍'] },
        ].map(group => (
          <div key={group.group}>
            <div className="text-[11px] tracking-widest mb-2 transition-colors duration-300"
              style={{ color: c.textFaint }}>{group.group}</div>
            <div className="flex flex-wrap gap-1.5">
              {group.stars.map(s => (
                <motion.button key={s}
                  onClick={() => setSel(sel === s ? null : s)}
                  whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                  className="text-xs px-2 py-1 rounded-md cursor-pointer"
                  style={{
                    border: `1px solid ${sel === s ? c.goldSolid : c.goldLine}`,
                    color: c.goldSolid,
                    background: sel === s ? `${c.goldLine}30` : 'transparent',
                    fontWeight: sel === s ? 600 : 400,
                  }}>
                  {s}
                </motion.button>
              ))}
            </div>
          </div>
        ))}
        <div>
          <div className="text-[11px] tracking-widest mb-2 transition-colors duration-300"
            style={{ color: c.textFaint }}>四化飛星</div>
          <div className="flex gap-2 flex-wrap">
            {[['化祿', 'rgba(52,211,153,0.7)'], ['化權', 'rgba(96,165,250,0.7)'], ['化科', 'rgba(250,204,21,0.7)'], ['化忌', 'rgba(248,113,113,0.7)']].map(([label, color]) => (
              <motion.button key={label}
                onClick={() => setSel(sel === label ? null : label)}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="text-xs px-2.5 py-1 rounded-md cursor-pointer"
                style={{
                  border: `1px solid ${color}`,
                  color,
                  background: sel === label ? `${color.replace('0.7', '0.15')}` : 'transparent',
                  fontWeight: sel === label ? 600 : 400,
                }}>
                {label}
              </motion.button>
            ))}
          </div>
        </div>
        <AnimatePresence mode="wait">
          {selInfo && (
            <motion.div key={sel}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl p-4 mt-1.5"
              style={{ border: `1px solid ${c.goldLine}`, background: c.featureBg }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-semibold" style={{ color: c.goldSolid }}>{sel}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ color: c.tagText, border: `1px solid ${c.goldLine}` }}>{selInfo.attr}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: c.textSecond }}>{selInfo.brief}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (index === 2) {
    const msgs = [
      { role: 'user', text: '我今年的事業運勢如何？' },
      { role: 'ai', text: '命宮天機化祿，今年大限走官祿宮，三方有左輔相助，事業有貴人提攜，適合主動拓展…' },
      { role: 'user', text: '什麼時候感情運最好？' },
    ];
    return (
      <div className="flex flex-col gap-2 h-full justify-center">
        {msgs.map((m, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: m.role === 'user' ? 10 : -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%] text-[11px] px-3 py-2 rounded-lg leading-relaxed"
              style={{
                border: `1px solid ${m.role === 'user' ? c.goldLine : c.cardBorder}`,
                background: m.role === 'user' ? c.starBg : c.featureBg,
                color: m.role === 'user' ? c.goldSolid : c.textSecond,
              }}>
              {m.text}
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (index === 3) {
    const patterns = [
      { name: '殺破狼格', desc: '開創進取之命', ok: true },
      { name: '廉相格',   desc: '行政印綬之格', ok: true },
      { name: '化忌入命', desc: '需關注心理課題', ok: false },
    ];
    return (
      <div className="flex flex-col gap-3 h-full justify-center">
        {patterns.map((p, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{
              border: `1px solid ${p.ok ? 'rgba(96,165,250,0.25)' : 'rgba(251,146,60,0.25)'}`,
              background: p.ok ? 'rgba(96,165,250,0.05)' : 'rgba(251,146,60,0.05)',
            }}>
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: p.ok ? 'rgba(96,165,250,0.6)' : 'rgba(251,146,60,0.6)' }} />
            <div>
              <div className="text-[11px] font-medium"
                style={{ color: p.ok ? 'rgba(147,197,253,0.8)' : 'rgba(253,186,116,0.8)' }}>{p.name}</div>
              <div className="text-[10px]" style={{ color: c.textMuted }}>{p.desc}</div>
            </div>
          </motion.div>
        ))}
        <div className="text-[9px] mt-2 tracking-wider text-center" style={{ color: c.textFaint }}>
          自動識別 11 種經典格局
        </div>
      </div>
    );
  }

  return null;
}

// ─── 主頁 ─────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = useColors(theme);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '28%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  // 把 body / html 背景同步到 home 主題色，消除半透明 nav 透出 #fafaf9 的色差
  // useLayoutEffect 保證在瀏覽器繪製前同步更新，避免與根 div 的 transition 不同步
  useLayoutEffect(() => {
    document.documentElement.style.background = c.bgBase;
    document.body.style.background = c.bgBase;
    return () => {
      document.documentElement.style.background = '';
      document.body.style.background = '';
    };
  }, [c.bgBase]);

  return (
    <div style={{ background: c.bgBase, transition: 'background 0.35s ease' }} className="overflow-x-hidden">
      {/* 致用戶公告——首次訪問全屏覆蓋，關閉後才進入首頁 */}
      <AnnouncementModal />

      <StarField />

      {/* 全域性光暈 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full"
          style={{ background: `radial-gradient(ellipse, ${c.glowTint} 0%, transparent 70%)` }} />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full"
          style={{ background: `radial-gradient(ellipse, ${c.glowBlue} 0%, transparent 70%)` }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full"
          style={{ background: `radial-gradient(ellipse, ${c.glowPurple} 0%, transparent 70%)` }} />
      </div>

      {/* ── 頂部導航 ── nav 與 hero 同色（c.bgBase），無 blur 無 border，徹底無色差帶 */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 gap-2"
        style={{
          background: c.navBg,
        }}>
        <div className="text-[11px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] font-medium transition-colors duration-300 flex-shrink-0"
          style={{ color: c.goldSolid }}>
          紫微命盤
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          <ThemeToggle />
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/heming')}
            className="text-[11px] sm:text-xs px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full transition-all duration-300"
            style={{ border: `1px solid ${c.navBorder}`, color: c.textMuted }}>
            合盤
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/chart')}
            className="text-[11px] sm:text-xs px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full transition-all duration-300"
            style={{ border: `1px solid ${c.goldLine}`, color: c.goldSolid }}>
            立即起盤
          </motion.button>
        </div>
      </nav>

      {/* ══ HERO ══════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[82svh] lg:min-h-[92vh] flex flex-col items-center justify-center px-6 z-10 pb-24 pt-10">
        <motion.div style={{ y: heroY, opacity: heroOpacity, maxWidth: '960px' }} className="text-center w-full mx-auto mt-10">
          {/* 標籤行 */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${c.goldLine})` }} />
            <span className="text-[11px] tracking-[0.45em] transition-colors duration-300" style={{ color: c.tagText }}>
              紫微斗數 · 倪海廈體系
            </span>
            <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${c.goldLine})` }} />
          </motion.div>

          {/* 主標題 */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ position: 'relative', display: 'inline-block' }}>
            <h1
              className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold leading-none mb-5`}
              style={{
                fontSize: 'clamp(56px, 10vw, 124px)',
                letterSpacing: '0.07em',
              }}>
              紫微命盤
            </h1>
          </motion.div>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="text-base md:text-lg tracking-[0.18em] mb-2"
            style={{ color: c.textSecond, fontWeight: 500 }}>
            紫微為門 · 天地人為路 · 倪海廈為師
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="text-xs md:text-sm tracking-[0.3em] mb-6"
            style={{ color: c.textMuted, opacity: 0.85 }}>
            AI 答疑 · 知行合一
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="text-sm max-w-xl mx-auto leading-relaxed mb-10"
            style={{ color: c.textMuted }}>
            輸入出生年月日時，生成專屬紫微斗數命盤 — 後續天紀、地紀、人紀學習模組陸續開放。
          </motion.p>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.85 }}
            className="flex flex-col items-center gap-4">
            <motion.button
              whileHover={{ y: -2, filter: 'brightness(1.06)' }} whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/chart')}
              className="px-12 py-4 font-semibold text-base tracking-widest rounded-full"
              style={{ background: c.ctaBg, color: c.ctaText }}>
              立即起盤
            </motion.button>
          </motion.div>

          {/* 十四主星 */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 1.05, duration: 0.8 }}
            className="mt-12 grid grid-cols-7 gap-1.5 max-w-[540px] mx-auto">
            {STARS.map((star, i) => (
              <motion.div key={star.name}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.05 + i * 0.03, duration: 0.35 }}
                className="flex items-center justify-center px-2 py-1 rounded-full"
                style={{ background: c.starBg, border: `1px solid ${c.starBorder}` }}>
                <span className="text-[11px] tracking-wide" style={{ color: c.starText }}>{star.name}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* 上線公告便利貼 — 桌面端絕對定位右側 */}
        <motion.div
          initial={{ opacity: 0, x: 30, rotate: 0 }}
          animate={{ opacity: 1, x: 0, rotate: -4 }}
          transition={{ delay: 1.4, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute hidden lg:block pointer-events-none"
          style={{
            right: 'clamp(2%, 6vw, 8%)',
            top: '54%',
            maxWidth: '240px',
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #fff5e3 0%, #ffe1c0 100%)',
            border: '2px dashed rgba(232,132,62,0.45)',
            borderRadius: '16px',
            padding: '14px 18px',
            boxShadow: '0 8px 24px rgba(196,90,45,0.18), 0 2px 6px rgba(196,90,45,0.1)',
            fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
          }}>
            <div style={{ fontSize: '20px', marginBottom: '6px', lineHeight: 1 }}>🎁</div>
            <div style={{ fontSize: '13px', lineHeight: 1.7, color: '#8b3a1a', fontWeight: 500 }}>
              <span style={{ color: '#c45a2d', fontWeight: 700, fontSize: '14px' }}>5/1 — 5/8</span>
              <span> 限時回饋</span>
            </div>
            <div style={{ fontSize: '13px', lineHeight: 1.7, color: '#8b3a1a', fontWeight: 500 }}>
              全部功能 + AI 提問
              <strong style={{ color: '#c45a2d' }}> 全免費</strong>
            </div>
          </div>
        </motion.div>

        {/* 上線公告便利貼 — 手機端正常流式顯示（hero 內容下方居中） */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, rotate: -2 }}
          transition={{ delay: 1.4, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="lg:hidden mx-auto mt-8 mb-2 pointer-events-none"
          style={{
            maxWidth: 'min(280px, 84vw)',
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #fff5e3 0%, #ffe1c0 100%)',
            border: '2px dashed rgba(232,132,62,0.45)',
            borderRadius: '14px',
            padding: '12px 16px',
            boxShadow: '0 6px 18px rgba(196,90,45,0.16), 0 2px 4px rgba(196,90,45,0.08)',
            fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '18px', marginBottom: '4px', lineHeight: 1 }}>🎁</div>
            <div style={{ fontSize: '12px', lineHeight: 1.7, color: '#8b3a1a', fontWeight: 500 }}>
              <span style={{ color: '#c45a2d', fontWeight: 700, fontSize: '13px' }}>5/1 — 5/8</span>
              <span> 限時回饋</span>
            </div>
            <div style={{ fontSize: '12px', lineHeight: 1.7, color: '#8b3a1a', fontWeight: 500 }}>
              全部功能 + AI <strong style={{ color: '#c45a2d' }}>全免費</strong>
            </div>
          </div>
        </motion.div>

        {/* 滾動提示（絕對定位，不影響 hero opacity 計算） */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none">
          <span className="text-[9px] tracking-[0.4em] uppercase" style={{ color: c.scrollText }}>探索更多</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="w-px h-8" style={{ background: `linear-gradient(to bottom, ${c.scrollLine}, transparent)` }} />
        </motion.div>
      </section>

      {/* ══ 哲學引言 ══════════════════════════════════════ */}
      <section className="relative z-10 overflow-hidden min-h-[82svh] lg:min-h-[92vh] flex items-center" style={{ padding: '72px 24px' }}>
        <WeakBoundary line={c.navBorder} />
        <div className="absolute inset-0"
          style={{
            background: theme === 'dark'
              ? 'linear-gradient(to bottom, #020810 0%, #020810 6%, #030a18 22%, #0d0820 40%, #0a0618 68%, #030a18 86%, #020810 100%)'
              : 'linear-gradient(to bottom, #f5efe0 0%, #f5efe0 6%, #c08055 18%, #6a2810 32%, #1e0a02 50%, #1e0a02 70%, #6a2810 84%, #f5efe0 100%)',
            transition: 'background 0.4s ease',
          }} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span className="font-bold" style={{ fontSize: 'clamp(220px, 38vw, 460px)', color: 'rgba(212,168,67,0.012)', lineHeight: 1, fontFamily: 'serif' }}>命</span>
        </div>
        <FadeIn className="relative mx-auto text-center w-full" y={20}>
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-16" style={{ background: 'linear-gradient(to right, transparent, rgba(212,168,67,0.45))' }} />
            <span className="text-[10px] tracking-[0.55em] uppercase" style={{ color: 'rgba(212,168,67,0.5)' }}>命 · 運 · 觀</span>
            <div className="h-px w-16" style={{ background: 'linear-gradient(to left, transparent, rgba(212,168,67,0.45))' }} />
          </div>
          <div className="space-y-3" style={{ maxWidth: '840px', margin: '0 auto' }}>
            {[
              { text: '提前窺探命運的意義', size: 'clamp(17px, 2.2vw, 28px)', color: 'rgba(215,228,252,0.72)', delay: 0.1 },
              { text: '不在於預知未來', size: 'clamp(21px, 2.6vw, 32px)', color: 'rgba(220,232,250,0.74)', delay: 0.25 },
              { text: '而在於不斷認識自己', size: 'clamp(24px, 3vw, 40px)', color: 'rgba(218,230,248,0.8)', delay: 0.34 },
            ].map((line, i) => (
              <motion.p key={i}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: line.delay }}
                className="tracking-wider" style={{ fontSize: line.size, color: line.color, fontWeight: 400 }}>
                {line.text}
              </motion.p>
            ))}
            <motion.p
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold`}
              style={{ fontSize: 'clamp(24px, 3.4vw, 48px)', letterSpacing: '0.05em', lineHeight: 1.35 }}>
              最終書寫屬於自己的人生劇本
            </motion.p>
          </div>
        </FadeIn>
      </section>

      {/* ══ 4 大學習板塊時間軸 ════════════════════════════ */}
      <section className="relative z-10 py-20 lg:py-24 px-6"
        style={{
          background: theme === 'dark'
            ? 'linear-gradient(to bottom, transparent 0%, rgba(184,146,42,0.03) 50%, transparent 100%)'
            : 'linear-gradient(to bottom, transparent 0%, rgba(184,146,42,0.04) 50%, transparent 100%)',
        }}>
        <FadeIn className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${c.goldLine})` }} />
            <span className="text-[10px] tracking-[0.4em] uppercase" style={{ color: c.goldSolid, opacity: 0.7 }}>Curriculum</span>
            <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${c.goldLine})` }} />
          </div>
          <div className="text-2xl lg:text-3xl font-bold mb-2 tracking-[0.15em]" style={{ color: c.textPrimary }}>
            倪師方法論 · 漸次展開
          </div>
          <div className="text-xs lg:text-sm tracking-[0.1em]" style={{ color: c.textMuted }}>
            從紫微入門，逐步開放天紀 / 地紀 / 人紀學習模組
          </div>
        </FadeIn>

        <div className="max-w-sm lg:max-w-5xl mx-auto relative">
          {/* 橫向連線線（僅桌面）*/}
          <div className="hidden lg:block absolute top-7 left-[12.5%] right-[12.5%] h-0.5"
            style={{
              background: `linear-gradient(90deg, ${c.goldSolid} 0%, ${c.goldSolid} 25%, ${c.goldLine} 25%)`,
              opacity: 0.6,
            }} />

          {/* 縱向連線線（僅手機）—— 圓點貼在線上，做"地鐵線路圖"風格 */}
          <div className="lg:hidden absolute left-7 top-7 bottom-7 w-px -translate-x-1/2"
            style={{
              background: `linear-gradient(180deg, ${c.goldSolid} 0%, ${c.goldSolid} 22%, ${c.goldLine} 22%)`,
              opacity: 0.6,
            }} />

          <div className="flex flex-col gap-5 lg:grid lg:grid-cols-4 lg:gap-4">
            {SECTIONS.map((s, i) => {
              const ready = s.status === 'ready';
              return (
                <motion.div key={s.key}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="relative flex flex-row lg:flex-col items-center lg:items-center text-left lg:text-center gap-4 lg:gap-0">
                  {/* 節點圓 */}
                  <div className="relative w-14 h-14 shrink-0 rounded-full flex items-center justify-center lg:mb-3"
                    style={{
                      background: ready
                        ? `linear-gradient(135deg, ${c.goldSolid} 0%, ${c.goldSolid}cc 100%)`
                        : (theme === 'dark' ? 'rgba(184,146,42,0.05)' : '#fdf8ee'),
                      border: ready ? 'none' : `2px dashed ${c.goldLine}`,
                      color: ready ? '#fff' : c.textMuted,
                      boxShadow: ready ? `0 4px 16px ${c.goldSolid}55` : 'none',
                    }}>
                    <span className="text-2xl">{s.icon}</span>
                    {ready && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white"
                        style={{ background: '#10b981', boxShadow: '0 2px 6px rgba(16,185,129,0.4)' }}>
                        ✓
                      </div>
                    )}
                  </div>
                  {/* 文字組：手機端右排單列；桌面端居中堆疊 */}
                  <div className="flex-1 lg:flex-none flex flex-col items-start lg:items-center min-w-0">
                    {/* 頂行：時間標籤 + 板塊名 + note（手機端 inline；桌面端依然分行） */}
                    <div className="flex items-baseline gap-2 lg:flex-col lg:gap-0 lg:mb-1">
                      <div className="text-[10px] tracking-[0.25em] lg:mb-1.5"
                        style={{ color: ready ? '#10b981' : c.textMuted, fontWeight: 500 }}>
                        {s.when}
                      </div>
                      <div className="text-base lg:text-xl font-semibold tracking-[0.15em]"
                        style={{ color: c.textPrimary }}>
                        {s.name}
                      </div>
                      {s.note && (
                        <div className="text-[9px] tracking-[0.15em] px-2 py-0.5 rounded-full lg:hidden"
                          style={{
                            color: c.goldSolid,
                            background: theme === 'dark' ? 'rgba(184,146,42,0.1)' : 'rgba(184,146,42,0.08)',
                            border: `1px solid ${c.goldLine}`,
                            opacity: 0.85,
                          }}>
                          {s.note}
                        </div>
                      )}
                    </div>
                    {/* 桌面專屬 note（手機已在頂行 inline 展示）*/}
                    {s.note && (
                      <div className="hidden lg:block text-[9px] tracking-[0.15em] mb-1.5 px-2 py-0.5 rounded-full"
                        style={{
                          color: c.goldSolid,
                          background: theme === 'dark' ? 'rgba(184,146,42,0.1)' : 'rgba(184,146,42,0.08)',
                          border: `1px solid ${c.goldLine}`,
                          opacity: 0.85,
                        }}>
                        {s.note}
                      </div>
                    )}
                    {/* 簡介 */}
                    <div className="text-[11px] lg:text-xs leading-relaxed lg:max-w-[200px] mt-0.5 lg:mt-0"
                      style={{ color: c.textSecond }}>
                      {s.desc}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ 功能詳解 ══════════════════════════════════════ */}
      <section className="relative z-10">
        {FEATURES.map((feature, i) => (
          <div key={i}
            className={`flex items-center px-6 md:px-10 lg:px-14 py-20 md:py-24 ${i <= 2 ? 'min-h-[82svh] lg:min-h-[92vh]' : ''}`}
            style={{ background: i % 2 === 1 ? c.altSection : 'transparent' }}>
            <div className="mx-auto w-full" style={{ maxWidth: '1280px' }}>
              <div className={`grid grid-cols-1 ${i % 2 === 0 ? 'lg:grid-cols-[0.45fr_0.55fr]' : 'lg:grid-cols-[0.55fr_0.45fr]'} gap-10 lg:gap-16 items-start ${i % 2 === 1 ? 'lg:grid-flow-dense' : ''}`}>
                {/* 文字區 */}
                <div className={i % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <FadeIn delay={0}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-px w-8" style={{ background: c.goldLine }} />
                      <span className="text-[10px] tracking-[0.5em] uppercase" style={{ color: c.tagText }}>{feature.tag}</span>
                    </div>
                  </FadeIn>
                  <FadeIn delay={0.1}>
                    <h2 className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold leading-tight mb-5 tracking-tight`}
                      style={{
                        fontSize: i < 2 ? 'clamp(36px, 4vw, 56px)' : 'clamp(30px, 3.5vw, 48px)',
                        whiteSpace: 'pre-line',
                      }}>
                      {feature.title}
                    </h2>
                  </FadeIn>
                  <FadeIn delay={0.2}>
                    <p className="text-base mb-8 leading-relaxed" style={{ color: c.textSecond }}>{feature.subtitle}</p>
                  </FadeIn>
                  <div className="space-y-4">
                    {feature.points.map((point, j) => (
                      <FadeIn key={j} delay={0.25 + j * 0.08}>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 mt-2 w-1 h-1 rounded-full" style={{ background: c.goldSolid, opacity: 0.6 }} />
                          <p className="text-sm leading-relaxed" style={{ color: c.textMuted }}>{point}</p>
                        </div>
                      </FadeIn>
                    ))}
                  </div>
                </div>
                {/* 視覺裝飾區 */}
                <div className={i % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}>
                  <FadeIn delay={0.15}>
                    <div className="relative rounded-2xl overflow-hidden p-8 md:p-12"
                      style={{
                        border: `1px solid ${c.featureBord}`,
                        background: c.featureBg,
                        minHeight: i <= 1 ? '540px' : i === 2 ? '460px' : '320px',
                        boxShadow: c.cardShadow,
                      }}>
                      <FeatureVisual index={i} colors={c} />
                    </div>
                  </FadeIn>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ══ 天·地·人 三分理論 ════════════════════════════ */}
      <section className="relative z-10 flex items-center px-6 md:px-10 lg:px-14 py-20"
        style={{ background: c.altSection, minHeight: '82svh' }}>
        <WeakBoundary line={c.navBorder} />
        <div className="mx-auto w-full" style={{ maxWidth: '1280px' }}>
          <FadeIn>
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${c.goldLine})` }} />
                <span className="text-[10px] tracking-[0.5em] uppercase" style={{ color: c.tagText }}>Ni Haixia · Philosophy</span>
                <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${c.goldLine})` }} />
              </div>
              <h2 className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold mb-5 tracking-tight`}
                style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}>
                天 · 地 · 人
              </h2>
              <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: c.textSecond }}>
                倪海廈老師的核心命運觀：命運從來不是人生的全部。<br />
                他將影響人生的力量分為三個同等重要的維度。
              </p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {[
              { glyph: '天', label: '先天命運', pct: '⅓', color: c.goldSolid, borderColor: c.goldLine, desc: '紫微斗數所揭示的，是一個人的先天命盤格局——出生時間決定的星曜佈局、五行局數、命宮主星。這只是命運的三分之一，是人生的底色，而非全貌。', sub: '命盤 · 星曜 · 五行' },
              { glyph: '地', label: '地理環境', pct: '⅓', color: 'rgba(96,165,250,0.9)', borderColor: 'rgba(96,165,250,0.3)', desc: '你所在的地理環境、城市、國家、風水格局，乃至家庭背景與社會結構，共同構成了命運的第二個維度。同一命盤，生在不同地方，際遇可以天壤之別。', sub: '地域 · 風水 · 環境' },
              { glyph: '人', label: '人心意念', pct: '⅓', color: 'rgba(100,216,139,0.9)', borderColor: 'rgba(100,216,139,0.3)', desc: '個人的意志、心態、選擇與行動，才是改變命運最主動的力量。倪師強調：瞭解命盤是為了更好地做人，而不是坐等命運安排。精進自己，是最強的破局之道。', sub: '意志 · 選擇 · 行動' },
            ].map((item, i) => (
              <FadeIn key={item.glyph} delay={0.1 + i * 0.12}>
                <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.1 }}
                  className="rounded-2xl p-7 h-full flex flex-col"
                  style={{ background: c.cardBg, border: `1px solid ${item.borderColor}`, boxShadow: c.cardShadow }}>
                  <div className="flex items-start justify-between mb-5">
                    <div className="text-5xl font-bold leading-none" style={{ color: item.color }}>{item.glyph}</div>
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: item.color }}>{item.pct}</div>
                      <div className="text-[9px] mt-0.5 tracking-widest" style={{ color: c.textMuted }}>of life</div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="text-sm font-medium mb-0.5" style={{ color: item.color }}>{item.label}</div>
                    <div className="text-[10px] tracking-wider" style={{ color: c.textMuted }}>{item.sub}</div>
                  </div>
                  <div className="h-px mb-4" style={{ background: item.borderColor }} />
                  <p className="text-xs leading-relaxed flex-1" style={{ color: c.textSecond }}>{item.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.3}>
            <div className="mt-10 text-center">
              <p className="text-sm leading-relaxed" style={{ color: c.textSecond }}>
                「命運不是人生的全部，加上地理位置和人念，才是。」
              </p>
              <p className="mt-2 text-[10px] tracking-widest" style={{ color: c.tagText }}>— 倪海廈</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══ 倪海廈介紹 ════════════════════════════════════ */}
      <section className="relative z-10 flex items-center px-6 md:px-10 lg:px-14 py-20" style={{ minHeight: '82svh' }}>
        <WeakBoundary line={c.navBorder} />
        <div className="mx-auto w-full" style={{ maxWidth: '1280px' }}>
          <FadeIn>
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${c.goldLine})` }} />
                <span className="text-[10px] tracking-[0.5em] uppercase" style={{ color: c.tagText }}>Master · 1953 – 2012</span>
                <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${c.goldLine})` }} />
              </div>
              <h2 className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold mb-6 tracking-tight`}
                style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}>
                倪海廈老師
              </h2>
              <p className="max-w-2xl mx-auto leading-relaxed text-sm" style={{ color: c.textSecond }}>
                當代華人圈最具影響力的中醫與術數大家之一<br />
                美國漢唐中醫學院創辦人 ·「人紀」「天紀」兩大教學體系傳世
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="rounded-2xl p-8 md:p-10 mb-8"
              style={{ border: `1px solid ${c.niBorder}`, background: c.niBg, boxShadow: c.cardShadow }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                  { label: '生於', value: '1954年', sub: '臺灣' },
                  { label: '離世', value: '2012年', sub: '1月31日 · 享年58' },
                  { label: '傳承', value: '紫微斗數', sub: '經方中醫 · 易經' },
                ].map(item => (
                  <div key={item.label} className="text-center rounded-xl px-4 py-3"
                    style={{ border: `1px solid ${c.niDivider}`, background: 'rgba(255,255,255,0.02)' }}>
                    <div className="text-[10px] tracking-[0.3em] mb-1" style={{ color: c.textFaint }}>{item.label}</div>
                    <div className="text-2xl font-semibold mb-0.5" style={{ color: c.goldSolid }}>{item.value}</div>
                    <div className="text-[11px]" style={{ color: c.textMuted }}>{item.sub}</div>
                  </div>
                ))}
              </div>
              <div className="h-px mb-8" style={{ background: c.niDivider }} />
              <div className="space-y-4 text-sm leading-relaxed max-w-3xl mx-auto" style={{ color: c.textSecond }}>
                <p>
                  <strong style={{ color: c.goldSolid }}>生平履歷</strong>：
                  倪海廈先生（1954–2012）出生於臺灣，早年師承多位中醫名家，專研經方派（《傷寒論》傳承）。
                  中年赴美行醫，在美國創立<strong>漢唐中醫學院</strong>，二十餘年間系統傳授中醫與傳統術數。
                  2012 年 1 月 31 日因肝癌在臺灣離世，享年 58 歲。
                </p>
                <p>
                  <strong style={{ color: c.goldSolid }}>教學體系</strong>：
                  倪師將畢生所學整理為兩大公開教學系列。
                  <strong>「人紀」</strong>涵蓋《針灸大成》《神農本草經》《黃帝內經》《傷寒論》《金匱要略》——
                  這是「人之紀」，奠定中醫學習的完整路徑；
                  <strong>「天紀」</strong>涵蓋紫微斗數與《易經》——這是「天之紀」，是術數研究的體系化成果。
                  兩者相合，是倪師留給後世最完整的傳承。
                </p>
                <p>
                  <strong style={{ color: c.goldSolid }}>紫微立場</strong>：
                  倪師在紫微斗數上明確屬<strong>南派三合派</strong>，主張「以命宮為本、以三方四正為用、以四化為綱」。
                  他在《天紀》課程中明言：「<em>飛星（四化）飛來飛去太複雜，不搞這個，畢竟大道至簡</em>」——
                  這一立場將其與繁瑣的飛星派清晰區分。
                </p>
                <p>
                  <strong style={{ color: c.goldSolid }}>治學態度</strong>：
                  倪師反對死記硬背口訣，強調「理解原理勝過背誦」「邏輯可複核勝過神秘玄學」。
                  這種態度讓紫微斗數從師徒密傳的封閉體系，走向系統化、可驗證、可學習的現代知識體系。
                </p>
                <p>
                  <strong style={{ color: c.goldSolid }}>當代影響</strong>：
                  倪師的講課影片在 B 站、YouTube 與各大平臺廣泛流傳，是新一代命理與中醫愛好者公認的入門必修。
                  他不僅是紫微斗數的傳承者，更是把傳統命理與中醫帶入現代知識體系的關鍵人物之一。
                </p>
                <p style={{ fontSize: '11px', color: c.textMuted, fontStyle: 'italic', marginTop: '12px' }}>
                  本平臺所有解讀基於倪師《天紀》公開教學講義、《紫微斗數全書》明版、傳統三合派古籍整理而成，
                  僅作文化與個人成長參考。倪師本人與本平臺無任何商業關聯。
                </p>
              </div>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {NI_TEACHINGS.map((teaching, i) => (
              <FadeIn key={i} delay={0.1 + i * 0.08}>
                <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.1 }}
                  className="rounded-xl p-6 h-full"
                  style={{ border: `1px solid ${c.niCardBord}`, background: c.niCardBg, boxShadow: c.niCardShadow }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center mt-0.5"
                      style={{ borderColor: c.goldLine }}>
                      <span className="text-[9px]" style={{ color: c.goldSolid }}>{i + 1}</span>
                    </div>
                    <h3 className="text-sm font-medium leading-relaxed" style={{ color: c.goldSolid }}>{teaching.title}</h3>
                  </div>
                  <p className="text-xs leading-relaxed pl-8" style={{ color: c.textSecond }}>{teaching.body}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 合盤入口 ══════════════════════════════════════ */}
      <section className="relative z-10 px-6 md:px-10 lg:px-14 py-20">
        <div className="mx-auto" style={{ maxWidth: '1280px' }}>
          <div className="rounded-2xl p-10 md:p-14 text-center"
            style={{
              background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
              border: `1px solid ${c.cardBorder}`,
              boxShadow: c.cardShadow,
            }}>
            <FadeIn>
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-px w-8" style={{ background: c.goldLine }} />
                <span className="text-[10px] tracking-[0.5em] uppercase" style={{ color: c.tagText }}>Compatibility · Analysis</span>
                <div className="h-px w-8" style={{ background: c.goldLine }} />
              </div>
              <h2 className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold mb-4 tracking-tight`}
                style={{ fontSize: 'clamp(26px, 3.5vw, 40px)' }}>
                紫微合盤
              </h2>
              <p className="text-sm leading-relaxed mb-8 max-w-lg mx-auto" style={{ color: c.textSecond }}>
                輸入兩個人的出生資訊，AI 基於倪海廈體系分析夫妻宮互參、命宮相容性與三方四正互動，<br className="hidden md:block" />
                給出感情匹配度、合夥可行性與最佳相處建議。
              </p>
              <div className="flex justify-center gap-3 flex-wrap mb-6">
                {['感情匹配度分析', '合夥創業評估', '親子緣分解讀', '婚前相性評估'].map(item => (
                  <span key={item} style={{
                    fontSize: '12px', padding: '5px 14px', borderRadius: '20px',
                    background: theme === 'dark' ? 'rgba(212,168,67,0.08)' : 'rgba(212,168,67,0.12)',
                    border: `1px solid ${c.goldLine}`,
                    color: c.goldSolid,
                  }}>
                    {item}
                  </span>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/heming')}
                className="px-10 py-3 font-medium text-sm tracking-widest rounded-full"
                style={{
                  background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(140,100,20,0.1)',
                  border: `1px solid ${c.goldLine}`,
                  color: c.goldSolid,
                  cursor: 'pointer',
                }}>
                開始合盤分析
              </motion.button>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══ 最終 CTA ══════════════════════════════════════ */}
      <section className="relative z-10 py-40 px-6 text-center" style={{ background: c.altSection }}>
        <FadeIn>
          <p className="text-[10px] tracking-[0.6em] uppercase mb-6" style={{ color: c.tagText }}>開始你的命盤之旅</p>
          <h2 className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold mb-8 tracking-tight leading-tight`}
            style={{ fontSize: 'clamp(32px, 5vw, 60px)' }}>
            你的紫微命盤<br />等你解讀
          </h2>
          <p className="text-sm mb-10 max-w-md mx-auto leading-relaxed" style={{ color: c.textSecond }}>
            輸入出生年月日時，在幾秒內生成你的專屬命盤<br />
            再由 AI 按倪海廈體系為你深度解讀
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/chart')}
            className="px-14 py-4 font-semibold text-base tracking-widest rounded-full"
            style={{ background: c.ctaBg, color: c.ctaText }}>
            免費起盤
          </motion.button>
          <div className="mt-4 flex flex-wrap gap-3 justify-center">
            <motion.a
              href="/knowledge"
              whileHover={{ scale: 1.02 }}
              className="text-xs tracking-[0.2em] inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                color: c.goldSolid,
                border: `1px solid ${c.goldLine}`,
                background: 'transparent',
                textDecoration: 'none',
              }}>
              ✦ 紫微斗數知識庫 →
            </motion.a>
            <motion.a
              href="/library"
              whileHover={{ scale: 1.02 }}
              className="text-xs tracking-[0.2em] inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                color: c.goldSolid,
                border: `1px solid ${c.goldLine}`,
                background: 'transparent',
                textDecoration: 'none',
              }}>
              📜 古籍原典庫 →
            </motion.a>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-10 px-6"
        style={{ borderTop: `1px solid ${c.niCardBord}` }}>

        {/* 4 板塊導航佔位（已上線 + 即將開放）*/}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="text-[9px] tracking-[0.3em] text-center mb-4 uppercase"
            style={{ color: c.textMuted, opacity: 0.6 }}>
            倪師方法論 · 學術體系
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {SECTIONS.map(s => {
              const ready = s.status === 'ready';
              return (
                <a
                  key={s.key}
                  href={ready ? '/chart' : undefined}
                  onClick={ready ? undefined : (e) => e.preventDefault()}
                  className="rounded-lg px-3 py-3 text-center transition-all"
                  style={{
                    background: ready ? c.starBg : 'transparent',
                    border: `1px ${ready ? 'solid' : 'dashed'} ${ready ? c.goldLine : c.navBorder}`,
                    cursor: ready ? 'pointer' : 'not-allowed',
                    opacity: ready ? 1 : 0.5,
                    textDecoration: 'none',
                  }}
                >
                  <div className="text-base font-semibold mb-0.5 tracking-[0.1em]"
                    style={{ color: ready ? c.goldSolid : c.textMuted }}>
                    {s.name}
                  </div>
                  <div className="text-[9px] tracking-wider"
                    style={{ color: ready ? '#10b981' : c.textMuted }}>
                    {ready ? '✓ 已上線' : `${s.when} 開放`}
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        <div className="text-center">
          <p className="text-[10px] tracking-wider mb-3" style={{ color: c.footerText }}>
            紫微命盤 · 基於倪海廈正宗體系 · 僅供參考，命運掌握在自己手中
          </p>
          <p className="text-[10px] tracking-wider mb-3 max-w-2xl mx-auto leading-relaxed"
            style={{ color: c.footerText, opacity: 0.85 }}>
            本平臺基於中國傳統文化研究，僅提供學習參考。<br className="sm:hidden" />
            不構成任何醫療、投資、法律或重大決策建議。
          </p>
          <p className="text-[10px] tracking-wider" style={{ color: c.footerText }}>
            <a href="/terms" style={{ color: c.footerText, textDecoration: 'underline' }}>服務條款</a>
            {' · '}
            <a href="/privacy" style={{ color: c.footerText, textDecoration: 'underline' }}>隱私政策</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
