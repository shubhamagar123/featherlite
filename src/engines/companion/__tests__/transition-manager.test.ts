import { CompanionTransitionManager } from '../transitions/companion-transition-manager';
import { CompanionState } from '../enums/companion.enums';

describe('CompanionTransitionManager', () => {
  const manager = new CompanionTransitionManager();

  it('reports a direct transition unchanged', () => {
    const result = manager.plan(CompanionState.IDLE, CompanionState.WORKING);
    expect(result.direct).toBe(true);
    expect(result.next).toBe(CompanionState.WORKING);
    expect(result.path).toEqual([CompanionState.IDLE, CompanionState.WORKING]);
  });

  it('steps one legal hop toward an unreachable target', () => {
    const result = manager.plan(CompanionState.COOKING, CompanionState.DRIVING);
    expect(result.direct).toBe(false);
    expect(result.next).toBe(CompanionState.WALKING);
    expect(result.path).toEqual([
      CompanionState.COOKING,
      CompanionState.WALKING,
      CompanionState.DRIVING,
    ]);
  });

  it('is a no-op when already in the target state', () => {
    const result = manager.plan(CompanionState.GAMING, CompanionState.GAMING);
    expect(result.direct).toBe(true);
    expect(result.next).toBe(CompanionState.GAMING);
    expect(result.path).toEqual([CompanionState.GAMING]);
  });
});
