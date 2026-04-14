# Metrics plugin spec

## Status

- Overall status: active v0.1 development
- Contract status: locked for the current file-first metrics phase
- Scaffold status: complete in this repository
- Vault dev status: linked into the live `totocaster` vault for real-time testing
- Scope status: contract, scaffold, file lifecycle, current-file metrics lens, and current-file charting are implemented
- Current implementation status: file-backed metrics timeline view, record parsing, validation, missing-id migration, current-file CRUD, metrics file create/rename/delete, per-file filter-bar/filter/sort persistence, grouping by day, metric, and source, and interactive charts are working
- File browser status: `*.metrics.ndjson` files are routed into the plugin view and sidebar labels are normalized to logical metric dataset names
- UI status: compact timeline layout, per-file persisted view controls, title-bar chart/filter/sort actions, grouping, row action menu, title-bar file actions, optional metric icons, and chart-to-timeline selection are implemented
- Next implementation phase: cross-file navigation and file-level polish

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
- `unit`: human-readable unit such as `kg`, `kcal`, `percent`, `bpm`, `min`
- `origin_id`: external source identifier used for provenance and dedupe
- `note`: short human-readable note
- `context`: JSON object for structured extra data
- `tags`: array of strings

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
- mixed key and unit inconsistencies

Unknown units are warnings, not fatal errors.

## Architecture contract

### Included

- Obsidian plugin shell
- file-backed metrics view for `*.metrics.ndjson`
- file browser integration for compound metrics extensions
- current-file create, update, and delete flows for metrics rows
- settings for metrics root, supported extensions, default write file, reference prefix, and metric icons
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
- The current vault data is legacy relative to the v1 contract because rows use `origin_id` but not `id`
- The plugin can now assign missing ULIDs to a current metrics file so legacy rows can move into the v1 contract
- The plugin can now append, edit, and delete records in the current metrics file once rows have stable ids
- The current file view is rendered as a compact timeline with minimal default Obsidian styling
- Records are sorted newest-first by default using `ts`
- The current file view supports local filters for key, source, status, text, and date range
- Filter-bar visibility, filter, search, sort, time range, and grouping state persist per metrics file until the user clicks `Reset`
- The filter bar keeps time range, metrics, and search visible, with advanced filters under `More`, while sort now lives in the title bar next to the chart and filter toggles
- The current file view supports preset time ranges including today, this week, past 7 days, past 30 days, past 3 months, past 6 months, past 1 year, this month, and custom range
- The current file view supports sort modes for newest-first, oldest-first, and value ordering
- The current file view can group records by day, metric, or source
- Day groups render as linked `h2` headings titled `YYYY-MM-DD` and open the matching daily note
- Metric icons can be shown in timeline markers and are enabled by default when the icon exists in Obsidian
- Record actions are available from a minimal `...` menu for copying stable `metric:<id>` references, plus copy, edit, and delete operations
- Metrics files can now be created, renamed, and deleted from commands or the metrics view title bar
- The current file view can render interactive charts above the filter bar when it is shown, using the same visible rows as the timeline
- Chart buckets can now focus the matching visible timeline rows below
- The current phase is substantially complete; the next meaningful milestone is cross-file navigation and file-level polish

## Viewing plan

### Filtering

1. Implemented.
   The current file view now supports metric, source, validation status, free-text search, and time-based filtering.
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

## Recommended next work

1. Add cross-file record navigation.
   Provide a search/open flow by `id`, `origin_id`, `key`, or source across the metrics root without introducing a hidden database.
2. Refine file-level polish.
   Add small confirmations, rename ergonomics, and smarter defaults around new-file placement if they prove necessary.
3. Refine the filter/sort/group toolbar.
   Keep the controls minimal and local to the current view, but improve density and discoverability if needed.
4. Consider chart-to-timeline depth.
   If needed, add stronger chart drill-down modes such as temporary bucket filters or chart-driven group focus without changing the file contract.

## Open questions

- whether `origin_id` should be globally unique or only unique within `(source, origin_id)`
- whether delete should gain a future tombstone mode instead of physical removal
- whether a future reference workflow should open records in place, in a side pane, or in a command-palette picker
