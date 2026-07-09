/**
 * ExpressionManager — resolves the companion's facial expression.
 *
 * Mood sets the base palette; the current state and world weather nudge it.
 * Deterministic, with a salted tie-break among plausible expressions.
 */

import { Result, IResult } from '@services/types/result.type';
import { Weather, type WeightedOption } from '@engines/shared';
import { CompanionMood, CompanionState, Expression } from '../enums/companion.enums';
import { IExpressionInput, IExpressionManager, IExpressionWeights } from '../interfaces/managers.interface';

const DEFAULT_EXPRESSION_WEIGHTS: IExpressionWeights = {
  moodWeights: {
    [CompanionMood.FOCUSED]: { [Expression.THINKING]: 60, [Expression.NEUTRAL]: 20 },
    [CompanionMood.EXCITED]: { [Expression.LAUGH]: 45, [Expression.SMILE]: 35 },
    [CompanionMood.HAPPY]: { [Expression.SMILE]: 55, [Expression.LAUGH]: 25 },
    [CompanionMood.PLAYFUL]: {
      [Expression.SMILE]: 40,
      [Expression.LAUGH]: 30,
      [Expression.EYE_ROLL]: 15,
    },
    [CompanionMood.CALM]: { [Expression.NEUTRAL]: 40, [Expression.SMILE]: 35 },
    [CompanionMood.LAZY]: { [Expression.SLEEPY]: 40, [Expression.NEUTRAL]: 30 },
    [CompanionMood.THOUGHTFUL]: { [Expression.THINKING]: 45, [Expression.CURIOUS]: 30 },
    [CompanionMood.LOW_ENERGY]: { [Expression.SLEEPY]: 60, [Expression.NEUTRAL]: 25 },
  },
  stateNudges: {
    [CompanionState.READING]: { [Expression.CURIOUS]: 20, [Expression.THINKING]: 15 },
    [CompanionState.WORKING]: { [Expression.THINKING]: 15 },
    [CompanionState.GAMING]: { [Expression.LAUGH]: 15 },
    [CompanionState.IDLE]: { [Expression.LISTENING]: 15, [Expression.NEUTRAL]: 10 },
  },
  weatherNudges: {
    storm: 15,
  },
};

export class ExpressionManager implements IExpressionManager {
  constructor(private readonly weights: IExpressionWeights = DEFAULT_EXPRESSION_WEIGHTS) {}

  resolve(input: IExpressionInput): IResult<Expression> {
    const { context, state, mood } = input;

    // Sleeping is unambiguous.
    if (state === CompanionState.SLEEPING) return Result.success(Expression.SLEEPY);

    const baseWeights = this.weights.moodWeights[mood] ?? {};
    const weights: Partial<Record<Expression, number>> = { ...baseWeights };
    const add = (expr: Expression, amount: number): void => {
      weights[expr] = (weights[expr] ?? 0) + amount;
    };

    // State nudges.
    const stateNudges = this.weights.stateNudges?.[state];
    if (stateNudges) {
      for (const [expr, amount] of Object.entries(stateNudges)) {
        if (amount) add(expr as Expression, amount);
      }
    }

    // A storm outside lends a touch of concern.
    if ((context.world.weather as Weather) === Weather.STORM) {
      add(Expression.CONCERNED, this.weights.weatherNudges?.storm ?? 15);
    }

    const options: WeightedOption<Expression>[] = (Object.keys(weights) as Expression[]).map(
      (expr) => ({ value: expr, weight: weights[expr] ?? 0 })
    );

    const expression = context.rngFor('expression').weightedPick(options);
    return Result.success(expression);
  }
}
