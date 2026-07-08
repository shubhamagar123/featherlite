/**
 * SessionManager — handles interaction session lifecycle.
 */

import { IResult, Result } from '@services/types/result.type';
import { ISessionManager } from '../interfaces/interaction-manager.interface';

export class SessionManager implements ISessionManager {
  async createSession(_userId: string, _companionId: string): Promise<IResult<string>> {
    return Result.failure(new Error('Not implemented'));
  }

  async addInteractionToSession(_sessionId: string, _interaction: object): Promise<IResult<void>> {
    return Result.success(undefined);
  }

  async endSession(_sessionId: string): Promise<IResult<void>> {
    return Result.success(undefined);
  }

  async getSession(_sessionId: string): Promise<IResult<object>> {
    return Result.failure(new Error('Not implemented'));
  }
}
