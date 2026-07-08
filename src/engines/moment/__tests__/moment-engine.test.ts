import {
  MomentEngine,
  MomentKind,
  MomentSignificance,
  MomentStatus,
  resetMomentEngine,
} from '../index';
import { EventType } from '@engines/event';

describe('MomentEngine', () => {
  beforeEach(() => {
    resetMomentEngine();
  });

  it('materializes moments from a significant memory-created event', async () => {
    const engine = new MomentEngine();
    const result = await engine.processEvent({
      userId: 'user_1',
      companionId: 'comp_1',
      eventType: EventType.MEMORY_CREATED,
      eventPayload: { title: 'First meeting', importance: 0.95 },
      now: new Date(),
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value?.length).toBeGreaterThan(0);
    expect(result.value?.[0].kind).toBe(MomentKind.REFLECTION);
    expect(result.value?.[0].significance).toBe(MomentSignificance.MILESTONE);
  });

  it('skips low-importance memory events', async () => {
    const engine = new MomentEngine();
    const result = await engine.processEvent({
      userId: 'user_1',
      companionId: 'comp_1',
      eventType: EventType.MEMORY_CREATED,
      eventPayload: { title: 'Trivial note', importance: 0.2 },
      now: new Date(),
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value?.length).toBe(0);
  });

  it('creates a celebration moment for positive relationship changes', async () => {
    const engine = new MomentEngine();
    const result = await engine.processEvent({
      userId: 'user_1',
      companionId: 'comp_1',
      eventType: EventType.RELATIONSHIP_UPDATED,
      eventPayload: { delta: 0.3, dimension: 'trust' },
      now: new Date(),
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value?.length).toBeGreaterThan(0);
    expect(result.value?.[0].kind).toBe(MomentKind.CELEBRATION);
  });

  it('schedules an anniversary', async () => {
    const engine = new MomentEngine();
    const anniversary = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const result = await engine.scheduleAnniversary(
      'user_1',
      'comp_1',
      anniversary,
      'One year together'
    );

    expect(result.isSuccess).toBe(true);
    expect(result.value?.kind).toBe(MomentKind.ANNIVERSARY);
    expect(result.value?.scheduledFor.getTime()).toBe(anniversary.getTime());
    expect(result.value?.status).toBe(MomentStatus.SCHEDULED);
  });

  it('schedules a callback with delay', async () => {
    const engine = new MomentEngine();
    const before = Date.now();
    const result = await engine.scheduleCallback('user_1', 'comp_1', 3_600_000, 'Follow up on trip');

    expect(result.isSuccess).toBe(true);
    expect(result.value?.kind).toBe(MomentKind.CALLBACK);
    const delta = result.value!.scheduledFor.getTime() - before;
    expect(delta).toBeGreaterThanOrEqual(3_500_000);
  });

  it('lists due moments once scheduled time has passed', async () => {
    const engine = new MomentEngine();
    const past = new Date(Date.now() - 60_000);
    await engine.scheduleReminder('user_1', 'comp_1', past, 'Take vitamins');

    const due = engine.dueMoments(new Date());
    expect(due.isSuccess).toBe(true);
    expect(due.value?.length).toBeGreaterThan(0);
  });

  it('marks a moment as delivered', async () => {
    const engine = new MomentEngine();
    const past = new Date(Date.now() - 60_000);
    const result = await engine.scheduleReminder('user_1', 'comp_1', past, 'X');
    const marked = engine.markDelivered(result.value!.id);
    expect(marked.isSuccess).toBe(true);
    const due = engine.dueMoments(new Date());
    expect(due.value?.find((m) => m.id === result.value!.id)).toBeUndefined();
  });
});
