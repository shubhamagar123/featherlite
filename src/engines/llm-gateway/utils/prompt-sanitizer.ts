import type { LLMMessage } from '../dtos/llm-gateway.dtos';
import { createLogger } from '@utils/logger';

const logger = createLogger('PromptSanitizer');

/**
 * Sanitizes LLM prompts to prevent injection attacks
 * Removes or escapes potentially dangerous patterns
 */
export class PromptSanitizer {
  private static readonly DANGEROUS_PATTERNS = [
    /ignore\s+(?:previous\s+)?instructions?/gi,
    /forget\s+(?:the\s+)?(?:previous\s+)?(?:instructions?|context)/gi,
    /disregard\s+(?:the\s+)?(?:previous\s+)?(?:instructions?|context)/gi,
    /override\s+(?:your\s+)?(?:system\s+)?(?:instructions?|rules?)/gi,
    /new\s+task/gi,
    /act\s+as\s+(?:if\s+)?you/gi,
    /pretend\s+(?:you\s+)?(?:are\s+)?(?:not\s+)?/gi,
    /system\s+prompt/gi,
  ];

  /**
   * Sanitize a single message to prevent injection attacks
   */
  static sanitizeMessage(message: LLMMessage): LLMMessage {
    return {
      ...message,
      content: this.sanitizeContent(message.content, message.role),
    };
  }

  /**
   * Sanitize an array of messages
   */
  static sanitizeMessages(messages: LLMMessage[]): LLMMessage[] {
    return messages.map((msg) => this.sanitizeMessage(msg));
  }

  /**
   * Sanitize content string with awareness of message role
   */
  private static sanitizeContent(content: string, role: string): string {
    if (!content || typeof content !== 'string') {
      return content;
    }

    let sanitized = content;
    let issuesDetected = false;

    // For user messages, be more aggressive about blocking injection patterns
    if (role === 'user' || role === 'tool') {
      for (const pattern of this.DANGEROUS_PATTERNS) {
        if (pattern.test(sanitized)) {
          issuesDetected = true;
          // Replace dangerous patterns with neutral text
          sanitized = sanitized.replace(
            pattern,
            '[content blocked: prompt injection attempt]'
          );
        }
      }
    }

    // Remove control characters and excessive whitespace
    sanitized = sanitized.replace(/[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]/g, ' ');
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    // Limit message length to prevent token exhaustion attacks
    const MAX_MESSAGE_LENGTH = 16000; // Reasonable limit for user messages
    if (sanitized.length > MAX_MESSAGE_LENGTH) {
      issuesDetected = true;
      sanitized = sanitized.substring(0, MAX_MESSAGE_LENGTH) + ' [truncated]';
    }

    if (issuesDetected) {
      logger.warn(
        {
          role,
          originalLength: content.length,
          sanitizedLength: sanitized.length,
        },
        'Potential prompt injection detected and sanitized'
      );
    }

    return sanitized;
  }

  /**
   * Validate that a prompt doesn't contain suspicious patterns
   */
  static isClean(message: LLMMessage): boolean {
    if (message.role === 'system' || message.role === 'developer') {
      // System messages should not be user-provided
      return true;
    }

    const content = message.content;
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(content)) {
        return false;
      }
    }

    return true;
  }
}
