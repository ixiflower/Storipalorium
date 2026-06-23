# Storipalorium — Agent Index

## Tech Stack
- **Framework:** Next.js 16 (App Router), React 19.2, TypeScript 5
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`), `tw-animate-css`
- **UI:** shadcn/ui New York style, Radix UI, `class-variance-authority`
- **Icons:** `lucide-react` ^0.555
- **Font:** `@next/font/google` → Reddit Mono (monospace only)

## Key Files

| Path | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout — always `<html class="dark">`, loads Reddit Mono, renders `<Navbar />` |
| `app/page.tsx` | Homepage — animated taglines, daily wisdom quote (20s cooldown), music icon |
| `app/create/page.tsx` | Full-screen drop zone with Ctrl+V / drag-and-drop, dialog form (title/link/category) |
| `app/login/page.tsx` | Email/password + fingerprint scan button with pulse animation |
| `app/category/page.tsx` | Placeholder |
| `app/api/page.tsx` | Placeholder |
| `app/api/daily-quote/route.ts` | Proxies API-Ninjas wisdom quotes, `?fresh=1` bypasses 24h revalidation |
| `app/globals.css` | ALL theme tokens — OKLCH colors, fonts, spacing, custom pulse animation |
| `components/navbar.tsx` | Top bar + full-screen slide-in nav panel from right |
| `components/ui/*.tsx` | shadcn primitives: Button, Card, Dialog, Input |
| `lib/utils.ts` | `cn()` helper (clsx + tailwind-merge) |
| `search.py` | BM25 search engine for UI/UX design (domain, stack, design-system) |

## Project Structure
```
app/          — Next.js App Router pages & API routes
components/   — React components (ui/ for shadcn primitives)
lib/          — Utilities
public/       — Static assets (SVGs)
```

## Critical Conventions

### Theme
- Always-dark mode (`<html class="dark">` in `layout.tsx` — do NOT remove)
- See `design.md` for full theme & concept documentation

### Visual Style
- **Borders:** Chunky 3D effect via `border-t border-l border-r-6 border-b-6` (heavy right/bottom)
- **Radius:** `0rem` — fully square everywhere
- **Spacing:** base unit `0.22rem`
- **Shadows:** all zero-opacity (flat design)
- **Font:** Reddit Mono only (set in `:root` as `--font-sans`)

### Development
- **Lint:** `npm run lint` (ESLint with next/core-web-vitals + TypeScript)
- **Build:** `npm run build`
- **Dev server:** `npm run dev`
- **Path alias:** `@/` maps to project root
