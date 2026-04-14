# Metrics

View, edit, and manage plaintext metric files in Obsidian.

Metrics is a file-first Obsidian plugin for working with `*.metrics.ndjson` datasets inside your vault. It treats newline-delimited JSON files as the canonical source of truth and provides a compact lens for browsing, validating, editing, filtering, grouping, and charting metric records without introducing a hidden database.

## What it does

- Opens `*.metrics.ndjson` files directly in a dedicated metrics view
- Keeps metrics files visible in the file browser with clean dataset labels
- Parses and validates records line by line
- Supports record create, edit, delete, and missing-id assignment
- Supports metrics file create, rename, and delete
- Renders records as a compact timeline with optional metric icons
- Persists per-file filters, filter-bar visibility, sorting, grouping, and chart visibility
- Adds interactive charts above the timeline using the same visible rows as the list
- Copies stable plain-text metric references as `metric:<id>`

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
{"id":"01JV7RM60M9X1Y9G7TWJ3CF8ES","ts":"2026-04-14T09:10:00+04:00","key":"nutrition.calories","value":720,"unit":"kcal","source":"manual","note":"breakfast"}
```

Default conventions:

- metrics root: `Metrics/`
- file extension: `*.metrics.ndjson`
- default write target: `Metrics/All.metrics.ndjson`

## Current feature set

### Timeline view

- newest-first by default
- compact, minimal layout that leans on Obsidian styling
- row menu for copy, edit, and delete actions
- validation surfaced inline instead of hidden

### Filtering and grouping

- time presets including today, this week, past 7 days, past 30 days, past 3 months, past 6 months, past 1 year, this month, and custom range
- title-bar toggle to show or hide the filter bar
- metric filter
- search
- title-bar sort control
- grouping by day, metric, and source
- per-file view state persistence until reset

### Charts

- optional chart toggle in the title bar
- filter toggle in the title bar shows when filters or grouping are active
- charts respect the same visible rows as the timeline
- auto line/bar behavior
- stacked day bars for day grouping
- multiple metrics supported
- interactive legend, hover state, and row focus

## What it does not do

- no ingestion or import pipelines
- no hidden database or required cache
- no saved dashboards or query language
- no note/document modeling
- no in-note metric reference resolution in this phase

## Commands and actions

The plugin currently supports commands and title-bar actions for:

- creating a metrics file
- renaming the current metrics file
- deleting the current metrics file
- assigning missing ids in the current metrics file

Record-level actions are available from the timeline row menu.

## Development

### Local setup

```bash
npm install
npm run dev
```

Useful commands:

- `npm run dev` starts the build watcher
- `npm run build` creates a production bundle
- `npm run check` runs TypeScript type-checking

### Live vault workflow

This repo is designed to be linked into an Obsidian vault during development so changes can be tested in a real vault as the plugin rebuilds.

## Status

This project is in active `0.1.x` development. The current phase covers the file contract, current-file CRUD, file lifecycle, filtering, grouping, and charting for plaintext metrics files.

For implementation detail and current scope, see:

- `docs/spec.md`
- `docs/charts.md`
