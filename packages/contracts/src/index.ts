import { z } from "zod";

export const uuidSchema = z.string().uuid();
export type UUID = z.infer<typeof uuidSchema>;
export const isoDateTimeSchema = z.string().datetime({ offset: true });
export type ISODateTime = z.infer<typeof isoDateTimeSchema>;

// Check for content without trimming or otherwise changing capture text.
const nonemptyTextSchema = z.string().refine((text) => text.trim().length > 0, {
  message: "Must contain non-whitespace text",
});
export const domainIdSchema = z.enum([
  "work", "parents", "family", "health", "finance", "spirituality", "learning", "building",
]);
export type DomainId = z.infer<typeof domainIdSchema>;

const classifierScoreSchema = z.number().int().min(0).max(5);
const itemFields = {
  domain: domainIdSchema,
  canonical_text: nonemptyTextSchema,
  clarifying_question: nonemptyTextSchema.nullable(),
  importance: classifierScoreSchema,
  life_impact: classifierScoreSchema,
  effort: classifierScoreSchema,
  emotional_weight: classifierScoreSchema,
  urgency_kind: z.enum(["none", "soft", "hard"]),
  due_at: isoDateTimeSchema.nullable(),
  irreversible: z.boolean(),
  exposure_step: nonemptyTextSchema.nullable().optional(),
};
export const memoryCandidateSchema = z.object({
  mtype: z.enum(["M1", "M2", "M3", "M4", "M5", "M6"]),
  fact_key: nonemptyTextSchema.optional(),
  content: nonemptyTextSchema,
  domain: domainIdSchema.optional(),
  sensitive: z.boolean(),
  reasoning: nonemptyTextSchema.optional(),
  revisit_condition: nonemptyTextSchema.optional(),
}).strict();
export type MemoryCandidate = z.infer<typeof memoryCandidateSchema>;

export const intakeResultSchema = z.discriminatedUnion("destiny", [
  z.object({ destiny: z.literal("task"), ...itemFields }).strict(),
  z.object({ destiny: z.literal("decision"), ...itemFields }).strict(),
  z.object({ destiny: z.literal("ambient"), ...itemFields }).strict(),
  z.object({ destiny: z.literal("compost"), ...itemFields }).strict(),
  z.object({ destiny: z.literal("memory"), candidate: memoryCandidateSchema }).strict(),
]);
export type IntakeResult = z.infer<typeof intakeResultSchema>;
export type ItemIntakeResult = Exclude<IntakeResult, { destiny: "memory" }>;

// B4: a limit per original capture turn, not one question per item.
export const intakeResultsSchema = z.array(intakeResultSchema).refine(
  (results) => results.filter(
    (result) => result.destiny !== "memory" && result.clarifying_question !== null,
  ).length <= 1,
  { message: "At most one clarification question per capture turn" },
);
export const clarificationResultsSchema = z.array(intakeResultSchema).refine(
  (results) => results.every(
    (result) => result.destiny === "memory" || result.clarifying_question === null,
  ),
  { message: "A clarification answer cannot generate another question" },
);
export type ClassificationPhase = "initial" | "clarification";

export const captureRequestSchema = z.object({
  conversation_id: uuidSchema,
  message_id: uuidSchema,
  text: nonemptyTextSchema,
  reply_to_message_id: uuidSchema.optional(),
}).strict();
export type CaptureRequest = z.infer<typeof captureRequestSchema>;

// Explicit public projection: parsing a stored row drops private metadata.
export const messageDTOSchema = z.object({
  id: uuidSchema,
  conversation_id: uuidSchema,
  role: z.enum(["user", "assistant"]),
  body: z.string(),
  created_at: isoDateTimeSchema,
  reply_to_message_id: uuidSchema.nullable(),
  processing_status: z.enum(["pending", "complete", "failed"]),
});
export type MessageDTO = z.infer<typeof messageDTOSchema>;
export const itemDTOSchema = z.object({
  id: uuidSchema,
  source_message_id: uuidSchema,
  canonical_text: z.string().nullable(),
  status: nonemptyTextSchema,
});
export type ItemDTO = z.infer<typeof itemDTOSchema>;
export const itemsBySourceQuerySchema = z.object({ source_message_id: uuidSchema }).strict();
export type ItemsBySourceQuery = z.infer<typeof itemsBySourceQuerySchema>;
export const itemsBySourceReplySchema = z.object({ items: z.array(itemDTOSchema) });
export type ItemsBySourceReply = z.infer<typeof itemsBySourceReplySchema>;
export const captureReplySchema = z.object({
  user_message_id: uuidSchema,
  assistant_message_id: uuidSchema,
  reply: z.string(),
  ui_actions: z.tuple([]),
});
export type CaptureReply = z.infer<typeof captureReplySchema>;
export const conversationDTOSchema = z.object({ id: uuidSchema, created_at: isoDateTimeSchema });
export type ConversationDTO = z.infer<typeof conversationDTOSchema>;
export const messagePageSchema = z.object({
  messages: z.array(messageDTOSchema),
  next_cursor: z.string().nullable(),
});
export type MessagePage = z.infer<typeof messagePageSchema>;

export const timezoneSchema = z.string().refine((timezone) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone });
    return timezone.length > 0 && !/^[+-]/.test(timezone);
  } catch {
    return false;
  }
}, { message: "Expected an IANA timezone" });
export const domainSettingSchema = z.object({
  id: domainIdSchema,
  value_weight: z.number().finite().positive(),
  starvation_days: z.number().int().positive().nullable(),
}).strict();
export type DomainSetting = z.infer<typeof domainSettingSchema>;
const domainSettingsSchema = z.array(domainSettingSchema).length(8).refine(
  (domains) => new Set(domains.map(({ id }) => id)).size === 8,
  { message: "Include each of the eight domains exactly once" },
);
export const initialFactSchema = z.object({
  fact_key: nonemptyTextSchema,
  content: nonemptyTextSchema,
  domain: domainIdSchema.optional(),
  sensitive: z.boolean(),
}).strict();
export const onboardingInputSchema = z.object({
  timezone: timezoneSchema,
  domains: domainSettingsSchema,
  initial_facts: z.array(initialFactSchema).optional(),
}).strict();
export type OnboardingInput = z.infer<typeof onboardingInputSchema>;
export const onboardingViewSchema = z.object({
  state: z.enum(["setup", "provisional", "full"]),
  completed_at: isoDateTimeSchema.nullable(),
  full_authority_at: isoDateTimeSchema.nullable(),
  eligible_for_full_authority: z.boolean(),
  timezone: timezoneSchema,
  domains: domainSettingsSchema,
});
export type OnboardingView = z.infer<typeof onboardingViewSchema>;

export const localCaptureSchema = captureRequestSchema.extend({
  owner_id: uuidSchema,
  delivery_state: z.enum(["pending", "sending", "failed"]),
});
export type LocalCapture = Readonly<CaptureRequest> & {
  readonly owner_id: UUID;
  delivery_state: z.infer<typeof localCaptureSchema>["delivery_state"];
};
export const apiErrorSchema = z.object({
  code: nonemptyTextSchema,
  message: nonemptyTextSchema,
  retryable: z.boolean(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

// Internal contracts are separate from public history. Storage must enforce
// immutability and the once-only update transaction; types do not lock a DB row.
type Immutable<T> = T extends object ? { readonly [K in keyof T]: Immutable<T[K]> } : T;
export type FirstPassSnapshot = Immutable<{
  original_message_id: UUID;
  intake_results: IntakeResult[];
}>;
export const classifiedEventPayloadSchema = z.object({
  source_message_id: uuidSchema,
  result_index: z.number().int().nonnegative(),
}).strict();
export type ClassifiedEventPayload = z.infer<typeof classifiedEventPayloadSchema>;
export const clarificationRequestedPayloadSchema = z.object({
  original_message_id: uuidSchema,
  question_message_id: uuidSchema,
}).strict();
export type ClarificationRequestedPayload = z.infer<typeof clarificationRequestedPayloadSchema>;
export const clarificationAppliedPayloadSchema = clarificationRequestedPayloadSchema.extend({
  answer_message_id: uuidSchema,
});
export type ClarificationAppliedPayload = z.infer<typeof clarificationAppliedPayloadSchema>;
export const clarificationContextSchema = clarificationRequestedPayloadSchema.extend({
  target_item_id: uuidSchema,
  applied: z.boolean(),
});
export type ClarificationContext = z.infer<typeof clarificationContextSchema>;

// A clarification plan can replace classifier fields only. Identity, raw_text,
// source_message_id and the initial snapshot are deliberately not patch fields.
export type IntakeWritePlan = {
  phase: "initial";
  original_message_id: UUID;
  raw_text: string;
  snapshot: FirstPassSnapshot;
} | {
  phase: "clarification";
  context: ClarificationContext & { applied: false };
  answer_message_id: UUID;
  answer_results: IntakeResult[];
  update: Omit<ItemIntakeResult, "clarifying_question"> & {
    clarifying_question: null;
    status: "active" | "open" | "captured" | "needs_clarification";
  };
};
