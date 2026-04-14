# Metrics

File-first metrics for Obsidian.

Metrics is an Obsidian plugin for viewing and editing canonical `*.metrics.ndjson` files inside your vault. The files stay as the source of truth: no hidden database, no required cache, and no saved-dashboard layer sitting behind the UI.

## Status

Metrics is in active `0.1.x` development and currently targets Obsidian `1.6.0+`.

## What it does

- Opens supported metrics files in a dedicated metrics view
- Keeps metrics files visible in the file browser with clean logical labels
- Parses NDJSON line by line and surfaces validation issues inline
- Creates, edits, and deletes records in the current file
- Assigns ULID ids to legacy rows that are missing `id`
- Creates, renames, and deletes metrics files under the configured root
- Searches records across metrics files from the command palette and jumps to the matching row
- Filters by time range, metric, source, validation status, and free text
- Sorts by newest, oldest, value high-low, and value low-high
- Groups records by day, metric, or source
- Adds optional derived summary rows for average, median, minimum, maximum, sum, and count
- Adds optional charts driven by the same visible rows as the timeline
- Copies stable plain-text references such as `metric:<id>`
- Persists per-file view state for filters, sorting, grouping, and chart visibility

## File format

Each line in a metrics file is one JSON object.

Required fields:

- `id`
- `ts`
- `key`
- `value`
- `source`

Optional fields:

- `date`
- `unit`
- `origin_id`
- `note`
- `context`
- `tags`

Example:

```json
{"id":"01JV7RK8Q4X60M0E2N0A6QK61V","ts":"2026-04-14T08:30:00+04:00","key":"body.weight","value":105.6,"unit":"kg","source":"withings"}
{"id":"01JV7RM60M9X1Y9G7TWJ3CF8ES","ts":"2026-04-14T09:10:00+04:00","key":"nutrition.energy_intake","value":720,"unit":"kcal","source":"manual","note":"breakfast"}
```

Default conventions:

- Metrics root: `Metrics/`
- Supported extension: `*.metrics.ndjson`
- Default write target: `Metrics/All.metrics.ndjson`
- Default record reference prefix: `metric:`

Validation rules are strict about structure and required fields, but the plugin stays file-first:

- unknown metric keys are allowed and shown as warnings
- unknown units are allowed and shown as warnings
- known-key and unit mismatches are warned instead of silently normalized
- duplicate `id` values are treated as errors and block safe record mutations

## Commands

The current command surface includes:

- `Open current metrics file`
- `Open metrics view`
- `Search metrics`
- `Add record to current metrics file`
- `New metrics file`
- `Rename current metrics file`
- `Delete current metrics file`
- `Assign missing ids in current metrics file`

Record-level copy, edit, and delete actions are available from the timeline row menu.

## Settings

Metrics currently exposes settings for:

- metrics root folder
- supported extensions
- default write file
- record reference prefix
- metric label display mode: friendly names or canonical keys
- metric icon visibility

## Built-in catalog

The plugin ships with a first-party metric catalog in [`src/metric-catalog.json`](src/metric-catalog.json).

That catalog drives:

- metric labels in rows, filters, and charts
- allowed units and unit formatting
- icon mapping
- record modal suggestions

## Non-goals

Metrics is intentionally not:

- an ingestion or import pipeline
- a hidden database or cache-backed system
- a saved-dashboard or saved-query product
- a note or document feature set
- an in-note metric reference resolver in the current phase

## Development

Install dependencies:

```bash
npm install
```

Useful commands:

- `npm run dev` starts the build watcher
- `npm run build` creates a production bundle
- `npm run check` runs TypeScript type-checking

For local testing, link or copy `manifest.json`, `main.js`, and `styles.css` into `.obsidian/plugins/metrics-lens/` inside a vault.
