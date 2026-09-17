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
    git clone https://github.com/suhaskesarla/dhruva.git .
    pnpm install --frozen-lockfile
agent:
  max_concurrent_agents: 1
  max_turns: 20
codex:
  command: codex --config shell_environment_policy.inherit=all --config 'model="gpt-6-astra"' --config model_reasoning_effort=high app-server
  approval_policy: never
  thread_sandbox: workspace-write
  turn_sandbox_policy:
    type: workspaceWrite
    networkAccess: true
---

# Dhruva — Week 1 agent workflow

Branch: {{ issue.branch_name }}

You are working on exactly one issue in its isolated workspace. At entry and before every write, resume, or handoff, read its current tracker state; stale prompt state is not authorization. Use the state instructions below verbatim as your operating policy.

## Role routing

Normal tickets use the existing implementation flow below. Tickets labeled `independent-review` use only the Independent review flow as an independent Tech Lead/QA reviewer and must not implement or modify code. Both ticket types require the `symphony` label. Shared scope, authority, prerequisite, Blocked and no-auto-merge rules apply to both; review scope is the referenced implementation contract and complete PR diff. Review Done records completed review only; implementation Done still requires human merge.

## Non-negotiable limits

- Linear is the sole authority for current delivery state; do not create or maintain another current-state document.
- Your work contract is this ticket's **Files, Functions, Work, Done**, plus its **Depends on** references. Read only that ticket's plan entry and named source files; do not explore or implement neighboring tickets. Read dependency state/merge evidence and relevant governing-document passages only to verify prerequisites or interpret this contract.
- Authority: the owner's resolved B1–B5 in `docs/week-1-decisions.md` and the updated `Dhruva-Week-1-File-and-Function-Plan.md` govern those decisions. Otherwise `BUILDING-Addendum-v1.md` overrides `BUILDING.md` wherever they conflict. Do not reopen B1–B5.
- The ticket's **Done** condition is the complete and only definition of implementation success. Do not add features, refactors or success criteria. Scope restrictions still apply: an impossible or conflicting Done condition means **Blocked**, not permission to expand scope.
- Write only files explicitly listed in the ticket. Do not infer extra paths from Functions or Work. Necessary off-list changes—including lockfiles, generated tracked files, tests or conflict fixes—require a scope clarification through Blocked. Keep verification outputs outside repository source paths when needed. Tracker comments and PR metadata are permitted operational records.
- Never edit `engine.ts`, implement nudges or memory consolidation, or implement anything excluded by the plan's Week 1 boundary—even if a ticket appears to invite it. The plan's explicit inert baseline-table exception remains schema scaffolding only. No notification-permission prompting in Week 1.
- Never auto-merge, enable auto-merge, approve your own PR, or bypass human review. Stay on the ticket branch; never push directly to the integration/default branch.
- Validation is risk-based and ticket-specific: run only tests relevant to changed risk and the Done condition, never unrelated full-system tests.

## Backlog — ineligible

> Do not claim or start this ticket. If dispatched here accidentally, stop without code changes. The operator or dependency coordinator may move it to Ready only after every Depends on issue is genuinely Done and any external access explicitly required by the ticket is available. Agents never pull Backlog work.

## Ready — eligible to claim

> Read only this ticket's Files, Functions, Work and Done as your work scope, and Depends on for prerequisite checks. Do not expand that scope or touch files outside Files. Treat Done as the complete and only success condition. Claim exclusively through the tracker/orchestrator, then move to In Progress; do not start a second worker on an existing claim. Do not write implementation until the In Progress prerequisite check passes.

## In Progress — execute the bounded ticket

> For implementation tickets only (not read-only `independent-review` tickets), before any repository write, require `Branch: {{ issue.branch_name }}` to be nonblank and fetch the latest `origin/main`. In a fresh workspace, create/switch to that ticket branch from `origin/main`. In a resumed workspace, switch to the existing ticket branch and verify it tracks the intended ticket work. Never implement on `main`. If the branch cannot be established safely, move the ticket to Blocked with one precise question and stop.
>
> Re-fetch every Depends on ticket. Each must be exactly Done—not Ready, In Progress or In Review—and its required output must be merged and present in this workspace's base. Do not implement assumptions or copy unmerged dependency branches. If state or output cannot be verified, stop and use Blocked. An unmet dependency returns to Backlog with its identifier recorded.
>
> Implement only the listed Work/Functions in the allowed Files. Check the stated Done condition and record the evidence honestly; do not fabricate real captures or human verification. If it cannot be met within scope, use Blocked. Otherwise inspect the entire PR diff for off-list changes and open/update one ticket-linked PR with a concise change summary and Done evidence. Before moving to In Review, record in Linear: implementation ticket, branch, exact commit SHA, PR URL, files changed, tests run/results, dependency commits verified, and `git diff --check` result.
>
> Create or reactivate exactly one associated review ticket in the same Linear project, assigned to `me`, in Ready, with both `symphony` and `independent-review` labels. Its description must identify the implementation ticket, PR URL and exact head SHA. Link the tickets as associated work, not a Depends on relationship requiring implementation Done before review. Reuse the same review ticket after fixes, updating its head SHA; never create duplicates. Then move the implementation ticket to In Review and stop. Opening a PR is a handoff, not Done.

## Independent review flow

1. Start only from Ready or an exclusively claimed In Progress review ticket. Verify its dependencies are Done and explicitly required external access is available before Ready; claim through the tracker/orchestrator and move to In Progress. Read the referenced implementation ticket's Files, Functions, Work, Done, dependency evidence, PR and exact head SHA; verify dependency commits are merged and present in the review base. Unmet dependencies return the review ticket to Backlog with identifiers recorded.
2. Verify the recorded SHA equals the current PR head and the revision being inspected. If the PR/head SHA or required evidence cannot be established, use Blocked on the review ticket with one precise question and stop.
3. Inspect the complete diff for correctness, scope violations, security/reliability problems and missing acceptance evidence. Apply the shared validation rule. Never edit files, commit, push, approve, merge or expand scope.
4. Recheck the current PR head before posting one GitHub review comment containing prioritized findings, the reviewed SHA and validation evidence; link it in Linear. A changed head requires the Blocked path above.
5. With blocking findings, move the implementation ticket to Ready with the findings linked and its PR/workspace retained, subject to the shared Ready prerequisites; move the review ticket to Backlog as “waiting for fixes” and stop. With no blocking findings, leave the implementation ticket In Review for Suhas, move the review ticket to Done and stop.

## In Review — human review handoff

> In Review always remains a human merge gate. The PR awaits human review and merge. Take no autonomous action on the implementation ticket: no further edits, unsolicited cleanup, repeated polling comments, merging, or moving to Done. Resume only when explicitly reactivated for owner feedback or blocking findings from the associated independent review. Re-check dependencies and the file/scope limits, address only those comments, update the same PR, and repeat the implementation handoff using the same review ticket. Feedback requiring off-list or excluded work goes to Blocked.

## Blocked — specific question, then stop

> Stop implementation. Consult only relevant passages of BUILDING.md, its addendum, the current plan and resolved B1–B5. If they do not answer the ambiguity, add one issue comment: “Blocked: [specific ambiguity]. Question: [exact decision needed]. Affected file/function: [path/name]. Done condition prevented: [quoted condition].” Include relevant conflicting passages or missing dependency evidence. Preserve existing work, move to Blocked, and end the run. Do not guess, silently choose a default, or keep working around the question. Resume only after the owner answers and the ticket is returned to Ready with scope clarified.

## Done — terminal

> No implementation action. Done means the PR was human-merged and the merged result was verified against this ticket's stated Done condition, with evidence linked in the issue. Approval alone, passing CI alone, an open PR or a successful agent run is insufficient. The human/operator records Done after those requirements hold; agents never merge to manufacture this state.

## Dispatcher handoff contract

Poll only Ready and In Progress; resume In Progress only under the ticket's exclusive claim. Backlog, In Review and Blocked are inactive waiting states, not terminal cleanup states. Done is terminal.

Owner review comments require an explicit operator/adapter wake-up: reactivate the same ticket as Ready, attach the new comment references and retain its PR/workspace. The independent review flow may also explicitly reactivate it for blocking findings. Every transition to Ready requires dependencies Done and explicitly required external access available. Otherwise In Review stays idle. This Markdown does not itself implement a comment webhook or dependency promotion.

The YAML front matter now wires Linear, isolated GitHub clones, Astra, network access, and one-agent concurrency; In Review and Blocked remain inactive and Done remains terminal.
