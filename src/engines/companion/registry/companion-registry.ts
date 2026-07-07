/**
 * CompanionRegistry — the source of truth for companion profiles.
 *
 * Profiles are pure data loaded from seed data. The registry supports any number
 * of companions and looks them up by id or by a stable seed key. Adding a new
 * companion is a matter of registering data — no engine code changes. Kai and
 * Kia are simply the first two registered profiles.
 */

import { CompanionProfileDTO } from '../dtos/companion.dtos';
import { ICompanionRegistry } from '../interfaces/companion-registry.interface';

export class CompanionRegistry implements ICompanionRegistry {
  private readonly byId = new Map<string, CompanionProfileDTO>();
  private readonly bySeedKey = new Map<string, CompanionProfileDTO>();

  constructor(profiles: CompanionProfileDTO[] = []) {
    for (const profile of profiles) {
      this.register(profile);
    }
  }

  register(profile: CompanionProfileDTO): void {
    this.byId.set(profile.id, profile);
    this.bySeedKey.set(profile.seedKey, profile);
  }

  has(id: string): boolean {
    return this.byId.has(id);
  }

  get(id: string): CompanionProfileDTO | undefined {
    return this.byId.get(id);
  }

  getBySeedKey(seedKey: string): CompanionProfileDTO | undefined {
    return this.bySeedKey.get(seedKey);
  }

  all(): CompanionProfileDTO[] {
    return Array.from(this.byId.values());
  }

  get size(): number {
    return this.byId.size;
  }
}
