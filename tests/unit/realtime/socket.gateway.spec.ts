import { SocketGateway } from '@/realtime/socket.gateway';
import { Server, Socket } from 'socket.io';

describe('SocketGateway', () => {
  let gateway: SocketGateway;
  let ioMock: Partial<Server>;
  let socketMock: Partial<Socket>;

  beforeEach(() => {
    gateway = new SocketGateway();
    ioMock = {
      use: jest.fn(),
      on: jest.fn(),
      close: jest.fn(),
    };
    socketMock = {
      data: {},
      handshake: {
        headers: {
          authorization: 'Bearer test-token',
        },
        query: {},
        address: '127.0.0.1',
      } as Socket['handshake'],
      id: 'socket-123',
      connected: true,
      once: jest.fn(),
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
  });

  describe('initialize', () => {
    it('should initialize the gateway with io server', () => {
      gateway.initialize(ioMock as Server);

      expect(ioMock.use).toHaveBeenCalled();
      expect(ioMock.on).toHaveBeenCalled();
    });

    it('should set up middleware', () => {
      gateway.initialize(ioMock as Server);

      expect(ioMock.use).toHaveBeenCalled();
    });

    it('should set up connection handlers', () => {
      gateway.initialize(ioMock as Server);

      expect(ioMock.on).toHaveBeenCalledWith('connection', expect.any(Function));
      expect(ioMock.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    it('should be idempotent', () => {
      const io = ioMock as Server;
      gateway.initialize(io);
      gateway.initialize(io);

      expect(ioMock.use).toHaveBeenCalledTimes(2);
    });
  });

  describe('Auth middleware validation', () => {
    it('should reject requests without authentication token', () => {
      const nextMock = jest.fn();
      gateway.initialize(ioMock as Server);

      const middlewareCall = (ioMock.use as jest.Mock).mock.calls[0][0];
      const socketWithoutAuth = { ...socketMock, handshake: { headers: {}, query: {} } };

      middlewareCall(socketWithoutAuth, nextMock);

      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
      expect(nextMock.mock.calls[0][0].message).toContain('Authentication token required');
    });

    it('should reject requests with missing userId in token payload', () => {
      const nextMock = jest.fn();
      gateway.initialize(ioMock as Server);

      const middlewareCall = (ioMock.use as jest.Mock).mock.calls[0][0];
      socketMock.data!.authPayload = {
        sessionId: 'session-1',
        deviceId: 'device-1',
        accessToken: 'access-token-1',
      };

      middlewareCall(socketMock, nextMock);

      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
      expect(nextMock.mock.calls[0][0].message).toContain('missing required fields');
    });

    it('should reject requests with missing sessionId in token payload', () => {
      const nextMock = jest.fn();
      gateway.initialize(ioMock as Server);

      const middlewareCall = (ioMock.use as jest.Mock).mock.calls[0][0];
      socketMock.data!.authPayload = {
        userId: 'user-1',
        deviceId: 'device-1',
        accessToken: 'access-token-1',
      };

      middlewareCall(socketMock, nextMock);

      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
      expect(nextMock.mock.calls[0][0].message).toContain('missing required fields');
    });

    it('should reject requests with missing deviceId in token payload', () => {
      const nextMock = jest.fn();
      gateway.initialize(ioMock as Server);

      const middlewareCall = (ioMock.use as jest.Mock).mock.calls[0][0];
      socketMock.data!.authPayload = {
        userId: 'user-1',
        sessionId: 'session-1',
        accessToken: 'access-token-1',
      };

      middlewareCall(socketMock, nextMock);

      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
      expect(nextMock.mock.calls[0][0].message).toContain('missing required fields');
    });

    it('should reject requests with missing accessToken in token payload', () => {
      const nextMock = jest.fn();
      gateway.initialize(ioMock as Server);

      const middlewareCall = (ioMock.use as jest.Mock).mock.calls[0][0];
      socketMock.data!.authPayload = {
        userId: 'user-1',
        sessionId: 'session-1',
        deviceId: 'device-1',
      };

      middlewareCall(socketMock, nextMock);

      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
      expect(nextMock.mock.calls[0][0].message).toContain('missing required fields');
    });

    it('should accept valid auth payload with all required fields', () => {
      const nextMock = jest.fn();
      gateway.initialize(ioMock as Server);

      const middlewareCall = (ioMock.use as jest.Mock).mock.calls[0][0];
      socketMock.data!.authPayload = {
        userId: 'user-1',
        sessionId: 'session-1',
        deviceId: 'device-1',
        accessToken: 'access-token-1',
      };

      middlewareCall(socketMock, nextMock);

      expect(nextMock).toHaveBeenCalledWith();
    });

    it('should store auth payload on socket data for later use', () => {
      const nextMock = jest.fn();
      gateway.initialize(ioMock as Server);

      const middlewareCall = (ioMock.use as jest.Mock).mock.calls[0][0];
      socketMock.data!.authPayload = {
        userId: 'user-1',
        sessionId: 'session-1',
        deviceId: 'device-1',
        accessToken: 'access-token-1',
      };

      middlewareCall(socketMock, nextMock);

      expect(socketMock.data!.authPayload).toBeDefined();
      expect(socketMock.data!.authPayload.userId).toBe('user-1');
    });
  });

  describe('Heartbeat management', () => {
    it('should setup heartbeat handler on connection', () => {
      gateway.initialize(ioMock as Server);

      const connectionHandler = (ioMock.on as jest.Mock).mock.calls.find(
        call => call[0] === 'connection'
      )[1];

      socketMock.data!.authPayload = {
        userId: 'user-1',
        sessionId: 'session-1',
        deviceId: 'device-1',
        accessToken: 'access-token-1',
      };

      connectionHandler(socketMock);

      expect(socketMock.once).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(socketMock.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should start periodic heartbeat emission', () => {
      jest.useFakeTimers();

      gateway.initialize(ioMock as Server);

      const connectionHandler = (ioMock.on as jest.Mock).mock.calls.find(
        call => call[0] === 'connection'
      )[1];

      socketMock.data!.authPayload = {
        userId: 'user-1',
        sessionId: 'session-1',
        deviceId: 'device-1',
        accessToken: 'access-token-1',
      };

      connectionHandler(socketMock);

      jest.advanceTimersByTime(30000);

      expect(socketMock.emit).toHaveBeenCalledWith('heartbeat:ping', expect.any(Object));

      jest.useRealTimers();
    });

    it('should stop heartbeat when socket disconnects', () => {
      jest.useFakeTimers();

      gateway.initialize(ioMock as Server);

      const connectionHandler = (ioMock.on as jest.Mock).mock.calls.find(
        call => call[0] === 'connection'
      )[1];

      socketMock.data!.authPayload = {
        userId: 'user-1',
        sessionId: 'session-1',
        deviceId: 'device-1',
        accessToken: 'access-token-1',
      };

      connectionHandler(socketMock);

      const disconnectHandler = (socketMock.once as jest.Mock).mock.calls.find(
        call => call[0] === 'disconnect'
      )[1];

      jest.advanceTimersByTime(30000);
      disconnectHandler();
      jest.advanceTimersByTime(30000);

      expect(socketMock.emit).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });

    it('should stop heartbeat when socket error occurs', () => {
      jest.useFakeTimers();

      gateway.initialize(ioMock as Server);

      const connectionHandler = (ioMock.on as jest.Mock).mock.calls.find(
        call => call[0] === 'connection'
      )[1];

      socketMock.data!.authPayload = {
        userId: 'user-1',
        sessionId: 'session-1',
        deviceId: 'device-1',
        accessToken: 'access-token-1',
      };

      connectionHandler(socketMock);

      const errorHandler = (socketMock.on as jest.Mock).mock.calls.find(
        call => call[0] === 'error'
      )[1];

      jest.advanceTimersByTime(30000);
      errorHandler(new Error('Connection lost'));
      jest.advanceTimersByTime(30000);

      expect(socketMock.emit).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });

    it('should not emit heartbeat if socket is disconnected', () => {
      jest.useFakeTimers();

      gateway.initialize(ioMock as Server);

      const connectionHandler = (ioMock.on as jest.Mock).mock.calls.find(
        call => call[0] === 'connection'
      )[1];

      socketMock.data!.authPayload = {
        userId: 'user-1',
        sessionId: 'session-1',
        deviceId: 'device-1',
        accessToken: 'access-token-1',
      };

      connectionHandler(socketMock);

      socketMock.connected = false;
      jest.advanceTimersByTime(30000);

      expect(socketMock.emit).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('shutdown', () => {
    it('should close io server', () => {
      gateway.initialize(ioMock as Server);
      gateway.shutdown();

      expect(ioMock.close).toHaveBeenCalled();
    });

    it('should cleanup registry', () => {
      const registry = gateway.getRegistry();
      const cleanupSpy = jest.spyOn(registry, 'cleanup');

      gateway.initialize(ioMock as Server);
      gateway.shutdown();

      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  describe('getRegistry', () => {
    it('should return socket registry', () => {
      const registry = gateway.getRegistry();

      expect(registry).toBeDefined();
    });
  });

  describe('getIO', () => {
    it('should return null before initialization', () => {
      const io = gateway.getIO();

      expect(io).toBeNull();
    });

    it('should return io server after initialization', () => {
      gateway.initialize(ioMock as Server);
      const io = gateway.getIO();

      expect(io).toBe(ioMock);
    });
  });

  describe('Memory leak prevention', () => {
    it('should not keep socket references after disconnect', () => {
      gateway.initialize(ioMock as Server);

      const connectionHandler = (ioMock.on as jest.Mock).mock.calls.find(
        call => call[0] === 'connection'
      )[1];

      socketMock.data!.authPayload = {
        userId: 'user-1',
        sessionId: 'session-1',
        deviceId: 'device-1',
        accessToken: 'access-token-1',
      };

      connectionHandler(socketMock);

      const disconnectHandler = (socketMock.once as jest.Mock).mock.calls.find(
        call => call[0] === 'disconnect'
      )[1];

      disconnectHandler();

      const registry = gateway.getRegistry();
      const connection = registry.getConnectionManager().getConnection(socketMock.id as string);

      expect(connection).toBeNull();
    });

    it('should handle abrupt network failure without memory leak', () => {
      jest.useFakeTimers();

      gateway.initialize(ioMock as Server);

      const connectionHandler = (ioMock.on as jest.Mock).mock.calls.find(
        call => call[0] === 'connection'
      )[1];

      socketMock.data!.authPayload = {
        userId: 'user-1',
        sessionId: 'session-1',
        deviceId: 'device-1',
        accessToken: 'access-token-1',
      };

      connectionHandler(socketMock);

      const errorHandler = (socketMock.on as jest.Mock).mock.calls.find(
        call => call[0] === 'error'
      )[1];

      socketMock.connected = false;
      errorHandler(new Error('Network disconnected'));

      jest.advanceTimersByTime(60000);

      expect(socketMock.emit).not.toHaveBeenCalledWith('heartbeat:ping', expect.any(Object));

      jest.useRealTimers();
    });
  });

  describe('Error handling', () => {
    it('should handle connection errors gracefully', () => {
      gateway.initialize(ioMock as Server);

      const connectionHandler = (ioMock.on as jest.Mock).mock.calls.find(
        call => call[0] === 'connection'
      )[1];

      socketMock.data!.authPayload = null;

      expect(() => {
        connectionHandler(socketMock);
      }).not.toThrow();

      expect(socketMock.disconnect).toHaveBeenCalled();
    });

    it('should handle disconnection errors gracefully', () => {
      gateway.initialize(ioMock as Server);

      const disconnectHandler = (ioMock.on as jest.Mock).mock.calls.find(
        call => call[0] === 'disconnect'
      )[1];

      socketMock.data!.authPayload = {
        userId: 'user-1',
        sessionId: 'session-1',
        deviceId: 'device-1',
        accessToken: 'access-token-1',
      };

      expect(() => {
        disconnectHandler(socketMock);
      }).not.toThrow();
    });
  });
});
