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
//   affectedParties: [{ id, external,
//                        measurementIntegrity: bool | undefined,  // oracle tamper-evident?
//                        priceVetted:          bool | undefined,  // independently cross-referenced?
//                        shadowPrices: { [kind]: number | { mean, sd?, irreversible? } } }],
//   capitalDeltas:   { [kind]: { [partyId]: number } },
//   deadweightLoss:  number,   // Harberger triangle estimate
//   enforcementCost: number,   // budget cost of the brake
//   captureRisk:     number,   // expected rent-seeking cost
// }
//
// Trust hierarchy (each layer is a validity precondition for the next):
//   measurementIntegrity → priceVetted → certainty-equivalent pricing → shouldBrake
// Corruption at any layer propagates upward regardless of how clean the layers
// above it are. A tampered sensor invalidates vetting; unvetted prices invalidate
// the CE calculation; a biased CE invalidates the brake decision.
//
// "external" means the party bears a cost or receives a benefit from the
// activity without choosing to participate in it (standard economic definition
// of an externality). Internal parties — those who voluntarily engaged — are
// excluded from ΔW_ext regardless of whether they gain or lose.
//
// Shadow prices may be either a scalar (point estimate) or an object
// { mean, sd, irreversible } encoding uncertainty. We price in σ via a
// certainty-equivalent: p* = max(0, mean − λ·sd), with λ larger when the
// underlying capital change is irreversible (Arrow–Fisher–Hanemann option
// value; Dasgupta Review on natural-capital irreversibility). This makes the
// criterion conservative under uncertainty AND creates an endogenous research
// incentive: any party that funds work shrinking σ_p moves the brake decision
// toward its true expected value (Arrow 1972 on the value of information).
function certaintyEquivalentPrice(p) {
  if (typeof p === "number") return p;                // point estimate
  const mean = p?.mean ?? 1;
  const sd = p?.sd ?? 0;
  const lambda = p?.irreversible ? 2.0 : 0.5;          // risk aversion weight
  return Math.max(0, mean - lambda * sd);              // conservative floor
}

function shouldBrake(a) {
  // Precondition 0: measurement integrity — the physical stocks that anchor
  // shadow prices must come from tamper-evident sources: satellite remote
  // sensing, adversarially motivated competing observers, or cryptographically
  // attested hardware. A single controllable sensor (the "hair dryer attack")
  // invalidates every layer above it regardless of how rigorous the vetting is.
  // If any external party is explicitly marked as having compromised measurements
  // (measurementIntegrity: false), we throw — the inputs cannot be trusted.
  const externalParties = a.affectedParties.filter(p => p.external);
  const compromisedParty = externalParties.find(p => p.measurementIntegrity === false);
  if (compromisedParty) throw new Error(
    `shouldBrake: measurement integrity compromised for party "${compromisedParty.id}". ` +
    `Physical stock data must come from tamper-evident sources (satellite remote sensing, ` +
    `adversarially motivated competing observers, or cryptographically attested hardware). ` +
    `A single controllable sensor invalidates all downstream vetting and pricing.`
  );
  // Precondition 1: price vetting — shadow prices must have been independently
  // cross-referenced against financial disclosures, credit markets, insurance
  // premiums, and comparable-transaction prices. Self-declared conflicts of
  // interest are insufficient. If any external party is explicitly marked
  // unvetted (priceVetted: false), the result is undefined and we throw.
  const unvettedParty = externalParties.find(p => p.priceVetted === false);
  if (unvettedParty) throw new Error(
    `shouldBrake: shadow prices for party "${unvettedParty.id}" have not been ` +
    `independently vetted. Cross-reference against financial disclosures, credit ` +
    `markets, insurance premiums, and comparable transactions is required before ` +
    `the brake criterion can be applied.`
  );
  // Q1: sum ΔW over external parties only, using certainty-equivalent prices.
  // If no one is external, or external parties break even or gain, leave alone.
  const deltaW_ext = externalParties.reduce((total, p) =>
    total + CAPITAL_KINDS.reduce((s, k) =>
      s + certaintyEquivalentPrice(p.shadowPrices?.[k] ?? 1) * (a.capitalDeltas?.[k]?.[p.id] ?? 0), 0), 0);
  if (deltaW_ext >= 0) return false; // Q1: ΔW_ext ≥ 0 → leave alone

  // Q2: would the brake itself cost more than the external damage it prevents?
  const brakeCost = a.deadweightLoss + a.enforcementCost + a.captureRisk;
  if (brakeCost > -deltaW_ext) return false; // Q2: cure worse than disease → leave alone

  return true; // both filters passed → BRAKE
}

// ── Assertions (truth-table style; throw on failure) ─────────────────────────
function assert(ok, msg) { if (!ok) throw new Error("✗ " + msg); }

// Factory: one party affected only via "natural" capital (shadow price = 1).
// measurementIntegrity and priceVetted both default to true — existing
// assertions test Q1/Q2 logic only.
function activity(external, naturalDelta, deadweightLoss, enforcementCost, captureRisk) {
  return {
    affectedParties: [{ id: "p", external, measurementIntegrity: true, priceVetted: true, shadowPrices: { natural: 1 } }],
    capitalDeltas: { natural: { p: naturalDelta } },
    deadweightLoss, enforcementCost, captureRisk,
  };
}

assert(shouldBrake(activity(false, -10, 0, 0, 0)) === false, "Q1: internal party only → leave alone");
assert(shouldBrake(activity(true, +10, 0, 0, 0)) === false, "Q1: external party gains → leave alone");
assert(shouldBrake(activity(true, -5, 3, 2, 1)) === false, "Q2: brake costs 6 > damage 5 → leave alone");
assert(shouldBrake(activity(true, -10, 1, 1, 1)) === true, "both filters passed → BRAKE");

// Uncertainty: an irreversible damage with sd ≈ mean collapses p* to 0,
// so the same physical ΔK no longer clears Q1 — uncertainty raises the
// burden of proof, and any research that shrinks sd lowers it again.
assert(shouldBrake({
  affectedParties: [{
    id: "p", external: true, priceVetted: true,
    shadowPrices: { natural: { mean: 1, sd: 1, irreversible: true } }
  }],
  capitalDeltas: { natural: { p: -10 } },
  deadweightLoss: 0, enforcementCost: 0, captureRisk: 0,
}) === false, "uncertainty: irreversible + sd≥mean → p*=0 → leave alone (research lowers sd)");

// Unvetted prices: shouldBrake must throw rather than return a value.
// Self-declared conflicts are insufficient; independent cross-referencing
// is a validity precondition, not a quality improvement.
let threw = false;
try {
  shouldBrake({
    affectedParties: [{ id: "industry", external: true, measurementIntegrity: true, priceVetted: false, shadowPrices: { natural: 1 } }],
    capitalDeltas: { natural: { industry: -10 } },
    deadweightLoss: 0, enforcementCost: 0, captureRisk: 0,
  });
} catch { threw = true; }
assert(threw, "unvetted prices: shouldBrake must throw, not silently return a value");

// Tampered measurement (the oracle problem): even with priceVetted: true,
// a compromised physical measurement invalidates the entire chain.
// e.g. heating a sensor to manipulate a prediction market that settles
// against it — the chain breaks at the foundation, not at the vetting layer.
let threwOnTamper = false;
try {
  shouldBrake({
    affectedParties: [{ id: "operator", external: true, measurementIntegrity: false, priceVetted: true, shadowPrices: { natural: 1 } }],
    capitalDeltas: { natural: { operator: -10 } },
    deadweightLoss: 0, enforcementCost: 0, captureRisk: 0,
  });
} catch { threwOnTamper = true; }
assert(threwOnTamper, "tampered measurement: shouldBrake must throw even if prices are vetted");
