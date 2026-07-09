/**
 * Session Manager Tests
 */

import { SessionManager } from '../managers/session.manager';
import { SessionRepository } from '../repositories/session.repository';
import { TokenManager } from '../managers/token.manager';
import { SessionStatus, AuthenticationProvider, UserRole, PermissionType } from '../types';

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let sessionRepo: SessionRepository;
  let tokenManager: TokenManager;

  beforeEach(async () => {
    sessionRepo = new SessionRepository();
    tokenManager = new TokenManager();
    sessionManager = new SessionManager(sessionRepo, tokenManager);
  });

  describe('session creation', () => {
    it('should create session', async () => {
      const accessToken = await tokenManager.generateAccessToken(
        'user-123',
        'session-123',
        'device-123',
        AuthenticationProvider.ANONYMOUS,
        [UserRole.USER],
        [PermissionType.READ],
        'correlation-123'
      );

      const refreshToken = await tokenManager.generateRefreshToken(
        'user-123',
        'session-123',
        'device-123',
        AuthenticationProvider.ANONYMOUS,
        '127.0.0.1',
        'test-agent',
        'correlation-123'
      );

      const session = await sessionManager.createSession(
        'user-123',
        'device-123',
        accessToken,
        refreshToken,
        {
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          deviceName: 'test-device',
          os: 'Linux',
          browser: 'Chrome',
        },
        'correlation-123'
      );

      expect(session).toBeTruthy();
      expect(session.userId).toBe('user-123');
      expect(session.status).toBe(SessionStatus.ACTIVE);
    });
  });

  describe('session retrieval', () => {
    it('should get session by ID', async () => {
      const accessToken = await tokenManager.generateAccessToken(
        'user-123',
        'session-123',
        'device-123',
        AuthenticationProvider.ANONYMOUS,
        [UserRole.USER],
        [PermissionType.READ],
        'correlation-123'
      );

      const refreshToken = await tokenManager.generateRefreshToken(
        'user-123',
        'session-123',
        'device-123',
        AuthenticationProvider.ANONYMOUS,
        '127.0.0.1',
        'test-agent',
        'correlation-123'
      );

      const created = await sessionManager.createSession(
        'user-123',
        'device-123',
        accessToken,
        refreshToken,
        {
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          deviceName: 'test',
          os: 'Linux',
          browser: 'Chrome',
        },
        'correlation-123'
      );

      const retrieved = await sessionManager.getSession(created.id);

      expect(retrieved).toBeTruthy();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should get user sessions', async () => {
      const userId = 'user-456';

      for (let i = 0; i < 3; i++) {
        const accessToken = await tokenManager.generateAccessToken(
          userId,
          `session-${i}`,
          `device-${i}`,
          AuthenticationProvider.ANONYMOUS,
          [UserRole.USER],
          [PermissionType.READ],
          `correlation-${i}`
        );

        const refreshToken = await tokenManager.generateRefreshToken(
          userId,
          `session-${i}`,
          `device-${i}`,
          AuthenticationProvider.ANONYMOUS,
          '127.0.0.1',
          'test-agent',
          `correlation-${i}`
        );

        await sessionManager.createSession(
          userId,
          `device-${i}`,
          accessToken,
          refreshToken,
          {
            ipAddress: '127.0.0.1',
            userAgent: 'test-agent',
            deviceName: `device-${i}`,
            os: 'Linux',
            browser: 'Chrome',
          },
          `correlation-${i}`
        );
      }

      const sessions = await sessionManager.getUserSessions(userId);

      expect(sessions.length).toBeGreaterThanOrEqual(3);
      expect(sessions.every(s => s.userId === userId)).toBe(true);
    });
  });

  describe('session activity', () => {
    it('should update session activity timestamp', async () => {
      const accessToken = await tokenManager.generateAccessToken(
        'user-789',
        'session-789',
        'device-789',
        AuthenticationProvider.ANONYMOUS,
        [UserRole.USER],
        [PermissionType.READ],
        'correlation-789'
      );

      const refreshToken = await tokenManager.generateRefreshToken(
        'user-789',
        'session-789',
        'device-789',
        AuthenticationProvider.ANONYMOUS,
        '127.0.0.1',
        'test-agent',
        'correlation-789'
      );

      const session = await sessionManager.createSession(
        'user-789',
        'device-789',
        accessToken,
        refreshToken,
        {
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          deviceName: 'test',
          os: 'Linux',
          browser: 'Chrome',
        },
        'correlation-789'
      );

      const lastActiveBefore = session.lastActiveAt;

      await new Promise(resolve => setTimeout(resolve, 100));

      const updated = await sessionManager.updateSessionActivity(session.id);

      expect(updated).toBeTruthy();
      expect(updated!.lastActiveAt.getTime()).toBeGreaterThan(lastActiveBefore.getTime());
    });
  });

  describe('session revocation', () => {
    it('should revoke session', async () => {
      const accessToken = await tokenManager.generateAccessToken(
        'user-rev',
        'session-rev',
        'device-rev',
        AuthenticationProvider.ANONYMOUS,
        [UserRole.USER],
        [PermissionType.READ],
        'correlation-rev'
      );

      const refreshToken = await tokenManager.generateRefreshToken(
        'user-rev',
        'session-rev',
        'device-rev',
        AuthenticationProvider.ANONYMOUS,
        '127.0.0.1',
        'test-agent',
        'correlation-rev'
      );

      const session = await sessionManager.createSession(
        'user-rev',
        'device-rev',
        accessToken,
        refreshToken,
        {
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          deviceName: 'test',
          os: 'Linux',
          browser: 'Chrome',
        },
        'correlation-rev'
      );

      await sessionManager.revokeSession(session.id);

      const revoked = await sessionManager.getSession(session.id);

      expect(revoked).toBeNull();
    });
  });
});
