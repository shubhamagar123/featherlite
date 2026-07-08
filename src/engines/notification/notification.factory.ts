import { INotificationEngine } from './interfaces/notification.interfaces';
import { NotificationEngine, NotificationEngineDeps } from './notification.engine';
import { EventEngine, getEventEngine } from '@engines/event';
import { getDatabaseServices } from '@services/factory';

let cached: INotificationEngine | null = null;

export interface NotificationEngineFactoryDeps extends NotificationEngineDeps {
  eventEngine?: EventEngine;
}

export function getNotificationEngine(deps: NotificationEngineFactoryDeps = {}): INotificationEngine {
  if (cached && !hasOverrides(deps)) return cached;

  const engine = new NotificationEngine({
    ...deps,
    eventEngine: deps.eventEngine ?? getEventEngine(),
    notificationService: deps.notificationService ?? tryGetNotificationService(),
  });

  if (!hasOverrides(deps)) cached = engine;
  return engine;
}

export function resetNotificationEngine(): void {
  cached = null;
}

function tryGetNotificationService() {
  try {
    return getDatabaseServices().notificationService;
  } catch {
    return undefined;
  }
}

function hasOverrides(deps: NotificationEngineFactoryDeps): boolean {
  return Boolean(
    deps.templates ||
      deps.builder ||
      deps.scheduler ||
      deps.dispatcher ||
      deps.throttler ||
      deps.analytics ||
      deps.rules ||
      deps.eventEngine ||
      deps.notificationService
  );
}
