import {
  NotificationCategory,
  NotificationPriority,
} from '../enums/notification.enums';

export class NotificationRules {
  categoryDefaultTTL(category: NotificationCategory): number {
    switch (category) {
      case NotificationCategory.MOMENT:
      case NotificationCategory.CALLBACK:
      case NotificationCategory.REMINDER:
        return 24 * 60 * 60 * 1000;
      case NotificationCategory.ANNIVERSARY:
        return 48 * 60 * 60 * 1000;
      case NotificationCategory.RELATIONSHIP:
      case NotificationCategory.MEMORY:
        return 72 * 60 * 60 * 1000;
      case NotificationCategory.SAFETY:
        return 15 * 60 * 1000;
      case NotificationCategory.SYSTEM:
      default:
        return 12 * 60 * 60 * 1000;
    }
  }

  priorityWeight(priority: NotificationPriority): number {
    switch (priority) {
      case NotificationPriority.URGENT: return 100;
      case NotificationPriority.HIGH: return 75;
      case NotificationPriority.NORMAL: return 50;
      case NotificationPriority.LOW: return 25;
      default: return 50;
    }
  }
}
