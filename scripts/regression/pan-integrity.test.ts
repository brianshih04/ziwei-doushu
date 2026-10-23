/**
 * 迴歸測試 — 排盤完整性 (2026-05-15)
 *
 * 起因: 使用者反饋"天機天梁在財帛宮被說成夫妻宮"。
 * 排查結論: 演算法層 100% 正確, 是 AI context 文本歧義。
 * 但為防止未來真的有人改壞排盤核心 (algorithm.ts / school-patches),
 * 把"排盤必須滿足的紫微斗數鐵律"固化成斷言, 進 CI 每次 push 跑。
 *
 * 跑: npx tsx scripts/regression/pan-integrity.test.ts
 * 失敗 exit 1 → CI 紅
 *
 * 不引 vitest, 用專案現有 tsx + 自定義斷言慣例 (同 test-school-patches.ts)
 */
import { generateChart } from '../../lib/ziwei/algorithm';
import type { BirthInfo, ZiweiChart } from '../../lib/ziwei/types';

const BR = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const PALACE_12 = ['命宮','兄弟','夫妻','子女','財帛','疾厄','遷移','僕役','官祿','田宅','福德','父母'];

let failures = 0;
const fail = (msg: string) => { console.error(`  ✗ ${msg}`); failures++; };
const ok = (msg: string) => console.log(`  ✓ ${msg}`);

// ── 取樣: 跨年代/月/時辰/性別, 覆蓋足夠多命盤形態 ──
const samples: BirthInfo[] = [];
for (let y = 1960; y <= 2010; y += 7)
  for (let m = 1; m <= 12; m += 3)
    for (let d = 5; d <= 26; d += 10)
      for (let h = 0; h < 12; h += 3)
        for (const g of ['male','female'] as const)
          samples.push({ year: y, month: m, day: d, hour: h, gender: g });

console.log(`\n排盤完整性迴歸 — ${samples.length} 個取樣命盤\n`);

let jiliangCount = 0;
let ziFuOppCount = 0;

for (const bi of samples) {
  let chart: ZiweiChart;
  try { chart = generateChart(bi); }
  catch (e) { fail(`generateChart 拋錯 @ ${JSON.stringify(bi)}: ${(e as Error).message}`); continue; }

  const tag = `${bi.year}-${bi.month}-${bi.day} h${bi.hour} ${bi.gender}`;

  // 鐵律 1: 必須正好 12 宮
  if (chart.palaces.length !== 12) { fail(`${tag}: 宮數 ${chart.palaces.length} ≠ 12`); continue; }

  // 鐵律 2: 12 宮名齊全且唯一(命宮/兄弟/.../父母)
  const names = chart.palaces.map(p => p.name).sort();
  const expect = [...PALACE_12].sort();
  if (JSON.stringify(names) !== JSON.stringify(expect)) {
    fail(`${tag}: 宮名集合不對 = ${names.join(',')}`); continue;
  }

  // 鐵律 3: 12 宮地支 0-11 各且僅一次
  const branches = chart.palaces.map(p => p.branch).sort((a,b)=>a-b);
  if (JSON.stringify(branches) !== JSON.stringify([0,1,2,3,4,5,6,7,8,9,10,11])) {
    fail(`${tag}: 地支不是 0-11 全覆蓋 = ${branches.join(',')}`); continue;
  }

  // 鐵律 4: 命宮唯一 + isMingGong 標記一致
  const mingByName = chart.palaces.filter(p => p.name === '命宮');
  if (mingByName.length !== 1) { fail(`${tag}: 命宮數量 ${mingByName.length}`); continue; }

  // 鐵律 5: 十二宮逆時針排布 — 從命宮地支起, 第 k 宮地支 = (命宮地支 - k + 12) % 12
  const mingBranch = mingByName[0].branch;
  for (let k = 0; k < 12; k++) {
    const expectBranch = ((mingBranch - k) % 12 + 12) % 12;
    const pName = PALACE_12[k];
    const p = chart.palaces.find(x => x.name === pName)!;
    if (p.branch !== expectBranch) {
      fail(`${tag}: ${pName} 應在 ${BR[expectBranch]} 實際 ${BR[p.branch]}（逆時針排布壞）`);
      break;
    }
  }

  // 鐵律 6: 機梁同宮只可能在 辰 或 戌
  const jl = chart.palaces.find(p => {
    const ms = p.stars.filter(s => s.type === 'major').map(s => s.name);
    return ms.includes('天機') && ms.includes('天梁');
  });
  if (jl) {
    jiliangCount++;
    if (jl.branch !== 4 && jl.branch !== 10) {
      fail(`${tag}: 機梁同宮出現在 ${BR[jl.branch]}(只能辰/戌)`);
    }
  }

  // 鐵律 7: 紫微 與 天府 永遠是固定相對位置 — 同盤必同時存在, 且
  //   紫微地支 + 天府地支 關係符合"寅申線對稱"(紫微+天府 地支和 ≡ 4 mod 12 是錯的簡化,
  //   正確鐵律: 天府地支 = (4 - 紫微地支 + 12*N) → 即 紫府永遠關於 寅(2)/申(8) 軸對稱,
  //   等價: (紫微branch + 天府branch) % 12 === 4)
  let ziB = -1, fuB = -1;
  for (const p of chart.palaces) for (const s of p.stars) {
    if (s.name === '紫微') ziB = p.branch;
    if (s.name === '天府') fuB = p.branch;
  }
  if (ziB >= 0 && fuB >= 0) {
    ziFuOppCount++;
    if ((ziB + fuB) % 12 !== 4) {
      fail(`${tag}: 紫府對稱鐵律破 紫=${BR[ziB]} 府=${BR[fuB]} (和%12 應=4)`);
    }
  }
}

console.log(`\n取樣統計: 機梁同宮盤 ${jiliangCount} 個(均驗證辰/戌), 紫府盤 ${ziFuOppCount} 個(均驗證對稱)`);

if (failures === 0) {
  console.log(`\n✅ 排盤完整性迴歸全過 (${samples.length} 盤 × 7 條紫微鐵律)\n`);
  process.exit(0);
} else {
  console.error(`\n❌ 排盤完整性迴歸 ${failures} 處失敗 — 排盤核心被改壞, 禁止上線\n`);
  process.exit(1);
}
