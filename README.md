# FitLab — Frontend Next.js

PWA mobile-first pour l'essayage virtuel.
 
## Setup

```bash
# 1. Installer Node.js 20+ : https://nodejs.org
# 2. Installer pnpm
npm install -g pnpm

# 3. Installer les dépendances
pnpm install

# 4. Configurer l'API backend
cp .env.example .env.local
# Éditer .env.local si le backend tourne ailleurs que localhost:8000

# 5. Lancer
pnpm dev
```

Ouvrir http://localhost:3000

## Architecture

```
src/
├── app/
│   ├── layout.tsx       ← Root layout (fonts, meta, PWA)
│   └── page.tsx         ← App principale (navigation 4 onglets)
├── components/
│   ├── WardrobeScreen   ← Garde-robe + filtres + météo + affiliés
│   ├── TryOnScreen      ← Compose tenue + essayage FASHN
│   ├── HistoryScreen    ← Historique des essayages
│   └── ProfileScreen    ← Profil + préférences
├── lib/
│   ├── api.ts           ← Fetch centralisé vers le backend
│   └── types.ts         ← TypeScript types
└── styles/
    └── globals.css      ← Tailwind + design system FitLab
```

## Backend

Le backend Python (FastAPI) tourne séparément.
Les appels API sont proxied via `next.config.js` rewrites.
