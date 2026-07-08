import { PromptTemplate } from '../dtos/prompt.dtos';
import { PromptType, PromptStrategy, PromptRole } from '../enums/prompt.enums';
import { SYSTEM_PROMPT_TEMPLATES } from './system-prompt.template';
import { DEVELOPER_PROMPT_TEMPLATES } from './developer-prompt.template';
import { USER_PROMPT_TEMPLATES } from './user-prompt.template';

/**
 * In-memory template registry. Templates are addressed by (role, type, strategy)
 * and by explicit id for A/B testing and versioning. Registration is idempotent;
 * a later registration with the same id overwrites the earlier entry (used by
 * template migrations).
 */
export class TemplateRegistry {
  private byId: Map<string, PromptTemplate> = new Map();
  private byRole: Map<PromptRole, PromptTemplate[]> = new Map();

  constructor() {
    for (const t of SYSTEM_PROMPT_TEMPLATES) this.register(PromptRole.SYSTEM, t);
    for (const t of DEVELOPER_PROMPT_TEMPLATES) this.register(PromptRole.DEVELOPER, t);
    for (const t of USER_PROMPT_TEMPLATES) this.register(PromptRole.USER, t);
  }

  register(role: PromptRole, template: PromptTemplate): void {
    this.byId.set(template.id, template);
    const list = this.byRole.get(role) ?? [];
    const existing = list.findIndex((t) => t.id === template.id);
    if (existing >= 0) list.splice(existing, 1, template);
    else list.push(template);
    this.byRole.set(role, list);
  }

  getById(id: string): PromptTemplate | null {
    return this.byId.get(id) ?? null;
  }

  resolve(role: PromptRole, type: PromptType, strategy: PromptStrategy): PromptTemplate | null {
    const list = this.byRole.get(role) ?? [];
    const strict = list.find((t) => t.type === type && t.strategy === strategy);
    if (strict) return strict;
    // Fall back to STANDARD for the same type.
    const fallbackStandard = list.find((t) => t.type === type && t.strategy === PromptStrategy.STANDARD);
    if (fallbackStandard) return fallbackStandard;
    // Fall back to the first template registered for that role/type.
    return list.find((t) => t.type === type) ?? null;
  }

  listByRole(role: PromptRole): PromptTemplate[] {
    return [...(this.byRole.get(role) ?? [])];
  }

  all(): PromptTemplate[] {
    return Array.from(this.byId.values());
  }
}
