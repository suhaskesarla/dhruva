#!/usr/bin/env node
// Node 24: node tools/symphony/import-week1.mjs [--plan-only | --dry-run | --apply]
// Default: offline plan. Only --dry-run/--apply read LINEAR_API_KEY. Run one importer at a time.
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const ENDPOINT = 'https://api.linear.app/graphql';
const PROJECT = 'dhruva-build-f2037c3c71f5';
const PAGE = 'pageInfo { hasNextPage endCursor }';
const ISSUE = `id identifier title description priority archivedAt labelIds
  team { id } assignee { id } state { id name }`;
const BOOTSTRAP = '\n\n## Bootstrap evidence\n\nPR #1 was merged; merge commit `148fe3f` is present in the integration base (`symphony/week1`).\n';
const w1 = (n) => `W1-${String(n).padStart(2, '0')}`;
const fail = (message) => { throw new Error(message); };

function canonicalDescription(description) {
  return (description ?? '').replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trim();
}

async function parsePlan() {
  const source = await readFile(new URL('../../Dhruva-Week-1-File-and-Function-Plan.md', import.meta.url), 'utf8');
  const headings = [...source.matchAll(/^#{1,3} .+$/gm)];
  const tickets = [];
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    if (!/^### W1-/.test(heading[0])) continue;
    const match = /^### (W1-\d{2}) — (\S[^\r\n]*)\r?$/.exec(heading[0]);
    if (!match) fail(`Malformed ticket heading: ${heading[0]}`);
    const [, id, title] = match;
    const section = source.slice(heading.index, headings[i + 1]?.index ?? source.length);
    const fields = [...section.matchAll(/^\*\*Depends on:\*\*\s*([^\r\n]*(?:\r?\n(?!\s*\r?$|\*\*|#)[^\r\n]+)*)/gm)];
    if (fields.length !== 1) fail(`${id}: expected exactly one Depends on field.`);
    const dependencyText = fields[0][1];
    const dependencies = new Set([...dependencyText.matchAll(/\bW1-\d+\b/g)].map((m) => m[0]));
    for (const range of dependencyText.matchAll(/\bW1-(\d+)\s*(?:through|to|[-–—])\s*W1-(\d+)\b/g)) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      if (start > end || start < 1 || end > 22) fail(`${id}: invalid dependency range ${range[0]}.`);
      for (let n = start; n <= end; n++) dependencies.add(w1(n));
    }
    tickets.push({ id, title: `${id} — ${title}`, description: canonicalDescription(section + (id === 'W1-01' ? BOOTSTRAP : '')),
      dependencies: [...dependencies].sort(), state: id === 'W1-01' ? 'Done' : id === 'W1-02' ? 'Ready' : 'Backlog' });
  }
  const byId = new Map(tickets.map((ticket) => [ticket.id, ticket]));
  if (tickets.length !== 22 || byId.size !== 22 || Array.from({ length: 22 }, (_, i) => w1(i + 1)).some((id) => !byId.has(id))) {
    fail('Source must contain exactly 22 unique consecutive ticket sections, W1-01 through W1-22.');
  }
  for (const ticket of tickets) {
    for (const dependency of ticket.dependencies) {
      if (!byId.has(dependency)) fail(`${ticket.id}: unknown dependency ${dependency}.`);
    }
  }
  const visited = new Set();
  function visit(id, path = []) {
    if (path.includes(id)) fail(`Dependency cycle: ${[...path, id].join(' -> ')}`);
    if (visited.has(id)) return;
    for (const dependency of byId.get(id).dependencies) visit(dependency, [...path, id]);
    visited.add(id);
  }
  for (const ticket of tickets) visit(ticket.id);
  return tickets.sort((a, b) => a.id.localeCompare(b.id));
}

function exactlyOne(items, label) {
  if (items.length !== 1) fail(`Expected exactly one ${label}; found ${items.length}. Resolve missing/duplicate configuration and rerun.`);
  return items[0];
}

function table(tickets, records = new Map(), results = new Map()) {
  console.table(tickets.map((ticket) => ({
    'W1 ID': ticket.id,
    'Linear identifier': records.get(ticket.id)?.identifier ?? '(not created)',
    State: records.get(ticket.id)?.state.name ?? ticket.state,
    Priority: records.get(ticket.id)?.priority ?? 2,
    'Dependency IDs': ticket.dependencies.join(', ') || 'none',
    Result: results.get(ticket.id) ?? 'planned',
  })));
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || args.some((arg) => !['--plan-only', '--dry-run', '--apply'].includes(arg))) {
    fail('Usage: node tools/symphony/import-week1.mjs [--plan-only | --dry-run | --apply]. Choose at most one mode.');
  }
  const mode = args[0] ?? '--plan-only';
  const tickets = await parsePlan();
  if (mode === '--plan-only') {
    console.log(`Validated ${tickets.length} tickets and ${tickets.reduce((n, t) => n + t.dependencies.length, 0)} dependencies. No network calls or mutations.`);
    table(tickets);
    return;
  }
  const key = process.env.LINEAR_API_KEY;
  if (!key?.trim()) fail('Set LINEAR_API_KEY in the environment for --dry-run or --apply.');
  // Redact even server-supplied text; never log headers, raw responses or request errors.
  const redact = (value) => String(value).split(key).join('[REDACTED]');
  const output = (value) => console.log(redact(value));
  async function graphql(operation, query, variables = {}) {
    let response;
    try {
      response = await fetch(ENDPOINT, {
        method: 'POST', headers: { Authorization: key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(30_000),
      });
    } catch {
      fail(`${operation}: request failed or timed out. Check connectivity; a mutation may have succeeded. Rerun to reconcile; do not blindly retry mutations.`);
    }
    if (!response.ok) fail(`${operation}: HTTP ${response.status}. Check token permissions or rate limits, then rerun to reconcile.`);
    let payload;
    try { payload = await response.json(); } catch { fail(`${operation}: response was not valid JSON. Rerun to reconcile.`); }
    if (payload.errors?.length) fail(redact(`${operation}: GraphQL: ${payload.errors.map((error) => error.message).join('; ')}`));
    if (!payload.data) fail(`${operation}: GraphQL response has no data.`);
    return payload.data;
  }
  async function pages(operation, query, variables, select) {
    const nodes = [];
    const cursors = new Set();
    let after = null;
    do {
      const connection = select(await graphql(operation, query, { ...variables, after }));
      if (!connection?.nodes || !connection.pageInfo) fail(`${operation}: incomplete paginated response.`);
      nodes.push(...connection.nodes);
      if (!connection.pageInfo.hasNextPage) return nodes;
      after = connection.pageInfo.endCursor;
      if (!after || cursors.has(after)) fail(`${operation}: pagination did not advance.`);
      cursors.add(after);
    } while (true);
  }
  const teams = await pages('Resolve team', `query($after: String) {
    teams(first: 100, after: $after) { nodes { id key } ${PAGE} }
  }`, {}, (data) => data.teams);
  const team = exactlyOne(teams.filter((t) => t.key === 'DHR'), 'DHR team');
  const { viewer } = await graphql('Resolve viewer', 'query { viewer { id } }');
  const { project } = await graphql('Resolve project', 'query($id: String!) { project(id: $id) { id slugId url archivedAt } }', { id: PROJECT });
  if (project.archivedAt || !new URL(project.url).pathname.split('/').includes(PROJECT)) {
    fail(`Resolved project does not match active project ${PROJECT}. Check its URL/slug.`);
  }
  const projectTeams = await pages('Verify project team', `query($id: String!, $after: String) {
    project(id: $id) { teams(first: 100, after: $after) { nodes { id } ${PAGE} } }
  }`, { id: project.id }, (data) => data.project.teams);
  if (!projectTeams.some((t) => t.id === team.id)) fail(`Project ${PROJECT} does not belong to DHR.`);
  const states = await pages('Resolve states', `query($after: String) {
    workflowStates(first: 100, after: $after) { nodes { id name team { id } } ${PAGE} }
  }`, {}, (data) => data.workflowStates);
  const stateByName = new Map(['Backlog', 'Ready', 'Done'].map((name) => [name,
    exactlyOne(states.filter((s) => s.team.id === team.id && s.name === name), `DHR ${name} state`)]));
  const labels = await pages('Resolve labels', `query($after: String) {
    issueLabels(first: 100, after: $after) { nodes { id name team { id } } ${PAGE} }
  }`, {}, (data) => data.issueLabels);
  const label = exactlyOne(labels.filter((l) => l.name === 'symphony' && (!l.team || l.team.id === team.id)), 'applicable symphony label');
  const reviewLabels = new Set(labels.filter((l) => l.name === 'independent-review').map((l) => l.id));
  async function projectIssues() {
    return pages('Read project issues', `query($id: String!, $after: String) {
      project(id: $id) { issues(first: 100, after: $after, includeArchived: true) { nodes { ${ISSUE} } ${PAGE} } }
    }`, { id: project.id }, (data) => data.project.issues);
  }
  function indexIssues(issues) {
    const records = new Map();
    for (const ticket of tickets) {
      // The exact leading W1-NN token in this project reserves the importer identity.
      const prefix = new RegExp(`^${ticket.id}(?=$|\\s|[—–:])`);
      const matches = issues.filter((issue) => prefix.test(issue.title));
      if (matches.length > 1) fail(`${ticket.id}: multiple project issues match (${matches.map((i) => i.identifier).join(', ')}). Resolve duplicates before importing.`);
      const issue = matches[0];
      if (!issue) continue;
      if (issue.team.id !== team.id || issue.archivedAt || issue.labelIds.some((id) => reviewLabels.has(id))) {
        fail(`${ticket.id}: prefix collision with archived, non-DHR or independent-review issue ${issue.identifier}. Resolve manually; no issue will be repurposed.`);
      }
      records.set(ticket.id, issue);
    }
    return records;
  }
  const records = indexIssues(await projectIssues());
  async function inverseRelations(issue) {
    return pages(`Read blockers for ${issue.identifier}`, `query($id: String!, $after: String) {
      issue(id: $id) { inverseRelations(first: 100, after: $after) {
        nodes { id type issue { id } relatedIssue { id } } ${PAGE}
      } }
    }`, { id: issue.id }, (data) => data.issue.inverseRelations);
  }
  const blockers = new Map();
  for (const [id, issue] of records) blockers.set(id, await inverseRelations(issue));
  const operations = [];
  const results = new Map();
  const ids = new Map(tickets.map((ticket) => [ticket.id, records.get(ticket.id)?.id ?? randomUUID()]));
  for (const ticket of tickets) {
    const existing = records.get(ticket.id);
    if (!existing) {
      operations.push({ kind: 'issueCreate', ticket: ticket.id, input: {
        id: ids.get(ticket.id), teamId: team.id, projectId: project.id, assigneeId: viewer.id,
        title: ticket.title, description: ticket.description, priority: 2,
        stateId: stateByName.get(ticket.state).id, labelIds: [label.id], useDefaultTemplate: false,
      } });
      results.set(ticket.id, 'created');
      continue;
    }
    const input = {};
    for (const [field, value] of Object.entries({ title: ticket.title, priority: 2 })) {
      if (existing[field] !== value) input[field] = value;
    }
    if (canonicalDescription(existing.description) !== ticket.description) input.description = ticket.description;
    if (existing.assignee?.id !== viewer.id) input.assigneeId = viewer.id;
    if (!existing.labelIds.includes(label.id)) input.addedLabelIds = [label.id];
    // Initial states are not a reset policy: preserve subsequent delivery progress.
    // Repair the known bootstrap and a W1-02 import left in default Backlog.
    if ((ticket.id === 'W1-01' && existing.state.id !== stateByName.get('Done').id)
      || (ticket.id === 'W1-02' && existing.state.id === stateByName.get('Backlog').id)) {
      input.stateId = stateByName.get(ticket.state).id;
    }
    results.set(ticket.id, Object.keys(input).length ? 'updated' : 'unchanged');
    if (Object.keys(input).length) operations.push({ kind: 'issueUpdate', ticket: ticket.id, id: existing.id, input });
  }
  for (const ticket of tickets) {
    for (const dependency of ticket.dependencies) {
      if (blockers.get(ticket.id)?.some((r) => r.type === 'blocks' && r.issue.id === ids.get(dependency) && r.relatedIssue.id === ids.get(ticket.id))) continue;
      operations.push({ kind: 'issueRelationCreate', ticket: ticket.id, dependency, input: {
        type: 'blocks', issueId: ids.get(dependency), relatedIssueId: ids.get(ticket.id),
      } });
      if (results.get(ticket.id) === 'unchanged') results.set(ticket.id, 'updated');
    }
  }
  output(`${mode}: ${operations.length} proposed mutations. Generated UUIDs identify proposed new issues for this run.`);
  for (const operation of operations) output(JSON.stringify(operation, null, 2));
  if (mode === '--dry-run') {
    output('No mutations performed. Table shows proposed results; existing delivery states are preserved.');
    const proposed = new Map(records);
    for (const ticket of tickets) {
      const operation = operations.find((op) => op.ticket === ticket.id && op.kind !== 'issueRelationCreate');
      const stateId = operation?.input.stateId;
      proposed.set(ticket.id, { ...records.get(ticket.id), priority: 2,
        state: stateId ? [...stateByName.values()].find((s) => s.id === stateId) : records.get(ticket.id)?.state ?? { name: ticket.state } });
    }
    table(tickets, proposed, results);
    return;
  }
  // No automatic mutation retries. All validation/discovery finishes before this point.
  for (const operation of operations) {
    const { kind, input } = operation;
    const type = kind === 'issueCreate' ? 'IssueCreateInput' : kind === 'issueUpdate' ? 'IssueUpdateInput' : 'IssueRelationCreateInput';
    const update = kind === 'issueUpdate';
    const data = await graphql(`${kind} ${operation.ticket}`, `mutation($input: ${type}!${update ? ', $id: String!' : ''}) {
      ${kind}(${update ? 'id: $id, ' : ''}input: $input) { success }
    }`, { input, ...(update ? { id: operation.id } : {}) });
    if (data[kind]?.success !== true) fail(`${kind} ${operation.ticket}: mutation did not report success. Rerun to reconcile.`);
  }
  const finalRecords = indexIssues(await projectIssues());
  for (const ticket of tickets) {
    const issue = finalRecords.get(ticket.id);
    if (!issue || issue.id !== ids.get(ticket.id)) fail(`${ticket.id}: issue missing or identity changed after apply.`);
    if (issue.title !== ticket.title || canonicalDescription(issue.description) !== ticket.description || issue.priority !== 2
      || issue.assignee?.id !== viewer.id || !issue.labelIds.includes(label.id)) {
      fail(`${ticket.id}: imported fields failed verification. Inspect the issue and rerun to reconcile.`);
    }
    const operation = operations.find((op) => op.ticket === ticket.id && op.kind !== 'issueRelationCreate');
    if (operation?.input.stateId && issue.state.id !== operation.input.stateId) fail(`${ticket.id}: state failed verification.`);
    const relations = await inverseRelations(issue);
    const missing = ticket.dependencies.filter((dependency) => !relations.some((r) =>
      r.type === 'blocks' && r.issue.id === ids.get(dependency) && r.relatedIssue.id === issue.id));
    if (missing.length) fail(`${ticket.id} (${issue.identifier}): inverse blocks verification failed; missing blockers ${missing.join(', ')}. Inspect relation direction and rerun.`);
  }
  output('Verified all imported fields and expected inverse blocks relations.');
  table(tickets, finalRecords, results);
}

main().catch((error) => {
  const key = process.env.LINEAR_API_KEY;
  const message = error instanceof Error ? error.message : 'Unexpected importer failure.';
  console.error(`Import failed: ${key ? message.split(key).join('[REDACTED]') : message}`);
  process.exitCode = 1;
});
