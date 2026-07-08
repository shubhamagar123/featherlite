import { IResult, Result } from '@services/types/result.type';
import { INotificationBuilder, INotificationTemplateRegistry } from '../interfaces/notification.interfaces';
import {
  NotificationRequest,
  NotificationPayload,
} from '../dtos/notification-engine.dtos';
import { NotificationRules } from '../rules/notification.rules';

/**
 * Renders a notification payload from a template + request data. Missing
 * placeholders resolve to their literal name so debugging is easy in dev.
 */
export class NotificationBuilder implements INotificationBuilder {
  private readonly rules = new NotificationRules();

  constructor(private readonly templates: INotificationTemplateRegistry) {}

  build(request: NotificationRequest): IResult<NotificationPayload> {
    const template = this.templates.get(request.templateId);
    if (!template) {
      return Result.failure(new Error(`Unknown notification template: ${request.templateId}`));
    }

    const dictionary: Record<string, string> = {};
    for (const [k, v] of Object.entries(request.data)) {
      dictionary[k.toUpperCase()] = this.stringify(v);
    }

    const title = this.interpolate(template.titleTemplate, dictionary);
    const body = this.interpolate(template.bodyTemplate, dictionary);

    const payload: NotificationPayload = {
      title,
      body,
      imageUrl: dictionary.IMAGE_URL,
      deepLink: dictionary.DEEP_LINK,
      category: request.category ?? template.defaultCategory,
      priority: request.priority ?? template.defaultPriority,
      data: request.data,
    };
    // priority already resolved above; weight is reserved for future dispatch decisions.
    this.rules.priorityWeight(payload.priority);
    return Result.success(payload);
  }

  private interpolate(template: string, dict: Record<string, string>): string {
    return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key: string) =>
      Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : key
    );
  }

  private stringify(v: unknown): string {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
}
