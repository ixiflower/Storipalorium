<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=28&pause=800&color=2196F3&center=true&vCenter=true&width=600&height=60&lines=Storipalorium" alt="Typing Animation" />
</div>

<p align="center">
  A contemplative, minimal bookmark and snippet storage app — somewhere to save something for someday.
</p>

## About

A place to keep quotes, links, notes, and media. Built with Next.js and a dark, monospace aesthetic.

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)

</div>

## Features

<div align="center">

- **Daily Wisdom Quotes** — Fetches random wisdom quotes from API-Ninjas with a 20-second cooldown refresh
- **Create Items** — Add bookmarks, notes, or media via Ctrl+V or drag-and-drop with title, link, and category
- **Slide-in Navigation** — Full-screen menu with hover effects and route labels
- **Fingerprint Login** — Simulated biometric authentication with pulse animation
- **Dark Theme** — Always-dark mode with a custom OKLCH color palette
- **Monospace Typography** — Reddit Mono font throughout for a clean, terminal-like feel

</div>

## Tech Stack

<div align="center">

| Technology | Version |
|------------|---------|
| Next.js | 16.0.5 |
| React | 19.2.0 |
| TypeScript | 5.x |
| Tailwind CSS | 4.x |
| shadcn/ui | New York style |
| Radix UI | Dialog, Slot |
| Lucide Icons | 0.555.0 |
| tw-animate-css | 1.4.0 |
| API-Ninjas | Random quotes |

</div>

## Getting Started

### Prerequisites

- Node.js
- A [API-Ninjas](https://api-ninjas.com) API key (for quotes)

### Setup

```bash
npm install
```

Create a `.env.local` file:

```
NINJAS_API_KEY=your_api_key_here
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage with daily quote and taglines |
| `/create` | Create new items via Ctrl+V or drag-and-drop |
| `/category` | Category listing (placeholder) |
| `/api` | API documentation (placeholder) |
| `/login` | Login with email/password and fingerprint |

## Deployment

Deploy on [Vercel](https://vercel.com) with the `NINJAS_API_KEY` environment variable set.
