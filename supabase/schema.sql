-- Palamalai Milk Slip: database for the free Supabase tier.
-- Run once in Supabase: SQL Editor > New query > paste > Run.
-- Roles: admin (CTRD), volunteer (collection point), viewer. Row-level security enforces them.

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default '',
  role text not null default 'viewer' check (role in ('admin', 'volunteer', 'viewer'))
);
create table if not exists villages (id uuid primary key default gen_random_uuid(), name text not null unique);
create table if not exists farmers (
  id uuid primary key default gen_random_uuid(),
  name text not null, village_id uuid references villages on delete restrict,
  lang text not null default 'ta' check (lang in ('ta', 'ml', 'hi', 'en')),
  cows int not null default 1, phone text, active boolean not null default true,
  created_at date not null default current_date
);
create table if not exists records (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references farmers on delete restrict,
  day date not null default current_date, session text not null check (session in ('AM', 'PM')),
  litres numeric(5,1) not null check (litres > 0), fat numeric(3,1) not null, snf numeric(3,1) not null,
  rate numeric(6,2) not null, amount numeric(8,2) not null, call text default 'answered',
  by uuid default auth.uid(), created_at timestamptz default now()
);
create table if not exists payments (period_key text not null, farmer_id uuid not null references farmers on delete cascade, paid_on date not null, primary key (period_key, farmer_id));
create table if not exists settings (id int primary key default 1 check (id = 1), base_price numeric not null default 60, fat_step numeric not null default 1, snf_step numeric not null default 0.5, ref_fat numeric not null default 4.0, ref_snf numeric not null default 8.5);
insert into settings (id) values (1) on conflict do nothing;
create table if not exists audit (id bigserial primary key, ts timestamptz not null default now(), who text, action text, detail text);

-- Helper: the signed-in user's role.
create or replace function my_role() returns text language sql stable security definer set search_path = public as
$$ select coalesce((select role from profiles where id = auth.uid()), 'viewer') $$;

-- New sign-ups become viewers; an admin promotes them in the profiles table.
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as
$$ begin insert into profiles (id, name) values (new.id, coalesce(new.email, '')); return new; end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

alter table profiles enable row level security; alter table villages enable row level security; alter table farmers enable row level security;
alter table records enable row level security; alter table payments enable row level security; alter table settings enable row level security; alter table audit enable row level security;

-- Everyone signed in can read.
create policy "read profiles" on profiles for select to authenticated using (true);
create policy "read villages" on villages for select to authenticated using (true);
create policy "read farmers" on farmers for select to authenticated using (true);
create policy "read records" on records for select to authenticated using (true);
create policy "read payments" on payments for select to authenticated using (true);
create policy "read settings" on settings for select to authenticated using (true);
create policy "read audit" on audit for select to authenticated using (my_role() = 'admin');
-- Admin manages farmers, villages, price and payments.
create policy "admin villages" on villages for all to authenticated using (my_role() = 'admin') with check (my_role() = 'admin');
create policy "admin farmers" on farmers for all to authenticated using (my_role() = 'admin') with check (my_role() = 'admin');
create policy "admin payments" on payments for all to authenticated using (my_role() = 'admin') with check (my_role() = 'admin');
create policy "admin settings" on settings for all to authenticated using (my_role() = 'admin') with check (my_role() = 'admin');
create policy "admin profiles" on profiles for update to authenticated using (my_role() = 'admin');
-- Volunteers and admins record milk; only admins can correct or delete a record.
create policy "record milk" on records for insert to authenticated with check (my_role() in ('admin', 'volunteer'));
create policy "fix records" on records for update to authenticated using (my_role() = 'admin');
create policy "delete records" on records for delete to authenticated using (my_role() = 'admin');
create policy "write audit" on audit for insert to authenticated with check (true);

-- Starting villages (from CTRD's village data chart).
insert into villages (name) values ('Pasumani'), ('Pasumanipudur'), ('Manguzhi'), ('Kunjurpathy'), ('Perumpathy'), ('Perukaipathy 1'), ('Perukaipathy 2') on conflict do nothing;
