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
//   affectedParties: [{ id, external, shadowPrices: { [kind]: price },
//                       measurementIntegrity?: true,  // explicit opt-in; absence is flagged
//                       priceVetted?: true,           // explicit opt-in; absence is flagged
//                       jurisdiction?: string }],     // for coordinationFloor
//   capitalDeltas:      { [kind]: { [partyId]: number } },
//   decidingJurisdiction?: string,                    // for coordinationFloor
// }
//
// brake = {
//   deadweightLoss:  number,   // Harberger triangle estimate
//   enforcementCost: number,   // budget cost of the brake
//   captureRisk:     number,   // expected rent-seeking cost (instrument-specific)
// }
//
// captureRisk belongs on the brake descriptor, not the activity, because it
// depends on the instrument chosen: Pigouvian tax → high (rate-setting is
// capturable); strict liability + competitive insurance → low (insurer pays,
// so they audit). Same activity, very different captureRisk.
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
//
// ── Out of scope (deliberate, not oversights) ────────────────────────────────
//
// These are scope decisions, named here so they are easy to find if scope
// expands. The criterion is intentionally narrow; the items below are upstream
// or orthogonal concerns that would muddy it if folded in.
//
//   • Internal-party schema errors. inputsAreTrustworthy does not check
//     internal parties' shadowPrices keys against CAPITAL_KINDS, and
//     capitalDeltas entries referencing internal parties pass the gate
//     unflagged. Both behaviors are consistent with the stated invariant
//     (internal parties may appear in capitalDeltas for bookkeeping;
//     shouldBrake filters them out before summing). If the invariant ever
//     changes, the two places to update are the gate's first for-loop and
//     the construction of knownPartyIds.
//
//   • Temporal structure. All capital deltas are treated as contemporaneous.
//     Discounting, phasing, and path-dependence (e.g. damage that grows if
//     not arrested early) are upstream concerns: they must be priced into the
//     shadow prices before inputs reach this code.
//
//   • Distributional weights. Welfare changes are aggregated by summing,
//     so a party losing $10 of natural capital exactly offsets a party
//     gaining $10 of natural capital at shadow price 1. Whether that
//     aggregation should be weighted by income, vulnerability, or political
//     representation is a prior question the pricing step must resolve;
//     the criterion takes the resulting prices as given.
function certaintyEquivalentPrice(p) {
  if (typeof p === "number") return p;                  // scalar point estimate
  const mean = p?.mean ?? 0;  // ?? 0: a price object with no mean is no signal
  const sd = p?.sd ?? 0;
  const confidence = p?.confidence ?? 1;                // default: fully trusted
  const lambda = p?.irreversible ? 2.0 : 0.5;       // risk aversion weight
  return Math.max(0, mean * confidence - lambda * sd);
}

// Pure decision: external parties lose inclusive wealth on net, AND
// the brake itself is cost-effective.
// Missing shadow prices contribute 0 (no signal), not 1 (arbitrary assumption).
// Typo detection lives in inputsAreTrustworthy; shouldBrake treats unknown kinds
// as zero by the ?? 0 convention, so the gate must be in the call chain for the
// guard to fire.
//
// brake defaults to {} so Q2 always passes (cost = 0). This is intentional for
// Q1-only testing ("is there external harm at all?"), but a caller who forgets
// the brake descriptor in production gets an optimistically cheap answer.
// Convention: always pass an explicit brake when the instrument is known.
function shouldBrake(a, brake = {}) {
  const externalParties = a.affectedParties.filter(p => p.external);
  const deltaW_ext = externalParties.reduce((total, p) =>
    total + CAPITAL_KINDS.reduce((s, k) =>
      s + certaintyEquivalentPrice(p.shadowPrices?.[k] ?? 0)
      * (a.capitalDeltas?.[k]?.[p.id] ?? 0), 0), 0);
  if (deltaW_ext >= 0) return false;                    // Q1: no net external harm

  const brakeCost = (brake.deadweightLoss ?? 0) + (brake.enforcementCost ?? 0) + (brake.captureRisk ?? 0);
  if (brakeCost > -deltaW_ext) return false;            // Q2: cure worse than disease

  return true;
}

// Optional upstream gate. Returns { ok, reasons }. Callers use it to refuse
// to decide when the data pipeline is compromised — separate from the
// criterion itself, so bad-faith "we can't trust the inputs" arguments have
// a single, explicit place to live where they can be debated on merits.
//
// Design note — two concerns in one gate:
//   The epistemic checks below (measurementIntegrity, priceVetted) answer
//   "can we trust the measurement and pricing pipeline?". The schema checks
//   (CAPITAL_KINDS keys, party IDs in capitalDeltas) answer "is the data
//   structure well-formed?". Keeping both here means there is still one
//   place where "do not proceed" lives. If they are ever split — e.g.
//   because schema errors should throw rather than accumulate reasons, or
//   because a caller wants schema validation without epistemic gating — the
//   seam is between the two for-loops below.
function inputsAreTrustworthy(a) {
  const reasons = [];
  for (const p of a.affectedParties.filter(x => x.external)) {
    if (p.measurementIntegrity !== true)
      reasons.push(`measurementIntegrity not confirmed for "${p.id}" — unknown is not safe`);
    if (p.priceVetted !== true)
      reasons.push(`priceVetted not confirmed for "${p.id}" — unknown is not safe`);
    const unknownKinds = Object.keys(p.shadowPrices ?? {}).filter(k => !CAPITAL_KINDS.includes(k));
    if (unknownKinds.length > 0)
      reasons.push(`unknown capital kinds for "${p.id}": ${unknownKinds.join(", ")} — not in CAPITAL_KINDS (typo?)`);
  }
  // capitalDeltas schema: kind keys must be in CAPITAL_KINDS; party IDs must
  // match IDs declared in affectedParties. Both classes of typo produce silent
  // zeros in every computation, so they are detectable only here.
  //
  // Invariant — internal parties in capitalDeltas:
  //   knownPartyIds includes ALL parties (external and internal). A delta
  //   entry for an internal party therefore passes this check rather than
  //   being flagged as an unknown ID. This is intentional: capitalDeltas
  //   may legitimately record internal-party changes for bookkeeping, and
  //   shouldBrake silently ignores them (it filters to external parties
  //   before summing). The silence in both places is consistent design, not
  //   an oversight. If the intended invariant were "capitalDeltas must only
  //   reference external parties", this check would use a filtered set and
  //   flag internal-party entries explicitly.
  const knownPartyIds = new Set(a.affectedParties.map(p => p.id));
  for (const kind of Object.keys(a.capitalDeltas ?? {})) {
    if (!CAPITAL_KINDS.includes(kind)) {
      reasons.push(`unknown capital kind in capitalDeltas: "${kind}" — not in CAPITAL_KINDS (typo?)`);
    } else {
      for (const partyId of Object.keys(a.capitalDeltas[kind])) {
        if (!knownPartyIds.has(partyId))
          reasons.push(`unknown party ID in capitalDeltas["${kind}"]: "${partyId}" — not in affectedParties (typo?)`);
      }
    }
  }
  return { ok: reasons.length === 0, reasons };
}

// Sibling gate over the brake descriptor. Same shape as inputsAreTrustworthy
// — { ok, reasons } — but a separate function because brake is optional and
// has a different signature than the activity. Callers compose them:
//   if (!inputsAreTrustworthy(a).ok || !brakeIsWellFormed(brake).ok)
//     refuseToDecide();
//
// Catches the failure modes that brake = {} cannot defend against:
//   • non-numeric or non-finite values (NaN, Infinity, strings)
//   • negative values (a "negative deadweight loss" silently flips Q2)
// A missing brake (undefined / null) is treated as the documented Q1-only
// case and passes — that's the brake = {} default of shouldBrake, made
// explicit here.
function brakeIsWellFormed(brake) {
  const reasons = [];
  if (brake == null) return { ok: true, reasons }; // Q1-only mode; documented default
  for (const field of ["deadweightLoss", "enforcementCost", "captureRisk"]) {
    const v = brake[field];
    if (v === undefined) continue; // missing → 0 by ?? convention; not an error
    if (typeof v !== "number" || !Number.isFinite(v))
      reasons.push(`brake.${field} is not a finite number: ${String(v)}`);
    else if (v < 0)
      reasons.push(`brake.${field} is negative: ${v} — costs cannot be negative`);
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
  // Losses aggregate across all capital kinds and all external parties —
  // the insurer covers the full scope of harm, not a net. Missing prices
  // contribute 0 (no signal) rather than 1 (arbitrary assumption).
  // Note: the coverage amount depends on the same shadow prices the insurer
  // will correct via underwriting — this is an input to that negotiation,
  // not its output. The circularity is resolved iteratively, not analytically.
  const externalParties = a.affectedParties.filter(p => p.external);
  const externalLoss = externalParties.reduce((total, p) =>
    total + CAPITAL_KINDS.reduce((s, k) => {
      const ce = certaintyEquivalentPrice(p.shadowPrices?.[k] ?? 0);
      const dK = a.capitalDeltas?.[k]?.[p.id] ?? 0;
      return s + Math.min(0, ce * dK); // only losses count, gains do not net out
    }, 0), 0);
  return Math.max(0, -externalLoss);
}

// ── Coordination floor: where the externality lives vs. who is braking ───────
//
// The criterion's natural unit is the externality's footprint, but our
// institutions are geographic. coordinationFloor(a) reads the spatial
// structure already encoded in affectedParties to answer: what fraction of
// external loss falls on parties OUTSIDE the deciding jurisdiction?
//
// Three regimes fall out of the same number:
//   floor ≈ 0   Case 1 — externality footprint ⊆ jurisdiction. Local courts
//               and a unilateral insurance regime are fully sufficient.
//   0 < f < 1   Case 2 — externality crosses borders via trade flows.
//               Border adjustments (CBAM-style) or reciprocal liability
//               recognition carry the brake to where the demand originates.
//   floor → 1   Case 3 — externality is global (CO₂, ozone, antibiotic
//               resistance, novel pathogens). No single country can brake
//               unilaterally without leakage proportional to the floor.
//               Coordination (climate clubs, treaty trusts, MFN reciprocity)
//               is constitutive of the brake, not an enhancement.
//
// floor is also the leakage rate of unilateral action: 1 − floor of the
// nominal damage is captured by acting alone; the rest escapes. This is
// not a flaw in the criterion; it is information the criterion produces.
//
// a.decidingJurisdiction is the jurisdiction whose institutions are
// applying the brake. Each affected party may carry a `jurisdiction` field.
// Parties with no jurisdiction declared are treated as being inside the
// deciding one (the conservative default — counts toward sufficient
// coverage rather than toward leakage). The returned { floor, undeclaredCount }
// makes this assumption visible: undeclaredCount > 0 means floor is a lower
// bound, not a precise estimate.
function coordinationFloor(a) {
  const j = a.decidingJurisdiction;
  if (!j) return { floor: 0, undeclaredCount: 0 }; // cannot compute leakage

  const externalParties = a.affectedParties.filter(p => p.external);
  let totalLoss = 0;
  let outsideLoss = 0;
  let undeclaredCount = 0; // external parties with losses but no jurisdiction field
  // Note: parties with no shadow prices have zero computed loss (via ?? 0) and
  // therefore don't appear in totalLoss OR in undeclaredCount. A party that is
  // both jurisdiction-undeclared and price-undeclared is entirely invisible to
  // this function — not flagged, not counted. undeclaredCount is a lower bound
  // on how many unknown parties are being treated as inside the jurisdiction.
  for (const p of externalParties) {
    const partyLoss = CAPITAL_KINDS.reduce((s, k) => {
      const ce = certaintyEquivalentPrice(p.shadowPrices?.[k] ?? 0);
      const dK = a.capitalDeltas?.[k]?.[p.id] ?? 0;
      return s + Math.min(0, ce * dK);
    }, 0);
    if (partyLoss >= 0) continue; // gains do not enter leakage analysis
    totalLoss += -partyLoss;
    if (p.jurisdiction === undefined) {
      undeclaredCount++; // treated as inside j — biases floor toward 0
    } else if (p.jurisdiction !== j) {
      outsideLoss += -partyLoss;
    }
  }
  const floor = totalLoss === 0 ? 0 : outsideLoss / totalLoss;
  return { floor, undeclaredCount };
}

// ── Assertions (truth-table style; throw on failure) ─────────────────────────
function assert(ok, msg) { if (!ok) throw new Error("✗ " + msg); }

// Factory: returns [a, brake] — spread into shouldBrake(...activity(...)).
// Parties carry measurementIntegrity: true and priceVetted: true (clean baseline);
// the gate treats absent fields as unconfirmed, so explicit true is required.
function activity(external, naturalDelta, deadweightLoss, enforcementCost, captureRisk) {
  return [
    {
      affectedParties: [{
        id: "p", external, shadowPrices: { natural: 1 },
        measurementIntegrity: true, priceVetted: true
      }],
      capitalDeltas: { natural: { p: naturalDelta } },
    },
    { deadweightLoss, enforcementCost, captureRisk },
  ];
}

// Core Q1/Q2 logic.
assert(shouldBrake(...activity(false, -10, 0, 0, 0)) === false, "Q1: internal party only → leave alone");
assert(shouldBrake(...activity(true, +10, 0, 0, 0)) === false, "Q1: external party gains → leave alone");
assert(shouldBrake(...activity(true, -5, 3, 2, 1)) === false, "Q2: brake costs 6 > damage 5 → leave alone");
assert(shouldBrake(...activity(true, -10, 1, 1, 1)) === true, "both filters passed → BRAKE");

// ── certaintyEquivalentPrice: direct unit tests ───────────────────────────────
// These test the formula in isolation. If a regression lands here the failure
// message names the function and the inputs, not a downstream Q1/Q2 label.
assert(certaintyEquivalentPrice(7) === 7,
  "cep: scalar passthrough");
assert(certaintyEquivalentPrice({}) === 0,
  "cep: no mean → 0 (no signal, not 1)");
assert(certaintyEquivalentPrice({ mean: 1 }) === 1,
  "cep: mean=1, all defaults → p* = 1");
assert(certaintyEquivalentPrice({ mean: 1, sd: 1 }) === 0.5,
  "cep: reversible, sd=1 → p* = 1 − 0.5×1 = 0.5");
assert(certaintyEquivalentPrice({ mean: 1, sd: 1, irreversible: true }) === 0,
  "cep: irreversible, sd=1 → p* = max(0, 1 − 2×1) = 0");
assert(certaintyEquivalentPrice({ mean: 2, confidence: 0.5 }) === 1,
  "cep: confidence=0.5, no sd → p* = 2×0.5 = 1");
assert(Math.abs(certaintyEquivalentPrice({ mean: 2, sd: 1, confidence: 0.5 }) - 0.5) < 1e-9,
  "cep: mean=2, sd=1, confidence=0.5 → p* = 2×0.5 − 0.5×1 = 0.5");

// The next three tests exercise certaintyEquivalentPrice in isolation via shouldBrake.
// They deliberately omit measurementIntegrity and priceVetted — that's inputsAreTrustworthy's
// domain, not shouldBrake's. Running inputsAreTrustworthy on these inputs would flag them;
// that's expected. These are unit tests of the pricing formula, not the full pipeline.

// Statistical uncertainty: irreversible damage with sd ≈ mean collapses p* to 0.
// Research that shrinks sd raises p* and re-engages the brake.
assert(shouldBrake({
  affectedParties: [{
    id: "p", external: true,
    shadowPrices: { natural: { mean: 1, sd: 1, irreversible: true } }
  }],
  capitalDeltas: { natural: { p: -10 } },
}) === false, "uncertainty: irreversible + sd≥mean → p*=0 → leave alone (Arrow 1972)");

// Adversarial uncertainty: confidence = 0 collapses p* to 0 — same effect
// as throwing, but expressed as a degenerate case of the pricing rule rather
// than a special control-flow path. shouldBrake stays pure.
assert(shouldBrake({
  affectedParties: [{
    id: "p", external: true,
    shadowPrices: { natural: { mean: 1, sd: 0, confidence: 0 } }
  }],
  capitalDeltas: { natural: { p: -10 } },
}) === false, "confidence=0 → p*=0 → leave alone (no brake on untrusted data)");

// Positive confidence test: partial confidence (0.8) still engages the brake when
// the adjusted loss (0.8 × 10 = 8) exceeds brake cost (3). Tests the mid-range
// between full-trust (1) and zero-trust (0).
assert(shouldBrake({
  affectedParties: [{
    id: "p", external: true,
    shadowPrices: { natural: { mean: 1, sd: 0, confidence: 0.8 } }
  }],
  capitalDeltas: { natural: { p: -10 } },
}, { deadweightLoss: 3, enforcementCost: 0, captureRisk: 0 }) === true,
  "confidence=0.8 → p*=0.8 → adjusted loss 8 > brake cost 3 → BRAKE");

// Trustworthiness gate is a separate concern. It reports problems; it does
// not decide policy. Callers that want hard-fail behavior compose it.
const tampered = {
  affectedParties: [{
    id: "op", external: true, measurementIntegrity: false, priceVetted: true,
    shadowPrices: { natural: 1 }
  }],
  capitalDeltas: { natural: { op: -10 } },
};
assert(inputsAreTrustworthy(tampered).ok === false, "gate: detects compromised measurement");
assert(inputsAreTrustworthy(tampered).reasons.length === 1, "gate: reports one reason (not two)");

const unvetted = {
  affectedParties: [{
    id: "ind", external: true, priceVetted: false, measurementIntegrity: true,
    shadowPrices: { natural: 1 }
  }],
  capitalDeltas: { natural: { ind: -10 } },
};
assert(inputsAreTrustworthy(unvetted).ok === false, "gate: detects unvetted prices");

// CAPITAL_KINDS typo guard: a misspelled kind (e.g. "naturel") is flagged by
// inputsAreTrustworthy rather than silently contributing 0. This is the only
// enforcement point — CAPITAL_KINDS is the authoritative list and nothing in
// the computation itself can distinguish a typo from a genuinely zero exposure.
const typo = {
  affectedParties: [{
    id: "tp", external: true, measurementIntegrity: true, priceVetted: true,
    shadowPrices: { naturel: 1 },  // deliberate misspelling of "natural"
  }],
  capitalDeltas: { natural: { tp: -10 } },
};
assert(inputsAreTrustworthy(typo).ok === false,
  "gate: unknown capital kind (typo) is flagged");
assert(inputsAreTrustworthy(typo).reasons.length === 1 &&
  inputsAreTrustworthy(typo).reasons[0].includes("naturel"),
  "gate: names the unknown kind in the reason");

// Clean: both fields explicitly true. Absent fields are also flagged — true is
// an explicit opt-in, not a default, so missing = unknown = flagged.
assert(inputsAreTrustworthy(activity(true, -10, 1, 1, 1)[0]).ok === true,
  "gate: clean inputs pass (measurementIntegrity: true, priceVetted: true)");

// Required insurance coverage = the size of the policy the operator must
// hold to proceed. With shadow price 1 and external loss of 10, the
// required cover is 10. Gains for other parties do not net out — the
// insurer covers harms, not aggregates.
assert(requiredInsuranceCoverage(activity(true, -10, 0, 0, 0)[0]) === 10,
  "insurance: external loss of 10 → required cover of 10");
assert(requiredInsuranceCoverage(activity(true, +5, 0, 0, 0)[0]) === 0,
  "insurance: external gain → no coverage required");
assert(requiredInsuranceCoverage(activity(false, -10, 0, 0, 0)[0]) === 0,
  "insurance: internal-only loss → no external coverage required");

// ── Coordination floor: three cases by externality footprint ─────────────────
//
// Case 1 — local externality. All external parties reside in the deciding
// jurisdiction. Unilateral action is fully sufficient; no leakage.
assert(coordinationFloor({
  decidingJurisdiction: "FR",
  affectedParties: [
    { id: "p1", external: true, jurisdiction: "FR", shadowPrices: { natural: 1 } },
    { id: "p2", external: true, jurisdiction: "FR", shadowPrices: { natural: 1 } },
  ],
  capitalDeltas: { natural: { p1: -5, p2: -5 } },
}).floor === 0, "Case 1 (local): floor = 0 → unilateral fully sufficient");

// Case 2 — trade-coupled externality. 70% of external loss falls outside
// the deciding jurisdiction. Border adjustments carry the brake to the
// consumption point; without them, leakage is 70%.
const case2 = {
  decidingJurisdiction: "FR",
  affectedParties: [
    { id: "fr", external: true, jurisdiction: "FR", shadowPrices: { natural: 1 } },
    { id: "br", external: true, jurisdiction: "BR", shadowPrices: { natural: 1 } },
  ],
  capitalDeltas: { natural: { fr: -3, br: -7 } },
};
assert(Math.abs(coordinationFloor(case2).floor - 0.7) < 1e-9,
  "Case 2 (trade): floor = 0.7 → border adjustments needed");

// Case 3 — global externality. Damage is spread over many jurisdictions;
// the deciding country bears a small share. Floor → 1 means almost all of
// the brake authority lives outside the country. Unilateral action leaks
// in proportion to (1 − share).
const case3 = {
  decidingJurisdiction: "FR",
  affectedParties: Array.from({ length: 10 }, (_, i) => ({
    id: `c${i}`, external: true,
    jurisdiction: i === 0 ? "FR" : `X${i}`,
    shadowPrices: { natural: 1 },
  })),
  capitalDeltas: {
    natural: Object.fromEntries(
      Array.from({ length: 10 }, (_, i) => [`c${i}`, -1])
    )
  },
};
assert(Math.abs(coordinationFloor(case3).floor - 0.9) < 1e-9,
  "Case 3 (global): floor = 0.9 → coordination is constitutive of the brake");

// Gains by external parties do not contribute to the leakage calculation:
// the brake exists to address harm, not to net harm against benefit.
assert(coordinationFloor({
  decidingJurisdiction: "FR",
  affectedParties: [
    { id: "fr", external: true, jurisdiction: "FR", shadowPrices: { natural: 1 } },
    { id: "us", external: true, jurisdiction: "US", shadowPrices: { natural: 1 } },
  ],
  capitalDeltas: { natural: { fr: -10, us: +10 } },
}).floor === 0, "coord: external gains elsewhere do not net against losses at home");

// No deciding jurisdiction → { floor: 0, undeclaredCount: 0 }.
assert(coordinationFloor(activity(true, -10, 0, 0, 0)[0]).floor === 0,
  "coord: no decidingJurisdiction → floor = 0 (analysis not applicable)");

// undeclaredCount surfaces the assumption: parties with no jurisdiction field
// are treated as inside the deciding jurisdiction, biasing floor toward 0.
assert(coordinationFloor({
  decidingJurisdiction: "FR",
  affectedParties: [
    { id: "local", external: true, jurisdiction: "FR", shadowPrices: { natural: 1 } },
    { id: "unknown", external: true, shadowPrices: { natural: 1 } },
  ],
  capitalDeltas: { natural: { local: -5, unknown: -5 } },
}).undeclaredCount === 1, "coord: undeclaredCount flags parties with losses but no jurisdiction field");

// ── Multi-party, multi-kind aggregation ───────────────────────────────────────
//
// shouldBrake sums across both external parties AND capital kinds. These tests
// exercise the aggregation paths that single-party, single-kind tests cannot reach.

// Two external parties in different capital kinds. Individual losses (6 each)
// are below the brake cost (8) in isolation, but their sum (12) exceeds it.
// This confirms the reducer sums across both dimensions before comparing.
assert(shouldBrake({
  affectedParties: [
    { id: "a", external: true, shadowPrices: { natural: 1 } },
    { id: "b", external: true, shadowPrices: { human: 1 } },
  ],
  capitalDeltas: { natural: { a: -6 }, human: { b: -6 } },
}, { deadweightLoss: 8, enforcementCost: 0, captureRisk: 0 }) === true,
  "aggregation: two parties, two kinds, combined loss 12 > brake cost 8 → BRAKE");

assert(shouldBrake({
  affectedParties: [
    { id: "a", external: true, shadowPrices: { natural: 1 } },
    { id: "b", external: true, shadowPrices: { human: 1 } },
  ],
  capitalDeltas: { natural: { a: -6 }, human: { b: -6 } },
}, { deadweightLoss: 13, enforcementCost: 0, captureRisk: 0 }) === false,
  "aggregation: combined loss 12 < brake cost 13 → leave alone");

// requiredInsuranceCoverage with one party losing across two capital kinds.
// The insurer covers the full scope of harm; losses in each kind accumulate.
assert(requiredInsuranceCoverage({
  affectedParties: [{
    id: "c", external: true,
    shadowPrices: { natural: 1, human: 2 },
  }],
  capitalDeltas: { natural: { c: -4 }, human: { c: -3 } },
}) === 10,  // 1×4 + 2×3 = 4 + 6 = 10
  "aggregation: single party, two kinds — insurance covers 4 + 6 = 10");

// ── capitalDeltas schema checks in inputsAreTrustworthy ───────────────────────
//
// A misspelled kind key in capitalDeltas (e.g. "natrual") is as silent as a
// misspelled shadowPrices key — the ?? 0 fallback swallows it. Likewise, a
// misspelled party ID (e.g. "pp" instead of "p") lands in no party's row.
// Both are now caught by the gate alongside the shadowPrices typo guard.

// Misspelled kind key in capitalDeltas.
const deltaKindTypo = {
  affectedParties: [{
    id: "p", external: true, measurementIntegrity: true, priceVetted: true,
    shadowPrices: { natural: 1 },
  }],
  capitalDeltas: { natrual: { p: -10 } },  // "natrual" instead of "natural"
};
assert(inputsAreTrustworthy(deltaKindTypo).ok === false,
  "gate: misspelled kind key in capitalDeltas is flagged");
assert(inputsAreTrustworthy(deltaKindTypo).reasons.length === 1 &&
  inputsAreTrustworthy(deltaKindTypo).reasons[0].includes("natrual"),
  "gate: names the misspelled kind from capitalDeltas in the reason");

// Misspelled party ID in capitalDeltas.
const deltaPartyTypo = {
  affectedParties: [{
    id: "p", external: true, measurementIntegrity: true, priceVetted: true,
    shadowPrices: { natural: 1 },
  }],
  capitalDeltas: { natural: { pp: -10 } },  // "pp" instead of "p"
};
assert(inputsAreTrustworthy(deltaPartyTypo).ok === false,
  "gate: misspelled party ID in capitalDeltas is flagged");
assert(inputsAreTrustworthy(deltaPartyTypo).reasons.length === 1 &&
  inputsAreTrustworthy(deltaPartyTypo).reasons[0].includes("pp"),
  "gate: names the misspelled party ID from capitalDeltas in the reason");

// Clean capitalDeltas with correct kind and party ID passes.
assert(inputsAreTrustworthy(activity(true, -10, 1, 1, 1)[0]).ok === true,
  "gate: correct capitalDeltas kind and party ID pass schema check");

// ── brakeIsWellFormed: brake-descriptor validation ───────────────────────────
//
// brake = {} and brake = undefined are valid (Q1-only mode, documented).
// What's caught here is values that look numeric but break Q2: negatives,
// NaN, Infinity, strings.

assert(brakeIsWellFormed(undefined).ok === true,
  "brake: undefined → ok (Q1-only mode)");
assert(brakeIsWellFormed({}).ok === true,
  "brake: empty object → ok (all fields default to 0)");
assert(brakeIsWellFormed({ deadweightLoss: 1, enforcementCost: 2, captureRisk: 3 }).ok === true,
  "brake: clean positive numbers → ok");

assert(brakeIsWellFormed({ deadweightLoss: -1 }).ok === false,
  "brake: negative deadweightLoss flagged");
assert(brakeIsWellFormed({ captureRisk: NaN }).ok === false,
  "brake: NaN captureRisk flagged");
assert(brakeIsWellFormed({ enforcementCost: Infinity }).ok === false,
  "brake: Infinity enforcementCost flagged");
assert(brakeIsWellFormed({ deadweightLoss: "3" }).ok === false,
  "brake: string deadweightLoss flagged (typeof !== number)");

// All three fields malformed → three reasons (not short-circuited).
assert(brakeIsWellFormed({
  deadweightLoss: -1, enforcementCost: NaN, captureRisk: "0"
}).reasons.length === 3, "brake: accumulates all reasons, no short-circuit");
