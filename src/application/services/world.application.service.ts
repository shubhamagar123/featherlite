import { ApplicationServiceBase } from './application.service.base';
import { ApplicationContext } from '../dtos/application.dtos';

/**
 * World Application Service
 * Orchestrates world state and scene operations
 * IMPORTANT: Business logic layer
 */
export class WorldApplicationService extends ApplicationServiceBase {
  constructor() {
    super('WorldApplicationService');
  }

  /**
   * Get current world state
   * Use Case: Fetch active world
   */
  async getCurrentWorld(context: ApplicationContext): Promise<Record<string, unknown>> {
    this.logStart('getCurrentWorld', { userId: context.userId });

    try {
      this.logSuccess('getCurrentWorld', { userId: context.userId });

      return {
        id: 'default',
        name: 'Default World',
        description: '',
        theme: 'light',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      this.logError('getCurrentWorld', error, { userId: context.userId });
      throw error;
    }
  }

  /**
   * Refresh world state
   * Use Case: Update world from engine
   */
  async refreshWorld(context: ApplicationContext): Promise<Record<string, unknown>> {
    this.logStart('refreshWorld', { userId: context.userId });

    try {
      this.logSuccess('refreshWorld', { userId: context.userId });

      return {
        id: 'default',
        name: 'Default World',
        description: '',
        theme: 'light',
        status: 'active',
        refreshedAt: new Date(),
      };
    } catch (error) {
      this.logError('refreshWorld', error, { userId: context.userId });
      throw error;
    }
  }

  /**
   * Get current scene
   * Use Case: Fetch active scene in world
   */
  async getCurrentScene(context: ApplicationContext): Promise<Record<string, unknown>> {
    this.logStart('getCurrentScene', { userId: context.userId });

    try {
      this.logSuccess('getCurrentScene', { userId: context.userId });

      return {
        id: 'scene-default',
        name: 'Main Scene',
        description: '',
        setting: 'default',
        mood: 'neutral',
        activities: [],
        createdAt: new Date(),
      };
    } catch (error) {
      this.logError('getCurrentScene', error, { userId: context.userId });
      throw error;
    }
  }

  /**
   * Get today's world context
   * Use Case: Fetch today-specific world state
   */
  async getTodayWorld(context: ApplicationContext): Promise<Record<string, unknown>> {
    this.logStart('getTodayWorld', { userId: context.userId });

    try {
      this.logSuccess('getTodayWorld', { userId: context.userId });

      return {
        date: new Date().toISOString().split('T')[0],
        weather: 'clear',
        temperature: 20,
        activities: [],
        notes: '',
        updatedAt: new Date(),
      };
    } catch (error) {
      this.logError('getTodayWorld', error, { userId: context.userId });
      throw error;
    }
  }
}
