// Collection point: the volunteer records each pour; saving rings the farmer with the slip.
import { esc, icon, $, $$, toast } from "../ui.js";
import { activeFarmers, villageName } from "../calc.js";
import { rateFor, quality, amountFor, rs } from "../pricing.js";
import { todayIso } from "../seed.js";
import { ring } from "./phone.js";

const st = { villageId: null, session: null, farmerId: null, litres: 2, fat: 4.0, snf: 8.5 };
const LIMITS = { litres: [0.5, 30, 0.5], fat: [2.5, 7, 0.1], snf: [7, 10, 0.1] };

export function render(ctx) {
  const { s, t } = ctx;
  if (!st.villageId || !s.villages.find((v) => v.id === st.villageId)) st.villageId = s.villages[0] && s.villages[0].id;
  if (!st.session) st.session = new Date().getHours() < 13 ? "AM" : "PM";
  const today = todayIso();
  const list = activeFarmers(s).filter((f) => f.villageId === st.villageId);
  if (!list.find((f) => f.id === st.farmerId)) st.farmerId = (list.find((f) => !done(s, f.id, today)) || list[0] || {}).id;
  const f = list.find((x) => x.id === st.farmerId);
  const rate = rateFor(st.fat, st.snf, s.settings), q = quality(st.fat, st.snf, s.settings);
  const canSave = ctx.can("volunteer");
  const stepper = (k, label, unit) => `<div class="stepper"><span class="label">${label}</span>
      <div class="stepper-row"><button class="step" data-k="${k}" data-d="-1" aria-label="−">−</button>
      <output class="num" id="o-${k}">${st[k].toFixed(k === "litres" ? 1 : 1)}${unit}</output>
      <button class="step" data-k="${k}" data-d="1" aria-label="+">+</button></div></div>`;
  return `
  <section class="view-head"><div><h1>${t("nav.collect")}</h1><p class="lede">${t("collect.lede")}</p></div>
    <div class="row gap-s wrap">
      <label class="field"><span>${t("collect.village")}</span><select id="c-village">${s.villages.map((v) => `<option value="${v.id}" ${v.id === st.villageId ? "selected" : ""}>${esc(v.name)}</option>`).join("")}</select></label>
      <label class="field"><span>${t("collect.session")}</span><select id="c-session"><option value="AM" ${st.session === "AM" ? "selected" : ""}>${t("sess.AM")}</option><option value="PM" ${st.session === "PM" ? "selected" : ""}>${t("sess.PM")}</option></select></label>
    </div></section>
  ${canSave ? "" : `<div class="banner">${icon("lock")} <span>${t("collect.locked")}</span> <button class="btn small" data-signin="volunteer">${t("auth.signIn")}</button></div>`}
  <div class="panel">
    <div class="row between"><h2>${t("collect.pick")}</h2><span class="muted small">${t("collect.doneCount", { n: list.filter((x) => done(s, x.id, today)).length, of: list.length })}</span></div>
    ${list.length ? `<div class="tiles">${list.map((x) => `<button class="tile ${x.id === st.farmerId ? "sel" : ""}" data-f="${x.id}">
        <span class="avatar">${esc(x.name[0])}</span><span class="tile-name">${esc(x.name)}</span>
        <span class="muted small">${t("collect.cows", { n: x.cows })} · ${t("lang." + x.lang)}</span>
        ${done(s, x.id, today) ? `<span class="done">${icon("check")} ${t("collect.recorded")}</span>` : ""}</button>`).join("")}</div>`
      : `<p class="muted">${t("collect.noFarmers")}</p>`}
  </div>
  ${f ? `<div class="panel">
    <div class="steppers">${stepper("litres", t("collect.litres"), " L")}${stepper("fat", t("collect.fat"), "%")}${stepper("snf", t("collect.snf"), "%")}</div>
    <div class="result">
      <div><span class="label">${t("collect.rate")}</span><b class="num big">${rs(rate)}</b><span class="muted"> / L</span></div>
      <div><span class="label">${t("collect.amount")}</span><b class="num big">${rs(amountFor(st.litres, rate))}</b></div>
      <div><span class="label">${t("slip.quality")}</span><span class="pill q-${q}">${t("q." + q)}</span></div>
    </div>
    <div class="row wrap gap-m">
      <button class="btn primary lg" id="c-save" ${canSave ? "" : "disabled"}>${icon("check")} ${t("collect.save")}</button>
      <span class="muted">${t("collect.saveHint", { name: esc(f.name), lang: t("lang." + f.lang) })}</span>
    </div>
  </div>` : ""}`;
}
function done(s, fid, day) { return s.records.some((r) => r.farmerId === fid && r.day === day && r.session === st.session); }

export function bind(ctx) {
  const { s, t } = ctx;
  $("#c-village").onchange = (e) => { st.villageId = e.target.value; st.farmerId = null; ctx.rerender(); };
  $("#c-session").onchange = (e) => { st.session = e.target.value; ctx.rerender(); };
  $$(".tile").forEach((b) => (b.onclick = () => { st.farmerId = b.dataset.f; ctx.rerender(); }));
  $$(".step").forEach((b) => (b.onclick = () => {
    const k = b.dataset.k, [lo, hi, step] = LIMITS[k];
    st[k] = Math.min(hi, Math.max(lo, Math.round((st[k] + step * Number(b.dataset.d)) * 10) / 10)); ctx.rerender();
  }));
  const save = $("#c-save");
  if (save) save.onclick = async () => {
    if (!ctx.can("volunteer")) return ctx.signIn("volunteer");
    const rate = rateFor(st.fat, st.snf, s.settings);
    const rec = await ctx.store.addRecord({ farmerId: st.farmerId, day: todayIso(), session: st.session, litres: st.litres, fat: st.fat, snf: st.snf, rate, amount: amountFor(st.litres, rate), call: "answered" });
    const f = s.farmers.find((x) => x.id === st.farmerId);
    ring(st.farmerId, rec);
    toast(t("collect.saved", { name: f.name, lang: t("lang." + f.lang) }));
    ctx.go("phone");
  };
}
