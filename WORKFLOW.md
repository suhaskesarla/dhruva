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

Implementation tickets use the existing implementation flow below. Scope-resolution tickets use only the Mechanical scope-resolution flow below, never the normal product implementation flow. Tickets labeled `independent-review` use only the Independent review flow as an independent Tech Lead/QA reviewer and must not implement or modify code. All ticket types require the `symphony` label. Shared scope, authority, prerequisite and Blocked rules apply to all; review scope is the referenced implementation contract and complete implementation diff. The shared integration branch is `symphony/week1`; Done requires independent review and integration into `origin/symphony/week1`.

A scope-resolution ticket is identified by a title beginning `UNBLOCK <original-ticket-id> —` and a description containing `Type: mechanical-scope-resolution`. It uses the existing `symphony` label, priority **1/Urgent**, assignment to `me` and Ready state when eligible; it must not carry `independent-review`. Never create a resolver for another scope-resolution or independent-review ticket. Reuse exactly one associated resolver per original ticket and exactly one associated review ticket per resolver, including retries and reactivation; inspect existing associations and current ticket state before creating or reusing either. If identity or uniqueness is ambiguous, use Blocked instead of creating a duplicate.

Every associated independent-review ticket must use Linear priority **1/Urgent**, including when created, reused or reactivated. Ordinary imported Week 1 implementation tickets use the lower priority **2/High**. Dispatch eligible scope-resolution and review tickets before priority-2 implementation work so independent review and integration run first; retain `max_concurrent_agents: 1` and all existing eligibility, claim and prerequisite checks.

## Non-negotiable limits

- Linear is the sole authority for current delivery state; do not create or maintain another current-state document.
- Your work contract is this ticket's **Files, Functions, Work, Done**, plus its **Depends on** references. Read only that ticket's plan entry and named source files; do not explore or implement neighboring tickets. Read dependency state/merge evidence and relevant governing-document passages only to verify prerequisites or interpret this contract. For mechanical scope classification and resolution only, read the associated original ticket, its authoritative plan section and the minimum relevant repository evidence needed to establish exact proposed paths and validation commands; this permits no implementation outside the Files allowlist.
- Authority: the owner's resolved B1–B5 in `docs/week-1-decisions.md` and the updated `Dhruva-Week-1-File-and-Function-Plan.md` govern those decisions. Otherwise `BUILDING-Addendum-v1.md` overrides `BUILDING.md` wherever they conflict. Do not reopen B1–B5.
- The ticket's **Done** condition is the complete and only definition of implementation success. Do not add features, refactors or success criteria. Scope restrictions still apply: an impossible or conflicting Done condition means **Blocked**, not permission to expand scope.
- Write only files explicitly listed in the ticket. Do not infer extra paths from Functions or Work. Necessary off-list changes—including lockfiles, generated tracked files, tests or conflict fixes—require a scope clarification through Blocked, using the mechanical eligibility classification below before stopping on an implementation scope conflict. Keep verification outputs outside repository source paths when needed. Linear comments and ticket metadata are permitted operational records. The only plan-editing exception is the bounded Mechanical scope-resolution flow below; it grants no product-file editing permission. The reviewer may perform only the source-preserving integration operations explicitly authorized below.
- Never edit `engine.ts`, implement nudges or memory consolidation, or implement anything excluded by the plan's Week 1 boundary—even if a ticket appears to invite it. The plan's explicit inert baseline-table exception remains schema scaffolding only. No notification-permission prompting in Week 1.
- No implementation, scope-resolution or review agent may create a GitHub pull request tonight. No agent may commit or push to `main`, or merge into `main`; only Suhas may merge `symphony/week1` into `main`. Implementation and scope-resolution agents commit and push only their own ticket’s Linear-provided branch. Only the independent reviewer may merge and push to `symphony/week1`, after passing the review checks below.
- The existing Symphony process remains the orchestrator. No agent may launch, stop or restart Symphony.
- Immediately before every tracker transition, recheck that ticket’s current state. Never disturb unrelated Ready, In Progress, In Review, Blocked or Done tickets.
- Validation is risk-based and ticket-specific: run only tests relevant to changed risk and the Done condition, never unrelated full-system tests.

## Backlog — ineligible

> Do not claim or start this ticket. If dispatched here accidentally, stop without code changes. The operator or dependency coordinator may move it to Ready only after every Depends on issue is genuinely Done and any external access explicitly required by the ticket is available. Agents never pull Backlog work.

## Ready — eligible to claim

> For implementation tickets only: read only this ticket's Files, Functions, Work and Done as your work scope, and Depends on for prerequisite checks. Do not expand that scope or touch files outside Files. Treat Done as the complete and only success condition. Claim exclusively through the tracker/orchestrator, then move to In Progress; do not start a second worker on an existing claim. Do not write implementation until the In Progress prerequisite check passes.

## In Progress — execute the bounded ticket

> For implementation tickets only, before any repository write, require `Branch: {{ issue.branch_name }}` to be nonblank and distinct from `main` and `symphony/week1`, then fetch `origin/symphony/week1`. Create or use only that Linear-provided task branch, based on the current `origin/symphony/week1`. In a resumed workspace, verify the existing branch contains the intended ticket work and bring in the latest integration base only when this preserves all existing work without rewriting history. Never reset, discard work or force-push to restart. If branch identity, preservation or integration is ambiguous, or conflicts occur, preserve work, use Blocked and stop.
>
> Re-fetch every Depends on ticket. Each must be exactly Done—not Ready, In Progress or In Review—and its required merged output must be verifiably present in `origin/symphony/week1` and the task branch's base. Do not implement assumptions or copy unmerged dependency branches. If state or output cannot be verified, stop and use Blocked. An unmet dependency returns to Backlog with its identifier recorded. These checks must pass before implementation.
>
> Implement only the listed Work/Functions in the allowed Files. Validate the stated Done condition and record evidence honestly; do not fabricate real captures or human verification. If it cannot be met within scope, classify the scope conflict below before stopping; do not expand implementation scope. Otherwise inspect the complete implementation diff for off-list changes, run `git diff --check`, and commit and push the task branch. Before moving to In Review, record in Linear: implementation ticket, branch, exact pushed commit SHA, changed files, tests run and results, dependency commits verified, and `git diff --check` result.
>
> Create or reactivate exactly one associated review ticket in the same Linear project, assigned to `me`, in Ready, at priority **1/Urgent**, with both `symphony` and `independent-review` labels. Its description must identify the implementation ticket, implementation branch and exact commit SHA. Link the tickets as associated work, not dependency blockers or a Depends on relationship requiring implementation Done before review. Reuse the same review ticket after fixes, updating its branch/SHA evidence and retaining priority **1/Urgent**; never create duplicates. Then move the implementation ticket to In Review and stop. This handoff is not Done.

## Mechanical scope-conflict classification

Before stopping an implementation ticket for a scope conflict, classify it using repository evidence. A blocker is mechanically auto-resolvable only if **every** condition holds:

1. The existing Work or Done wording already explicitly requires the capability.
2. Repository evidence proves the current Files allowlist cannot satisfy it.
3. The expansion is the minimum necessary set of exact paths for a dependency manifest, existing repository lockfile, framework/package configuration, import/adapter site, or dedicated test or smoke-test file. No other path category qualifies.
4. Any new dependency must be explicitly named by the original ticket or an existing authoritative design/decision document; record evidence for that choice. Repository presence, transitive installation, popularity or an agent's judgment that a package is platform-standard is not sufficient authority. If the required package is not explicitly named, the blocker is not mechanically auto-resolvable and must ask the owner.
5. It introduces no new external service, architecture, product behaviour, data model, migration semantics, credential, secret, permission, privacy rule, destructive operation or user-facing decision.
6. It does not weaken any existing Done condition.
7. Exact proposed paths and validation commands can be established from repository evidence.

If all conditions pass, preserve existing work and move the original implementation ticket to Blocked with the precise contradictory evidence and question. Create or reactivate exactly one associated scope-resolution ticket, using the identification and deduplication rules above, in Ready, assigned to `me`, at priority **1/Urgent**, with only `symphony` as the required workflow label and without `independent-review`. Its description must contain:

- `Type: mechanical-scope-resolution`;
- the original ticket ID and title;
- the authoritative plan file and exact original ticket section;
- the existing Files, Work and Done wording;
- the minimum requested additional paths;
- repository evidence and why each of the seven eligibility conditions passes;
- forbidden changes and proposed validation commands.

Link the resolver to the original as associated work, not a dependency requiring the original to be Done. Reuse it on retries; never create duplicates. Then stop without product changes, task-branch creation, commits or pushes for this resolution handoff. If the conflict is discovered before branch creation, classify it before entering the implementation branch flow. If any condition fails, do not create a resolver: leave the original Blocked with one concise owner question.

## Mechanical scope-resolution flow

1. Start only from Ready or an exclusively claimed In Progress scope-resolution ticket. Re-fetch the original and verify it is still Blocked for the recorded scope conflict and that no other active resolver exists. If these checks fail, block the resolver with one precise owner question and stop. The original is associated work, not a Done prerequisite. Verify any actual prerequisites and explicitly required external access, claim through the tracker/orchestrator and move to In Progress.
2. Require the resolver's Linear-provided branch to be nonblank and distinct from `main` and `symphony/week1`. Fetch current `origin/symphony/week1` and create/use only that resolver branch based on it. Apply the existing implementation branch-preservation rules on resumption: never reset, discard work, rewrite history or force-push; ambiguity or conflicts require Blocked and stopping.
3. Inspect the original ticket, the named authoritative plan section and relevant repository evidence. Independently re-evaluate every mechanical eligibility condition above. If any fails or ambiguity remains, move the resolver to Blocked with one precise owner question; do not edit anything.
4. Modify only the named authoritative plan file and only the original ticket's section. Add only the minimum exact file paths, dependency declarations, constraints and validation commands needed to close the confirmed contradiction. Preserve the original behaviour, functions, dependencies and Done condition; a dependency declaration may only express the already-approved requirement established by the eligibility evidence, not change prerequisite relationships or introduce another dependency choice. Validation may be clarified or strengthened, but acceptance must not be weakened. Never edit product files, `WORKFLOW.md`, unrelated plan sections or the original Linear description at this stage.
5. Run `git diff --check` and inspect the complete branch diff against the integration base, including any resumed commits, to verify that it changes only the allowed plan section. Commit and push only the resolver branch. Record its exact pushed SHA, changed file/section, validation results and prerequisite evidence.
6. Create or reactivate exactly one associated priority-**1/Urgent** independent-review ticket using the normal exact-SHA handoff: same project, assigned to `me`, Ready, with `symphony` and `independent-review`, naming the resolver ticket, resolver branch and exact pushed SHA. Also identify the original blocked implementation ticket and authoritative plan section. Associate the review with the resolver without a Done prerequisite; retain the same review ticket on retries. Move the resolver to In Review and stop. Leave the original implementation ticket Blocked.

## Independent review of a scope-resolution ticket

Apply every normal independent-review, branch-protection and exact-SHA integration rule below, treating the resolver as the reviewed ticket and its bounded plan correction as the review contract. The original implementation remains Blocked, not a prerequisite requiring Done. These additional checks and completion steps apply:

1. Verify the complete diff changes only the named authoritative plan file and original ticket section. Independently re-evaluate all seven mechanical eligibility conditions. Reject any unnecessary path, dependency, behavioural expansion, weakened Done condition or unsupported architectural choice.
2. With blocking findings, return the resolver to Ready subject to the shared prerequisites, retain its branch/workspace, and move the same review ticket to Backlog waiting for fixes. Leave the original implementation ticket Blocked. Do not merge.
3. On PASS, integrate the exact reviewed resolver SHA into `symphony/week1` using the normal noninteractive reviewed integration procedure below, including remote-head checks, conflict handling, non-force push and verification of both reviewed and integration SHAs. Record those SHAs and evidence in the resolver and review tickets. Do not apply the normal step 6 Done transition until the following resolver completion steps succeed.
4. After verifying the integration push, read the complete corrected authoritative section from `origin/symphony/week1`. Re-fetch the original ticket and verify it is still Blocked for this recorded conflict; if its state or contract has unexpectedly changed, block the review with recovery instructions instead of overwriting it. Replace only the original ticket's description with that complete section, preserving comments, relationships, priority and history. Recheck prerequisites, their integrated outputs and explicitly required external access. Move the original from Blocked to Ready only if the recorded scope conflict is fully resolved and every Ready prerequisite passes; otherwise leave it Blocked and record the precise remaining blocker. Move the resolver to Done after these updates succeed.
5. Perform the existing mandatory dependency-promotion completion gate (normal steps 7–9), excluding scope-resolution tickets as well as independent-review tickets from ordinary promotion candidates. Only after all required tracker updates and the promotion query succeed may the resolver's independent-review ticket move to Done.
6. If any Linear query or update fails, block the review ticket with the exact error and recovery instructions identifying unfinished updates. If Linear cannot record the block, explicitly report that failure and instruct the operator to record it when access returns. Do not repeat the merge. On resumption, verify the recorded integration evidence, recheck every ticket's current state and retry only unfinished tracker updates and promotion; do not repeat successful transitions or overwrite a subsequently changed original contract. An original already updated or returned to Ready by this verified completion is a completed step, not a failure of the initial Blocked-state check; verify the recorded result and continue remaining steps.
7. The final report must list the exact plan commit (reviewed resolver SHA), integration commit, updated original ticket and its final state, as well as the normal dependency-promotion report.

## Independent review flow

1. Start only from Ready or an exclusively claimed In Progress review ticket. Verify its dependencies are Done and explicitly required external access is available before Ready; claim through the tracker/orchestrator and move to In Progress. Read the referenced implementation ticket's Files, Functions, Work, Done, dependency evidence, implementation branch and exact commit SHA. Fetch the implementation branch and `origin/symphony/week1`; verify dependency commits and required output are merged and present in the integration branch and review base. Unmet dependencies return the review ticket to Backlog with identifiers recorded. The associated implementation ticket is not a dependency blocker.
2. Verify the recorded SHA equals the remote implementation branch head and the revision being inspected. If the branch, exact SHA or required evidence cannot be established, use Blocked on the review ticket with one precise question and stop.
3. Inspect the complete implementation diff for correctness, scope violations, security/reliability problems and missing acceptance evidence. Run relevant read-only validation under the shared risk-based rule, and post prioritized findings, the reviewed SHA and validation evidence to Linear. Never edit source code or expand scope; repository writes are limited to fetching/checking out revisions and the integration operations below.
4. With blocking findings, move the implementation ticket to Ready with findings and its branch/workspace retained, subject to the shared Ready prerequisites; move the review ticket to Backlog as “waiting for fixes” and stop. Do not merge anything.
5. If review passes, recheck that the reviewed SHA is still the remote implementation branch head, fetch the latest `origin/symphony/week1`, and verify dependencies remain present. A changed head or unverifiable evidence requires Blocked on the review ticket and stopping. With a clean workspace, establish local `symphony/week1` at the latest fetched integration head without losing work, then merge the reviewed task branch at exactly the reviewed SHA noninteractively using `git merge --no-ff --no-edit <reviewed-exact-SHA>`, without editing source. If any merge conflict occurs, abort the merge, move the review ticket to Blocked with the exact conflict (files and Git diagnostics) and the specific question required below, and stop. Do not resolve conflicts or merge a different revision.
6. Push `symphony/week1` without force. If the push fails or the remote integration branch advances, preserve work, use Blocked and stop; do not mark either ticket Done. Fetch and verify that `origin/symphony/week1` contains both the exact reviewed SHA and the resulting integration commit, record their exact SHAs and verification evidence in both tickets, then move only the implementation ticket to Done. Keep the independent-review ticket open pending the mandatory dependency-promotion completion gate below.
7. Before moving the independent-review ticket to Done, query Backlog implementation tickets in the same Linear project, excluding tickets labeled `independent-review` and scope-resolution tickets, and perform idempotent dependency promotion. This dependency-promotion check is the sole exception allowing the reviewer to inspect neighboring tickets. Determine each candidate's dependencies from both its explicit Depends on field and native blocker relationships. Move a candidate from Backlog to Ready only when every implementation dependency is exactly Done, all required dependency outputs are verifiably present in `origin/symphony/week1`, and any explicitly required external access is available. Leave ambiguous or externally blocked candidates in Backlog. Never alter descriptions, dependencies, labels, priorities, scope or acceptance conditions. Recheck each candidate's current state before promotion; change only Backlog tickets to Ready. Do not modify tickets already Ready, In Progress, In Review, Blocked or Done. Repeated execution must be safe, without duplicates or repeated updates to already promoted tickets.
8. The reviewer's final report must explicitly list every ticket promoted to Ready. If none were promoted, state “No tickets promoted,” followed by the concrete eligibility reason for every candidate whose dependencies are Done; if there are no such candidates, explicitly say so. Only after the promotion query and all required updates succeed may the independent-review ticket move to Done and integration workflow completion be reported.
9. If querying or updating Linear fails during completion, leave the independent-review ticket Blocked with the exact error and a recovery instruction identifying the failed query or update to retry. If Linear is unavailable for recording that status or comment, report the exact error and instruct the operator to set the review ticket to Blocked and record the recovery instruction when access returns; do not claim that the status update succeeded. Do not report integration workflow completion; the already verified implementation merge may remain Done. On authorized resumption, verify the recorded integration evidence and retry only the unfinished tracker completion and dependency-promotion steps, rechecking current states. Promotion failure must never trigger another merge or modify the already integrated source.

## In Review — independent review handoff

> The implementation or scope-resolution ticket awaits its associated independent review. Its implementation agent takes no autonomous action: no further edits, unsolicited cleanup, repeated polling comments, merging, or moving to Done. The independent reviewer may integrate and complete both tickets only through the flow above. Resume implementation only when explicitly reactivated for owner feedback or blocking review findings. Re-check dependencies, safe branch resumption and file/scope limits, address only those comments, and repeat the implementation handoff using the same task branch and review ticket. Feedback requiring off-list or excluded work goes to Blocked; implementation scope conflicts must first use the mechanical classification above. Resolver fixes use only the Mechanical scope-resolution flow and the same resolver branch/review ticket. Suhas retains sole control of the final merge to `main`.

## Blocked — specific question, then stop

> Stop implementation. For an implementation scope conflict, first apply the Mechanical scope-conflict classification above; its eligible resolver handoff is the only automatic clarification route. Otherwise consult only relevant passages of BUILDING.md, its addendum, the current plan and resolved B1–B5. If they do not answer the ambiguity, add one issue comment: “Blocked: [specific ambiguity]. Question: [exact decision needed]. Affected file/function: [path/name]. Done condition prevented: [quoted condition].” Include relevant conflicting passages or missing dependency evidence. Preserve existing work, move to Blocked, and end the run. Do not guess, silently choose a default, or keep working around the question. Resume only after the owner answers and the ticket is returned to Ready with scope clarified, or after the independently reviewed mechanical correction is integrated and the original is returned to Ready through the resolver completion flow.

## Done — terminal

> No implementation action. For implementation tickets and their independent-review tickets, Done means the implementation was independently reviewed and integrated into `origin/symphony/week1`, with the resulting integration commit SHA and evidence that the ticket's stated Done condition holds recorded in both tickets. For scope-resolution tickets and their reviews, Done requires independent review and verified integration of the exact plan correction SHA, with recorded integration evidence and the applicable resolver-specific tracker completion steps above; a resolved scope conflict does not make the original implementation Done. Passing validation or review alone, a pushed task branch or a successful agent run is insufficient. Only Suhas may merge `symphony/week1` into `main`.

## Dispatcher handoff contract

Poll only Ready and In Progress; resume In Progress only under the ticket's exclusive claim. Backlog, In Review and Blocked are inactive waiting states, not terminal cleanup states. Done is terminal.

Owner review comments require an explicit operator/adapter wake-up: reactivate the same ticket as Ready, attach the new comment references and retain its task branch/workspace. The independent review flow may also explicitly reactivate it for blocking findings or return a scope-blocked original to Ready after verified resolver integration and completion checks. Every transition to Ready requires dependencies Done and explicitly required external access available. Otherwise In Review stays idle. This Markdown does not itself implement a comment webhook; dependency promotion is limited to the idempotent post-integration check in the Independent review flow.

The YAML front matter now wires Linear, isolated GitHub clones, Astra, network access, and one-agent concurrency; In Review and Blocked remain inactive and Done remains terminal.
