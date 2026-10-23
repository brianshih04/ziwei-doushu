/**
 * 倪海廈 天紀 / 地紀 / 人紀 — 統一匯出
 *
 * 倪海廈（1954-2012），美國漢唐中醫學院創辦人，
 * 當代少見的「命、相、卜、山、醫」五術兼備之曠世奇人。
 *
 * 三紀體系：
 *   天紀 —— 上知天文（紫微斗數、易經、堪輿、推命、面相、測字）
 *   地紀 —— 下知地理（國家地理志、風水與國運）
 *   人紀 —— 中知人事（針灸、黃帝內經、神農本草經、傷寒論、金匱要略）
 */

export * from './types';
export { TIANJI_MODULES, HEXAGRAMS, FENGSHUI_ENTRIES, TIANJI_EPISODES, TIANJI_QUOTES, TIANJI_STATS } from './tianji';
export { RENJI_MODULES, ACU_EXPERIENCES, TRANS_NEEDLING, HANTANG_FORMULAS, CLASSIC_FORMULAS, RENJI_STATS } from './renji';
export { DIJI_MODULES, DIJI_STATS } from './diji';

/** 倪海廈完整傳記 */
export const NI_HAIXIA_BIO = {
  name: '倪海廈',
  nameVariant: '倪海夏',
  alias: '梵宇龍',
  birth: '1954年1月1日',
  death: '2012年1月31日',
  birthPlace: '臺北市',
  ancestry: '浙江瑞安',
  family: '七個兄弟姊妹，排行第五',
  education: '東吳大學政治系',
  title: '美國漢唐中醫學院創辦人',
  titles: [
    '命、相、卜、山、醫 五術兼備之曠世奇人',
    '美國漢唐中醫學院院長',
    '美國加州中醫藥大學博士指導教授',
    '佛羅里達州衛生署中醫委員會最高委員（2000-2003）',
    '佛州針灸委員會委員及副主席',
    '經方派現代繼承者',
    '天紀、人紀教學體系創立者',
    '海外優秀華人獎獲得者',
  ],
  /** 師承關係 */
  teachers: [
    { name: '周左宇', background: '北京四代家傳名醫，1949年後移居臺灣', subject: '針灸', period: '1977-1981' },
    { name: '徐濟民', background: '江蘇籍上海名醫', subject: '針灸', period: '1970s' },
    { name: '姜佐景傳承', background: '師承曹穎甫的經方家', subject: '經方', period: '基隆中藥行學徒期間' },
  ],
  /** 核心理念 */
  corePhilosophy: [
    '大道至簡——飛星飛來飛去太複雜，不搞這個',
    '命宮為本，三方為用',
    '人事努力+地理調整 > 先天命運（2/3 > 1/3）',
    '中醫是物理醫學，從物理角度分析人體',
    '辨證不辨病——中醫看的是證型而非病名',
    '經方一劑知，二劑已',
    '不希望中華文化失傳，所以教了許多學生',
    '算命就是一個討論果的哲學',
    '文字只是船，真理才是彼岸',
  ],
  /** 人生大事記 */
  timeline: [
    { year: '1954', event: '出生於臺北市，祖籍浙江瑞安' },
    { year: '1970s', event: '高中時以《醫宗金鑑》治癒二姐月經痛，立志習醫' },
    { year: '1977-1981', event: '向周左宇醫師學習針灸' },
    { year: '1978', event: '軍旅服役馬祖軍醫部，獲"馬祖神醫"稱號，時年24歲' },
    { year: '1979', event: '退伍後以化名"梵宇龍"開始算命看相事業' },
    { year: '1980', event: '移民美國' },
    { year: '1988', event: '在臺北金山南路開辦"天文地理班"，傳授紫微斗數和陽宅風水' },
    { year: '1991', event: '成為美國佛羅里達州註冊針灸師' },
    { year: '1993', event: '在佛州Merritt Island選定漢唐中醫學院地產' },
    { year: '1994', event: '完成《天紀》系列著作錄製，共24集' },
    { year: '1995', event: '創辦漢唐中醫學院' },
    { year: '2000-2003', event: '任佛州衛生署中醫委員會最高委員' },
    { year: '2004', event: '在臺北開設《人紀》中醫教學班' },
    { year: '2005', event: '《人紀》系列教學DVD出版' },
    { year: '2007', event: '開始撰寫《地紀》' },
    { year: '2010', event: '成立臺北漢唐經方中醫診所；受邀第三屆扶陽論壇整天演講' },
    { year: '2011', event: '成立深圳漢唐經方中醫館' },
    { year: '2012', event: '1月31日因心肺衰竭在臺北辭世，享年59歲' },
  ],
  /** 著作體系 */
  publications: {
    originalBooks8: ['黃帝內經素問', '黃帝內經', '神農本草經', '針灸', '傷寒論', '金匱', '人間道', '天機道·地脈道'],
    totalBooks: '26-44冊（含註解版教材、醫案全集、穴位精解等）',
    hantangFormulas: '漢唐100方',
    classicFormulas: '259個經典配方',
    medicalCases: '醫案全集7本',
    totalVideoHours: '200+小時',
  },
  /** 三紀體系 */
  sanJi: {
    tianji: {
      name: '天紀',
      meaning: '上知天文',
      content: '紫微斗數、易經64卦、堪輿學、推命學、面相學、測字術',
      recordYear: 1994,
      episodes: 24,
      hdEpisodes: 83,
      hoursPerEpisode: 2,
      totalHours: 48,
      books: ['天機道', '人間道', '地脈道', '64卦易圖'],
      schools: ['三合派（紫微斗數）', '象數派（易經）', '九星派（堪輿）', '河洛數理派（推命）'],
      structure: '前一小時講命學，後一小時講易經',
    },
    renji: {
      name: '人紀',
      meaning: '中知人事',
      content: '針灸大成(44集)、黃帝內經(20集)、神農本草經(46集)、傷寒論、金匱要略(20集)',
      completionYear: '2004-2005',
      totalLessons: '150+集',
      learningOrder: '針灸→黃帝內經→神農本草經→傷寒論→金匱要略',
      acuExperience: 215,
      transNeedling: 31,
      hantangFormulas: 100,
    },
    diji: {
      name: '地紀',
      meaning: '下知地理',
      content: '國家地理志（未完成）',
      status: '倪師未竟之業',
      note: '原計劃60歲後著述，2012年辭世',
      startYear: 2007,
      existingContent: '天紀課程中堪輿學部分 + 後人整理遺稿',
    },
  },
  /** 人格特徵 */
  personality: {
    算命風格: '鐵口直斷不留餘地',
    音樂愛好: '最喜老鷹樂隊《加州旅館》',
    生活技能: '做飯洗衣樣樣精通，一手面點功夫人人喊贊',
    工作態度: '床頭經年放紙筆，遭遇疑難雜症時向先師祝禱',
    睡眠: '多年夜間睡眠不足三小時',
    患者評價: '常被美國病患稱為"最後的希望（The last hope）"',
  },
  /** 傳人選拔標準 */
  discipleStandards: [
    '心性好',
    '個性強',
    '主見強',
    '敏銳觀察力',
    '勇於批判錯誤理論',
  ],
};

/** 三紀導航 */
export const SANJI_CATEGORIES = [
  { key: 'tianji' as const, name: '天紀', nameEn: 'Tian Ji', icon: '⊙', meaning: '上知天文', color: '#d4a843', href: '/tianji' },
  { key: 'diji' as const, name: '地紀', nameEn: 'Di Ji', icon: '⊞', meaning: '下知地理', color: '#6b8a5e', href: '/diji' },
  { key: 'renji' as const, name: '人紀', nameEn: 'Ren Ji', icon: '⊕', meaning: '中知人事', color: '#8b6b9e', href: '/renji' },
] as const;
