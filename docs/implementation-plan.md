# 3D Print Calculator — Improvement Implementation Plan

**Created:** 2026-05-18  
**Status:** In Progress  
**Scope:** Phases 1–4 (critical fixes, live rates, new cost factors, cleanup)

---

## Overview

This plan addresses 12 evaluation findings across 9 implementation steps. Each step lists the files touched, the exact changes, and the verification criteria.

**Exchange Rate API:** `https://v6.exchangerate-api.com/v6/add219c4d63370f9799143b8/latest/USD`

---

## Step 1 — Fix Electricity Cost Calculation

**Priority:** High  
**Problem:** `electricityCost` field (default $0.15) is labeled "$/hr" but $0.15 is a per-kWh rate. Formula `hours × electricityCost` treats it as a flat hourly rate, which is wrong. Real cost = `watts × hours × $/kWh / 1000`.

### Files Changed

| File | Change |
|------|--------|
| `types.ts` | Add `printerWattage: number` to `CalculationData` |
| `constants.ts` | Add `printerWattage: 200` to `DEFAULT_VALUES` |
| `App.tsx:74` | Change formula to `(data.printerWattage / 1000) * totalPrintTimeInHours * data.electricityCost` |
| `CalculatorView.tsx` | Add "Printer Wattage (W)" input in electricity OptionalCostSection; relabel rate to "$/kWh"; update rate unit description |
| `pdfService.ts` | Add wattage line to PDF receipt |

### Verification
- [ ] Default: 200W × 4hr × $0.15/kWh = $0.12 (vs. old incorrect $0.60)
- [ ] Wattage field appears in electricity section
- [ ] PDF receipt includes wattage info

---

## Step 2 — Add Machine Depreciation Cost

**Priority:** High  
**Problem:** No accounting for printer wear (hotends, belts, nozzles). Professional shops typically charge $0.10–0.50/hr.

### Files Changed

| File | Change |
|------|--------|
| `types.ts` | Add `includeDepreciation: boolean`, `depreciationRate: number` to `CalculationData`; add `depreciationCost: number` to `CalculatedCosts` |
| `constants.ts` | Add `includeDepreciation: false`, `depreciationRate: 0.25` to `DEFAULT_VALUES` |
| `App.tsx` | Calculate: `effectivePrintTimeSeconds / 3600 * data.depreciationRate`; add to `totalCost` |
| `CalculatorView.tsx` | Add new `OptionalCostSection` for "Machine Depreciation" — rate only, uses effective print time automatically |
| `pdfService.ts` | Add depreciation line in cost breakdown |
| `HistoryView.tsx` | N/A (auto-included via `CalculatedCosts`) |

### Verification
- [ ] Depreciation toggle appears in Step 4
- [ ] When enabled at $0.25/hr with 4hr print time → $1.00 added
- [ ] Shows in breakdown, PDF, and history

---

## Step 3 — Cost Prep Time Under Labor

**Priority:** Medium  
**Problem:** `prepTimeMinutes/Seconds` are tracked but never billed — only used for switch-time derivation in multi-color mode.

### Files Changed

| File | Change |
|------|--------|
| `types.ts` | Add `prepLaborCost: number` to `CalculatedCosts` |
| `App.tsx` | When multi-color + labor enabled: `prepLaborCost = (prepTimeSeconds / 3600) * laborRate`; include in `laborCost` total |
| `CalculatorView.tsx` | Add note in multi-color time overhead: "Prep time is billed under Labor when labor is enabled." Show prep labor cost in breakdown |

### Verification
- [ ] Prep time of 6m23s at $15/hr → ~$1.60 added to labor when both toggles are on
- [ ] No change when labor is disabled
- [ ] Note appears in multi-color section

---

## Step 4 — Live Currency Exchange Rates

**Priority:** High  
**Problem:** Currency rates are hardcoded in `constants.ts` and will drift. API provides daily-updated rates.

### Files Changed

| File | Change |
|------|--------|
| new `services/currencyService.ts` | Fetch rates from API, cache in localStorage (24h TTL matching `time_next_update_unix`), fallback to hardcoded constants |
| `constants.ts` | Add `EXCHANGE_RATE_API_KEY`; expand curated fallback list to ~20 currencies |
| `App.tsx` | On mount: call `fetchRates()`, store rates in state; pass rates + lastUpdated to CalculatorView |
| `CalculatorView.tsx` | Show "Rates updated: [date]" below currency selector; add refresh button; show warning badge if using stale/fallback rates |
| `types.ts` | Add `ratesLastUpdated: string \| null` and `ratesStale: boolean` to relevant props |

### API Details
- **Endpoint:** `https://v6.exchangerate-api.com/v6/add219c4d63370f9799143b8/latest/USD`
- **Response:** `{ result, time_last_update_utc, time_next_update_unix, base_code, conversion_rates: { USD: 1, PHP: 61.664, ... } }`
- **Cache key:** `exchangeRatesCache` in localStorage
- **Cache structure:** `{ rates: {...}, lastUpdated: string, nextUpdate: number }`
- **Fallback:** If API fails and no cache → use hardcoded `CURRENCIES` constants

### Verification
- [ ] Rates load on app mount
- [ ] "Rates updated: [date]" appears near currency selector
- [ ] Refresh button fetches new rates
- [ ] Fallback to hardcoded rates works when offline
- [ ] Currency conversion still works correctly
- [ ] Cache persists across page reloads within 24h

---

## Step 5 — Implement Filament Diameter + Material Type Conversion

**Priority:** Medium  
**Problem:** `filamentDiameter` field exists but is unused. Single density constant doesn't reflect real material differences.

### Files Changed

| File | Change |
|------|--------|
| `types.ts` | Add `materialType: string`, `filamentLengthM: number` to `CalculationData`; add `computedWeightG: number \| null` and `computedLengthM: number \| null` to `CalculatedCosts` |
| `constants.ts` | Replace `FILAMENT_DENSITY_G_CM3 = 1.24` with `FILAMENT_DENSITIES` map: `{ PLA: 1.24, PETG: 1.27, ABS: 1.04, TPU: 1.21, Nylon: 1.12, ASA: 1.07, PC: 1.20 }`; add `materialType: 'PLA'`, `filamentLengthM: 0` defaults |
| `App.tsx` | Auto-compute: volume = π × (d/2)² × length → weight = volume × density; or reverse weight → length. Show computed value when one is entered. |
| `CalculatorView.tsx` | Add material type dropdown; add "Length (m)" input next to weight; show auto-computed counterpart; description explains the conversion |

### Formula
- Weight (g) = π × (diameter_mm / 2)² × length_mm × density_g/cm³ × 0.001 (unit correction mm³→cm³)
- Simplified: weight = π × (d/2)² × L × ρ / 1000

### Verification
- [ ] Material type dropdown shows all 7 types
- [ ] Entering weight auto-computes length (and vice versa)
- [ ] Density changes when material type changes
- [ ] Diameter field now actually used in calculation

---

## Step 6 — Add Failure Risk Buffer

**Priority:** Medium  
**Problem:** No allowance for print failures, calibration waste, or test runs.

### Files Changed

| File | Change |
|------|--------|
| `types.ts` | Add `failureRate: number` to `CalculationData`; add `failureCost: number` to `CalculatedCosts` |
| `constants.ts` | Add `failureRate: 0` to `DEFAULT_VALUES` |
| `App.tsx` | Calculate: `failureCost = materialCost * (failureRate / 100)`; include in `totalCost` |
| `CalculatorView.tsx` | Add "Failure Risk %" input in Step 2 (Material Setup); show in breakdown |
| `pdfService.ts` | Add failure buffer line in cost breakdown |

### Verification
- [ ] Default 0% → no change
- [ ] 10% on $5.00 material → $0.50 added
- [ ] Shows in breakdown and PDF

---

## Step 7 — Add Batch Quantity Pricing

**Priority:** Medium  
**Problem:** No way to price multiple identical parts — users must multiply manually.

### Files Changed

| File | Change |
|------|--------|
| `types.ts` | Add `quantity: number` to `CalculationData`; add `perUnitCost: number`, `perUnitPrice: number` to `CalculatedCosts` |
| `constants.ts` | Add `quantity: 1` to `DEFAULT_VALUES` |
| `App.tsx` | Calculate: `perUnitCost = totalCost`; `perUnitPrice = totalCost + markupPrice + taxAmount`; `finalPrice = perUnitPrice * quantity` |
| `CalculatorView.tsx` | Add "Quantity" input in Step 1 (Order Details); show "Per unit" and "Total for X units" in breakdown |
| `pdfService.ts` | Show quantity, per-unit, and total in PDF |

### Verification
- [ ] Default quantity 1 → no change in final price
- [ ] Quantity 5 with per-unit price $10 → final price $50
- [ ] PDF shows both per-unit and total

---

## Step 8 — Add Sales Tax / VAT

**Priority:** Medium  
**Problem:** No tax calculation — most commercial print pricing includes tax.

### Files Changed

| File | Change |
|------|--------|
| `types.ts` | Add `taxRate: number` to `CalculationData`; add `taxAmount: number` to `CalculatedCosts` |
| `constants.ts` | Add `taxRate: 0` to `DEFAULT_VALUES` |
| `App.tsx` | Calculate: `taxAmount = (totalCost + markupPrice) * (taxRate / 100)`; `finalPrice = (totalCost + markupPrice + taxAmount) * quantity` |
| `CalculatorView.tsx` | Add "Tax Rate %" input in Step 4; show tax line in breakdown before final price |
| `pdfService.ts` | Add tax line in PDF |

### Verification
- [ ] Default 0% → no change
- [ ] 10% tax on $10 subtotal + $20 markup → $3.00 tax
- [ ] Tax applies before quantity multiplication

---

## Step 9 — Expand Currency Selector to ~20 Curated Currencies

**Priority:** Low  
**Problem:** Only 7 hardcoded currencies. API supports 150+.

### Curated Currency List (20)

| Code | Name | Symbol |
|------|------|--------|
| USD | US Dollar | $ |
| PHP | Philippine Peso | ₱ |
| EUR | Euro | € |
| GBP | British Pound | £ |
| CAD | Canadian Dollar | C$ |
| AUD | Australian Dollar | A$ |
| JPY | Japanese Yen | ¥ |
| CNY | Chinese Yuan | ¥ |
| INR | Indian Rupee | ₹ |
| KRW | South Korean Won | ₩ |
| BRL | Brazilian Real | R$ |
| MXN | Mexican Peso | Mex$ |
| CHF | Swiss Franc | Fr |
| SEK | Swedish Krona | kr |
| SGD | Singapore Dollar | S$ |
| NZD | New Zealand Dollar | NZ$ |
| THB | Thai Baht | ฿ |
| AED | UAE Dirham | د.إ |
| ZAR | South African Rand | R |
| NOK | Norwegian Krone | kr |

### Files Changed

| File | Change |
|------|--------|
| `constants.ts` | Expand `CURRENCIES` with 13 additional entries (hardcoded fallback rates) |
| `CalculatorView.tsx` | Group popular currencies at top of select; add search/filter if dropdown gets unwieldy |

### Verification
- [ ] All 20 currencies appear in selector
- [ ] PHP remains in the list
- [ ] Live rates override hardcoded fallbacks when API succeeds

---

## Implementation Order

| Step | Task | Effort | Depends On |
|------|------|--------|------------|
| 1 | Fix electricity (watts + $/kWh) | Small | — |
| 2 | Add depreciation cost | Small | — |
| 3 | Cost prep time | Small | Step 2 (shares labor logic) |
| 4 | Live currency rates | Medium | — |
| 5 | Filament diameter + material type | Medium | — |
| 6 | Failure risk % | Small | Step 1 (shares material section) |
| 7 | Batch quantity | Small | Step 8 (tax must be in place) |
| 8 | Sales tax / VAT | Small | — |
| 9 | Expand currency selector | Medium | Step 4 (needs live rate infrastructure) |

Steps 1–3 can be done sequentially. Steps 4–9 have some parallelism but are safest done in order since they share types and constants.

---

## Final Cost Formula (After All Steps)

```
effectivePrintHours = (effectivePrintTimeSeconds) / 3600

materialCost         = (weight/1000) × pricePerKg                         [+ failure buffer]
failureCost          = materialCost × (failureRate / 100)
electricityCost      = (printerWattage / 1000) × effectivePrintHours × $/kWh
laborCost            = laborHours × laborRate + prepLaborCost
postProcessingCost   = postProcessingHours × postProcessingRate
depreciationCost     = effectivePrintHours × depreciationRate

totalCost            = materialCost + failureCost + electricityCost + laborCost + postProcessingCost + depreciationCost
markupPrice          = totalCost × (markup / 100)
taxAmount            = (totalCost + markupPrice) × (taxRate / 100)

perUnitPrice         = totalCost + markupPrice + taxAmount
finalPrice           = perUnitPrice × quantity
```
