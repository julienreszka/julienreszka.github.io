// Unit tests for the target-growth table logic.
// Tests: invertModel round-trip, row classification, baseline adjustment math.
// Run with: node scripts/test-target-growth-logic.mjs

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { gridSearch2D, EXCLUDED_NAMES } from '../model-math.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');

// ── Minimal test harness ──────────────────────────────────────────────────────
let passed = 0, failed = 0;

function assert(condition, description, detail = '') {
  if (condition) {
    console.log(`  ✓  ${description}`);
    passed++;
  } else {
    console.error(`  ✗  ${description}${detail ? '\n       ' + detail : ''}`);
    failed++;
  }
}

function assertApprox(actual, expected, tolerance, description) {
  const ok = Math.abs(actual - expected) <= tolerance;
  assert(ok, description, `expected ≈${expected} ±${tolerance}, got ${actual}`);
}

// ── Load data & fit model (same as generate-static-target-growth.mjs) ─────────
const fallback = JSON.parse(readFileSync(join(root, 'fallback-data.json'), 'utf8'));
const bucket = fallback['structural'];
const allRows = [...(bucket.developed ?? []), ...(bucket.developing ?? [])];
const dataPoints = allRows
  .filter(c => !EXCLUDED_NAMES.has(c.name))
  .map(c => ({ name: c.name, spending: c.spending, growth: c.growth }));

const cost = (fn) => {
  const n = dataPoints.length;
  const ssRes = dataPoints.reduce((s, c) => s + (c.growth - fn(c.spending)) ** 2, 0);
  return n * Math.log(ssRes / n);
};

const [b0, alpha] = gridSearch2D([0.5, 2000], [0.1, 5],
  (b, a) => cost(x => b * Math.pow(Math.max(x, 0.1), -a)));

const predictFn = (x) => b0 * Math.pow(Math.max(x, 0.1), -alpha);

// ── invertModel (identical to the JS in armey-curve.html) ────────────────────
function invertModel(targetGrowth) {
  const maxGrowth = predictFn(0.1);
  if (targetGrowth > maxGrowth) return null;
  const minGrowth = predictFn(99);
  if (targetGrowth < minGrowth) return null;
  let lo = 0.1, hi = 99;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (predictFn(mid) > targetGrowth) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

// ── classifyRow (identical to the JS in armey-curve.html) ────────────────────
function classifyRow(d, target, useResidual) {
  let countryTargetSpending, requiredCut;
  if (useResidual) {
    const residual = d.growth - predictFn(d.spending);
    const adjustedTarget = target - residual;
    countryTargetSpending = invertModel(adjustedTarget);
    requiredCut = countryTargetSpending !== null ? d.spending - countryTargetSpending : null;
  } else {
    const globalTargetSpending = invertModel(target);
    countryTargetSpending = globalTargetSpending;
    requiredCut = countryTargetSpending !== null ? d.spending - countryTargetSpending : null;
  }

  // Priority order matches armey-curve.html updateTargetGrowthTable tbody loop
  if (d.growth >= target) return { label: 'no cut needed', targetSpending: countryTargetSpending, requiredCut };
  if (requiredCut === null) return { label: 'impossible', targetSpending: null, requiredCut: null };
  if (requiredCut <= 0)    return { label: 'already there', targetSpending: countryTargetSpending, requiredCut };
  return { label: 'cut', targetSpending: countryTargetSpending, requiredCut };
}

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\nPower law fit: g = ${b0.toFixed(2)} × s^(−${alpha.toFixed(3)})`);
console.log(`Loaded ${dataPoints.length} countries\n`);

// ── 1. Model sanity ───────────────────────────────────────────────────────────
console.log('1. Model sanity');
assert(b0 > 0, 'b0 is positive');
assert(alpha > 0, 'alpha is positive (spending hurts growth)');
assert(predictFn(10) > predictFn(50), 'model is monotonically decreasing');
assert(predictFn(50) > predictFn(90), 'model is monotonically decreasing (50→90)');

// ── 2. invertModel round-trip ─────────────────────────────────────────────────
console.log('\n2. invertModel round-trip');
for (const target of [2, 3, 4, 5]) {
  const s = invertModel(target);
  assert(s !== null, `invertModel(${target}%) returns a value`);
  if (s !== null) {
    assertApprox(predictFn(s), target, 0.001,
      `predictFn(invertModel(${target}%)) ≈ ${target}%`);
  }
}

// ── 3. invertModel bounds ─────────────────────────────────────────────────────
console.log('\n3. invertModel bounds');
const impossiblyHighGrowth = predictFn(0.1) + 10;
assert(invertModel(impossiblyHighGrowth) === null,
  'invertModel returns null when target > max model growth');
const impossiblyLowGrowth = predictFn(99) - 10;
assert(invertModel(impossiblyLowGrowth) === null,
  'invertModel returns null when target < min model growth');
assert(invertModel(-1) === null, 'invertModel returns null for negative target');

// ── 4. Row classification — unadjusted ────────────────────────────────────────
console.log('\n4. Row classification (unadjusted, target=3%)');

// Country already exceeding target growth
const highGrowth = { name: 'HighGrowth', spending: 40, growth: 5 };
assert(classifyRow(highGrowth, 3, false).label === 'no cut needed',
  'growth(5%) > target(3%) → "no cut needed"');

// Country with very high spending that model can't reach target
const veryHighSpending = { name: 'VeryHigh', spending: 98, growth: 1 };
const invertedForVH = invertModel(3);
const rhVH = invertedForVH !== null ? 98 - invertedForVH : null;
if (rhVH !== null && rhVH > 0) {
  assert(classifyRow(veryHighSpending, 3, false).label === 'cut',
    'high spender with growth < target → "cut" when inversion succeeds');
} else {
  assert(classifyRow(veryHighSpending, 3, false).label === 'already there'
    || classifyRow(veryHighSpending, 3, false).label === 'cut',
    'high spender resolved without "impossible"');
}

// Country with spending already below global target spending ("already there")
const globalTarget3 = invertModel(3);
if (globalTarget3 !== null) {
  const lowSpender = { name: 'LowSpend', spending: globalTarget3 - 5, growth: 2 };
  assert(classifyRow(lowSpender, 3, false).label === 'already there',
    'spending < target spending → "already there" when growth < target');
}

// ── 5. "no cut needed" supersedes null inversion (regression for Poland bug) ──
console.log('\n5. "no cut needed" supersedes null (regression test)');
// Simulate a country where actual growth >= target but residual adjustment
// would push adjustedTarget above the model's maximum (invertModel returns null)
const modelMax = predictFn(0.1);
// residual = growth - predictFn(spending); adjustedTarget = target - residual
// We want adjustedTarget > modelMax, so residual < target - modelMax
// Let growth = target + 1 (exceeds target), spending = 50
// residual = (target+1) - predictFn(50), adjustedTarget = target - residual = predictFn(50) - 1
// That won't necessarily exceed modelMax. Instead construct directly:
// We need growth >= target AND invertModel(adjustedTarget) === null
// adjustedTarget = target - (growth - predictFn(spending))
// For null: adjustedTarget > modelMax ⟹ target - (growth - predictFn(spending)) > modelMax
// ⟹ growth < target - modelMax + predictFn(spending)
// But we also need growth >= target. So pick growth = target, predictFn(spending) > modelMax - 0
// predictFn(spending) = b0 * spending^(-alpha); for spending=0.1, predictFn(0.1) = modelMax.
// residual = target - modelMax (negative if modelMax > target). adjustedTarget = target - (target-modelMax) = modelMax.
// invertModel(modelMax) should be ~0.1 (not null). This is tricky to force null while keeping growth>=target.
// Instead, test the logical priority directly with a mock:
function classifyWithMockInvert(d, target, mockInvertResult) {
  const requiredCut = mockInvertResult !== null ? d.spending - mockInvertResult : null;
  if (d.growth >= target) return 'no cut needed';
  if (requiredCut === null) return 'impossible';
  if (requiredCut <= 0)    return 'already there';
  return 'cut';
}
assert(classifyWithMockInvert({ spending: 35.9, growth: 3.8 }, 3, null) === 'no cut needed',
  'growth(3.8%) >= target(3%) wins even if inversion returns null → "no cut needed"');
assert(classifyWithMockInvert({ spending: 35.9, growth: 2.0 }, 3, null) === 'impossible',
  'growth(2.0%) < target(3%) with null inversion → "impossible"');
assert(classifyWithMockInvert({ spending: 20, growth: 2.0 }, 3, 22) === 'already there',
  'spending already below target spending, growth < target → "already there"');
assert(classifyWithMockInvert({ spending: 40, growth: 2.0 }, 3, 25) === 'cut',
  'spending above target spending, growth < target → "cut"');

// ── 6. Poland with target=3 (baseline unadjusted) ────────────────────────────
console.log('\n6. Poland specific checks');
const poland = dataPoints.find(c => c.name === 'Poland');
if (!poland) {
  console.warn('  ⚠  Poland not found in dataset, skipping Poland-specific tests');
} else {
  console.log(`  Poland: spending=${poland.spending.toFixed(1)}%, growth=${poland.growth.toFixed(2)}%`);
  const residual = poland.growth - predictFn(poland.spending);
  console.log(`  predictFn(${poland.spending.toFixed(1)})=${predictFn(poland.spending).toFixed(3)}%, residual=${residual.toFixed(3)} pp`);

  // Target 3%, no adjustment
  const r3 = classifyRow(poland, 3, false);
  assert(r3.label === 'no cut needed',
    'Poland target=3% unadjusted: growth(3.80%)>3% → "no cut needed"');

  // Target 3%, with adjustment
  const r3adj = classifyRow(poland, 3, true);
  assert(r3adj.label === 'no cut needed',
    'Poland target=3% adjusted: growth(3.80%)>3% → "no cut needed"');

  // Target 4%, no adjustment: growth(3.80%) < 4% → should require a cut
  const r4 = classifyRow(poland, 4, false);
  assert(r4.label === 'cut' || r4.label === 'already there',
    'Poland target=4% unadjusted: growth(3.80%)<4% → not "no cut needed" or "impossible"');
  if (r4.requiredCut !== null) {
    console.log(`  Poland target=4% unadjusted: requiredCut=${r4.requiredCut.toFixed(1)} pp, targetSpending=${r4.targetSpending?.toFixed(1)}%`);
    assert(r4.requiredCut > 0, 'Poland unadjusted cut for target=4% is positive');
    assert(r4.requiredCut < 30, 'Poland unadjusted cut for target=4% is plausibly <30 pp');
  }

  // Target 4%, with adjustment: residual adjustment accounts for Poland overperforming
  const r4adj = classifyRow(poland, 4, true);
  const adjustedTarget4 = 4 - residual;
  console.log(`  Poland target=4% adjusted: adjustedTarget=${adjustedTarget4.toFixed(3)}%`);
  if (r4adj.requiredCut !== null) {
    console.log(`  Poland target=4% adjusted: requiredCut=${r4adj.requiredCut.toFixed(1)} pp, targetSpending=${r4adj.targetSpending?.toFixed(1)}%`);
  }
  if (residual > 0) {
    // Poland overperforms → adjustedTarget is lower → target spending is higher →
    // required cut is smaller (or already-there) compared to unadjusted
    if (r4.label === 'cut' && r4adj.label === 'cut') {
      assert(r4adj.requiredCut < r4.requiredCut,
        'Poland adjusted cut < unadjusted cut (overperformance reduces required effort)');
    } else {
      assert(r4adj.label === 'cut' || r4adj.label === 'already there' || r4adj.label === 'no cut needed',
        'Poland target=4% adjusted resolves to a reasonable label');
    }
  }
}

// ── 7. Baseline adjustment math ───────────────────────────────────────────────
console.log('\n7. Baseline adjustment math');
// For a country at exactly the model prediction (residual=0), unadjusted and adjusted are identical
const onCurve = { name: 'OnCurve', spending: 35, growth: predictFn(35) };
const r_unAdj = classifyRow(onCurve, 3, false);
const r_adj   = classifyRow(onCurve, 3, true);
assert(r_unAdj.label === r_adj.label,
  'zero-residual country: adjusted and unadjusted give same label');
if (r_unAdj.targetSpending !== null && r_adj.targetSpending !== null) {
  assertApprox(r_unAdj.targetSpending, r_adj.targetSpending, 0.01,
    'zero-residual country: adjusted and unadjusted target spending are identical');
}

// For a country that underperforms (negative residual), adjustedTarget > target
// → target spending is lower → required cut is larger
const underperf = { name: 'Under', spending: 35, growth: predictFn(35) - 1 };
const ru = classifyRow(underperf, 3, false);
const ra = classifyRow(underperf, 3, true);
if (ru.label === 'cut' && ra.label === 'cut' && ru.requiredCut !== null && ra.requiredCut !== null) {
  assert(ra.requiredCut > ru.requiredCut,
    'underperforming country: adjusted cut > unadjusted cut');
}

// For a country that overperforms (positive residual), adjustedTarget < target
// → target spending is higher → required cut is smaller
const overperf = { name: 'Over', spending: 35, growth: predictFn(35) + 1 };
const ro_u = classifyRow(overperf, 3, false);
const ro_a = classifyRow(overperf, 3, true);
if (ro_u.label === 'cut' && ro_a.label === 'cut' && ro_u.requiredCut !== null && ro_a.requiredCut !== null) {
  assert(ro_a.requiredCut < ro_u.requiredCut,
    'overperforming country: adjusted cut < unadjusted cut');
}

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(52)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
