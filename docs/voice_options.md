# Voice options for the milk slip (TTS and STT)

Checked on 24 Oct 2026. Prices exclude GST and can change. Check the vendor page before quoting.

## Why the voice matters

The prototype uses the browser's built-in voice (Web Speech API). It is free, but which languages work depends on the phone. Tamil and Hindi voices are common on Android. Malayalam often is not. A real service would also run over an ordinary phone call (IVR), not a browser. So we need a voice service that:

- speaks Tamil, Malayalam, Hindi and English
- works on 8 kHz phone audio
- is cheap enough for a small FPC

## Comparison

| Option | TTS: Ta / Ml / Hi / En | STT (speech to text) | Price (listed) | Notes |
|---|---|---|---|---|
| **Sarvam AI** (Bulbul, Saaras) | Bulbul v3: all four. Bulbul v4 Flash: no Malayalam | Saaras v3/v4: 22 Indian languages plus English, all four | TTS v3 Rs 3 per 1,000 chars (v4 Flash Rs 1). STT Rs 0.49 per min (about Rs 30 per hour). Rs 100 free credit | Indian company, published rate card, pay as you go |
| **Gnani.ai** (Vachana TTS, Prisma or Vachana STT) | Vachana TTS: 12 languages incl. Tamil, Malayalam, Hindi, Indian English | Recognition layer covers 10 languages incl. Hindi, Tamil, Malayalam | No rate card; quote after a demo | Built on telephone audio and tested on 8 kHz. Strongest fit for a phone line, but needs a sales talk |
| **ElevenLabs** | Eleven v3: all four. Flash v2.5 and Multilingual v2: no Malayalam | Scribe v2: "90+ languages" (the four not confirmed one by one) | TTS USD 0.04 (Flash) to 0.08 (v3) per 1,000 chars. STT USD 0.22 per hour. Agents USD 0.08 per min | Most natural voices, priced in USD. Startup grant: 12 months free |
| **AI4Bharat** (Indic Parler-TTS, IndicConformer) | Indic Parler-TTS: 21 languages incl. all four (Apache 2.0) | IndicConformer: all 22 official languages (MIT) | Free, open source | Self-hosted. Needs a computer to run it, and 0.9B parameters is slow on a laptop. Good for making the recordings once |
| **Bhashini** (Govt of India) | ASR and TTS models listed on ULCA | Yes | Not stated on the page we checked | Government platform. Access terms need checking with MeitY or Bhashini |
| **Browser voice** (current prototype) | Depends on the phone; Malayalam often missing | Browser speech recognition is uneven for Indic languages | Free | Fine for the demo only |

## What we suggest

1. **Pre-record, don't synthesise live.** A milk slip is a fixed sentence with a few numbers in it: date, session, litres, fat, SNF, quality, rate, amount. Record the fixed phrases and the number words once per language, a few hundred short clips, then join them at call time. It costs almost nothing, works offline, and a native speaker from the village can check every clip. Sarvam Bulbul v3 or ElevenLabs v3 can make the first draft in all four languages. Indic Parler-TTS does it for free.
2. **For the phone line**, an Indian IVR provider such as Exotel can host the missed-call number and play the clips. Exotel's business plans include multilevel IVR. A third-party review lists them from about USD 106 for 5 months plus a one-time rental. Exact per-minute rates need a quote.
3. **Speech to text is not needed for the first version.** Keypad presses are more reliable for users who cannot read and are new to this. Add STT later for the question line. Sarvam Saaras (about Rs 30 per audio hour) or Gnani, which is trained on telephone audio, would be the first to try.
4. **Paniya:** no vendor above lists it. Prompts in Paniya would have to be recorded by a community member.

## Sources

- [Sarvam API pricing](https://docs.sarvam.ai/api/pricing)
- [Sarvam models and languages](https://docs.sarvam.ai/api-reference-docs/getting-started/models)
- [Gnani vs Sarvam (Gnani blog)](https://www.gnani.ai/resources/blogs/gnani-ai-vs-sarvam-ai)
- [Gnani Vachana TTS launch, Business Today, 19 Feb 2026](https://www.businesstoday.in/amp/technology/story/gnaniai-launches-zero-shot-voice-cloning-tts-model-for-12-indic-languages-516896-2026-02-19)
- [Gnani Vachana STT launch, CXOToday](https://cxotoday.com/media-coverage/gnani-ai-launches-vachana-stt-a-foundational-indic-speech-to-text-model-trained-on-1m-hours-under-india-ai-mission/)
- [ElevenLabs models](https://elevenlabs.io/docs/models)
- [ElevenLabs API pricing](https://elevenlabs.io/pricing/api)
- [AI4Bharat Indic Parler-TTS](https://huggingface.co/ai4bharat/indic-parler-tts)
- [AI4Bharat IndicConformer ASR](https://github.com/AI4Bharat/IndicConformerASR)
- [Bhashini ULCA](https://bhashini.gov.in/ulca)
- [Exotel pricing review, CloudTalk, Jul 2026](https://www.cloudtalk.io/blog/exotel-pricing/)
