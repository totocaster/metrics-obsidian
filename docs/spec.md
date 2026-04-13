# Metrics plugin spec

## Status

- Overall status: draft v0.1
- Contract status: locked for scaffold and CRUD foundation
- Scaffold status: bootstrapped in this repository
- Vault dev status: linked into the live `totocaster` vault for real-time testing
- Current implementation status: file-backed metrics workspace, multi-file browsing, record parsing, validation, missing-id migration, and current-file CRUD are working
- File browser status: `*.metrics.ndjson` files are routed into the plugin view and sidebar labels are normalized to logical metric dataset names
- Next implementation phase: metrics file management, broader cross-file navigation, and higher-level views

## Product

Metrics is an Obsidian plugin for viewing and editing canonical `*.metrics.ndjson` files.

The plugin is a metrics-only tool. It is not a Hypercontext client, does not own a hidden database, and does not model notes or documents.

## Scope for this phase

1. Contract
2. Scaffold
3. Lens over `*.metrics.ndjson` files with read, validation, current-file CRUD, and multi-file browsing

## Out of scope for this phase

- ingestion and import pipelines
- cache layers and hidden databases
- charts and visualizations
- advanced filters and query language
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

The canonical plain-text metric reference format is:

```text
metric:<id>
```

Example:

```text
metric:01JRX9Y7T9TQ8Q3A91F1M7A4AA
```

Notes may contain this token anywhere in Markdown. A future plugin phase may recognize or enhance it, but the token itself is the stable cross-file reference primitive.

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
- multi-file metrics browser scoped to the configured metrics root
- current-file create, update, and delete flows for metrics rows
- settings for metrics root, supported extensions, default write file, and reference prefix
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
- The plugin now includes an internal multi-file browser over the configured metrics root
- The next meaningful milestone is managing metrics files themselves and improving cross-file navigation

## Open questions

- whether `origin_id` should be globally unique or only unique within `(source, origin_id)`
- whether delete should gain a future tombstone mode instead of physical removal
- whether legacy records without `id` should get an explicit migration command
