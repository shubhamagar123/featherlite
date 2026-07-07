/**
 * UserContextProvider — the single source for the user slice.
 *
 * Required: a conversation without a user cannot be built, so a genuine lookup
 * failure aborts the whole assembly.
 */

import { IResult, Result } from '@services/types/result.type';
import { IUserService } from '@services/user/user.service.interface';
import { ContextRequest, UserContextSlice } from '../dtos/conversation-context.dto';
import { ContextProviderKey, IContextProvider } from '../interfaces/context-provider.interface';

export class UserContextProvider implements IContextProvider<UserContextSlice> {
  readonly key: ContextProviderKey = 'user';
  readonly required = true;

  constructor(private readonly userService: IUserService) {}

  emptySlice(): UserContextSlice {
    return { available: false };
  }

  async provide(request: ContextRequest): Promise<IResult<UserContextSlice>> {
    const result = await this.userService.getUserById(request.userId);
    if (!result.isSuccess || !result.value) {
      return Result.failure(result.error ?? new Error('User not found'));
    }

    const user = result.value;
    const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();

    return Result.success({
      available: true,
      id: user.id,
      username: user.username,
      displayName: displayName || user.username,
      role: user.role,
      timezone: user.timezone,
      preferredLanguage: user.preferredLanguage,
    });
  }
}
