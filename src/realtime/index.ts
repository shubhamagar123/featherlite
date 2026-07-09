/**
 * Real-Time Communication Platform
 * Complete Socket.IO platform for live interactions
 */

// Types
export * from './types';

// Managers
export { ConnectionManager } from './managers/connection.manager';
export { PresenceManager } from './managers/presence.manager';
export { RealtimeInteractionManager } from './managers/realtime-interaction.manager';
export { TypingManager } from './managers/typing.manager';
export { StreamingManager } from './managers/streaming.manager';
export { VoiceManager } from './managers/voice.manager';
export { HeartbeatManager } from './managers/heartbeat.manager';
export { ReconnectManager } from './managers/reconnect.manager';
export { AcknowledgementManager } from './managers/acknowledgement.manager';
export { SocketRoomsManager } from './managers/socket-rooms.manager';

// Security
export { SocketAuthentication } from './security/socket.authentication';

// Metrics
export { SocketMetricsCollector } from './metrics/socket.metrics';

// Configuration
export { SocketConfigurationManager } from './config/socket.configuration';

// Registry
export { SocketRegistry } from './registry/socket.registry';

// Gateway
export { SocketGateway } from './socket.gateway';
