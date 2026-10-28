// Settings: price rule, access PINs, data storage and the activity log.
import { esc, icon, $, toast, confirmDialog } from "../ui.js";
import { rateFor, rs } from "../pricing.js";

export function render(ctx) {
  const { s, t, store } = ctx; const admin = ctx.can("admin"); const p = s.settings;
  const ex = [[4.0, 8.5], [4.5, 8.7], [3.6, 8.1]];
  return `
  <section class="view-head"><div><h1>${t("nav.settings")}</h1><p class="lede">${t("set.lede")}</p></div></section>
  ${admin ? "" : `<div class="banner">${icon("lock")} <span>${t("set.locked")}</span> <button class="btn small" data-signin="admin">${t("auth.signInAdmin")}</button></div>`}
  <div class="grid-2">
    <div class="panel"><h2>${t("set.price")}</h2>
      <form id="price-form" class="form">
        <div class="row gap-m wrap">
          <label class="field grow"><span>${t("set.base")}</span><input id="p-base" name="basePrice" type="number" step="0.5" min="0" value="${p.basePrice}" ${admin ? "" : "disabled"}></label>
          <label class="field grow"><span>${t("set.fatStep")}</span><input id="p-fat" name="fatStep" type="number" step="0.1" min="0" value="${p.fatStep}" ${admin ? "" : "disabled"}></label>
          <label class="field grow"><span>${t("set.snfStep")}</span><input id="p-snf" name="snfStep" type="number" step="0.1" min="0" value="${p.snfStep}" ${admin ? "" : "disabled"}></label>
          <label class="field grow"><span>${t("set.breakEven")}</span><input id="p-be" name="breakEven" type="number" step="1" min="1" value="${p.breakEven || 160}" ${admin ? "" : "disabled"}></label>
        </div>
        ${admin ? `<button class="btn primary" type="submit">${t("btn.save")}</button>` : ""}
      </form>
      <table class="mini"><thead><tr><th>${t("col.fat")}</th><th>SNF %</th><th class="r">${t("collect.rate")}</th></tr></thead>
      <tbody>${ex.map(([f, n]) => `<tr><td class="num">${f.toFixed(1)}</td><td class="num">${n.toFixed(1)}</td><td class="r num">${rs(rateFor(f, n, p))} / L</td></tr>`).join("")}</tbody></table>
      <p class="muted small">${t("set.priceNote")} ${t("set.breakEvenNote")}</p>
    </div>
    <div class="stack">
      <div class="panel"><h2>${t("set.access")}</h2>
        <p class="muted">${t("set.roles")}</p>
        <ul class="roles"><li><b>${t("role.admin")}</b> ${t("set.roleAdmin")}</li><li><b>${t("role.volunteer")}</b> ${t("set.roleVol")}</li><li><b>${t("role.viewer")}</b> ${t("set.roleViewer")}</li></ul>
        ${admin && store.mode === "local" ? `<form id="pin-form" class="form row gap-m wrap end">
          <label class="field"><span>${t("set.pinFor")}</span><select id="pin-role" name="role"><option value="admin">${t("role.admin")}</option><option value="volunteer">${t("role.volunteer")}</option></select></label>
          <label class="field"><span>${t("set.newPin")}</span><input id="pin-new" name="pin" inputmode="numeric" pattern="[0-9]{4,8}" maxlength="8" required></label>
          <button class="btn ghost" type="submit">${t("set.changePin")}</button></form>` : ""}
      </div>
      <div class="panel"><h2>${t("set.data")}</h2>
        <p>${store.mode === "local" ? t("set.modeLocal") : t("set.modeCloud")}</p>
        ${admin && store.mode === "local" ? `<button class="btn danger-ghost" id="reset">${t("set.reset")}</button>` : ""}
      </div>
    </div>
  </div>
  <div class="panel"><h2>${t("set.log")}</h2>
    ${admin ? `<div class="table-wrap"><table><thead><tr><th>${t("col.when")}</th><th>${t("col.who")}</th><th>${t("col.what")}</th></tr></thead><tbody>
    ${s.audit.slice(0, 40).map((a) => `<tr><td class="num nowrap">${ctx.fmtDate(a.ts.slice(0, 10))} ${a.ts.slice(11, 16)}</td><td>${esc(a.who)}</td><td>${esc(t("act." + a.action, {}, a.action))} <span class="muted">${esc(a.detail || "")}</span></td></tr>`).join("")}
    </tbody></table></div>` : `<p class="muted">${t("set.logLocked")}</p>`}
  </div>`;
}

export function bind(ctx) {
  const { t, store } = ctx; if (!ctx.can("admin")) return;
  $("#price-form").onsubmit = async (e) => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
    const v = { basePrice: Number(d.basePrice), fatStep: Number(d.fatStep), snfStep: Number(d.snfStep), breakEven: Number(d.breakEven) };
    if (Object.values(v).some((x) => !isFinite(x) || x < 0)) return toast(t("set.errPrice"), "bad");
    await store.setSettings(v); toast(t("set.priceSaved", { p: v.basePrice })); ctx.rerender();
  };
  const pf = $("#pin-form"); if (pf) pf.onsubmit = async (e) => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(pf));
    if (!/^[0-9]{4,8}$/.test(d.pin)) return toast(t("set.errPin"), "bad");
    await store.setPin(d.role, d.pin); toast(t("set.pinSaved")); pf.reset();
  };
  const r = $("#reset"); if (r) r.onclick = async () => {
    if (await confirmDialog({ title: t("set.resetTitle"), body: t("set.resetBody"), ok: t("set.reset"), cancel: t("btn.cancel"), danger: true })) { await store.reset(); await store.signOut(); ctx.refreshUser(); toast(t("set.resetDone")); ctx.rerender(); }
  };
}
