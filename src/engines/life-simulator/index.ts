/**
 * Life Simulator Engine (LSE)
 * Comprehensive simulation system for generating realistic virtual users and life journeys
 */

// Types
export * from './types';

// Core Engine
export { LifeSimulatorEngine } from './life.simulator.engine';
export { SimulationClock } from './simulation-clock';

// Configuration
export { SimulationConfigurator } from './config/simulation.configuration';
export { UserProfiles } from './config/user-profiles';

// Behaviors
export { DailyBehaviorGenerator } from './behaviors/daily-behavior';
export { LifeEventGenerator } from './behaviors/life-event-generator';

// Factories
export { ActorFactory } from './factories/actor.factory';

// Metrics
export { SimulationMetricsCalculator } from './metrics/simulation.metrics';

// Reporters
export { SimulationReporter } from './reporters/simulation.reporter';
