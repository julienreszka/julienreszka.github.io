# Economic Simulator — TODO

## Context

Stage 2 of armey-curve.html explains growth residuals with macro controls.
Current model: 7 variables (R&D, military, capital formation, pop growth, credit, tertiary, log income).
Current Stage 2 R² = 0.3771 on N=88 countries.
Ceiling R² = 0.6692 (17-variable stepwise, N=113). Gap = ~29pp.

---

## Ready to add to armey-curve.html (tested, significant)

### 1. Terms-of-trade volatility — +4.3pp marginal R²

- **Variable**: `TT.PRI.MRCH.XD.WD` (WB merchandise terms-of-trade index)
- **Construction**: SD of year-over-year % changes over 2005–2023 per country
- **Result**: marginal R² = +0.043, β = −0.032 (more volatile → less growth)
- **Key insight**: zero bivariate signal (R²=0.000 alone) but purely orthogonal to
  the development cluster — this is the exogenous shock channel
- Cache: `scripts/cache/wb_TT.PRI.MRCH.XD.WD.json` ✅
- Fetch script: `scripts/fetch-new-vars.mjs` ✅

### 2. Working-age population share — +1.4pp marginal R²

- **Variable**: `SP.POP.1564.TO.ZS` (% of population aged 15–64)
- **Result**: marginal R² = +0.014, β = +0.049 (higher share → more growth)
- **Note**: no N-shrinkage (still N=88, full coverage)
- Cache: `scripts/cache/wb_SP.POP.1564.TO.ZS.json` ✅
- Fetch script: `scripts/fetch-new-vars.mjs` ✅

**Joint gain (both added): +6.2pp** → Stage 2 R² would reach ~0.42

---

## What to do tomorrow

1. **Add ToT volatility + working-age share to armey-curve.html**
   - In `processWorldBankData(...)`: add `tot` and `wa` parameters
   - Fetch both indicators in the WB data loading block
   - Compute `totVol` (SD of YoY changes) and `waAvg` per country
   - Add as 8th + 9th controls in `updateResidualChart()` → `olsK(9 vars, residuals)`
   - Add a chart canvas + `buildResidualScatter` call for each
   - ToT volatility chart label: "Terms-of-trade volatility (SD of annual % changes)"
   - Working-age share label: "Working-age population share (% aged 15–64)"

2. **Consider committing the test scripts** (not yet committed):
   - `scripts/test-new-vars.mjs`
   - `scripts/fetch-new-vars.mjs`
   - `scripts/cache/wb_SP.POP.1564.TO.ZS.json`
   - `scripts/cache/wb_TT.PRI.MRCH.XD.WD.json`

3. **Trade-partner growth — not worth adding yet** (+0.2pp)
   - WB regional average is too blunt a proxy
   - Real implementation would need bilateral trade-share weights (UN Comtrade)
   - Skip for now

4. **PIQ (IEG public investment quality)** — optional footnote only
   - Adds +2.9pp but drops N from 88→64 (structural bias toward WB borrowers)
   - OECD countries missing entirely → consider adding only as a sensitivity note

---

## Key files

| File | Purpose |
|------|---------|
| `economic-simulator/armey-curve.html` | Main simulator (change here for UI) |
| `scripts/ceiling-r2.mjs` | Stepwise R² ceiling = 0.6692 |
| `scripts/test-new-vars.mjs` | Marginal R² for ToT vol + WA share + peer growth |
| `scripts/fetch-new-vars.mjs` | Fetch SP.POP.1564.TO.ZS + TT.PRI.MRCH.XD.WD |
| `scripts/test-piq.mjs` | PIQ marginal R² test |
| `scripts/test-eci.mjs` | ECI marginal R² test (collinear — skip) |
| `scripts/build-piq.mjs` | Build cache/piq.json from IEG ratings |
| `scripts/build-eci.mjs` | Build cache/eci.json from Harvard Growth Lab CSV |
| `scripts/extract-ieg.py` | Parse cache/ieg-ratings.xlsx → cache/ieg-ratings.json |

## Summary of tested candidates

| Variable | Marginal R² | Verdict |
|----------|------------|---------|
| ToT volatility | +0.043 | **Add** |
| Working-age share | +0.014 | **Add** |
| ECI (Harvard) | +0.001 | Skip (collinear with income) |
| PIQ (IEG) | +0.029 | Skip (N-shrinkage, borrower bias) |
| Trade-partner growth | +0.002 | Skip (proxy too blunt) |
