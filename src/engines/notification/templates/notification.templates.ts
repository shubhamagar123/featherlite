import { NotificationTemplateData } from '../dtos/notification-engine.dtos';
import {
  NotificationTemplateId,
  NotificationCategory,
  NotificationChannel,
  NotificationPriority,
} from '../enums/notification.enums';
import { INotificationTemplateRegistry } from '../interfaces/notification.interfaces';

export const DEFAULT_NOTIFICATION_TEMPLATES: NotificationTemplateData[] = [
  {
    id: NotificationTemplateId.MOMENT_TRIGGERED,
    titleTemplate: '{{COMPANION_NAME}} is thinking of you',
    bodyTemplate: '{{TITLE}}',
    defaultCategory: NotificationCategory.MOMENT,
    defaultPriority: NotificationPriority.NORMAL,
    defaultChannels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
  },
  {
    id: NotificationTemplateId.ANNIVERSARY,
    titleTemplate: 'Happy anniversary!',
    bodyTemplate: '{{DESCRIPTION}}',
    defaultCategory: NotificationCategory.ANNIVERSARY,
    defaultPriority: NotificationPriority.HIGH,
    defaultChannels: [NotificationChannel.PUSH, NotificationChannel.EMAIL],
  },
  {
    id: NotificationTemplateId.REMINDER,
    titleTemplate: 'Reminder',
    bodyTemplate: '{{TITLE}}',
    defaultCategory: NotificationCategory.REMINDER,
    defaultPriority: NotificationPriority.HIGH,
    defaultChannels: [NotificationChannel.PUSH],
  },
  {
    id: NotificationTemplateId.CALLBACK,
    titleTemplate: '{{COMPANION_NAME}} wants to reconnect',
    bodyTemplate: '{{TITLE}}',
    defaultCategory: NotificationCategory.CALLBACK,
    defaultPriority: NotificationPriority.NORMAL,
    defaultChannels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
  },
  {
    id: NotificationTemplateId.RELATIONSHIP_MILESTONE,
    titleTemplate: 'A new milestone',
    bodyTemplate: '{{DESCRIPTION}}',
    defaultCategory: NotificationCategory.RELATIONSHIP,
    defaultPriority: NotificationPriority.NORMAL,
    defaultChannels: [NotificationChannel.PUSH],
  },
  {
    id: NotificationTemplateId.MEMORY_RECAP,
    titleTemplate: 'A memory to revisit',
    bodyTemplate: '{{TITLE}}',
    defaultCategory: NotificationCategory.MEMORY,
    defaultPriority: NotificationPriority.LOW,
    defaultChannels: [NotificationChannel.IN_APP],
  },
  {
    id: NotificationTemplateId.GENERIC,
    titleTemplate: '{{TITLE}}',
    bodyTemplate: '{{BODY}}',
    defaultCategory: NotificationCategory.SYSTEM,
    defaultPriority: NotificationPriority.NORMAL,
    defaultChannels: [NotificationChannel.PUSH],
  },
];

export class NotificationTemplateRegistry implements INotificationTemplateRegistry {
  private byId: Map<NotificationTemplateId, NotificationTemplateData> = new Map();

  constructor(templates: NotificationTemplateData[] = DEFAULT_NOTIFICATION_TEMPLATES) {
    for (const t of templates) this.byId.set(t.id, t);
  }

  register(template: NotificationTemplateData): void {
    this.byId.set(template.id, template);
  }

  get(id: NotificationTemplateId): NotificationTemplateData | null {
    return this.byId.get(id) ?? null;
  }

  all(): NotificationTemplateData[] {
    return Array.from(this.byId.values());
  }
}
