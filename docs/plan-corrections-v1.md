# Dhruva — Plan Corrections v1

18 September 2026. Corrections to the Week 1–4 file-and-function plans, found by reviewing them against the actual repository state at commit 20 (W1-04 complete).

This file **overrides the week plans** on the three points below. It does not override `BUILDING-Addendum-v1.md`, `docs/week-1-decisions.md`, `docs/week-2-decisions.md` or `docs/week-3-decisions.md`, and it reopens nothing already settled.

Add to the README's specification-authority list so the precedence chain is complete:

```
1. docs/week-1-decisions.md governs B1–B5.
2. docs/week-2-decisions.md governs W2-A1–A9.
3. docs/week-3-decisions.md governs W3-A1–A15.
4. docs/week-4-decisions.md governs W4-A1–A10.
5. docs/plan-corrections-v1.md corrects the week plans' file paths and adds the eval harness.
6. BUILDING-Addendum-v1.md overrides BUILDING.md.
7. BUILDING.md governs everything else.
8. The current ticket's Files, Functions, Work and Done fields define its allowed scope.
```

---

## Correction 1 — Mobile screen paths

**Problem.** The Week 1 plan proposed `apps/mobile/app/` for Expo Router screens. The generated SDK 57 scaffold actually places them at `apps/mobile/src/app/`. The README documents this divergence for W1-01, but the Week 2, 3 and 4 plans all inherited the original wrong paths. An agent following those tickets literally will create a second, dead app directory that Expo Router never reads.

**Correction.** Every Expo Router screen path in every plan reads `apps/mobile/src/app/…`, not `apps/mobile/app/…`.

Non-screen mobile paths (`apps/mobile/src/api.ts`, `src/useChat.ts`, `src/useNow.ts`, `src/push.ts`, `src/auth.tsx`, `src/storage.ts`, `src/components/…`) are already correct and unchanged.

| Plan | Ticket | Was | Is |
| --- | --- | --- | --- |
| Week 2 | W2-20 | `apps/mobile/app/chat.tsx` | `apps/mobile/src/app/chat.tsx` |
| Week 3 | W3-21 | `apps/mobile/app/_layout.tsx` | `apps/mobile/src/app/_layout.tsx` |
| Week 4 | W4-18 | `apps/mobile/app/review.tsx` | `apps/mobile/src/app/review.tsx` |
| Week 4 | W4-20 | `apps/mobile/app/_layout.tsx` | `apps/mobile/src/app/_layout.tsx` |

Also correct in the same way, in the plans' file manifests: `sign-in.tsx`, `auth/callback.tsx`, `setup.tsx`, `index.tsx`.

The scaffold's existing `apps/mobile/src/app/explore.tsx` is generated boilerplate with no role in any ticket. Delete it when a ticket first touches the router, and record the deletion — do not leave it as a live route.

`apps/mobile/src/types/styles.d.ts` is a required SDK 57 scaffold file (generated CSS imports fail standalone TypeScript validation without it). It exists and no ticket may remove it.

**Standing rule for agents.** If a ticket's stated path does not exist in the repository, that is a **Blocked** condition under WORKFLOW.md — write the question into the ticket. Never create the plan's path alongside a real one that differs.

---

## Correction 2 — Cron configuration belongs in `apps/api/vercel.json`

**Problem.** The Week 3 plan (W3-23) placed the cron schedules in a root `vercel.json`. The Vercel project's Root Directory is `apps/api`, so Vercel reads `apps/api/vercel.json`. A root file would be ignored and no cron would ever fire — silently, with no error. No `vercel.json` currently exists anywhere in the repository.

**Correction.** The file is **`apps/api/vercel.json`**. Every reference to a root `vercel.json` in the Week 3 and Week 4 plans is replaced.

Per W3-A2, all three routes are invoked every 30 minutes UTC, and each handler no-ops unless its local window matches. The schedule is therefore identical for all three:

```json
{
  "crons": [
    { "path": "/api/cron/nightly", "schedule": "*/30 * * * *" },
    { "path": "/api/cron/nudge",   "schedule": "*/30 * * * *" },
    { "path": "/api/cron/review",  "schedule": "*/30 * * * *" }
  ]
}
```

Local windows, resolved in the handler by `schedule.ts` against the configured IANA timezone: nightly **02:00**, nudge **09:00** and **17:30**, review **Sunday 07:30**.

**Ticket changes.**

- **W3-23** creates `apps/api/vercel.json` with all three entries, including `/api/cron/review` pointing at the Week 3 stub. Registering it now means Week 4 needs no deploy-config change, which was the ticket's original intent.
- **W3-23 Done** adds: the file is at `apps/api/vercel.json`, the Vercel Root Directory is confirmed as `apps/api`, and a deployment log shows the cron registered — not merely that the file exists. A misplaced cron config fails silently, so file existence is not evidence.
- **W4-15** touches only the route handler. It must not move or duplicate the cron config.

**Note on invocation cost.** 30-minute dispatch means 144 invocations a day across three routes. Every handler must return immediately when its window does not match, before any database work, or the no-op path becomes the app's largest expense.

---

## Correction 3 — The eval harness has no ticket

**Problem.** `BUILDING.md` §6 calls the eval harness "100 lines and priceless" and §5 puts the forbidden-phrase grep in CI, listing "Voice violating soul rules" and "NO_NUDGE erosion" as AI risks mitigated by exactly this. Weeks 1–4 contain 93 tickets, each with its own unit tests — and none of them builds the corpus-replay harness. It is the one artifact BUILDING.md names as protecting the product's soul, and it was planned nowhere.

There is also no CI at all: no `.github/workflows`, and root `package.json` has `check` (peers, typecheck, lint) but no `test` script and no vitest configuration. Symphony's own guidance is that it punishes repos lacking tests and CI immediately and expensively.

**Correction.** Two new tickets, inserted into Week 2 — the first week in which Voice exists and therefore the first week the harness can assert anything.

### W2-23 — Establish test runner and CI

**Files:** `package.json`; `apps/api/vitest.config.ts`; `.github/workflows/check.yml`.
**Functions:** none.
**Work:** add a root `test` script; configure vitest for `apps/api`; add a GitHub Actions workflow running `pnpm install --frozen-lockfile`, `pnpm run check` and `pnpm run test` on every push and pull request. No deployment steps, no secrets in CI beyond what tests need — the eval harness's Gemini calls are excluded from CI (see W2-24).
**Done:** CI runs green on the current `main`; a deliberately failing unit test fails the workflow; the mandatory `engine.test.ts` suite from W2-05 runs in CI.
**Depends on:** W2-05 (first mandatory tests). **Blocks:** W2-24.

### W2-24 — Build the corpus-replay eval harness

**Files:** `tools/eval/harness.ts`; `tools/eval/cases.ts`; `tools/eval/README.md`; `docs/eval.md`.
**Functions:** `loadCases`, `replayCase`, `checkViolations`, `report`.
**Work:** replay the user messages from `dhruva-100-conversations.md` through the Voice pipeline and grep the outputs for violations. The corpus is already in the repository and is the canonical case source — do not author a parallel set of invented cases.

Checks, all from `BUILDING.md` §2.3 and §6:

- Forbidden phrases: `as you mentioned`, `according to my (memory|records|notes)`, `I remember`, `you've got this`, `small wins`, `let's crush`
- Exclamation marks in any output discussing something undone
- Corrective nudges missing exit language (`drop`, `it's gone`, `hand it`, `shelf`)
- Any output listing more than 3 items
- Any reference to a released or dead item

Run manually, not in CI — it makes real Gemini calls and costs money per run. `docs/eval.md` records how to run it and the last recorded result.

**Known limitation, recorded not solved.** Many corpus entries are scheduler events, review contexts, timed misses or pre-existing history rather than user messages (Astra's original review finding #34). This harness covers the replayable user-message subset only. It does not validate gates, wake behavior, deletion, budgets or memory versioning — those belong to each week's own integration tests. Record the covered count explicitly in `docs/eval.md` so the harness is never mistaken for full coverage.

**Done:** the harness runs against the replayable subset and reports pass/fail per check with the violating output quoted; a deliberately seeded forbidden phrase is caught; `docs/eval.md` states the covered case count and the checks that are *not* covered.
**Depends on:** W2-14, W2-15 (Voice and guard must exist), W2-23.

### W3-26 — Add the NO_NUDGE assertion to the harness

**Files:** `tools/eval/harness.ts`; `tools/eval/cases.ts`; `docs/eval.md`.
**Work:** add a synthetic nudge-tick suite and assert that **at least 30% of cases produce `NO_NUDGE`**, per `BUILDING.md` §5's stated AI risk ("models hate silence"). The corpus's two explicit silence entries (45, 50) are not a sufficient sample — this is a separate synthetic suite, as BUILDING itself notes.
**Done:** the assertion runs and passes; forcing every tick to compose makes it fail. BUILDING §4's rule is recorded in `docs/eval.md`: a tick that is never `NO_NUDGE` means guard has failed.
**Depends on:** W2-24, W3-18.

### W4-25 — Add review-structure checks to the harness

**Files:** `tools/eval/harness.ts`; `docs/eval.md`.
**Work:** assert the Week 4 guard rules against generated reviews — five movements in order, at most one question, no percentages, streaks, velocity or week-over-week comparisons, no released or dead items outside the current window's releases.
**Done:** a seeded second question and a seeded percentage are both caught.
**Depends on:** W2-24, W4-14.

---

## Standing repository facts the plans should have known

Recorded so no future ticket rediscovers them:

| Fact | Consequence |
| --- | --- |
| Expo Router screens live at `apps/mobile/src/app/` | Correction 1 |
| Next.js App Router lives at `apps/api/src/app/` | Plans' API route paths are already correct |
| Vercel Root Directory is `apps/api` | Correction 2; any deploy config belongs under `apps/api` |
| `packages/contracts` exists (W1-02 complete) | Extend it; never recreate |
| Migrations `…0001_base`, `…0002_conversations_messages`, `…0003_week1_setup_access` are committed | Next forward migration is `…0004_week2_execution`; never edit an applied file |
| Root scripts are `typecheck`, `lint`, `build`, `check` — no `test` | W2-23 adds it |
| Node 24.x, pnpm 12.4.1, single root lockfile | No app-local lockfiles or workspace files |
| `apps/mobile/src/types/styles.d.ts` is required by the SDK 57 scaffold | No ticket may remove it |

---

## Outstanding items this file does not fix

These need a decision or an action from you, not a correction to a plan:

1. **WORKFLOW.md is still Week-1-only.** It prohibits engine, nudge and consolidation work, so Week 2 tickets cannot legally be dispatched today. W3-01 and W4-01 update it for their weeks; Week 2 has no equivalent ticket and needs one.
2. **Week 3 and Week 4 plans, and `docs/week-3-decisions.md`, are not committed.** Agents can only read what is in the repository.
3. **`tools/symphony/` has no configuration.** Symphony is not wired, and no tickets exist as issues in any tracker — so nothing can be claimed by an agent yet.
4. **Migration `…0002` contains `source_message_id` directly**, meaning it was edited in place rather than forward-migrated. This is correct only if it was never applied to a live database. If it was applied before B3, the forward migration is still owed and local state has drifted from migration history.
