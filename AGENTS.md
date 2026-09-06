<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — kahoot-clone

## Stack — reglas estrictas

- **Next.js App Router + TypeScript + Tailwind CSS 4 + Supabase (Auth, PostgreSQL, Realtime) + Zustand.** No añadir otra librería de estado/data-fetching sin justificar. Supabase y Zustand aún no están en `package.json:11-25` — instalar con `npm install @supabase/supabase-js zustand` cuando se necesiten.
- TypeScript estricto (`tsconfig.json:7` `strict: true`): prohibido `any`, tipar props/retornos, usar `type`/`interface` explícitos. Debe pasar `npx tsc --noEmit`.

## Arquitectura — reglas estrictas

- **Server Actions primero para mutaciones DB.** Prioriza `use server` / Server Actions sobre Route Handlers (`src/app/api/`) o fetch cliente. Handlers solo para webhooks o streaming que no puede hacer una Action.
- **`'use client'` solo si es imprescindible:** interactividad (`useState`/`useEffect`), eventos del navegador, Zustand, o WebSockets/Supabase Realtime. Por defecto todo es Server Component.
- Supabase: centralizar clientes en `src/lib/supabase/client.ts` (browser) y `src/lib/supabase/server.ts` (server/RSC). No crear clientes inline por componente.
- Zustand: solo para estado efímero de cliente (ej. estado de partida en vivo, UI). No duplicar estado que ya vive en Supabase/Postgres.

## Diseño UI — reglas estrictas

- **Mobile-first para `/play` (jugador):** diseñar base en `320px` → escalar con `sm:`/`md:`. Toda ruta bajo `src/app/play/` debe probarse primero en viewport móvil.
- **Desktop-first para `/host` (panel creador):** diseñar base en `1024px+` → adaptar hacia abajo. Toda ruta bajo `src/app/host/` prioriza layout de escritorio (tablas, drag-and-drop, edición).
- Código modular, componentes pequeños y limpios (single responsibility). Extraer lógica a `src/components/`, `src/lib/`, `src/stores/` (Zustand). Reutilizar con alias `@/*` → `./src/*` (`tsconfig.json:21-23`).

## Commands

Run from `kahoot-clone/` (where `package.json` lives), not parent `clon_Kahoot/`. Requires `npm install` first.

- `npm run dev` — dev server http://localhost:3000 (HMR on `src/app/page.tsx`)
- `npm run build` — production build + typecheck (`next build` fails on type errors)
- `npm start` — serve production build
- `npm run lint` — ESLint (`eslint-config-next` core-web-vitals + typescript, see `eslint.config.mjs`)
- `npx tsc --noEmit` — typecheck only, no npm script (`strict: true`, `noEmit: true`)
- No test runner — `npm test` does not exist (add vitest/jest before testing)

Verify with `npm run build` after changes; it catches build and type errors.

## Structure

- Single-package Next.js 16.3.4 App Router + React 19.2.8 + TypeScript 5 + Tailwind CSS 4.
- Entrypoints: `src/app/layout.tsx:20` (`RootLayout`), `src/app/page.tsx:3` (`Home`). Nuevas rutas: `src/app/play/` (mobile-first) y `src/app/host/` (desktop-first) con `page.tsx`/`layout.tsx`.
- Path alias `@/*` → `./src/*` (`tsconfig.json:21-23`). Solo `src/app/` existe hoy — crear `src/components/`, `src/lib/supabase/`, `src/stores/` según se necesite (no existen aún).
- Static assets in `public/`; `next.config.ts` is minimal/empty; `postcss.config.mjs:3` uses `@tailwindcss/postcss`.
- Tailwind 4: `@import "tailwindcss"` in `src/app/globals.css:1`, not `@tailwind` directives.

## Gotchas

- **Do not delete the `nextjs-agent-rules` block above.** `next dev` regenerates it; committing it keeps the tree clean.
- `CLAUDE.md` is `@AGENTS.md` — this file is canonical.
- No `opencode.json`/`opencode.jsonc`, CI, or pre-commit hooks — no enforced lint/typecheck order.
- `.env*` gitignored (`.gitignore:34`) — al añadir Supabase, requerirá `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (y `SUPABASE_SERVICE_ROLE_KEY` solo en server). Nunca commitear `.env*`.
- Generated — do not edit: `next-env.d.ts` (`next-env.d.ts:6`), `.next/`, `tsconfig.tsbuildinfo`.
