# dhruva
A cognitive clarity companion that helps people move from mental overload to one clear next step through conversation.

## Architecture

Dhruva is one repository containing two independently deployed applications:

- `apps/mobile` — React Native with Expo Router; native builds use EAS.
- `apps/api` — Next.js route handlers; the Vercel project root is `apps/api`.
- `packages/contracts` — planned shared public TypeScript contracts (W1-02; not created in W1-01).
- Supabase provides PostgreSQL and magic-link authentication.
- The mobile app accesses application data only through `/api/*`; only authentication talks directly to Supabase.
- Gemini, database credentials and owner configuration remain server-only.
- The native deep-link scheme is `dhruva`.

## Specification authority

For implementation conflicts:

1. `docs/week-1-decisions.md` governs B1–B5.
2. `docs/week-2-decisions.md` governs W2-A1–W2-A9.
3. `BUILDING-Addendum-v1.md` overrides `BUILDING.md`.
4. `BUILDING.md` governs everything else.
5. The current ticket's Files, Functions, Work and Done fields define its allowed scope.

The SDK 57 scaffold additionally needs `apps/mobile/src/types/styles.d.ts` so its generated CSS imports pass standalone TypeScript validation.

## W1-01 workspace scaffold

Run `pnpm install --frozen-lockfile`, `pnpm run check` and `pnpm run build` from the repository root. Both apps use the root `pnpm-workspace.yaml` and `pnpm-lock.yaml`; do not add app-local workspace files or lockfiles. The build script builds the Next.js scaffold and exports the Expo Android bundle. Native development builds use the `development` profile in `apps/mobile/eas.json`.

Configure the Vercel project Root Directory as `apps/api`. Public mobile environment placeholders belong in `apps/mobile/.env.example`; server configuration and secret placeholders belong in `apps/api/.env.example`. Real credentials must remain in ignored local environment files or deployment settings.

The generated Expo Router skeleton lives in `apps/mobile/src/app/` (`_layout.tsx`, `index.tsx`, `explore.tsx`), rather than the plan's `apps/mobile/app/` paths. The Next.js skeleton lives in `apps/api/src/app/` (`layout.tsx`, `page.tsx`); API route handlers have not been implemented. Existing skeleton exports are preserved.
