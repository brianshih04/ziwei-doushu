/* 產生 /api/interpret 與 /api/heming 的測試 payload（出生資料取自內建名人樣本） */
import { generateChart as buildChart } from '../../lib/ziwei/algorithm';

const chartA = buildChart({ year: 1964, month: 9, day: 10, hour: 5, gender: 'male', name: '甲方測試' });   // 馬雲盤
const chartB = buildChart({ year: 1928, month: 7, day: 29, hour: 3, gender: 'female', name: '乙方測試' }); // 李嘉誠盤(改女命)

console.log(JSON.stringify({
  interpret: { chart: chartA, messages: [{ role: 'user', content: '請總覽這張命盤的性格與事業重點，兩三百字即可。' }] },
  heming: { chartA, chartB },
}));
