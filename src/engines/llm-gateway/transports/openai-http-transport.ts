import { LLMProviderTransport } from '../providers/base-llm-provider';
import { LLMRequest, LLMProviderConfig } from '../dtos/llm-gateway.dtos';
import { LLMFinishReason } from '../enums/llm-gateway.enums';

/**
 * OpenAI API HTTP transport.
 * Calls OpenAI's completion endpoint with authentication and streaming support.
 */
export class OpenAIHttpTransport implements LLMProviderTransport {
  private readonly apiKey: string;
  private readonly endpoint = 'https://api.openai.com/v1/chat/completions';

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
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: request.messages,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        top_p: request.topP,
        stop: request.stopSequences,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string }; finish_reason: string }>;
      usage: { prompt_tokens: number; completion_tokens: number };
      model: string;
    };

    return {
      content: data.choices[0].message.content,
      finishReason: this.mapFinishReason(data.choices[0].finish_reason),
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
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
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: request.messages,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        top_p: request.topP,
        stop: request.stopSequences,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI API streaming error: ${response.status} ${response.statusText}`
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
          if (!line || line === '[DONE]') continue;

          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            try {
              const chunk = JSON.parse(jsonStr) as {
                choices: Array<{ delta: { content?: string }; finish_reason?: string }>;
              };
              const delta = chunk.choices[0].delta.content ?? '';
              const finishReason = chunk.choices[0].finish_reason;

              yield {
                delta,
                finished: finishReason !== null,
                finishReason: finishReason
                  ? this.mapFinishReason(finishReason)
                  : undefined,
              };
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

  private mapFinishReason(openaiReason: string): LLMFinishReason {
    switch (openaiReason) {
      case 'stop':
        return LLMFinishReason.STOP;
      case 'length':
        return LLMFinishReason.LENGTH;
      case 'content_filter':
        return LLMFinishReason.CONTENT_FILTER;
      case 'tool_calls':
        return LLMFinishReason.TOOL_CALL;
      default:
        return LLMFinishReason.STOP;
    }
  }
}
