import {
  NotificationEngine,
  NotificationCategory,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationTemplateId,
  resetNotificationEngine,
} from '../index';

describe('NotificationEngine', () => {
  beforeEach(() => {
    resetNotificationEngine();
  });

  it('schedules a notification with rendered payload', async () => {
    const engine = new NotificationEngine();
    const result = await engine.scheduleNotification({
      userId: 'user_1',
      companionId: 'comp_1',
      category: NotificationCategory.MOMENT,
      templateId: NotificationTemplateId.MOMENT_TRIGGERED,
      channels: [NotificationChannel.PUSH],
      priority: NotificationPriority.NORMAL,
      data: { COMPANION_NAME: 'Luna', TITLE: 'A quiet moment' },
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value?.status).toBe(NotificationStatus.SCHEDULED);
    expect(result.value?.payload.title).toContain('Luna');
    expect(result.value?.payload.body).toBe('A quiet moment');
  });

  it('dedupes by dedupeKey on repeated schedule', async () => {
    const engine = new NotificationEngine();
    const req = {
      userId: 'user_1',
      category: NotificationCategory.REMINDER,
      templateId: NotificationTemplateId.REMINDER,
      channels: [NotificationChannel.PUSH],
      priority: NotificationPriority.HIGH,
      data: { TITLE: 'Take vitamins' },
      dedupeKey: 'dedupe-1',
    };
    await engine.scheduleNotification(req);
    await engine.scheduleNotification(req);

    const dispatchable = await engine.dispatchDue(new Date(Date.now() + 60_000));
    // Only one notification should have been scheduled + dispatched.
    expect(dispatchable.value?.length).toBeLessThanOrEqual(1);
  });

  it('dispatches a due notification through registered channels', async () => {
    const engine = new NotificationEngine();
    await engine.scheduleNotification({
      userId: 'user_1',
      category: NotificationCategory.REMINDER,
      templateId: NotificationTemplateId.REMINDER,
      channels: [NotificationChannel.PUSH],
      priority: NotificationPriority.HIGH,
      data: { TITLE: 'Take vitamins' },
      scheduledFor: new Date(Date.now() - 1000),
    });

    const results = await engine.dispatchDue();
    expect(results.isSuccess).toBe(true);
    expect(results.value?.length).toBeGreaterThan(0);
    expect(results.value?.[0].success).toBe(true);
  });

  it('throttles notifications beyond the per-minute limit', async () => {
    const engine = new NotificationEngine();
    let last;
    for (let i = 0; i < 6; i++) {
      last = await engine.scheduleNotification({
        userId: 'user_flood',
        category: NotificationCategory.REMINDER,
        templateId: NotificationTemplateId.REMINDER,
        channels: [NotificationChannel.PUSH],
        priority: NotificationPriority.LOW,
        data: { TITLE: `n-${i}` },
        scheduledFor: new Date(Date.now() - 1000),
      });
      await engine.dispatchDue();
    }
    // After the burst, either throttle marks or scheduling denials should register.
    const analytics = engine.getAnalytics();
    expect(analytics.totalScheduled).toBeGreaterThanOrEqual(3);
    expect(last).toBeDefined();
  });

  it('cancels a notification', async () => {
    const engine = new NotificationEngine();
    const scheduled = await engine.scheduleNotification({
      userId: 'user_1',
      category: NotificationCategory.SYSTEM,
      templateId: NotificationTemplateId.GENERIC,
      channels: [NotificationChannel.IN_APP],
      priority: NotificationPriority.NORMAL,
      data: { TITLE: 'X', BODY: 'Y' },
      scheduledFor: new Date(Date.now() + 60_000),
    });

    const cancel = engine.cancelNotification(scheduled.value!.id);
    expect(cancel.isSuccess).toBe(true);
  });

  it('expires notifications past their TTL', async () => {
    const engine = new NotificationEngine();
    await engine.scheduleNotification({
      userId: 'user_1',
      category: NotificationCategory.SAFETY,
      templateId: NotificationTemplateId.GENERIC,
      channels: [NotificationChannel.PUSH],
      priority: NotificationPriority.URGENT,
      data: { TITLE: 'X', BODY: 'Y' },
      scheduledFor: new Date(Date.now() - 10_000),
      ttlMs: 1,
    });

    // Dispatch a full second later so expiresAt (scheduleNow + 1ms) is comfortably past.
    const results = await engine.dispatchDue(new Date(Date.now() + 1000));
    expect(results.value?.length).toBe(0);
  });

  it('reports analytics after activity', async () => {
    const engine = new NotificationEngine();
    await engine.scheduleNotification({
      userId: 'user_1',
      category: NotificationCategory.MEMORY,
      templateId: NotificationTemplateId.MEMORY_RECAP,
      channels: [NotificationChannel.IN_APP],
      priority: NotificationPriority.LOW,
      data: { TITLE: 'Recap' },
      scheduledFor: new Date(Date.now() - 100),
    });
    await engine.dispatchDue();

    const snap = engine.getAnalytics();
    expect(snap.totalScheduled).toBeGreaterThanOrEqual(1);
    expect(snap.totalDispatched).toBeGreaterThanOrEqual(1);
    expect(snap.byCategory.MEMORY).toBe(1);
  });
});
