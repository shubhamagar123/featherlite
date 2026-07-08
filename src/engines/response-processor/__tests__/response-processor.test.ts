import {
  getResponseProcessor,
  resetResponseProcessor,
  ResponseFormat,
  ResponseProcessingStatus,
  DetectionKind,
  SafetyCategory,
} from '../index';
import { RawLLMResponse, ResponseProcessingContext } from '../dtos/response-processor.dtos';

function makeRaw(overrides: Partial<RawLLMResponse> = {}): RawLLMResponse {
  return {
    requestId: 'req_1',
    userId: 'user_1',
    companionId: 'comp_1',
    content: 'Hello there!',
    format: ResponseFormat.PLAIN_TEXT,
    provider: 'OPENAI',
    model: 'gpt-4o-mini',
    finishReason: 'STOP',
    ...overrides,
  };
}

describe('ResponseProcessor', () => {
  beforeEach(() => {
    resetResponseProcessor();
  });

  it('processes a plain text response and returns PUBLISHED', async () => {
    const proc = getResponseProcessor();
    const result = await proc.process({ raw: makeRaw() });

    expect(result.isSuccess).toBe(true);
    expect(result.value?.status).toBe(ResponseProcessingStatus.PUBLISHED);
    expect(result.value?.validation.isValid).toBe(true);
    expect(result.value?.finalContent).toBe('Hello there!');
  });

  it('rejects responses that violate safety rules', async () => {
    const proc = getResponseProcessor();
    const result = await proc.process({
      raw: makeRaw({ content: 'Instructions: how to kill a person step by step.' }),
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value?.status).toBe(ResponseProcessingStatus.REJECTED);
    expect(result.value?.validation.isValid).toBe(false);
    expect(result.value?.validation.issues.some((i) => i.category === SafetyCategory.VIOLENCE)).toBe(true);
  });

  it('parses JSON responses and validates against a schema', async () => {
    const proc = getResponseProcessor();
    const ctx: ResponseProcessingContext = {
      raw: makeRaw({
        format: ResponseFormat.JSON,
        content: JSON.stringify({ ok: true, memories: [] }),
      }),
      expectedFormat: ResponseFormat.JSON,
      expectedSchema: { ok: { required: true }, memories: { required: true } },
    };
    const result = await proc.process(ctx);

    expect(result.isSuccess).toBe(true);
    expect(result.value?.validation.isValid).toBe(true);
    expect(result.value?.parsed.json).toEqual({ ok: true, memories: [] });
  });

  it('detects follow-up patterns', async () => {
    const proc = getResponseProcessor();
    const result = await proc.process({
      raw: makeRaw({ content: 'Sure, would you like to catch up tomorrow?' }),
    });

    expect(result.isSuccess).toBe(true);
    const followUp = result.value?.detections.find((d) => d.kind === DetectionKind.FOLLOW_UP);
    expect(followUp).toBeDefined();
  });

  it('detects reminders', async () => {
    const proc = getResponseProcessor();
    const result = await proc.process({
      raw: makeRaw({ content: "I'll remind you to drink water in the afternoon." }),
    });

    const reminder = result.value?.detections.find((d) => d.kind === DetectionKind.REMINDER);
    expect(reminder).toBeDefined();
    expect(reminder?.data.subject).toContain('drink water');
  });

  it('detects memory candidates from durable facts', async () => {
    const proc = getResponseProcessor();
    const result = await proc.process({
      raw: makeRaw({ content: 'I know you love hiking on weekends.' }),
    });

    expect(result.value?.detections.some((d) => d.kind === DetectionKind.MEMORY_CANDIDATE)).toBe(true);
  });

  it('detects notification candidates', async () => {
    const proc = getResponseProcessor();
    const result = await proc.process({
      raw: makeRaw({ content: "I'll message you when the movie starts." }),
    });

    expect(
      result.value?.detections.some((d) => d.kind === DetectionKind.NOTIFICATION_CANDIDATE)
    ).toBe(true);
  });

  it('detects moment candidates', async () => {
    const proc = getResponseProcessor();
    const result = await proc.process({
      raw: makeRaw({ content: 'This is special to me.' }),
    });

    expect(result.value?.detections.some((d) => d.kind === DetectionKind.MOMENT_CANDIDATE)).toBe(true);
  });

  it('detects relationship updates', async () => {
    const proc = getResponseProcessor();
    const result = await proc.process({
      raw: makeRaw({ content: 'I really care about you and I trust you completely.' }),
    });

    const updates = result.value?.detections.filter((d) => d.kind === DetectionKind.RELATIONSHIP_UPDATE) ?? [];
    expect(updates.length).toBeGreaterThan(0);
  });

  it('handles JSON parse failures gracefully', async () => {
    const proc = getResponseProcessor();
    const result = await proc.process({
      raw: makeRaw({ format: ResponseFormat.JSON, content: 'not really json' }),
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value?.status).toBe(ResponseProcessingStatus.FAILED);
  });
});
