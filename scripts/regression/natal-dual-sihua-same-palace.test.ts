/**
 * 防再犯：同宮兩顆本命四化星 ≠ bug。
 * 戊年（預設四化表）：貪狼祿、太陰權、右弼科、天機忌 —— 可落在同一宮。
 * 金標準 case：1988-10-08 未時男 → 命宮 天機忌+太陰權；父母 貪狼祿+右弼科。
 */
import assert from 'node:assert/strict';
import { generateChart } from '../../lib/ziwei/algorithm';
import { SCHOOL_SIHUA_DEFAULT, SCHOOL_STAR_ID_TO_NAME } from '../../lib/ziwei/school-data';

// 戊 = index 5 in SCHOOL_SIHUA_DEFAULT rows (row0 pad, 甲..癸 = 1..10)
const wu = SCHOOL_SIHUA_DEFAULT[5];
assert.deepEqual(wu, [0, 9, 8, 18, 2], '預設戊年四化表被改動');
assert.equal(SCHOOL_STAR_ID_TO_NAME[9], '貪狼');
assert.equal(SCHOOL_STAR_ID_TO_NAME[8], '太陰');
assert.equal(SCHOOL_STAR_ID_TO_NAME[18], '右弼');
assert.equal(SCHOOL_STAR_ID_TO_NAME[2], '天機');

const chart = generateChart({ year: 1988, month: 10, day: 8, hour: 7, gender: 'male' });
const byPalace = new Map<string, string[]>();
for (const p of chart.palaces) {
  const hits = p.stars.filter(s => s.siHua).map(s => `${s.name}:${s.siHua}`);
  if (hits.length) byPalace.set(p.name, hits);
}

assert.deepEqual(byPalace.get('命宮')?.sort(), ['天機:忌', '太陰:權'].sort());
assert.deepEqual(byPalace.get('父母')?.sort(), ['貪狼:祿', '右弼:科'].sort());
assert.equal(
  [...byPalace.values()].filter(v => v.length >= 2).length,
  2,
  '戊年此盤應有兩宮各含兩顆本命四化星',
);

console.log('✓ natal dual-sihua same palace (戊年·預設四化表) is valid, not a display bug');
