# Metric catalog

> Generated from `src/metric-catalog.json`. Edit the JSON source, then run `npm run generate:metric-catalog-doc`.

## Status

- Source of truth for first-party supported metrics, units, labels, icons, and formatting hints.
- Used directly by runtime validation, row rendering, chart labels, and authoring suggestions.
- Unknown keys remain allowed by the file contract, but they are treated as outside this built-in catalog.

## Categories

| Category | Label | Icon candidates |
| --- | --- | --- |
| `activity` | Activity | `gauge`, `activity`, `zap` |
| `body` | Body | `scale`, `dumbbell`, `activity` |
| `medication` | Medication | `syringe`, `pill` |
| `nutrition` | Nutrition | `flame`, `utensils` |
| `recovery` | Recovery | `battery-full`, `battery`, `heart`, `activity` |
| `sleep` | Sleep | `moon-star`, `moon`, `bed` |

## Units

| Unit | Display | Label | Aliases | Fraction digits | Duration kind |
| --- | --- | --- | --- | --- | --- |
| `bpm` | `bpm` | Beats per minute | None | 0 | No |
| `br/min` | `br/min` | Breaths per minute | None | 0 | No |
| `C` | `°C` | Celsius | `c`, `celsius` | 1 | No |
| `count` | `count` | Count | None | 0 | No |
| `F` | `°F` | Fahrenheit | `f`, `fahrenheit` | 1 | No |
| `g` | `g` | Grams | `gram`, `grams` | 0 | No |
| `hours` | `hr` | Hours | `hour`, `hr`, `hrs` | Auto | `hours` |
| `kcal` | `kcal` | Kilocalories | None | 0 | No |
| `kg` | `kg` | Kilograms | `kilogram`, `kilograms` | 1 | No |
| `km` | `km` | Kilometers | `kilometer`, `kilometers` | 2 | No |
| `mg` | `mg` | Milligrams | `milligram`, `milligrams` | 2 | No |
| `min` | `min` | Minutes | `minute`, `minutes` | Auto | `min` |
| `ml` | `ml` | Milliliters | `milliliter`, `milliliters` | 0 | No |
| `mmHg` | `mmHg` | Millimeters of mercury | `mmhg` | 0 | No |
| `ms` | `ms` | Milliseconds | `millisecond`, `milliseconds` | 0 | No |
| `percent` | `%` | Percent | `%`, `pct` | 1 | No |
| `score` | `score` | Score | None | 0 | No |
| `sec` | `sec` | Seconds | `s`, `second`, `seconds` | Auto | `sec` |

## Metrics

| Key | Label | Category | Allowed units | Default unit | Fraction digits | Icon candidates |
| --- | --- | --- | --- | --- | --- | --- |
| `activity.strain` | Activity strain | `activity` | `score` | `score` | 0 | None |
| `body.body_fat_pct` | Body fat | `body` | `percent` | `percent` | 1 | `percent`, `activity` |
| `body.weight` | Body weight | `body` | `kg` | `kg` | 1 | `scale`, `dumbbell`, `activity` |
| `medication.semaglutide_dose` | Semaglutide dose | `medication` | `mg` | `mg` | 2 | `syringe`, `pill` |
| `nutrition.calories` | Calories | `nutrition` | `kcal` | `kcal` | 0 | `flame`, `utensils` |
| `recovery.resting_hr` | Resting heart rate | `recovery` | `bpm` | `bpm` | 0 | `heart-pulse`, `heart`, `activity` |
| `recovery.score` | Recovery score | `recovery` | `score`, `percent` | `score` | 0 | `battery-full`, `battery`, `heart`, `activity` |
| `sleep.duration` | Sleep duration | `sleep` | `hours`, `min`, `sec` | `min` | 0 | `moon-star`, `moon`, `bed` |
| `sleep.performance` | Sleep performance | `sleep` | `score`, `percent` | `score` | 0 | `bed`, `moon`, `activity` |

