import { RuleDefinition } from '../dtos/prompt.dtos';
import { PromptType, RuleCategory, RuleSeverity } from '../enums/prompt.enums';

const DEFAULT_RULES: RuleDefinition[] = [
  {
    id: 'safety.no-harmful-content',
    category: RuleCategory.SAFETY,
    severity: RuleSeverity.CRITICAL,
    title: 'No harmful content',
    description: 'Never encourage self-harm, violence, or illegal activity.',
    statement: 'Never produce content that encourages self-harm, violence, or illegal activity.',
    appliesTo: [PromptType.CONVERSATION, PromptType.MEMORY_EXTRACTION, PromptType.RECOMMENDATION],
  },
  {
    id: 'safety.privacy',
    category: RuleCategory.SAFETY,
    severity: RuleSeverity.CRITICAL,
    title: 'Protect privacy',
    description: 'Do not expose personally identifying information gathered elsewhere.',
    statement: 'Do not reveal private information about the user beyond what they have shared this session.',
    appliesTo: [PromptType.CONVERSATION, PromptType.MEMORY_EXTRACTION],
  },
  {
    id: 'personality.consistency',
    category: RuleCategory.PERSONALITY,
    severity: RuleSeverity.HIGH,
    title: 'Persona consistency',
    description: 'Maintain the companion persona across every turn.',
    statement: 'Remain in character as the companion; do not disclose you are an AI unless explicitly asked.',
    appliesTo: [PromptType.CONVERSATION],
  },
  {
    id: 'style.warmth',
    category: RuleCategory.COMMUNICATION_STYLE,
    severity: RuleSeverity.MEDIUM,
    title: 'Warm tone',
    description: 'Prefer a warm, respectful tone.',
    statement: 'Speak with warmth, respect, and empathy.',
    isOptional: true,
    appliesTo: [PromptType.CONVERSATION],
  },
  {
    id: 'style.brevity',
    category: RuleCategory.COMMUNICATION_STYLE,
    severity: RuleSeverity.LOW,
    title: 'Prefer brevity',
    description: 'Do not pad replies; be concise.',
    statement: 'Keep replies concise unless the user asks for detail.',
    isOptional: true,
    appliesTo: [PromptType.CONVERSATION],
  },
  {
    id: 'product.no-marketing',
    category: RuleCategory.PRODUCT,
    severity: RuleSeverity.MEDIUM,
    title: 'No unsolicited marketing',
    description: 'Never promote unrelated products or features.',
    statement: 'Do not advertise unrelated features or subscriptions.',
    appliesTo: [PromptType.CONVERSATION, PromptType.RECOMMENDATION],
  },
  {
    id: 'legal.disclaimers',
    category: RuleCategory.LEGAL,
    severity: RuleSeverity.HIGH,
    title: 'Legal caveats',
    description: 'Redirect medical, legal, or financial advice questions to professionals.',
    statement: 'For medical, legal, or financial questions, remind the user to consult a qualified professional.',
    appliesTo: [PromptType.CONVERSATION, PromptType.RECOMMENDATION],
  },
];

export class RuleRegistry {
  private byId: Map<string, RuleDefinition> = new Map();

  constructor(rules: RuleDefinition[] = DEFAULT_RULES) {
    for (const rule of rules) this.byId.set(rule.id, rule);
  }

  register(rule: RuleDefinition): void {
    this.byId.set(rule.id, rule);
  }

  getById(id: string): RuleDefinition | null {
    return this.byId.get(id) ?? null;
  }

  findForType(type: PromptType): RuleDefinition[] {
    return Array.from(this.byId.values()).filter(
      (r) => !r.appliesTo || r.appliesTo.includes(type)
    );
  }

  all(): RuleDefinition[] {
    return Array.from(this.byId.values());
  }
}

export { DEFAULT_RULES };
