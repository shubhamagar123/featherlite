/**
 * Integration tests for LLM Gateway against real APIs.
 *
 * These tests are skipped unless environment variables are set:
 *   OPENAI_API_KEY=...
 *   CLAUDE_API_KEY=...
 *   GEMINI_API_KEY=...
 *
 * This allows CI to skip these tests (which require actual API keys and make
 * real requests), while developers can run them locally or in sandboxes.
 *
 * Each test spends real money and makes real API calls, so these should NOT
 * run in CI unless explicitly configured to do so.
 */

import { LLMGateway } from '../llm-gateway';
import { OpenAIHttpTransport } from '../transports/openai-http-transport';
import { ClaudeHttpTransport } from '../transports/claude-http-transport';
import { GeminiHttpTransport } from '../transports/gemini-http-transport';
import { OpenAIProvider } from '../providers/openai.provider';
import { ClaudeProvider } from '../providers/claude.provider';
import { LocalLLMProvider } from '../providers/local-llm.provider';
import { LLMProviderType, LLMRequestMode } from '../enums/llm-gateway.enums';
import { DEFAULT_PROVIDER_CONFIGS } from '../index';
import { RedisLLMCache } from '@infra/cache/redis-llm-cache.service';
import { getRedisClient } from '@infra/redis/redis.provider';

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const CLAUDE_KEY = process.env.CLAUDE_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

// Skip entire suite if no API keys provided
const describeIfApiKeysPresent = OPENAI_KEY || CLAUDE_KEY || GEMINI_KEY ? describe : describe.skip;

describeIfApiKeysPresent('LLMGateway Integration Tests', () => {
  let gateway: LLMGateway;

  beforeAll(() => {
    const providers = [];

    if (OPENAI_KEY) {
      const config = DEFAULT_PROVIDER_CONFIGS.find((c) => c.type === LLMProviderType.OPENAI)!;
      const transport = new OpenAIHttpTransport(OPENAI_KEY);
      providers.push(new OpenAIProvider(config, transport));
    }

    if (CLAUDE_KEY) {
      const config = DEFAULT_PROVIDER_CONFIGS.find((c) => c.type === LLMProviderType.CLAUDE)!;
      const transport = new ClaudeHttpTransport(CLAUDE_KEY);
      providers.push(new ClaudeProvider(config, transport));
    }

    if (GEMINI_KEY) {
      // Gemini implementation follows same pattern
      // const config = DEFAULT_PROVIDER_CONFIGS.find((c) => c.type === LLMProviderType.GEMINI)!;
      // const transport = new GeminiHttpTransport(GEMINI_KEY);
      // providers.push(new GeminiProvider(config, transport));
    }

    // Fallback to local provider if no real keys
    if (providers.length === 0) {
      const localConfig = DEFAULT_PROVIDER_CONFIGS.find((c) => c.type === LLMProviderType.LOCAL)!;
      providers.push(new LocalLLMProvider(localConfig, {} as any));
    }

    const cache = new RedisLLMCache(getRedisClient());
    gateway = new LLMGateway({ providers, cache });
  });

  if (OPENAI_KEY) {
    it('completes request via OpenAI API', async () => {
      const result = await gateway.complete({
        requestId: 'test-openai-1',
        messages: [{ role: 'user', content: 'Say hello in one sentence' }],
        mode: LLMRequestMode.COMPLETION,
        provider: LLMProviderType.OPENAI,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.content).toBeTruthy();
      expect(result.value?.content.length).toBeGreaterThan(0);
      expect(result.value?.usage.totalTokens).toBeGreaterThan(0);
    }, 30_000); // 30 second timeout for API call

    it('streams response via OpenAI API', async () => {
      const chunks: string[] = [];
      let chunkCount = 0;

      for await (const chunk of gateway.stream({
        requestId: 'test-openai-stream-1',
        messages: [{ role: 'user', content: 'Count to 3: 1, 2, 3. Say each number on a new line.' }],
        mode: LLMRequestMode.STREAMING,
        provider: LLMProviderType.OPENAI,
      })) {
        chunks.push(chunk.delta);
        chunkCount++;
      }

      const fullContent = chunks.join('');
      expect(fullContent.length).toBeGreaterThan(0);
      expect(chunkCount).toBeGreaterThan(1); // Multiple chunks received
    }, 30_000);
  }

  if (CLAUDE_KEY) {
    it('completes request via Claude API', async () => {
      const result = await gateway.complete({
        requestId: 'test-claude-1',
        messages: [{ role: 'user', content: 'Say hello in one sentence' }],
        mode: LLMRequestMode.COMPLETION,
        provider: LLMProviderType.CLAUDE,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.content).toBeTruthy();
      expect(result.value?.content.length).toBeGreaterThan(0);
      expect(result.value?.usage.totalTokens).toBeGreaterThan(0);
    }, 30_000);

    it('streams response via Claude API', async () => {
      const chunks: string[] = [];
      let chunkCount = 0;

      for await (const chunk of gateway.stream({
        requestId: 'test-claude-stream-1',
        messages: [{ role: 'user', content: 'Count to 3: 1, 2, 3. Say each number on a new line.' }],
        mode: LLMRequestMode.STREAMING,
        provider: LLMProviderType.CLAUDE,
      })) {
        chunks.push(chunk.delta);
        chunkCount++;
      }

      const fullContent = chunks.join('');
      expect(fullContent.length).toBeGreaterThan(0);
      expect(chunkCount).toBeGreaterThan(1);
    }, 30_000);
  }

  it('caches responses across requests', async () => {
    const cacheKey = 'integration-test-cache-' + Date.now();

    const first = await gateway.complete({
      requestId: 'cache-test-1',
      messages: [{ role: 'user', content: 'What is 2+2?' }],
      mode: LLMRequestMode.COMPLETION,
      cacheKey,
      cacheTtlMs: 60_000,
    });

    expect(first.value?.cached).toBe(false);
    const firstContent = first.value?.content;

    const second = await gateway.complete({
      requestId: 'cache-test-2',
      messages: [{ role: 'user', content: 'What is 2+2?' }],
      mode: LLMRequestMode.COMPLETION,
      cacheKey,
      cacheTtlMs: 60_000,
    });

    expect(second.value?.cached).toBe(true);
    expect(second.value?.content).toBe(firstContent);
  }, 30_000);
});
