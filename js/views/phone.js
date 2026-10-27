// Farmer's line: what reaches members who may not read or own a smartphone.
//  1. Every pour: the slip is spoken aloud at the collection point (see collect.js).
//  2. Every pay cycle: one call with the cycle total and the payment.
//  3. Any time: a free missed call; the dairy calls back and reads the balance.
import { esc, icon, $, $$ } from "../ui.js";
import { activeFarmers, latestRecord, periodTotal, villageName, byId } from "../calc.js";
import { periodOf, quality, rs } from "../pricing.js";
import { todayIso } from "../seed.js";
import { slipText, totalText, payText, menuText, speak, stop, missing, VOICE_LANGS } from "../voice.js";

const ph = { state: "idle", farmerId: null, lang: null, screen: "", last: null };

function lastClosed(s) {
  const cur = periodOf(todayIso()).key;
  const keys = [...new Set(s.records.map((r) => periodOf(r.day).key))].filter((k) => k < cur).sort();
  return keys[keys.length - 1] || cur;
}
function cycleInfo(s, fid, key) {
  const recs = s.records.filter((r) => r.farmerId === fid && periodOf(r.day).key === key);
  const p = recs[0] ? periodOf(recs[0].day) : periodOf(todayIso());
  return { key, from: p.from, to: p.to, payDay: p.payDay, litres: recs.reduce((a, r) => a + r.litres, 0), total: recs.reduce((a, r) => a + r.amount, 0), paidOn: s.payments[key + "|" + fid] || null };
}

export function render(ctx) {
  const { s, t } = ctx;
  const list = activeFarmers(s);
  if (!ph.farmerId || !byId(s.farmers, ph.farmerId)) ph.farmerId = list[0] && list[0].id;
  const f = byId(s.farmers, ph.farmerId);
  const rec = f && latestRecord(s, f.id);
  const q = rec ? quality(rec.fat, rec.snf, s.settings) : null;
  const cyc = f ? cycleInfo(s, f.id, lastClosed(s)) : null;
  const screen = {
    idle: `<div class="ps-name">${esc(f ? f.name : "")}</div><div class="ps-big">${t("phone.idle")}</div>`,
    ringing: `<div class="ps-name">${t("phone.incoming")}</div><div class="ps-big pulse">${t("phone.dairyCalling")}</div><div class="ps-hint">${t("phone.pressGreen")}</div>`,
    menu: `<div class="ps-name">${t("phone.callback")}</div><div class="ps-big">1 தமிழ் · 2 മലയാളം<br>3 हिंदी · 4 English</div><div class="ps-hint">${t("phone.pickLang")}</div>`,
    playing: `<div class="ps-name">${icon("volume")} ${t("phone.playing")}</div><div class="ps-text">${esc(ph.screen)}</div>`,
    ended: `<div class="ps-name">${t("phone.ended")}</div><div class="ps-big">${t("phone.thanks")}</div>`,
  }[ph.state];
  const keys = ["1","2","3","4","5","6","7","8","9","*","0","#"];
  const hot = (k) => (ph.state === "menu" && "1234".includes(k)) || (ph.state === "playing" && "12".includes(k));
  return `
  <section class="view-head"><div><h1>${t("nav.phone")}</h1><p class="lede">${t("phone.lede")}</p></div></section>
  <div class="phone-layout">
    <div class="handset" role="group" aria-label="${t("phone.handset")}">
      <div class="speaker"></div>
      <div class="pscreen" aria-live="polite">${screen}</div>
      <div class="softkeys">
        <button class="key call ${ph.state === "ringing" ? "hot" : ""}" data-key="answer" aria-label="${t("phone.answer")}">${icon("call")}</button>
        <button class="key endk" data-key="end" aria-label="${t("phone.hangup")}">${icon("end")}</button>
      </div>
      <div class="keypad">${keys.map((k) => `<button class="key ${hot(k) ? "hot" : ""}" data-key="${k}">${k}</button>`).join("")}</div>
    </div>
    <div class="stack">
      <div class="panel">
        <label class="field"><span>${t("phone.whose")}</span>
          <select id="ph-farmer">${list.map((x) => `<option value="${x.id}" ${x.id === ph.farmerId ? "selected" : ""}>${esc(x.name)} · ${esc(villageName(s, x.villageId))} · ${t("lang." + x.lang)}</option>`).join("")}</select></label>
        <div class="row wrap gap-s">
          <button class="btn amber" id="ph-pay">${icon("call")} ${t("phone.payCall")}</button>
          <button class="btn" id="ph-missed">${icon("missed")} ${t("phone.missed")}</button>
        </div>
        <ol class="steps"><li>${t("phone.step1")}</li><li>${t("phone.step2")}</li><li>${t("phone.step3")}</li></ol>
      </div>
      ${cyc ? `<div class="panel">
        <div class="row between"><h2>${t("phone.cycleTitle")}</h2><span class="muted small">${ctx.fmtRange(cyc.from, cyc.to)}</span></div>
        <div class="slip">
          <div class="slip-item"><span class="label">${t("slip.poured")}</span><b class="num">${cyc.litres.toFixed(1)} L</b></div>
          <div class="slip-item"><span class="label">${t("col.amount")}</span><b class="num">${rs(cyc.total)}</b></div>
          <div class="slip-item"><span class="label">${t("col.status")}</span><b>${cyc.paidOn ? `<span class="pill q-good">${t("dash.paid")}</span>` : `<span class="pill q-fair">${t("phone.due")}</span>`}</b><span class="muted small">${ctx.fmtDate(cyc.paidOn || cyc.payDay)}</span></div>
        </div>
      </div>` : ""}
      <div class="panel">
        <div class="row between"><h2>${t("phone.lastPour")}</h2><span class="muted small">${rec ? `${ctx.fmtDate(rec.day)} · ${t(rec.session === "AM" ? "sess.AM" : "sess.PM")}` : ""}</span></div>
        ${rec ? `<div class="slip">
          <div class="slip-item"><span class="label">${t("slip.poured")}</span><b class="num">${rec.litres} L</b></div>
          <div class="slip-item"><span class="label">${t("slip.quality")}</span><b><span class="pill q-${q}">${t("q." + q)}</span></b><span class="muted small num">${t("slip.fatSnf", { fat: rec.fat, snf: rec.snf })}</span></div>
          <div class="slip-item"><span class="label">${t("slip.amount")}</span><b class="num">${rs(rec.amount)}</b><span class="muted small num">${rs(rec.rate)} / L</span></div>
        </div>` : `<p class="muted">${t("phone.noRecord")}</p>`}
        <p class="note">${icon("volume")} ${t("phone.voiceNote")}${missing.size ? " " + t("phone.missingVoice", { langs: [...missing].map((l) => t("lang." + l)).join(", ") }) : ""}</p>
      </div>
    </div>
  </div>`;
}

export function bind(ctx) {
  const { s } = ctx;
  const f = () => byId(s.farmers, ph.farmerId);
  const say = (text, lang) => { ph.screen = text; ph.last = { text, lang }; ph.state = "playing"; ctx.rerender(); speak(text, lang); };
  const pay = (lang) => { const c = cycleInfo(s, f().id, lastClosed(s)); return payText(lang, { name: f().name, litres: c.litres, total: c.total, from: c.from, to: c.to, payDay: c.payDay, paid: !!c.paidOn }); };
  const balance = (lang) => { const p = periodOf(todayIso()); return totalText(lang, { total: periodTotal(s, f().id, p.key), payDay: p.payDay }); };
  $("#ph-farmer").onchange = (e) => { stop(); ph.farmerId = e.target.value; ph.state = "idle"; ctx.rerender(); };
  $("#ph-pay").onclick = () => { stop(); ph.state = "ringing"; ctx.rerender(); };
  $("#ph-missed").onclick = () => { stop(); ph.state = "menu"; ctx.rerender(); speak(menuText(), "ta"); };
  $$(".handset .key").forEach((b) => (b.onclick = () => {
    const k = b.dataset.key;
    if (k === "end") { stop(); ph.state = ph.state === "idle" ? "idle" : "ended"; return ctx.rerender(); }
    if (k === "answer" && ph.state === "ringing") return say(pay(f().lang), f().lang);
    if (ph.state === "menu" && "1234".includes(k)) { const lang = VOICE_LANGS[Number(k) - 1]; return say(balance(lang), lang); }
    if (ph.state === "playing" && k === "1" && ph.last) return say(ph.last.text, ph.last.lang);
    if (ph.state === "playing" && k === "2") return say(balance(ph.last ? ph.last.lang : f().lang), ph.last ? ph.last.lang : f().lang);
  }));
}
export const phoneState = ph;
