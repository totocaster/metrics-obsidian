import type { ParsedMetricRow } from "./metrics-file-model";
import {
  compareMetricKeys,
  displayMetricKey,
  displayMetricName,
  displayMetricOption,
  displayMetricUnit,
  normalizeMetricUnitKey,
  type MetricNameDisplayMode,
} from "./metric-catalog";
import {
  formatMetricDisplayValue,
  rawValuePrecision,
} from "./metric-value-format";
import {
  rowDateValue,
  rowTemporalBucket,
  rowTimestamp,
  type MetricsHeadingPart,
} from "./metrics-row-selectors";
import {
  addDays,
  addMonths,
  addYears,
  currentEffectiveDate,
  startOfMonth,
  startOfWeek,
  toLocalDateString,
  type MetricsTimeBoundaryConfig,
} from "./time-boundaries";
import type {
  MetricsGroupBy,
  MetricsSummaryComputation,
  MetricsViewState,
} from "./view-state";
import { DEFAULT_VIEW_STATE } from "./view-state";

export interface MetricsRowGroup {
  heading: string;
  headingParts?: MetricsHeadingPart[];
  key: string;
  linkTarget?: string;
  rows: ParsedMetricRow[];
}

export interface MetricsSummaryRow {
  computation: MetricsSummaryComputation;
  label: string;
  metricKey: string;
  note?: string;
  rawPrecision: number;
  unit: string | null;
  unitLabel?: string;
  value: number;
}

type MetricsSummaryBucket = {
  metricKey: string;
  rawPrecision: number;
  totalRows: number;
  unit: string | null;
  values: number[];
};

export type MetricsTimelineItem =
  | {
      kind: "record";
      row: ParsedMetricRow;
    }
  | {
      kind: "summary";
      summary: MetricsSummaryRow;
    };

export function logicalMetricsBaseName(fileName: string, extensions: string[]): string {
  const matchingExtension = extensions.find((extension) => fileName.endsWith(extension));
  if (matchingExtension) {
    return fileName.slice(0, -matchingExtension.length);
  }

  return fileName;
}

export function capitalizeDisplayName(value: string): string {
  if (value.length === 0) {
    return "Metrics";
  }

  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

export function formatMetricValue(row: ParsedMetricRow): string | null {
  const value = row.metric?.value;
  const unit = row.metric?.unit;

  if (typeof value !== "number") {
    return null;
  }

  return formatMetricDisplayValue(value, unit, {
    includeUnit: true,
    metricKey: row.metric?.key,
    rawPrecision: rawValuePrecision(row.rawLine),
  });
}

export function resolvedTimeRangeForSettings(
  viewState: MetricsViewState,
  config: MetricsTimeBoundaryConfig,
): {
  fromDate: string;
  toDate: string;
} {
  const today = currentEffectiveDate(config);

  switch (viewState.timeRange) {
    case "today":
      return {
        fromDate: toLocalDateString(today),
        toDate: toLocalDateString(today),
      };
    case "this-week":
      return {
        fromDate: toLocalDateString(startOfWeek(today, config.weekStartsOn)),
        toDate: toLocalDateString(today),
      };
    case "past-7-days":
      return {
        fromDate: toLocalDateString(addDays(today, -6)),
        toDate: toLocalDateString(today),
      };
    case "past-30-days":
      return {
        fromDate: toLocalDateString(addDays(today, -29)),
        toDate: toLocalDateString(today),
      };
    case "past-3-months":
      return {
        fromDate: toLocalDateString(addMonths(today, -3)),
        toDate: toLocalDateString(today),
      };
    case "past-6-months":
      return {
        fromDate: toLocalDateString(addMonths(today, -6)),
        toDate: toLocalDateString(today),
      };
    case "past-1-year":
      return {
        fromDate: toLocalDateString(addYears(today, -1)),
        toDate: toLocalDateString(today),
      };
    case "this-month":
      return {
        fromDate: toLocalDateString(startOfMonth(today)),
        toDate: toLocalDateString(today),
      };
    case "custom":
      return {
        fromDate: viewState.fromDate,
        toDate: viewState.toDate,
      };
    case "all":
    default:
      return {
        fromDate: "",
        toDate: "",
      };
  }
}

function rowSearchText(row: ParsedMetricRow): string {
  const parts = [
    row.metric?.id,
    row.metric?.key,
    displayMetricKey(row.metric?.key),
    row.metric?.source,
    row.metric?.origin_id,
    row.metric?.note,
    row.metric?.unit,
    row.metric?.date,
    row.rawLine,
  ];

  if (Array.isArray(row.metric?.tags)) {
    parts.push(row.metric.tags.join(" "));
  }

  return parts
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ")
    .toLowerCase();
}

export function alternateMetricLabel(metricKey: string, mode: MetricNameDisplayMode): string | null {
  const alternateMode = mode === "friendly" ? "key" : "friendly";
  const alternate = displayMetricName(metricKey, alternateMode);
  const current = displayMetricName(metricKey, mode);
  return alternate === current ? null : alternate;
}

export function collectFilterValues(
  rows: ParsedMetricRow[],
  field: "key" | "source",
  metricNameDisplayMode: MetricNameDisplayMode,
): string[] {
  const values = Array.from(
    new Set(
      rows
        .map((row) => row.metric?.[field])
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  );

  return values.sort((left, right) =>
    field === "key"
      ? compareMetricKeys(left, right, metricNameDisplayMode)
      : left.localeCompare(right),
  );
}

export function withSelectedFilterValue(options: string[], selected: string): string[] {
  if (selected.length === 0 || options.includes(selected)) {
    return options;
  }

  return [selected, ...options];
}

export function withSelectedFilterValues(options: string[], selected: string[]): string[] {
  if (selected.length === 0) {
    return options;
  }

  const missingSelected = selected.filter((value) => value.length > 0 && !options.includes(value));
  if (missingSelected.length === 0) {
    return options;
  }

  return [...missingSelected, ...options];
}

export function toggleSelectedFilterValue(selected: string[], value: string): string[] {
  return selected.includes(value)
    ? selected.filter((item) => item !== value)
    : [...selected, value];
}

export function metricFilterLabel(
  selectedKeys: string[],
  metricNameDisplayMode: MetricNameDisplayMode,
): string {
  if (selectedKeys.length === 0) {
    return "All metrics";
  }

  if (selectedKeys.length === 1) {
    return displayMetricOption(selectedKeys[0], metricNameDisplayMode);
  }

  return `${selectedKeys.length} metrics`;
}

export function metricFilterTitle(
  selectedKeys: string[],
  metricNameDisplayMode: MetricNameDisplayMode,
): string {
  if (selectedKeys.length === 0) {
    return "All metrics";
  }

  return selectedKeys
    .map((key) => displayMetricOption(key, metricNameDisplayMode))
    .join(", ");
}

export function metricFilterAriaLabel(
  selectedKeys: string[],
  metricNameDisplayMode: MetricNameDisplayMode,
): string {
  if (selectedKeys.length === 0) {
    return "Filter by metric. All metrics visible.";
  }

  if (selectedKeys.length === 1) {
    return `Filter by metric. ${displayMetricOption(selectedKeys[0], metricNameDisplayMode)} selected.`;
  }

  return `Filter by metric. ${selectedKeys.length} metrics selected.`;
}

export function uniqueLineNumbers(lineNumbers: number[]): number[] {
  return Array.from(new Set(lineNumbers));
}

export function applyMetricsViewState(
  rows: ParsedMetricRow[],
  viewState: MetricsViewState,
  config: MetricsTimeBoundaryConfig,
): ParsedMetricRow[] {
  const normalizedSearch = viewState.searchText.trim().toLowerCase();
  const { fromDate, toDate } = resolvedTimeRangeForSettings(viewState, config);
  const selectedKeys = new Set(viewState.keys);

  const filteredRows = rows.filter((row) => {
    if (selectedKeys.size > 0 && !selectedKeys.has(row.metric?.key ?? "")) {
      return false;
    }

    if (viewState.source && row.metric?.source !== viewState.source) {
      return false;
    }

    if (viewState.status !== "all" && row.status !== viewState.status) {
      return false;
    }

    const rowDate = rowDateValue(row, config);
    if (fromDate && (!rowDate || rowDate < fromDate)) {
      return false;
    }

    if (toDate && (!rowDate || rowDate > toDate)) {
      return false;
    }

    if (normalizedSearch.length > 0 && !rowSearchText(row).includes(normalizedSearch)) {
      return false;
    }

    return true;
  });

  return [...filteredRows].sort((left: ParsedMetricRow, right: ParsedMetricRow) => {
    if (viewState.sortOrder === "newest") {
      const leftTimestamp = rowTimestamp(left);
      const rightTimestamp = rowTimestamp(right);
      if (leftTimestamp !== null && rightTimestamp !== null && leftTimestamp !== rightTimestamp) {
        return rightTimestamp - leftTimestamp;
      }
      if (leftTimestamp !== null) {
        return -1;
      }
      if (rightTimestamp !== null) {
        return 1;
      }
      return right.lineNumber - left.lineNumber;
    }

    if (viewState.sortOrder === "oldest") {
      const leftTimestamp = rowTimestamp(left);
      const rightTimestamp = rowTimestamp(right);
      if (leftTimestamp !== null && rightTimestamp !== null && leftTimestamp !== rightTimestamp) {
        return leftTimestamp - rightTimestamp;
      }
      if (leftTimestamp !== null) {
        return -1;
      }
      if (rightTimestamp !== null) {
        return 1;
      }
      return left.lineNumber - right.lineNumber;
    }

    if (viewState.sortOrder === "value-desc" || viewState.sortOrder === "value-asc") {
      const leftValue = left.metric?.value;
      const rightValue = right.metric?.value;
      const leftIsNumber = typeof leftValue === "number" && Number.isFinite(leftValue);
      const rightIsNumber = typeof rightValue === "number" && Number.isFinite(rightValue);

      if (leftIsNumber && rightIsNumber && leftValue !== rightValue) {
        return viewState.sortOrder === "value-desc"
          ? rightValue - leftValue
          : leftValue - rightValue;
      }

      if (leftIsNumber) {
        return -1;
      }

      if (rightIsNumber) {
        return 1;
      }
    }

    return right.lineNumber - left.lineNumber;
  });
}

export function summaryComputationLabel(computation: MetricsSummaryComputation): string {
  switch (computation) {
    case "avg":
      return "Average";
    case "median":
      return "Median";
    case "min":
      return "Minimum";
    case "max":
      return "Maximum";
    case "sum":
      return "Sum";
    case "count":
      return "Count";
    case "none":
    default:
      return "Summary";
  }
}

export function summaryComputationSummaryLabel(computation: MetricsSummaryComputation): string | null {
  switch (computation) {
    case "avg":
      return "average summaries";
    case "median":
      return "median summaries";
    case "min":
      return "minimum summaries";
    case "max":
      return "maximum summaries";
    case "sum":
      return "sum summaries";
    case "count":
      return "count summaries";
    case "none":
    default:
      return null;
  }
}

export function hasActiveTimeRange(viewState: MetricsViewState): boolean {
  if (viewState.timeRange === "all") {
    return false;
  }

  if (viewState.timeRange === "custom") {
    return viewState.fromDate.length > 0 || viewState.toDate.length > 0;
  }

  return true;
}

export function filterBarControlCount(viewState: MetricsViewState): number {
  let count = 0;

  if (hasActiveTimeRange(viewState)) {
    count += 1;
  }

  if (viewState.keys.length > 0) {
    count += 1;
  }

  if (viewState.searchText.trim().length > 0) {
    count += 1;
  }

  if (viewState.source.length > 0) {
    count += 1;
  }

  if (viewState.status !== "all") {
    count += 1;
  }

  if (viewState.groupBy !== "none") {
    count += 1;
  }

  if (viewState.summaryComputation !== "none") {
    count += 1;
  }

  return count;
}

export function hasActiveViewControls(viewState: MetricsViewState): boolean {
  return (
    filterBarControlCount(viewState) > 0 ||
    viewState.showChart !== DEFAULT_VIEW_STATE.showChart ||
    viewState.sortOrder !== DEFAULT_VIEW_STATE.sortOrder
  );
}

export function advancedControlCount(viewState: MetricsViewState): number {
  let count = 0;

  if (viewState.source.length > 0) {
    count += 1;
  }

  if (viewState.status !== "all") {
    count += 1;
  }

  if (viewState.groupBy !== "none") {
    count += 1;
  }

  if (viewState.summaryComputation !== "none") {
    count += 1;
  }

  return count;
}

function summaryBucketKey(metricKey: string, unit: string | null): string {
  return `${metricKey}::${unit ?? "__no_unit__"}`;
}

export function summarizeValues(values: number[], computation: MetricsSummaryComputation): number | null {
  if (values.length === 0) {
    return null;
  }

  switch (computation) {
    case "avg":
      return values.reduce((total, value) => total + value, 0) / values.length;
    case "median": {
      const sorted = [...values].sort((left, right) => left - right);
      const middle = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0
        ? (sorted[middle - 1] + sorted[middle]) / 2
        : sorted[middle];
    }
    case "min":
      return Math.min(...values);
    case "max":
      return Math.max(...values);
    case "sum":
      return values.reduce((total, value) => total + value, 0);
    case "count":
      return values.length;
    case "none":
    default:
      return null;
  }
}

export function formatRowCount(count: number): string {
  return `${count} ${count === 1 ? "row" : "rows"}`;
}

export function buildMetricsSummaryRows(
  rows: ParsedMetricRow[],
  computation: MetricsSummaryComputation,
  metricNameDisplayMode: MetricNameDisplayMode,
): MetricsSummaryRow[] {
  if (computation === "none") {
    return [];
  }

  const buckets = new Map<string, MetricsSummaryBucket>();

  rows.forEach((row) => {
    const metricKey = typeof row.metric?.key === "string" && row.metric.key.length > 0 ? row.metric.key : null;
    if (!metricKey) {
      return;
    }

    const unit = normalizeMetricUnitKey(row.metric?.unit);
    const bucketKey = summaryBucketKey(metricKey, unit);
    const current = buckets.get(bucketKey) ?? {
      metricKey,
      rawPrecision: 0,
      totalRows: 0,
      unit,
      values: [],
    };
    current.totalRows += 1;

    const value = row.metric?.value;
    if (typeof value === "number" && Number.isFinite(value)) {
      current.values.push(value);
      current.rawPrecision = Math.max(current.rawPrecision, rawValuePrecision(row.rawLine));
    }

    buckets.set(bucketKey, current);
  });

  const bucketCountByMetric = new Map<string, number>();
  buckets.forEach((bucket) => {
    if (bucket.values.length === 0) {
      return;
    }

    bucketCountByMetric.set(bucket.metricKey, (bucketCountByMetric.get(bucket.metricKey) ?? 0) + 1);
  });

  return Array.from(buckets.values()).flatMap((bucket) => {
    const value = summarizeValues(bucket.values, computation);
    if (value === null) {
      return [];
    }

    const note =
      bucket.totalRows > bucket.values.length
        ? `${formatRowCount(bucket.values.length)} used, ${formatRowCount(bucket.totalRows - bucket.values.length)} skipped`
        : undefined;
    const showUnitLabel =
      computation === "count" || (bucketCountByMetric.get(bucket.metricKey) ?? 0) > 1;
    const unitLabel = showUnitLabel
      ? bucket.unit === null
        ? "No unit"
        : displayMetricUnit(bucket.unit) ?? bucket.unit
      : undefined;

    return [
      {
        computation,
        label: displayMetricName(bucket.metricKey, metricNameDisplayMode),
        metricKey: bucket.metricKey,
        note,
        rawPrecision: bucket.rawPrecision,
        unit: computation === "count" ? null : bucket.unit,
        unitLabel,
        value,
      },
    ];
  });
}

function groupRowsByTemporal(
  rows: ParsedMetricRow[],
  grouping: "day" | "week" | "month" | "year",
  config: MetricsTimeBoundaryConfig,
): MetricsRowGroup[] {
  const groups = new Map<string, ParsedMetricRow[]>();
  const headings = new Map<string, { heading: string; headingParts?: MetricsHeadingPart[]; linkTarget?: string }>();

  rows.forEach((row) => {
    const bucket = rowTemporalBucket(row, grouping, config);
    const key = bucket?.key ?? "__no_date__";
    const current = groups.get(key) ?? [];
    current.push(row);
    groups.set(key, current);
    if (bucket) {
      headings.set(key, {
        heading: bucket.heading,
        headingParts: bucket.headingParts,
        linkTarget: bucket.linkTarget,
      });
    }
  });

  return Array.from(groups.entries()).map(([key, groupedRows]) => ({
    heading: key === "__no_date__" ? "No date" : (headings.get(key)?.heading ?? key),
    headingParts: key === "__no_date__" ? undefined : headings.get(key)?.headingParts,
    key,
    linkTarget: key === "__no_date__" ? undefined : headings.get(key)?.linkTarget,
    rows: groupedRows,
  }));
}

function groupRowsByField(
  rows: ParsedMetricRow[],
  field: "key" | "source",
  metricNameDisplayMode: MetricNameDisplayMode,
): MetricsRowGroup[] {
  const groups = new Map<string, ParsedMetricRow[]>();

  rows.forEach((row) => {
    const value = row.metric?.[field];
    const key = typeof value === "string" && value.length > 0 ? value : "__empty__";
    const current = groups.get(key) ?? [];
    current.push(row);
    groups.set(key, current);
  });

  return Array.from(groups.entries()).map(([key, groupedRows]) => ({
    heading:
      key === "__empty__"
        ? field === "key"
          ? "No metric"
          : "No source"
        : field === "key"
          ? displayMetricName(key, metricNameDisplayMode)
          : key,
    key,
    rows: groupedRows,
  }));
}

export function groupedRows(
  rows: ParsedMetricRow[],
  groupBy: MetricsGroupBy,
  metricNameDisplayMode: MetricNameDisplayMode,
  config: MetricsTimeBoundaryConfig,
): MetricsRowGroup[] {
  switch (groupBy) {
    case "day":
    case "week":
    case "month":
    case "year":
      return groupRowsByTemporal(rows, groupBy, config);
    case "key":
      return groupRowsByField(rows, "key", metricNameDisplayMode);
    case "source":
      return groupRowsByField(rows, "source", metricNameDisplayMode);
    case "none":
    default:
      return [];
  }
}

export function groupBySummaryLabel(groupBy: MetricsGroupBy): string | null {
  switch (groupBy) {
    case "day":
      return "grouped by day";
    case "week":
      return "grouped by week";
    case "month":
      return "grouped by month";
    case "year":
      return "grouped by year";
    case "key":
      return "grouped by metric";
    case "source":
      return "grouped by source";
    case "none":
    default:
      return null;
  }
}
