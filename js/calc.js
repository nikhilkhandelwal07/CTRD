// Read-only calculations over the current state.
import { periodOf, quality } from "./pricing.js";
import { todayIso } from "./seed.js";

export const byId = (list, id) => list.find((x) => x.id === id);
export const villageName = (s, id) => (byId(s.villages, id) || { name: "?" }).name;
export const activeFarmers = (s) => s.farmers.filter((f) => f.active !== false);

export function latestRecord(s, farmerId) {
  let best = null;
  for (const r of s.records) if (r.farmerId === farmerId && (!best || r.day > best.day || (r.day === best.day && r.session > best.session))) best = r;
  return best;
}
export function periodTotal(s, farmerId, key) {
  return s.records.filter((r) => r.farmerId === farmerId && periodOf(r.day).key === key).reduce((a, r) => a + r.amount, 0);
}
export const avg = (rows, k) => (rows.length ? rows.reduce((a, r) => a + r[k], 0) / rows.length : 0);

export function dashboard(s) {
  const today = todayIso();
  const days = []; for (let k = 13; k >= 0; k--) days.push(new Date(Date.parse(today) - k * 86400000).toISOString().slice(0, 10));
  const perDay = days.map((d) => ({ day: d, litres: s.records.filter((r) => r.day === d).reduce((a, r) => a + r.litres, 0) }));
  const af = activeFarmers(s);
  const todayRecs = s.records.filter((r) => r.day === today);
  const yest = perDay[perDay.length - 2] || { litres: 0 };
  const last7 = s.records.filter((r) => r.day > days[6]);
  const cur = periodOf(today);
  const due = s.records.filter((r) => periodOf(r.day).key === cur.key).reduce((a, r) => a + r.amount, 0);
  const calls = last7.length ? last7.filter((r) => r.call === "answered").length / last7.length : 0;
  const missedCalls = last7.filter((r) => r.call && r.call !== "answered").length;

  const attention = [];
  for (const f of af) {
    const lr = latestRecord(s, f.id);
    if (lr && Date.parse(today) - Date.parse(lr.day) >= 3 * 86400000) attention.push({ kind: "stopped", level: "bad", farmer: f, since: lr.day });
  }
  const keys = [...new Set(s.records.map((r) => periodOf(r.day).key))].filter((k) => k < cur.key).sort();
  const lastClosed = keys[keys.length - 1];
  if (lastClosed) for (const f of af) {
    const tot = periodTotal(s, f.id, lastClosed);
    if (tot > 0 && !s.payments[lastClosed + "|" + f.id]) attention.push({ kind: "unpaid", level: "warn", farmer: f, period: lastClosed, amount: tot });
  }
  const villages = s.villages.map((v) => {
    const rows = last7.filter((r) => { const f = byId(s.farmers, r.farmerId); return f && f.villageId === v.id; });
    const fat = avg(rows, "fat"), snf = avg(rows, "snf");
    return { v, farmers: af.filter((f) => f.villageId === v.id).length, litresPerDay: rows.reduce((a, r) => a + r.litres, 0) / 7, fat, snf, q: rows.length ? quality(fat, snf, s.settings) : null };
  });
  const periods = keys.concat(cur.key).slice(-3).map((k) => {
    const recs = s.records.filter((r) => periodOf(r.day).key === k);
    const total = recs.reduce((a, r) => a + r.amount, 0);
    const fids = [...new Set(recs.map((r) => r.farmerId))];
    const unpaid = fids.filter((id) => !s.payments[k + "|" + id]);
    const paidAmt = fids.filter((id) => s.payments[k + "|" + id]).reduce((a, id) => a + periodTotal(s, id, k), 0);
    const any = recs[0] ? periodOf(recs[0].day) : periodOf(today);
    return { key: k, from: any.from, to: any.to, payDay: any.payDay, total, paidAmt, unpaid, open: k === cur.key };
  }).reverse();
  const lastP = periods.find((p) => !p.open);
  const lastFids = lastP ? [...new Set(s.records.filter((r) => periodOf(r.day).key === lastP.key).map((r) => r.farmerId))] : [];
  const paidShare = lastFids.length ? (lastFids.length - lastP.unpaid.length) / lastFids.length : null;
  return {
    paidShare, unpaidLast: lastP ? lastP.unpaid.length : 0,
    today, perDay, todayLitres: todayRecs.reduce((a, r) => a + r.litres, 0), yesterdayLitres: yest.litres,
    pouredToday: new Set(todayRecs.map((r) => r.farmerId)).size, activeCount: af.length,
    fat7: avg(last7, "fat"), snf7: avg(last7, "snf"), due, cur, calls, missedCalls, attention, villages, periods,
  };
}
