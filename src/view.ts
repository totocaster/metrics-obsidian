import { TFile, TextFileView, WorkspaceLeaf } from "obsidian";

import { toMetricReference } from "./contract";
import type MetricsPlugin from "./main";
import { analyzeMetricsData, type MetricIssueSeverity, type MetricRowStatus, type ParsedMetricRow } from "./metrics-file-model";

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

function createStatusBadge(container: HTMLElement, text: string, status: MetricIssueSeverity | MetricRowStatus): void {
  container.createSpan({
    cls: ["metrics-lens-badge", `is-${status}`],
    text,
  });
}

function formatMetricValue(row: ParsedMetricRow): string {
  const value = row.metric?.value;
  const unit = row.metric?.unit;

  if (typeof value !== "number") {
    return "Unknown value";
  }

  return typeof unit === "string" ? `${value} ${unit}` : `${value}`;
}

function renderIssueList(container: HTMLElement, row: ParsedMetricRow): void {
  if (row.issues.length === 0) {
    return;
  }

  const issuesList = container.createEl("ul", { cls: "metrics-lens-issues" });
  row.issues.forEach((issue) => {
    const item = issuesList.createEl("li");
    createStatusBadge(item, issue.severity, issue.severity);
    item.createSpan({ text: issue.message });
  });
}

function renderRecord(container: HTMLElement, row: ParsedMetricRow, referencePrefix: string): void {
  const rowEl = container.createDiv({ cls: ["metrics-lens-record", `is-${row.status}`] });

  const header = rowEl.createDiv({ cls: "metrics-lens-record-header" });
  header.createSpan({ cls: "metrics-lens-record-line", text: `Line ${row.lineNumber}` });
  createStatusBadge(header, row.status, row.status);

  const title = row.metric?.key ?? "Invalid metrics row";
  rowEl.createEl("h3", { cls: "metrics-lens-record-title", text: title });

  const facts = rowEl.createDiv({ cls: "metrics-lens-record-facts" });
  facts.createSpan({ text: row.metric?.date ?? row.metric?.ts ?? "Unknown timestamp" });
  facts.createSpan({ text: formatMetricValue(row) });
  facts.createSpan({ text: row.metric?.source ?? "Unknown source" });

  const references = rowEl.createDiv({ cls: "metrics-lens-record-references" });
  if (typeof row.metric?.id === "string") {
    references.createSpan({
      text: toMetricReference(row.metric.id, referencePrefix),
    });
  } else {
    references.createSpan({ text: "No metric:id reference yet" });
  }

  if (typeof row.metric?.origin_id === "string") {
    references.createSpan({ text: `origin_id: ${row.metric.origin_id}` });
  }

  if (typeof row.metric?.note === "string" && row.metric.note.length > 0) {
    rowEl.createDiv({ cls: "metrics-lens-record-note", text: row.metric.note });
  }

  renderIssueList(rowEl, row);

  if (!row.metric?.key) {
    rowEl.createEl("pre", { cls: "metrics-lens-record-raw", text: row.rawLine });
  }
}

export class MetricsFileView extends TextFileView {
  allowNoFile = true;

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
    this.render();
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

  private render(): void {
    this.contentEl.empty();

    const container = this.contentEl.createDiv({ cls: "metrics-lens-view" });
    const analysis = analyzeMetricsData(this.data ?? "");

    const status = container.createDiv({ cls: "metrics-lens-status" });
    status.setText(
      this.file
        ? "Metrics file view is active. Full CRUD lens is the next implementation step."
        : "No metrics file is open. Open a .metrics.ndjson file from the file browser.",
    );

    if (!this.file) {
      const emptyPanel = container.createDiv({ cls: "metrics-lens-panel" });
      emptyPanel.createEl("h2", { text: "File browser integration" });

      const emptyList = emptyPanel.createEl("ul");
      emptyList.createEl("li", { text: "Compound extension registered: metrics.ndjson" });
      emptyList.createEl("li", { text: "File browser should show logical file names without the suffix" });
      emptyList.createEl("li", { text: "Capitalization in the sidebar follows the actual file name on disk" });
      return;
    }

    const filePanel = container.createDiv({ cls: "metrics-lens-panel" });
    filePanel.createEl("h2", { text: "File" });

    const fileList = filePanel.createEl("ul");
    fileList.createEl("li", {
      text: `Display name: ${capitalizeDisplayName(logicalMetricsBaseName(this.file.name, this.plugin.settings.supportedExtensions))}`,
    });
    fileList.createEl("li", {
      text: `Path: ${this.file.path}`,
    });
    fileList.createEl("li", {
      text: `Rows: ${analysis.totalRows}`,
    });
    fileList.createEl("li", {
      text: `Valid rows: ${analysis.validRows}`,
    });
    fileList.createEl("li", {
      text: `Warning rows: ${analysis.warningRows}`,
    });
    fileList.createEl("li", {
      text: `Error rows: ${analysis.errorRows}`,
    });
    fileList.createEl("li", {
      text: `Legacy rows missing id: ${analysis.legacyRows}`,
    });
    fileList.createEl("li", {
      text: `Reference example: ${toMetricReference("01JRX9Y7T9TQ8Q3A91F1M7A4AA", this.plugin.settings.recordReferencePrefix)}`,
    });

    if (analysis.legacyRows > 0) {
      const legacyPanel = container.createDiv({ cls: "metrics-lens-panel" });
      legacyPanel.createEl("h2", { text: "Legacy ids" });
      legacyPanel.createEl("p", {
        text: "This file still uses legacy rows without `id`. Stable CRUD and markdown references require an `id` on every row.",
      });

      const actionRow = legacyPanel.createDiv({ cls: "metrics-lens-actions" });
      const assignButton = actionRow.createEl("button", {
        cls: "mod-cta",
        text: "Assign missing ids",
      });
      assignButton.setAttribute("aria-label", "Assign missing ids in this metrics file");
      assignButton.addEventListener("click", () => {
        if (!this.file) {
          return;
        }

        void this.plugin.assignMissingIds(this.file);
      });
    }

    const validationPanel = container.createDiv({ cls: "metrics-lens-panel" });
    validationPanel.createEl("h2", { text: "Validation" });

    if (analysis.issueSummary.length === 0) {
      validationPanel.createSpan({ text: "No issues detected." });
    } else {
      const validationList = validationPanel.createEl("ul");
      analysis.issueSummary.slice(0, 8).forEach((summary) => {
        const item = validationList.createEl("li");
        createStatusBadge(item, summary.severity, summary.severity);
        item.createSpan({ text: `${summary.message} (${summary.count})` });
      });
    }

    const scopePanel = container.createDiv({ cls: "metrics-lens-panel" });
    scopePanel.createEl("h2", { text: "Current scope" });

    const scopeList = scopePanel.createEl("ul");
    scopeList.createEl("li", { text: "Contract" });
    scopeList.createEl("li", { text: "Scaffold" });
    scopeList.createEl("li", { text: "Lens over metrics files with CRUD next" });

    const deferredPanel = container.createDiv({ cls: "metrics-lens-panel" });
    deferredPanel.createEl("h2", { text: "Deferred" });

    const deferredList = deferredPanel.createEl("ul");
    deferredList.createEl("li", { text: "Ingestion and provider pipelines" });
    deferredList.createEl("li", { text: "Caching and hidden databases" });
    deferredList.createEl("li", { text: "Charts, filters, and saved views" });
    deferredList.createEl("li", { text: "Notes and documents beyond metric references" });

    const recordsPanel = container.createDiv({ cls: "metrics-lens-panel" });
    recordsPanel.createEl("h2", { text: "Records" });

    if (analysis.rows.length === 0) {
      recordsPanel.createSpan({ text: "This file has no metrics rows yet." });
      return;
    }

    const recordsList = recordsPanel.createDiv({ cls: "metrics-lens-records" });
    analysis.rows.forEach((row) => {
      renderRecord(recordsList, row, this.plugin.settings.recordReferencePrefix);
    });
  }
}
