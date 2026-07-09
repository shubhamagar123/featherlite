/**
 * Simulation Configuration Tests
 */

import { SimulationConfigurator } from '../config/simulation.configuration';
import { SimulationTimeframe } from '../types';

describe('SimulationConfigurator', () => {
  let configurator: SimulationConfigurator;

  beforeEach(() => {
    configurator = new SimulationConfigurator();
  });

  describe('createConfiguration', () => {
    it('should create configuration with defaults', () => {
      const config = configurator.createConfiguration(
        SimulationTimeframe.THIRTY_DAYS,
        1,
        true,
        true,
        true
      );

      expect(config.timeframe).toBe(SimulationTimeframe.THIRTY_DAYS);
      expect(config.speedMultiplier).toBe(1);
      expect(config.includeLifeEvents).toBe(true);
      expect(config.includeRandomVariance).toBe(true);
      expect(config.includeContextEvolution).toBe(true);
    });

    it('should support different timeframes', () => {
      const timeframes = [
        SimulationTimeframe.ONE_DAY,
        SimulationTimeframe.SEVEN_DAYS,
        SimulationTimeframe.THIRTY_DAYS,
        SimulationTimeframe.NINETY_DAYS,
        SimulationTimeframe.THREE_HUNDRED_SIXTY_FIVE_DAYS,
      ];

      timeframes.forEach(timeframe => {
        const config = configurator.createConfiguration(timeframe, 1, true, true, true);
        expect(config.timeframe).toBe(timeframe);
      });
    });

    it('should support speed multiplier', () => {
      const config = configurator.createConfiguration(
        SimulationTimeframe.THIRTY_DAYS,
        10,
        true,
        true,
        true
      );

      expect(config.speedMultiplier).toBe(10);
    });

    it('should allow disabling life events', () => {
      const config = configurator.createConfiguration(
        SimulationTimeframe.THIRTY_DAYS,
        1,
        false,
        true,
        true
      );

      expect(config.includeLifeEvents).toBe(false);
    });

    it('should allow disabling random variance', () => {
      const config = configurator.createConfiguration(
        SimulationTimeframe.THIRTY_DAYS,
        1,
        true,
        false,
        true
      );

      expect(config.includeRandomVariance).toBe(false);
    });

    it('should allow disabling context evolution', () => {
      const config = configurator.createConfiguration(
        SimulationTimeframe.THIRTY_DAYS,
        1,
        true,
        true,
        false
      );

      expect(config.includeContextEvolution).toBe(false);
    });
  });

  describe('getDefaultConfiguration', () => {
    it('should return default configuration', () => {
      const config = configurator.getDefaultConfiguration();

      expect(config).toBeTruthy();
      expect(config.speedMultiplier).toBeGreaterThan(0);
      expect(config.timeframe).toBeTruthy();
    });

    it('should have sensible defaults', () => {
      const config = configurator.getDefaultConfiguration();

      expect(config.includeLifeEvents).toBe(true);
      expect(config.includeRandomVariance).toBe(true);
    });
  });

  describe('validateConfiguration', () => {
    it('should validate correct configuration', () => {
      const config = configurator.createConfiguration(
        SimulationTimeframe.THIRTY_DAYS,
        1,
        true,
        true,
        true
      );

      expect(configurator.validateConfiguration(config)).toBe(true);
    });

    it('should reject invalid speed multiplier', () => {
      const config = {
        timeframe: SimulationTimeframe.THIRTY_DAYS,
        speedMultiplier: -1,
        includeLifeEvents: true,
        includeRandomVariance: true,
        includeContextEvolution: true,
      };

      expect(configurator.validateConfiguration(config)).toBe(false);
    });

    it('should reject zero speed multiplier', () => {
      const config = {
        timeframe: SimulationTimeframe.THIRTY_DAYS,
        speedMultiplier: 0,
        includeLifeEvents: true,
        includeRandomVariance: true,
        includeContextEvolution: true,
      };

      expect(configurator.validateConfiguration(config)).toBe(false);
    });
  });

  describe('getTotalDays', () => {
    it('should return 1 for ONE_DAY', () => {
      const config = configurator.createConfiguration(
        SimulationTimeframe.ONE_DAY,
        1,
        true,
        true,
        true
      );

      expect(configurator.getTotalDays(config)).toBe(1);
    });

    it('should return 7 for SEVEN_DAYS', () => {
      const config = configurator.createConfiguration(
        SimulationTimeframe.SEVEN_DAYS,
        1,
        true,
        true,
        true
      );

      expect(configurator.getTotalDays(config)).toBe(7);
    });

    it('should return 30 for THIRTY_DAYS', () => {
      const config = configurator.createConfiguration(
        SimulationTimeframe.THIRTY_DAYS,
        1,
        true,
        true,
        true
      );

      expect(configurator.getTotalDays(config)).toBe(30);
    });

    it('should return 365 for ONE YEAR', () => {
      const config = configurator.createConfiguration(
        SimulationTimeframe.THREE_HUNDRED_SIXTY_FIVE_DAYS,
        1,
        true,
        true,
        true
      );

      expect(configurator.getTotalDays(config)).toBe(365);
    });

    it('should return custom days if provided', () => {
      const config = {
        timeframe: SimulationTimeframe.CUSTOM,
        customDays: 100,
        speedMultiplier: 1,
        includeLifeEvents: true,
        includeRandomVariance: true,
        includeContextEvolution: true,
      };

      expect(configurator.getTotalDays(config)).toBe(100);
    });
  });

  describe('getTimeframeInDays', () => {
    it('should convert timeframes to days', () => {
      expect(configurator.getTimeframeInDays(SimulationTimeframe.ONE_DAY)).toBe(1);
      expect(configurator.getTimeframeInDays(SimulationTimeframe.SEVEN_DAYS)).toBe(7);
      expect(configurator.getTimeframeInDays(SimulationTimeframe.THIRTY_DAYS)).toBe(30);
      expect(configurator.getTimeframeInDays(SimulationTimeframe.NINETY_DAYS)).toBe(90);
      expect(configurator.getTimeframeInDays(SimulationTimeframe.ONE_HUNDRED_EIGHTY_DAYS)).toBe(180);
      expect(configurator.getTimeframeInDays(SimulationTimeframe.THREE_HUNDRED_SIXTY_FIVE_DAYS)).toBe(365);
      expect(configurator.getTimeframeInDays(SimulationTimeframe.TWO_YEARS)).toBe(730);
      expect(configurator.getTimeframeInDays(SimulationTimeframe.FIVE_YEARS)).toBe(1825);
    });
  });

  describe('getSimulationSpeed', () => {
    it('should return speed multiplier', () => {
      const config1 = configurator.createConfiguration(
        SimulationTimeframe.THIRTY_DAYS,
        1,
        true,
        true,
        true
      );

      const config2 = configurator.createConfiguration(
        SimulationTimeframe.THIRTY_DAYS,
        5,
        true,
        true,
        true
      );

      expect(configurator.getSimulationSpeed(config1)).toBe(1);
      expect(configurator.getSimulationSpeed(config2)).toBe(5);
    });
  });

  describe('configuration edge cases', () => {
    it('should handle very large speed multiplier', () => {
      const config = configurator.createConfiguration(
        SimulationTimeframe.THIRTY_DAYS,
        1000,
        true,
        true,
        true
      );

      expect(config.speedMultiplier).toBe(1000);
      expect(configurator.validateConfiguration(config)).toBe(true);
    });

    it('should handle fractional speed multiplier', () => {
      const config = configurator.createConfiguration(
        SimulationTimeframe.THIRTY_DAYS,
        0.5,
        true,
        true,
        true
      );

      expect(config.speedMultiplier).toBe(0.5);
      expect(configurator.validateConfiguration(config)).toBe(true);
    });

    it('should handle long simulations', () => {
      const config = configurator.createConfiguration(
        SimulationTimeframe.FIVE_YEARS,
        1,
        true,
        true,
        true
      );

      expect(configurator.getTotalDays(config)).toBe(1825);
    });
  });
});
