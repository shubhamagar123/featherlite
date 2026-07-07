import {
  Activity,
  AmbientSound,
  KitchenState,
  Lighting,
  Music,
  Outfit,
  Scene,
  Season,
  TimeOfDay,
  Toggle,
  Weather,
  WorldMode,
} from '../enums/world.enums';
import { WorldContext } from '../context/world-context';
import { FixedClock } from '../utils/clock.util';
import { WeatherSelector } from '../selectors/weather.selector';
import { SceneSelector } from '../selectors/scene.selector';
import { ActivitySelector } from '../selectors/activity.selector';
import { OutfitSelector } from '../selectors/outfit.selector';
import { LightingSelector } from '../selectors/lighting.selector';
import { AmbientSelector } from '../selectors/ambient.selector';
import { MusicSelector } from '../selectors/music.selector';
import { HouseStateSelector } from '../selectors/house-state.selector';

const INDOOR = new Set<Scene>([Scene.LIVING_ROOM, Scene.KITCHEN, Scene.STUDY, Scene.DRIVE]);

function ctx(companionId = 'companion-x'): WorldContext {
  const date = new Date('2026-07-07T10:00:00Z');
  return WorldContext.create(
    { companionId, referenceDate: date, timezone: 'UTC' },
    new FixedClock(date)
  );
}

describe('WeatherSelector', () => {
  const selector = new WeatherSelector();

  it('is deterministic', () => {
    const c = ctx();
    expect(selector.select({ context: c, season: Season.SUMMER })).toBe(
      selector.select({ context: c, season: Season.SUMMER })
    );
  });

  it('always returns a valid weather value', () => {
    const values = Object.values(Weather);
    for (let i = 0; i < 100; i++) {
      const result = selector.select({ context: ctx(`c-${i}`), season: Season.WINTER });
      expect(values).toContain(result);
    }
  });
});

describe('SceneSelector', () => {
  const selector = new SceneSelector();

  it('forces an indoor scene during a storm', () => {
    for (let i = 0; i < 50; i++) {
      const scene = selector.select({
        context: ctx(`storm-${i}`),
        mode: WorldMode.DAILY_LIFE,
        timeOfDay: TimeOfDay.AFTERNOON,
        weather: Weather.STORM,
      });
      expect(INDOOR.has(scene)).toBe(true);
    }
  });

  it('strongly prefers indoor scenes at night', () => {
    let indoor = 0;
    const total = 100;
    for (let i = 0; i < total; i++) {
      const scene = selector.select({
        context: ctx(`night-${i}`),
        mode: WorldMode.HOME,
        timeOfDay: TimeOfDay.NIGHT,
        weather: Weather.CLOUDY,
      });
      if (INDOOR.has(scene)) indoor++;
    }
    expect(indoor).toBeGreaterThan(total * 0.8);
  });

  it('is deterministic', () => {
    const c = ctx();
    const input = {
      context: c,
      mode: WorldMode.HOME,
      timeOfDay: TimeOfDay.MORNING,
      weather: Weather.SUNNY,
    };
    expect(selector.select(input)).toBe(selector.select(input));
  });
});

describe('ActivitySelector', () => {
  const selector = new ActivitySelector();

  it('only yields activities plausible for the scene', () => {
    const kitchenActivities = new Set([Activity.COOKING, Activity.COFFEE, Activity.CLEANING]);
    for (let i = 0; i < 60; i++) {
      const activity = selector.select({
        context: ctx(`k-${i}`),
        mode: WorldMode.HOME,
        timeOfDay: TimeOfDay.EVENING,
        scene: Scene.KITCHEN,
      });
      expect(kitchenActivities.has(activity)).toBe(true);
    }
  });
});

describe('OutfitSelector', () => {
  const selector = new OutfitSelector();

  it('always wears gym clothes for gym activity', () => {
    const outfit = selector.select({
      context: ctx(),
      mode: WorldMode.DAILY_LIFE,
      scene: Scene.PARK,
      activity: Activity.GYM,
    });
    expect(outfit).toBe(Outfit.GYM);
  });

  it('wears festival attire on special moments', () => {
    const outfit = selector.select({
      context: ctx(),
      mode: WorldMode.SPECIAL_MOMENT,
      scene: Scene.CAFE,
      activity: Activity.COFFEE,
    });
    expect(outfit).toBe(Outfit.FESTIVAL);
  });

  it('wears home wear when working from home but office wear when out', () => {
    const home = selector.select({
      context: ctx(),
      mode: WorldMode.HOME,
      scene: Scene.STUDY,
      activity: Activity.WORKING,
    });
    const out = selector.select({
      context: ctx(),
      mode: WorldMode.DAILY_LIFE,
      scene: Scene.CAFE,
      activity: Activity.WORKING,
    });
    expect(home).toBe(Outfit.HOME_WEAR);
    expect(out).toBe(Outfit.OFFICE);
  });
});

describe('LightingSelector', () => {
  const selector = new LightingSelector();

  it('uses rainy lighting for wet daytime weather', () => {
    const lighting = selector.select({
      context: ctx(),
      timeOfDay: TimeOfDay.AFTERNOON,
      weather: Weather.RAIN,
    });
    expect(lighting).toBe(Lighting.RAINY);
  });

  it('uses golden hour in the evening', () => {
    const lighting = selector.select({
      context: ctx(),
      timeOfDay: TimeOfDay.EVENING,
      weather: Weather.SUNNY,
    });
    expect(lighting).toBe(Lighting.GOLDEN_HOUR);
  });

  it('uses a night lamp at night even in the rain', () => {
    const lighting = selector.select({
      context: ctx(),
      timeOfDay: TimeOfDay.NIGHT,
      weather: Weather.RAIN,
    });
    expect(lighting).toBe(Lighting.NIGHT_LAMP);
  });
});

describe('AmbientSelector', () => {
  const selector = new AmbientSelector();

  it('plays rain sound whenever it rains', () => {
    const sound = selector.select({
      context: ctx(),
      weather: Weather.RAIN,
      scene: Scene.CAFE,
    });
    expect(sound).toBe(AmbientSound.RAIN);
  });

  it('plays ocean at the pool on a clear day', () => {
    const sound = selector.select({
      context: ctx(),
      weather: Weather.SUNNY,
      scene: Scene.POOL,
    });
    expect([AmbientSound.OCEAN, AmbientSound.BIRDS]).toContain(sound);
  });
});

describe('MusicSelector', () => {
  const selector = new MusicSelector();

  it('plays focus music while working', () => {
    const music = selector.select({
      context: ctx(),
      mode: WorldMode.HOME,
      timeOfDay: TimeOfDay.AFTERNOON,
      activity: Activity.WORKING,
    });
    expect(music).toBe(Music.FOCUS);
  });

  it('plays upbeat or romantic on special moments', () => {
    const music = selector.select({
      context: ctx(),
      mode: WorldMode.SPECIAL_MOMENT,
      timeOfDay: TimeOfDay.EVENING,
      activity: Activity.RELAXING,
    });
    expect([Music.UPBEAT, Music.ROMANTIC]).toContain(music);
  });
});

describe('HouseStateSelector', () => {
  const selector = new HouseStateSelector();

  it('turns the TV on while watching TV', () => {
    const state = selector.select({
      context: ctx(),
      timeOfDay: TimeOfDay.NIGHT,
      weather: Weather.CLOUDY,
      scene: Scene.LIVING_ROOM,
      activity: Activity.WATCHING_TV,
      music: Music.LOFI,
    });
    expect(state.tv).toBe(Toggle.ON);
  });

  it('activates the kitchen while cooking', () => {
    const state = selector.select({
      context: ctx(),
      timeOfDay: TimeOfDay.EVENING,
      weather: Weather.SUNNY,
      scene: Scene.KITCHEN,
      activity: Activity.COOKING,
      music: Music.CALM,
    });
    expect(state.kitchen).toBe(KitchenState.ACTIVE);
  });

  it('highlights activity-appropriate objects', () => {
    const state = selector.select({
      context: ctx(),
      timeOfDay: TimeOfDay.MORNING,
      weather: Weather.SUNNY,
      scene: Scene.STUDY,
      activity: Activity.READING,
      music: Music.NONE,
    });
    expect(state.objects).toContain('book');
  });
});
