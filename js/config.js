// Where the app keeps its data.
// Leave SUPABASE_URL empty to keep everything in this browser (demo mode, works offline, no account needed).
// To share data between phones and laptops, create a free Supabase project, run supabase/schema.sql,
// then paste the project URL and the public "anon" key below. See docs/hosting.md.
export const CONFIG = {
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
  // Demo PINs for browser mode only. An admin can change them in Settings.
  DEMO_PINS: { admin: "1234", volunteer: "2222" },
};
