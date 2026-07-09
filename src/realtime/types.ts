/**
 * Real-Time Communication Types
 * Core types for Socket.IO platform
 */

// ==================== Enums ====================

export enum PresenceStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  IDLE = 'IDLE',
  BUSY = 'BUSY',
  TYPING = 'TYPING',
  VOICE = 'VOICE',
}

export enum InteractionStatus {
  IDLE = 'IDLE',
  STARTING = 'STARTING',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  STREAMING = 'STREAMING',
  STOPPED = 'STOPPED',
}

export enum StreamingStatus {
  PENDING = 'PENDING',
  STREAMING = 'STREAMING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ERROR = 'ERROR',
}

export enum RoomType {
  USER = 'USER',
  COMPANION = 'COMPANION',
  SESSION = 'SESSION',
  GROUP = 'GROUP',
}

export enum EventPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// ==================== Interfaces ====================

export interface SocketConnection {
  socketId: string;
  userId: string;
  sessionId: string;
  deviceId: string;
  companionId?: string;
  connectedAt: Date;
  lastHeartbeat: Date;
  isAuthenticated: boolean;
  correlationId: string;
  userAgent: string;
  ipAddress: string;
  metadata: Record<string, any>;
}

export interface PresenceData {
  userId: string;
  status: PresenceStatus;
  companionId?: string;
  lastSeen: Date;
  typingIn?: string;
  voiceActive: boolean;
  metadata: Record<string, any>;
}

export interface Interaction {
  id: string;
  userId: string;
  companionId: string;
  sessionId: string;
  status: InteractionStatus;
  startedAt: Date;
  pausedAt?: Date;
  stoppedAt?: Date;
  messageHistory: InteractionMessage[];
  context: Record<string, any>;
  metrics: InteractionMetrics;
}

export interface InteractionMessage {
  id: string;
  role: 'USER' | 'COMPANION';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface InteractionMetrics {
  messageCount: number;
  totalDuration: number;
  averageLatency: number;
  userTurns: number;
  companionTurns: number;
}

export interface StreamingContext {
  streamId: string;
  userId: string;
  sessionId: string;
  interactionId: string;
  companionId: string;
  status: StreamingStatus;
  startedAt: Date;
  completedAt?: Date;
  tokens: StreamToken[];
  totalTokens: number;
  metadata: Record<string, any>;
}

export interface StreamToken {
  id: string;
  index: number;
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface TypingData {
  userId: string;
  roomId: string;
  startedAt: Date;
  isActive: boolean;
}

export interface VoiceData {
  userId: string;
  sessionId: string;
  chunkId: string;
  audio: Buffer;
  timestamp: Date;
  sequence: number;
}

export interface HeartbeatData {
  timestamp: Date;
  socketId: string;
  userId: string;
  latency: number;
  metadata: Record<string, any>;
}

export interface ReconnectData {
  previousSocketId: string;
  newSocketId: string;
  reconnectAttempt: number;
  lastConnectedAt: Date;
  reconnectAt: Date;
}

export interface Acknowledgement {
  messageId: string;
  eventType: string;
  socketId: string;
  timestamp: Date;
  status: 'PENDING' | 'SENT' | 'RECEIVED' | 'FAILED';
}

export interface SocketRoom {
  id: string;
  type: RoomType;
  members: Set<string>;
  createdAt: Date;
  metadata: Record<string, any>;
}

export interface SocketEvent {
  id: string;
  type: string;
  timestamp: Date;
  priority: EventPriority;
  sourceSocket: string;
  targetRoom?: string;
  payload: Record<string, any>;
  correlationId: string;
  acknowledged?: boolean;
}

export interface ClientEvent {
  type: string;
  payload: Record<string, any>;
  timestamp?: Date;
}

export interface ServerEvent {
  type: string;
  payload: Record<string, any>;
  timestamp: Date;
  priority?: EventPriority;
}

export interface SocketMetrics {
  connectedSockets: number;
  activeInteractions: number;
  messagesSent: number;
  messagesReceived: number;
  averageLatency: number;
  errorCount: number;
  lastUpdated: Date;
  topicMetrics: Map<string, TopicMetrics>;
}

export interface TopicMetrics {
  eventType: string;
  count: number;
  averageLatency: number;
  errorCount: number;
  lastOccurrence: Date;
}

export interface SocketAuthPayload {
  userId: string;
  sessionId: string;
  deviceId: string;
  accessToken: string;
  timestamp: Date;
}

export interface SocketConfiguration {
  port: number;
  namespace: string;
  enableCompression: boolean;
  heartbeatInterval: number;
  heartbeatTimeout: number;
  reconnectDelay: number;
  maxReconnectAttempts: number;
  maxConcurrentStreams: number;
  eventBufferSize: number;
  rateLimitWindow: number;
  rateLimitMaxEvents: number;
}

export interface StreamingPipeline {
  interactionEngine: any;
  contextEngine: any;
  promptOrchestrator: any;
  llmGateway: any;
  responseProcessor: any;
  socketStream: any;
}

export interface RealtimeEvent {
  eventType: 'SOCKET_CONNECTED' | 'SOCKET_DISCONNECTED' | 'INTERACTION_STARTED' | 'INTERACTION_ENDED' | 'STREAMING_STARTED' | 'STREAMING_COMPLETED';
  userId: string;
  sessionId: string;
  timestamp: Date;
  payload: Record<string, any>;
}
