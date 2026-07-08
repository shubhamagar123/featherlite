import { IResult, Result } from '@services/types/result.type';
import { ILLMProvider } from '../interfaces/llm-provider.interface';
import { LLMProviderHealth } from '../dtos/llm-gateway.dtos';
import { LLMProviderType } from '../enums/llm-gateway.enums';

export class HealthChecker {
  async checkAll(providers: ILLMProvider[]): Promise<IResult<LLMProviderHealth[]>> {
    const healths: LLMProviderHealth[] = [];
    for (const provider of providers) {
      const health = await provider.healthCheck();
      if (health.isSuccess && health.value) {
        healths.push(health.value);
      }
    }
    return Result.success(healths);
  }

  async check(
    provider: LLMProviderType,
    providers: ILLMProvider[]
  ): Promise<IResult<LLMProviderHealth[]>> {
    const target = providers.find((p) => p.type === provider);
    if (!target) {
      return Result.failure(new Error(`Provider ${provider} not registered`));
    }
    const health = await target.healthCheck();
    if (!health.isSuccess || !health.value) {
      return Result.failure(health.error ?? new Error('Health check failed'));
    }
    return Result.success([health.value]);
  }
}
