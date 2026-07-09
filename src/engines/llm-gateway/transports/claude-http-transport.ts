import { LLMProviderTransport } from '../providers/base-llm-provider';
import { LLMRequest, LLMProviderConfig } from '../dtos/llm-gateway.dtos';
import { LLMFinishReason } from '../enums/llm-gateway.enums';

/**
 * Claude API HTTP transport.
 * Calls Anthropic's Claude API with authentication and streaming support.
 */
export class ClaudeHttpTransport implements LLMProviderTransport {
  private readonly apiKey: string;
  private readonly endpoint = 'https://api.anthropic.com/v1/messages';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async invoke(
    request: LLMRequest,
    config: LLMProviderConfig
  ): Promise<{
    content: string;
    finishReason: LLMFinishReason;
    promptTokens: number;
    completionTokens: number;
    model: string;
  }> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: request.maxTokens ?? 1024,
        system: this.extractSystem(request.messages),
        messages: this.filterMessages(request.messages),
        temperature: request.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Claude API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text: string }>;
      stop_reason: string;
      usage: { input_tokens: number; output_tokens: number };
      model: string;
    };

    return {
      content: data.content.find((c) => c.type === 'text')?.text ?? '',
      finishReason: this.mapFinishReason(data.stop_reason),
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      model: data.model,
    };
  }

  async *invokeStream(
    request: LLMRequest,
    config: LLMProviderConfig
  ): AsyncIterable<{
    delta: string;
    finished: boolean;
    finishReason?: LLMFinishReason;
  }> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: request.maxTokens ?? 1024,
        system: this.extractSystem(request.messages),
        messages: this.filterMessages(request.messages),
        temperature: request.temperature,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Claude API streaming error: ${response.status} ${response.statusText}`
      );
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body for streaming');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines[lines.length - 1];

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          if (line.startsWith('data: ')) {
            try {
              const chunk = JSON.parse(line.slice(6)) as {
                type: string;
                delta?: { type: string; text?: string };
                stop_reason?: string;
              };

              if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
                yield {
                  delta: chunk.delta.text ?? '',
                  finished: false,
                };
              }

              if (chunk.type === 'message_delta' && chunk.stop_reason) {
                yield {
                  delta: '',
                  finished: true,
                  finishReason: this.mapFinishReason(chunk.stop_reason),
                };
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private extractSystem(messages: Array<{ role: string; content: string }>): string {
    const systemMsg = messages.find((m) => m.role === 'system');
    return systemMsg?.content ?? '';
  }

  private filterMessages(
    messages: Array<{ role: string; content: string }>
  ): Array<{ role: string; content: string }> {
    return messages.filter((m) => m.role !== 'system');
  }

  private mapFinishReason(claudeReason: string): LLMFinishReason {
    switch (claudeReason) {
      case 'end_turn':
        return LLMFinishReason.STOP;
      case 'max_tokens':
        return LLMFinishReason.LENGTH;
      case 'stop_sequence':
        return LLMFinishReason.STOP;
      default:
        return LLMFinishReason.STOP;
    }
  }
}
