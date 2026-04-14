# Metrics plugin spec

## Status

- Overall status: active v0.1 development
- Contract status: locked for the current file-first metrics phase
- Scaffold status: complete in this repository
- Vault dev status: linked into the live `totocaster` vault for real-time testing
- Scope status: contract, scaffold, file lifecycle, current-file metrics lens, current-file charting, and command-palette metrics search are implemented
- Current implementation status: file-backed metrics timeline view, record parsing, catalog-backed validation and labels, missing-id migration, current-file CRUD, metrics file create/rename/delete, command-palette metrics search/open across files, per-file filter-bar/filter/sort persistence, grouping by day, metric, and source, per-group derived summary rows, and interactive charts are working
- File browser status: `*.metrics.ndjson` files are routed into the plugin view and sidebar labels are normalized to logical metric dataset names
- UI status: compact timeline layout, per-file persisted view controls, title-bar chart/filter/sort actions, grouping, derived summary rows, row action menu, command-palette metrics search, optional metric icons, and chart-to-timeline selection are implemented
- Next implementation phase: file-level polish and group-collapse behavior

## Product

Metrics is an Obsidian plugin for viewing and editing canonical `*.metrics.ndjson` files.

The plugin is a metrics-only tool. It is not a Hypercontext client, does not own a hidden database, and does not model notes or documents.

## Scope for this phase

1. Contract
2. Scaffold
3. Lens over `*.metrics.ndjson` files with read, validation, current-file CRUD, file lifecycle actions, and current-file charts

## Out of scope for this phase

- ingestion and import pipelines
- cache layers and hidden databases
- advanced query language
- saved views and dashboard blocks
- note and document features beyond plain metric references

## Core principles

- Files first: `*.metrics.ndjson` files are canonical
- Plugin as lens: the plugin reads and mutates files; it does not own the data
- Obsidian APIs only: reads and writes go through Obsidian Vault APIs
- No hidden storage: there is no canonical database and no required cache
- Metrics only: this plugin is strictly about numeric metrics records
- Stable references: every record must have a durable `id` that survives edits

## Filesystem contract

### Default root

- metrics root folder: `Metrics/`

### Supported files

- primary extension: `*.metrics.ndjson`
- optional future compatibility: plain `*.ndjson`

### Default write target

- `Metrics/All.metrics.ndjson`

The default write target is a convenience, not an ontology. Multiple files compose into one logical metrics dataset.

## Record contract

Each line in a metrics file is one JSON object.

### Required fields

- `id`: stable record identifier
- `ts`: ISO-8601 timestamp with timezone
- `key`: canonical metric key such as `body.weight`
- `value`: numeric value
- `source`: source identifier such as `manual` or `whoop`

### Optional fields

- `date`: local date shortcut in `YYYY-MM-DD`
- `unit`: canonical unit code such as `kg`, `kcal`, `%`, `bpm`, `min`, `Cel`
- `origin_id`: external source identifier used for provenance and dedupe
- `note`: short human-readable note
- `context`: JSON object for structured extra data
- `tags`: array of strings

## Built-in metric catalog

- `src/metric-catalog.json` is the machine-readable source of truth for first-party supported metrics, units, labels, icon candidates, and formatting hints.
- `docs/metric-catalog.md` is generated from that JSON source and should not be edited by hand.
- The catalog is used directly by runtime validation, row rendering, chart labels, and record-edit modal suggestions.
- The current catalog is grounded in the linked vault's observed Withings, WHOOP, nutrition, and medication records, then normalized into a cleaner canonical vocabulary.
- Unknown keys remain allowed by the file contract so the plugin stays file-first and user-extensible.
- Unknown keys are warned as outside the built-in catalog rather than rejected as invalid rows.

### Identifier rules

- `id` is required in v1
- `id` must be globally unique within the plugin's metrics scope
- `id` should use ULID format so it is sortable, portable, and compact in plain text
- `origin_id` is not a substitute for `id`
- records without `id` are contract-invalid for CRUD

### Referenceability from Markdown

The stable metric reference primitive is:

```text
metric:<id>
```

Example:

```text
metric:01JRX9Y7T9TQ8Q3A91F1M7A4AA
```

Notes may contain this token anywhere in Markdown as a plain reference string. In this phase, the plugin does not try to resolve or render metric references inside notes.

## CRUD semantics

### Create

- create appends one new JSON line to a target metrics file
- the plugin must generate a new `id` when one is not supplied
- appends must preserve newline-delimited JSON format

### Read

- read scans supported metrics files under the configured root
- each record must be associated with its file path and line number for inspection and mutation
- reads must surface validation errors instead of hiding them

### Update

- update targets one record by `id`
- update rewrites only the affected file
- update must preserve file order unless a deliberate reorder is requested later
- if an `id` is duplicated, update is blocked and reported as an error

### Delete

- delete targets one record by `id`
- delete rewrites only the affected file with the target record removed
- if an `id` is duplicated, delete is blocked and reported as an error

## Validation contract

The plugin must surface, not silently swallow:

- invalid JSON lines
- missing required fields
- invalid `id`
- non-numeric `value`
- duplicate `id`
- duplicate `origin_id` when the plugin is configured to treat it as unique provenance
- unknown built-in metric keys
- unknown units
- known-key and unit mismatches against the built-in catalog
- mixed key and unit inconsistencies

Unknown keys, unknown units, and built-in key/unit mismatches are warnings, not fatal errors.

## Architecture contract

### Included

- Obsidian plugin shell
- file-backed metrics view for `*.metrics.ndjson`
- file browser integration for compound metrics extensions
- command-palette metrics search across the configured root
- current-file create, update, and delete flows for metrics rows
- settings for metrics root, supported extensions, default write file, reference prefix, metric icons, and metric label display mode
- built-in metric catalog for first-party metric metadata and validation hints
- direct file reads and writes via Obsidian APIs
- in-memory working state only

### Explicitly excluded

- canonical SQLite or other hidden database
- required indexing or caching layer
- ingestion framework or provider system
- note, document, or Hypercontext domain model

## Working manifest decisions

- display name: `Metrics`
- working plugin id: `metrics-lens`
- desktop support: not desktop-only by contract

The display name omits "Obsidian" to stay aligned with common community plugin naming guidance.

## Progress notes

- The plugin is scaffolded and builds successfully
- The plugin is symlinked into the `totocaster` vault for live development
- `metrics.ndjson` is registered as a compound extension for the metrics view
- `ndjson` is registered as a file-browser fallback so metrics files remain visible in the sidebar
- The plugin rewrites file browser labels so `withings.metrics.ndjson` appears as `withings`
- The current file view parses live rows, validates them, and surfaces file-level and row-level diagnostics
- The current linked vault data now carries stable `id` values and exercises the built-in catalog with Withings body composition, WHOOP recovery and sleep, nutrition intake, and medication dose records
- The plugin still supports assigning missing ULIDs to a current metrics file when older rows need to be brought into the v1 contract
- The plugin can now append, edit, and delete records in the current metrics file once rows have stable ids
- The current file view is rendered as a compact timeline with minimal default Obsidian styling
- Records are sorted newest-first by default using `ts`
- The current file view supports local filters for one or more metric keys, source, status, text, and date range
- Filter-bar visibility, filter, search, sort, time range, and grouping state persist per metrics file until the user clicks `Reset`
- The filter bar keeps time range, metrics, and search visible, with the metric picker supporting multi-select, advanced filters under `More`, and sort in the title bar next to the chart and filter toggles
- The current file view supports preset time ranges including today, this week, past 7 days, past 30 days, past 3 months, past 6 months, past 1 year, this month, and custom range
- The current file view supports sort modes for newest-first, oldest-first, and value ordering
- The current file view can group records by day, metric, or source
- The current file view can append derived summary rows for average, median, minimum, maximum, sum, or count after the visible timeline or after each rendered group
- Day groups render as linked `h2` headings titled `YYYY-MM-DD` and open the matching daily note
- Metric icons can be shown in timeline markers and are enabled by default when the icon exists in Obsidian
- Validation, row labels, chart labels, and record modal suggestions now read from the built-in metric catalog
- Lists and selectors can now switch between friendly metric names and canonical keys from settings
- Record actions are available from a minimal `...` menu for copying stable `metric:<id>` references, plus copy, edit, and delete operations
- Metrics files can now be created, renamed, and deleted from commands
- Metrics records can now be searched across files from a command-palette picker and open the matching row in the metrics view
- The current file view can render interactive charts above the filter bar when it is shown, using the same visible rows as the timeline
- Chart buckets can now focus the matching visible timeline rows below
- The current phase is substantially complete; the next meaningful milestone is file-level polish and group-collapse behavior

## Viewing plan

### Filtering

1. Implemented.
   The current file view now supports multi-select metric filtering, source, validation status, free-text search, and time-based filtering.
2. Keep filters local to the open view.
   Filters change presentation only and do not mutate files, and the current selection persists until reset.
3. Future follow-up.
   If needed, add richer text matching or quick filter chips without introducing saved queries.

### Sorting

1. Implemented.
   The current file view keeps newest-first as the default and offers oldest-first plus value high-low / low-high modes.
2. Apply sorting after filtering.
   The view pipeline is filter -> sort -> render.
3. Future follow-up.
   If needed, add date-only or source-first sorts without turning the UI into a table grid.

### Grouping

1. Implemented.
   The current file view now supports grouping by day, metric, and source.
2. Keep no grouping as the default.
   The plain timeline remains the simplest presentation.
3. Future follow-up.
   Make groups collapsible if the layout starts to feel heavy.
4. Apply grouping after filtering and sorting.
   Filter -> sort -> group remains the cleanest pipeline for a file lens.

### Derived summaries

1. Implemented.
   The current file view can append derived summary rows for average, median, minimum, maximum, sum, or count.
2. Keep summaries local to the visible rows.
   Summary rows are derived from the current post-filter timeline only and never mutate files.
3. Summarize by metric and unit.
   Mixed metrics and mixed units are split into separate derived rows instead of being merged.

## Recommended next work

1. Refine file-level polish.
   Add small confirmations, rename ergonomics, and smarter defaults around new-file placement if they prove necessary.
2. Refine the filter/sort/group toolbar.
   Keep the controls minimal and local to the current view, but improve density and discoverability if needed.
3. Consider chart-to-timeline depth.
   If needed, add stronger chart drill-down modes such as temporary bucket filters or chart-driven group focus without changing the file contract.
4. Refine cross-file search only if needed.
   Keep the current command-palette search lightweight unless a stronger navigation case appears.

## Open questions

- whether `origin_id` should be globally unique or only unique within `(source, origin_id)`
- whether delete should gain a future tombstone mode instead of physical removal
- whether a future reference workflow should open records in place, in a side pane, or in a command-palette picker
