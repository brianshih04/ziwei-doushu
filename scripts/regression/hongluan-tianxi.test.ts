/** Regression coverage for Hongluan/Tianxi placement and palace labels. */
import assert from 'node:assert/strict';
import { generateChart } from '../../lib/ziwei/algorithm';
import { BRANCHES, STEMS } from '../../lib/ziwei/constants';

function placementsFor(year: number, month = 5, day = 15) {
  const chart = generateChart({ year, month, day, hour: 11, gender: 'male', longitude: 120 });
  return chart.palaces.flatMap((palace) =>
    palace.stars
      .filter((star) => star.name === '紅鸞' || star.name === '天喜')
      .map((star) => ({
        name: star.name,
        branch: BRANCHES[palace.branch],
        palaceLabel: `${STEMS[palace.stem]}${BRANCHES[palace.branch]}`,
      })),
  );
}

const placements = placementsFor(1974, 1, 28);

assert.deepEqual(
  placements.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')),
  [
    { name: '天喜', branch: '未', palaceLabel: '辛未' },
    { name: '紅鸞', branch: '丑', palaceLabel: '丁丑' },
  ].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')),
  '甲寅年應按卯起子年逆數得到紅鸞丑、天喜未；丁丑/辛未是所在宮完整干支',
);

const representativeYears = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2016, 2017, 2018, 2019];
for (let yearBranch = 0; yearBranch < 12; yearBranch += 1) {
  const year = representativeYears[yearBranch];
  const yearPlacements = placementsFor(year);
  const hongluan = yearPlacements.filter((item) => item.name === '紅鸞');
  const tianxi = yearPlacements.filter((item) => item.name === '天喜');
  const expectedHongluan = (3 - yearBranch + 12) % 12;
  const expectedTianxi = (expectedHongluan + 6) % 12;

  assert.equal(hongluan.length, 1, `${BRANCHES[yearBranch]}年應且僅應有一顆紅鸞`);
  assert.equal(tianxi.length, 1, `${BRANCHES[yearBranch]}年應且僅應有一顆天喜`);
  assert.equal(hongluan[0].branch, BRANCHES[expectedHongluan], `${BRANCHES[yearBranch]}年紅鸞宮位錯誤`);
  assert.equal(tianxi[0].branch, BRANCHES[expectedTianxi], `${BRANCHES[yearBranch]}年天喜宮位錯誤`);
  assert.equal(
    (BRANCHES.indexOf(tianxi[0].branch) - BRANCHES.indexOf(hongluan[0].branch) + 12) % 12,
    6,
    `${BRANCHES[yearBranch]}年紅鸞與天喜必須互為對宮`,
  );
}

console.log('✓ 甲寅案例與十二年支紅鸞天喜對映、唯一性及對宮關係迴歸通過');
