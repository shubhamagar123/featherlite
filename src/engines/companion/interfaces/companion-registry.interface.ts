/**
 * CompanionRegistry contract.
 *
 * The registry is the source of truth for companion *profiles* (identity +
 * schedule + preferences). Profiles come from seed data; the engine supports
 * any number of companions and never hardcodes their names. New companions are
 * added by registering data, not by changing code.
 */

import { CompanionProfileDTO } from '../dtos/companion.dtos';

export interface ICompanionRegistry {
  /** Register (or replace) a companion profile. */
  register(profile: CompanionProfileDTO): void;

  /** Whether a profile exists for the given id. */
  has(id: string): boolean;

  /** Fetch a profile by id, or undefined if unknown. */
  get(id: string): CompanionProfileDTO | undefined;

  /** Fetch a profile by its stable seed key (e.g. "kai"), or undefined. */
  getBySeedKey(seedKey: string): CompanionProfileDTO | undefined;

  /** All registered profiles. */
  all(): CompanionProfileDTO[];

  /** Number of registered profiles. */
  readonly size: number;
}
