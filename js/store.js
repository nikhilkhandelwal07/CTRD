// Data layer. Two interchangeable back ends with the same methods:
//  - LocalStore: keeps data in this browser (localStorage, or memory if storage is blocked). Free, offline, single device.
//  - SupabaseStore: free-tier Postgres with logins and row-level security, shared by every device.
import { CONFIG } from "./config.js";
import { makeSeed } from "./seed.js";

const KEY = "palamalai-milk-slip-v2";
const uid = (p) => p + Math.random().toString(36).slice(2, 9);

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("palamalai:" + text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

class LocalStore {
  constructor() { this.mode = "local"; this.user = null; }
  async init() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { saved = null; }
    this.state = saved || makeSeed();
    if (!this.state.pins) {
      this.state.pins = { admin: await sha256(CONFIG.DEMO_PINS.admin), volunteer: await sha256(CONFIG.DEMO_PINS.volunteer) };
    }
    try { this.user = JSON.parse(sessionStorage.getItem(KEY + ":user") || "null"); } catch (e) { this.user = null; }
    this.save();
    return this.state;
  }
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch (e) { /* memory only */ } }
  log(action, detail) {
    this.state.audit.unshift({ ts: new Date().toISOString(), who: this.user ? this.user.name : "guest", action, detail });
    this.state.audit = this.state.audit.slice(0, 200);
  }
  async signIn({ role, pin }) {
    if (!role || !this.state.pins[role]) throw new Error("role");
    if ((await sha256(pin)) !== this.state.pins[role]) throw new Error("pin");
    this.user = { name: role === "admin" ? "CTRD admin" : "Collection volunteer", role };
    try { sessionStorage.setItem(KEY + ":user", JSON.stringify(this.user)); } catch (e) {}
    this.log("sign-in", this.user.name); this.save();
    return this.user;
  }
  async signOut() { this.user = null; try { sessionStorage.removeItem(KEY + ":user"); } catch (e) {} }
  async setPin(role, pin) { this.state.pins[role] = await sha256(pin); this.log("pin", "Changed " + role + " PIN"); this.save(); }

  async upsertFarmer(f) {
    const list = this.state.farmers; const i = list.findIndex((x) => x.id === f.id);
    if (i >= 0) { list[i] = { ...list[i], ...f }; this.log("farmer-edit", f.name); }
    else { f = { ...f, id: uid("f"), createdAt: new Date().toISOString().slice(0, 10), active: true }; list.push(f); this.log("farmer-add", f.name); }
    this.save(); return f;
  }
  async removeFarmer(id, hard) {
    const f = this.state.farmers.find((x) => x.id === id); if (!f) return;
    if (hard) { this.state.farmers = this.state.farmers.filter((x) => x.id !== id); this.log("farmer-delete", f.name); }
    else { f.active = false; this.log("farmer-archive", f.name); }
    this.save();
  }
  async restoreFarmer(id) { const f = this.state.farmers.find((x) => x.id === id); if (f) { f.active = true; this.log("farmer-restore", f.name); this.save(); } }
  async upsertVillage(v) {
    const list = this.state.villages; const i = list.findIndex((x) => x.id === v.id);
    if (i >= 0) { list[i] = { ...list[i], ...v }; this.log("village-edit", v.name); } else { list.push({ ...v, id: uid("v") }); this.log("village-add", v.name); }
    this.save();
  }
  async removeVillage(id) { const v = this.state.villages.find((x) => x.id === id); this.state.villages = this.state.villages.filter((x) => x.id !== id); this.log("village-delete", v ? v.name : id); this.save(); }
  async addRecord(r) { const rec = { ...r, id: uid("r"), by: this.user ? this.user.role : "guest" }; this.state.records.push(rec); this.log("milk", `${r.litres} L`); this.save(); return rec; }
  async setSettings(s) { this.state.settings = { ...this.state.settings, ...s }; this.log("price", `Base ₹${this.state.settings.basePrice}`); this.save(); }
  async setPaid(periodKey, farmerId, paid) {
    const k = periodKey + "|" + farmerId;
    if (paid) this.state.payments[k] = new Date().toISOString().slice(0, 10); else delete this.state.payments[k];
    this.log("payment", `${periodKey} ${farmerId} ${paid ? "paid" : "unpaid"}`); this.save();
  }
  async reset() { try { localStorage.removeItem(KEY); } catch (e) {} this.state = null; return this.init(); }
}

// ---------- Supabase (optional, free tier) ----------
const camel = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), v]));
const snake = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase()), v]));

class SupabaseStore {
  constructor() { this.mode = "supabase"; this.user = null; }
  async init() {
    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm");
    this.sb = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    const { data } = await this.sb.auth.getSession();
    if (data.session) await this.loadProfile(data.session.user);
    await this.reload();
    return this.state;
  }
  async loadProfile(u) {
    const { data } = await this.sb.from("profiles").select("name, role").eq("id", u.id).single();
    this.user = { name: (data && data.name) || u.email, role: (data && data.role) || "viewer", id: u.id };
  }
  async reload() {
    const q = (t, sel = "*") => this.sb.from(t).select(sel);
    const [v, f, r, p, s, a] = await Promise.all([q("villages"), q("farmers"), q("records").order("day"), q("payments"), q("settings").eq("id", 1).maybeSingle(), q("audit").order("ts", { ascending: false }).limit(200)]);
    const payments = {}; (p.data || []).forEach((x) => (payments[x.period_key + "|" + x.farmer_id] = x.paid_on));
    this.state = {
      villages: (v.data || []).map(camel), farmers: (f.data || []).map(camel), records: (r.data || []).map(camel),
      payments, settings: s.data ? camel(s.data) : { basePrice: 60, fatStep: 1, snfStep: 0.5, refFat: 4, refSnf: 8.5 },
      audit: (a.data || []).map((x) => ({ ts: x.ts, who: x.who, action: x.action, detail: x.detail })),
    };
    return this.state;
  }
  async must(res) { if (res.error) throw new Error(res.error.message); return res.data; }
  async log(action, detail) { await this.sb.from("audit").insert({ who: this.user ? this.user.name : "guest", action, detail }); }
  async signIn({ email, password }) {
    const { data, error } = await this.sb.auth.signInWithPassword({ email, password });
    if (error) throw new Error("pin");
    await this.loadProfile(data.user); await this.log("sign-in", this.user.name); await this.reload(); return this.user;
  }
  async signOut() { await this.sb.auth.signOut(); this.user = null; }
  async setPin() { throw new Error("Use Supabase Auth to change passwords"); }
  async upsertFarmer(f) {
    const row = snake({ name: f.name, villageId: f.villageId, lang: f.lang, cows: f.cows, phone: f.phone, active: f.active ?? true });
    if (f.id) await this.must(await this.sb.from("farmers").update(row).eq("id", f.id)); else await this.must(await this.sb.from("farmers").insert(row));
    await this.log(f.id ? "farmer-edit" : "farmer-add", f.name); await this.reload();
  }
  async removeFarmer(id, hard) {
    if (hard) await this.must(await this.sb.from("farmers").delete().eq("id", id)); else await this.must(await this.sb.from("farmers").update({ active: false }).eq("id", id));
    await this.log(hard ? "farmer-delete" : "farmer-archive", id); await this.reload();
  }
  async restoreFarmer(id) { await this.must(await this.sb.from("farmers").update({ active: true }).eq("id", id)); await this.reload(); }
  async upsertVillage(v) { if (v.id) await this.must(await this.sb.from("villages").update({ name: v.name }).eq("id", v.id)); else await this.must(await this.sb.from("villages").insert({ name: v.name })); await this.log("village", v.name); await this.reload(); }
  async removeVillage(id) { await this.must(await this.sb.from("villages").delete().eq("id", id)); await this.reload(); }
  async addRecord(r) { const rows = await this.must(await this.sb.from("records").insert(snake(r)).select()); await this.reload(); return camel(rows[0]); }
  async setSettings(s) { await this.must(await this.sb.from("settings").upsert({ id: 1, ...snake({ ...this.state.settings, ...s }) })); await this.log("price", String(s.basePrice)); await this.reload(); }
  async setPaid(periodKey, farmerId, paid) {
    if (paid) await this.must(await this.sb.from("payments").upsert({ period_key: periodKey, farmer_id: farmerId, paid_on: new Date().toISOString().slice(0, 10) }));
    else await this.must(await this.sb.from("payments").delete().eq("period_key", periodKey).eq("farmer_id", farmerId));
    await this.reload();
  }
  async reset() { return this.reload(); }
}

export function createStore() {
  return CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY ? new SupabaseStore() : new LocalStore();
}
