// Capital kinds — module-level constant, not per-call state.
const CAPITAL_KINDS = [
  "produced",      // factories, infrastructure, durable goods
  "human",         // health, skills, life expectancy
  "natural",       // air, water, soil, biodiversity, reserves
  "knowledge",     // R&D stock, know-how, useful information
  "institutional", // rule of law, trust, contract enforcement
];

// Should government brake activity `a`?
// Returns true iff external parties lose inclusive wealth on net (ΔW_ext < 0)
// and the brake itself is cost-effective.
//
// a = {
//   affectedParties: [{ id, external, shadowPrices: { [kind]: number } }],
//   capitalDeltas:   { [kind]: { [partyId]: number } },
//   deadweightLoss:  number,   // Harberger triangle estimate
//   enforcementCost: number,   // budget cost of the brake
//   captureRisk:     number,   // expected rent-seeking cost
// }
//
// "external" means the party bears a cost or receives a benefit from the
// activity without choosing to participate in it (standard economic definition
// of an externality). Internal parties — those who voluntarily engaged — are
// excluded from ΔW_ext regardless of whether they gain or lose.
function shouldBrake(a) {
  // Q1: sum ΔW over external parties only.
  // If no one is external, or external parties break even or gain, leave alone.
  const externalParties = a.affectedParties.filter(p => p.external);
  const deltaW_ext = externalParties.reduce((total, p) =>
    total + CAPITAL_KINDS.reduce((s, k) =>
      s + (p.shadowPrices?.[k] ?? 1) * (a.capitalDeltas?.[k]?.[p.id] ?? 0), 0), 0);
  if (deltaW_ext >= 0) return false; // Q1: ΔW_ext ≥ 0 → leave alone

  // Q2: would the brake itself cost more than the external damage it prevents?
  const brakeCost = a.deadweightLoss + a.enforcementCost + a.captureRisk;
  if (brakeCost > -deltaW_ext) return false; // Q2: cure worse than disease → leave alone

  return true; // both filters passed → BRAKE
}

// ── Assertions (truth-table style; throw on failure) ─────────────────────────
function assert(ok, msg) { if (!ok) throw new Error("✗ " + msg); }

// Factory: one party affected only via "natural" capital (shadow price = 1).
function activity(external, naturalDelta, deadweightLoss, enforcementCost, captureRisk) {
  return {
    affectedParties: [{ id: "p", external, shadowPrices: { natural: 1 } }],
    capitalDeltas: { natural: { p: naturalDelta } },
    deadweightLoss, enforcementCost, captureRisk,
  };
}

assert(shouldBrake(activity(false, -10, 0, 0, 0)) === false, "Q1: internal party only → leave alone");
assert(shouldBrake(activity(true, +10, 0, 0, 0)) === false, "Q1: external party gains → leave alone");
assert(shouldBrake(activity(true, -5, 3, 2, 1)) === false, "Q2: brake costs 6 > damage 5 → leave alone");
assert(shouldBrake(activity(true, -10, 1, 1, 1)) === true, "both filters passed → BRAKE");
