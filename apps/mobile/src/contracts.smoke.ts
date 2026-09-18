// This module is outside src/app and is not an Expo Router route.
import {
  captureRequestSchema, domainIdSchema, messagePageSchema, onboardingInputSchema,
  type ApiError, type CaptureReply, type CaptureRequest, type ConversationDTO,
  type ItemsBySourceReply, type LocalCapture, type MessagePage,
  type OnboardingInput, type OnboardingView,
} from "@dhruva/contracts";

const conversationId = "11111111-1111-4111-8111-111111111111";
const messageId = "22222222-2222-4222-8222-222222222222";
const createdAt = "2026-09-17T00:00:00Z";

export const captureFixture: CaptureRequest = captureRequestSchema.parse({
  conversation_id: conversationId, message_id: messageId, text: "Send the draft",
});
export const conversationFixture: ConversationDTO = { id: conversationId, created_at: createdAt };
export const historyFixture: MessagePage = messagePageSchema.parse({
  messages: [{
    id: messageId, conversation_id: conversationId, role: "user", body: captureFixture.text,
    created_at: createdAt, reply_to_message_id: null, processing_status: "complete",
  }],
  next_cursor: null,
});
export const sourceItemsFixture: ItemsBySourceReply = {
  items: [{
    id: "33333333-3333-4333-8333-333333333333", source_message_id: messageId,
    canonical_text: "Send the draft", status: "active",
  }],
};
export const captureReplyFixture: CaptureReply = {
  user_message_id: messageId, assistant_message_id: "44444444-4444-4444-8444-444444444444",
  reply: "Captured.", ui_actions: [],
};
export const onboardingFixture: OnboardingInput = onboardingInputSchema.parse({
  timezone: "Australia/Sydney",
  domains: domainIdSchema.options.map((id) => ({ id, value_weight: 1, starvation_days: null })),
  initial_facts: [],
});
export const onboardingViewFixture: OnboardingView = {
  state: "provisional", completed_at: createdAt, full_authority_at: null,
  eligible_for_full_authority: false, timezone: onboardingFixture.timezone,
  domains: onboardingFixture.domains,
};
export const localCaptureFixture: LocalCapture = {
  ...captureFixture, owner_id: "55555555-5555-4555-8555-555555555555", delivery_state: "pending",
};
export const errorFixture: ApiError = { code: "UNAVAILABLE", message: "Try again.", retryable: true };
