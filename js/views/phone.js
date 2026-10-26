// Farmer's phone: a basic keypad phone that receives the spoken slip, and the missed-call line.
import { esc, icon, $, $$ } from "../ui.js";
import { activeFarmers, latestRecord, periodTotal, villageName, byId } from "../calc.js";
import { periodOf, quality, rs } from "../pricing.js";
import { slipText, totalText, menuText, speak, stop, missing, VOICE_LANGS, SLIP } from "../voice.js";

const ph = { state: "idle", farmerId: null, rec: null, lang: null, screen: "" };

export function ring(farmerId, rec) { ph.farmerId = farmerId; ph.rec = rec; ph.state = "ringing"; ph.lang = null; }

export function render(ctx) {
  const { s, t } = ctx;
  const list = activeFarmers(s);
  if (!ph.farmerId || !byId(s.farmers, ph.farmerId)) ph.farmerId = list[0] && list[0].id;
  const f = byId(s.farmers, ph.farmerId);
  const rec = ph.rec || (f && latestRecord(s, f.id));
  const per = rec ? periodOf(rec.day) : periodOf(new Date().toISOString().slice(0, 10));
  const total = f ? periodTotal(s, f.id, per.key) : 0;
  const q = rec ? quality(rec.fat, rec.snf, s.settings) : null;
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
        <div class="row wrap gap-m end">
          <label class="field grow"><span>${t("phone.whose")}</span>
            <select id="ph-farmer">${list.map((x) => `<option value="${x.id}" ${x.id === ph.farmerId ? "selected" : ""}>${esc(x.name)} · ${esc(villageName(s, x.villageId))} · ${t("lang." + x.lang)}</option>`).join("")}</select></label>
          <button class="btn amber" id="ph-missed">${icon("missed")} ${t("phone.missed")}</button>
        </div>
        <ol class="steps">
          <li>${t("phone.step1")}</li><li>${t("phone.step2")}</li><li>${t("phone.step3")}</li>
        </ol>
      </div>
      <div class="panel">
        <div class="row between"><h2>${t("phone.hears")}</h2><span class="muted small">${rec ? `${ctx.fmtDate(rec.day)} · ${t(rec.session === "AM" ? "sess.AM" : "sess.PM")}` : ""}</span></div>
        ${rec ? `<div class="slip">
          <div class="slip-item"><span class="label">${t("slip.poured")}</span><b class="num">${rec.litres} L</b></div>
          <div class="slip-item"><span class="label">${t("slip.quality")}</span><b><span class="pill q-${q}">${t("q." + q)}</span></b><span class="muted small num">${t("slip.fatSnf", { fat: rec.fat, snf: rec.snf })}</span></div>
          <div class="slip-item"><span class="label">${t("slip.amount")}</span><b class="num">${rs(rec.amount)}</b><span class="muted small num">${rs(rec.rate)} / L</span></div>
          <div class="slip-item"><span class="label">${t("slip.total")}</span><b class="num">${rs(total)}</b><span class="muted small">${ctx.fmtRange(per.from, per.to)}</span></div>
          <div class="slip-item"><span class="label">${t("slip.payday")}</span><b>${ctx.fmtDate(per.payDay)}</b></div>
        </div>` : `<p class="muted">${t("phone.noRecord")}</p>`}
        <p class="note">${icon("volume")} ${t("phone.voiceNote")}${missing.size ? " " + t("phone.missingVoice", { langs: [...missing].map((l) => t("lang." + l)).join(", ") }) : ""}</p>
      </div>
    </div>
  </div>`;
}

export function bind(ctx) {
  const { s } = ctx;
  const f = () => byId(s.farmers, ph.farmerId);
  const recNow = () => ph.rec || latestRecord(s, ph.farmerId);
  const payload = () => { const r = recNow(); const p = periodOf(r.day); return { name: f().name, session: r.session, litres: r.litres, quality: quality(r.fat, r.snf, s.settings), amount: r.amount, total: periodTotal(s, f().id, p.key), payDay: p.payDay }; };
  const play = (kind) => {
    if (!recNow()) return;
    const lang = ph.lang || f().lang;
    ph.screen = kind === "total" ? totalText(lang, payload()) : slipText(lang, payload());
    ph.state = "playing"; ctx.rerender();
    speak(ph.screen, lang, () => {});
  };
  $("#ph-farmer").onchange = (e) => { stop(); ph.farmerId = e.target.value; ph.rec = null; ph.state = "idle"; ctx.rerender(); };
  $("#ph-missed").onclick = () => { stop(); ph.rec = null; ph.state = "menu"; ctx.rerender(); speak(menuText(), "ta"); };
  $$(".handset .key").forEach((b) => (b.onclick = () => {
    const k = b.dataset.key;
    if (k === "end") { stop(); ph.state = ph.state === "idle" ? "idle" : "ended"; ph.rec = null; return ctx.rerender(); }
    if (k === "answer" && ph.state === "ringing") { ph.lang = f().lang; return play("slip"); }
    if (ph.state === "menu" && "1234".includes(k)) { ph.lang = VOICE_LANGS[Number(k) - 1]; return play("total"); }
    if (ph.state === "playing" && k === "1") return play("slip");
    if (ph.state === "playing" && k === "2") return play("total");
  }));
}
export const phoneState = ph;
export { SLIP };
