/**
 * Acknowledgement Manager
 * Manages message acknowledgment tracking
 */

import { Acknowledgement } from '../types';
import { createLogger } from '@utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface AcknowledgementRecord extends Acknowledgement {
  createdAt: Date;
  expiresAt: Date;
}

export class AcknowledgementManager {
  private logger = createLogger(this.constructor.name);
  private acknowledgements = new Map<string, AcknowledgementRecord>();
  private socketAcknowledgements = new Map<string, Set<string>>();
  private ackTTL = 5 * 60 * 1000; // 5 minutes

  createAcknowledgement(
    messageId: string,
    eventType: string,
    socketId: string
  ): Acknowledgement {
    const ackId = uuidv4();
    const now = new Date();

    const ack: AcknowledgementRecord = {
      messageId,
      eventType,
      socketId,
      timestamp: now,
      status: 'PENDING',
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.ackTTL),
    };

    this.acknowledgements.set(ackId, ack);

    if (!this.socketAcknowledgements.has(socketId)) {
      this.socketAcknowledgements.set(socketId, new Set());
    }
    this.socketAcknowledgements.get(socketId)!.add(ackId);

    this.logger.debug(`Acknowledgement created: ${ackId} for message ${messageId}`);

    return {
      messageId,
      eventType,
      socketId,
      timestamp: now,
      status: 'PENDING',
    };
  }

  getAcknowledgement(ackId: string): Acknowledgement | null {
    const ack = this.acknowledgements.get(ackId);

    if (!ack) {
      return null;
    }

    return {
      messageId: ack.messageId,
      eventType: ack.eventType,
      socketId: ack.socketId,
      timestamp: ack.timestamp,
      status: ack.status,
    };
  }

  recordSent(ackId: string): Acknowledgement | null {
    const ack = this.acknowledgements.get(ackId);

    if (!ack) {
      return null;
    }

    ack.status = 'SENT';
    ack.timestamp = new Date();
    this.acknowledgements.set(ackId, ack);

    return {
      messageId: ack.messageId,
      eventType: ack.eventType,
      socketId: ack.socketId,
      timestamp: ack.timestamp,
      status: ack.status,
    };
  }

  recordReceived(ackId: string): Acknowledgement | null {
    const ack = this.acknowledgements.get(ackId);

    if (!ack) {
      return null;
    }

    ack.status = 'RECEIVED';
    ack.timestamp = new Date();
    this.acknowledgements.set(ackId, ack);

    this.logger.debug(`Message acknowledged: ${ack.messageId}`);

    return {
      messageId: ack.messageId,
      eventType: ack.eventType,
      socketId: ack.socketId,
      timestamp: ack.timestamp,
      status: ack.status,
    };
  }

  recordFailed(ackId: string): Acknowledgement | null {
    const ack = this.acknowledgements.get(ackId);

    if (!ack) {
      return null;
    }

    ack.status = 'FAILED';
    ack.timestamp = new Date();
    this.acknowledgements.set(ackId, ack);

    this.logger.warn(`Message failed: ${ack.messageId}`);

    return {
      messageId: ack.messageId,
      eventType: ack.eventType,
      socketId: ack.socketId,
      timestamp: ack.timestamp,
      status: ack.status,
    };
  }

  getSocketAcknowledgements(socketId: string): Acknowledgement[] {
    const ackIds = this.socketAcknowledgements.get(socketId) || new Set();
    const acks: Acknowledgement[] = [];

    for (const ackId of ackIds) {
      const ack = this.acknowledgements.get(ackId);
      if (ack) {
        acks.push({
          messageId: ack.messageId,
          eventType: ack.eventType,
          socketId: ack.socketId,
          timestamp: ack.timestamp,
          status: ack.status,
        });
      }
    }

    return acks;
  }

  getPendingAcknowledgements(): Acknowledgement[] {
    return Array.from(this.acknowledgements.values())
      .filter(a => a.status === 'PENDING')
      .map(a => ({
        messageId: a.messageId,
        eventType: a.eventType,
        socketId: a.socketId,
        timestamp: a.timestamp,
        status: a.status,
      }));
  }

  getFailedAcknowledgements(): Acknowledgement[] {
    return Array.from(this.acknowledgements.values())
      .filter(a => a.status === 'FAILED')
      .map(a => ({
        messageId: a.messageId,
        eventType: a.eventType,
        socketId: a.socketId,
        timestamp: a.timestamp,
        status: a.status,
      }));
  }

  getReceivedAcknowledgements(): Acknowledgement[] {
    return Array.from(this.acknowledgements.values())
      .filter(a => a.status === 'RECEIVED')
      .map(a => ({
        messageId: a.messageId,
        eventType: a.eventType,
        socketId: a.socketId,
        timestamp: a.timestamp,
        status: a.status,
      }));
  }

  removeAcknowledgement(ackId: string): boolean {
    const ack = this.acknowledgements.get(ackId);

    if (!ack) {
      return false;
    }

    this.acknowledgements.delete(ackId);

    const socketAcks = this.socketAcknowledgements.get(ack.socketId);
    if (socketAcks) {
      socketAcks.delete(ackId);
    }

    this.logger.debug(`Acknowledgement removed: ${ackId}`);

    return true;
  }

  cleanupExpiredAcknowledgements(): string[] {
    const now = new Date();
    const expiredAckIds: string[] = [];

    for (const [ackId, ack] of this.acknowledgements.entries()) {
      if (now > ack.expiresAt) {
        this.removeAcknowledgement(ackId);
        expiredAckIds.push(ackId);

        this.logger.debug(`Acknowledgement expired: ${ackId}`);
      }
    }

    return expiredAckIds;
  }

  getAcknowledgementRate(): {
    pending: number;
    sent: number;
    received: number;
    failed: number;
    successRate: number;
  } {
    const acks = Array.from(this.acknowledgements.values());

    const pending = acks.filter(a => a.status === 'PENDING').length;
    const sent = acks.filter(a => a.status === 'SENT').length;
    const received = acks.filter(a => a.status === 'RECEIVED').length;
    const failed = acks.filter(a => a.status === 'FAILED').length;

    const total = sent + received + failed;
    const successRate = total > 0 ? (received / total) * 100 : 0;

    return {
      pending,
      sent,
      received,
      failed,
      successRate,
    };
  }

  getAcknowledgementCount(): number {
    return this.acknowledgements.size;
  }

  getPendingAcknowledgementCount(): number {
    return Array.from(this.acknowledgements.values()).filter(
      a => a.status === 'PENDING'
    ).length;
  }
}
