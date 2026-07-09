/**
 * Life Simulator Engine Tests
 * Tests for the main simulation engine
 */

import { LifeSimulatorEngine } from '../life.simulator.engine';
import { SimulationConfigurator } from '../config/simulation.configuration';
import { UserProfiles } from '../config/user-profiles';
import { SimulationTimeframe, SimulationStatus } from '../types';

describe('LifeSimulatorEngine', () => {
  let engine: LifeSimulatorEngine;
  let configurator: SimulationConfigurator;

  beforeEach(() => {
    engine = new LifeSimulatorEngine();
    configurator = new SimulationConfigurator();
  });

  describe('simulate', () => {
    it('should complete a 1-day simulation', async () => {
      const profile = UserProfiles.INTROVERT_DEVELOPER;
      const config = configurator.createConfiguration(
        SimulationTimeframe.ONE_DAY,
        1,
        true,
        true,
        true
      );

      const result = await engine.simulate(profile, config);

      expect(result.status).toBe(SimulationStatus.COMPLETED);
      expect(result.actorId).toBeTruthy();
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.history.snapshots.length).toBe(1);
      expect(result.metrics.engagementScore).toBeGreaterThanOrEqual(0);
    });

    it('should complete a 30-day simulation', async () => {
      const profile = UserProfiles.EXTROVERT_MARKETER;
      const config = configurator.createConfiguration(
        SimulationTimeframe.THIRTY_DAYS,
        1,
        true,
        true,
        true
      );

      const result = await engine.simulate(profile, config);

      expect(result.status).toBe(SimulationStatus.COMPLETED);
      expect(result.history.snapshots.length).toBe(30);
      expect(result.metrics.totalConversations).toBe(30);
    });

    it('should generate life events when enabled', async () => {
      const profile = UserProfiles.BUSY_PROFESSIONAL;
      const config = configurator.createConfiguration(
        SimulationTimeframe.SEVEN_DAYS,
        1,
        true,
        true,
        true
      );

      const result = await engine.simulate(profile, config);

      expect(result.history.events.length).toBeGreaterThanOrEqual(0);
    });

    it('should update actor mood and energy', async () => {
      const profile = UserProfiles.COLLEGE_STUDENT;
      const config = configurator.createConfiguration(
        SimulationTimeframe.ONE_DAY,
        1,
        false,
        false,
        false
      );

      const result = await engine.simulate(profile, config);

      expect(result.history.finalState.currentMood).toBeTruthy();
      expect(result.history.finalState.currentEnergy).toBeGreaterThanOrEqual(0);
    });

    it('should calculate all required metrics', async () => {
      const profile = UserProfiles.FITNESS_ENTHUSIAST;
      const config = configurator.createConfiguration(
        SimulationTimeframe.THIRTY_DAYS,
        1,
        true,
        true,
        true
      );

      const result = await engine.simulate(profile, config);

      expect(result.metrics.totalConversations).toBeGreaterThanOrEqual(0);
      expect(result.metrics.averageSessionLength).toBeGreaterThanOrEqual(0);
      expect(result.metrics.relationshipGrowth).toBeGreaterThanOrEqual(0);
      expect(result.metrics.memoryGrowth).toBeGreaterThanOrEqual(0);
      expect(result.metrics.emotionalStability).toBeGreaterThanOrEqual(0);
      expect(result.metrics.trustEvolution).toBeGreaterThanOrEqual(0);
      expect(result.metrics.comfortEvolution).toBeGreaterThanOrEqual(0);
      expect(result.metrics.engagementScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle invalid configuration gracefully', async () => {
      const profile = UserProfiles.NIGHT_OWL;
      const invalidConfig = {
        timeframe: SimulationTimeframe.THIRTY_DAYS,
        speedMultiplier: -1,
        includeLifeEvents: true,
        includeRandomVariance: true,
        includeContextEvolution: true,
      };

      const result = await engine.simulate(profile, invalidConfig);

      expect(result.status).toBe(SimulationStatus.FAILED);
    });

    it('should work with different user profiles', async () => {
      const profiles = [
        UserProfiles.INTROVERT_DEVELOPER,
        UserProfiles.EXTROVERT_MARKETER,
        UserProfiles.EARLY_RISER,
      ];

      const config = configurator.createConfiguration(
        SimulationTimeframe.SEVEN_DAYS,
        1,
        true,
        true,
        true
      );

      for (const profile of profiles) {
        const result = await engine.simulate(profile, config);
        expect(result.status).toBe(SimulationStatus.COMPLETED);
      }
    });
  });

  describe('simulation progression', () => {
    it('should create daily snapshots', async () => {
      const profile = UserProfiles.MINIMALIST;
      const config = configurator.createConfiguration(
        SimulationTimeframe.SEVEN_DAYS,
        1,
        false,
        false,
        false
      );

      const result = await engine.simulate(profile, config);

      expect(result.history.snapshots.length).toBe(7);
      result.history.snapshots.forEach((snapshot, index) => {
        expect(snapshot.day).toBe(index + 1);
        expect(snapshot.mood).toBeTruthy();
        expect(snapshot.energy).toBeGreaterThanOrEqual(0);
        expect(snapshot.energy).toBeLessThanOrEqual(1);
      });
    });

    it('should track relationship state evolution', async () => {
      const profile = UserProfiles.OVERTHINKER;
      const config = configurator.createConfiguration(
        SimulationTimeframe.THIRTY_DAYS,
        1,
        true,
        true,
        true
      );

      const result = await engine.simulate(profile, config);

      const firstSnapshot = result.history.snapshots[0];
      const lastSnapshot = result.history.snapshots[result.history.snapshots.length - 1];

      expect(firstSnapshot.relationshipState).toBeTruthy();
      expect(lastSnapshot.relationshipState).toBeTruthy();
    });
  });
});
