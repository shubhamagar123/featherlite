import {
  MomentKind,
  MomentTrigger,
  MomentSignificance,
  MomentStatus,
} from '../enums/moment.enums';

export interface MomentCandidate {
  id?: string;
  userId: string;
  companionId: string;
  kind: MomentKind;
  trigger: MomentTrigger;
  significance: MomentSignificance;
  title: string;
  description?: string;
  contextTags?: string[];
  suggestedOccurAt?: Date;
  data?: Record<string, unknown>;
}

export interface ScheduledMoment {
  id: string;
  userId: string;
  companionId: string;
  kind: MomentKind;
  significance: MomentSignificance;
  status: MomentStatus;
  title: string;
  description?: string;
  scheduledFor: Date;
  createdAt: Date;
  updatedAt: Date;
  data?: Record<string, unknown>;
}

export interface MomentEvaluationInput {
  userId: string;
  companionId: string;
  eventType: string;
  eventPayload: Record<string, unknown>;
  now: Date;
}

export interface MomentEvaluationResult {
  candidates: MomentCandidate[];
}

export interface MomentGenerationOptions {
  significance?: MomentSignificance;
  scheduleDelayMs?: number;
  ttlMs?: number;
}
