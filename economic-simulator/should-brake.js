// Capital kinds — module-level constant, not per-call state.
const CAPITAL_KINDS = [
  "produced",      // factories, infrastructure, durable goods
  "human",         // health, skills, life expectancy
  "natural",       // air, water, soil, biodiversity, reserves
  "knowledge",     // R&D stock, know-how, useful information
  "institutional", // rule of law, trust, contract enforcement
];

// Should government brake activity `a`?
// Returns true iff non-consenters lose inclusive wealth on net
// and the brake itself is cost-effective.
//
// a = {
//   affectedParties: [{ id, consented, shadowPrices: { [kind]: number } }],
//   capitalDeltas:   { [kind]: { [partyId]: number } },
//   deadweightLoss:  number,   // Harberger triangle estimate
//   enforcementCost: number,   // budget cost of the brake
//   captureRisk:     number,   // expected rent-seeking cost
// }
function shouldBrake(a) {
  // Step 1: who is affected without having consented?
  const nonConsenters = a.affectedParties.filter(p => !p.consented);
  if (nonConsenters.length === 0) return false; // Q1: leave alone

  // Step 2: sum (shadow price × capital change) over non-consenting parties.
  // Uncertainty lives in the shadow prices; the sum itself is deterministic.
  const expectedDeltaW = nonConsenters.reduce((total, p) =>
    total + CAPITAL_KINDS.reduce((s, k) =>
      s + (p.shadowPrices?.[k] ?? 1) * (a.capitalDeltas?.[k]?.[p.id] ?? 0), 0), 0);
  if (expectedDeltaW >= 0) return false; // Q2: leave alone

  // Step 3: would the brake itself cost more than the damage?
  const brakeCost = a.deadweightLoss + a.enforcementCost + a.captureRisk;
  if (brakeCost > -expectedDeltaW) return false; // Q3: cure worse than disease

  return true; // all three filters passed → BRAKE
}

// ── Assertions (truth-table style; throw on failure) ─────────────────────────
function assert(ok, msg) { if (!ok) throw new Error("✗ " + msg); }

// Factory: one party affected only via "natural" capital (shadow price = 1).
function activity(consented, naturalDelta, deadweightLoss, enforcementCost, captureRisk) {
  return {
    affectedParties: [{ id: "p", consented, shadowPrices: { natural: 1 } }],
    capitalDeltas: { natural: { p: naturalDelta } },
    deadweightLoss, enforcementCost, captureRisk,
  };
}

assert(shouldBrake(activity(true, -10, 0, 0, 0)) === false, "Q1: all consented → leave alone");
assert(shouldBrake(activity(false, +10, 0, 0, 0)) === false, "Q2: non-consenter gains → leave alone");
assert(shouldBrake(activity(false, -5, 3, 2, 1)) === false, "Q3: brake costs 6 > damage 5 → leave alone");
assert(shouldBrake(activity(false, -10, 1, 1, 1)) === true, "all filters passed → BRAKE");
