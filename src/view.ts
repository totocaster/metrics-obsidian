import { TFile, TextFileView, WorkspaceLeaf } from "obsidian";

import { toMetricReference } from "./contract";
import type MetricsPlugin from "./main";

export const METRICS_VIEW_TYPE = "metrics-file-view";

function stripMetricsSuffix(fileName: string, extensions: string[]): string {
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

function summarizeMetricsData(data: string): {
  totalLines: number;
  validRecords: number;
  invalidLines: number;
  preview: string;
} {
  const lines = data
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  let validRecords = 0;
  let invalidLines = 0;

  lines.forEach((line) => {
    try {
      JSON.parse(line);
      validRecords += 1;
    } catch {
      invalidLines += 1;
    }
  });

  return {
    totalLines: lines.length,
    validRecords,
    invalidLines,
    preview: lines.slice(0, 8).join("\n"),
  };
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

    const baseName = stripMetricsSuffix(this.file.name, this.plugin.settings.supportedExtensions);
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
    const summary = summarizeMetricsData(this.data ?? "");

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
      text: `Display name: ${capitalizeDisplayName(stripMetricsSuffix(this.file.name, this.plugin.settings.supportedExtensions))}`,
    });
    fileList.createEl("li", {
      text: `Path: ${this.file.path}`,
    });
    fileList.createEl("li", {
      text: `Logical line count: ${summary.totalLines}`,
    });
    fileList.createEl("li", {
      text: `Valid JSON records: ${summary.validRecords}`,
    });
    fileList.createEl("li", {
      text: `Invalid lines: ${summary.invalidLines}`,
    });
    fileList.createEl("li", {
      text: `Reference example: ${toMetricReference("01JRX9Y7T9TQ8Q3A91F1M7A4AA", this.plugin.settings.recordReferencePrefix)}`,
    });

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

    const previewPanel = container.createDiv({ cls: "metrics-lens-panel" });
    previewPanel.createEl("h2", { text: "Raw preview" });

    const previewEl = previewPanel.createEl("pre", { cls: "metrics-lens-preview" });
    previewEl.setText(summary.preview.length > 0 ? summary.preview : "(empty file)");
  }
}
