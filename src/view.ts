import { TFile, TextFileView, WorkspaceLeaf } from "obsidian";

import { toMetricReference, type MetricRecord } from "./contract";
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatModifiedAt(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
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

function renderRecord(
  container: HTMLElement,
  row: ParsedMetricRow,
  plugin: MetricsPlugin,
  file: TFile,
  referencePrefix: string,
): void {
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

  if (row.metric?.id && row.metric.ts && row.metric.key && typeof row.metric.value === "number" && row.metric.source) {
    const actions = rowEl.createDiv({ cls: "metrics-lens-actions" });

    const editButton = actions.createEl("button", { text: "Edit" });
    editButton.type = "button";
    editButton.setAttribute("aria-label", `Edit ${row.metric.key}`);
    editButton.addEventListener("click", () => {
      plugin.openEditRecordModal(file, row.metric as MetricRecord);
    });

    const deleteButton = actions.createEl("button", {
      cls: "mod-warning",
      text: "Delete",
    });
    deleteButton.type = "button";
    deleteButton.setAttribute("aria-label", `Delete ${row.metric.key}`);
    deleteButton.addEventListener("click", () => {
      plugin.confirmDeleteRecord(file, row.metric as MetricRecord);
    });
  }

  renderIssueList(rowEl, row);

  if (!row.metric?.key) {
    rowEl.createEl("pre", { cls: "metrics-lens-record-raw", text: row.rawLine });
  }
}

function renderBrowser(
  container: HTMLElement,
  plugin: MetricsPlugin,
  files: TFile[],
  selectedFile: TFile | null,
  leaf: WorkspaceLeaf,
): void {
  const browserPanel = container.createDiv({ cls: ["metrics-lens-panel", "metrics-lens-browser"] });
  browserPanel.createEl("h2", { text: "Metrics files" });

  const browserSummary = browserPanel.createEl("ul");
  browserSummary.createEl("li", { text: `Metrics root: ${plugin.settings.metricsRoot}` });
  browserSummary.createEl("li", { text: `Files in scope: ${files.length}` });
  browserSummary.createEl("li", {
    text: selectedFile ? `Selected: ${selectedFile.path}` : "Selected: none",
  });

  if (files.length === 0) {
    browserPanel.createEl("p", {
      text: "No metrics files were found under the configured metrics root.",
    });
    return;
  }

  const browserList = browserPanel.createDiv({ cls: "metrics-lens-browser-list" });
  files.forEach((file) => {
    const isSelected = selectedFile?.path === file.path;
    const button = browserList.createEl("button", {
      cls: ["metrics-lens-file-button", isSelected ? "is-selected" : ""],
    });
    button.type = "button";
    button.setAttribute(
      "aria-label",
      `Open ${logicalMetricsBaseName(file.name, plugin.settings.supportedExtensions)} metrics file`,
    );
    button.addEventListener("click", () => {
      void plugin.openMetricsFile(file, leaf);
    });

    const fileHeader = button.createDiv({ cls: "metrics-lens-file-button-header" });
    fileHeader.createSpan({
      cls: "metrics-lens-file-button-name",
      text: capitalizeDisplayName(logicalMetricsBaseName(file.name, plugin.settings.supportedExtensions)),
    });
    fileHeader.createSpan({
      cls: "metrics-lens-file-button-size",
      text: formatFileSize(file.stat.size),
    });

    button.createDiv({
      cls: "metrics-lens-file-button-path",
      text: file.path,
    });
    button.createDiv({
      cls: "metrics-lens-file-button-meta",
      text: `Updated ${formatModifiedAt(file.stat.mtime)}`,
    });
  });
}

function renderScopePanel(container: HTMLElement): void {
  const scopePanel = container.createDiv({ cls: "metrics-lens-panel" });
  scopePanel.createEl("h2", { text: "Current scope" });

  const scopeList = scopePanel.createEl("ul");
  scopeList.createEl("li", { text: "Contract is locked around `*.metrics.ndjson` files." });
  scopeList.createEl("li", { text: "Scaffold and file browser integration are working." });
  scopeList.createEl("li", { text: "Current-file read, validation, and CRUD are working." });
  scopeList.createEl("li", { text: "Multi-file browsing inside the plugin is now working." });
}

function renderDeferredPanel(container: HTMLElement): void {
  const deferredPanel = container.createDiv({ cls: "metrics-lens-panel" });
  deferredPanel.createEl("h2", { text: "Deferred" });

  const deferredList = deferredPanel.createEl("ul");
  deferredList.createEl("li", { text: "Ingestion and provider pipelines" });
  deferredList.createEl("li", { text: "Caching and hidden databases" });
  deferredList.createEl("li", { text: "Charts, filters, and saved views" });
  deferredList.createEl("li", { text: "Notes and documents beyond metric references" });
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
    const files = this.plugin.listMetricsFiles();

    const status = container.createDiv({ cls: "metrics-lens-status" });
    if (this.file) {
      status.setText(
        `Viewing ${logicalMetricsBaseName(this.file.name, this.plugin.settings.supportedExtensions)}. Select another metrics file from the browser or edit records below.`,
      );
    } else if (files.length > 0) {
      status.setText("Select a metrics file from the browser to inspect and edit its records.");
    } else {
      status.setText("No metrics files are available in the configured metrics root.");
    }

    const layout = container.createDiv({ cls: "metrics-lens-layout" });
    renderBrowser(layout, this.plugin, files, this.file, this.leaf);

    const main = layout.createDiv({ cls: "metrics-lens-main" });
    if (!this.file) {
      const emptyPanel = main.createDiv({ cls: "metrics-lens-panel" });
      emptyPanel.createEl("h2", { text: "Select a file" });
      emptyPanel.createEl("p", {
        text: files.length > 0
          ? "Choose a metrics file from the browser to inspect validation, references, and record-level CRUD."
          : "Add one or more `*.metrics.ndjson` files under the configured metrics root to start using the metrics lens.",
      });

      renderScopePanel(main);
      renderDeferredPanel(main);
      return;
    }

    if (!this.plugin.isFileInMetricsRoot(this.file)) {
      const outsideRootPanel = main.createDiv({ cls: "metrics-lens-panel" });
      outsideRootPanel.createEl("h2", { text: "Outside metrics root" });
      outsideRootPanel.createEl("p", {
        text: `${this.file.path} is open in the metrics view, but it is outside the configured metrics root.`,
      });
    }

    const analysis = analyzeMetricsData(this.data ?? "");

    const filePanel = main.createDiv({ cls: "metrics-lens-panel" });
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

    const createRow = filePanel.createDiv({ cls: "metrics-lens-actions" });
    const createButton = createRow.createEl("button", {
      cls: "mod-cta",
      text: "Add record",
    });
    createButton.type = "button";
    createButton.setAttribute("aria-label", "Add a metrics record to this file");
    createButton.addEventListener("click", () => {
      if (!this.file) {
        return;
      }

      this.plugin.openCreateRecordModal(this.file);
    });

    if (analysis.legacyRows > 0) {
      const legacyPanel = main.createDiv({ cls: "metrics-lens-panel" });
      legacyPanel.createEl("h2", { text: "Legacy ids" });
      legacyPanel.createEl("p", {
        text: "This file still uses legacy rows without `id`. Stable CRUD and markdown references require an `id` on every row.",
      });

      const actionRow = legacyPanel.createDiv({ cls: "metrics-lens-actions" });
      const assignButton = actionRow.createEl("button", {
        cls: "mod-cta",
        text: "Assign missing ids",
      });
      assignButton.type = "button";
      assignButton.setAttribute("aria-label", "Assign missing ids in this metrics file");
      assignButton.addEventListener("click", () => {
        if (!this.file) {
          return;
        }

        void this.plugin.assignMissingIds(this.file);
      });
    }

    const validationPanel = main.createDiv({ cls: "metrics-lens-panel" });
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

    renderScopePanel(main);
    renderDeferredPanel(main);

    const recordsPanel = main.createDiv({ cls: "metrics-lens-panel" });
    recordsPanel.createEl("h2", { text: "Records" });

    if (analysis.rows.length === 0) {
      recordsPanel.createSpan({ text: "This file has no metrics rows yet." });
      return;
    }

    const recordsList = recordsPanel.createDiv({ cls: "metrics-lens-records" });
    analysis.rows.forEach((row) => {
      renderRecord(recordsList, row, this.plugin, this.file as TFile, this.plugin.settings.recordReferencePrefix);
    });
  }
}
