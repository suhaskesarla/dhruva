import assert from "node:assert/strict";
import { readFileSync, readdirSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import ts from "typescript";
import {
  captureRequestSchema, captureReplySchema, clarificationResultsSchema,
  classifiedEventPayloadSchema, clarificationAppliedPayloadSchema,
  clarificationContextSchema, domainIdSchema, intakeResultsSchema,
  itemsBySourceQuerySchema, itemsBySourceReplySchema, messagePageSchema,
  onboardingInputSchema,
  type FirstPassSnapshot, type IntakeResult, type OnboardingInput,
} from "@dhruva/contracts";

const conversationId = "11111111-1111-4111-8111-111111111111";
const messageId = "22222222-2222-4222-8222-222222222222";
const questionId = "33333333-3333-4333-8333-333333333333";
const capture = { conversation_id: conversationId, message_id: messageId, text: "  Send the draft\n" };
const task: IntakeResult = {
  destiny: "task", domain: "work", canonical_text: "Send the draft",
  clarifying_question: null, importance: 0, life_impact: 5, effort: 2,
  emotional_weight: 1, urgency_kind: "none", due_at: null, irreversible: false,
};
const onboarding: OnboardingInput = {
  timezone: "Australia/Sydney",
  domains: domainIdSchema.options.map((id) => ({ id, value_weight: 1, starvation_days: null })),
};

test("capture UUIDs are validated and original text survives unchanged", () => {
  assert.deepEqual(captureRequestSchema.parse(capture), capture);
  assert.equal(captureRequestSchema.parse({ ...capture, reply_to_message_id: questionId }).reply_to_message_id, questionId);
  for (const key of ["conversation_id", "message_id", "reply_to_message_id"]) {
    assert.equal(captureRequestSchema.safeParse({ ...capture, [key]: "invalid" }).success, false, key);
  }
  for (const text of ["", " \n\t"]) {
    assert.equal(captureRequestSchema.safeParse({ ...capture, text }).success, false);
  }
});

test("all five destinies validate; malformed arrays, destinies and scores fail", () => {
  const results = [
    ...["task", "decision", "ambient", "compost"].map((destiny) => ({ ...task, destiny })),
    { destiny: "memory", candidate: { mtype: "M1", content: "Prefers morning meetings", sensitive: false } },
  ];
  assert.equal(intakeResultsSchema.parse(results).length, 5);
  assert.deepEqual(intakeResultsSchema.parse([]), []);
  for (const invalid of [null, {}, task, "[]", [{ ...task, destiny: "nudge" }], [{ ...task, class: "task" }]]) {
    assert.equal(intakeResultsSchema.safeParse(invalid).success, false);
  }
  for (const key of ["importance", "life_impact", "effort", "emotional_weight"]) {
    for (const value of [-1, 6, 1.5, Infinity, NaN, "3"]) {
      assert.equal(intakeResultsSchema.safeParse([{ ...task, [key]: value }]).success, false, key);
    }
  }
  assert.equal(intakeResultsSchema.safeParse([{ destiny: "memory", candidate: { mtype: "M7", content: "x", sensitive: false } }]).success, false);
  assert.equal(intakeResultsSchema.safeParse([{ ...task, due_at: "tomorrow" }]).success, false);
});

test("initial capture permits one question across items; answer mode permits none", () => {
  const question = { ...task, clarifying_question: "Which draft?" };
  assert.equal(intakeResultsSchema.safeParse([question, task]).success, true);
  assert.equal(intakeResultsSchema.safeParse([question, question]).success, false);
  assert.equal(clarificationResultsSchema.safeParse([question]).success, false);
  assert.deepEqual(clarificationResultsSchema.parse([task]), [task]);
  assert.equal(clarificationContextSchema.safeParse({
    original_message_id: messageId, question_message_id: questionId, target_item_id: conversationId, applied: false,
  }).success, true);
  assert.equal(clarificationAppliedPayloadSchema.safeParse({
    original_message_id: messageId, question_message_id: questionId, answer_message_id: "invalid",
  }).success, false);
  assert.equal(classifiedEventPayloadSchema.safeParse({ source_message_id: messageId, result_index: 0 }).success, true);
  assert.equal(classifiedEventPayloadSchema.safeParse({ source_message_id: messageId, result_index: -1 }).success, false);
});

test("public history and source lookup omit private classifier metadata and reverse item FK", () => {
  const message = {
    id: messageId, conversation_id: conversationId, role: "user", body: capture.text,
    created_at: "2026-09-17T00:00:00Z", reply_to_message_id: null, processing_status: "complete",
  };
  assert.deepEqual(messagePageSchema.parse({ messages: [{
    ...message, intake_results: [task], item_id: questionId, candidate: { sensitive: true },
  }], next_cursor: null }), { messages: [message], next_cursor: null });
  const item = { id: questionId, source_message_id: messageId, canonical_text: "Send the draft", status: "active" };
  assert.deepEqual(itemsBySourceReplySchema.parse({ items: [{ ...item, importance: 5, raw_text: capture.text }] }), { items: [item] });
  assert.equal(itemsBySourceQuerySchema.safeParse({ source_message_id: messageId }).success, true);
  assert.equal(itemsBySourceQuerySchema.safeParse({ source_message_id: "invalid" }).success, false);
  assert.equal(itemsBySourceReplySchema.safeParse({ items: [{ ...item, source_message_id: null }] }).success, false);
  const reply = { user_message_id: messageId, assistant_message_id: questionId, reply: "Captured.", ui_actions: [] };
  assert.deepEqual(captureReplySchema.parse(reply), reply);
  assert.equal(captureReplySchema.safeParse({ ...reply, ui_actions: ["start"] }).success, false);
});

test("onboarding accepts optional facts and validates timezone and all eight settings", () => {
  assert.deepEqual(onboardingInputSchema.parse(onboarding), onboarding);
  assert.equal(onboardingInputSchema.safeParse({ ...onboarding, initial_facts: [] }).success, true);
  assert.equal(onboardingInputSchema.safeParse({ ...onboarding, initial_facts: [{ fact_key: "meeting_preference", content: "Mornings", sensitive: false }] }).success, true);
  for (const timezone of ["", "invalid/timezone", "+01:00"]) {
    assert.equal(onboardingInputSchema.safeParse({ ...onboarding, timezone }).success, false);
  }
  assert.equal(onboardingInputSchema.safeParse({ ...onboarding, domains: onboarding.domains.slice(1) }).success, false);
  assert.equal(onboardingInputSchema.safeParse({ ...onboarding, domains: onboarding.domains.map(() => onboarding.domains[0]) }).success, false);
  for (const value_weight of [0, -1, Infinity, NaN]) {
    assert.equal(onboardingInputSchema.safeParse({ ...onboarding, domains: onboarding.domains.map((d) => ({ ...d, value_weight })) }).success, false);
  }
  for (const starvation_days of [0, -1, 1.5]) {
    assert.equal(onboardingInputSchema.safeParse({ ...onboarding, domains: onboarding.domains.map((d) => ({ ...d, starvation_days })) }).success, false);
  }
});

// Compile-time check: readonly applies to nested first-pass results, too.
function checkSnapshotTypes(snapshot: FirstPassSnapshot) {
  // @ts-expect-error The original result array cannot be replaced.
  snapshot.intake_results = [];
  // @ts-expect-error The original classified result cannot be overwritten.
  snapshot.intake_results[0].destiny = "memory";
}
void checkSnapshotTypes;

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const contractsRoot = join(repoRoot, "packages/contracts");
const entry = join(contractsRoot, "src/index.ts");
const requireFromContracts = createRequire(entry);

// Inspect syntax, including type-only imports and module references, rather
// than matching text that can miss multiline imports or flag comments.
function boundaryViolations(source: string, filename = "contract.ts"): string[] {
  const ast = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
  const violations: string[] = [];
  if (ast.referencedFiles.length || ast.typeReferenceDirectives.length || ast.libReferenceDirectives.length) {
    violations.push("triple-slash reference");
  }
  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      if (!ts.isStringLiteral(node.moduleSpecifier) || node.moduleSpecifier.text !== "zod") {
        violations.push("static import other than zod");
      }
    }
    if (ts.isExportDeclaration(node) && node.moduleSpecifier) violations.push("external re-export");
    if (ts.isImportEqualsDeclaration(node) || ts.isImportTypeNode(node) || ts.isModuleDeclaration(node)) {
      violations.push("other module reference");
    }
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      if (callee.kind === ts.SyntaxKind.ImportKeyword) violations.push("dynamic import");
      if ((ts.isIdentifier(callee) && callee.text === "require") ||
          (ts.isPropertyAccessExpression(callee) && callee.name.text === "require") ||
          (ts.isElementAccessExpression(callee) && ts.isStringLiteral(callee.argumentExpression) && callee.argumentExpression.text === "require")) {
        violations.push("require call");
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return violations;
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : [path];
  });
}

test("dependency boundary rejects forbidden module syntax", () => {
  assert.deepEqual(boundaryViolations('import { z } from "zod"; export type ID = string;'), []);
  for (const source of [
    'import type { Owner } from "../../../apps/api/private";',
    'import "./private.ts";', 'export * from "zod";',
    'export { secret } from "./private.ts";', 'type T = import("private").T;',
    'import privateModule = require("private");', 'declare module "private" {}',
    'const p = import("private");', 'require("private");',
    'module.require("private");', 'module["require"]("private");',
    '/// <reference path="private.ts" />', '/// <reference types="node" />',
  ]) assert.ok(boundaryViolations(source).length > 0, source);
});

test("contracts package and Zod have only the permitted runtime dependency graph", () => {
  const manifest = JSON.parse(readFileSync(join(contractsRoot, "package.json"), "utf8"));
  assert.equal(manifest.name, "@dhruva/contracts");
  assert.equal(manifest.type, "module");
  assert.deepEqual(manifest.exports, { ".": "./src/index.ts" });
  assert.deepEqual(manifest.dependencies, { zod: "3.25.76" });
  const zodManifest = JSON.parse(readFileSync(requireFromContracts.resolve("zod/package.json"), "utf8"));
  assert.equal(zodManifest.version, "3.25.76");
  assert.deepEqual(zodManifest.dependencies ?? {}, {});
  for (const pkg of [manifest, zodManifest]) {
    for (const key of ["optionalDependencies", "peerDependencies", "bundledDependencies", "bundleDependencies"]) {
      assert.equal(Object.keys(pkg[key] ?? {}).length, 0, key);
    }
  }
  for (const path of sourceFiles(join(contractsRoot, "src"))) {
    assert.match(path, /\.ts$/);
    assert.deepEqual(boundaryViolations(readFileSync(path, "utf8"), path), [], relative(repoRoot, path));
  }
});

test("both app TypeScript projects include smoke modules and resolve the shared source entry", () => {
  for (const app of ["api", "mobile"]) {
    const configPath = join(repoRoot, "apps", app, "tsconfig.json");
    const config = ts.readConfigFile(configPath, ts.sys.readFile);
    assert.equal(config.error, undefined);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, dirname(configPath));
    assert.deepEqual(parsed.errors, []);
    const smoke = join(dirname(configPath), "src", app === "api" ? "contracts.smoke.test.ts" : "contracts.smoke.ts");
    assert.ok(parsed.fileNames.includes(smoke), `${app} must include its smoke module`);
    const resolved = ts.resolveModuleName("@dhruva/contracts", smoke, parsed.options, ts.sys).resolvedModule;
    assert.ok(resolved, `${app} must resolve contracts`);
    assert.equal(realpathSync(resolved.resolvedFileName), realpathSync(entry));
    const manifest = JSON.parse(readFileSync(join(dirname(configPath), "package.json"), "utf8"));
    assert.equal(manifest.dependencies["@dhruva/contracts"], "workspace:*");
  }
  assert.equal(relative(join(repoRoot, "apps/mobile/src/app"), join(repoRoot, "apps/mobile/src/contracts.smoke.ts")), "../contracts.smoke.ts");
});
