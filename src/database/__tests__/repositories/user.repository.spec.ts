import { UserRepository } from '../../repositories/user.repository';
import { prisma } from '../../prisma';

jest.mock('../../prisma', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('UserRepository', () => {
  let repository: UserRepository;

  beforeEach(() => {
    repository = new UserRepository();
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hash',
        firebaseUid: null,
        firstName: 'Test',
        lastName: 'User',
        avatar: null,
        bio: null,
        role: 'USER',
        status: 'ACTIVE',
        preferredLanguage: 'en',
        timezone: 'UTC',
        notificationsEnabled: true,
        emailNotificationsEnabled: true,
        pushNotificationsEnabled: true,
        privacyLevel: 'friends',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
        deletedAt: null,
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      const result = await repository.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          AND: [{ email: 'test@example.com' }, { deletedAt: null }],
        },
      });
    });

    it('should return null if user not found', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await repository.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hash',
        firebaseUid: null,
        firstName: 'Test',
        lastName: 'User',
        avatar: null,
        bio: null,
        role: 'USER',
        status: 'ACTIVE',
        preferredLanguage: 'en',
        timezone: 'UTC',
        notificationsEnabled: true,
        emailNotificationsEnabled: true,
        pushNotificationsEnabled: true,
        privacyLevel: 'friends',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
        deletedAt: null,
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      const result = await repository.findByUsername('testuser');

      expect(result).toEqual(mockUser);
    });
  });

  describe('findByFirebaseUid', () => {
    it('should find user by Firebase UID', async () => {
      const mockUser = { id: '1', firebaseUid: 'firebase123' };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      const result = await repository.findByFirebaseUid('firebase123');

      expect(result).toEqual(mockUser);
    });
  });

  describe('updateLastLogin', () => {
    it('should update lastLoginAt timestamp', async () => {
      const mockUser = { id: '1', lastLoginAt: new Date() };

      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await repository.updateLastLogin('1');

      expect(result).toEqual(mockUser);
      expect(prisma.user.update).toHaveBeenCalled();
    });
  });

  describe('findActive', () => {
    it('should find all active users', async () => {
      const mockUsers = [
        { id: '1', status: 'ACTIVE' },
        { id: '2', status: 'ACTIVE' },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await repository.findActive();

      expect(result).toEqual(mockUsers);
    });
  });

  describe('existsByEmail', () => {
    it('should return true if email exists', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: '1' });

      const result = await repository.existsByEmail('test@example.com');

      expect(result).toBe(true);
    });

    it('should return false if email does not exist', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await repository.existsByEmail('notfound@example.com');

      expect(result).toBe(false);
    });
  });
});
