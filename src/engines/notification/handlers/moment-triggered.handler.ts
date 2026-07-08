import { BaseEventHandler } from '@engines/event';
import type { EventEnvelope } from '@engines/event';
import { EventType } from '@engines/event';
import { INotificationEngine } from '../interfaces/notification.interfaces';
import {
  NotificationCategory,
  NotificationPriority,
  NotificationTemplateId,
  NotificationChannel,
} from '../enums/notification.enums';

interface MomentTriggeredEventPayload {
  momentId: string;
  userId: string;
  companionId: string;
  kind: string;
  significance: string;
  title: string;
  description?: string;
  scheduledFor: Date | string;
  data?: Record<string, unknown>;
}

/**
 * Consumes MOMENT_TRIGGERED events and schedules matching notifications.
 * Notification kind, template, and channel are chosen from the moment kind.
 */
export class MomentTriggeredHandler extends BaseEventHandler<MomentTriggeredEventPayload> {
  constructor(private readonly engine: INotificationEngine) {
    super(EventType.MOMENT_TRIGGERED, 2, true);
  }

  protected async onEvent(envelope: EventEnvelope<MomentTriggeredEventPayload>): Promise<void> {
    const p = envelope.payload;
    const scheduledFor = p.scheduledFor instanceof Date ? p.scheduledFor : new Date(p.scheduledFor);

    const templateId = this.templateForKind(p.kind);
    const category = this.categoryForKind(p.kind);
    const priority = this.priorityForSignificance(p.significance);

    await this.engine.scheduleNotification({
      userId: p.userId,
      companionId: p.companionId,
      category,
      templateId,
      channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
      priority,
      scheduledFor,
      data: {
        MOMENT_ID: p.momentId,
        TITLE: p.title,
        DESCRIPTION: p.description ?? '',
        COMPANION_NAME: '',
        ...(p.data ?? {}),
      },
      dedupeKey: `moment:${p.momentId}`,
    });
  }

  private templateForKind(kind: string): NotificationTemplateId {
    switch (kind) {
      case 'ANNIVERSARY': return NotificationTemplateId.ANNIVERSARY;
      case 'REMINDER': return NotificationTemplateId.REMINDER;
      case 'CALLBACK': return NotificationTemplateId.CALLBACK;
      case 'REFLECTION': return NotificationTemplateId.MEMORY_RECAP;
      case 'CELEBRATION': return NotificationTemplateId.RELATIONSHIP_MILESTONE;
      default: return NotificationTemplateId.MOMENT_TRIGGERED;
    }
  }

  private categoryForKind(kind: string): NotificationCategory {
    switch (kind) {
      case 'ANNIVERSARY': return NotificationCategory.ANNIVERSARY;
      case 'REMINDER': return NotificationCategory.REMINDER;
      case 'CALLBACK': return NotificationCategory.CALLBACK;
      case 'REFLECTION': return NotificationCategory.MEMORY;
      case 'CELEBRATION': return NotificationCategory.RELATIONSHIP;
      default: return NotificationCategory.MOMENT;
    }
  }

  private priorityForSignificance(sig: string): NotificationPriority {
    switch (sig) {
      case 'MILESTONE': return NotificationPriority.HIGH;
      case 'HIGH': return NotificationPriority.NORMAL;
      case 'MEDIUM': return NotificationPriority.NORMAL;
      case 'LOW': return NotificationPriority.LOW;
      default: return NotificationPriority.NORMAL;
    }
  }
}
