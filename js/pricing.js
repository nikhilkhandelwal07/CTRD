// Quality-based milk price, from the dairy unit economics (DPR-05/06, 26 Oct 2026).
// Base price is paid at 4.0% fat and 8.5% SNF; each 0.1% above or below moves the rate by a step.

export const DEFAULT_PRICE = { basePrice: 60, fatStep: 1, snfStep: 0.5, refFat: 4.0, refSnf: 8.5 };

export function rateFor(fat, snf, p = DEFAULT_PRICE) {
  const r = p.basePrice + (fat - p.refFat) * 10 * p.fatStep + (snf - p.refSnf) * 10 * p.snfStep;
  return Math.max(0, Math.round(r * 2) / 2);
}

export function quality(fat, snf, p = DEFAULT_PRICE) {
  if (fat >= p.refFat && snf >= p.refSnf) return "good";
  if (fat >= p.refFat - 0.5 && snf >= p.refSnf - 0.5) return "fair";
  return "low";
}

export const amountFor = (litres, rate) => Math.round(litres * rate * 100) / 100;

// Pay cycles of about 10 days: 1-10, 11-20, 21-end of month. Paid on the last day of each cycle.
export function periodOf(isoDay) {
  const [y, m, d] = isoDay.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  const idx = d <= 10 ? 0 : d <= 20 ? 1 : 2;
  const from = [1, 11, 21][idx], to = [10, 20, last][idx];
  const mm = String(m).padStart(2, "0");
  return { key: `${y}-${mm}-p${idx + 1}`, from: `${y}-${mm}-${String(from).padStart(2, "0")}`, to: `${y}-${mm}-${String(to).padStart(2, "0")}`, payDay: `${y}-${mm}-${String(to).padStart(2, "0")}` };
}

export const rs = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
