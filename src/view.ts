import { Menu, Notice, setIcon, TFile, TextFileView, WorkspaceLeaf } from "obsidian";

import { buildMetricsChartModel } from "./chart-model";
import { renderMetricsChart, type MetricsChartSelection } from "./chart-renderer";
import { toMetricReference, type MetricRecord } from "./contract";
import type MetricsPlugin from "./main";
import { metricIconForKey } from "./metric-icons";
import { formatMetricDisplayValue } from "./metric-value-format";
import {
  analyzeMetricsData,
  type ParsedMetricRow,
} from "./metrics-file-model";
import {
  createDefaultViewState,
  DEFAULT_VIEW_STATE,
  type MetricsGroupBy,
  type MetricsSortOrder,
  type MetricsStatusFilter,
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
  });
}

function rowTimestamp(row: ParsedMetricRow): number | null {
  const ts = row.metric?.ts;
  if (typeof ts !== "string") {
    return null;
  }

  const parsed = Date.parse(ts);
  return Number.isNaN(parsed) ? null : parsed;
}

function rowDateValue(row: ParsedMetricRow): string | null {
  if (typeof row.metric?.date === "string" && row.metric.date.length === 10) {
    return row.metric.date;
  }

  const ts = row.metric?.ts;
  if (typeof ts !== "string" || ts.length < 10) {
    return null;
  }

  const parsed = Date.parse(ts);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return ts.slice(0, 10);
}

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  const originalDay = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDayOfMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(originalDay, lastDayOfMonth));
  next.setHours(0, 0, 0, 0);
  return next;
}

function addYears(date: Date, years: number): Date {
  return addMonths(date, years * 12);
}

function startOfMonth(date: Date): Date {
  const next = new Date(date);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfWeek(date: Date): Date {
  const next = new Date(date);
  const day = next.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + offset);
  next.setHours(0, 0, 0, 0);
  return next;
}

function resolvedTimeRange(viewState: MetricsViewState): {
  fromDate: string;
  toDate: string;
} {
  const today = startOfToday();

  switch (viewState.timeRange) {
    case "today":
      return {
        fromDate: toLocalDateString(today),
        toDate: toLocalDateString(today),
      };
    case "this-week":
      return {
        fromDate: toLocalDateString(startOfWeek(today)),
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

function collectFilterValues(
  rows: ParsedMetricRow[],
  field: "key" | "source",
): string[] {
  return Array.from(
    new Set(
      rows
        .map((row) => row.metric?.[field])
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

function withSelectedFilterValue(options: string[], selected: string): string[] {
  if (selected.length === 0 || options.includes(selected)) {
    return options;
  }

  return [selected, ...options];
}

function uniqueLineNumbers(lineNumbers: number[]): number[] {
  return Array.from(new Set(lineNumbers));
}

function applyMetricsViewState(
  rows: ParsedMetricRow[],
  viewState: MetricsViewState,
): ParsedMetricRow[] {
  const normalizedSearch = viewState.searchText.trim().toLowerCase();
  const { fromDate, toDate } = resolvedTimeRange(viewState);

  const filteredRows = rows.filter((row) => {
    if (viewState.key && row.metric?.key !== viewState.key) {
      return false;
    }

    if (viewState.source && row.metric?.source !== viewState.source) {
      return false;
    }

    if (viewState.status !== "all" && row.status !== viewState.status) {
      return false;
    }

    const rowDate = rowDateValue(row);
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

function hasActiveViewControls(viewState: MetricsViewState): boolean {
  return hasActivePrimaryControls(viewState) || advancedControlCount(viewState) > 0;
}

function hasActivePrimaryControls(viewState: MetricsViewState): boolean {
  return (
    hasActiveTimeRange(viewState) ||
    viewState.key.length > 0 ||
    viewState.searchText.trim().length > 0 ||
    viewState.showChart !== DEFAULT_VIEW_STATE.showChart ||
    viewState.sortOrder !== DEFAULT_VIEW_STATE.sortOrder
  );
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

  return count;
}

interface MetricsRowGroup {
  heading: string;
  key: string;
  linkTarget?: string;
  rows: ParsedMetricRow[];
}

function groupRowsByDay(rows: ParsedMetricRow[]): MetricsRowGroup[] {
  const groups = new Map<string, ParsedMetricRow[]>();

  rows.forEach((row) => {
    const day = rowDateValue(row);
    const key = day ?? "__no_date__";
    const current = groups.get(key) ?? [];
    current.push(row);
    groups.set(key, current);
  });

  return Array.from(groups.entries()).map(([key, groupedRows]) => ({
    heading: key === "__no_date__" ? "No date" : key,
    key,
    linkTarget: key === "__no_date__" ? undefined : key,
    rows: groupedRows,
  }));
}

function groupRowsByField(
  rows: ParsedMetricRow[],
  field: "key" | "source",
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
        : key,
    key,
    rows: groupedRows,
  }));
}

function groupedRows(rows: ParsedMetricRow[], groupBy: MetricsGroupBy): MetricsRowGroup[] {
  switch (groupBy) {
    case "day":
      return groupRowsByDay(rows);
    case "key":
      return groupRowsByField(rows, "key");
    case "source":
      return groupRowsByField(rows, "source");
    case "none":
    default:
      return [];
  }
}

function groupBySummaryLabel(groupBy: MetricsGroupBy): string | null {
  switch (groupBy) {
    case "day":
      return "grouped by day";
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
  main.createSpan({
    cls: "metrics-lens-record-key",
    text: row.metric?.key ?? "Invalid row",
  });

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
  menuButton.setAttribute("aria-label", `More actions for ${row.metric?.key ?? "record"}`);
  menuButton.setAttribute("data-tooltip-position", "left");
  setIcon(menuButton, "more-horizontal");
  menuButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openRecordMenu(event, row, plugin, file, referencePrefix);
  });
}

export class MetricsFileView extends TextFileView {
  allowNoFile = true;
  private advancedControlsExpanded = false;
  private addRecordActionEl: HTMLElement | null = null;
  private actionsSeparatorEl: HTMLElement | null = null;
  private chartActionEl: HTMLElement | null = null;
  private clearTargetedRecordTimeout: number | null = null;
  private fileActionsActionEl: HTMLElement | null = null;
  private pendingControlFocus: ControlFocusState | null = null;
  private pendingMetricIdFocus: string | null = null;
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
    const showChart = this.viewState.showChart;
    this.viewState = createDefaultViewState();
    this.viewState.showChart = showChart;
    this.advancedControlsExpanded = false;
    this.pendingMetricIdFocus = metricId;
    this.render();
  }

  private ensureHeaderActions(): void {
    if (!this.fileActionsActionEl) {
      this.fileActionsActionEl = this.addAction("files", "Metrics file actions", () => {
        const actionEl = this.fileActionsActionEl;
        const rect = actionEl?.getBoundingClientRect();
        this.plugin.openMetricsFileActionsMenu(this.file, rect ?? undefined);
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
      this.addRecordActionEl?.parentElement &&
      this.chartActionEl?.parentElement &&
      !this.viewActionSeparatorEl
    ) {
      const separator = this.addRecordActionEl.parentElement.createDiv({
        cls: "metrics-lens-view-action-separator",
      });
      this.addRecordActionEl.parentElement.insertBefore(separator, this.chartActionEl);
      this.viewActionSeparatorEl = separator;
    }

    if (
      this.chartActionEl?.parentElement &&
      this.fileActionsActionEl?.parentElement &&
      !this.actionsSeparatorEl
    ) {
      const separator = this.fileActionsActionEl.parentElement.createDiv({
        cls: "metrics-lens-view-action-separator",
      });
      this.chartActionEl.parentElement.insertBefore(separator, this.fileActionsActionEl);
      this.actionsSeparatorEl = separator;
    }

    this.syncHeaderActions();
  }

  private syncHeaderActions(): void {
    if (this.fileActionsActionEl) {
      this.fileActionsActionEl.setAttribute("aria-label", "Metrics file actions");
      this.fileActionsActionEl.setAttribute("data-tooltip-position", "bottom");
    }

    if (this.chartActionEl) {
      this.chartActionEl.toggleClass("is-active", this.viewState.showChart);
      this.chartActionEl.setAttribute(
        "aria-label",
        this.viewState.showChart ? "Hide chart" : "Show chart",
      );
      this.chartActionEl.setAttribute("data-tooltip-position", "bottom");
    }

    if (this.addRecordActionEl) {
      this.addRecordActionEl.setAttribute("aria-label", "Add record");
      this.addRecordActionEl.setAttribute("data-tooltip-position", "bottom");
    }
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

    const chartModel = buildMetricsChartModel(visibleRows, this.viewState.groupBy);
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

    const analysis = analyzeMetricsData(this.data ?? "");
    const availableKeys = withSelectedFilterValue(
      collectFilterValues(analysis.rows, "key"),
      this.viewState.key,
    );
    const availableSources = withSelectedFilterValue(
      collectFilterValues(analysis.rows, "source"),
      this.viewState.source,
    );
    const normalizedViewState = this.normalizeViewState();
    if (normalizedViewState) {
      this.persistCurrentViewState();
    }
    const visibleRows = applyMetricsViewState(analysis.rows, this.viewState);
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
        groupedRows(visibleRows, this.viewState.groupBy).forEach((group) => {
          const groupSection = recordsSection.createDiv({ cls: "metrics-lens-group" });
          const headingContainer = groupSection.createDiv({
            cls: ["metrics-lens-group-heading", "markdown-reading-view"],
          });
          renderGroupHeading(headingContainer, group, this.plugin, currentFile.path);

          const recordsList = groupSection.createDiv({ cls: "metrics-lens-records" });
          group.rows.forEach((row, index) => {
            renderRecord(
              recordsList,
              row,
              this.plugin,
              currentFile,
              this.plugin.settings.recordReferencePrefix,
              {
                isFirst: index === 0,
                isLast: index === group.rows.length - 1,
              },
            );
          });
        });
      } else {
        const recordsList = recordsSection.createDiv({ cls: "metrics-lens-records" });
        visibleRows.forEach((row, index) => {
          renderRecord(
            recordsList,
            row,
            this.plugin,
            currentFile,
            this.plugin.settings.recordReferencePrefix,
            {
              isFirst: index === 0,
              isLast: index === visibleRows.length - 1,
            },
          );
        });
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

    const keySelect = primaryControls.createEl("select", { cls: "metrics-lens-control" });
    keySelect.dataset.metricsControl = "key";
    keySelect.setAttribute("aria-label", "Filter by metric");
    keySelect.createEl("option", {
      text: "All metrics",
      value: "",
    });
    availableKeys.forEach((key) => {
      keySelect.createEl("option", {
        text: key,
        value: key,
      });
    });
    keySelect.value = this.viewState.key;
    keySelect.addEventListener("change", () => {
      this.pendingControlFocus = { name: "key" };
      this.viewState.key = keySelect.value;
      this.persistCurrentViewState();
      this.render();
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
      this.render();
    });

    const sortButton = primaryControls.createEl("button", {
      cls: ["clickable-icon", "metrics-lens-icon-button"],
    });
    sortButton.type = "button";
    sortButton.dataset.metricsControl = "sort";
    sortButton.setAttribute("aria-label", `Sort metrics: ${this.sortOrderLabel(this.viewState.sortOrder)}`);
    sortButton.setAttribute("data-tooltip-position", "top");
    setIcon(sortButton, "arrow-up-down");
    sortButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

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
              this.pendingControlFocus = { name: "sort" };
              this.viewState.sortOrder = option.value;
              this.persistCurrentViewState();
              this.render();
            });
        });
      });

      menu.showAtMouseEvent(event);
    });

    if (hasActiveViewControls(this.viewState)) {
      const resetButton = primaryControls.createEl("button", {
        cls: ["clickable-icon", "metrics-lens-icon-button", "metrics-lens-reset-view-button"],
      });
      resetButton.type = "button";
      resetButton.dataset.metricsControl = "reset";
      resetButton.setAttribute("aria-label", "Reset current filters and sorting");
      resetButton.setAttribute("data-tooltip-position", "top");
      setIcon(resetButton, "rotate-ccw");
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
    if (!this.pendingMetricIdFocus) {
      return;
    }

    const targetId = this.pendingMetricIdFocus;
    const targetEl = this.contentEl.querySelector<HTMLElement>(`[data-metric-id="${targetId}"]`);
    if (!targetEl) {
      return;
    }

    this.pendingMetricIdFocus = null;

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
