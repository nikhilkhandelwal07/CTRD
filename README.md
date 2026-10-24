# CTRD Voice Milk Slip (prototype)

A clickable prototype built during the SPJIMR DoCC internship with CTRD Trust in Palamalai, Coimbatore (Oct to Nov 2026).

Many dairy farmers in the planned desi-cow FPC cannot read, and many do not have smartphones. So the milk slip is spoken to them on an ordinary phone call. It is available in Tamil, Malayalam, Hindi and English.

## What it shows

1. **Phone call.** The farmer gives a missed call. The call back speaks today's slip: litres, fat, SNF, quality, rate, amount and the running total for the pay period. Keypad: 1 to repeat, 2 for the total.
2. **Collection.** The collection volunteer picks the farmer, enters litres, fat and SNF, and saves. The farmer's phone rings with the slip.
3. **Dashboard.** For the FPC and CTRD: litres per day, villages, farmers who have stopped supplying, payments due, and the price rule.

## Run it

Open `index.html` in a browser (Chrome on Android or desktop works best). No install or server is needed. The voice uses the browser's built-in speech; if a language has no voice on that device, the text is shown instead.

## Status

- All farmer names, villages and figures are **sample data**.
- The price rule (base rate plus fat and SNF steps) is a placeholder until the dairy unit economics are worked out.
- The Tamil, Malayalam and Hindi text needs checking by native speakers.
- Voice service options for a real phone line are in [docs/voice_options.md](docs/voice_options.md).

## Team

Nikhil Khandelwal, Anjit Jain and Rohan Raj (SPJIMR), with CTRD Trust.
