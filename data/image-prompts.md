# Longstream Distillery — gpt-image-2 prompts

Generate each image, then save it into `public/images/` under the **filename** shown.
Until a file exists, the page falls back to an existing placeholder automatically.

General tips for all prompts:
- Add **"no text, no lettering, no logos, no watermarks"** — image models tend to invent garbled text.
- Keep a consistent location story: a small family distillery in the Mangaroa Valley, Upper Hutt, New Zealand (lush green hills, a clear stream, copper still).
- Request the exact aspect ratio noted; downscale/crop to taste.

---

## Variation 1 — "Wild Botanical" (forest green / cream / terracotta)

**`v1-hero.png`** — portrait 4:5
> Generate a 4:5 image of a warm editorial photograph of a lush green New Zealand valley, golden late-afternoon sunlight, native ferns and a clear stream winding through the foreground, rolling bush-clad hills beyond, soft film-like color grading with deep forest greens and warm cream tones, shallow depth of field, heritage craft mood. Portrait orientation, no text, no logos, no people's faces in focus.

**(optional) `v1-botanical.png`** — square, transparent
> Generate a 1:1 image of a delicate hand-drawn botanical line illustration of juniper berries, lemon and kawakawa leaves arranged in a wreath, single thin terracotta-brown ink lines on a transparent background, vintage apothecary engraving style, no shading, no text.

---

## Variation 2 — "Riverstone" (light / sage-stone / copper)

**`v2-hero.png`** — wide landscape 16:9 (full-bleed hero)
> Generate a 16:9 image of a bright, airy, modern lifestyle photograph looking across a clean minimalist distillery tasting room toward large windows opening onto soft green New Zealand hills, pale stone and sage-grey tones, natural daylight, a single gin bottle and glass on a pale oak table slightly out of focus, contemporary premium spirits brand aesthetic, lots of negative space at the top for a headline. Landscape, no text, no logos.

**`v2-story.png`** — portrait 5:6
> Generate a 5:6 image of a clean contemporary photograph of hands gently labelling a clear gin bottle on a pale workbench, soft diffused daylight, muted sage and stone palette with a touch of warm copper, minimalist premium feel, shallow depth of field. Portrait, no text, no logos.

---

## Variation 3 — "Midnight Still" (near-black / gold / moody)

**`v3-bottle.png`** — portrait, **transparent background**
> Generate a 2:3 image of a premium studio product shot of a single elegant gin bottle, dramatic low-key lighting with a warm golden rim-light tracing the edges of the glass, deep shadows, the bottle glowing against pure transparent/black background, luxury spirits advertising style, high detail, no text, no label lettering, transparent background (PNG cutout).

**`v3-still.png`** — portrait 4:5
> Generate a 4:5 image of a moody, atmospheric photograph of a gleaming copper pot still in a dark distillery, single warm spotlight catching the polished copper, rich shadows, golden highlights, wisps of steam, cinematic high-end mood, deep blacks. Portrait, no text, no logos.

---

## Shared / optional upgrades (used by all variations)

**`bottle.png`** (replaces the current product render) — portrait, transparent background
> Generate a 2:3 image of a clean studio render of a single 700ml gin bottle with a simple cork top, soft even studio lighting, photographed straight-on, the bottle floating with nothing beneath it, pure transparent background (PNG cutout), no label text, no logos, no reflection, no mirror reflection, no shadow on the ground, no surface, no table, no glass table.

Tip: generate three bottle variants (gin = clear/green tint, limoncello = pale yellow, vodka = clear/frosted) named `bottle-gin.png`, `bottle-limoncello.png`, `bottle-vodka.png` if you later want each product to look distinct.
