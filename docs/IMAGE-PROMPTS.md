# Image prompts — Kaziranga House site (version 3: one style per section)

There is one prompt for each picture a super admin can change in the portal (**Website → Site images**). They are paste-ready for Midjourney, Ideogram, Firefly, Gemini or ChatGPT. No picture shows a face.

**The rule of this version:** every section has **one locked style**. All the pictures in a section share the same ground, ink colours, camera angle, finish, border, fonts and type position. Only the *subject* changes. So the four About cards look like one set, the four Study cards look like another set, and so on.

---

## 0. The five sections at a glance

| Section | Pictures | Locked style | Ground | Ink | Border or frame | Type in the picture |
|---|---|---|---|---|---|---|
| **A. Home · About** | 4, ratio 4:5 | **Photocopy** (Nagavalli) | blown-out white paper | black and white only | thin red line, inset 1% | Rozha One title + Inter Tight caption |
| **B. Home · What the house does** | 4, ratio 1:1 | **Indigo screen-print** (Atmabodh colours) | cream `#f5e9cf` | indigo `#2343b8`, one marigold touch | none | none |
| **C. Home · Poster wall** | 3, ratio 3:4 | **Newsprint** (Samachar) | cream top 38%, sepia photo 62% | burnt orange title | none | Baloo 2 + Fraunces + Mukta |
| **D. Study zone** | 4, ratio 1:1 | **Faded beige print** (Janwari) | beige `#c9b99a` | black silhouettes + worn yellow and red | none | none |
| **E. Join the house** | 1, ratio 1.55:1 | **Warm dark blur** (Janwari on black) | near-black `#1c130c` | marigold light | none | Rozha One (optional) |

Every section uses the same three marks that tie the whole site together:
- **Hands** (only hands, cropped at the wrist, with a steel kada, glass bangles, a red *kalava* thread, mehendi or a wristwatch) or **objects**. Never a face.
- **Convergence**: arrows, lines or fingertips travelling in from every side to meet at one point.
- **The house star**: one sharp four-point star in sindoor red `#c8102e`, with concave sides, at the point where things meet.

### Palette
| Name | Hex | Name | Hex |
|---|---|---|---|
| Sindoor red | `#c8102e` | Cream paper | `#f5e9cf` |
| Indigo | `#2343b8` | Beige (section D) | `#c9b99a` |
| Marigold | `#f6b51e` | Burnt orange (section C) | `#d9631e` |
| Rani pink | `#e2387a` | Sepia (section C) | `#3a2412` |
| Forest green | `#0f5e48` | Ink | `#1c130c` |

---

## 1. How to keep a section identical (read once)

1. **Make the section's first picture, and lock it.** Generate it, choose the best of four, and approve it. Your first About picture (the circle of hands with the red star) is already approved, so it is the master for section A.
2. **Use it as a style reference for the other pictures in the section.**
   - Midjourney: add `--sref <image URL> --sw 300` to the prompt.
   - Ideogram: Style → "Style reference", upload the master.
   - ChatGPT or Gemini: upload the master and begin with "Make a new picture in exactly the same style, ground, colours, grain, border and framing as the attached one. The new subject is:".
3. **Paste the section's STYLE block first, then the SUBJECT line.** Each prompt below is already written that way, so you can paste it whole.
4. **Generate with no text.** Image generators misspell Devanagari. Add the type yourself in Canva or Figma, in the fonts and positions listed. A section's type goes in the same place in every picture.
5. **Add grain last, over everything.** Canva: noise or grain overlay at 20–30%. Photopea or Photoshop: Filter → Noise → Add Noise, 12–18%, monochrome, on top of the type. Add a white film-scratches texture (search "film scratches PNG") in Screen blend at 40%.
6. **Draw the star yourself** in Figma (Star tool, 4 points, inner ratio about 30%, fill `#c8102e`) and place it after the grain, so it stays sharp. Use the same star size in a section.
7. **Hands go wrong** in AI images (six fingers, fused thumbs). Generate four and pick the cleanest. A real photo of your own hands on a plain background, put through Photopea's Threshold or Color Halftone, beats any generation.
8. **Export** a JPG at 85%, under 8 MB. The site resizes it.

**Never include:** the IIT Madras logo, another house's name, real brand logos (YouTube's rounded play button, for example), or recognisable faces.

### Negative prompt (add to every generation)
```
face, person, portrait, eyes, text, letters, numbers, watermark, logo, signature, gradient, glossy, 3d render, plastic, neon glow, lens flare, bokeh, stock photo, extra fingers, fused fingers, distorted hands
```
In Midjourney: `--no face, person, text, letters, gradient, glossy, 3d render, extra fingers`.

### Sizes
| Slot | Ratio | Generate at | Shown as |
|---|---|---|---|
| About × 4 | 4:5 | 1600 × 2000 | a tall card; on phones a 96 px thumbnail that keeps the top |
| What the house does × 4 | 1:1 | 1600 × 1600 | a tilted square cut-out on a coloured card |
| Poster wall × 3 | 3:4 | 1800 × 2400 | a full poster in a frame |
| Join the house | 1.55:1 | 2480 × 1600 | wide, on the dark brown section |
| Study zone × 4 | 1:1 | 1200 × 1200 | a small cut-out in the card's top-right corner |

---

## A. Home · About — "Photocopy" (4 pictures, 4:5)

**What is locked in this section**
- Black-and-white photocopy, extreme film grain, very high contrast, blown highlights. Black, white and one red only.
- Camera: straight top-down, flat lay, on a pale background that blows out to white in the middle.
- Hands (or an object) cropped at the forearm, never a face.
- The red four-point star sits exactly where the subject's lines meet.
- A thin sindoor-red border, inset 1% from the edge.
- Subject in the top two-thirds, because phones show only the top of the thumbnail.
- **Type, if you add it** (identical on all four): title bottom-left in **Rozha One**, sindoor red, 9% of the image height, with a black copy offset 4 px down-right. Under it, "KAZIRANGA HOUSE" in **Inter Tight Medium**, red, tracked +200, 1.6% height, and below that the same words mirrored at 40% opacity.

**STYLE block (already inside each prompt):**
`Vertical 4:5 black-and-white photocopy, extreme film grain, very high contrast, blown-out highlights, scanned from a cheap printout. Shot straight top-down on a pale background that blows out to white in the middle. Only black, white and one sharp four-point sindoor-red (#c8102e) star with concave sides, placed exactly where the subject's lines meet. A thin sindoor-red border inset 1% from the edge. Black ink vignette in the corners, dust and white scratches. Subject in the top two-thirds. No faces. no text, no letters.`

### A1. Home · About · A vibrant community — the master (already approved)
```
Vertical 4:5 black-and-white photocopy, extreme film grain, very high contrast, blown-out highlights, scanned from a cheap printout. Shot straight top-down on a pale background that blows out to white in the middle. Only black, white and one sharp four-point sindoor-red (#c8102e) star with concave sides, placed exactly where the subject's lines meet. A thin sindoor-red border inset 1% from the edge. Black ink vignette in the corners, dust and white scratches. Subject in the top two-thirds. No faces. no text, no letters.

SUBJECT: nine human hands and forearms enter from every side, reaching toward the exact centre, fingertips almost touching but not quite. Different skin tones rendered in grey. Steel kada, stacked glass bangles, a thin red thread, a wristwatch, a trace of mehendi on the wrists. The red star sits at the centre, where the fingertips meet.
```
**Title:** "हम" ("we").

### A2. Home · About · Social gatherings
```
Vertical 4:5 black-and-white photocopy, extreme film grain, very high contrast, blown-out highlights, scanned from a cheap printout. Shot straight top-down on a pale background that blows out to white in the middle. Only black, white and one sharp four-point sindoor-red (#c8102e) star with concave sides, placed exactly where the subject's lines meet. A thin sindoor-red border inset 1% from the edge. Black ink vignette in the corners, dust and white scratches. Subject in the top two-thirds. No faces. no text, no letters.

SUBJECT: five hands and forearms enter from every side, each holding a drink up to meet in the centre: two cutting-chai glasses, a clay kulhad, a steel tumbler and a paper cup, all tipped together in a toast, rims almost touching. Thin curls of steam rise from the rims. Steel kada, glass bangles and a red thread on the wrists. The red star sits at the point where the rims meet.
```
**Title:** "मुलाक़ात" ("a meeting").

### A3. Home · About · Competitions
```
Vertical 4:5 black-and-white photocopy, extreme film grain, very high contrast, blown-out highlights, scanned from a cheap printout. Shot straight top-down on a pale background that blows out to white in the middle. Only black, white and one sharp four-point sindoor-red (#c8102e) star with concave sides, placed exactly where the subject's lines meet. A thin sindoor-red border inset 1% from the edge. Black ink vignette in the corners, dust and white scratches. Subject in the top two-thirds. No faces. no text, no letters.

SUBJECT: a relay baton passing between two hands, seen from above. A hand from the left holds out a worn aluminium baton, and a hand from the right closes its fingers around the other end, the two grips almost touching. Faint lane lines on the ground run underneath. A steel kada and a red thread on the wrists. The red star sits on the baton, where the two hands meet.
```
**Title:** "स्पर्धा" ("contest").

### A4. Home · About · Personal growth
```
Vertical 4:5 black-and-white photocopy, extreme film grain, very high contrast, blown-out highlights, scanned from a cheap printout. Shot straight top-down on a pale background that blows out to white in the middle. Only black, white and one sharp four-point sindoor-red (#c8102e) star with concave sides, placed exactly where the subject's lines meet. A thin sindoor-red border inset 1% from the edge. Black ink vignette in the corners, dust and white scratches. Subject in the top two-thirds. No faces. no text, no letters.

SUBJECT: two cupped hands from opposite sides, holding between them a small open book from which a young banyan sapling rises, five leaves, its stem reaching toward the top of the frame. Three more books are stacked beneath the hands, each a different size, forming steps. A steel kada and a red thread on the wrists. The red star sits above the top leaf.
```
**Title:** "विकास" ("growth").

---

## B. Home · What the house does — "Indigo screen-print" (4 pictures, 1:1)

**What is locked in this section**
- A flat, bold, screen-printed look. No photographs: one simple vector-like subject per picture.
- Ground: cream paper `#f5e9cf` with fine grain, the same in all four. Cream sits well against all four card colours (red, indigo, marigold, green).
- Ink: indigo `#2343b8` for the subject, with halftone dot fills. One small marigold `#f6b51e` touch. One red star.
- The subject is centred, fills about 70% of the frame, and is readable at 300 px wide.
- Slight colour misregistration (3 px), specks of dust.
- **No type** in these four. The card prints the title.

**STYLE block (already inside each prompt):**
`Square 1:1 flat screen-print on cream (#f5e9cf) grainy paper. Indigo (#2343b8) ink only, with halftone dot fills, one small marigold (#f6b51e) touch, and one sharp four-point sindoor-red (#c8102e) star with concave sides. Bold, simple, vector-like shapes, centred, filling 70% of the frame, readable at small size. Slight colour misregistration by 3 px, specks of dust. No photographs, no people. no text, no letters, no numbers.`

### B1. Home · What the house does · Meetups
```
Square 1:1 flat screen-print on cream (#f5e9cf) grainy paper. Indigo (#2343b8) ink only, with halftone dot fills, one small marigold (#f6b51e) touch, and one sharp four-point sindoor-red (#c8102e) star with concave sides. Bold, simple, vector-like shapes, centred, filling 70% of the frame, readable at small size. Slight colour misregistration by 3 px, specks of dust. No photographs, no people. no text, no letters, no numbers.

SUBJECT: a simple outline map of India, filled with halftone dots. Six thick arrows travel in from all directions outside the map and converge on one point near its centre, where there is a marigold map pin with a round hole. The red star sits above the pin. Six small circles mark cities along the arrows.
```

### B2. Home · What the house does · Events
```
Square 1:1 flat screen-print on cream (#f5e9cf) grainy paper. Indigo (#2343b8) ink only, with halftone dot fills, one small marigold (#f6b51e) touch, and one sharp four-point sindoor-red (#c8102e) star with concave sides. Bold, simple, vector-like shapes, centred, filling 70% of the frame, readable at small size. Slight colour misregistration by 3 px, specks of dust. No photographs, no people. no text, no letters, no numbers.

SUBJECT: a torn cinema ticket stub, tilted 12°, with a perforated edge and a punched half-circle notch, in solid indigo with halftone shading. Two crossed spotlight beams come down from the top corners and meet on the stub, each beam in halftone dots fading out. The marigold touch is a thin strip on the stub. The red star sits on the notch.
```

### B3. Home · What the house does · Study Zone
```
Square 1:1 flat screen-print on cream (#f5e9cf) grainy paper. Indigo (#2343b8) ink only, with halftone dot fills, one small marigold (#f6b51e) touch, and one sharp four-point sindoor-red (#c8102e) star with concave sides. Bold, simple, vector-like shapes, centred, filling 70% of the frame, readable at small size. Slight colour misregistration by 3 px, specks of dust. No photographs, no people. no text, no letters, no numbers.

SUBJECT: a tall stack of three old books seen from the side, a pencil laid across the top, and a brass diya flame above the pencil, the flame in marigold. A thin dotted arrow rises from the lowest book up past the flame. The red star sits at the tip of the arrow.
```

### B4. Home · What the house does · Kaziranga Tak
```
Square 1:1 flat screen-print on cream (#f5e9cf) grainy paper. Indigo (#2343b8) ink only, with halftone dot fills, one small marigold (#f6b51e) touch, and one sharp four-point sindoor-red (#c8102e) star with concave sides. Bold, simple, vector-like shapes, centred, filling 70% of the frame, readable at small size. Slight colour misregistration by 3 px, specks of dust. No photographs, no people. no text, no letters, no numbers.

SUBJECT: a one-horned Indian rhinoceros in solid indigo profile silhouette, standing in tall halftone grass, with faint horizontal scan lines across the whole picture. On the rhino's flank, a plain right-pointing play triangle cut out in cream (a triangle only, with no rounded box around it). The marigold touch is a low sun disc behind the rhino. The red star sits at the tip of the horn.
```

---

## C. Home · Poster wall — "Newsprint" (3 posters, 3:4)

These are **full posters with type in the picture**. They share one layout and one set of fonts, like three issues of the same newspaper.

**What is locked in this section**
- Top 38%: flat cream paper `#f5e9cf`, grainy and empty. Bottom 62%: a dark sepia photograph (`#3a2412` to black) with heavy grain and white scratches.
- **Title** in the cream area: **Baloo 2 ExtraBold**, burnt orange `#d9631e`, 17% of the poster height, wide as the poster, with an extruded shadow in `#8a3a0e` (Canva: Effects → Echo, offset down-right, 14 copies; Figma: duplicate the text 14 times, 1 px apart).
- Top left: a two-line subtitle in **Fraunces Regular**, burnt orange at 70%, 1.8% height.
- Top right: a large number or word in **Fraunces Black**, burnt orange at 35%, 7% height, with a small caption under it in **Inter**, 1.2%.
- Right side of the photo, right-aligned: **Mukta SemiBold**, cream, 2.4% height.
- Bottom left: a three-line caption in **Inter Light**, cream, 1.4% height.
- Bottom right: the small house logo (public/logo.png, in cream) above a cream barcode strip.
- One marigold four-point star in the photo, at the same relative height in all three.
- 5% safe margins: posters are cropped to fill.

**STYLE block (already inside each prompt):**
`Vertical 3:4 poster. The top 38% is flat cream paper (#f5e9cf), grainy and completely empty. The bottom 62% is a dark sepia photograph (deep brown #3a2412 to black), heavy film grain, white scratches and dust, soft and slightly out of focus in the corners, no people. One small sharp four-point star in marigold (#f6b51e) with concave sides, in the upper third of the photo. no text, no letters.`

### C1. Home · Poster wall · Kaziranga
```
Vertical 3:4 poster. The top 38% is flat cream paper (#f5e9cf), grainy and completely empty. The bottom 62% is a dark sepia photograph (deep brown #3a2412 to black), heavy film grain, white scratches and dust, soft and slightly out of focus in the corners, no people. One small sharp four-point star in marigold (#f6b51e) with concave sides, in the upper third of the photo. no text, no letters.

SUBJECT: a flat floodplain at dawn. Tall elephant grass in the foreground, a thick layer of river mist, and in the mist a one-horned rhinoceros and its calf in profile, half dissolved into black silhouettes. A greater adjutant stork on a bare branch at the right edge. A thin dark line of the Brahmaputra at the horizon and a pale sun disc behind the mist.
```
**Type:** title "काज़ीरंगा". Subtitle "Where the river floods and the grass comes back" (two lines). Top right "1985" with "UNESCO World Heritage Site" beneath. Right side: "On the south bank of the Brahmaputra, Assam" (two lines). Bottom caption: "About two-thirds of the world's greater one-horned rhinos live here. Every monsoon the river floods the park. Every year it comes back greener." Add "কাজিৰঙা" (Assamese) in **Noto Sans Bengali Bold**, cream at 90%, 3% height, over the grass; check that the letter "ৰ" shows correctly.

### C2. Home · Poster wall · Aarohan
```
Vertical 3:4 poster. The top 38% is flat cream paper (#f5e9cf), grainy and completely empty. The bottom 62% is a dark sepia photograph (deep brown #3a2412 to black), heavy film grain, white scratches and dust, soft and slightly out of focus in the corners, no people. One small sharp four-point star in marigold (#f6b51e) with concave sides, in the upper third of the photo. no text, no letters.

SUBJECT: the inside of an empty college auditorium seen from the back. Rows of folding seats in deep shadow lead to a bare stage at the far end, and one huge shaft of warm light falls from above onto a single microphone stand at centre stage, dust floating in the beam. A blurred stage curtain hangs at the edges.
```
**Type:** title "आरोहण" ("ascent"). Subtitle "The house fest: cultural, technical and e-sports" (two lines). Top right "AAROHAN" with "The house fest" beneath. Right side: "Stage lights, long rehearsals" (two lines). Bottom caption: "Aarohan is the house fest, where the house competes as one team in cultural, technical and e-sports events."

### C3. Home · Poster wall · Meetups across India
```
Vertical 3:4 poster. The top 38% is flat cream paper (#f5e9cf), grainy and completely empty. The bottom 62% is a dark sepia photograph (deep brown #3a2412 to black), heavy film grain, white scratches and dust, soft and slightly out of focus in the corners, no people. One small sharp four-point star in marigold (#f6b51e) with concave sides, in the upper third of the photo. no text, no letters.

SUBJECT: close-up from above of two pairs of hands, cropped at the forearm, unfolding a creased paper map of India on a wooden table, one pair from the left and one from the right, a steel kada on one wrist and a red kalava thread on another. Fold lines across the map. A cup of chai and a train ticket at the corners. One city is circled by a hand-drawn ink loop.
```
**Type:** title "मिलते रहिए" ("keep meeting"). Subtitle "Chai, treks and long conversations" (two lines). Top right "INDIA" in **Fraunces Black**, with "Meetups in cities across the country" beneath. Right side: "Find a meetup near you" (two lines). Bottom caption: "The house meets in cities across India. Come for the chai, stay for the long conversations."

---

## D. Study zone — "Faded beige print" (4 pictures, 1:1)

**What is locked in this section**
- A flat, faded two-ink print on beige paper `#c9b99a` with heavy grain, like the Janwari reference but sharp enough to read at 120 px.
- Subject as a solid ink-black silhouette (`#1c130c`), centred, filling 75% of the frame.
- A worn marigold `#f6b51e` shape and a sindoor-red `#c8102e` shape printed slightly off-register behind the silhouette (6 px right and 4 px down), with an eroded, worn texture.
- A small cream line-art eight-petal flower in the bottom-left corner, 1 px line, the same in all four.
- One red four-point star at the point where the subject's lines meet.
- A soft dark shadow on the left edge. Dust and scratches.
- No type in these four. The card prints the title.

**STYLE block (already inside each prompt):**
`Square 1:1 flat faded two-ink print on beige (#c9b99a) grainy paper. The subject is a solid ink-black (#1c130c) silhouette, centred, filling 75% of the frame. Behind it, a worn marigold (#f6b51e) shape and a worn sindoor-red (#c8102e) shape printed off-register by 6 px right and 4 px down, with an eroded, scratchy texture. A small cream line-art eight-petal flower in the bottom-left corner. One small sharp four-point sindoor-red star with concave sides at the point where the subject's lines meet. A soft dark shadow along the left edge, heavy grain, dust. Readable at 120 px. No people. no text, no letters, no numbers.`

### D1. Study zone · Notes
```
Square 1:1 flat faded two-ink print on beige (#c9b99a) grainy paper. The subject is a solid ink-black (#1c130c) silhouette, centred, filling 75% of the frame. Behind it, a worn marigold (#f6b51e) shape and a worn sindoor-red (#c8102e) shape printed off-register by 6 px right and 4 px down, with an eroded, scratchy texture. A small cream line-art eight-petal flower in the bottom-left corner. One small sharp four-point sindoor-red star with concave sides at the point where the subject's lines meet. A soft dark shadow along the left edge, heavy grain, dust. Readable at 120 px. No people. no text, no letters, no numbers.

SUBJECT: an open ruled notebook seen from above, as a black silhouette with cream ruled lines, a pencil lying diagonally across it, and three loose arrows and a wavy underline scribbled in cream on the page. The marigold shape is a highlighter stroke behind one line. The red star sits at the pencil tip.
```

### D2. Study zone · Revision sessions
```
Square 1:1 flat faded two-ink print on beige (#c9b99a) grainy paper. The subject is a solid ink-black (#1c130c) silhouette, centred, filling 75% of the frame. Behind it, a worn marigold (#f6b51e) shape and a worn sindoor-red (#c8102e) shape printed off-register by 6 px right and 4 px down, with an eroded, scratchy texture. A small cream line-art eight-petal flower in the bottom-left corner. One small sharp four-point sindoor-red star with concave sides at the point where the subject's lines meet. A soft dark shadow along the left edge, heavy grain, dust. Readable at 120 px. No people. no text, no letters, no numbers.

SUBJECT: a round clock face with no numbers, ringed by a thick circular arrow that chases its own tail, with short tick marks inside. The clock's two hands are arrows. The marigold shape is the disc behind the clock face. The red star sits at the centre, where the hands meet.
```

### D3. Study zone · YouTube channels
```
Square 1:1 flat faded two-ink print on beige (#c9b99a) grainy paper. The subject is a solid ink-black (#1c130c) silhouette, centred, filling 75% of the frame. Behind it, a worn marigold (#f6b51e) shape and a worn sindoor-red (#c8102e) shape printed off-register by 6 px right and 4 px down, with an eroded, scratchy texture. A small cream line-art eight-petal flower in the bottom-left corner. One small sharp four-point sindoor-red star with concave sides at the point where the subject's lines meet. A soft dark shadow along the left edge, heavy grain, dust. Readable at 120 px. No people. no text, no letters, no numbers.

SUBJECT: a round film reel seen from the front, with five circular cut-outs, and a short strip of film with square frames trailing from the bottom. In the central hub, a plain right-pointing play triangle cut out in beige (a triangle only, with no rounded box, so it cannot be mistaken for another brand). The marigold shape is a disc behind the reel. The red star sits at the tip of the play triangle.
```

### D4. Study zone · GPA calculator
```
Square 1:1 flat faded two-ink print on beige (#c9b99a) grainy paper. The subject is a solid ink-black (#1c130c) silhouette, centred, filling 75% of the frame. Behind it, a worn marigold (#f6b51e) shape and a worn sindoor-red (#c8102e) shape printed off-register by 6 px right and 4 px down, with an eroded, scratchy texture. A small cream line-art eight-petal flower in the bottom-left corner. One small sharp four-point sindoor-red star with concave sides at the point where the subject's lines meet. A soft dark shadow along the left edge, heavy grain, dust. Readable at 120 px. No people. no text, no letters, no numbers.

SUBJECT: a wooden abacus with six horizontal rods, as a black silhouette with cream beads, the beads slid so they step up from the lower left to the upper right, forming a rising staircase. A thin arrow follows the top of the beads and points up and right. The marigold shape is a rising bar behind the beads. The red star sits at the arrow tip.
```

---

## E. Home · Join the house — "Warm dark blur" (1 picture, 1.55:1)

This is one picture on its own, so it only has to suit the dark section it sits on.

**What is locked:** a near-black ground `#1c130c`, warm marigold light only, shot out of focus and underexposed, heavy grain, one hand, one star.

```
Wide 1.55:1 grainy film photograph on a near-black background (#1c130c), shot out of focus and underexposed, warm sepia and marigold tones only. From the right edge, a single hand and forearm reaching in, palm open and up, fingers slightly curled, a thin red thread on the wrist, held out toward the left. On the left, a tall narrow doorway cut into the dark wall, flooded with soft overexposed marigold-yellow light that spills onto the floor in a long wedge. Dust floating in the beam. The hand is lit from the left by the spill and fades to black at the elbow. No face, no body. Heavy film grain and scratches. The hand sits in the right 60%; the left 35% keeps the door and a clean pool of warm light. One small sharp four-point sindoor-red star with concave sides floats in the beam above the palm. no text, no letters.
```
**Type (optional, top left, in the wall area):** "आइए" ("come in") in **Rozha One**, marigold, 13% height, with a second copy in sindoor red offset 5 px down-right, eroded with a grunge mask. Under it, "THE DOOR IS OPEN" in **Inter Light**, cream, tracked +200, 1.6% height.

---

## F. Fonts, section by section

All are free on Google Fonts. **(dev)** means it can set Devanagari.

| Section | Title | Small type |
|---|---|---|
| A. About | **Rozha One (dev)**, red, with a black offset copy | **Inter Tight Medium**, red, mirrored once |
| B. What the house does | none | none |
| C. Poster wall | **Baloo 2 ExtraBold (dev)**, burnt orange, extruded | **Fraunces** (subtitle and number), **Mukta SemiBold (dev)** (side text), **Inter Light** (caption) |
| D. Study zone | none | none |
| E. Join the house | **Rozha One (dev)**, marigold with a red copy | **Inter Light**, cream |
| Assamese (poster wall only) | **Noto Sans Bengali Bold** | |

The site's own fonts are **Yatra One** (headings) and **Mukta** (body). The About and Join sections use Rozha One, because it looks like the worn print in your Janwari reference. The poster wall uses Baloo 2, because it looks like the title in your Samachar reference.

---

## G. Checklist: does the section look like one set?

Put the pictures of a section side by side at thumbnail size, and check:
1. Same ground colour and same ink colours?
2. Same camera angle and the same distance from the subject?
3. Same grain, same border or frame?
4. Same star: same red, same size, and sitting where things meet?
5. Is the type (if any) in the same place, the same size, and the same font in every picture?
6. No faces?
7. In the portal: **Website → Site images**. Choose the slot, upload, and write one plain sentence of alt text. Example: "Hands from every side reaching toward one point."
8. Open the site on a phone. The About cards and the Study squares are very small there.
