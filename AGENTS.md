# AGENTS.md

Working guide for contributors editing this repository.

## Product

Metrics is a file-first Obsidian plugin for viewing and editing canonical `*.metrics.ndjson` files.

Core constraints:

- keep metrics files as the source of truth
- do not introduce a hidden canonical database
- do not add a required cache layer
- keep the product metrics-only, not a general notes feature
- prefer current-file behavior over dataset-wide abstractions unless explicitly requested

## File contract

Default conventions:

- metrics root: `Metrics/`
- supported extension: `*.metrics.ndjson`
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

Contract rules:

- `id` is required for CRUD and should be ULID-formatted
- `origin_id` is provenance, not the primary record id
- stable copied references use plain `metric:<id>` text
- unknown keys and units are allowed, but should surface as warnings
- duplicate `id` values must block unsafe mutations

## Architecture map

- `src/main.ts`: plugin lifecycle, commands, view registration, file actions
- `src/view.ts`: current-file metrics view, filters, grouping, summaries, chart integration
- `src/metrics-file-model.ts`: NDJSON parsing and validation
- `src/metrics-file-mutation.ts`: append, update, delete, and missing-id assignment
- `src/metric-record-modal.ts`: create and edit record modal
- `src/metric-catalog-editor-modal.ts`: custom metric and unit catalog editor modals
- `src/metrics-file-modal.ts`: create and rename file modal
- `src/metrics-search-modal.ts`: command-palette search across metrics files
- `src/chart-model.ts`: chart data derivation from visible rows
- `src/chart-renderer.ts`: native SVG chart rendering
- `src/metric-catalog.json`: first-party metric and unit catalog defaults
- `src/metric-catalog.ts`: catalog normalization, custom catalog merge, validation helpers, labels, and unit formatting
- `src/settings.ts`: plugin settings persistence and custom catalog JSON editor
- `src/time-boundaries.ts`: vault-level time boundary settings and temporal bucket helpers
- `src/view-state.ts`: per-file persisted view state
- `styles.css`: scoped plugin styling

## Implementation rules

- use Obsidian Vault APIs for reads and writes
- prefer `Vault.process()` for background file mutations
- use Obsidian DOM helpers and avoid `innerHTML`
- keep UI text in sentence case
- keep styles scoped and tied to Obsidian theme variables
- keep the UI compact and close to default Obsidian patterns unless there is a strong reason not to
- treat validation as a first-class surface
- preserve stable `id` values

## Workflow

Install dependencies:

```bash
npm install
```

Useful commands:

```bash
npm run dev
npm run build
npm run check
```

Release workflow:

- update `manifest.json` and `package.json` for each release; update `versions.json` when the minimum Obsidian version changes or an explicit compatibility entry is needed
- use bare semantic version tags such as `0.6.0`, not `v0.6.0`
- pushing a release tag triggers GitHub Actions to run checks, build `main.js`, generate release notes, and upload `manifest.json`, `main.js`, and `styles.css`

Expected workflow:

1. Run `npm run dev`.
2. Test against a real vault install of the plugin.
3. Run `npm run check` before finishing.
4. Run `npm run build` when you need a fresh production bundle.

## Maintenance

When behavior changes, keep `README.md`, `AGENTS.md`, and any user-facing text aligned with the implementation.
