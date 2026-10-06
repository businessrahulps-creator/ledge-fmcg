# Ledge 60-second vertical film: "Find the leak"

## What you get
A 60-second, 9:16 vertical MP4 (1080x1920, 30fps). All text and action stay inside the middle area, so it can later be cropped to 4:5. It has an AI voice (young Indian woman, Indian-English, with the Malayalam lines), a light electronic music bed and small sound effects. The file is saved to Files. Nothing in the app changes. Budget: up to 100 credits.

## Look (from your mood board)
- Cobalt-blue world with glossy toy-like 3D pieces, pixel and voxel blocks, and a little soft fuzzy texture on a few objects.
- Money is shown as clear, rainbow-tinted glass crystals with a small ₹ inside.
- Small shop and product characters with simple eyes, like designer collectible toys. No human faces.
- Colours: cobalt base, warm off-white, near-black green, with yellow, acid green, orange, coral and cyan as accents, and very little magenta.
- Lettering: one heavy modern sans-serif for short 2–5 word statements, the same family in medium for small labels, and a clean Malayalam font that matches it.

## How it is made (the mix you chose)
- **3D world:** about 18 AI-made pictures of the same toy distribution "machine" and its parts, all made from one master picture so every shot looks like the same world.
- **Movement:** about 10–12 short AI video clips animate the key moments: the machine assembling, a crystal leaking out, shops shrinking, dust settling, the Ledge pulse, the money flowing back.
- **Sharp layer on top, built in code:** all words, the five labels, floating info cards ("₹1,24,500 to collect", "5 days stock left"), the glass ₹ crystals, the pulse rings, match cuts and wipes. Text stays crisp and lands exactly on the spoken word.

## Beats (timed to the voice)
```text
0-5    Toy machine assembles on cobalt. "Business is growing."
5-9    One glass ₹ crystal slips out, then another. "Money rarely disappears loudly."
9-24   Five leaks, each turning into the next:
       Booked. Not sent. / Payment waiting. / Buying less. / Running out. / Not moving.
24-28  Camera pulls back: crystals everywhere. Malayalam on screen: "എല്ലാം കൂട്ടിയാൽ?" then "വലിയ പണം."
28-32  A small Ledge tile enters, everything pauses, a calm pulse freezes the crystals. "LEDGE" / "See it early."
32-44  One camera move through the world; the pulse finds and fixes each leak, with floating info cards.
       "Know what needs attention. Today."
44-51  Order -> Bill -> Dispatch -> Dealer -> Payment; the payment becomes a crystal flowing back in.
       "Everything connected."
51-56  Calm, growing world; the last crack seals (Malayalam lines).
56-60  A crystal turns into the Ledge logo. "FIND THE LEAK. FIX IT. GROW WITH CLARITY." Ledge, getledge.in. Long hold.
```

## Motion rules
Flow (smooth and forward), Leak (a small wobble plus an escaping crystal), Detect (one calm pulse ring), Fix (a magnetic snap with slight overshoot), Grow (wider and calmer, not faster). Moments are allowed to breathe. No glitch effects, no random zooms, no plain dashboards.

## Checks before delivery
- Stills from every scene, checked for consistent world, colours and readable text inside the 4:5 crop area.
- Voice timed to the words, with a transcript check of every line.
- You judge the Malayalam pronunciation. If it isn't good enough, the voice can be swapped later without rebuilding the film.
- Check: the end line still uses "The operating system for India's distribution businesses", which your brief asked for. It was removed from the landing page earlier, so confirm you want it here.

## Technical details
- Voice: Gemini TTS (`google/gemini-3.1-flash-tts-preview`, voice chosen for a warm young female tone), with style instructions per section; timing measured from the audio by transcription.
- Pictures: image tool (premium tier for the master world, then edits from the master for consistency); clips: video tool with the pictures as starting frames, slow single camera moves.
- Compositing: Remotion in /tmp at 1080x1920, Noto Sans Malayalam plus a heavy grotesk display font (for example Inter Tight or Archivo, not decorative); music bed synthesized or generated, sound effects synthesized, mixed with FFmpeg under the voice.
- Reference images are used for style only; no logos or characters from them are copied.
