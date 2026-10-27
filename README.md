# Palamalai Milk Slip

A prototype built during the SPJIMR DoCC internship with CTRD Trust in Palamalai, Coimbatore (Oct to Nov 2026), for a farmer-owned desi-cow dairy company.

Many families who will supply milk cannot read, and many do not have smartphones. So every pour is confirmed by a **slip read aloud at the collection point** in Tamil, Malayalam, Hindi or English, each pay cycle ends with **one voice call** about the amount and payment, and a **missed call** gets the balance at any time. CTRD and the dairy company track everything on one dashboard.

**Live demo:** https://nikhilkhandelwal07.github.io/CTRD/ (after GitHub Pages is switched on; see `docs/hosting.md`).

## What it does

| Screen | Who uses it | What it shows |
|---|---|---|
| Collection | Collection volunteer | Tap the member, set litres, fat and SNF, save. The slip is read aloud on the spot in the member's language |
| Dashboard | CTRD, dairy company | Milk per day, progress to the company's break-even volume, quality by village, members who stopped pouring, payments by 10-day cycle |
| Farmers | CTRD admin | Add, edit, remove (keeps history), restore or delete farmers; manage villages |
| Settings | CTRD admin | Price rule, PINs, where the data is kept, activity log |
| Farmer's line | Members | The 10-day payment call and the missed-call balance line on a basic keypad phone |

The interface switches between English, Tamil, Malayalam and Hindi on every screen.

## Price rule

₹100 a litre at 4.0% fat and 8.5% SNF (what families get for desi milk today), plus or minus ₹1 for each 0.1% fat and ₹0.50 for each 0.1% SNF. The household price and break-even are still being tested (see the daily reports of 26 and 27 Oct). An admin can change the rule.

## Code layout

```
index.html            app shell (GitHub Pages serves this)
css/app.css           design tokens, light and dark themes
js/app.js             navigation, language, sign-in
js/i18n.js            all interface text in four languages
js/voice.js           spoken slip text and speech
js/pricing.js         price rule and pay cycles
js/store.js           data layer: browser storage or Supabase
js/calc.js            dashboard numbers
js/views/*.js         one file per screen
supabase/schema.sql   free shared database with roles and access rules
tools/build.mjs       rebuilds index.html and the single-file demo (dist/)
docs/                 hosting and voice options
```

No framework and no build step are needed to run it. `node tools/build.mjs` only regenerates `index.html` and `dist/milk_slip.html` after editing `tools/shell.html` or the code.

## Status

- All farmer names, phone numbers and figures are **sample data**.
- Tamil, Malayalam and Hindi text needs checking by native speakers at CTRD.
- The Supabase connection is written but has not been tested against a live project yet.
- Free voice options for a real phone line are in `docs/voice_options.md`; hosting steps in `docs/hosting.md`.

## Team

Nikhil Khandelwal, Anjit Jain and Rohan Raj (SPJIMR), with CTRD Trust.
