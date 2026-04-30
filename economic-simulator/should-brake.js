// Capital kinds — module-level constant, not per-call state.
const CAPITAL_KINDS = [
  "produced",      // factories, infrastructure, durable goods
  "human",         // health, skills, life expectancy
  "natural",       // air, water, soil, biodiversity, reserves
  "knowledge",     // R&D stock, know-how, useful information
  "institutional", // rule of law, trust, contract enforcement
];

// ── Two functions, one concern each ──────────────────────────────────────────
//
//   shouldBrake(a)            : pure decision, trusts its inputs
//   inputsAreTrustworthy(a)   : optional upstream gate over data quality
//
// Calling code composes them:
//   if (!inputsAreTrustworthy(a).ok) refuseToDecide();
//   else act(shouldBrake(a));
//
// The criterion itself is small and stable. The epistemic stack
// (measurement → vetting → pricing) lives upstream as a separate concern.
//
// a = {
//   affectedParties: [{ id, external, shadowPrices: { [kind]: price } }],
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
//
// A `price` is either a scalar (point estimate) or an object:
//   { mean, sd?, irreversible?, confidence? }
//
// The certainty-equivalent rule unifies three flavors of epistemic risk into
// one formula: p* = max(0, mean × confidence − λ × sd)
//
//   • sd            : statistical uncertainty (Arrow–Fisher–Hanemann option value)
//   • irreversible  : λ = 2 if true, 0.5 otherwise (Dasgupta Review)
//   • confidence    : strategic + adversarial uncertainty in [0, 1]
//                     1.0  measurement is tamper-evident AND price is independently vetted
//                     0.5  one of the two is weak
//                     0.0  measurement is compromised OR price is self-reported by an
//                          interested party — collapses p* to 0, so the channel
//                          contributes nothing to ΔW_ext (no brake on garbage data,
//                          but no false reassurance either)
//
// confidence = 0 is the "I cannot trust this" degenerate case, expressed as a
// limit of the same pricing rule rather than a separate code path.
function certaintyEquivalentPrice(p) {
  if (typeof p === "number") return p;                  // scalar point estimate
  const mean       = p?.mean       ?? 1;
  const sd         = p?.sd         ?? 0;
  const confidence = p?.confidence ?? 1;                // default: fully trusted
  const lambda     = p?.irreversible ? 2.0 : 0.5;       // risk aversion weight
  return Math.max(0, mean * confidence - lambda * sd);
}

// Pure decision: external parties lose inclusive wealth on net, AND
// the brake itself is cost-effective.
function shouldBrake(a) {
  const externalParties = a.affectedParties.filter(p => p.external);
  const deltaW_ext = externalParties.reduce((total, p) =>
    total + CAPITAL_KINDS.reduce((s, k) =>
      s + certaintyEquivalentPrice(p.shadowPrices?.[k] ?? 1)
          * (a.capitalDeltas?.[k]?.[p.id] ?? 0), 0), 0);
  if (deltaW_ext >= 0) return false;                    // Q1: no net external harm

  const brakeCost = a.deadweightLoss + a.enforcementCost + a.captureRisk;
  if (brakeCost > -deltaW_ext) return false;            // Q2: cure worse than disease

  return true;
}

// Optional upstream gate. Returns { ok, reasons }. Callers use it to refuse
// to decide when the data pipeline is compromised — separate from the
// criterion itself, so bad-faith "we can't trust the inputs" arguments have
// a single, explicit place to live where they can be debated on merits.
function inputsAreTrustworthy(a) {
  const reasons = [];
  for (const p of a.affectedParties.filter(x => x.external)) {
    if (p.measurementIntegrity === false)
      reasons.push(`measurement compromised for "${p.id}" (oracle problem)`);
    if (p.priceVetted === false)
      reasons.push(`shadow prices unvetted for "${p.id}" (cross-reference required)`);
  }
  return { ok: reasons.length === 0, reasons };
}

// ── How to apply the brake ───────────────────────────────────────────────────
//
// shouldBrake() answers a yes/no question. The execution side — what
// instrument actually closes the externality gap — is a separate problem
// with its own capture surface (Pigouvian rates set by lobbyists, quotas
// allocated by political weight, voluntary codes written by industry, etc.).
//
// One instrument satisfies all the structural requirements at once:
//
//   strict liability + mandatory insurance covering the maximum credible loss,
//   with no liability cap, in a competitive insurance market,
//   not subsidised by the state.
//
// Why this single instrument generalises:
//   • Prices the externality, not the transaction (premiums track expected
//     damage, not gross sales)
//   • Self-enforcing — the operator either holds a policy or they don't;
//     no regulator decides case-by-case
//   • Adversarial verification built in — the insurer pays out on harm, so
//     they price, audit, and refuse uninsurable risks. They are the vetter
//     you do not have to appoint, with skin in the game by construction.
//   • State has no fiscal interest in the activity continuing (premiums go
//     to insurers, not the Treasury — breaks the dependency that turns
//     "green taxes" into structural rent extraction)
//   • Tail risk handled automatically: if maximum credible loss exceeds
//     insurance market capacity, no policy exists and the activity is
//     braked by the absence of coverage
//   • Measurement integrity becomes the insurer's problem — and they have
//     skin in the game to solve it
//
// requiredInsuranceCoverage(a) returns the maximum credible external loss
// the operator must insure against. This is the brake in operational form:
//   coverage > 0  → activity must hold a policy of at least this size
//   coverage = 0  → no required coverage (no net external harm priced in)
function requiredInsuranceCoverage(a) {
  const externalParties = a.affectedParties.filter(p => p.external);
  const externalLoss = externalParties.reduce((total, p) =>
    total + CAPITAL_KINDS.reduce((s, k) => {
      const ce = certaintyEquivalentPrice(p.shadowPrices?.[k] ?? 1);
      const dK = a.capitalDeltas?.[k]?.[p.id] ?? 0;
      return s + Math.min(0, ce * dK); // only losses count, gains do not net out
    }, 0), 0);
  return Math.max(0, -externalLoss);
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

// Core Q1/Q2 logic — unchanged by the refactor.
assert(shouldBrake(activity(false, -10, 0, 0, 0)) === false, "Q1: internal party only → leave alone");
assert(shouldBrake(activity(true,  +10, 0, 0, 0)) === false, "Q1: external party gains → leave alone");
assert(shouldBrake(activity(true,   -5, 3, 2, 1)) === false, "Q2: brake costs 6 > damage 5 → leave alone");
assert(shouldBrake(activity(true,  -10, 1, 1, 1)) === true,  "both filters passed → BRAKE");

// Statistical uncertainty: irreversible damage with sd ≈ mean collapses p* to 0.
// Research that shrinks sd raises p* and re-engages the brake.
assert(shouldBrake({
  affectedParties: [{ id: "p", external: true,
    shadowPrices: { natural: { mean: 1, sd: 1, irreversible: true } } }],
  capitalDeltas: { natural: { p: -10 } },
  deadweightLoss: 0, enforcementCost: 0, captureRisk: 0,
}) === false, "uncertainty: irreversible + sd≥mean → p*=0 → leave alone (Arrow 1972)");

// Adversarial uncertainty: confidence = 0 collapses p* to 0 — same effect
// as throwing, but expressed as a degenerate case of the pricing rule rather
// than a special control-flow path. shouldBrake stays pure.
assert(shouldBrake({
  affectedParties: [{ id: "p", external: true,
    shadowPrices: { natural: { mean: 1, sd: 0, confidence: 0 } } }],
  capitalDeltas: { natural: { p: -10 } },
  deadweightLoss: 0, enforcementCost: 0, captureRisk: 0,
}) === false, "confidence=0 → p*=0 → leave alone (no brake on untrusted data)");

// Trustworthiness gate is a separate concern. It reports problems; it does
// not decide policy. Callers that want hard-fail behavior compose it.
const tampered = {
  affectedParties: [{ id: "op", external: true, measurementIntegrity: false,
                      shadowPrices: { natural: 1 } }],
  capitalDeltas: { natural: { op: -10 } },
  deadweightLoss: 0, enforcementCost: 0, captureRisk: 0,
};
assert(inputsAreTrustworthy(tampered).ok === false, "gate: detects compromised measurement");
assert(inputsAreTrustworthy(tampered).reasons.length === 1, "gate: reports one reason");

const unvetted = {
  affectedParties: [{ id: "ind", external: true, priceVetted: false,
                      shadowPrices: { natural: 1 } }],
  capitalDeltas: { natural: { ind: -10 } },
  deadweightLoss: 0, enforcementCost: 0, captureRisk: 0,
};
assert(inputsAreTrustworthy(unvetted).ok === false, "gate: detects unvetted prices");

assert(inputsAreTrustworthy(activity(true, -10, 1, 1, 1)).ok === true,
       "gate: clean inputs pass");

// Required insurance coverage = the size of the policy the operator must
// hold to proceed. With shadow price 1 and external loss of 10, the
// required cover is 10. Gains for other parties do not net out — the
// insurer covers harms, not aggregates.
assert(requiredInsuranceCoverage(activity(true, -10, 0, 0, 0)) === 10,
       "insurance: external loss of 10 → required cover of 10");
assert(requiredInsuranceCoverage(activity(true,  +5, 0, 0, 0)) === 0,
       "insurance: external gain → no coverage required");
assert(requiredInsuranceCoverage(activity(false, -10, 0, 0, 0)) === 0,
       "insurance: internal-only loss → no external coverage required");
