// App shell: navigation, language, sign-in, and rendering of the five views.
import { createStore } from "./store.js";
import { STRINGS, UI_LANGS } from "./i18n.js";
import { esc, icon, $, $$, dialog, toast } from "./ui.js";
import { periodOf } from "./pricing.js";
import * as phone from "./views/phone.js";
import * as collect from "./views/collect.js";
import * as dash from "./views/dashboard.js";
import * as farmers from "./views/farmers.js";
import * as settings from "./views/settings.js";

const VIEWS = { phone, collect, dashboard: dash, farmers, settings };
const NAV = [["phone", "phone", "nav.phone"], ["collect", "can", "nav.collect"], ["dashboard", "chart", "nav.dash"], ["farmers", "people", "nav.farmers"], ["settings", "gear", "nav.settings"]];
const RANK = { viewer: 0, volunteer: 1, admin: 2 };
const LOCALE = { en: "en-IN", ta: "ta-IN", ml: "ml-IN", hi: "hi-IN" };
const PREF = "palamalai-milk-slip-lang";

const store = createStore();
let lang = "en", view = "phone", user = null;
try { lang = localStorage.getItem(PREF) || lang; } catch (e) {}
if (!STRINGS[lang]) lang = "en";

function t(key, vars = {}, fallback) {
  let s = (STRINGS[lang] && STRINGS[lang][key]) ?? STRINGS.en[key] ?? fallback ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
}
const fmtDate = (isoDay) => new Date(isoDay + "T00:00:00").toLocaleDateString(LOCALE[lang], { day: "numeric", month: "short" });
const ctx = {
  store, t, fmtDate,
  get s() { return store.state; },
  fmtRange: (a, b) => `${fmtDate(a)} – ${fmtDate(b)}`,
  periodKey: (d) => periodOf(d).key,
  can: (role) => !!user && RANK[user.role] >= RANK[role],
  go: (v) => { view = v; renderAll(); },
  rerender: (opts) => renderAll(opts),
  signIn: (role) => signIn(role),
  refreshUser: () => (user = store.user),
};

function shell() {
  document.documentElement.lang = lang;
  $("#brand-sub").textContent = t("app.sub");
  $("#lang").innerHTML = UI_LANGS.map(([code, name]) => `<option value="${code}" ${code === lang ? "selected" : ""}>${name}</option>`).join("");
  $("#lang").setAttribute("aria-label", t("app.language"));
  $("#who").innerHTML = user
    ? `<span class="who-chip"><span class="role-dot ${user.role}"></span>${esc(t("role." + user.role))}</span><button class="btn small ghost" id="signout" title="${t("auth.signOut")}">${icon("out")}<span class="hide-sm">${t("auth.signOut")}</span></button>`
    : `<button class="btn small" id="signin">${icon("lock")} ${t("auth.signIn")}</button>`;
  $("#mode").textContent = store.mode === "local" ? t("app.sample") : t("app.live");
  const nav = NAV.map(([id, ic, key]) => `<a href="#${id}" class="nav-item ${id === view ? "active" : ""}" data-view="${id}" ${id === view ? 'aria-current="page"' : ""}>${icon(ic)}<span>${t(key)}</span></a>`).join("");
  $("#nav").innerHTML = nav; $("#tabbar").innerHTML = nav;
  $("#foot").textContent = t("app.foot");
}

function renderAll(opts = {}) {
  shell();
  const V = VIEWS[view];
  $("#main").innerHTML = V.render(ctx);
  V.bind(ctx);
  $$("[data-view]").forEach((a) => (a.onclick = (e) => { e.preventDefault(); view = a.dataset.view; try { history.replaceState(null, "", "#" + view); } catch (err) {} renderAll(); window.scrollTo(0, 0); }));
  $$("[data-signin]").forEach((b) => (b.onclick = () => signIn(b.dataset.signin)));
  const si = $("#signin"); if (si) si.onclick = () => signIn();
  const so = $("#signout"); if (so) so.onclick = async () => { await store.signOut(); user = null; toast(t("auth.signedOut")); renderAll(); };
  if (opts.keepFocus) { const el = $(opts.keepFocus); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }
}

async function signIn(role = "admin") {
  const local = store.mode === "local";
  const data = await dialog(`<h2 class="dlg-title">${t("auth.title")}</h2>
    <form class="form" id="auth-form">
      ${local ? `<div class="seg" role="radiogroup" aria-label="${t("auth.role")}">
        <label><input type="radio" name="role" value="admin" ${role === "admin" ? "checked" : ""}><span>${t("role.admin")}</span></label>
        <label><input type="radio" name="role" value="volunteer" ${role === "volunteer" ? "checked" : ""}><span>${t("role.volunteer")}</span></label></div>
        <label class="field"><span>${t("auth.pin")}</span><input id="auth-pin" name="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="8" required></label>
        <p class="muted small">${t("auth.demoPins")}</p>`
      : `<label class="field"><span>${t("auth.email")}</span><input id="auth-email" name="email" type="email" required></label>
         <label class="field"><span>${t("auth.password")}</span><input id="auth-pass" name="password" type="password" required></label>`}
      <p class="err" id="auth-err" hidden></p>
      <div class="dlg-actions"><button type="button" class="btn ghost" data-close="">${t("btn.cancel")}</button><button class="btn primary" type="submit">${t("auth.signIn")}</button></div>
    </form>`, { onOpen: (box, close) => {
      const pin = box.querySelector("#auth-pin, #auth-email"); if (pin) pin.focus();
      box.querySelector("form").onsubmit = async (e) => {
        e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
        try { user = await store.signIn(d); close("ok"); } catch (err) { const el = box.querySelector("#auth-err"); el.textContent = t("auth.wrong"); el.hidden = false; }
      };
    } });
  if (data === "ok") { toast(t("auth.welcome", { role: t("role." + user.role) })); renderAll(); }
}

async function start() {
  $("#lang").onchange = (e) => { lang = e.target.value; try { localStorage.setItem(PREF, lang); } catch (err) {} renderAll(); };
  try { await store.init(); } catch (e) { $("#main").innerHTML = `<div class="panel"><h2>${t("app.loadError")}</h2><p class="muted">${esc(e.message)}</p></div>`; return; }
  user = store.user;
  const h = (location.hash || "").slice(1); if (VIEWS[h]) view = h;
  renderAll();
}
start();
