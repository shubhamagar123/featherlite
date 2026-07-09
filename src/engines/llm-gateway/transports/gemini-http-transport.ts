import { LLMProviderTransport } from '../providers/base-llm-provider';
import { LLMRequest, LLMProviderConfig } from '../dtos/llm-gateway.dtos';
import { LLMFinishReason } from '../enums/llm-gateway.enums';

/**
 * Gemini API HTTP transport.
 * Calls Google's Gemini API with authentication and streaming support.
 */
export class GeminiHttpTransport implements LLMProviderTransport {
  private readonly apiKey: string;
  private readonly endpoint = 'https://generativelanguage.googleapis.com/v1beta/models';

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
    const url = `${this.endpoint}/${config.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: this.convertMessages(request.messages),
        generationConfig: {
          maxOutputTokens: request.maxTokens,
          temperature: request.temperature,
          topP: request.topP,
          stopSequences: request.stopSequences,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Gemini API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> }; finishReason: string }>;
      usageMetadata: { promptTokenCount: number; candidatesTokenCount: number };
    };

    const candidate = data.candidates[0];
    const textPart = candidate.content.parts.find((p) => 'text' in p);

    return {
      content: textPart && 'text' in textPart ? textPart.text : '',
      finishReason: this.mapFinishReason(candidate.finishReason),
      promptTokens: data.usageMetadata.promptTokenCount,
      completionTokens: data.usageMetadata.candidatesTokenCount,
      model: config.model,
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
    const url = `${this.endpoint}/${config.model}:streamGenerateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: this.convertMessages(request.messages),
        generationConfig: {
          maxOutputTokens: request.maxTokens,
          temperature: request.temperature,
          topP: request.topP,
          stopSequences: request.stopSequences,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Gemini API streaming error: ${response.status} ${response.statusText}`
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

          try {
            const chunk = JSON.parse(line) as {
              candidates?: Array<{
                content?: { parts: Array<{ text?: string }> };
                finishReason?: string;
              }>;
            };

            if (chunk.candidates?.[0]?.content?.parts) {
              const textPart = chunk.candidates[0].content.parts.find((p) => 'text' in p);
              const text = textPart && 'text' in textPart && textPart.text ? textPart.text : '';

              yield {
                delta: text,
                finished: chunk.candidates[0].finishReason !== undefined,
                finishReason: chunk.candidates[0].finishReason
                  ? this.mapFinishReason(chunk.candidates[0].finishReason)
                  : (undefined as unknown as LLMFinishReason | undefined),
              };
            }
          } catch {
            // Skip unparseable lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private convertMessages(
    messages: Array<{ role: string; content: string }>
  ): Array<{ role: string; parts: Array<{ text: string }> }> {
    return messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : m.role === 'system' ? 'user' : m.role,
      parts: [{ text: m.content }],
    }));
  }

  private mapFinishReason(geminiReason: string): LLMFinishReason {
    switch (geminiReason) {
      case 'STOP':
        return LLMFinishReason.STOP;
      case 'MAX_TOKENS':
        return LLMFinishReason.LENGTH;
      case 'SAFETY':
        return LLMFinishReason.CONTENT_FILTER;
      default:
        return LLMFinishReason.STOP;
    }
  }
}
