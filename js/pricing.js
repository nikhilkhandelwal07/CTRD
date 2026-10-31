// Quality-based milk price. Base Rs 95 (31 Oct 2026): families get Rs 80 to 100 today; the CTRD pilot pays at the top of that range.
// Base price is paid at 4.0% fat and 8.5% SNF; each 0.1% above or below moves the rate by a step.

export const DEFAULT_PRICE = { basePrice: 95, fatStep: 1, snfStep: 0.5, refFat: 4.0, refSnf: 8.5, breakEven: 160 };

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

// Weekly pay cycle (CTRD, 31 Oct 2026): Sunday to Saturday, paid every Saturday.
// The key is the Sunday that starts the week, so keys sort by date.
const isoOf = (t) => new Date(t).toISOString().slice(0, 10);
export function periodOf(isoDay) {
  const t = Date.parse(isoDay + "T00:00:00Z");
  const dow = new Date(t).getUTCDay();
  const start = t - dow * 86400000, end = start + 6 * 86400000;
  return { key: isoOf(start) + "-w", from: isoOf(start), to: isoOf(end), payDay: isoOf(end) };
}

export const rs = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
