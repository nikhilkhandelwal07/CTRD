// Dashboard for CTRD and the dairy company.
import { esc, icon, $, $$, dialog, toast } from "../ui.js";
import { dashboard, villageName, periodTotal, byId } from "../calc.js";
import { rs } from "../pricing.js";

function chart(ctx, d) {
  const W = 640, H = 230, L = 40, R = 12, T = 14, B = 26;
  const max = Math.max(20, ...d.perDay.map((x) => x.litres)) * 1.15;
  const step = max > 400 ? 100 : max > 150 ? 50 : 20;
  const y = (v) => T + (H - T - B) * (1 - v / max);
  const bw = (W - L - R) / d.perDay.length;
  const ticks = []; for (let v = 0; v <= max; v += step) ticks.push(v);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${ctx.t("dash.chartTitle")}">
    ${ticks.map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" class="axis">${v}</text>`).join("")}
    ${d.perDay.map((p, i) => { const isToday = i === d.perDay.length - 1; const x = L + i * bw + bw * 0.18, h = H - B - y(p.litres);
      return `<rect x="${x}" y="${y(p.litres)}" width="${bw * 0.64}" height="${Math.max(0, h)}" rx="3" class="${isToday ? "bar today" : "bar"}"><title>${ctx.fmtDate(p.day)}: ${p.litres.toFixed(1)} L</title></rect>
        ${i % 2 === 1 || isToday ? `<text x="${x + bw * 0.32}" y="${H - 8}" text-anchor="middle" class="axis">${isToday ? ctx.t("dash.today") : Number(p.day.slice(8))}</text>` : ""}`; }).join("")}
  </svg>`;
}


// Break-even shown as progress, not as a line the daily bars can never reach.
const BREAK_EVEN = 112; // L/day: co-packing, Rs 100 to farmers, Rs 150 to households (DPR-07, 27 Oct)
function progress(ctx, d) {
  const { t } = ctx;
  const last7 = d.perDay.slice(-8, -1); const avg7 = last7.reduce((a, x) => a + x.litres, 0) / Math.max(1, last7.length);
  const pct = Math.min(100, Math.round((avg7 / BREAK_EVEN) * 100));
  const gap = Math.max(0, BREAK_EVEN - avg7);
  return `<div class="panel"><div class="row between"><h2>${t("dash.beTitle")}</h2><b class="num">${pct}%</b></div>
    <div class="meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="${t("dash.beTitle")}"><span style="width:${pct}%"></span></div>
    <p class="small">${t("dash.beBody", { avg: avg7.toFixed(0), be: BREAK_EVEN })}</p>
    ${gap > 0 ? `<p class="muted small">${t("dash.beGap", { n: gap.toFixed(0), cows: Math.ceil(gap / 2) })}</p>` : `<p class="small">${t("dash.beDone")}</p>`}
  </div>`;
}

export function render(ctx) {
  const { s, t } = ctx; const d = dashboard(s);
  const kpi = (label, value, sub, tone = "") => `<div class="kpi ${tone}"><span class="label">${label}</span><b class="num">${value}</b><span class="muted small">${sub}</span></div>`;
  return `
  <section class="view-head"><div><h1>${t("nav.dash")}</h1><p class="lede">${t("dash.lede")}</p></div><span class="chip">${ctx.fmtDate(d.today)}</span></section>
  <div class="kpis">
    ${kpi(t("dash.milkToday"), d.todayLitres.toFixed(1) + " L", t("dash.yesterday", { l: d.yesterdayLitres.toFixed(1) }))}
    ${kpi(t("dash.poured"), `${d.pouredToday} / ${d.activeCount}`, t("dash.notYet", { n: d.activeCount - d.pouredToday }))}
    ${kpi(t("dash.quality7"), d.fat7.toFixed(1) + "% " + t("dash.fat"), d.snf7.toFixed(1) + "% SNF")}
    ${kpi(t("dash.due"), rs(d.due), t("dash.payOn", { d: ctx.fmtDate(d.cur.payDay) }))}
    ${kpi(t("dash.paidOnTime"), d.paidShare === null ? "–" : Math.round(d.paidShare * 100) + "%", t("dash.paidOnTimeSub", { n: d.unpaidLast }), d.paidShare !== null && d.paidShare < 0.9 ? "warn" : "")}
  </div>
  <div class="grid-2">
    <div class="panel"><div class="row between"><h2>${t("dash.chartTitle")}</h2><span class="muted small">${t("dash.chartUnit")}</span></div>${chart(ctx, d)}
      <p class="muted small">${t("dash.chartNote")}</p></div>
    <div class="stack">
    ${progress(ctx, d)}
    <div class="panel"><h2>${t("dash.attention")}</h2>
      ${d.attention.length ? `<ul class="alerts">${d.attention.map((a) => `<li class="alert ${a.level}"><span class="dot"></span><span>${a.kind === "stopped"
        ? t("dash.stopped", { name: esc(a.farmer.name), village: esc(villageName(s, a.farmer.villageId)), d: ctx.fmtDate(a.since) })
        : t("dash.unpaid", { name: esc(a.farmer.name), amt: rs(a.amount) })}</span></li>`).join("")}</ul>` : `<p class="muted">${t("dash.allClear")}</p>`}
    </div>
    </div>
  </div>
  <div class="panel"><h2>${t("dash.villages")}</h2>
    <div class="table-wrap"><table><thead><tr><th>${t("col.village")}</th><th class="r">${t("col.farmers")}</th><th class="r">${t("col.lpd")}</th><th class="r">${t("col.fat")}</th><th class="r">SNF %</th><th>${t("slip.quality")}</th></tr></thead>
    <tbody>${d.villages.map((v) => `<tr><td>${esc(v.v.name)}</td><td class="r num">${v.farmers}</td><td class="r num">${v.litresPerDay.toFixed(1)}</td><td class="r num">${v.fat ? v.fat.toFixed(1) : "–"}</td><td class="r num">${v.snf ? v.snf.toFixed(1) : "–"}</td><td>${v.q ? `<span class="pill q-${v.q}">${t("q." + v.q)}</span>` : "–"}</td></tr>`).join("")}</tbody></table></div>
  </div>
  <div class="panel"><div class="row between"><h2>${t("dash.payments")}</h2>${ctx.can("admin") ? "" : `<span class="muted small">${icon("lock")} ${t("dash.payLocked")}</span>`}</div>
    <div class="table-wrap"><table><thead><tr><th>${t("col.period")}</th><th class="r">${t("col.amount")}</th><th>${t("col.status")}</th><th></th></tr></thead>
    <tbody>${d.periods.map((p) => `<tr><td>${ctx.fmtRange(p.from, p.to)}<div class="muted small">${t("dash.payOn", { d: ctx.fmtDate(p.payDay) })}</div></td>
      <td class="r num">${rs(p.total)}</td>
      <td>${p.open ? `<span class="pill neutral">${t("dash.running")}</span>` : p.unpaid.length ? `<span class="pill q-fair">${t("dash.pending", { n: p.unpaid.length })}</span>` : `<span class="pill q-good">${t("dash.allPaid")}</span>`}</td>
      <td class="r">${ctx.can("admin") && !p.open ? `<button class="btn small ghost" data-period="${p.key}">${t("dash.manage")}</button>` : ""}</td></tr>`).join("")}</tbody></table></div>
  </div>`;
}

export function bind(ctx) {
  const { s, t } = ctx;
  $$("[data-period]").forEach((b) => (b.onclick = async () => {
    const key = b.dataset.period;
    const fids = [...new Set(s.records.filter((r) => r.day && ctx.periodKey(r.day) === key).map((r) => r.farmerId))];
    const rows = fids.map((id) => ({ f: byId(s.farmers, id), amt: periodTotal(s, id, key), paid: !!s.payments[key + "|" + id] })).filter((x) => x.f);
    await dialog(`<h2 class="dlg-title">${t("dash.manageTitle")}</h2>
      <div class="table-wrap dlg-scroll"><table><thead><tr><th>${t("col.farmer")}</th><th class="r">${t("col.amount")}</th><th>${t("col.status")}</th></tr></thead><tbody>
      ${rows.map((x) => `<tr><td>${esc(x.f.name)}</td><td class="r num">${rs(x.amt)}</td><td><label class="switch"><input type="checkbox" data-pay="${x.f.id}" ${x.paid ? "checked" : ""}> <span>${t("dash.paid")}</span></label></td></tr>`).join("")}
      </tbody></table></div><div class="dlg-actions"><button class="btn primary" data-close="done">${t("btn.done")}</button></div>`, {
      onOpen: (box) => box.querySelectorAll("[data-pay]").forEach((c) => (c.onchange = async () => { await ctx.store.setPaid(key, c.dataset.pay, c.checked); toast(t("dash.payUpdated")); })),
    });
    ctx.rerender();
  }));
}
