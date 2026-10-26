// Small UI helpers: escaping, toasts, in-page dialogs (the artifact viewer blocks alert/confirm).
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let toastTimer;
export function toast(msg, kind = "ok") {
  const el = $("#toast"); el.textContent = msg; el.dataset.kind = kind; el.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (el.hidden = true), 3600);
}

// Opens a dialog with given inner HTML. Returns a promise resolved with the button value or form data.
export function dialog(html, { onOpen } = {}) {
  const wrap = $("#dialog"); const box = $("#dialog-box");
  box.innerHTML = html; wrap.hidden = false;
  const first = box.querySelector("input, select, button"); if (first) first.focus();
  return new Promise((resolve) => {
    const close = (v) => { wrap.hidden = true; box.innerHTML = ""; document.removeEventListener("keydown", onKey); resolve(v); };
    const onKey = (e) => { if (e.key === "Escape") close(null); };
    document.addEventListener("keydown", onKey);
    wrap.onclick = (e) => { if (e.target === wrap) close(null); };
    box.querySelectorAll("[data-close]").forEach((b) => (b.onclick = () => close(b.dataset.close || null)));
    const form = box.querySelector("form");
    if (form) form.onsubmit = (e) => { e.preventDefault(); close(Object.fromEntries(new FormData(form))); };
    if (onOpen) onOpen(box, close);
  });
}

export function confirmDialog({ title, body, ok, cancel, danger }) {
  return dialog(`<h2 class="dlg-title">${esc(title)}</h2><p class="dlg-body">${esc(body)}</p>
    <div class="dlg-actions"><button class="btn ghost" data-close="">${esc(cancel)}</button>
    <button class="btn ${danger ? "danger" : "primary"}" data-close="yes">${esc(ok)}</button></div>`).then((v) => v === "yes");
}

export const icon = (name) => `<svg class="ico" aria-hidden="true" viewBox="0 0 24 24">${ICONS[name] || ""}</svg>`;
const ICONS = {
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M10.5 18.5h3"/>',
  can: '<path d="M8 3h8M9 3v3l-2 3v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9l-2-3V3"/><path d="M7 12h10"/>',
  chart: '<path d="M4 20h16M7 16v-5M12 16V7M17 16v-8"/>',
  people: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.6c2.3.1 4 1.5 4.6 4.4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M4.2 7.5l2 1.2M17.8 15.3l2 1.2M4.2 16.5l2-1.2M17.8 8.7l2-1.2"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  trash: '<path d="M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13"/>', missed: '<path d="M5 4l5 5M10 4v5H5"/><path d="M15 15l4 4M19 15l-4 4"/><path d="M4 14c4 0 6 2 6 6"/>',
  call: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  end: '<path d="M6 6l12 12M18 6L6 18"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', out: '<path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17"/>',
  volume: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
};
