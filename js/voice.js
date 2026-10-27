// Spoken milk slip. Uses the phone or computer's built-in voice (Web Speech API, free).
// For a real phone line, the same sentences would be recorded once per language with a free open model
// (AI4Bharat Indic Parler-TTS, Apache 2.0) and joined at call time. See docs/voice_options.md.
// Tamil, Malayalam and Hindi wording to be checked by native speakers at CTRD.

const MONTHS = {
  ta: ["ஜனவரி","பிப்ரவரி","மார்ச்","ஏப்ரல்","மே","ஜூன்","ஜூலை","ஆகஸ்ட்","செப்டம்பர்","அக்டோபர்","நவம்பர்","டிசம்பர்"],
  ml: ["ജനുവരി","ഫെബ്രുവരി","മാർച്ച്","ഏപ്രിൽ","മേയ്","ജൂൺ","ജൂലൈ","ഓഗസ്റ്റ്","സെപ്റ്റംബർ","ഒക്ടോബർ","നവംബർ","ഡിസംബർ"],
  hi: ["जनवरी","फ़रवरी","मार्च","अप्रैल","मई","जून","जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"],
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
};

export const SLIP = {
  ta: { voice: "ta-IN", am: "காலை", pm: "மாலை", q: { good: "நல்லது", fair: "சரி", low: "குறைவு" },
    slip: (o) => `வணக்கம் ${o.name}. இன்று ${o.sess} நீங்கள் ${o.l} லிட்டர் பால் கொடுத்தீர்கள். தரம் ${o.q}. இன்றைய தொகை ${o.a} ரூபாய். இந்த காலத்தில் மொத்தம் ${o.t} ரூபாய். பணம் ${o.month} ${o.d} அன்று. மீண்டும் கேட்க 1 அழுத்தவும். மொத்தத் தொகைக்கு 2 அழுத்தவும்.`,
    total: (o) => `இந்த காலத்தில் உங்கள் மொத்தம் ${o.t} ரூபாய். பணம் ${o.month} ${o.d} அன்று.`, pick: "தமிழுக்கு 1 அழுத்தவும்" },
  ml: { voice: "ml-IN", am: "രാവിലെ", pm: "വൈകുന്നേരം", q: { good: "നല്ലത്", fair: "ശരാശരി", low: "കുറവ്" },
    slip: (o) => `നമസ്കാരം ${o.name}. ഇന്ന് ${o.sess} നിങ്ങൾ ${o.l} ലിറ്റർ പാൽ നൽകി. ഗുണനിലവാരം ${o.q}. ഇന്നത്തെ തുക ${o.a} രൂപ. ഈ കാലയളവിലെ ആകെ തുക ${o.t} രൂപ. പണം ${o.month} ${o.d}-ന്. വീണ്ടും കേൾക്കാൻ 1 അമർത്തുക. ആകെ തുക കേൾക്കാൻ 2 അമർത്തുക.`,
    total: (o) => `ഈ കാലയളവിലെ നിങ്ങളുടെ ആകെ തുക ${o.t} രൂപ. പണം ${o.month} ${o.d}-ന്.`, pick: "മലയാളത്തിന് 2 അമർത്തുക" },
  hi: { voice: "hi-IN", am: "सुबह", pm: "शाम", q: { good: "अच्छी", fair: "ठीक", low: "कम" },
    slip: (o) => `नमस्ते ${o.name}. आज ${o.sess} आपने ${o.l} लीटर दूध दिया. गुणवत्ता ${o.q} है. आज की राशि ${o.a} रुपये. इस अवधि का कुल ${o.t} रुपये. भुगतान ${o.d} ${o.month} को होगा. दोबारा सुनने के लिए 1 दबाएँ. कुल राशि सुनने के लिए 2 दबाएँ.`,
    total: (o) => `इस अवधि का आपका कुल ${o.t} रुपये है. भुगतान ${o.d} ${o.month} को.`, pick: "हिंदी के लिए 3 दबाएँ" },
  en: { voice: "en-IN", am: "morning", pm: "evening", q: { good: "good", fair: "fair", low: "low" },
    slip: (o) => `Hello ${o.name}. This ${o.sess} you gave ${o.l} litres of milk. Quality is ${o.q}. Today's amount is ${o.a} rupees. Your total this period is ${o.t} rupees. Payment on ${o.d} ${o.month}. Press 1 to hear again. Press 2 to hear your total.`,
    total: (o) => `Your total this period is ${o.t} rupees. Payment on ${o.d} ${o.month}.`, pick: "For English press 4" },
};
export const VOICE_LANGS = ["ta", "ml", "hi", "en"];

const KEYS_FROM = { ta: "மீண்டும் கேட்க", ml: "വീണ്ടും കേൾക്കാൻ", hi: "दोबारा सुनने", en: "Press 1" };
export function slipText(lang, { name, session, litres, quality, amount, total, payDay }, withKeys = true) {
  const L = SLIP[lang] || SLIP.en; const [, m, d] = payDay.split("-").map(Number);
  const full = L.slip({ name, sess: session === "AM" ? L.am : L.pm, l: litres, q: L.q[quality], a: Math.round(amount), t: Math.round(total), month: MONTHS[lang][m - 1], d });
  if (withKeys) return full;
  const k = full.indexOf(KEYS_FROM[lang] || KEYS_FROM.en);
  return k > 0 ? full.slice(0, k).trim() : full;
}
export function totalText(lang, { total, payDay }) {
  const L = SLIP[lang] || SLIP.en; const [, m, d] = payDay.split("-").map(Number);
  return L.total({ t: Math.round(total), month: MONTHS[lang][m - 1], d });
}

// 10-day payment call: one call per member per pay cycle with the total and the payment.
const PAY = {
  en: { day: (d, m) => `${d} ${m}`, text: (o) => `Hello ${o.name}. This is Palamalai Dairy. From ${o.from} to ${o.to}, you poured ${o.l} litres of milk. Your amount is ${o.t} rupees. ${o.paid ? "It has been paid into your bank account." : `It will be paid into your bank account on ${o.pay}.`} Thank you.` },
  ta: { day: (d, m) => `${m} ${d}`, text: (o) => `வணக்கம் ${o.name}. இது பாலமலை பால் பண்ணை. ${o.from} முதல் ${o.to} வரை நீங்கள் ${o.l} லிட்டர் பால் கொடுத்தீர்கள். உங்கள் தொகை ${o.t} ரூபாய். ${o.paid ? "இது உங்கள் வங்கிக் கணக்கில் செலுத்தப்பட்டது." : `இது ${o.pay} அன்று உங்கள் வங்கிக் கணக்கில் செலுத்தப்படும்.`} நன்றி.` },
  ml: { day: (d, m) => `${m} ${d}`, text: (o) => `നമസ്കാരം ${o.name}. ഇത് പാലമല ഡയറിയാണ്. ${o.from} മുതൽ ${o.to} വരെ നിങ്ങൾ ${o.l} ലിറ്റർ പാൽ നൽകി. നിങ്ങളുടെ തുക ${o.t} രൂപ. ${o.paid ? "ഇത് നിങ്ങളുടെ ബാങ്ക് അക്കൗണ്ടിൽ അടച്ചു." : `ഇത് ${o.pay}-ന് നിങ്ങളുടെ ബാങ്ക് അക്കൗണ്ടിൽ അടയ്ക്കും.`} നന്ദി.` },
  hi: { day: (d, m) => `${d} ${m}`, text: (o) => `नमस्ते ${o.name}. यह पालमलई डेयरी है. ${o.from} से ${o.to} तक आपने ${o.l} लीटर दूध दिया. आपकी राशि ${o.t} रुपये है. ${o.paid ? "यह आपके बैंक खाते में जमा कर दी गई है." : `यह ${o.pay} को आपके बैंक खाते में जमा होगी.`} धन्यवाद.` },
};
export function payText(lang, { name, litres, total, from, to, payDay, paid }) {
  const P = PAY[lang] || PAY.en; const sp = (iso) => { const [, m, d] = iso.split("-").map(Number); return P.day(d, MONTHS[lang][m - 1]); };
  return P.text({ name, l: Math.round(litres * 10) / 10, t: Math.round(total), from: sp(from), to: sp(to), pay: sp(payDay), paid });
}

export const menuText = () => VOICE_LANGS.map((l) => SLIP[l].pick).join(". ");

const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
export const missing = new Set();
export function speak(text, lang, onEnd) {
  if (!synth) { missing.add(lang); onEnd && onEnd(); return false; }
  synth.cancel();
  const code = (SLIP[lang] || SLIP.en).voice;
  const v = synth.getVoices().find((x) => x.lang.replace("_", "-").toLowerCase().startsWith(code.toLowerCase()));
  if (!v && synth.getVoices().length) missing.add(lang);
  const u = new SpeechSynthesisUtterance(text); u.lang = code; if (v) u.voice = v; u.rate = 0.92;
  u.onend = () => onEnd && onEnd(); u.onerror = () => onEnd && onEnd();
  try { synth.speak(u); } catch (e) { onEnd && onEnd(); return false; }
  return !!v;
}
export const stop = () => { try { synth && synth.cancel(); } catch (e) {} };
