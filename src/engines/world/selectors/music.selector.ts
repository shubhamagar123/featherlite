/**
 * MusicSelector — chooses the music mood from mode + time of day + activity.
 *
 * Activity intent leads (focus music while working, upbeat/romantic on special
 * moments), then the time of day colours the rest of the day.
 */

import { Activity, Music, TimeOfDay, WorldMode } from '../enums/world.enums';
import { IMusicSelector, IMusicSelectorInput } from '../interfaces/selectors.interface';
import { WeightedOption } from '../utils/seed.util';

export class MusicSelector implements IMusicSelector {
  select(input: IMusicSelectorInput): Music {
    const { mode, timeOfDay, activity } = input;
    const rng = input.context.rngFor('music');

    // Special moments get a distinctly celebratory palette.
    if (mode === WorldMode.SPECIAL_MOMENT) {
      return rng.weightedPick<Music>([
        { value: Music.UPBEAT, weight: 55 },
        { value: Music.ROMANTIC, weight: 45 },
      ]);
    }

    // Focused work wants focus music.
    if (activity === Activity.WORKING) {
      return Music.FOCUS;
    }

    // Winding-down activities lean lofi/calm.
    if (activity === Activity.RELAXING || activity === Activity.WATCHING_TV) {
      return rng.weightedPick<Music>([
        { value: Music.LOFI, weight: 60 },
        { value: Music.CALM, weight: 40 },
      ]);
    }

    switch (timeOfDay) {
      case TimeOfDay.MORNING:
        return rng.weightedPick<Music>([
          { value: Music.CALM, weight: 55 },
          { value: Music.UPBEAT, weight: 45 },
        ]);
      case TimeOfDay.NIGHT:
        return rng.weightedPick<Music>([
          { value: Music.AMBIENT, weight: 55 },
          { value: Music.CALM, weight: 45 },
        ]);
      default: {
        const options: WeightedOption<Music>[] = [
          { value: Music.LOFI, weight: 60 },
          { value: Music.CALM, weight: 25 },
          { value: Music.NONE, weight: 15 },
        ];
        return rng.weightedPick(options);
      }
    }
  }
}
