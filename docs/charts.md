# Charts spec

## Status

- Status: initial chart rendering in progress
- Target phase: current-file charting inside the existing metrics view
- Implemented so far: per-file `show chart` toggle in the title bar, chart placement above filters, native SVG rendering, stacked day bars, hover crosshair/tooltip, interactive legends, and adaptive axis formatting
- Not implemented yet: chart polish and grouped-section-specific charts

## Goals

1. Add a chart that can be shown or hidden from the current metrics view.
2. Make the chart consume the same visible record set as the timeline.
3. Auto-select line or bar presentation without exposing a chart-type control in v1.
4. Make `group by day` chart against days on the x-axis.
5. Support multiple metrics in one current-file chart experience.

## Non-goals

- no hidden chart cache or database
- no cross-file charting in v1
- no saved chart presets or dashboard blocks
- no advanced reducers in v1 such as avg, min, max, or sum pickers
- no pie, area, scatter, or mixed charts in v1

## Product behavior

### Chart visibility

- Add one icon button in the title bar to show or hide the chart.
- The toggle is part of the per-file persisted view state.
- `Reset` returns chart visibility to its default state.
- If there is no plottable data after filtering, the chart region is hidden rather than rendering a broken empty chart.

### Data source

- The chart must use the same post-filter view state as the timeline.
- Input pipeline stays:

```text
records -> filter/search/status/date -> sort -> group -> render
```

- The chart never reads raw file rows independently of the timeline.
- The chart must respect:
  - metric filter
  - search text
  - source filter
  - validation status filter
  - time range
  - grouping

### Sorting rule

- Categorical charts respect the current sorted order.
- Temporal charts always plot left-to-right in chronological order after filtering.
- This is the one deliberate divergence from list sorting because a time chart sorted by value is misleading.
- The same visible rows are still used; only temporal axis order is normalized.

## Chart model

### Core principle

The chart should be derived from a chart model, not rendered directly from raw rows.

Recommended pipeline:

```text
ParsedMetricRow[] + MetricsViewState
-> visible rows
-> chart buckets
-> chart series
-> chart model
-> SVG render
```

### Chart model shape

Recommended internal model:

- `kind`: `line` or `bar`
- `xDomainKind`: `time` or `category`
- `buckets`: ordered x-axis buckets
- `series`: one or more metric series
- `unit`: shared unit for this chart model
- `groups`: one or more chart panels when units cannot be shared

### Series identity

- Default series identity is `metric key`.
- Color is stable per metric key.
- If multiple metric keys are visible, render multiple series.
- If only one metric key is visible, render a single series.

### Unit handling

- Do not combine incompatible units on the same y-axis.
- If visible rows contain multiple units, split into separate stacked chart panels by unit.
- Example:
  - `body.weight` in `kg` becomes one chart
  - `nutrition.calories` in `kcal` becomes another chart

This is preferred over dual axes in v1 because it is clearer and simpler.

## Auto chart selection

### Use line charts when

- x-axis is temporal
- grouping is `none` with valid timestamps

### Use bar charts when

- x-axis is categorical
- grouping is `day`
- grouping is `key`
- grouping is `source`
- rows do not have usable timestamps

### Fallbacks

- If a temporal chart has only one visible point in a panel, render a bar instead of a degenerate line.
- If all visible points collapse into one bucket, render bars.

## Grouping semantics

### No grouping

- X-axis uses record timestamps.
- Series are split by metric key.
- If timestamps are missing or invalid, fall back to a categorical bar chart in current visible order.

### Group by day

- X-axis uses local day buckets.
- Bucket key is `YYYY-MM-DD`.
- Day headings in the timeline and x-axis in the chart must describe the same day buckets.
- Multiple rows for the same metric on the same day are summed into one daily value.
- Group-by-day charts render as stacked bars.
- Each stacked segment represents one metric key's summed value for that day.

Reason:
- daily grouping should summarize the day, not just pick one row
- stacked bars make the daily total visually obvious
- repeated rows within a day remain visible as a meaningful aggregate

### Group by metric

- X-axis categories are metric keys.
- Chart kind is bar.
- One bar per metric key per chart panel.
- If multiple visible rows fall into the same metric key bucket, use the latest visible row.

### Group by source

- X-axis categories are sources.
- Chart kind is bar.
- When multiple metric keys are visible, series stay split by metric key.
- If multiple visible rows fall into the same `(source, key)` bucket, use the latest visible row.

## Multiple metrics

### Supported cases

- multiple metrics with the same unit on one temporal chart as multiple lines
- multiple metrics with different units as separate chart panels
- multiple metrics grouped by source as grouped bars
- multiple metrics grouped by key as one categorical view where the categories themselves are the metrics

### Legend

- Show a simple legend only when more than one series is visible in a chart panel.
- Legend order should follow the rendered series order.
- Click isolates a series.
- Shift-click mutes or restores a series.

## Rendering approach

### Recommendation

Implement chart rendering with native SVG, not a third-party chart library in v1.

### Why

- keeps the plugin lightweight
- avoids dependency and styling overhead
- makes Obsidian theme integration easier
- gives full control over compact layout
- is sufficient for bars, lines, axes, and legends

### Rendering rules

- Use Obsidian theme variables for all colors and strokes.
- Keep the chart visually minimal and aligned with the current default-styled view.
- Prefer subtle grid lines and compact axes.
- Chart sits above the filter controls and the timeline.

## UI plan

### Controls

- Add chart visibility toggle as an icon in the title bar.
- Keep all chart-specific logic behind auto mode in v1.
- Do not add a manual bar/line toggle yet.

### Empty and edge states

- If no rows survive filters, render no chart.
- If only one plottable point survives, render a minimal single-bar chart or hide the chart if the result is not meaningful.
- If all visible rows are invalid for charting, show nothing and rely on validation diagnostics below.

## Implementation plan

### Phase 1: view state and chart model

1. Extend per-file persisted view state with `showChart`.
2. Add a chart toggle icon to the primary controls row.
3. Create a new chart-model module that converts visible rows into chart buckets and series.
4. Reuse the existing filter and grouping pipeline rather than duplicating it.

Recommended files:

- `src/view-state.ts`
- `src/chart-model.ts`
- `src/view.ts`

### Phase 2: SVG renderer

1. Add a renderer that can draw:
   - line charts
   - grouped bar charts
   - simple legends
   - compact axes
2. Support separate chart panels when units differ.
3. Keep rendering stateless: input is a chart model, output is DOM/SVG.

Recommended files:

- `src/chart-renderer.ts`
- `styles.css`

### Phase 3: integration

1. Render the chart region above the timeline in the metrics view.
2. Feed it the same visible rows the timeline uses.
3. Make `group by day` produce day buckets for both timeline and chart.
4. Keep timeline and chart in sync on every control change.

### Phase 4: polish

1. Improve axis labeling density for narrow panes.
2. Add compact legends only when needed.
3. Tune series colors against light and dark themes.
4. Decide whether grouped sections should each own their own chart in future.

## Testing plan

### Unit tests

- chart kind heuristic
- day bucketing
- latest-per-bucket reducer
- multi-unit split into multiple panels
- categorical ordering
- temporal chronological ordering

### Manual cases

- single metric, many days
- multiple metrics, same unit
- multiple metrics, different units
- grouped by day
- grouped by source
- grouped by metric
- no rows after filtering
- one visible row
- invalid timestamps

## Recommended v1 decisions

- chart visibility default: off
- chart type selection: auto only
- temporal charts: line by default
- categorical charts: bar by default
- per-day reducer: sum visible records within the same day and metric
- multi-unit handling: split into separate chart panels
- persistence: per file, same as existing view controls

## Open questions

1. Whether chart visibility should default to off for all files, or auto-enable after first use.
2. Whether the chart should render before or after grouped day headings when `group by day` is active.
3. Whether grouped-by-source bars should stack or sit side by side.
4. Whether v1 should expose a future reducer menu, or keep `latest` fixed until a real need appears.
