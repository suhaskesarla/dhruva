---
tracker:
  kind: linear
  provider:
    project_slug: "dhruva-build-f2037c3c71f5"
    api_key: $LINEAR_API_KEY
    assignee: me
  required_labels:
    - symphony
  active_states:
    - Ready
    - In Progress
  terminal_states:
    - Closed
    - Cancelled
    - Canceled
    - Duplicate
    - Done
polling:
  interval_ms: 5000
workspace:
  root: ~/code/dhruva-symphony-workspaces
hooks:
  after_create: |
    git clone --branch symphony/week1 https://github.com/suhaskesarla/dhruva.git .
    pnpm install --frozen-lockfile
agent:
  max_concurrent_agents: 1
  max_turns: 20
codex:
  command: codex --config shell_environment_policy.inherit=all --config 'model="gpt-6-astra"' --config model_reasoning_effort=high app-server
  approval_policy: never
  thread_sandbox: workspace-write
  turn_sandbox_policy:
    # Full access is required for Git lifecycle operations in isolated Symphony workspaces; branch, review, and main-protection rules still apply.
    type: dangerFullAccess
---

# Dhruva — Week 1 agent workflow

Branch: {{ issue.branch_name }}

You are working on exactly one issue in its isolated workspace. At entry and before every write, resume, or handoff, read its current tracker state; stale prompt state is not authorization. Use the state instructions below verbatim as your operating policy.

## Role routing

Normal tickets use the existing implementation flow below. Tickets labeled `independent-review` use only the Independent review flow as an independent Tech Lead/QA reviewer and must not implement or modify code. Both ticket types require the `symphony` label. Shared scope, authority, prerequisite and Blocked rules apply to both; review scope is the referenced implementation contract and complete implementation diff. The shared integration branch is `symphony/week1`; Done requires independent review and integration into `origin/symphony/week1`.

Every associated independent-review ticket must use Linear priority **1/Urgent**, including when created, reused or reactivated. Ordinary imported Week 1 implementation tickets use the lower priority **2/High**. Dispatch eligible review tickets before another implementation ticket so independent review and integration run first; retain `max_concurrent_agents: 1` and all existing eligibility, claim and prerequisite checks.

## Non-negotiable limits

- Linear is the sole authority for current delivery state; do not create or maintain another current-state document.
- Your work contract is this ticket's **Files, Functions, Work, Done**, plus its **Depends on** references. Read only that ticket's plan entry and named source files; do not explore or implement neighboring tickets. Read dependency state/merge evidence and relevant governing-document passages only to verify prerequisites or interpret this contract.
- Authority: the owner's resolved B1–B5 in `docs/week-1-decisions.md` and the updated `Dhruva-Week-1-File-and-Function-Plan.md` govern those decisions. Otherwise `BUILDING-Addendum-v1.md` overrides `BUILDING.md` wherever they conflict. Do not reopen B1–B5.
- The ticket's **Done** condition is the complete and only definition of implementation success. Do not add features, refactors or success criteria. Scope restrictions still apply: an impossible or conflicting Done condition means **Blocked**, not permission to expand scope.
- Write only files explicitly listed in the ticket. Do not infer extra paths from Functions or Work. Necessary off-list changes—including lockfiles, generated tracked files, tests or conflict fixes—require a scope clarification through Blocked. Keep verification outputs outside repository source paths when needed. Linear comments and ticket metadata are permitted operational records. The reviewer may perform only the source-preserving integration operations explicitly authorized below.
- Never edit `engine.ts`, implement nudges or memory consolidation, or implement anything excluded by the plan's Week 1 boundary—even if a ticket appears to invite it. The plan's explicit inert baseline-table exception remains schema scaffolding only. No notification-permission prompting in Week 1.
- No implementation or review agent may create a GitHub pull request tonight. No agent may commit or push to `main`, or merge into `main`; only Suhas may merge `symphony/week1` into `main`. Implementation agents commit and push only the ticket’s Linear-provided branch. Only the independent reviewer may merge and push to `symphony/week1`, after passing the review checks below.
- Validation is risk-based and ticket-specific: run only tests relevant to changed risk and the Done condition, never unrelated full-system tests.

## Backlog — ineligible

> Do not claim or start this ticket. If dispatched here accidentally, stop without code changes. The operator or dependency coordinator may move it to Ready only after every Depends on issue is genuinely Done and any external access explicitly required by the ticket is available. Agents never pull Backlog work.

## Ready — eligible to claim

> Read only this ticket's Files, Functions, Work and Done as your work scope, and Depends on for prerequisite checks. Do not expand that scope or touch files outside Files. Treat Done as the complete and only success condition. Claim exclusively through the tracker/orchestrator, then move to In Progress; do not start a second worker on an existing claim. Do not write implementation until the In Progress prerequisite check passes.

## In Progress — execute the bounded ticket

> For implementation tickets only, before any repository write, require `Branch: {{ issue.branch_name }}` to be nonblank and distinct from `main` and `symphony/week1`, then fetch `origin/symphony/week1`. Create or use only that Linear-provided task branch, based on the current `origin/symphony/week1`. In a resumed workspace, verify the existing branch contains the intended ticket work and bring in the latest integration base only when this preserves all existing work without rewriting history. Never reset, discard work or force-push to restart. If branch identity, preservation or integration is ambiguous, or conflicts occur, preserve work, use Blocked and stop.
>
> Re-fetch every Depends on ticket. Each must be exactly Done—not Ready, In Progress or In Review—and its required merged output must be verifiably present in `origin/symphony/week1` and the task branch's base. Do not implement assumptions or copy unmerged dependency branches. If state or output cannot be verified, stop and use Blocked. An unmet dependency returns to Backlog with its identifier recorded. These checks must pass before implementation.
>
> Implement only the listed Work/Functions in the allowed Files. Validate the stated Done condition and record evidence honestly; do not fabricate real captures or human verification. If it cannot be met within scope, use Blocked. Otherwise inspect the complete implementation diff for off-list changes, run `git diff --check`, and commit and push the task branch. Before moving to In Review, record in Linear: implementation ticket, branch, exact pushed commit SHA, changed files, tests run and results, dependency commits verified, and `git diff --check` result.
>
> Create or reactivate exactly one associated review ticket in the same Linear project, assigned to `me`, in Ready, at priority **1/Urgent**, with both `symphony` and `independent-review` labels. Its description must identify the implementation ticket, implementation branch and exact commit SHA. Link the tickets as associated work, not dependency blockers or a Depends on relationship requiring implementation Done before review. Reuse the same review ticket after fixes, updating its branch/SHA evidence and retaining priority **1/Urgent**; never create duplicates. Then move the implementation ticket to In Review and stop. This handoff is not Done.

## Independent review flow

1. Start only from Ready or an exclusively claimed In Progress review ticket. Verify its dependencies are Done and explicitly required external access is available before Ready; claim through the tracker/orchestrator and move to In Progress. Read the referenced implementation ticket's Files, Functions, Work, Done, dependency evidence, implementation branch and exact commit SHA. Fetch the implementation branch and `origin/symphony/week1`; verify dependency commits and required output are merged and present in the integration branch and review base. Unmet dependencies return the review ticket to Backlog with identifiers recorded. The associated implementation ticket is not a dependency blocker.
2. Verify the recorded SHA equals the remote implementation branch head and the revision being inspected. If the branch, exact SHA or required evidence cannot be established, use Blocked on the review ticket with one precise question and stop.
3. Inspect the complete implementation diff for correctness, scope violations, security/reliability problems and missing acceptance evidence. Run relevant read-only validation under the shared risk-based rule, and post prioritized findings, the reviewed SHA and validation evidence to Linear. Never edit source code or expand scope; repository writes are limited to fetching/checking out revisions and the integration operations below.
4. With blocking findings, move the implementation ticket to Ready with findings and its branch/workspace retained, subject to the shared Ready prerequisites; move the review ticket to Backlog as “waiting for fixes” and stop. Do not merge anything.
5. If review passes, recheck that the reviewed SHA is still the remote implementation branch head, fetch the latest `origin/symphony/week1`, and verify dependencies remain present. A changed head or unverifiable evidence requires Blocked on the review ticket and stopping. With a clean workspace, establish local `symphony/week1` at the latest fetched integration head without losing work, then merge the reviewed task branch at exactly the reviewed SHA noninteractively using `git merge --no-ff --no-edit <reviewed-exact-SHA>`, without editing source. If any merge conflict occurs, abort the merge, move the review ticket to Blocked with the exact conflict (files and Git diagnostics) and the specific question required below, and stop. Do not resolve conflicts or merge a different revision.
6. Push `symphony/week1` without force. If the push fails or the remote integration branch advances, preserve work, use Blocked and stop; do not mark either ticket Done. Verify the resulting integration commit is present in `origin/symphony/week1`, record its exact SHA in both tickets, then move both implementation and review tickets to Done.
7. After successful reviewed integration and after both completed tickets are moved to Done, inspect Backlog implementation tickets in the same Linear project, excluding tickets labeled `independent-review`. This dependency-promotion check is the sole exception allowing the reviewer to inspect neighboring tickets. Move a candidate from Backlog to Ready only when every identifier in its explicit Depends on field is exactly Done, every required dependency output is verifiably present in `origin/symphony/week1`, and any explicitly required external access is available. If eligibility is ambiguous, leave it in Backlog and record nothing speculative. Never alter its description, scope, dependencies, labels, or acceptance condition. Recheck its current state before promotion; change only Backlog tickets to Ready. Repeated execution must not create duplicates or disturb tickets already Ready, In Progress, In Review, Blocked, or Done.

## In Review — independent review handoff

> The implementation ticket awaits its associated independent review. Its implementation agent takes no autonomous action: no further edits, unsolicited cleanup, repeated polling comments, merging, or moving to Done. The independent reviewer may integrate and complete both tickets only through the flow above. Resume implementation only when explicitly reactivated for owner feedback or blocking review findings. Re-check dependencies, safe branch resumption and file/scope limits, address only those comments, and repeat the implementation handoff using the same task branch and review ticket. Feedback requiring off-list or excluded work goes to Blocked. Suhas retains sole control of the final merge to `main`.

## Blocked — specific question, then stop

> Stop implementation. Consult only relevant passages of BUILDING.md, its addendum, the current plan and resolved B1–B5. If they do not answer the ambiguity, add one issue comment: “Blocked: [specific ambiguity]. Question: [exact decision needed]. Affected file/function: [path/name]. Done condition prevented: [quoted condition].” Include relevant conflicting passages or missing dependency evidence. Preserve existing work, move to Blocked, and end the run. Do not guess, silently choose a default, or keep working around the question. Resume only after the owner answers and the ticket is returned to Ready with scope clarified.

## Done — terminal

> No implementation action. For both ticket types, Done means the implementation was independently reviewed and integrated into `origin/symphony/week1`, with the resulting integration commit SHA and evidence that the ticket's stated Done condition holds recorded in both tickets. Passing validation or review alone, a pushed task branch or a successful agent run is insufficient. Only Suhas may merge `symphony/week1` into `main`.

## Dispatcher handoff contract

Poll only Ready and In Progress; resume In Progress only under the ticket's exclusive claim. Backlog, In Review and Blocked are inactive waiting states, not terminal cleanup states. Done is terminal.

Owner review comments require an explicit operator/adapter wake-up: reactivate the same ticket as Ready, attach the new comment references and retain its task branch/workspace. The independent review flow may also explicitly reactivate it for blocking findings. Every transition to Ready requires dependencies Done and explicitly required external access available. Otherwise In Review stays idle. This Markdown does not itself implement a comment webhook; dependency promotion is limited to the idempotent post-integration check in the Independent review flow.

The YAML front matter now wires Linear, isolated GitHub clones, Astra, network access, and one-agent concurrency; In Review and Blocked remain inactive and Done remains terminal.
