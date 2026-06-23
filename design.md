# Storipalorium — Design Theme & Concept

## Concept

**Storipalorium** is a "contemplative, minimal bookmark and snippet storage app." The name evokes the feel of a digital cabinet or reliquary — a quiet place to save things that matter for later.

The core premise: *somewhere to save something for someday.* The app treats each saved item (link, note, media) as a deliberate act, not a firehose. It resists the noise of modern bookmarking tools in favor of intention.

## Visual Theme — "Terminal Brutalism"

### Monospace-Only Typography
Reddit Mono is the sole typeface across the entire interface. There are no sans-serif or serif body fonts. This creates a terminal / code-editor / typewriter feel — precise, no-nonsense, text-first.

### Always-Dark Mode
The app lives entirely in dark mode. There is no light mode. The palette:
- **Background:** Near-black (`oklch(0.1684 0 0)`)
- **Foreground (text):** Warm gold/tan (`#c0b38a`) — like old terminal phosphor or aged paper
- **Primary:** Near-white warm — for headings and emphasis
- **Secondary:** Muted teal-green — for decorative elements, borders, accents
- **Accent:** Muted cyan-teal — for subtle interactive highlights
- **Borders:** Dark gray — present but never loud

Colors are authored in OKLCH for perceptual uniformity across the gamut.

### Brutalist UI Elements
- **Chunky asymmetrical borders:** Elements use `border-t border-l border-r-6 border-b-6` — thin top/left, thick right/bottom — creating a 3D embossed or extruded effect
- **Zero border-radius:** Every corner is fully square (`--radius: 0rem`)
- **Flat with depth:** Shadows are present in CSS but set to zero opacity — the only depth comes from the asymmetric borders
- **Custom spacing:** Base unit `0.22rem` gives the layout a slightly denser, more deliberate rhythm

### Key Interactions
- **Login:** Fingerprint-style icon triggers a 2-second pulse-glow animation — a biometrically-inspired ritual rather than a real scanner
- **Quote Refresh:** A 20-second cooldown with an inline progress bar — enforces patience and contemplation
- **Creating Items:** Full-screen drop zone with Ctrl+V or drag-and-drop — each save is a deliberate gesture
- **Navigation:** Full-screen slide-in panel from the right, with hover indicators that animate in — no hamburger dropdown, just full immersion

## Mood
The overall feel is **museal, analog, archival.** Like walking through a dimly lit gallery or a library archive room. The warm gold text against near-black evokes candlelight on parchment. The monospace font and chunky borders nod to retro computing and early terminal interfaces, but the color palette — the teal-green, cyan, and warm gold — keeps it from feeling cold or purely nostalgic. It's warm brutalism.

## Inspirations
- Terminal UIs (monospace, no shadows, square corners)
- Brutalist web design (asymmetric borders, raw layout)
- Digital archival tools (Pinboard, Are.na)
- Analog warmth (gold/sepia tones, parchment-like foreground)
