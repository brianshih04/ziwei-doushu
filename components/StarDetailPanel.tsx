'use client';
import { motion, AnimatePresence } from 'framer-motion';
import type { Star } from '@/lib/ziwei/types';
import { STAR_DESCRIPTIONS } from '@/lib/ziwei/constants';

interface StarDetailPanelProps {
  star: Star | null;
  palaceName?: string;
  onClose: () => void;
}

// 倪海廈體系各星詳細解讀（參考顧祥弘《飛星紫微斗數全書》及南北山人《紫微斗數全書》）
const STAR_DETAIL: Record<string, {
  niHaixia: string;
  classical: string;
  bestPalace: string;
  worstPalace: string;
  career: string;
  relationship: string;
  wealth: string;
  health: string;
}> = {
  '紫微': {
    niHaixia: '倪師認為紫微是皇帝星，坐命宮者有孤傲之氣，喜獨處，不喜被人管轄。紫微需要左輔右弼相夾才能發揮帝王氣質，否則只是孤君，富而不貴。紫微在辰戌宮最佳，與天府形成雙星格局，財官雙美，可出將入相。紫微最怕火星、鈴星、擎羊、陀羅同宮，加煞則孤貴，有權而無財。',
    classical: '古訣：「紫微帝座臨命主尊貴，統領眾星，坐命者主權威顯達。」南北山人注：「紫微守命於辰位，財官雙美，出將入相，位至三公；子宮安命者，富貴不耐久，日後不美。」',
    bestPalace: '命宮（辰戌）、官祿宮',
    worstPalace: '疾厄宮、夫妻宮',
    career: '政界、管理層、獨立創業，天生帝王氣質，適合獨當一面的領導崗位',
    relationship: '感情被動，自尊心強，需對方主動，有孤獨傾向，晚婚則吉',
    wealth: '財運穩定，守成強於進取，辰戌位財官雙美，最宜積累型投資',
    health: '土屬性，注意脾胃、消化系統。忌過勞，宜保持規律作息',
  },
  '天機': {
    niHaixia: '倪師說天機是參謀星，最聰明的星，但聰明外漏則傷身。天機化忌最麻煩，代表聰明反被聰明誤。天機屬木，善變靈動，在命宮者思維敏捷，但往往多謀少決，需離開故鄉遠行才能發展，應事機變、隨機應變是其最大特質。',
    classical: '古訣：「為人生精滑，自好作經營，天機星屬木，商買皆多機見，離宗必遠親，機謀必遠離親。」南北山人注：「天機居廟旺地，主人生精明，善策劃；居陷地則暗淡，人人皆從商為業。」',
    bestPalace: '命宮（卯位）、官祿宮',
    worstPalace: '夫妻宮',
    career: '技術專家、謀士、研究員、IT、策劃，動腦勝於動手，適合離鄉發展',
    relationship: '感情多變，想法太多，難以專一，宜晚婚，婚後需學會放下思慮',
    wealth: '靠智慧與技能賺錢，不擅守財，以專業技術為業則財運穩定',
    health: '木屬性，注意肝膽、神經系統。心思過重易失眠，宜練習靜心冥想',
  },
  '太陽': {
    niHaixia: '倪師認為太陽是大男人主義的星，在卯至午位入廟，光明正大；午後漸落陷。太陽坐命的人慷慨好面子，男命宜，女命太強勢。太陽代表父親與長輩，在命宮主人性格外向開朗，喜被眾人看見，最宜公職或公眾事業。落陷者先勤後懶，孤寡勞碌。',
    classical: '古訣：「太陽居午為入廟，光輝大放，主貴顯，男命最佳；落陷則孤寡勞碌，先勤後懶。」南北山人注：「太陽在午宮守命，財官雙美，出將入相；辰位安命，中年財官變美，乙年生人遇兇亦大利。」',
    bestPalace: '命宮（卯至午）、官祿宮',
    worstPalace: '夫妻宮（女命）、疾厄宮',
    career: '公職、政界、管理、公關、教育、傳媒，喜歡站在眾人面前，適合公眾事業',
    relationship: '男命緣佳但花心，女命獨立強勢，婚姻需磨合，宜找溫柔體貼的伴侶',
    wealth: '財運靠努力，慷慨好施，不擅積累；入廟財運旺，落陷財運起伏',
    health: '火屬性，注意心臟、眼睛。落陷位時易過勞，需注意充分休息',
  },
  '武曲': {
    niHaixia: '倪師視武曲為財帛主星，剛硬不屈，最怕孤克。武曲坐命的人意志堅定，適合金融、理財，但感情上太直，容易傷人。武曲化忌要小心意外血光。武曲在辰戌丑未得旺地，與七殺同宮可成將財格，是極佳的財富格局。',
    classical: '古訣：「武曲屬金，剛強之性，一生多刑剋；守命於旺地，出將入相。」南北山人注：「武曲守命，三方四正俱吉，財官雙美，武職加輔弼昌曲，亦主大貴；與七殺同宮，為將財格，主大富。」',
    bestPalace: '命宮（辰戌丑未）、財帛宮、官祿宮',
    worstPalace: '夫妻宮',
    career: '金融、軍警、會計、工程，執行力極強，適合需要魄力與決斷力的領域',
    relationship: '感情直來直往，缺乏情趣，需要溫柔伴侶互補，忌感情孤克',
    wealth: '財星本命，財運極強，理財能力超群，辰戌位財官雙美',
    health: '金屬性，注意肺部、呼吸系統、牙齒。化忌時需防意外血光之災',
  },
  '天同': {
    niHaixia: '倪師說天同是福星，最懶的星。天同坐命喜享福，不愛競爭，適合穩定工作。天同與天梁同宮最好，可以享福又有保障。天同化祿是最美的化祿，主一生衣食無憂，快樂悠遊。天同忌落陷，落陷則福減，需與兇星化解。',
    classical: '古訣：「天同為福德之星，坐命者享福有餘，主一生逍遙自在，不必勞苦。」南北山人注：「天同守命，三方無煞，一生快樂，衣食豐足；加吉星則富貴雙全，為人溫和，多人緣。」',
    bestPalace: '命宮、福德宮',
    worstPalace: '官祿宮',
    career: '服務業、娛樂、餐飲、文藝，輕鬆愉快的環境最適合，忌高壓競爭',
    relationship: '感情溫和，不主動，容易被動接受，婚姻較穩定，性格隨和可親',
    wealth: '財運不突出，靠穩定薪資，不擅投機，衣食無憂但難大富',
    health: '水屬性，注意腎臟、膀胱。體質較弱，宜適度運動，保持輕鬆心態',
  },
  '廉貞': {
    niHaixia: '倪師認為廉貞是次桃花，才華橫溢但感情複雜。廉貞化忌非常兇，代表官司、牢獄、意外。廉貞與天相同宮則化兇為吉，成為行政印綬之格。廉貞五行屬火，性格剛烈，一生多起伏，才藝出眾，若能守正不邪，可成大器。',
    classical: '古訣：「廉貞為次桃花，才華橫溢，感情多波折；廉相同宮，化兇為吉，成行政印綬格，可掌權柄。」南北山人注：「廉貞守命，見吉星則才華出眾，化忌則官司纏身，主血光之災，須防。」',
    bestPalace: '官祿宮（配天相）、命宮（化祿時）',
    worstPalace: '命宮（化忌時）、夫妻宮',
    career: '藝術、娛樂、法律、公職（配天相），才藝出眾，宜守正業方能長久',
    relationship: '桃花多，感情複雜，容易遭遇感情糾紛，宜晚婚，選擇穩重伴侶',
    wealth: '財運起伏，靠才藝謀財，化忌時防財務糾紛與法律風險',
    health: '火屬性，注意心臟、血液、肝臟。化忌時防意外與手術，留意血光',
  },
  '天府': {
    niHaixia: '倪師說天府是財庫星，守成之星，不主動發財但能守住財富。天府坐命者穩重保守，女命最佳，能旺夫興家。天府最喜紫微同宮或對照，形成雙星格局，財官雙美。天府怕空劫夾，見空劫則財庫見底，守不住財。',
    classical: '古訣：「天府為財庫之星，守命者穩重保守，主積財旺家；女命逢之，能旺夫益子，家道興隆。」南北山人注：「天府守命，三方吉聚，財官雙美，富貴安康；遇空劫，則財庫破漏，難以積財。」',
    bestPalace: '命宮、財帛宮、田宅宮',
    worstPalace: '遷移宮',
    career: '行政管理、財務、保險、房地產，求穩不冒險，適合守成型職業',
    relationship: '感情穩定，顧家，是好的伴侶，注重家庭安全感與經濟保障',
    wealth: '財運極佳，守財能力強，最適合積累型投資與不動產置業',
    health: '土屬性，注意脾胃、消化。體質穩健，宜保持規律飲食與生活',
  },
  '太陰': {
    niHaixia: '倪師認為太陰是財星，利女命，也是男命母親和妻子的代表星。太陰入廟則財運極佳，陷地則財運受阻。太陰化忌要注意女性親人的問題。太陰在亥子位入廟，光輝全照，代表優雅細膩，感情豐富，重視內心世界與精神生活。',
    classical: '古訣：「太陰為財星，利女命；亥子入廟，光輝全照，財運極旺；午位落陷，憂鬱多情，財運平淡。」南北山人注：「太陰守命，入廟者財富優厚，女命尤佳；落陷者需努力方能致富，情感細膩。」',
    bestPalace: '命宮（亥子）、財帛宮',
    worstPalace: '命宮（午位陷地）',
    career: '財務、金融、房地產、藝術、教育，細膩耐心，適合需要美感與溫柔的職業',
    relationship: '感情溫柔細膩，重視內心感受，需要有安全感的穩定關係',
    wealth: '入廟財運極旺，落陷則需努力；理財細心，善於積累，不擅冒險',
    health: '水屬性，注意腎臟、子宮（女命）。情緒波動影響健康，宜保持心情舒暢',
  },
  '貪狼': {
    niHaixia: '倪師說貪狼是最多才多藝的星，桃花最重。貪狼化祿入命則魅力四射，人見人愛。貪狼屬晚發之星，中年後才能真正發達。貪狼在寅申位入廟最佳，桃花旺盛，才藝超群；化祿後財運大發，但若遇空劫則一生多波折，難聚財。',
    classical: '古訣：「貪狼發福亨通，多才多藝，桃花最重；然難過三十歲，晚發者眾。落陷遇煞反吉，此係貪狼落陷之理。」南北山人注：「貪狼守命，遇吉則福祿多壽，發福亨通；但久後不得善終，故宜修身養德，方可善終。」',
    bestPalace: '命宮（化祿）、福德宮、遷移宮',
    worstPalace: '疾厄宮',
    career: '藝術、娛樂、公關、銷售、風水五術，靠人脈與才藝，多才多藝型',
    relationship: '桃花極旺，感情多元化，宜晚婚，婚後需剋制桃花方能白首偕老',
    wealth: '靠人脈和才藝賺錢，財運中晚年才穩，化祿後財源廣進，早年宜穩守',
    health: '木屬性（含水），注意肝臟、腎臟。桃花過旺易耗損精力，宜節制調養',
  },
  '巨門': {
    niHaixia: '倪師認為巨門是口舌是非星，但化祿化權後轉吉，變成靠口才賺錢的格局。巨門坐命多疑，善辯，適合律師、教師、銷售。巨門最忌化忌，主口舌是非不斷，甚至引發訴訟。巨門在子午位較佳，口才好，主以言語立身。',
    classical: '古訣：「巨門為暗曜，主口舌是非；化祿權則轉為以口才謀生，主富貴。」南北山人注：「巨門守命，逢化祿權，以口舌為業者大吉；化忌則口舌連累，官司纏身，需謹慎言語。」',
    bestPalace: '官祿宮（化祿權）、命宮（子午）',
    worstPalace: '夫妻宮、疾厄宮（化忌）',
    career: '律師、教師、銷售、主持人、談判專家，口才是核心競爭力',
    relationship: '多疑多慮，容易想太多，溝通是婚姻關鍵，需選有耐心的伴侶',
    wealth: '靠口才和專業技能賺錢，化祿後財運較佳，化忌防財務糾紛口舌連累',
    health: '水屬性，注意腎臟、耳朵、口腔。多思多慮易傷身，宜學習放鬆減壓',
  },
  '天相': {
    niHaixia: '倪師說天相是印綬星，負責行政庶務。天相坐命者中規中矩，適合公職行政。天相最需要有強星相配才能發揮，單獨坐命較平淡。天相最喜廉貞相伴，形成廉相格，可主行政大權；最怕破軍同宮，形成刑忌夾印格，主兇險。',
    classical: '古訣：「天相為印綬之星，主行政庶務；廉相同宮，化兇為吉，掌行政大權。」南北山人注：「天相守命，中規中矩，適合公職；得廉貞相配，可成國家棟梁；破軍同守，則刑剋難免。」',
    bestPalace: '官祿宮、命宮（配廉貞）',
    worstPalace: '財帛宮、命宮（配破軍則刑忌夾印）',
    career: '公職、行政管理、秘書、助理，擅長輔助支援型角色，需要強星引路',
    relationship: '感情穩定，忠厚老實，是好的伴侶，但需要對方主導方向',
    wealth: '財運平穩，靠薪資積累，不適合冒險投資，守成型理財最宜',
    health: '水屬性，注意腎臟、淋巴系統。體質中等，宜保持規律生活習慣',
  },
  '天梁': {
    niHaixia: '倪師認為天梁是蔭星，能保護別人，也代表醫藥宗教。天梁坐命者有長輩緣，早年多磨難，晚年享福。天梁最怕化忌，代表長輩或健康有問題。天梁與太陽同宮最佳，日月並明，貴人庇廕，一生有貴人相助，終得平安。',
    classical: '古訣：「天梁為蔭星，主庇廕保護；坐命者有長輩緣，早年受磨練，晚年享清福。」南北山人注：「天梁守命，須逢吉星方能發達；遇太陽同宮，日月並明，主貴顯，一生多貴人相助。」',
    bestPalace: '命宮、父母宮、福德宮',
    worstPalace: '命宮（化忌時）、財帛宮',
    career: '醫療、宗教、法律、社工、慈善，喜幫助別人，有廕庇眾人之心',
    relationship: '感情多與年齡差距較大者，或緣分晚來，需等待耐心方得良緣',
    wealth: '財運靠貴人相助，早年財運不佳，晚年財運才穩固，宜守不宜衝',
    health: '土屬性，注意脾胃、骨骼。需重視老年健康保健，宜早做預防調養',
  },
  '七殺': {
    niHaixia: '倪師說七殺是將軍星，果決衝勁強，但有孤克之性。七殺坐命必須有輔星化解孤性，否則六親緣薄。七殺與武曲同宮是將財格，極佳。七殺最怕竹羅三限（羊陀火鈴齊照），主大凶，須防意外。七殺化祿後反為吉，可成大將之材。',
    classical: '古訣：「七殺為將軍之星，果決衝勁強；守命者孤克性重，六親緣薄。」南北山人注：「七殺守命，三合吉聚則大貴；遇竹羅三限（羊陀火鈴），主大凶，防意外之災，防刑剋。」',
    bestPalace: '命宮（有輔星）、官祿宮',
    worstPalace: '夫妻宮、父母宮',
    career: '軍警、創業、金融交易、獨當一面的領域，需要快速決斷與魄力',
    relationship: '感情孤克，難找合適伴侶，需要能包容強勢個性的物件，宜晚婚',
    wealth: '財運波動大，有機會大富，也有大起大落；武曲同宮可成將財格大貴',
    health: '金屬性，注意肺部、大腸。性情急躁易傷身，宜學習控制情緒與修身',
  },
  '破軍': {
    niHaixia: '倪師說破軍是最能破舊立新的星，也是最孤克的星之一。破軍化祿後才變好，代表能破而後立。破軍坐命六親緣薄，但開創能力極強。破軍最適合改革、創新；化祿時財運轉旺，一破一立，終能成就事業。',
    classical: '古訣：「破軍為最能破舊立新之星，坐命者孤克，六親緣薄，然開創能力超強；化祿後破而後立，可成大業。」南北山人注：「破軍守命，一生多波折；化祿者，破財之後方能重建，財運終歸好轉，主晚年成就。」',
    bestPalace: '官祿宮（化祿）、遷移宮',
    worstPalace: '夫妻宮、父母宮',
    career: '開創型事業、軍警、改革、變革管理，適合不斷開拓新領域的先驅型工作',
    relationship: '感情多波折，離合不定，六親緣薄，需選擇獨立且包容力強的伴侶',
    wealth: '財運起伏大，化祿後財運轉好；守成則財退，需不斷開創新局才能積財',
    health: '水屬性，注意腎臟、膀胱、生殖系統。體質起伏，宜保持規律運動習慣',
  },
};

const levelConfig = {
  major: { label: '主星', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  lucky: { label: '吉星', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' },
  sha:   { label: '煞星', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  minor: { label: '雜星', color: 'text-slate-400 border-slate-500/25 bg-slate-500/10' },
};

const siHuaColors: Record<string, string> = {
  '祿': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  '權': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  '科': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  '忌': 'text-red-400 bg-red-500/10 border-red-500/30',
};

export default function StarDetailPanel({ star, palaceName, onClose }: StarDetailPanelProps) {
  const desc = star ? STAR_DESCRIPTIONS[star.name] : null;
  const detail = star ? STAR_DETAIL[star.name] : null;
  const typeConfig = star ? levelConfig[star.type] : null;

  return (
    <AnimatePresence>
      {star && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
          className="card-glass rounded-xl overflow-hidden"
        >
          {/* 標題欄 */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--t-border)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold" style={{ color: 'var(--t-gold)' }}>{star.name}</span>
              {typeConfig && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${typeConfig.color}`}>
                  {typeConfig.label}
                </span>
              )}
              {star.siHua && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${siHuaColors[star.siHua] || ''}`}>
                  化{star.siHua}
                </span>
              )}
            </div>
            <button onClick={onClose} className="transition-colors text-lg leading-none" style={{ color: 'var(--t-faint)' }}>×</button>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto max-h-[560px]">
            {/* 基本資訊 */}
            {desc && (
              <div className="flex flex-wrap gap-1.5">
                {[
                  `五行 · ${desc.element}`,
                  `性質 · ${desc.nature}`,
                  ...(palaceName ? [`位置 · ${palaceName}`] : []),
                  ...(star.brightness ? [star.brightness === 'bright' ? '廟旺' : star.brightness === 'dim' ? '落陷' : '平和'] : []),
                ].map(tag => (
                  <div key={tag} className="text-[10px] px-2 py-1 rounded-full"
                    style={{
                      border: '1px solid var(--t-border)',
                      color: tag.includes('廟旺') ? '#eab308' : tag.includes('落陷') ? '#ef4444' : 'var(--t-text2)',
                    }}>
                    {tag}
                  </div>
                ))}
              </div>
            )}

            {/* 關鍵詞 */}
            {desc && (
              <div>
                <div className="text-[10px] tracking-widest mb-1.5" style={{ color: 'var(--t-faint)' }}>星曜特質</div>
                <div className="flex flex-wrap gap-1.5">
                  {desc.keywords.split('·').map(k => (
                    <span key={k} className="text-[11px] px-2 py-0.5 rounded-full"
                      style={{ color: 'var(--t-gold)', border: '1px solid rgba(212,168,67,0.2)', background: 'rgba(212,168,67,0.06)' }}>
                      {k.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 古書原文 */}
            {detail && (
              <div className="rounded-xl p-3" style={{ background: 'rgba(212,168,67,0.04)', border: '1px solid rgba(212,168,67,0.12)' }}>
                <div className="text-[10px] tracking-widest mb-1.5 flex items-center gap-1" style={{ color: 'var(--t-gold)', opacity: 0.7 }}>
                  古書原文
                </div>
                <p className="text-[11px] leading-relaxed italic" style={{ color: 'var(--t-gold)', opacity: 0.8 }}>{detail.classical}</p>
              </div>
            )}

            {/* 倪海廈解讀 */}
            {detail && (
              <>
                <div>
                  <div className="text-[10px] tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--t-faint)' }}>
                    <span className="w-3 h-px inline-block" style={{ background: 'var(--t-border-acc)' }} />
                    倪海廈老師解讀
                    <span className="w-3 h-px inline-block" style={{ background: 'var(--t-border-acc)' }} />
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--t-text2)' }}>{detail.niHaixia}</p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: '事業方向', value: detail.career, icon: '◈' },
                    { label: '感情特質', value: detail.relationship, icon: '♡' },
                    { label: '財運分析', value: detail.wealth, icon: '◆' },
                    { label: '健康提示', value: detail.health, icon: '☯' },
                  ].map(item => (
                    <div key={item.label} className="card-inner rounded-lg p-3">
                      <div className="text-[10px] mb-1 flex items-center gap-1" style={{ color: 'var(--t-faint)' }}>
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--t-text2)' }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-[10px] p-2.5 rounded-lg" style={{ border: '1px solid rgba(74,222,128,0.15)', background: 'rgba(74,222,128,0.05)' }}>
                    <div className="text-emerald-500 mb-0.5 font-medium">最佳宮位</div>
                    <div className="text-emerald-500/70">{detail.bestPalace}</div>
                  </div>
                  <div className="text-[10px] p-2.5 rounded-lg" style={{ border: '1px solid rgba(248,113,113,0.15)', background: 'rgba(248,113,113,0.05)' }}>
                    <div className="text-red-500 mb-0.5 font-medium">注意宮位</div>
                    <div className="text-red-500/70">{detail.worstPalace}</div>
                  </div>
                </div>
              </>
            )}

            {/* 輔星/煞星說明 */}
            {!detail && star.type !== 'major' && (
              <div className="text-xs leading-relaxed" style={{ color: 'var(--t-text2)' }}>
                {star.type === 'lucky' && (
                  <>
                    {star.name === '文昌' && '文昌入宮，主學業考試順利，文書印鑑有利，宜從事文字相關工作。古訣：「文昌科甲，主文章顯達，逢考必第。」'}
                    {star.name === '文曲' && '文曲入宮，主才藝出眾，口才佳，善於表達，藝術天賦強。古訣：「文曲為才藝之星，能文能武，口才勝人。」'}
                    {star.name === '左輔' && '左輔入宮，主貴人相助，有人提攜，該宮位事項受到善意支援。古訣：「左輔為助力之星，坐命則貴人多，逢凶化吉。」'}
                    {star.name === '右弼' && '右弼入宮，主貴人相助，多出女性貴人，該宮位事項有人協助。古訣：「右弼為陰助之星，多女性貴人，化險為夷。」'}
                    {star.name === '天魁' && '天魁入宮，主白天出生的貴人，男性貴人多，逢凶化吉之力。古訣：「天魁為天乙貴人，逢之必有貴人扶持。」'}
                    {star.name === '天鉞' && '天鉞入宮，主夜晚出生的貴人，女性貴人多，增添吉祥之氣。古訣：「天鉞為玉堂貴人，主陰助，女貴人多。」'}
                    {star.name === '祿存' && '祿存入宮，主財祿守成，該宮位有財氣，但屬於保守型財運。古訣：「祿存為財祿之星，主守財有餘，進財穩健。」'}
                    {star.name === '天馬' && '天馬入宮，主奔波動盪，動中求財，宜主動出擊，不宜守株待兔。古訣：「天馬主動，逢祿則財祿雙全，動中生財。」'}
                  </>
                )}
                {star.type === 'sha' && (
                  <>
                    {star.name === '地空' && '地空入宮，主該宮位事項有落空感，精神耗散，宜注意心理健康。古訣：「地空主虛耗，入命宮者多精神迷茫，須防空想。」'}
                    {star.name === '地劫' && '地劫入宮，主該宮位事項有意外損失，財物需謹慎，防小人。古訣：「地劫主劫財，入命宮者財運受損，防意外之失。」'}
                    {star.name === '火星' && '火星入宮，主該宮位事項急躁衝動，情緒波動，但若遇貪狼則反吉。古訣：「火星主急燥，然遇貪狼同宮，反為火貪格，主暴發。」'}
                    {star.name === '鈴星' && '鈴星入宮，主該宮位事項有暗中阻礙，防背後小人，凡事宜低調。古訣：「鈴星主暗煞，入命者多暗中受敵，須防背後是非。」'}
                    {star.name === '擎羊' && '擎羊入宮，主刑剋，該宮位事項多波折，有血光之災或意外。古訣：「擎羊為刑剋之星，入命宮者多刑剋，須防意外血光。」'}
                    {star.name === '陀羅' && '陀羅入宮，主是非纏身，該宮位事項拖延不決，凡事宜早做準備。古訣：「陀羅主是非拖延，入命宮者做事遲緩，須防糾纏不清。」'}
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
