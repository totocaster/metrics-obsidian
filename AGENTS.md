# AGENTS.md

This file is the working development guide for agents and collaborators editing this repository.

## Product summary

Metrics is an Obsidian plugin for viewing and editing canonical `*.metrics.ndjson` files.

It is intentionally:

- metrics-only
- file-first
- Vault API based
- free of hidden databases and cache requirements

It is intentionally not:

- an ingestion framework
- a Hypercontext client
- a notes/documents feature set
- a saved-dashboard system

## Current scope

Implemented today:

- contract and scaffold
- file-backed metrics view
- line-by-line parsing and validation
- missing-id assignment for legacy rows
- current-file record CRUD
- metrics file create, rename, and delete
- filtering, sorting, and grouping
- current-file charts

Explicitly out of scope for this phase:

- ingestion/import pipelines
- hidden DB/cache layers
- dashboard blocks and saved views
- in-note metric reference resolution

## Canonical file contract

Default conventions:

- metrics root: `Metrics/`
- extension: `*.metrics.ndjson`
- default write target: `Metrics/All.metrics.ndjson`

Each line is one JSON object.

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

Important contract decisions:

- `id` is required for v1 CRUD
- `id` should be ULID-formatted
- `unit` stores canonical unit codes, not free-form display text
- `origin_id` is provenance, not the primary record id
- stable copied references use plain `metric:<id>` text only
- notes may contain that token, but the plugin does not resolve or render it in this phase

## Architecture map

### Plugin shell

- `src/main.ts`
  - plugin lifecycle
  - command registration
  - file-view registration
  - file lifecycle actions
  - title-bar action wiring
  - file browser integration for metrics files

### View layer

- `src/view.ts`
  - current-file metrics lens
  - timeline rendering
  - filter/sort/group controls
  - title-bar action layout
  - row menus
  - validation and footer state
  - chart placement and chart-to-row selection

### File parsing and validation

- `src/metrics-file-model.ts`
  - NDJSON parsing
  - schema validation
  - duplicate checks
  - normalized record/file diagnostics

### Mutations

- `src/metrics-file-mutation.ts`
  - append/create
  - update by `id`
  - delete by `id`
  - assign missing ids

- `src/metrics-file-modal.ts`
  - create/rename file path modal

- `src/metric-record-modal.ts`
  - record create/edit modal
  - catalog-backed key and unit suggestions

### Charts

- `src/chart-model.ts`
  - derives chart data from already-visible rows
  - respects filtering/grouping rules
  - handles unit splits and day stacking
  - uses catalog-backed metric and unit labels

- `src/chart-renderer.ts`
  - native SVG chart rendering
  - hover, legend, tooltip, and selection behavior

### Shared state and formatting

- `src/metric-catalog.json`
  - canonical machine-readable metric and unit catalog

- `src/metric-catalog.ts`
  - typed accessors for catalog-backed validation and display behavior

- `src/settings.ts`
  - plugin settings persistence

- `src/view-state.ts`
  - per-file persisted view state

- `src/metric-icons.ts`
  - metric icon lookup using Obsidian/Lucide icon ids
  - backed by the metric catalog

- `src/metric-value-format.ts`
  - metric value display helpers
  - catalog-backed unit display and fraction digits
  - duration formatting for `min`, `s`, and `h`

- `src/contract.ts`
  - contract-level helpers and shared constants

- `src/ulid.ts`
  - local ULID generation

- `styles.css`
  - scoped plugin styles
  - stay close to Obsidian theme variables and default UI patterns

## Development rules for this repo

### Product rules

- Do not introduce a hidden canonical database.
- Do not add a cache layer unless explicitly requested and clearly rebuildable.
- Do not drift into note/document features unless the scope changes.
- Keep the plugin file-native: files are the product, not an internal model hidden from the user.
- Prefer current-file features over dataset-wide abstractions unless the user explicitly wants cross-file behavior.

### Implementation rules

- Use Obsidian Vault APIs for reads/writes.
- Prefer `Vault.process()` for background file modifications.
- Keep UI text in sentence case.
- Use Obsidian DOM helpers and avoid `innerHTML`.
- Keep styles scoped and lean on theme variables instead of hardcoded values.
- Keep the UI minimal and close to default Obsidian styling unless there is a clear reason not to.
- Treat validation as a first-class surface: never silently swallow bad rows.
- Preserve stable `id` values and block unsafe mutations on duplicate ids.

### UX rules that emerged in development

- The metrics view should feel compact and quiet.
- Timeline first, details second.
- Chart sits above filters.
- Primary controls stay minimal; secondary controls live under `More`.
- Per-file view state must persist until reset.
- Grouped day headings should look like normal note headings, not custom cards.
- Title-bar actions should stay logically grouped with separators.

## Local development workflow

Install dependencies:

```bash
npm install
```

Useful commands:

```bash
npm run dev
npm run build
npm run check
npm run generate:metric-catalog-doc
```

Expected workflow:

1. Run `npm run dev`.
2. Test against a real vault-linked plugin install.
3. Use `npm run check` before finishing.
4. Use `npm run build` when you need a fresh production bundle.

## Live vault context

This repo has been developed against a live linked vault at:

`/Users/toto/Notes/totocaster/.obsidian/plugins/metrics-lens`

That setup matters because many UI decisions in this repo were tuned in-place against real metrics files and real Obsidian styling.

## Documentation sources

When changing product behavior, keep these docs aligned:

- `docs/spec.md`
- `docs/charts.md`
- `docs/metric-catalog.md`
- `README.md`
- `AGENTS.md`

## Near-term roadmap

Most likely next areas of work:

1. Cross-file navigation and search
2. File-level polish
3. Group-collapse behavior
4. Additional chart polish and drill-down

If scope is unclear, default back to the contract in `docs/spec.md` and keep the plugin focused on plaintext metrics files.
