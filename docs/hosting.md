# Hosting for free

The app is a static website: plain HTML, CSS and JavaScript, with no build step and no server code. It costs nothing to run.

## 1. The website: GitHub Pages (free)

1. On GitHub, open the repository, then **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
3. After a minute the app is live at `https://nikhilkhandelwal07.github.io/CTRD/`.

Out of the box, data is kept in each browser. That is fine for a demo or for one collection-point laptop.

## 2. The shared database: Supabase (free tier)

Use this when several phones or laptops must see the same farmers and milk records.

1. Create a free account at supabase.com and a new project. Choose the Mumbai region; it is closest to Coimbatore.
2. Open **SQL Editor → New query**, paste the contents of `supabase/schema.sql` and press **Run**. This creates the tables, the three roles and the access rules.
3. Open **Authentication → Users → Add user** and create one user for each CTRD admin and each collection volunteer, with email and password.
4. Open **Table Editor → profiles** and set `role` to `admin` or `volunteer` for each user, and fill in `name`.
5. Open **Project Settings → API**. Copy the **Project URL** and the **anon public** key into `js/config.js`. The anon key is meant to be public; the access rules in the database protect the data.
6. Commit and push. The app now signs people in with email and password, and every device shares the same data.

### What the free tier gives

As reported in October 2026 ([JetAdmin, 2026 guide](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/)), the free plan gives two active projects, a 500 MB database, 1 GB file storage, 5 GB egress and up to 50,000 monthly active users, which is far more than a 200-family dairy needs. Two limits to keep in mind:
- A free project with no activity for 7 days is paused and has to be restarted from the dashboard. Daily milk recording keeps it active.
- There are no automatic backups on the free plan. Export the tables once a week.

Check supabase.com/pricing for the current limits before relying on them.

## Who can do what

| Role | Can |
|---|---|
| CTRD admin | Add, edit, remove and delete farmers and villages; set the price rule; mark payments; see the activity log |
| Collection volunteer | Record milk at the collection point |
| Viewer | See the farmer's phone demo and the dashboard. Phone numbers are hidden |

In browser mode, admins and volunteers sign in with a PIN (demo PINs 1234 and 2222; an admin should change them in Settings). PINs are stored hashed, but browser mode is still a demo: anyone with the device can clear its data. Use Supabase for real records.
