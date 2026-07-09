/**
 * Socket Registry
 * Central registry for socket managers and connections
 */

import { ConnectionManager } from '../managers/connection.manager';
import { PresenceManager } from '../managers/presence.manager';
import { RealtimeInteractionManager } from '../managers/realtime-interaction.manager';
import { TypingManager } from '../managers/typing.manager';
import { StreamingManager } from '../managers/streaming.manager';
import { VoiceManager } from '../managers/voice.manager';
import { HeartbeatManager } from '../managers/heartbeat.manager';
import { ReconnectManager } from '../managers/reconnect.manager';
import { AcknowledgementManager } from '../managers/acknowledgement.manager';
import { SocketRoomsManager } from '../managers/socket-rooms.manager';
import { SocketAuthentication } from '../security/socket.authentication';
import { SocketMetricsCollector } from '../metrics/socket.metrics';
import { SocketConfigurationManager } from '../config/socket.configuration';
import { createLogger } from '@utils/logger';

export class SocketRegistry {
  private logger = createLogger(this.constructor.name);

  private connectionManager: ConnectionManager;
  private presenceManager: PresenceManager;
  private interactionManager: RealtimeInteractionManager;
  private typingManager: TypingManager;
  private streamingManager: StreamingManager;
  private voiceManager: VoiceManager;
  private heartbeatManager: HeartbeatManager;
  private reconnectManager: ReconnectManager;
  private acknowledgementManager: AcknowledgementManager;
  private roomsManager: SocketRoomsManager;
  private authentication: SocketAuthentication;
  private metricsCollector: SocketMetricsCollector;
  private configManager: SocketConfigurationManager;

  constructor() {
    this.connectionManager = new ConnectionManager();
    this.presenceManager = new PresenceManager();
    this.interactionManager = new RealtimeInteractionManager();
    this.typingManager = new TypingManager();
    this.streamingManager = new StreamingManager();
    this.voiceManager = new VoiceManager();
    this.heartbeatManager = new HeartbeatManager();
    this.reconnectManager = new ReconnectManager();
    this.acknowledgementManager = new AcknowledgementManager();
    this.roomsManager = new SocketRoomsManager();
    this.authentication = new SocketAuthentication();
    this.metricsCollector = new SocketMetricsCollector();
    this.configManager = new SocketConfigurationManager();

    this.logger.info('Socket Registry initialized');
  }

  getConnectionManager(): ConnectionManager {
    return this.connectionManager;
  }

  getPresenceManager(): PresenceManager {
    return this.presenceManager;
  }

  getInteractionManager(): RealtimeInteractionManager {
    return this.interactionManager;
  }

  getTypingManager(): TypingManager {
    return this.typingManager;
  }

  getStreamingManager(): StreamingManager {
    return this.streamingManager;
  }

  getVoiceManager(): VoiceManager {
    return this.voiceManager;
  }

  getHeartbeatManager(): HeartbeatManager {
    return this.heartbeatManager;
  }

  getReconnectManager(): ReconnectManager {
    return this.reconnectManager;
  }

  getAcknowledgementManager(): AcknowledgementManager {
    return this.acknowledgementManager;
  }

  getRoomsManager(): SocketRoomsManager {
    return this.roomsManager;
  }

  getAuthentication(): SocketAuthentication {
    return this.authentication;
  }

  getMetricsCollector(): SocketMetricsCollector {
    return this.metricsCollector;
  }

  getConfigManager(): SocketConfigurationManager {
    return this.configManager;
  }

  getAllManagers() {
    return {
      connection: this.connectionManager,
      presence: this.presenceManager,
      interaction: this.interactionManager,
      typing: this.typingManager,
      streaming: this.streamingManager,
      voice: this.voiceManager,
      heartbeat: this.heartbeatManager,
      reconnect: this.reconnectManager,
      acknowledgement: this.acknowledgementManager,
      rooms: this.roomsManager,
      authentication: this.authentication,
      metrics: this.metricsCollector,
      config: this.configManager,
    };
  }

  getRegistryStatus(): Record<string, any> {
    return {
      connections: this.connectionManager.getConnectionCount(),
      onlineUsers: this.presenceManager.getOnlineCount(),
      activeInteractions: this.interactionManager.getActiveInteractionCount(),
      activeStreams: this.streamingManager.getActiveStreamCount(),
      typingUsers: this.typingManager.getTypingCount(),
      voiceSessions: this.voiceManager.getVoiceSessionCount(),
      rooms: this.roomsManager.getRoomCount(),
      reconnectAttempts: this.reconnectManager.getReconnectCount(),
      pendingAcknowledgements: this.acknowledgementManager.getPendingAcknowledgementCount(),
      metrics: this.metricsCollector.getMetrics(),
    };
  }

  logStatus(): void {
    const status = this.getRegistryStatus();
    this.logger.info(`Socket Registry Status:
      Connections: ${status.connections}
      Online Users: ${status.onlineUsers}
      Active Interactions: ${status.activeInteractions}
      Active Streams: ${status.activeStreams}
      Typing Users: ${status.typingUsers}
      Voice Sessions: ${status.voiceSessions}
      Rooms: ${status.rooms}
      Reconnect Attempts: ${status.reconnectAttempts}
      Pending Acknowledgements: ${status.pendingAcknowledgements}
    `);
  }

  cleanup(): void {
    this.logger.info('Socket Registry cleanup initiated');

    this.typingManager.cleanupExpiredTyping();
    this.voiceManager.cleanupInactiveSessions(300000);
    this.heartbeatManager.getConnectionsStalerThan(300000);
    this.reconnectManager.cleanupExpiredAttempts();
    this.acknowledgementManager.cleanupExpiredAcknowledgements();
    this.roomsManager.deleteEmptyRooms();

    this.logger.info('Socket Registry cleanup completed');
  }
}
