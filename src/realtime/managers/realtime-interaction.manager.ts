/**
 * Realtime Interaction Manager
 * Manages active user-companion interactions in real-time
 */

import { Interaction, InteractionStatus, InteractionMessage } from '../types';
import { createLogger } from '@utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class RealtimeInteractionManager {
  private logger = createLogger(this.constructor.name);
  private interactions = new Map<string, Interaction>();
  private userInteractions = new Map<string, Set<string>>();
  private sessionInteractions = new Map<string, Set<string>>();

  startInteraction(
    userId: string,
    companionId: string,
    sessionId: string,
    context: Record<string, any>
  ): Interaction {
    const interactionId = uuidv4();

    const interaction: Interaction = {
      id: interactionId,
      userId,
      companionId,
      sessionId,
      status: InteractionStatus.STARTING,
      startedAt: new Date(),
      messageHistory: [],
      context,
      metrics: {
        messageCount: 0,
        totalDuration: 0,
        averageLatency: 0,
        userTurns: 0,
        companionTurns: 0,
      },
    };

    this.interactions.set(interactionId, interaction);

    if (!this.userInteractions.has(userId)) {
      this.userInteractions.set(userId, new Set());
    }
    this.userInteractions.get(userId)!.add(interactionId);

    if (!this.sessionInteractions.has(sessionId)) {
      this.sessionInteractions.set(sessionId, new Set());
    }
    this.sessionInteractions.get(sessionId)!.add(interactionId);

    this.logger.debug(
      `Interaction started: ${interactionId} (${userId} -> ${companionId})`
    );

    return interaction;
  }

  getInteraction(interactionId: string): Interaction | null {
    return this.interactions.get(interactionId) || null;
  }

  getUserInteractions(userId: string): Interaction[] {
    const interactionIds = this.userInteractions.get(userId) || new Set();
    const interactions: Interaction[] = [];

    for (const id of interactionIds) {
      const interaction = this.interactions.get(id);
      if (interaction && interaction.status !== InteractionStatus.IDLE) {
        interactions.push(interaction);
      }
    }

    return interactions;
  }

  getSessionInteractions(sessionId: string): Interaction[] {
    const interactionIds = this.sessionInteractions.get(sessionId) || new Set();
    const interactions: Interaction[] = [];

    for (const id of interactionIds) {
      const interaction = this.interactions.get(id);
      if (interaction && interaction.status !== InteractionStatus.IDLE) {
        interactions.push(interaction);
      }
    }

    return interactions;
  }

  getActiveInteractions(): Interaction[] {
    return Array.from(this.interactions.values()).filter(
      i => i.status !== InteractionStatus.IDLE
    );
  }

  updateInteractionStatus(
    interactionId: string,
    status: InteractionStatus
  ): Interaction | null {
    const interaction = this.interactions.get(interactionId);

    if (!interaction) {
      return null;
    }

    interaction.status = status;
    this.interactions.set(interactionId, interaction);

    this.logger.debug(`Interaction status updated: ${interactionId} -> ${status}`);
    return interaction;
  }

  addMessageToInteraction(
    interactionId: string,
    message: InteractionMessage
  ): Interaction | null {
    const interaction = this.interactions.get(interactionId);

    if (!interaction) {
      return null;
    }

    interaction.messageHistory.push(message);
    interaction.metrics.messageCount++;

    if (message.role === 'USER') {
      interaction.metrics.userTurns++;
    } else {
      interaction.metrics.companionTurns++;
    }

    this.interactions.set(interactionId, interaction);
    return interaction;
  }

  updateInteractionMetrics(
    interactionId: string,
    metrics: Record<string, any>
  ): Interaction | null {
    const interaction = this.interactions.get(interactionId);

    if (!interaction) {
      return null;
    }

    interaction.metrics = {
      ...interaction.metrics,
      ...metrics,
    };

    this.interactions.set(interactionId, interaction);
    return interaction;
  }

  pauseInteraction(interactionId: string): Interaction | null {
    const interaction = this.interactions.get(interactionId);

    if (!interaction) {
      return null;
    }

    interaction.status = InteractionStatus.PAUSED;
    interaction.pausedAt = new Date();
    this.interactions.set(interactionId, interaction);

    this.logger.debug(`Interaction paused: ${interactionId}`);
    return interaction;
  }

  resumeInteraction(interactionId: string): Interaction | null {
    const interaction = this.interactions.get(interactionId);

    if (!interaction) {
      return null;
    }

    interaction.status = InteractionStatus.ACTIVE;
    interaction.pausedAt = undefined;
    this.interactions.set(interactionId, interaction);

    this.logger.debug(`Interaction resumed: ${interactionId}`);
    return interaction;
  }

  stopInteraction(interactionId: string): Interaction | null {
    const interaction = this.interactions.get(interactionId);

    if (!interaction) {
      return null;
    }

    interaction.status = InteractionStatus.STOPPED;
    interaction.stoppedAt = new Date();

    if (interaction.startedAt && interaction.stoppedAt) {
      interaction.metrics.totalDuration =
        interaction.stoppedAt.getTime() - interaction.startedAt.getTime();
    }

    this.interactions.set(interactionId, interaction);

    this.logger.debug(`Interaction stopped: ${interactionId}`);
    return interaction;
  }

  removeInteraction(interactionId: string): boolean {
    const interaction = this.interactions.get(interactionId);

    if (!interaction) {
      return false;
    }

    this.interactions.delete(interactionId);

    const userInteractions = this.userInteractions.get(interaction.userId);
    if (userInteractions) {
      userInteractions.delete(interactionId);
    }

    const sessionInteractions = this.sessionInteractions.get(
      interaction.sessionId
    );
    if (sessionInteractions) {
      sessionInteractions.delete(interactionId);
    }

    this.logger.debug(`Interaction removed: ${interactionId}`);
    return true;
  }

  getInteractionCount(): number {
    return this.interactions.size;
  }

  getActiveInteractionCount(): number {
    return Array.from(this.interactions.values()).filter(
      i => i.status !== InteractionStatus.IDLE
    ).length;
  }
}
