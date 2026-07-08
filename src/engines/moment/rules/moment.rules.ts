import { MomentSignificance, MomentKind } from '../enums/moment.enums';

export class MomentRules {
  significanceToScore(significance: MomentSignificance): number {
    switch (significance) {
      case MomentSignificance.LOW: return 0.25;
      case MomentSignificance.MEDIUM: return 0.5;
      case MomentSignificance.HIGH: return 0.75;
      case MomentSignificance.MILESTONE: return 1.0;
      default: return 0.5;
    }
  }

  categoryFor(kind: MomentKind): string {
    switch (kind) {
      case MomentKind.ANNIVERSARY: return 'anniversary';
      case MomentKind.MILESTONE: return 'milestone';
      case MomentKind.CALLBACK: return 'callback';
      case MomentKind.FOLLOW_UP: return 'follow_up';
      case MomentKind.REMINDER: return 'reminder';
      case MomentKind.CELEBRATION: return 'celebration';
      case MomentKind.REFLECTION: return 'reflection';
      case MomentKind.CHECK_IN: return 'check_in';
      case MomentKind.EMOTIONAL_SUPPORT: return 'emotional_support';
      case MomentKind.SHARED_INTEREST: return 'shared_interest';
      default: return 'general';
    }
  }

  defaultDelayForKind(kind: MomentKind): number {
    switch (kind) {
      case MomentKind.FOLLOW_UP: return 24 * 60 * 60 * 1000;
      case MomentKind.CHECK_IN: return 72 * 60 * 60 * 1000;
      case MomentKind.CALLBACK: return 6 * 60 * 60 * 1000;
      case MomentKind.REMINDER: return 60 * 60 * 1000;
      case MomentKind.ANNIVERSARY: return 0;
      default: return 24 * 60 * 60 * 1000;
    }
  }
}
