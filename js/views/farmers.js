// Farmers and villages. Only a signed-in CTRD admin can add, edit, remove or delete.
import { esc, icon, $, $$, dialog, confirmDialog, toast } from "../ui.js";
import { latestRecord, periodTotal, villageName, byId } from "../calc.js";
import { periodOf, rs } from "../pricing.js";
import { todayIso } from "../seed.js";

const fs = { q: "", village: "", archived: false };
const LANGS = ["ta", "ml", "hi", "en"];

export function render(ctx) {
  const { s, t } = ctx; const admin = ctx.can("admin");
  const cur = periodOf(todayIso()).key;
  const rows = s.farmers.filter((f) => (fs.archived ? f.active === false : f.active !== false))
    .filter((f) => !fs.village || f.villageId === fs.village)
    .filter((f) => !fs.q || f.name.toLowerCase().includes(fs.q.toLowerCase()))
    .sort((a, b) => villageName(s, a.villageId).localeCompare(villageName(s, b.villageId)) || a.name.localeCompare(b.name));
  return `
  <section class="view-head"><div><h1>${t("nav.farmers")}</h1><p class="lede">${t("farm.lede")}</p></div>
    ${admin ? `<button class="btn primary" id="f-add">${icon("plus")} ${t("farm.add")}</button>` : ""}</section>
  ${admin ? "" : `<div class="banner">${icon("lock")} <span>${t("farm.locked")}</span> <button class="btn small" data-signin="admin">${t("auth.signInAdmin")}</button></div>`}
  <div class="panel">
    <div class="toolbar">
      <label class="field grow"><span>${t("farm.search")}</span><input id="f-q" type="search" value="${esc(fs.q)}" placeholder="${t("farm.searchPh")}"></label>
      <label class="field"><span>${t("collect.village")}</span><select id="f-village"><option value="">${t("farm.allVillages")}</option>${s.villages.map((v) => `<option value="${v.id}" ${v.id === fs.village ? "selected" : ""}>${esc(v.name)}</option>`).join("")}</select></label>
      <label class="switch"><input type="checkbox" id="f-arch" ${fs.archived ? "checked" : ""}> <span>${t("farm.showArchived")}</span></label>
    </div>
    <div class="table-wrap"><table class="farmers"><thead><tr>
      <th>${t("col.farmer")}</th><th>${t("col.village")}</th><th>${t("col.lang")}</th><th class="r">${t("col.cows")}</th><th>${t("col.phone")}</th><th>${t("col.last")}</th><th class="r">${t("col.thisPeriod")}</th>${admin ? "<th></th>" : ""}</tr></thead>
    <tbody>${rows.map((f) => { const lr = latestRecord(s, f.id); return `<tr>
      <td><span class="avatar sm">${esc(f.name[0])}</span> ${esc(f.name)}</td><td>${esc(villageName(s, f.villageId))}</td><td>${t("lang." + f.lang)}</td>
      <td class="r num">${f.cows}</td><td class="num muted">${f.phone ? (admin ? esc(f.phone) : "••••••" + esc(String(f.phone).slice(-4))) : "–"}</td>
      <td>${lr ? ctx.fmtDate(lr.day) : "–"}</td><td class="r num">${rs(periodTotal(s, f.id, cur))}</td>
      ${admin ? `<td class="r nowrap">${f.active === false
        ? `<button class="btn small ghost" data-restore="${f.id}">${t("farm.restore")}</button> <button class="btn small danger-ghost" data-del="${f.id}">${icon("trash")} ${t("farm.delete")}</button>`
        : `<button class="btn small ghost" data-edit="${f.id}">${icon("edit")} ${t("farm.edit")}</button> <button class="btn small danger-ghost" data-arch="${f.id}">${t("farm.remove")}</button>`}</td>` : ""}
    </tr>`; }).join("") || `<tr><td colspan="8" class="muted">${t("farm.none")}</td></tr>`}</tbody></table></div>
    <p class="muted small">${t("farm.count", { n: rows.length })}</p>
  </div>
  <div class="panel"><div class="row between"><h2>${t("farm.villages")}</h2>${admin ? `<button class="btn small ghost" id="v-add">${icon("plus")} ${t("farm.addVillage")}</button>` : ""}</div>
    <ul class="vlist">${s.villages.map((v) => { const n = s.farmers.filter((f) => f.villageId === v.id && f.active !== false).length; return `<li>
      <span>${esc(v.name)}</span><span class="muted small">${t("farm.nFarmers", { n })}</span>
      ${admin ? `<span class="row gap-s"><button class="btn small ghost" data-vedit="${v.id}">${t("farm.rename")}</button>${n === 0 ? `<button class="btn small danger-ghost" data-vdel="${v.id}">${t("farm.delete")}</button>` : ""}</span>` : ""}</li>`; }).join("")}</ul>
  </div>`;
}

function farmerForm(ctx, f) {
  const { s, t } = ctx; f = f || { name: "", villageId: fs.village || (s.villages[0] || {}).id, lang: "ta", cows: 1, phone: "" };
  return `<h2 class="dlg-title">${f.id ? t("farm.editTitle") : t("farm.addTitle")}</h2>
  <form class="form" id="farmer-form" novalidate>
    <label class="field"><span>${t("farm.name")}</span><input name="name" id="ff-name" required maxlength="60" value="${esc(f.name)}"></label>
    <div class="row gap-m wrap">
      <label class="field grow"><span>${t("collect.village")}</span><select name="villageId" id="ff-village">${s.villages.map((v) => `<option value="${v.id}" ${v.id === f.villageId ? "selected" : ""}>${esc(v.name)}</option>`).join("")}</select></label>
      <label class="field grow"><span>${t("farm.voiceLang")}</span><select name="lang" id="ff-lang">${LANGS.map((l) => `<option value="${l}" ${l === f.lang ? "selected" : ""}>${t("lang." + l)}</option>`).join("")}</select></label>
    </div>
    <div class="row gap-m wrap">
      <label class="field grow"><span>${t("farm.cows")}</span><input name="cows" id="ff-cows" type="number" min="0" max="50" value="${f.cows}"></label>
      <label class="field grow"><span>${t("farm.phone")}</span><input name="phone" id="ff-phone" inputmode="tel" pattern="[0-9 +]{10,15}" value="${esc(f.phone || "")}" placeholder="98xxxxxxxx"></label>
    </div>
    <p class="err" id="ff-err" hidden></p>
    <div class="dlg-actions"><button type="button" class="btn ghost" data-close="">${t("btn.cancel")}</button><button class="btn primary" type="submit">${t("btn.save")}</button></div>
  </form>`;
}

export function bind(ctx) {
  const { s, t, store } = ctx;
  $("#f-q").oninput = (e) => { fs.q = e.target.value; ctx.rerender({ keepFocus: "#f-q" }); };
  $("#f-village").onchange = (e) => { fs.village = e.target.value; ctx.rerender(); };
  $("#f-arch").onchange = (e) => { fs.archived = e.target.checked; ctx.rerender(); };
  if (!ctx.can("admin")) return;
  const openForm = async (f) => {
    const data = await dialog(farmerForm(ctx, f), { onOpen: (box, close) => {
      const form = box.querySelector("form");
      form.onsubmit = (e) => { e.preventDefault(); const d = Object.fromEntries(new FormData(form)); const err = box.querySelector("#ff-err");
        if (!d.name.trim()) { err.textContent = t("farm.errName"); err.hidden = false; return; }
        if (d.phone && !/^[0-9 +]{10,15}$/.test(d.phone)) { err.textContent = t("farm.errPhone"); err.hidden = false; return; }
        close(d); };
    } });
    if (!data) return;
    await store.upsertFarmer({ ...(f || {}), name: data.name.trim(), villageId: data.villageId, lang: data.lang, cows: Math.max(0, Number(data.cows) || 0), phone: data.phone.trim() });
    toast(f ? t("farm.saved", { name: data.name }) : t("farm.added", { name: data.name })); ctx.rerender();
  };
  const add = $("#f-add"); if (add) add.onclick = () => openForm(null);
  $$("[data-edit]").forEach((b) => (b.onclick = () => openForm(byId(s.farmers, b.dataset.edit))));
  $$("[data-arch]").forEach((b) => (b.onclick = async () => {
    const f = byId(s.farmers, b.dataset.arch);
    if (await confirmDialog({ title: t("farm.removeTitle", { name: f.name }), body: t("farm.removeBody"), ok: t("farm.remove"), cancel: t("btn.cancel") })) {
      await store.removeFarmer(f.id, false); toast(t("farm.removed", { name: f.name })); ctx.rerender(); }
  }));
  $$("[data-restore]").forEach((b) => (b.onclick = async () => { await store.restoreFarmer(b.dataset.restore); ctx.rerender(); }));
  $$("[data-del]").forEach((b) => (b.onclick = async () => {
    const f = byId(s.farmers, b.dataset.del); const n = s.records.filter((r) => r.farmerId === f.id).length;
    if (n) return confirmDialog({ title: t("farm.cantDelete"), body: t("farm.cantDeleteBody", { n }), ok: t("btn.ok"), cancel: t("btn.cancel") });
    if (await confirmDialog({ title: t("farm.deleteTitle", { name: f.name }), body: t("farm.deleteBody"), ok: t("farm.delete"), cancel: t("btn.cancel"), danger: true })) {
      await store.removeFarmer(f.id, true); toast(t("farm.deleted", { name: f.name })); ctx.rerender(); }
  }));
  const vform = (v) => `<h2 class="dlg-title">${v ? t("farm.rename") : t("farm.addVillage")}</h2><form class="form"><label class="field"><span>${t("col.village")}</span><input name="name" id="vf-name" required maxlength="40" value="${esc(v ? v.name : "")}"></label>
    <div class="dlg-actions"><button type="button" class="btn ghost" data-close="">${t("btn.cancel")}</button><button class="btn primary" type="submit">${t("btn.save")}</button></div></form>`;
  const va = $("#v-add"); if (va) va.onclick = async () => { const d = await dialog(vform(null)); if (d && d.name.trim()) { await store.upsertVillage({ name: d.name.trim() }); ctx.rerender(); } };
  $$("[data-vedit]").forEach((b) => (b.onclick = async () => { const v = byId(s.villages, b.dataset.vedit); const d = await dialog(vform(v)); if (d && d.name.trim()) { await store.upsertVillage({ ...v, name: d.name.trim() }); ctx.rerender(); } }));
  $$("[data-vdel]").forEach((b) => (b.onclick = async () => { const v = byId(s.villages, b.dataset.vdel);
    if (await confirmDialog({ title: t("farm.deleteTitle", { name: v.name }), body: t("farm.vDeleteBody"), ok: t("farm.delete"), cancel: t("btn.cancel"), danger: true })) { await store.removeVillage(v.id); ctx.rerender(); } }));
}
