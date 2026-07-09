/**
 * Simulation Configuration
 * Configuration builder and defaults for simulations
 */

import {
  SimulationConfiguration,
  SimulationTimeframe,
} from '../types';
import { createLogger } from '@utils/logger';

export class SimulationConfigurator {
  private logger = createLogger(this.constructor.name);

  getTimeframeInDays(timeframe: SimulationTimeframe): number {
    switch (timeframe) {
      case SimulationTimeframe.ONE_DAY:
        return 1;
      case SimulationTimeframe.SEVEN_DAYS:
        return 7;
      case SimulationTimeframe.THIRTY_DAYS:
        return 30;
      case SimulationTimeframe.NINETY_DAYS:
        return 90;
      case SimulationTimeframe.ONE_HUNDRED_EIGHTY_DAYS:
        return 180;
      case SimulationTimeframe.THREE_HUNDRED_SIXTY_FIVE_DAYS:
        return 365;
      case SimulationTimeframe.TWO_YEARS:
        return 730;
      case SimulationTimeframe.FIVE_YEARS:
        return 1825;
      case SimulationTimeframe.CUSTOM:
        return 30;
      default:
        return 30;
    }
  }

  getDefaultConfiguration(timeframe: SimulationTimeframe = SimulationTimeframe.THIRTY_DAYS): SimulationConfiguration {
    return {
      timeframe,
      speedMultiplier: 1,
      includeLifeEvents: true,
      includeRandomVariance: true,
      includeContextEvolution: true,
    };
  }

  createConfiguration(
    timeframe: SimulationTimeframe,
    speedMultiplier: number = 1,
    includeLifeEvents: boolean = true,
    includeRandomVariance: boolean = true,
    includeContextEvolution: boolean = true,
    customDays?: number
  ): SimulationConfiguration {
    const config: SimulationConfiguration = {
      timeframe,
      speedMultiplier,
      includeLifeEvents,
      includeRandomVariance,
      includeContextEvolution,
      customDays: timeframe === SimulationTimeframe.CUSTOM ? customDays : undefined,
    };

    this.logger.info(`Created simulation configuration: ${timeframe} at ${speedMultiplier}x speed`);
    return config;
  }

  validateConfiguration(config: SimulationConfiguration): boolean {
    if (!config.timeframe) {
      this.logger.error('Invalid configuration: missing timeframe');
      return false;
    }

    if (config.speedMultiplier <= 0) {
      this.logger.error('Invalid configuration: speed multiplier must be positive');
      return false;
    }

    if (config.timeframe === SimulationTimeframe.CUSTOM && (!config.customDays || config.customDays <= 0)) {
      this.logger.error('Invalid configuration: custom timeframe requires positive customDays');
      return false;
    }

    return true;
  }

  getTotalDays(config: SimulationConfiguration): number {
    if (config.timeframe === SimulationTimeframe.CUSTOM) {
      return config.customDays || 30;
    }

    return this.getTimeframeInDays(config.timeframe);
  }

  getSimulationSpeed(config: SimulationConfiguration): number {
    const totalDays = this.getTotalDays(config);
    return totalDays * config.speedMultiplier;
  }
}
