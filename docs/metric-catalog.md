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
| `[degF]` | `°F` | Degrees Fahrenheit | `f`, `fahrenheit`, `°f` | 1 | No |
| `%` | `%` | Percent | `percent`, `pct` | 1 | No |
| `bpm` | `bpm` | Beats per minute | None | 0 | No |
| `br/min` | `br/min` | Breaths per minute | None | 0 | No |
| `Cel` | `°C` | Degrees Celsius | `c`, `celsius`, `°c` | 1 | No |
| `count` | `count` | Count | None | 0 | No |
| `g` | `g` | Grams | `gram`, `grams` | 0 | No |
| `h` | `hr` | Hours | `hour`, `hours`, `hr`, `hrs` | Auto | `h` |
| `kcal` | `kcal` | Kilocalories | None | 0 | No |
| `kg` | `kg` | Kilograms | `kilogram`, `kilograms` | 1 | No |
| `km` | `km` | Kilometers | `kilometer`, `kilometers` | 2 | No |
| `mg` | `mg` | Milligrams | `milligram`, `milligrams` | 2 | No |
| `min` | `min` | Minutes | `minute`, `minutes` | Auto | `min` |
| `mL` | `mL` | Milliliters | `ml`, `milliliter`, `milliliters` | 0 | No |
| `mm[Hg]` | `mmHg` | Millimeters of mercury | `mmhg`, `mmHg` | 0 | No |
| `ms` | `ms` | Milliseconds | `millisecond`, `milliseconds` | 0 | No |
| `s` | `sec` | Seconds | `sec`, `second`, `seconds` | Auto | `s` |
| `score` | `score` | Score | None | 0 | No |

## Metrics

| Key | Label | Category | Allowed units | Default unit | Fraction digits | Icon candidates |
| --- | --- | --- | --- | --- | --- | --- |
| `body.fat_free_mass` | Fat-free mass | `body` | `kg` | `kg` | 1 | `dumbbell`, `activity` |
| `body.fat_mass` | Fat mass | `body` | `kg` | `kg` | 1 | `scale`, `activity` |
| `body.fat_percentage` | Body fat percentage | `body` | `%` | `%` | 1 | `percent`, `activity` |
| `body.weight` | Body weight | `body` | `kg` | `kg` | 1 | `scale`, `dumbbell`, `activity` |
| `medication.semaglutide_dose` | Semaglutide dose | `medication` | `mg` | `mg` | 2 | `syringe`, `pill` |
| `nutrition.energy_intake` | Energy intake | `nutrition` | `kcal` | `kcal` | 0 | `flame`, `utensils` |
| `recovery.heart_rate_variability` | Heart rate variability | `recovery` | `ms` | `ms` | 1 | `heart-pulse`, `heart`, `activity` |
| `recovery.oxygen_saturation` | Oxygen saturation | `recovery` | `%` | `%` | 1 | `heart`, `activity` |
| `recovery.respiratory_rate` | Respiratory rate | `recovery` | `br/min` | `br/min` | 2 | `wind`, `activity` |
| `recovery.resting_heart_rate` | Resting heart rate | `recovery` | `bpm` | `bpm` | 0 | `heart-pulse`, `heart`, `activity` |
| `recovery.skin_temperature` | Skin temperature | `recovery` | `Cel` | `Cel` | 1 | `thermometer`, `activity` |
| `sleep.duration` | Sleep duration | `sleep` | `h`, `min`, `s` | `min` | 0 | `moon-star`, `moon`, `bed` |
| `sleep.efficiency` | Sleep efficiency | `sleep` | `%` | `%` | 1 | `bed`, `moon`, `activity` |
| `whoop.day_strain` | WHOOP strain | `activity` | `score` | `score` | 2 | `gauge`, `activity`, `zap` |
| `whoop.recovery_score` | WHOOP recovery score | `recovery` | `%` | `%` | 0 | `battery-full`, `battery`, `heart`, `activity` |
| `whoop.sleep_performance` | WHOOP sleep performance | `sleep` | `%` | `%` | 0 | `bed`, `moon`, `activity` |

