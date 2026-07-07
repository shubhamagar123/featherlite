/**
 * Seed loader.
 *
 * Reads the canonical companion seed JSON and exposes it as typed profiles. The
 * JSON is the single source of companion identity/schedule/preferences data;
 * this loader is the only place that bridges raw JSON into the engine's types.
 * Avatars stored as `null` in JSON are normalized to `undefined`.
 */

import { CompanionProfileDTO } from '../dtos/companion.dtos';
import companionsSeed from './companions.seed.json';

interface RawSeedFile {
  companions: Array<CompanionProfileDTO & { identity: { avatar: string | null } }>;
}

/** Load the seeded companion profiles (Kai, Kia, and any future additions). */
export function loadSeedProfiles(): CompanionProfileDTO[] {
  const file = companionsSeed as unknown as RawSeedFile;
  return file.companions.map((raw) => ({
    ...raw,
    identity: {
      ...raw.identity,
      avatar: raw.identity.avatar ?? undefined,
    },
  }));
}
