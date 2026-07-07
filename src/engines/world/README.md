# World Engine

The **World Engine** is the first core engine of Featherlight. It generates and
manages each companion's *living world* — the scene, activity, weather, outfit,
lighting, sound, music, and house state that make the companion feel like they
inhabit a real, continuous day.

This is **not** a CRUD service. It is a rule-based generation engine.

---

## Boundaries

The engine is deliberately isolated:

- **No Express / HTTP.** It knows nothing about requests, responses, or routes.
- **No Prisma.** It never touches the database directly.
- **No AI / external integrations.**
- It communicates **only with the service layer** (`IWorldService`) for
  persistence, and otherwise operates on pure, in-memory value objects.

The controller/route layer (built later) will call the engine and translate its
`GeneratedWorldDTO` to HTTP — the engine remains unaware of that.

---

## Determinism: no `Math.random()`

The world is **deterministic**: the same companion on the same local day always
produces the same world. Yet distributions (like the 70-20-10 rule) still hold
when averaged over many days.

This is achieved with seeded pseudo-randomness instead of `Math.random()`:

1. A **seed** is derived from stable identity + local day:
   `seed = fnv1a("<companionId>:<YYYY-MM-DD>")`.
2. A tiny, high-quality PRNG (`mulberry32`) turns that seed into a reproducible
   stream of values in `[0, 1)`.
3. Each selector draws from its **own salted sub-stream**
   (`context.rngFor("scene")`, `context.rngFor("weather")`, …). Salting means a
   selector's choice never depends on how many values another selector consumed
   — choices are both **independent** and **reproducible**.

Because generation is deterministic, the engine can always reconstruct the full
world from the seed. Persistence therefore only needs to store the environment
*scalars* the `WorldState` model exposes; everything else is regenerated.

---

## The 70-20-10 rule

Every day is assigned a `WorldMode` by the strategy:

| Mode             | Share | Meaning                                             |
| ---------------- | ----- | --------------------------------------------------- |
| `HOME`           | 70%   | An ordinary domestic day at home.                   |
| `DAILY_LIFE`     | 20%   | Out and about — cafe, park, a drive.                |
| `SPECIAL_MOMENT` | 10%   | A rarer, heightened, celebratory day.               |

The mode is chosen by drawing one deterministic value from the day's
`world-mode` sub-stream and bucketing it at `0.70` / `0.90`. The
`DefaultWorldStrategy` implements this; the distribution is verified by
`default-world.strategy.test.ts` over an 8,000-sample draw.

---

## Generation pipeline

The `WorldBuilder` runs the selectors in a strict dependency order. Each step
may read every facet resolved above it — this ordering *is* the domain logic:

```
timeOfDay  (from the local clock)
   └─ season      (from the calendar month)
      └─ mode         (strategy: 70-20-10)
         └─ weather      (season-weighted)
            └─ scene        (mode + timeOfDay + weather)
               └─ activity     (scene + timeOfDay + mode)
                  └─ outfit       (activity + scene + mode)
                     └─ lighting     (timeOfDay + weather)
                        └─ ambient      (weather + scene)
                           └─ music        (mode + timeOfDay + activity)
                              └─ houseState   (all of the above)
```

Examples of the deterministic rules encoded in the selectors:

- **Scene:** a storm forces an indoor scene; night strongly favours indoors;
  rain suppresses outdoor scenes.
- **Activity:** each scene has a plausible activity set, nudged by time of day
  (mornings favour coffee/gym/work, nights favour tv/relaxing/gaming).
- **Outfit:** gym activity ⇒ gym wear; special moment ⇒ festival wear; working
  from home ⇒ home wear, working out ⇒ office wear.
- **Lighting:** wet daytime weather ⇒ rainy light; evenings ⇒ golden hour;
  nights ⇒ night lamp (even in the rain).
- **Ambient:** audible weather (rain/storm) wins; otherwise the scene's
  signature soundscape (park ⇒ birds, cafe ⇒ coffee machine, pool ⇒ ocean).
- **House state:** almost entirely rule-driven — curtains, doors, tv, music,
  lights, plants, kitchen, and highlighted objects each follow directly from the
  time/weather/scene/activity.

---

## Components

| Component                 | Responsibility                                                        |
| ------------------------- | --------------------------------------------------------------------- |
| `WorldEngine`             | Public facade: generate + persist via services.                       |
| `WorldContext`            | Immutable input value object; resolves date/seed; hands out sub-RNGs. |
| `WorldBuilder`            | Pure orchestrator; runs selectors in dependency order.                |
| `IWorldStrategy`          | High-level rule set; owns the mode rule + the selectors.              |
| `DefaultWorldStrategy`    | The canonical 70-20-10 strategy.                                      |
| `WeatherSelector`         | Season-weighted weather.                                              |
| `SceneSelector`           | Scene from mode + time + weather.                                     |
| `ActivitySelector`        | Activity from scene + time + mode.                                    |
| `OutfitSelector`          | Outfit from activity + scene + mode.                                  |
| `LightingSelector`        | Lighting from time + weather.                                         |
| `AmbientSelector`         | Ambient sound from weather + scene.                                   |
| `MusicSelector`           | Music mood from mode + time + activity.                               |
| `HouseStateSelector`      | Structured house snapshot from everything.                            |
| `WorldScheduler`          | Day-boundary staleness + regeneration cadence.                        |
| `WorldFactory`            | Composition root / dependency injection.                              |

Every selector, the strategy, the builder, the engine, and the scheduler have
an **interface**, so any rule can be swapped or A/B-tested in isolation.

---

## Strategy pattern for evolving rules

Rules are expected to change. The design keeps that cheap:

- Each facet has an `ISelector` interface with a default implementation.
- `IWorldStrategy` bundles the mode rule + the full selector set.
- `DefaultWorldStrategy` accepts per-selector overrides
  (`DefaultWorldStrategyDeps`), so you can replace just the weather rule while
  keeping the rest.
- To introduce a completely different feel (e.g. a "vacation" season), implement
  a new `IWorldStrategy` and pass it to `getWorldEngine({ strategy })`.

Optional biasing signals (`WorldSignals` — affection, engagement, mood hint) are
threaded through the context so future strategies can read them without any API
change today.

---

## Usage

```typescript
import { getWorldEngine } from '@engines/world';

const { engine, scheduler } = getWorldEngine();

// Pure, deterministic — no persistence, no services:
const preview = engine.generate({ companionId, timezone: 'Asia/Kolkata' });

// Generate + persist today's environment scalars:
const created = await engine.createTodaysWorld({ companionId, timezone: 'Asia/Kolkata' });

// Read the current world (reflects any manual overrides made today):
const current = await engine.getCurrentWorld({ companionId, timezone: 'Asia/Kolkata' });

// Regenerate "as of now" (e.g. the time of day advanced):
const refreshed = await engine.refreshWorld({ companionId, timezone: 'Asia/Kolkata' });

// Force a manual override and persist it:
await engine.updateWorldState({ companionId }, { scene: 'POOL', mood: 'excited' });

// Scheduler: regenerate only when the local day has rolled over:
await scheduler.ensureFreshWorld({ companionId, timezone: 'Asia/Kolkata' }, lastKnownDateKey);
```

For tests, inject a `FixedClock` and/or a mock `IWorldService` via
`getWorldEngine({ clock, worldService })` (or construct `WorldEngine` directly).

---

## Persistence mapping

`WorldEngine` maps the generated world onto the existing `IWorldService` API:

| Generated field | Persisted via `updateWorldState` (`UpdateWorldStateDTO`) |
| --------------- | -------------------------------------------------------- |
| `timeOfDay`     | `timeOfDay`                                              |
| `season`        | `season`                                                 |
| `scene`         | `currentScene`                                           |
| `mood`          | `globalMood`                                             |

Persistence is **best-effort**: if no `WorldState` row exists yet, the generated
world is still returned (generation never depends on persistence). `getCurrentWorld`
overlays any persisted scene/mood/time back onto the deterministic base so that
explicit `updateWorldState` overrides are reflected on read.

---

## Testing

Seven suites, 77 tests, covering:

- `seed.util.test.ts` — hash/PRNG determinism, salted independence, weighted
  distribution.
- `date.util.test.ts` — time-of-day bands, season mapping, timezone-aware date
  keys and next-midnight math.
- `default-world.strategy.test.ts` — the 70-20-10 distribution + determinism.
- `selectors.test.ts` — each selector's rules and determinism.
- `world.builder.test.ts` — full-world assembly and end-to-end determinism.
- `world.engine.test.ts` — persistence mapping, best-effort persistence,
  override application, read overlay (with a mocked `IWorldService`).
- `world.scheduler.test.ts` — staleness, next-boundary, and regenerate-vs-read
  branching (with a mocked engine).

All generation tests use a `FixedClock` so results are fully reproducible.
