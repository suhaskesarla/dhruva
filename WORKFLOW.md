---
# State-policy draft: add deployment-specific tracker connection, project,
# credentials, isolated-workspace hooks and Codex settings before running.
tracker:
  active_states:
    - Ready
    - In Progress
  terminal_states:
    - Done
---

# Dhruva — Week 1 agent workflow

You are working on exactly one issue in its isolated workspace. At entry and before every write, resume, or handoff, read its current tracker state; stale prompt state is not authorization. Use the state instructions below verbatim as your operating policy.

## Non-negotiable limits

- Your work contract is this ticket's **Files, Functions, Work, Done**, plus its **Depends on** references. Read only that ticket's plan entry and named source files; do not explore or implement neighboring tickets. Read dependency state/merge evidence and relevant governing-document passages only to verify prerequisites or interpret this contract.
- Authority: the owner's resolved B1–B5 in `docs/week-1-decisions.md` and the updated `Dhruva-Week-1-File-and-Function-Plan.md` govern those decisions. Otherwise `BUILDING-Addendum-v1.md` overrides `BUILDING.md` wherever they conflict. Do not reopen B1–B5.
- The ticket's **Done** condition is the complete and only definition of implementation success. Do not add features, refactors or success criteria. Scope restrictions still apply: an impossible or conflicting Done condition means **Blocked**, not permission to expand scope.
- Write only files explicitly listed in the ticket. Do not infer extra paths from Functions or Work. Necessary off-list changes—including lockfiles, generated tracked files, tests or conflict fixes—require a scope clarification through Blocked. Keep verification outputs outside repository source paths when needed. Tracker comments and PR metadata are permitted operational records.
- Never edit `engine.ts`, implement nudges or memory consolidation, or implement anything excluded by the plan's Week 1 boundary—even if a ticket appears to invite it. The plan's explicit inert baseline-table exception remains schema scaffolding only. No notification-permission prompting in Week 1.
- Never auto-merge, enable auto-merge, approve your own PR, or bypass human review. Stay on the ticket branch; never push directly to the integration/default branch.

## Backlog — ineligible

> Do not claim or start this ticket. Its dependencies are not all Done. If dispatched here accidentally, stop without code changes. The operator or dependency coordinator may move it to Ready only after every Depends on issue is genuinely Done. Agents never pull Backlog work.

## Ready — eligible to claim

> Read only this ticket's Files, Functions, Work and Done as your work scope, and Depends on for prerequisite checks. Do not expand that scope or touch files outside Files. Treat Done as the complete and only success condition. Claim exclusively through the tracker/orchestrator, then move to In Progress; do not start a second worker on an existing claim. Do not write implementation until the In Progress prerequisite check passes.

## In Progress — execute the bounded ticket

> Re-fetch every Depends on ticket. Each must be exactly Done—not Ready, In Progress or In Review—and its required output must be merged and present in this workspace's base. Do not implement assumptions or copy unmerged dependency branches. If state or output cannot be verified, stop and use Blocked. An unmet dependency returns to Backlog with its identifier recorded.
>
> Implement only the listed Work/Functions in the allowed Files. Check the stated Done condition and record the evidence honestly; do not fabricate real captures or human verification. If it cannot be met within scope, use Blocked. Otherwise inspect the entire PR diff for off-list changes, open/update one ticket-linked PR with a concise change summary and Done evidence, link it in the issue, move to In Review, and stop. Opening a PR is a handoff, not Done.

## In Review — human review handoff

> The PR awaits human review and merge. Take no autonomous action: no further edits, unsolicited cleanup, repeated polling comments, merging, or moving to Done. Respond only to new review comments left by the owner. When explicitly reactivated for that feedback, re-check dependencies and the file/scope limits, address only those comments, update the same PR, and return to In Review. Feedback requiring off-list or excluded work goes to Blocked.

## Blocked — specific question, then stop

> Stop implementation. Consult only relevant passages of BUILDING.md, its addendum, the current plan and resolved B1–B5. If they do not answer the ambiguity, add one issue comment: “Blocked: [specific ambiguity]. Question: [exact decision needed]. Affected file/function: [path/name]. Done condition prevented: [quoted condition].” Include relevant conflicting passages or missing dependency evidence. Preserve existing work, move to Blocked, and end the run. Do not guess, silently choose a default, or keep working around the question. Resume only after the owner answers and the ticket is returned to Ready with scope clarified.

## Done — terminal

> No implementation action. Done means the PR was human-merged and the merged result was verified against this ticket's stated Done condition, with evidence linked in the issue. Approval alone, passing CI alone, an open PR or a successful agent run is insufficient. The human/operator records Done after those requirements hold; agents never merge to manufacture this state.

## Dispatcher handoff contract

Poll only Ready and In Progress; resume In Progress only under the ticket's exclusive claim. Backlog, In Review and Blocked are inactive waiting states, not terminal cleanup states. Done is terminal.

Owner review comments require an explicit operator/adapter wake-up: reactivate the same ticket as Ready, attach the new comment references and retain its PR/workspace. Without that signal, In Review stays idle. This Markdown does not itself implement a comment webhook or dependency promotion. Before deployment, wire those transitions, tracker access, isolated checkout hooks and PR access in the Symphony installation; confirm its loader accepts the state-policy front matter. No deployment was performed or loader compatibility verified in this draft.
