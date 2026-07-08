import { PromptAnalytics } from '../dtos/prompt.dtos';

export class PromptAnalyticsRecorder {
  private byTemplate: Map<string, PromptAnalytics[]> = new Map();

  record(entry: PromptAnalytics): void {
    const list = this.byTemplate.get(entry.templateId) ?? [];
    list.push(entry);
    // Keep a sliding window of the last 500 samples per template.
    if (list.length > 500) list.shift();
    this.byTemplate.set(entry.templateId, list);
  }

  getForTemplate(templateId: string): PromptAnalytics[] {
    return [...(this.byTemplate.get(templateId) ?? [])];
  }

  reset(): void {
    this.byTemplate.clear();
  }
}
