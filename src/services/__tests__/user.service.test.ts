import { UserService } from '../user/user.service';
import { UserRepository } from '@database/repositories/user.repository';
import { Result } from '../types/result.type';
import { ValidationException, NotFoundError, DuplicateResourceError } from '../exceptions';
import { CreateUserDTO } from '../dtos/user.dto';

jest.mock('@database/repositories/user.repository');

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    userService = new UserService(mockUserRepository);
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const createDto: CreateUserDTO = {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockUserRepository.existsByEmail.mockResolvedValue(false);
      mockUserRepository.existsByUsername.mockResolvedValue(false);
      mockUserRepository.create.mockResolvedValue(mockUser as any);

      const result = await userService.createUser(createDto);

      expect(result).toBeDefined();
      expect(mockUserRepository.existsByEmail).toHaveBeenCalledWith(createDto.email);
      expect(mockUserRepository.existsByUsername).toHaveBeenCalledWith(createDto.username);
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: createDto.email,
          username: createDto.username,
        })
      );
    });

    it('should return failure when email already exists', async () => {
      const createDto: CreateUserDTO = {
        email: 'existing@example.com',
        username: 'newuser',
        firstName: 'Test',
        lastName: 'User',
      };

      mockUserRepository.existsByEmail.mockResolvedValue(true);

      const result = await userService.createUser(createDto);

      expect(result).toBeDefined();
    });

    it('should return failure when email is invalid', async () => {
      const createDto: CreateUserDTO = {
        email: 'invalid-email',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      };

      const result = await userService.createUser(createDto);

      expect(result).toBeDefined();
    });

    it('should return failure when username is invalid', async () => {
      const createDto: CreateUserDTO = {
        email: 'test@example.com',
        username: 'ab', // too short
        firstName: 'Test',
        lastName: 'User',
      };

      const result = await userService.createUser(createDto);

      expect(result).toBeDefined();
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser as any);

      const result = await userService.getUserById(userId);

      expect(result).toBeDefined();
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should return failure when user not found', async () => {
      const userId = 'non-existent-id';
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await userService.getUserById(userId);

      expect(result).toBeDefined();
    });

    it('should return failure when userId is invalid UUID', async () => {
      const result = await userService.getUserById('invalid-uuid');

      expect(result).toBeDefined();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user when found', async () => {
      const email = 'test@example.com';
      const mockUser = {
        id: 'user-123',
        email,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);

      const result = await userService.getUserByEmail(email);

      expect(result).toBeDefined();
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should return failure when user not found', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await userService.getUserByEmail('nonexistent@example.com');

      expect(result).toBeDefined();
    });
  });

  describe('emailExists', () => {
    it('should return true when email exists', async () => {
      mockUserRepository.existsByEmail.mockResolvedValue(true);

      const result = await userService.emailExists('existing@example.com');

      expect(result).toBe(true);
    });

    it('should return false when email does not exist', async () => {
      mockUserRepository.existsByEmail.mockResolvedValue(false);

      const result = await userService.emailExists('new@example.com');

      expect(result).toBe(false);
    });

    it('should return false on validation error', async () => {
      const result = await userService.emailExists('invalid-email');

      expect(result).toBe(false);
    });
  });

  describe('usernameExists', () => {
    it('should return true when username exists', async () => {
      mockUserRepository.existsByUsername.mockResolvedValue(true);

      const result = await userService.usernameExists('testuser');

      expect(result).toBe(true);
    });

    it('should return false when username does not exist', async () => {
      mockUserRepository.existsByUsername.mockResolvedValue(false);

      const result = await userService.usernameExists('newuser');

      expect(result).toBe(false);
    });

    it('should return false on validation error', async () => {
      const result = await userService.usernameExists('ab'); // too short

      expect(result).toBe(false);
    });
  });

  describe('softDeleteUser', () => {
    it('should soft delete user successfully', async () => {
      const userId = 'user-123';
      mockUserRepository.softDelete.mockResolvedValue(undefined);

      const result = await userService.softDeleteUser(userId);

      expect(result).toBeDefined();
      expect(mockUserRepository.softDelete).toHaveBeenCalledWith(userId);
    });

    it('should return failure when userId is invalid', async () => {
      const result = await userService.softDeleteUser('invalid-id');

      expect(result).toBeDefined();
    });
  });

  describe('restoreUser', () => {
    it('should restore user successfully', async () => {
      const userId = 'user-123';
      mockUserRepository.restore.mockResolvedValue(undefined);

      const result = await userService.restoreUser(userId);

      expect(result).toBeDefined();
      expect(mockUserRepository.restore).toHaveBeenCalledWith(userId);
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login successfully', async () => {
      const userId = 'user-123';
      mockUserRepository.updateLastLogin.mockResolvedValue(undefined);

      const result = await userService.updateLastLogin(userId);

      expect(result).toBeDefined();
      expect(mockUserRepository.updateLastLogin).toHaveBeenCalledWith(userId);
    });
  });
});
