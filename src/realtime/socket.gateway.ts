/**
 * Socket Gateway
 * Main Socket.IO gateway orchestrating all real-time operations
 */

import { Server, Socket } from 'socket.io';
import { SocketRegistry } from './registry/socket.registry';
import { SocketAuthPayload } from './types';
import { createLogger } from '@utils/logger';

export class SocketGateway {
  private logger = createLogger(this.constructor.name);
  private io: Server | null = null;
  private registry: SocketRegistry;

  constructor() {
    this.registry = new SocketRegistry();
  }

  initialize(io: Server): void {
    this.io = io;

    this.logger.info('Socket Gateway initializing');

    this.setupMiddleware();
    this.setupConnectionHandlers();
    this.setupDisconnectionHandlers();

    this.logger.info('Socket Gateway initialized');
  }

  private setupMiddleware(): void {
    const auth = this.registry.getAuthentication();

    this.io!.use((socket, next) => {
      try {
        const token =
          auth.extractTokenFromHeader(socket.handshake.headers.authorization || '') ||
          auth.extractTokenFromQuery(socket.handshake.query);

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        if (auth.isTokenExpired(token)) {
          return next(new Error('Token expired'));
        }

        const payload = auth.validateToken(token);

        if (!payload) {
          return next(new Error('Invalid token'));
        }

        if (
          !payload.userId ||
          !payload.sessionId ||
          !payload.deviceId ||
          !payload.accessToken
        ) {
          return next(new Error('Invalid token payload: missing required fields'));
        }

        socket.data.authPayload = payload;
        next();
      } catch (error) {
        this.logger.error(`Middleware error: ${error}`);
        next(new Error('Authentication failed'));
      }
    });

    this.logger.debug('Middleware setup completed');
  }

  private setupConnectionHandlers(): void {
    this.io!.on('connection', (socket: Socket) => {
      try {
        const authPayload = socket.data.authPayload as SocketAuthPayload;

        const connection = this.registry.getConnectionManager().registerConnection(
          socket.id,
          authPayload.userId,
          authPayload.sessionId,
          authPayload.deviceId,
          socket.handshake.headers['user-agent'] || '',
          socket.handshake.address || '',
          {
            connectedAt: new Date().toISOString(),
          }
        );

        this.registry.getAuthentication().authenticateConnection(
          connection,
          authPayload.accessToken
        );

        this.registry.getPresenceManager().setPresence(
          authPayload.userId,
          'ONLINE' as any
        );

        this.registry.getHeartbeatManager().registerHeartbeat(
          socket.id,
          authPayload.userId
        );

        this.registry.getMetricsCollector().recordConnection();

        this.logger.info(`Socket connected: ${socket.id} (user: ${authPayload.userId})`);

        this.setupSocketEventHandlers(socket);
        this.setupHeartbeatHandler(socket);
      } catch (error) {
        this.logger.error(`Connection handler error: ${error}`);
        socket.disconnect();
      }
    });
  }

  private setupDisconnectionHandlers(): void {
    this.io!.on('disconnect', (socket: Socket) => {
      try {
        const connection = this.registry
          .getConnectionManager()
          .getConnection(socket.id);

        if (connection) {
          this.registry
            .getConnectionManager()
            .removeConnection(socket.id);

          this.registry.getPresenceManager().setUserOffline(connection.userId);

          this.registry.getHeartbeatManager().removeHeartbeat(socket.id);

          this.registry.getRoomsManager().removeMemberFromAllRooms(socket.id);

          this.registry.getMetricsCollector().recordDisconnection();

          this.logger.info(`Socket disconnected: ${socket.id}`);
        }
      } catch (error) {
        this.logger.error(`Disconnection handler error: ${error}`);
      }
    });
  }

  private setupSocketEventHandlers(socket: Socket): void {
    const authPayload = socket.data.authPayload as SocketAuthPayload;

    socket.on('interaction:start', (data: Record<string, any>, callback: Function) => {
      this.handleInteractionStart(socket, authPayload, data, callback);
    });

    socket.on('interaction:message', (data: Record<string, any>, callback: Function) => {
      this.handleInteractionMessage(socket, authPayload, data, callback);
    });

    socket.on('interaction:stop', (data: Record<string, any>, callback: Function) => {
      this.handleInteractionStop(socket, authPayload, data, callback);
    });

    socket.on('typing:start', (data: Record<string, any>, callback: Function) => {
      this.handleTypingStart(socket, authPayload, data, callback);
    });

    socket.on('typing:stop', (data: Record<string, any>, callback: Function) => {
      this.handleTypingStop(socket, authPayload, data, callback);
    });

    socket.on('presence:update', (data: Record<string, any>, callback: Function) => {
      this.handlePresenceUpdate(socket, authPayload, data, callback);
    });

    socket.on('voice:chunk', (data: Record<string, any>, callback: Function) => {
      this.handleVoiceChunk(socket, authPayload, data, callback);
    });

    socket.on('heartbeat', (data: Record<string, any>, callback: Function) => {
      this.handleHeartbeat(socket, authPayload, data, callback);
    });

    socket.on('error', (error: Error) => {
      this.logger.error(`Socket error [${socket.id}]: ${error}`);
    });
  }

  private setupHeartbeatHandler(socket: Socket): void {
    const interval = this.registry
      .getConfigManager()
      .getHeartbeatInterval();

    let isSocketActive = true;

    const heartbeatInterval = setInterval(() => {
      if (!isSocketActive || !socket.connected) {
        clearInterval(heartbeatInterval);
        return;
      }
      socket.emit('heartbeat:ping', { timestamp: new Date() });
    }, interval);

    const disconnectHandler = () => {
      isSocketActive = false;
      clearInterval(heartbeatInterval);
    };

    socket.once('disconnect', disconnectHandler);
    socket.on('error', disconnectHandler);
  }

  private handleInteractionStart(
    _socket: Socket,
    authPayload: SocketAuthPayload,
    data: Record<string, any>,
    callback: Function
  ): void {
    try {
      const interaction = this.registry.getInteractionManager().startInteraction(
        authPayload.userId,
        data.companionId,
        authPayload.sessionId,
        data.context || {}
      );

      this.registry.getMetricsCollector().recordInteractionStart();

      callback({ success: true, interactionId: interaction.id });

      this.io!.to(authPayload.sessionId).emit('interaction:started', {
        interactionId: interaction.id,
        userId: authPayload.userId,
        companionId: data.companionId,
      });
    } catch (error) {
      this.logger.error(`Interaction start error: ${error}`);
      callback({ success: false, error: String(error) });
      this.registry.getMetricsCollector().recordError('interaction:start');
    }
  }

  private handleInteractionMessage(
    _socket: Socket,
    _authPayload: SocketAuthPayload,
    data: Record<string, any>,
    callback: Function
  ): void {
    try {
      const interaction = this.registry
        .getInteractionManager()
        .getInteraction(data.interactionId);

      if (!interaction) {
        callback({ success: false, error: 'Interaction not found' });
        return;
      }

      const message = {
        id: data.messageId || Math.random().toString(),
        role: data.role,
        content: data.content,
        timestamp: new Date(),
        metadata: data.metadata,
      };

      this.registry.getInteractionManager().addMessageToInteraction(
        data.interactionId,
        message as any
      );

      callback({ success: true });

      this.io!.to(interaction.sessionId).emit('interaction:message', {
        interactionId: data.interactionId,
        message,
      });
    } catch (error) {
      this.logger.error(`Interaction message error: ${error}`);
      callback({ success: false, error: String(error) });
      this.registry.getMetricsCollector().recordError('interaction:message');
    }
  }

  private handleInteractionStop(
    _socket: Socket,
    _authPayload: SocketAuthPayload,
    data: Record<string, any>,
    callback: Function
  ): void {
    try {
      const interaction = this.registry
        .getInteractionManager()
        .stopInteraction(data.interactionId);

      if (!interaction) {
        callback({ success: false, error: 'Interaction not found' });
        return;
      }

      this.registry.getMetricsCollector().recordInteractionEnd();

      callback({ success: true });

      this.io!.to(interaction.sessionId).emit('interaction:stopped', {
        interactionId: data.interactionId,
        metrics: interaction.metrics,
      });
    } catch (error) {
      this.logger.error(`Interaction stop error: ${error}`);
      callback({ success: false, error: String(error) });
    }
  }

  private handleTypingStart(
    _socket: Socket,
    authPayload: SocketAuthPayload,
    data: Record<string, any>,
    callback: Function
  ): void {
    try {
      const typingData = this.registry.getTypingManager().setUserTyping(
        authPayload.userId,
        data.roomId
      );

      callback({ success: true });

      this.io!.to(data.roomId).emit('typing:user_started', {
        userId: authPayload.userId,
        typingData,
      });
    } catch (error) {
      this.logger.error(`Typing start error: ${error}`);
      callback({ success: false, error: String(error) });
    }
  }

  private handleTypingStop(
    _socket: Socket,
    authPayload: SocketAuthPayload,
    data: Record<string, any>,
    callback: Function
  ): void {
    try {
      this.registry.getTypingManager().setUserStoppedTyping(
        authPayload.userId,
        data.roomId
      );

      callback({ success: true });

      this.io!.to(data.roomId).emit('typing:user_stopped', {
        userId: authPayload.userId,
      });
    } catch (error) {
      this.logger.error(`Typing stop error: ${error}`);
      callback({ success: false, error: String(error) });
    }
  }

  private handlePresenceUpdate(
    _socket: Socket,
    authPayload: SocketAuthPayload,
    data: Record<string, any>,
    callback: Function
  ): void {
    try {
      const presence = this.registry.getPresenceManager().updatePresenceStatus(
        authPayload.userId,
        data.status
      );

      if (!presence) {
        callback({ success: false, error: 'User not found' });
        return;
      }

      callback({ success: true });

      this.io!.emit('presence:updated', {
        userId: authPayload.userId,
        presence,
      });
    } catch (error) {
      this.logger.error(`Presence update error: ${error}`);
      callback({ success: false, error: String(error) });
    }
  }

  private handleVoiceChunk(
    _socket: Socket,
    authPayload: SocketAuthPayload,
    data: Record<string, any>,
    callback: Function
  ): void {
    try {
      callback({ success: true });

      this.io!.emit('voice:chunk_received', {
        userId: authPayload.userId,
        chunkId: data.chunkId,
      });
    } catch (error) {
      this.logger.error(`Voice chunk error: ${error}`);
      callback({ success: false, error: String(error) });
    }
  }

  private handleHeartbeat(
    socket: Socket,
    _authPayload: SocketAuthPayload,
    data: Record<string, any>,
    callback: Function
  ): void {
    try {
      const latency = Date.now() - (data.timestamp || 0);

      this.registry.getHeartbeatManager().recordHeartbeat(socket.id, latency);

      callback({ success: true, latency });
    } catch (error) {
      this.logger.error(`Heartbeat error: ${error}`);
      callback({ success: false, error: String(error) });
    }
  }

  getRegistry(): SocketRegistry {
    return this.registry;
  }

  getIO(): Server | null {
    return this.io;
  }

  shutdown(): void {
    this.logger.info('Socket Gateway shutdown initiated');

    this.registry.cleanup();

    if (this.io) {
      this.io.close();
    }

    this.logger.info('Socket Gateway shutdown completed');
  }
}
