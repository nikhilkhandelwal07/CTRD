// Sample data for the demo. All farmer names and figures are invented.
// Villages are the seven on CTRD's village data chart.
import { DEFAULT_PRICE, rateFor, amountFor, periodOf } from "./pricing.js";

export const iso = (d) => d.toISOString().slice(0, 10);
export const todayIso = () => iso(new Date(Date.now() - new Date().getTimezoneOffset() * 60000));

const VILLAGES = ["Pasumani", "Pasumanipudur", "Manguzhi", "Kunjurpathy", "Perumpathy", "Perukaipathy 1", "Perukaipathy 2"];
const NAMES = [["Lakshmi","ta"],["Murugan","ta"],["Selvi","ml"],["Ravi","ta"],["Kamala","ml"],["Mani","ta"],["Saroja","ta"],
  ["Velu","ta"],["Chellamma","ml"],["Raju","hi"],["Pappathi","ta"],["Kumar","ta"],["Valli","ml"],["Sundaram","ta"],
  ["Ponni","ta"],["Arjun","en"],["Meena","ml"],["Kannan","ta"],["Rani","ta"],["Bala","ml"],["Devi","ta"]];

export function makeSeed() {
  let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const villages = VILLAGES.map((name, i) => ({ id: "v" + (i + 1), name }));
  const farmers = NAMES.map(([name, lang], i) => ({
    id: "f" + (i + 1), name, lang, villageId: villages[i % 7].id, cows: 1 + ((i * 7) % 3),
    phone: "99999000" + String(i + 1).padStart(2, "0"), active: true, createdAt: "2026-10-10",
  }));
  const today = todayIso();
  const days = []; for (let k = 13; k >= 0; k--) days.push(iso(new Date(Date.parse(today) - k * 86400000)));
  const stopped = new Set(["f5", "f14"]);
  const records = []; let n = 0;
  for (const day of days) for (const session of ["AM", "PM"]) {
    if (day === today && session === "PM") continue;
    for (const f of farmers) {
      const k = days.indexOf(day);
      if (stopped.has(f.id) && k >= 10) continue;
      if (day === today && Number(f.id.slice(1)) % 3 === 0) continue;
      if (rnd() < 0.08) continue;
      const litres = Math.max(0.5, Math.round((f.cows * (session === "AM" ? 1.1 : 0.8) + (rnd() - 0.5)) * 2) / 2);
      const fat = Math.round((3.4 + rnd() * 1.2 + (f.villageId === "v3" ? -0.3 : 0)) * 10) / 10;
      const snf = Math.round((7.9 + rnd() * 0.9) * 10) / 10;
      const rate = rateFor(fat, snf, DEFAULT_PRICE);
      const r = rnd(); const call = r < 0.82 ? "answered" : r < 0.95 ? "missed" : "noanswer";
      records.push({ id: "r" + (++n), farmerId: f.id, day, session, litres, fat, snf, rate, amount: amountFor(litres, rate), call, by: "volunteer" });
    }
  }
  // Earlier pay cycles are marked paid, except two farmers (sample) in the most recent closed cycle.
  const payments = {}; const cur = periodOf(today).key;
  const closed = [...new Set(records.map((r) => periodOf(r.day).key))].filter((k) => k < cur).sort();
  closed.forEach((k, i) => farmers.forEach((f) => {
    if (i === closed.length - 1 && (f.id === "f7" || f.id === "f18")) return;
    payments[k + "|" + f.id] = periodOf(k.slice(0, 10)).payDay;
  }));
  return {
    villages, farmers, records, payments,
    settings: { ...DEFAULT_PRICE },
    audit: [{ ts: new Date().toISOString(), who: "system", action: "seed", detail: "Sample data loaded" }],
    pins: null,
  };
}
