/**
 * Authentication Engine Tests
 */

import { AuthenticationEngine } from '../authentication.engine';
import { AuthenticationProvider, AuthenticationStatus, UserRole, PermissionType } from '../types';

describe('AuthenticationEngine', () => {
  let engine: AuthenticationEngine;

  beforeEach(() => {
    engine = new AuthenticationEngine();
  });

  describe('authentication', () => {
    it('should authenticate with anonymous provider', async () => {
      const request = {
        provider: AuthenticationProvider.ANONYMOUS,
        credentials: {},
        deviceInfo: {
          name: 'test-device',
          type: 'WEB' as const,
          os: 'Linux',
          osVersion: '5.10',
        },
      };

      const response = await engine.authenticate(request);

      expect(response.status).toBe(AuthenticationStatus.AUTHENTICATED);
      expect(response.user).toBeTruthy();
      expect(response.user?.isAnonymous).toBe(true);
      expect(response.session).toBeTruthy();
      expect(response.accessToken).toBeTruthy();
      expect(response.refreshToken).toBeTruthy();
    });

    it('should authenticate with email provider', async () => {
      const request = {
        provider: AuthenticationProvider.EMAIL,
        credentials: {
          email: 'test@example.com',
          password: 'password123',
        },
        deviceInfo: {
          name: 'test-device',
          type: 'WEB' as const,
          os: 'Linux',
          osVersion: '5.10',
        },
        metadata: {
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        },
      };

      const response = await engine.authenticate(request);

      expect(response.status).toBe(AuthenticationStatus.AUTHENTICATED);
      expect(response.user?.email).toBe('test@example.com');
      expect(response.user?.roles).toContain(UserRole.USER);
    });

    it('should create session with access and refresh tokens', async () => {
      const request = {
        provider: AuthenticationProvider.ANONYMOUS,
        credentials: {},
        deviceInfo: {
          name: 'test-device',
          type: 'MOBILE' as const,
          os: 'iOS',
          osVersion: '15.0',
          appVersion: '1.0.0',
        },
      };

      const response = await engine.authenticate(request);

      expect(response.session).toBeTruthy();
      expect(response.session?.accessToken.value).toBeTruthy();
      expect(response.session?.refreshToken.value).toBeTruthy();
      expect(response.session?.status).toBe('ACTIVE');
    });

    it('should fail with unsupported provider', async () => {
      const request = {
        provider: 'UNSUPPORTED' as any,
        credentials: {},
        deviceInfo: {
          name: 'test-device',
          type: 'WEB' as const,
          os: 'Linux',
          osVersion: '5.10',
        },
      };

      const response = await engine.authenticate(request);

      expect(response.status).toBe(AuthenticationStatus.FAILED);
      expect(response.error).toBeTruthy();
    });
  });

  describe('session management', () => {
    it('should retrieve user sessions', async () => {
      const request1 = {
        provider: AuthenticationProvider.EMAIL,
        credentials: { email: 'user@example.com', password: 'pass' },
        deviceInfo: {
          name: 'device1',
          type: 'WEB' as const,
          os: 'Linux',
          osVersion: '5.10',
        },
      };

      const request2 = {
        provider: AuthenticationProvider.EMAIL,
        credentials: { email: 'user@example.com', password: 'pass' },
        deviceInfo: {
          name: 'device2',
          type: 'MOBILE' as const,
          os: 'iOS',
          osVersion: '15.0',
        },
      };

      const response1 = await engine.authenticate(request1);
      const response2 = await engine.authenticate(request2);

      expect(response1.user).toBeTruthy();
      expect(response2.user).toBeTruthy();

      const sessions = await engine.getUserSessions(response1.user!.id);

      expect(sessions.length).toBeGreaterThanOrEqual(1);
      expect(sessions.every(s => s.userId === response1.user!.id)).toBe(true);
    });

    it('should logout user from specific session', async () => {
      const request = {
        provider: AuthenticationProvider.ANONYMOUS,
        credentials: {},
        deviceInfo: {
          name: 'test-device',
          type: 'WEB' as const,
          os: 'Linux',
          osVersion: '5.10',
        },
      };

      const response = await engine.authenticate(request);
      const sessionId = response.session!.id;

      const logoutResult = await engine.logout(sessionId);

      expect(logoutResult).toBe(true);
    });

    it('should logout all devices', async () => {
      const authResponse = await engine.authenticate({
        provider: AuthenticationProvider.EMAIL,
        credentials: { email: 'test@example.com', password: 'pass' },
        deviceInfo: {
          name: 'device1',
          type: 'WEB' as const,
          os: 'Linux',
          osVersion: '5.10',
        },
      });

      const userId = authResponse.user!.id;
      const revokedCount = await engine.logoutAllDevices(userId);

      expect(revokedCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('device management', () => {
    it('should retrieve user devices', async () => {
      const authResponse = await engine.authenticate({
        provider: AuthenticationProvider.ANONYMOUS,
        credentials: {},
        deviceInfo: {
          name: 'my-device',
          type: 'WEB' as const,
          os: 'Linux',
          osVersion: '5.10',
        },
      });

      const userId = authResponse.user!.id;
      const devices = await engine.getUserDevices(userId);

      expect(devices.length).toBeGreaterThan(0);
      expect(devices[0].userId).toBe(userId);
    });

    it('should remove device', async () => {
      const authResponse = await engine.authenticate({
        provider: AuthenticationProvider.ANONYMOUS,
        credentials: {},
        deviceInfo: {
          name: 'device-to-remove',
          type: 'MOBILE' as const,
          os: 'Android',
          osVersion: '11',
        },
      });

      const deviceId = authResponse.session!.deviceId;
      const removed = await engine.removeDevice(deviceId);

      expect(removed).toBe(true);
    });
  });

  describe('token refresh', () => {
    it('should refresh session tokens', async () => {
      const authResponse = await engine.authenticate({
        provider: AuthenticationProvider.ANONYMOUS,
        credentials: {},
        deviceInfo: {
          name: 'test',
          type: 'WEB' as const,
          os: 'Linux',
          osVersion: '5.10',
        },
      });

      const refreshResponse = await engine.refreshSession(
        authResponse.session!.id,
        authResponse.refreshToken!,
        authResponse.session!.correlationId
      );

      expect(refreshResponse.status).toBe(AuthenticationStatus.AUTHENTICATED);
      expect(refreshResponse.accessToken).toBeTruthy();
      expect(refreshResponse.accessToken).not.toBe(authResponse.accessToken);
    });
  });

  describe('user retrieval', () => {
    it('should get user by ID', async () => {
      const authResponse = await engine.authenticate({
        provider: AuthenticationProvider.EMAIL,
        credentials: { email: 'fetch@example.com', password: 'pass' },
        deviceInfo: {
          name: 'device',
          type: 'WEB' as const,
          os: 'Linux',
          osVersion: '5.10',
        },
      });

      const user = await engine.getUser(authResponse.user!.id);

      expect(user).toBeTruthy();
      expect(user?.email).toBe('fetch@example.com');
    });

    it('should return null for non-existent user', async () => {
      const user = await engine.getUser('non-existent-id');

      expect(user).toBeNull();
    });
  });
});
