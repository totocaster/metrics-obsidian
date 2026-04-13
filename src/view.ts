import { Menu, Notice, setIcon, TFile, TextFileView, WorkspaceLeaf } from "obsidian";

import { toMetricReference, type MetricRecord } from "./contract";
import type MetricsPlugin from "./main";
import { metricIconForKey } from "./metric-icons";
import { analyzeMetricsData, type ParsedMetricRow } from "./metrics-file-model";

export const METRICS_VIEW_TYPE = "metrics-file-view";

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

  return typeof unit === "string" ? `${value} ${unit}` : `${value}`;
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
  private clearTargetedRecordTimeout: number | null = null;
  private pendingMetricIdFocus: string | null = null;

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
    this.addAction("plus", "Add record", () => {
      if (!this.file) {
        new Notice("Open a metrics file first.");
        return;
      }

      this.plugin.openCreateRecordModal(this.file);
    });
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
    this.pendingMetricIdFocus = metricId;
    this.render();
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

    const analysis = analyzeMetricsData(this.data ?? "");

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
    } else {
      const recordsSection = container.createDiv({ cls: "metrics-lens-section" });
      const recordsList = recordsSection.createDiv({ cls: "metrics-lens-records" });
      analysis.rows.forEach((row, index) => {
        renderRecord(
          recordsList,
          row,
          this.plugin,
          this.file as TFile,
          this.plugin.settings.recordReferencePrefix,
          {
            isFirst: index === 0,
            isLast: index === analysis.rows.length - 1,
          },
        );
      });
    }

    const summaryParts = [`${analysis.totalRows} rows`];
    const flaggedRows = analysis.warningRows + analysis.errorRows;
    if (flaggedRows > 0) {
      summaryParts.push(`${flaggedRows} flagged`);
    }
    if (analysis.legacyRows > 0) {
      summaryParts.push(`${analysis.legacyRows} missing ids`);
    }

    const footer = container.createDiv({ cls: "metrics-lens-footer" });
    footer.createSpan({
      cls: "metrics-lens-file-meta",
      text: `${this.file.path} · ${summaryParts.join(" · ")}`,
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

    targetEl.addClass("is-targeted");
    targetEl.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
    targetEl.focus({ preventScroll: true });

    if (this.clearTargetedRecordTimeout !== null) {
      window.clearTimeout(this.clearTargetedRecordTimeout);
    }

    this.clearTargetedRecordTimeout = window.setTimeout(() => {
      targetEl.removeClass("is-targeted");
      this.clearTargetedRecordTimeout = null;
    }, 1800);
  }
}
