# Palamalai Milk Slip

A prototype built during the SPJIMR DoCC internship with CTRD Trust in Palamalai, Coimbatore (Oct to Nov 2026), for a farmer-owned desi-cow dairy company.

Many families who will supply milk cannot read, and many do not have smartphones. So every pour is confirmed by a **spoken slip** on an ordinary phone, in Tamil, Malayalam, Hindi or English. CTRD and the dairy company track everything on one dashboard.

**Live demo:** https://nikhilkhandelwal07.github.io/CTRD/ (after GitHub Pages is switched on; see `docs/hosting.md`).

## What it does

| Screen | Who uses it | What it shows |
|---|---|---|
| Farmer's phone | Farmer | A keypad phone that rings after each pour and speaks litres, quality, amount, cycle total and payment day. A missed call plays the total in the chosen language |
| Collection | Collection volunteer | Tap the farmer, set litres, fat and SNF, save. The farmer's phone rings with the slip |
| Dashboard | CTRD, dairy company | Milk per day against the 160 L/day break-even, quality by village, farmers who stopped pouring, unpaid farmers, payments by 10-day cycle |
| Farmers | CTRD admin | Add, edit, remove (keeps history), restore or delete farmers; manage villages |
| Settings | CTRD admin | Price rule, PINs, where the data is kept, activity log |

The interface switches between English, Tamil, Malayalam and Hindi on every screen.

## Price rule

₹60 a litre at 4.0% fat and 8.5% SNF, plus or minus ₹1 for each 0.1% fat and ₹0.50 for each 0.1% SNF. It comes from the dairy unit economics in the 26 Oct progress report: above Aavin's ₹44 procurement price, and the company still breaks even at about 160 litres a day. An admin can change it.

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
