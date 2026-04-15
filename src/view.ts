import { Menu, Notice, setIcon, TFile, TextFileView, WorkspaceLeaf } from "obsidian";

import { buildMetricsChartModel } from "./chart-model";
import { renderMetricsChart, type MetricsChartSelection } from "./chart-renderer";
import { toMetricReference, type MetricRecord } from "./contract";
import type MetricsPlugin from "./main";
import {
  compareMetricKeys,
  displayMetricKey,
  displayMetricName,
  displayMetricOption,
  displayMetricUnit,
  normalizeMetricUnitKey,
  type MetricNameDisplayMode,
} from "./metric-catalog";
import { metricIconForKey } from "./metric-icons";
import {
  formatMetricDisplayValue,
  rawValuePrecision,
  resolveMetricFractionDigits,
} from "./metric-value-format";
import {
  analyzeMetricsData,
  type MetricsFileAnalysis,
  type ParsedMetricRow,
} from "./metrics-file-model";
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
import {
  createDefaultViewState,
  DEFAULT_VIEW_STATE,
  type MetricsGroupBy,
  type MetricsSortOrder,
  type MetricsStatusFilter,
  type MetricsSummaryComputation,
  type MetricsTimeRange,
  type MetricsViewState,
} from "./view-state";

export const METRICS_VIEW_TYPE = "metrics-file-view";

interface ControlFocusState {
  name: string;
  selectionEnd?: number;
  selectionStart?: number;
}

export function logicalMetricsBaseName(fileName: string, extensions: string[]): string {
  const matchingExtension = extensions.find((extension) => fileName.endsWith(extension));
  if (matchingExtension) {
    return fileName.slice(0, -matchingExtension.length);
  }

  return fileName;
}

function capitalizeDisplayName(value: string): string {
  if (value.length === 0) {
    return "Metrics";
  }

  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

function formatMetricValue(row: ParsedMetricRow): string | null {
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

function resolvedTimeRangeForSettings(
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

function alternateMetricLabel(metricKey: string, mode: MetricNameDisplayMode): string | null {
  const alternateMode = mode === "friendly" ? "key" : "friendly";
  const alternate = displayMetricName(metricKey, alternateMode);
  const current = displayMetricName(metricKey, mode);
  return alternate === current ? null : alternate;
}

function collectFilterValues(
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

function withSelectedFilterValue(options: string[], selected: string): string[] {
  if (selected.length === 0 || options.includes(selected)) {
    return options;
  }

  return [selected, ...options];
}

function withSelectedFilterValues(options: string[], selected: string[]): string[] {
  if (selected.length === 0) {
    return options;
  }

  const missingSelected = selected.filter((value) => value.length > 0 && !options.includes(value));
  if (missingSelected.length === 0) {
    return options;
  }

  return [...missingSelected, ...options];
}

function toggleSelectedFilterValue(selected: string[], value: string): string[] {
  return selected.includes(value)
    ? selected.filter((item) => item !== value)
    : [...selected, value];
}

function metricFilterLabel(
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

function metricFilterTitle(
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

function metricFilterAriaLabel(
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

function uniqueLineNumbers(lineNumbers: number[]): number[] {
  return Array.from(new Set(lineNumbers));
}

function applyMetricsViewState(
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

function summaryComputationLabel(computation: MetricsSummaryComputation): string {
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

function summaryComputationSummaryLabel(computation: MetricsSummaryComputation): string | null {
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

function hasActiveViewControls(viewState: MetricsViewState): boolean {
  return (
    filterBarControlCount(viewState) > 0 ||
    viewState.showChart !== DEFAULT_VIEW_STATE.showChart ||
    viewState.sortOrder !== DEFAULT_VIEW_STATE.sortOrder
  );
}

function filterBarControlCount(viewState: MetricsViewState): number {
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

function hasActiveTimeRange(viewState: MetricsViewState): boolean {
  if (viewState.timeRange === "all") {
    return false;
  }

  if (viewState.timeRange === "custom") {
    return viewState.fromDate.length > 0 || viewState.toDate.length > 0;
  }

  return true;
}

function advancedControlCount(viewState: MetricsViewState): number {
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

interface MetricsRowGroup {
  heading: string;
  headingParts?: MetricsHeadingPart[];
  key: string;
  linkTarget?: string;
  rows: ParsedMetricRow[];
}

interface MetricsSummaryBucket {
  metricKey: string;
  rawPrecision: number;
  totalRows: number;
  unit: string | null;
  values: number[];
}

interface MetricsSummaryRow {
  computation: MetricsSummaryComputation;
  label: string;
  metricKey: string;
  note?: string;
  rawPrecision: number;
  unit: string | null;
  unitLabel?: string;
  value: number;
}

type MetricsTimelineItem =
  | {
      kind: "record";
      row: ParsedMetricRow;
    }
  | {
      kind: "summary";
      summary: MetricsSummaryRow;
    };

function summaryBucketKey(metricKey: string, unit: string | null): string {
  return `${metricKey}::${unit ?? "__no_unit__"}`;
}

function summarizeValues(values: number[], computation: MetricsSummaryComputation): number | null {
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

function formatRowCount(count: number): string {
  return `${count} ${count === 1 ? "row" : "rows"}`;
}

function buildMetricsSummaryRows(
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

function groupedRows(
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

function groupBySummaryLabel(groupBy: MetricsGroupBy): string | null {
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

function renderGroupHeading(
  container: HTMLElement,
  group: MetricsRowGroup,
  plugin: MetricsPlugin,
  sourcePath: string,
): void {
  const heading = container.createEl("h2");

  if (group.headingParts && group.headingParts.length > 0) {
    group.headingParts.forEach((part) => {
      if (!part.linkTarget) {
        heading.createSpan({ text: part.text });
        return;
      }

      const link = heading.createEl("a", {
        cls: "internal-link",
        href: part.linkTarget,
        text: part.text,
      });
      link.dataset.href = part.linkTarget;
      link.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void plugin.app.workspace.openLinkText(part.linkTarget!, sourcePath);
      });
    });
    return;
  }

  if (!group.linkTarget) {
    heading.setText(group.heading);
    return;
  }

  const linkTarget = group.linkTarget;
  const link = heading.createEl("a", {
    cls: "internal-link",
    href: linkTarget,
    text: group.heading,
  });
  link.dataset.href = linkTarget;
  link.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    void plugin.app.workspace.openLinkText(linkTarget, sourcePath);
  });
}

function isEditableRecord(metric: Partial<MetricRecord> | null): metric is MetricRecord {
  return Boolean(
    metric &&
      typeof metric.id === "string" &&
      typeof metric.ts === "string" &&
      typeof metric.key === "string" &&
      typeof metric.value === "number" &&
      Number.isFinite(metric.value) &&
      typeof metric.source === "string",
  );
}

function formatTimelineTime(row: ParsedMetricRow): string {
  const ts = row.metric?.ts;
  if (typeof ts !== "string") {
    return "--:--";
  }

  const parsed = Date.parse(ts);
  if (Number.isNaN(parsed)) {
    return "--:--";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function formatTimelineDate(row: ParsedMetricRow): string {
  if (typeof row.metric?.date === "string") {
    return row.metric.date;
  }

  const ts = row.metric?.ts;
  if (typeof ts !== "string") {
    return "";
  }

  const parsed = Date.parse(ts);
  if (Number.isNaN(parsed)) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(parsed);
}

async function copyText(label: string, value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    new Notice(`Copied ${label}.`);
  } catch {
    new Notice(`Could not copy ${label}.`);
  }
}

function renderIssueList(container: HTMLElement, row: ParsedMetricRow): void {
  if (row.issues.length === 0) {
    return;
  }

  const issuesList = container.createEl("ul", { cls: "metrics-lens-issues" });
  row.issues.forEach((issue) => {
    issuesList.createEl("li", {
      cls: `is-${issue.severity}`,
      text: `${issue.severity === "warning" ? "Warning" : "Error"}: ${issue.message}`,
    });
  });
}

function openRecordMenu(
  event: MouseEvent,
  row: ParsedMetricRow,
  plugin: MetricsPlugin,
  file: TFile,
  referencePrefix: string,
): void {
  const menu = new Menu();
  let hasItems = false;

  if (typeof row.metric?.id === "string") {
    hasItems = true;
    menu.addItem((item) => {
      item.setTitle("Copy metric reference").setIcon("copy").onClick(() => {
        void copyText("metric reference", toMetricReference(row.metric!.id!, referencePrefix));
      });
    });

    menu.addItem((item) => {
      item.setTitle("Copy id").setIcon("copy").onClick(() => {
        void copyText("id", row.metric!.id!);
      });
    });
  }

  if (typeof row.metric?.origin_id === "string") {
    hasItems = true;
    menu.addItem((item) => {
      item.setTitle("Copy origin id").setIcon("copy").onClick(() => {
        void copyText("origin id", row.metric!.origin_id!);
      });
    });
  }

  if (typeof row.metric?.source === "string") {
    hasItems = true;
    menu.addItem((item) => {
      item.setTitle("Copy source").setIcon("copy").onClick(() => {
        void copyText("source", row.metric!.source!);
      });
    });
  }

  if (row.rawLine.trim().length > 0) {
    hasItems = true;
    menu.addItem((item) => {
      item.setTitle("Copy raw line").setIcon("copy").onClick(() => {
        void copyText("raw line", row.rawLine);
      });
    });
  }

  if (isEditableRecord(row.metric)) {
    const metric = row.metric;

    if (hasItems) {
      menu.addSeparator();
    }

    menu.addItem((item) => {
      item.setTitle("Edit").setIcon("pencil").onClick(() => {
        plugin.openEditRecordModal(file, metric);
      });
    });

    menu.addItem((item) => {
      item.setTitle("Delete").setIcon("trash").onClick(() => {
        plugin.confirmDeleteRecord(file, metric);
      });
    });
    hasItems = true;
  }

  if (!hasItems) {
    return;
  }

  menu.showAtMouseEvent(event);
}

function renderRecord(
  container: HTMLElement,
  row: ParsedMetricRow,
  plugin: MetricsPlugin,
  file: TFile,
  referencePrefix: string,
  options: {
    isFirst: boolean;
    isLast: boolean;
  },
): void {
  const rowEl = container.createDiv({
    cls: row.status === "valid" ? "metrics-lens-record" : ["metrics-lens-record", `is-${row.status}`],
  });
  rowEl.dataset.metricsLineNumber = String(row.lineNumber);
  rowEl.tabIndex = -1;
  if (typeof row.metric?.id === "string") {
    rowEl.dataset.metricId = row.metric.id;
  }
  if (options.isFirst) {
    rowEl.addClass("is-first");
  }
  if (options.isLast) {
    rowEl.addClass("is-last");
  }
  rowEl.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openRecordMenu(event, row, plugin, file, referencePrefix);
  });

  const timeEl = rowEl.createDiv({ cls: "metrics-lens-record-time" });
  timeEl.createSpan({
    cls: "metrics-lens-record-time-primary",
    text: formatTimelineTime(row),
  });

  const secondaryTime = formatTimelineDate(row);
  if (secondaryTime.length > 0) {
    timeEl.createSpan({
      cls: "metrics-lens-record-time-secondary",
      text: secondaryTime,
    });
  }

  const body = rowEl.createDiv({ cls: "metrics-lens-record-body" });
  const marker = body.createSpan({ cls: "metrics-lens-record-marker" });
  const metricDisplayMode = plugin.settings.metricNameDisplayMode;
  const metricKeyLabel = displayMetricName(row.metric?.key, metricDisplayMode);
  const iconId =
    plugin.settings.showMetricIcons && typeof row.metric?.key === "string"
      ? metricIconForKey(row.metric.key)
      : null;
  if (iconId) {
    marker.setAttribute("aria-hidden", "true");
    try {
      setIcon(marker, iconId);
      if (marker.querySelector("svg")) {
        marker.addClass("has-icon");
        body.addClass("has-icon-marker");
      }
    } catch {
      marker.empty();
    }
  }

  const main = body.createDiv({ cls: "metrics-lens-record-main" });
  const metricKeyEl = main.createSpan({
    cls: "metrics-lens-record-key",
    text: metricKeyLabel,
  });
  if (typeof row.metric?.key === "string") {
    const alternateLabel = alternateMetricLabel(row.metric.key, metricDisplayMode);
    if (alternateLabel) {
      metricKeyEl.setAttribute("title", alternateLabel);
    }
  }

  const metricValue = formatMetricValue(row);
  if (metricValue) {
    main.createSpan({
      cls: "metrics-lens-record-value",
      text: metricValue,
    });
  }

  if (typeof row.metric?.note === "string" && row.metric.note.length > 0) {
    body.createDiv({
      cls: "metrics-lens-record-note",
      text: row.metric.note,
    });
  }

  renderIssueList(body, row);

  if (!row.metric?.key) {
    body.createEl("pre", {
      cls: "metrics-lens-record-raw",
      text: row.rawLine,
    });
  }

  const menuButton = rowEl.createEl("button", {
    cls: ["clickable-icon", "metrics-lens-more-button"],
  });
  menuButton.type = "button";
  menuButton.setAttribute("aria-label", `More actions for ${metricKeyLabel}`);
  menuButton.setAttribute("data-tooltip-position", "left");
  setIcon(menuButton, "more-horizontal");
  menuButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openRecordMenu(event, row, plugin, file, referencePrefix);
  });
}

function formatSummaryValue(summary: MetricsSummaryRow): string {
  if (summary.computation === "count") {
    return summary.value.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    });
  }

  const digits = resolveMetricFractionDigits(summary.metricKey, summary.unit, {
    rawPrecision: summary.rawPrecision,
  });
  const maximumFractionDigits =
    (summary.computation === "avg" || summary.computation === "median") &&
    !Number.isInteger(summary.value)
      ? Math.max(digits.maximumFractionDigits, 1)
      : digits.maximumFractionDigits;

  return formatMetricDisplayValue(summary.value, summary.unit, {
    includeUnit: true,
    maximumFractionDigits,
    metricKey: summary.metricKey,
    minimumFractionDigits: Math.min(digits.minimumFractionDigits, maximumFractionDigits),
    rawPrecision: summary.rawPrecision,
  });
}

function renderSummaryRecord(
  container: HTMLElement,
  summary: MetricsSummaryRow,
  options: {
    isFirst: boolean;
    isLast: boolean;
  },
): void {
  const rowEl = container.createDiv({ cls: ["metrics-lens-record", "is-summary"] });
  if (options.isFirst) {
    rowEl.addClass("is-first");
  }
  if (options.isLast) {
    rowEl.addClass("is-last");
  }

  const timeEl = rowEl.createDiv({ cls: "metrics-lens-record-time" });
  timeEl.createSpan({
    cls: "metrics-lens-record-time-primary",
    text: summaryComputationLabel(summary.computation),
  });

  const body = rowEl.createDiv({ cls: "metrics-lens-record-body" });
  const marker = body.createSpan({ cls: "metrics-lens-record-marker" });
  marker.setAttribute("aria-hidden", "true");
  try {
    setIcon(marker, "calculator");
    if (marker.querySelector("svg")) {
      marker.addClass("has-icon");
      body.addClass("has-icon-marker");
    }
  } catch {
    marker.empty();
  }

  const main = body.createDiv({ cls: "metrics-lens-record-main" });
  main.createSpan({
    cls: "metrics-lens-record-key",
    text: summary.label,
  });
  if (summary.unitLabel) {
    main.createSpan({
      cls: "metrics-lens-record-summary-context",
      text: summary.unitLabel,
    });
  }
  main.createSpan({
    cls: "metrics-lens-record-value",
    text: formatSummaryValue(summary),
  });

  if (summary.note) {
    body.createDiv({
      cls: "metrics-lens-record-note",
      text: summary.note,
    });
  }

  rowEl.createDiv({ cls: "metrics-lens-record-actions-spacer" });
}

function renderTimelineItems(
  container: HTMLElement,
  items: MetricsTimelineItem[],
  plugin: MetricsPlugin,
  file: TFile,
  referencePrefix: string,
): void {
  items.forEach((item, index) => {
    const options = {
      isFirst: index === 0,
      isLast: index === items.length - 1,
    };

    if (item.kind === "record") {
      renderRecord(container, item.row, plugin, file, referencePrefix, options);
      return;
    }

    renderSummaryRecord(container, item.summary, options);
  });
}

export class MetricsFileView extends TextFileView {
  allowNoFile = true;
  private advancedControlsExpanded = false;
  private addRecordActionEl: HTMLElement | null = null;
  private chartActionEl: HTMLElement | null = null;
  private clearTargetedRecordTimeout: number | null = null;
  private filterActionEl: HTMLElement | null = null;
  private metricsAnalysisCache: { data: string; analysis: MetricsFileAnalysis } | null = null;
  private pendingControlFocus: ControlFocusState | null = null;
  private pendingMetricLineNumberFocus: number | null = null;
  private pendingMetricIdFocus: string | null = null;
  private searchRenderTimeout: number | null = null;
  private sortActionEl: HTMLElement | null = null;
  private viewState: MetricsViewState = createDefaultViewState();
  private viewActionSeparatorEl: HTMLElement | null = null;
  private viewStateFilePath: string | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly plugin: MetricsPlugin,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return METRICS_VIEW_TYPE;
  }

  getDisplayText(): string {
    if (!this.file) {
      return "Metrics";
    }

    const baseName = logicalMetricsBaseName(this.file.name, this.plugin.settings.supportedExtensions);
    return capitalizeDisplayName(baseName);
  }

  getIcon(): string {
    return "list";
  }

  async onOpen(): Promise<void> {
    this.contentEl.classList.add("metrics-lens-view-root");
    this.ensureHeaderActions();
    this.render();
  }

  async onClose(): Promise<void> {
    if (this.clearTargetedRecordTimeout !== null) {
      window.clearTimeout(this.clearTargetedRecordTimeout);
      this.clearTargetedRecordTimeout = null;
    }

    this.clearSearchRenderTimeout();
  }

  clear(): void {
    this.data = "";
    this.render();
  }

  getViewData(): string {
    return this.data ?? "";
  }

  setViewData(data: string, clear: boolean): void {
    this.data = data;

    if (clear) {
      this.clear();
      this.data = data;
    }

    this.render();
  }

  refreshView(): void {
    this.render();
  }

  focusMetricRecord(metricId: string): void {
    if (this.file) {
      this.viewStateFilePath = this.file.path;
    }
    const { showChart, showFilters } = this.viewState;
    this.viewState = createDefaultViewState();
    this.viewState.showChart = showChart;
    this.viewState.showFilters = showFilters;
    this.advancedControlsExpanded = false;
    this.pendingMetricLineNumberFocus = null;
    this.pendingMetricIdFocus = metricId;
    this.render();
  }

  focusMetricLineNumber(lineNumber: number): void {
    if (this.file) {
      this.viewStateFilePath = this.file.path;
    }
    const { showChart, showFilters } = this.viewState;
    this.viewState = createDefaultViewState();
    this.viewState.showChart = showChart;
    this.viewState.showFilters = showFilters;
    this.advancedControlsExpanded = false;
    this.pendingMetricIdFocus = null;
    this.pendingMetricLineNumberFocus = lineNumber;
    this.render();
  }

  private ensureHeaderActions(): void {
    if (!this.sortActionEl) {
      this.sortActionEl = this.addAction("arrow-up-down", "Sort metrics", () => {
        if (!this.file) {
          new Notice("Open a metrics file first.");
          return;
        }

        this.openSortMenu(this.sortActionEl);
      });
    }

    if (!this.filterActionEl) {
      this.filterActionEl = this.addAction("filter", "Hide filters", () => {
        if (!this.file) {
          new Notice("Open a metrics file first.");
          return;
        }

        this.viewState.showFilters = !this.viewState.showFilters;
        this.persistCurrentViewState();
        this.render();
      });
    }

    if (!this.chartActionEl) {
      this.chartActionEl = this.addAction("chart-line", "Show chart", () => {
        if (!this.file) {
          new Notice("Open a metrics file first.");
          return;
        }

        this.viewState.showChart = !this.viewState.showChart;
        this.persistCurrentViewState();
        this.render();
      });
    }

    if (!this.addRecordActionEl) {
      this.addRecordActionEl = this.addAction("plus", "Add record", () => {
        if (!this.file) {
          new Notice("Open a metrics file first.");
          return;
        }

        this.plugin.openCreateRecordModal(this.file);
      });
    }

    if (
      this.addRecordActionEl &&
      this.chartActionEl &&
      this.filterActionEl &&
      this.sortActionEl &&
      this.addRecordActionEl.parentElement
    ) {
      const actionsContainer = this.addRecordActionEl.parentElement;

      if (!this.viewActionSeparatorEl) {
        this.viewActionSeparatorEl = actionsContainer.createDiv({
          cls: "metrics-lens-view-action-separator",
        });
      }

      [
        this.addRecordActionEl,
        this.viewActionSeparatorEl,
        this.chartActionEl,
        this.filterActionEl,
        this.sortActionEl,
      ].forEach((element) => {
        actionsContainer.appendChild(element);
      });
    }

    this.syncHeaderActions();
  }

  private syncHeaderActions(): void {
    const activeFilterBarControls = filterBarControlCount(this.viewState);
    const filtersAriaLabel = this.viewState.showFilters
      ? activeFilterBarControls > 0
        ? `Hide filters (${activeFilterBarControls} active)`
        : "Hide filters"
      : activeFilterBarControls > 0
        ? `Show filters (${activeFilterBarControls} active)`
        : "Show filters";

    if (this.chartActionEl) {
      this.chartActionEl.toggleClass("is-active", this.viewState.showChart);
      this.chartActionEl.setAttribute(
        "aria-label",
        this.viewState.showChart ? "Hide chart" : "Show chart",
      );
      this.chartActionEl.setAttribute("data-tooltip-position", "bottom");
    }

    if (this.filterActionEl) {
      this.filterActionEl.classList.add("metrics-lens-view-action");
      this.filterActionEl.toggleClass("is-active", this.viewState.showFilters);
      setIcon(this.filterActionEl, activeFilterBarControls > 0 ? "list-filter" : "filter");
      this.filterActionEl.setAttribute("aria-label", filtersAriaLabel);
      this.filterActionEl.setAttribute("data-tooltip-position", "bottom");
    }

    if (this.sortActionEl) {
      this.sortActionEl.classList.add("metrics-lens-view-action");
      this.sortActionEl.toggleClass(
        "is-active",
        this.viewState.sortOrder !== DEFAULT_VIEW_STATE.sortOrder,
      );
      this.sortActionEl.setAttribute(
        "aria-label",
        `Sort metrics: ${this.sortOrderLabel(this.viewState.sortOrder)}`,
      );
      this.sortActionEl.setAttribute("data-tooltip-position", "bottom");
    }

    if (this.addRecordActionEl) {
      this.addRecordActionEl.setAttribute("aria-label", "Add record");
      this.addRecordActionEl.setAttribute("data-tooltip-position", "bottom");
    }
  }

  private openSortMenu(anchorEl: HTMLElement | null): void {
    const menu = new Menu();
    [
      { label: "Newest first", value: "newest" as MetricsSortOrder },
      { label: "Oldest first", value: "oldest" as MetricsSortOrder },
      { label: "Value high-low", value: "value-desc" as MetricsSortOrder },
      { label: "Value low-high", value: "value-asc" as MetricsSortOrder },
    ].forEach((option) => {
      menu.addItem((item) => {
        item
          .setTitle(option.label)
          .setChecked(this.viewState.sortOrder === option.value)
          .onClick(() => {
            this.viewState.sortOrder = option.value;
            this.persistCurrentViewState();
            this.render();
          });
      });
    });

    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      menu.showAtPosition({
        overlap: true,
        width: rect.width,
        x: rect.left,
        y: rect.bottom,
      });
      return;
    }

    menu.showAtPosition({
      x: window.innerWidth / 2,
      y: 80,
    });
  }

  private persistCurrentViewState(): void {
    this.plugin.persistViewState(this.viewStateFilePath, this.viewState, this.advancedControlsExpanded);
  }

  private resetCurrentViewState(): void {
    this.viewState = createDefaultViewState();
    this.advancedControlsExpanded = false;
    this.plugin.resetPersistedViewState(this.viewStateFilePath);
  }

  private renderChart(container: HTMLElement, visibleRows: ParsedMetricRow[]): void {
    if (!this.viewState.showChart || visibleRows.length === 0) {
      return;
    }

    const chartModel = buildMetricsChartModel(visibleRows, this.viewState.groupBy, {
      dayStartHour: this.plugin.settings.dayStartHour,
      weekStartsOn: this.plugin.settings.weekStartsOn,
    });
    if (!chartModel) {
      return;
    }

    renderMetricsChart(container, chartModel, {
      onSelect: (selection) => {
        this.focusChartSelection(selection);
      },
    });
  }

  private render(): void {
    this.clearSearchRenderTimeout();
    this.contentEl.empty();

    const container = this.contentEl.createDiv({ cls: "metrics-lens-view" });

    if (!this.file) {
      container.createEl("p", {
        cls: "metrics-lens-empty",
        text: "Choose a `*.metrics.ndjson` file from the file browser.",
      });
      return;
    }

    const currentFile = this.file;
    if (this.viewStateFilePath !== currentFile.path) {
      const persistedViewState = this.plugin.getPersistedViewState(currentFile.path);
      this.advancedControlsExpanded = persistedViewState.advancedControlsExpanded;
      this.viewState = persistedViewState.viewState;
      this.viewStateFilePath = currentFile.path;
    }

    const analysis = this.getMetricsAnalysis();
    const availableKeys = withSelectedFilterValues(
      collectFilterValues(analysis.rows, "key", this.plugin.settings.metricNameDisplayMode),
      this.viewState.keys,
    );
    const availableSources = withSelectedFilterValue(
      collectFilterValues(analysis.rows, "source", this.plugin.settings.metricNameDisplayMode),
      this.viewState.source,
    );
    const normalizedViewState = this.normalizeViewState();
    if (normalizedViewState) {
      this.persistCurrentViewState();
    }
    const visibleRows = applyMetricsViewState(analysis.rows, this.viewState, {
      dayStartHour: this.plugin.settings.dayStartHour,
      weekStartsOn: this.plugin.settings.weekStartsOn,
    });
    const hasActiveControls = hasActiveViewControls(this.viewState);
    this.syncHeaderActions();

    this.renderChart(container, visibleRows);

    if (analysis.rows.length > 0 || hasActiveControls) {
      this.renderControls(container, availableKeys, availableSources);
    }

    if (analysis.issueSummary.length > 0) {
      const issuesSection = container.createDiv({ cls: "metrics-lens-section" });
      const issuesList = issuesSection.createEl("ul", { cls: "metrics-lens-validation" });
      analysis.issueSummary.slice(0, 8).forEach((summary) => {
        issuesList.createEl("li", {
          cls: `is-${summary.severity}`,
          text: `${summary.message} (${summary.count})`,
        });
      });
    }

    if (analysis.rows.length === 0) {
      container.createEl("p", {
        cls: "metrics-lens-section",
        text: "No records in this file yet.",
      });
    } else if (visibleRows.length === 0) {
      const emptyState = container.createDiv({ cls: "metrics-lens-section" });
      emptyState.createEl("p", {
        cls: "metrics-lens-empty",
        text: "No records match the current view.",
      });
    } else {
      const recordsSection = container.createDiv({ cls: "metrics-lens-section" });
      if (this.viewState.groupBy !== "none") {
        groupedRows(
          visibleRows,
          this.viewState.groupBy,
          this.plugin.settings.metricNameDisplayMode,
          {
            dayStartHour: this.plugin.settings.dayStartHour,
            weekStartsOn: this.plugin.settings.weekStartsOn,
          },
        ).forEach((group) => {
          const groupSection = recordsSection.createDiv({ cls: "metrics-lens-group" });
          const headingContainer = groupSection.createDiv({
            cls: ["metrics-lens-group-heading", "markdown-reading-view"],
          });
          renderGroupHeading(headingContainer, group, this.plugin, currentFile.path);

          const recordsList = groupSection.createDiv({ cls: "metrics-lens-records" });
          const timelineItems: MetricsTimelineItem[] = [
            ...group.rows.map((row) => ({ kind: "record" as const, row })),
            ...buildMetricsSummaryRows(
              group.rows,
              this.viewState.summaryComputation,
              this.plugin.settings.metricNameDisplayMode,
            ).map((summary) => ({
              kind: "summary" as const,
              summary,
            })),
          ];
          renderTimelineItems(
            recordsList,
            timelineItems,
            this.plugin,
            currentFile,
            this.plugin.settings.recordReferencePrefix,
          );
        });
      } else {
        const recordsList = recordsSection.createDiv({ cls: "metrics-lens-records" });
        const timelineItems: MetricsTimelineItem[] = [
          ...visibleRows.map((row) => ({ kind: "record" as const, row })),
          ...buildMetricsSummaryRows(
            visibleRows,
            this.viewState.summaryComputation,
            this.plugin.settings.metricNameDisplayMode,
          ).map((summary) => ({
            kind: "summary" as const,
            summary,
          })),
        ];
        renderTimelineItems(
          recordsList,
          timelineItems,
          this.plugin,
          currentFile,
          this.plugin.settings.recordReferencePrefix,
        );
      }
    }

    const summaryParts =
      visibleRows.length === analysis.totalRows
        ? [`${analysis.totalRows} rows`]
        : [`${visibleRows.length} of ${analysis.totalRows} rows`];
    const flaggedRows = analysis.warningRows + analysis.errorRows;
    if (flaggedRows > 0) {
      summaryParts.push(`${flaggedRows} flagged`);
    }
    if (analysis.legacyRows > 0) {
      summaryParts.push(`${analysis.legacyRows} missing ids`);
    }
    if (this.viewState.sortOrder !== "newest") {
      summaryParts.push(this.sortOrderLabel(this.viewState.sortOrder));
    }
    const groupingLabel = groupBySummaryLabel(this.viewState.groupBy);
    if (groupingLabel) {
      summaryParts.push(groupingLabel);
    }
    const summaryLabel = summaryComputationSummaryLabel(this.viewState.summaryComputation);
    if (summaryLabel) {
      summaryParts.push(summaryLabel);
    }

    const footer = container.createDiv({ cls: "metrics-lens-footer" });
    footer.createSpan({
      cls: "metrics-lens-file-meta",
      text: `${currentFile.path} · ${summaryParts.join(" · ")}`,
    });

    if (analysis.legacyRows > 0) {
      const assignButton = footer.createEl("button", { text: "Assign missing ids" });
      assignButton.type = "button";
      assignButton.setAttribute("aria-label", "Assign missing ids in this metrics file");
      assignButton.addEventListener("click", () => {
        if (!this.file) {
          return;
        }

        void this.plugin.assignMissingIds(this.file);
      });
    }

    this.revealPendingMetricRecord();
    this.restorePendingControlFocus();
  }

  private renderControls(
    container: HTMLElement,
    availableKeys: string[],
    availableSources: string[],
  ): void {
    if (!this.viewState.showFilters) {
      return;
    }

    const controls = container.createDiv({ cls: ["metrics-lens-section", "metrics-lens-controls"] });
    const primaryControls = controls.createDiv({ cls: "metrics-lens-primary-controls" });
    const showAdvancedControls = this.advancedControlsExpanded;
    const activeAdvancedControls = advancedControlCount(this.viewState);

    const timeRangeSelect = primaryControls.createEl("select", { cls: "metrics-lens-control" });
    timeRangeSelect.dataset.metricsControl = "timeRange";
    timeRangeSelect.setAttribute("aria-label", "Filter by time range");
    [
      { label: "All time", value: "all" },
      { label: "Today", value: "today" },
      { label: "This week", value: "this-week" },
      { label: "Past 7 days", value: "past-7-days" },
      { label: "Past 30 days", value: "past-30-days" },
      { label: "Past 3 months", value: "past-3-months" },
      { label: "Past 6 months", value: "past-6-months" },
      { label: "Past 1 year", value: "past-1-year" },
      { label: "This month", value: "this-month" },
      { label: "Custom range", value: "custom" },
    ].forEach((option) => {
      timeRangeSelect.createEl("option", {
        text: option.label,
        value: option.value,
      });
    });
    timeRangeSelect.value = this.viewState.timeRange;
    timeRangeSelect.addEventListener("change", () => {
      this.pendingControlFocus = { name: "timeRange" };
      this.viewState.timeRange = timeRangeSelect.value as MetricsTimeRange;
      this.persistCurrentViewState();
      this.render();
    });

    if (this.viewState.timeRange === "custom") {
      const fromDateInput = primaryControls.createEl("input", {
        cls: "metrics-lens-control",
        type: "date",
      });
      fromDateInput.dataset.metricsControl = "fromDate";
      fromDateInput.value = this.viewState.fromDate;
      fromDateInput.setAttribute("aria-label", "Filter from date");
      fromDateInput.addEventListener("change", () => {
        this.pendingControlFocus = this.controlFocusState("fromDate", fromDateInput);
        this.viewState.fromDate = fromDateInput.value;
        this.persistCurrentViewState();
        this.render();
      });

      const toDateInput = primaryControls.createEl("input", {
        cls: "metrics-lens-control",
        type: "date",
      });
      toDateInput.dataset.metricsControl = "toDate";
      toDateInput.value = this.viewState.toDate;
      toDateInput.setAttribute("aria-label", "Filter to date");
      toDateInput.addEventListener("change", () => {
        this.pendingControlFocus = this.controlFocusState("toDate", toDateInput);
        this.viewState.toDate = toDateInput.value;
        this.persistCurrentViewState();
        this.render();
      });
    }

    const keyFilterButton = primaryControls.createEl("button", {
      cls: ["metrics-lens-control", "metrics-lens-select-button"],
    });
    keyFilterButton.type = "button";
    keyFilterButton.dataset.metricsControl = "keys";
    keyFilterButton.setAttribute("aria-haspopup", "menu");
    keyFilterButton.setAttribute(
      "aria-label",
      metricFilterAriaLabel(this.viewState.keys, this.plugin.settings.metricNameDisplayMode),
    );
    keyFilterButton.setAttribute(
      "title",
      metricFilterTitle(this.viewState.keys, this.plugin.settings.metricNameDisplayMode),
    );
    keyFilterButton.createSpan({
      cls: "metrics-lens-select-button-label",
      text: metricFilterLabel(this.viewState.keys, this.plugin.settings.metricNameDisplayMode),
    });
    const keyFilterIcon = keyFilterButton.createSpan({ cls: "metrics-lens-select-button-icon" });
    setIcon(keyFilterIcon, "chevron-down");
    keyFilterButton.addEventListener("click", () => {
      this.pendingControlFocus = { name: "keys" };
      this.openMetricFilterMenu(keyFilterButton, availableKeys);
    });

    const searchInput = primaryControls.createEl("input", {
      cls: "metrics-lens-control metrics-lens-search",
      type: "search",
    });
    searchInput.value = this.viewState.searchText;
    searchInput.placeholder = "Search";
    searchInput.setAttribute("aria-label", "Search metrics in the current file");
    searchInput.dataset.metricsControl = "search";
    searchInput.addEventListener("input", () => {
      this.pendingControlFocus = this.controlFocusState("search", searchInput);
      this.viewState.searchText = searchInput.value;
      this.persistCurrentViewState();
      this.scheduleSearchRender();
    });

    if (hasActiveViewControls(this.viewState)) {
      const resetButton = primaryControls.createEl("button", {
        cls: ["clickable-icon", "metrics-lens-icon-button", "metrics-lens-reset-view-button"],
      });
      resetButton.type = "button";
      resetButton.dataset.metricsControl = "reset";
      resetButton.setAttribute("aria-label", "Reset current filters and sorting");
      resetButton.setAttribute("data-tooltip-position", "top");
      setIcon(resetButton, "filter-x");
      resetButton.addEventListener("click", () => {
        this.resetCurrentViewState();
        this.render();
      });
    }

    const moreButton = primaryControls.createEl("button", {
      cls: ["clickable-icon", "metrics-lens-icon-button", "metrics-lens-more-controls-button"],
    });
    moreButton.type = "button";
    moreButton.dataset.metricsControl = "more";
    moreButton.setAttribute(
      "aria-label",
      showAdvancedControls
        ? "Hide more filters"
        : activeAdvancedControls > 0
          ? `Show more filters (${activeAdvancedControls} active)`
          : "Show more filters",
    );
    moreButton.setAttribute("data-tooltip-position", "top");
    setIcon(moreButton, "sliders-horizontal");
    moreButton.toggleClass("is-active", showAdvancedControls || activeAdvancedControls > 0);
    moreButton.addEventListener("click", () => {
      this.pendingControlFocus = { name: "more" };
      this.advancedControlsExpanded = !this.advancedControlsExpanded;
      this.persistCurrentViewState();
      this.render();
    });

    if (showAdvancedControls) {
      const advancedControls = controls.createDiv({ cls: "metrics-lens-advanced-controls" });

      const sourceSelect = advancedControls.createEl("select", { cls: "metrics-lens-control" });
      sourceSelect.dataset.metricsControl = "source";
      sourceSelect.setAttribute("aria-label", "Filter by source");
      sourceSelect.createEl("option", {
        text: "All sources",
        value: "",
      });
      availableSources.forEach((source) => {
        sourceSelect.createEl("option", {
          text: source,
          value: source,
        });
      });
      sourceSelect.value = this.viewState.source;
      sourceSelect.addEventListener("change", () => {
        this.pendingControlFocus = { name: "source" };
        this.viewState.source = sourceSelect.value;
        this.persistCurrentViewState();
        this.render();
      });

      const statusSelect = advancedControls.createEl("select", { cls: "metrics-lens-control" });
      statusSelect.dataset.metricsControl = "status";
      statusSelect.setAttribute("aria-label", "Filter by validation status");
      [
        { label: "All statuses", value: "all" },
        { label: "Valid", value: "valid" },
        { label: "Warnings", value: "warning" },
        { label: "Errors", value: "error" },
      ].forEach((option) => {
        statusSelect.createEl("option", {
          text: option.label,
          value: option.value,
        });
      });
      statusSelect.value = this.viewState.status;
      statusSelect.addEventListener("change", () => {
        this.pendingControlFocus = { name: "status" };
        this.viewState.status = statusSelect.value as MetricsStatusFilter;
        this.persistCurrentViewState();
        this.render();
      });

      const groupBySelect = advancedControls.createEl("select", { cls: "metrics-lens-control" });
      groupBySelect.dataset.metricsControl = "groupBy";
      groupBySelect.setAttribute("aria-label", "Group metrics");
      [
        { label: "No grouping", value: "none" },
        { label: "Group by day", value: "day" },
        { label: "Group by week", value: "week" },
        { label: "Group by month", value: "month" },
        { label: "Group by year", value: "year" },
        { label: "Group by metric", value: "key" },
        { label: "Group by source", value: "source" },
      ].forEach((option) => {
        groupBySelect.createEl("option", {
          text: option.label,
          value: option.value,
        });
      });
      groupBySelect.value = this.viewState.groupBy;
      groupBySelect.addEventListener("change", () => {
        this.pendingControlFocus = { name: "groupBy" };
        this.viewState.groupBy = groupBySelect.value as MetricsGroupBy;
        this.persistCurrentViewState();
        this.render();
      });

      const summarySelect = advancedControls.createEl("select", { cls: "metrics-lens-control" });
      summarySelect.dataset.metricsControl = "summaryComputation";
      summarySelect.setAttribute("aria-label", "Show summary rows");
      [
        { label: "No summary", value: "none" },
        { label: "Average", value: "avg" },
        { label: "Median", value: "median" },
        { label: "Minimum", value: "min" },
        { label: "Maximum", value: "max" },
        { label: "Sum", value: "sum" },
        { label: "Count", value: "count" },
      ].forEach((option) => {
        summarySelect.createEl("option", {
          text: option.label,
          value: option.value,
        });
      });
      summarySelect.value = this.viewState.summaryComputation;
      summarySelect.addEventListener("change", () => {
        this.pendingControlFocus = { name: "summaryComputation" };
        this.viewState.summaryComputation = summarySelect.value as MetricsSummaryComputation;
        this.persistCurrentViewState();
        this.render();
      });
    }

  }

  private normalizeViewState(): boolean {
    let changed = false;

    if (
      this.viewState.timeRange === "custom" &&
      this.viewState.fromDate &&
      this.viewState.toDate &&
      this.viewState.fromDate > this.viewState.toDate
    ) {
      const nextFromDate = this.viewState.toDate;
      this.viewState.toDate = this.viewState.fromDate;
      this.viewState.fromDate = nextFromDate;
      changed = true;
    }

    return changed;
  }

  private openMetricFilterMenu(anchorEl: HTMLElement | null, availableKeys: string[]): void {
    const menu = new Menu();
    const metricNameDisplayMode = this.plugin.settings.metricNameDisplayMode;

    menu.addItem((item) => {
      item
        .setTitle("All metrics")
        .setChecked(this.viewState.keys.length === 0)
        .onClick(() => {
          if (this.viewState.keys.length === 0) {
            return;
          }

          this.pendingControlFocus = { name: "keys" };
          this.viewState.keys = [];
          this.persistCurrentViewState();
          this.render();
        });
    });

    if (availableKeys.length > 0) {
      menu.addSeparator();
    }

    availableKeys.forEach((key) => {
      menu.addItem((item) => {
        item
          .setTitle(displayMetricOption(key, metricNameDisplayMode))
          .setChecked(this.viewState.keys.includes(key))
          .onClick(() => {
            this.pendingControlFocus = { name: "keys" };
            this.viewState.keys = toggleSelectedFilterValue(this.viewState.keys, key);
            this.persistCurrentViewState();
            this.render();
          });
      });
    });

    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      menu.showAtPosition({
        overlap: true,
        width: rect.width,
        x: rect.left,
        y: rect.bottom,
      });
      return;
    }

    menu.showAtPosition({
      x: window.innerWidth / 2,
      y: 80,
    });
  }

  private sortOrderLabel(sortOrder: MetricsSortOrder): string {
    switch (sortOrder) {
      case "oldest":
        return "oldest first";
      case "value-desc":
        return "value high-low";
      case "value-asc":
        return "value low-high";
      case "newest":
      default:
        return "newest first";
    }
  }

  private revealPendingMetricRecord(): void {
    if (this.pendingMetricIdFocus) {
      const targetId = this.pendingMetricIdFocus;
      const targetEl = this.contentEl.querySelector<HTMLElement>(`[data-metric-id="${targetId}"]`);
      if (!targetEl) {
        return;
      }

      this.pendingMetricIdFocus = null;
      this.pendingMetricLineNumberFocus = null;
      this.highlightRecordElements([targetEl]);
      return;
    }

    if (this.pendingMetricLineNumberFocus === null) {
      return;
    }

    const targetEl = this.contentEl.querySelector<HTMLElement>(
      `[data-metrics-line-number="${this.pendingMetricLineNumberFocus}"]`,
    );
    if (!targetEl) {
      return;
    }

    this.pendingMetricLineNumberFocus = null;
    this.highlightRecordElements([targetEl]);
  }

  private focusChartSelection(selection: MetricsChartSelection): void {
    const targetElements = uniqueLineNumbers(selection.lineNumbers)
      .map((lineNumber) =>
        this.contentEl.querySelector<HTMLElement>(`[data-metrics-line-number="${lineNumber}"]`),
      )
      .filter((element): element is HTMLElement => element !== null);

    if (targetElements.length === 0) {
      new Notice(`No visible rows matched ${selection.bucketLabel}.`);
      return;
    }

    this.highlightRecordElements(targetElements);
  }

  private highlightRecordElements(targetElements: HTMLElement[]): void {
    if (targetElements.length === 0) {
      return;
    }

    if (this.clearTargetedRecordTimeout !== null) {
      window.clearTimeout(this.clearTargetedRecordTimeout);
      this.clearTargetedRecordTimeout = null;
    }

    this.contentEl
      .querySelectorAll<HTMLElement>(".metrics-lens-record.is-targeted")
      .forEach((element) => element.removeClass("is-targeted"));

    targetElements.forEach((element) => {
      element.addClass("is-targeted");
    });

    const firstTarget = targetElements[0];
    if (!firstTarget) {
      return;
    }

    firstTarget.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
    firstTarget.focus({ preventScroll: true });

    this.clearTargetedRecordTimeout = window.setTimeout(() => {
      targetElements.forEach((element) => {
        element.removeClass("is-targeted");
      });
      this.clearTargetedRecordTimeout = null;
    }, 1800);
  }

  private restorePendingControlFocus(): void {
    if (!this.pendingControlFocus) {
      return;
    }

    const focusState = this.pendingControlFocus;
    this.pendingControlFocus = null;

    const targetEl = this.contentEl.querySelector<HTMLElement>(
      `[data-metrics-control="${focusState.name}"]`,
    );
    if (!targetEl) {
      return;
    }

    targetEl.focus({ preventScroll: true });
    if (
      targetEl instanceof HTMLInputElement &&
      typeof focusState.selectionStart === "number" &&
      typeof focusState.selectionEnd === "number"
    ) {
      targetEl.setSelectionRange(focusState.selectionStart, focusState.selectionEnd);
    }
  }

  private getMetricsAnalysis(): MetricsFileAnalysis {
    const data = this.data ?? "";

    if (this.metricsAnalysisCache?.data === data) {
      return this.metricsAnalysisCache.analysis;
    }

    const analysis = analyzeMetricsData(data);
    this.metricsAnalysisCache = { data, analysis };
    return analysis;
  }

  private scheduleSearchRender(): void {
    this.clearSearchRenderTimeout();
    this.searchRenderTimeout = window.setTimeout(() => {
      this.searchRenderTimeout = null;
      this.render();
    }, 150);
  }

  private clearSearchRenderTimeout(): void {
    if (this.searchRenderTimeout === null) {
      return;
    }

    window.clearTimeout(this.searchRenderTimeout);
    this.searchRenderTimeout = null;
  }

  private controlFocusState(
    name: string,
    element: HTMLInputElement | HTMLSelectElement,
  ): ControlFocusState {
    if (element instanceof HTMLInputElement) {
      return {
        name,
        selectionEnd: element.selectionEnd ?? undefined,
        selectionStart: element.selectionStart ?? undefined,
      };
    }

    return { name };
  }
}
