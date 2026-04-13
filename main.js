"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => MetricsPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian3 = require("obsidian");

// src/settings.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  metricsRoot: "Metrics",
  supportedExtensions: [".metrics.ndjson"],
  defaultWriteFile: "Metrics/All.metrics.ndjson",
  recordReferencePrefix: "metric:"
};
function normalizeMetricsSettings(settings) {
  const supportedExtensions = settings.supportedExtensions?.length ? settings.supportedExtensions : DEFAULT_SETTINGS.supportedExtensions;
  return {
    metricsRoot: (0, import_obsidian.normalizePath)(settings.metricsRoot ?? DEFAULT_SETTINGS.metricsRoot),
    supportedExtensions: Array.from(
      new Set(
        supportedExtensions.map((value) => value.trim()).filter((value) => value.length > 0)
      )
    ),
    defaultWriteFile: (0, import_obsidian.normalizePath)(settings.defaultWriteFile ?? DEFAULT_SETTINGS.defaultWriteFile),
    recordReferencePrefix: settings.recordReferencePrefix?.trim() || DEFAULT_SETTINGS.recordReferencePrefix
  };
}
function formatExtensions(extensions) {
  return extensions.join(", ");
}
function parseExtensions(value) {
  return value.split(",").map((item) => item.trim()).filter((item) => item.length > 0);
}
var MetricsSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  plugin;
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("Storage").setHeading();
    new import_obsidian.Setting(containerEl).setName("Metrics root folder").setDesc("Folder scanned for canonical metrics files.").addText((text) => {
      text.setPlaceholder(DEFAULT_SETTINGS.metricsRoot);
      text.setValue(this.plugin.settings.metricsRoot);
      text.onChange(async (value) => {
        this.plugin.settings.metricsRoot = (0, import_obsidian.normalizePath)(value || DEFAULT_SETTINGS.metricsRoot);
        await this.plugin.saveSettings();
        this.plugin.refreshOpenMetricsViews();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Supported extensions").setDesc("Comma-separated list of file suffixes treated as metrics files.").addText((text) => {
      text.setPlaceholder(formatExtensions(DEFAULT_SETTINGS.supportedExtensions));
      text.setValue(formatExtensions(this.plugin.settings.supportedExtensions));
      text.onChange(async (value) => {
        this.plugin.settings.supportedExtensions = parseExtensions(value);
        await this.plugin.saveSettings();
        this.plugin.refreshOpenMetricsViews();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Default write file").setDesc("Default target file used by future create and append actions.").addText((text) => {
      text.setPlaceholder(DEFAULT_SETTINGS.defaultWriteFile);
      text.setValue(this.plugin.settings.defaultWriteFile);
      text.onChange(async (value) => {
        this.plugin.settings.defaultWriteFile = (0, import_obsidian.normalizePath)(
          value || DEFAULT_SETTINGS.defaultWriteFile
        );
        await this.plugin.saveSettings();
        this.plugin.refreshOpenMetricsViews();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Record reference prefix").setDesc("Plain-text prefix used for stable metric references in Markdown.").addText((text) => {
      text.setPlaceholder(DEFAULT_SETTINGS.recordReferencePrefix);
      text.setValue(this.plugin.settings.recordReferencePrefix);
      text.onChange(async (value) => {
        this.plugin.settings.recordReferencePrefix = value.trim() || DEFAULT_SETTINGS.recordReferencePrefix;
        await this.plugin.saveSettings();
        this.plugin.refreshOpenMetricsViews();
      });
    });
  }
};

// src/view.ts
var import_obsidian2 = require("obsidian");

// src/contract.ts
var METRIC_REFERENCE_PREFIX = "metric:";
function toMetricReference(id, prefix = METRIC_REFERENCE_PREFIX) {
  return `${prefix}${id}`;
}

// src/view.ts
var METRICS_VIEW_TYPE = "metrics-file-view";
function stripMetricsSuffix(fileName, extensions) {
  const matchingExtension = extensions.find((extension) => fileName.endsWith(extension));
  if (matchingExtension) {
    return fileName.slice(0, -matchingExtension.length);
  }
  return fileName;
}
function capitalizeDisplayName(value) {
  if (value.length === 0) {
    return "Metrics";
  }
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
function summarizeMetricsData(data) {
  const lines = data.split("\n").map((line) => line.trimEnd()).filter((line) => line.trim().length > 0);
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
    preview: lines.slice(0, 8).join("\n")
  };
}
var MetricsFileView = class extends import_obsidian2.TextFileView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }
  plugin;
  allowNoFile = true;
  getViewType() {
    return METRICS_VIEW_TYPE;
  }
  getDisplayText() {
    if (!this.file) {
      return "Metrics";
    }
    const baseName = stripMetricsSuffix(this.file.name, this.plugin.settings.supportedExtensions);
    return capitalizeDisplayName(baseName);
  }
  getIcon() {
    return "list";
  }
  async onOpen() {
    this.contentEl.classList.add("metrics-lens-view-root");
    this.render();
  }
  clear() {
    this.data = "";
    this.render();
  }
  getViewData() {
    return this.data ?? "";
  }
  setViewData(data, clear) {
    this.data = data;
    if (clear) {
      this.clear();
      this.data = data;
    }
    this.render();
  }
  refreshView() {
    this.render();
  }
  render() {
    this.contentEl.empty();
    const container = this.contentEl.createDiv({ cls: "metrics-lens-view" });
    const summary = summarizeMetricsData(this.data ?? "");
    const status = container.createDiv({ cls: "metrics-lens-status" });
    status.setText(
      this.file ? "Metrics file view is active. Full CRUD lens is the next implementation step." : "No metrics file is open. Open a .metrics.ndjson file from the file browser."
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
      text: `Display name: ${capitalizeDisplayName(stripMetricsSuffix(this.file.name, this.plugin.settings.supportedExtensions))}`
    });
    fileList.createEl("li", {
      text: `Path: ${this.file.path}`
    });
    fileList.createEl("li", {
      text: `Logical line count: ${summary.totalLines}`
    });
    fileList.createEl("li", {
      text: `Valid JSON records: ${summary.validRecords}`
    });
    fileList.createEl("li", {
      text: `Invalid lines: ${summary.invalidLines}`
    });
    fileList.createEl("li", {
      text: `Reference example: ${toMetricReference("01JRX9Y7T9TQ8Q3A91F1M7A4AA", this.plugin.settings.recordReferencePrefix)}`
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
};

// src/main.ts
var MetricsPlugin = class extends import_obsidian3.Plugin {
  settings = DEFAULT_SETTINGS;
  suppressedAutoOpenPaths = /* @__PURE__ */ new Set();
  async onload() {
    await this.loadSettings();
    this.registerView(
      METRICS_VIEW_TYPE,
      (leaf) => new MetricsFileView(leaf, this)
    );
    this.registerExtensions(
      this.settings.supportedExtensions.map((extension) => extension.replace(/^\./, "")),
      METRICS_VIEW_TYPE
    );
    this.addCommand({
      id: "open-current-file",
      name: "Open current metrics file",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || !this.isMetricsFile(file)) {
          return false;
        }
        if (!checking) {
          void this.openFileInMetricsView(file, this.app.workspace.activeLeaf);
        }
        return true;
      }
    });
    this.addCommand({
      id: "open-view",
      name: "Open metrics view",
      callback: async () => {
        await this.activateView();
      }
    });
    this.addSettingTab(new MetricsSettingTab(this.app, this));
    this.registerEvent(
      this.app.workspace.on("file-open", (file) => {
        this.queueAutoOpen(file);
      })
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        const file = this.fileForLeaf(leaf);
        this.queueAutoOpen(file, leaf);
      })
    );
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        const file = this.app.workspace.getActiveFile();
        this.queueAutoOpen(file, this.app.workspace.activeLeaf);
      })
    );
    this.registerEvent(this.app.vault.on("modify", () => this.refreshOpenMetricsViews()));
    this.app.workspace.onLayoutReady(() => {
      const activeFile = this.app.workspace.getActiveFile();
      this.queueAutoOpen(activeFile, this.app.workspace.activeLeaf);
    });
  }
  async onunload() {
    for (const leaf of this.app.workspace.getLeavesOfType(METRICS_VIEW_TYPE)) {
      const view = leaf.view;
      if (!(view instanceof MetricsFileView) || !view.file) {
        continue;
      }
      this.suppressAutoOpenForPath(view.file.path);
      await leaf.setViewState({
        type: "markdown",
        state: { file: view.file.path },
        active: false
      });
    }
  }
  async loadSettings() {
    const loaded = await this.loadData();
    this.settings = normalizeMetricsSettings(loaded ?? DEFAULT_SETTINGS);
  }
  async saveSettings() {
    this.settings = normalizeMetricsSettings(this.settings);
    await this.saveData(this.settings);
  }
  async activateView() {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile && this.isMetricsFile(activeFile)) {
      await this.openFileInMetricsView(activeFile, this.app.workspace.activeLeaf);
      return;
    }
    const existingLeaf = this.app.workspace.getLeavesOfType(METRICS_VIEW_TYPE)[0];
    const leaf = existingLeaf ?? this.app.workspace.getRightLeaf(false);
    if (!leaf) {
      return;
    }
    await leaf.setViewState({
      type: METRICS_VIEW_TYPE,
      active: true
    });
    this.app.workspace.revealLeaf(leaf);
  }
  refreshOpenMetricsViews() {
    this.app.workspace.getLeavesOfType(METRICS_VIEW_TYPE).forEach((leaf) => {
      const view = leaf.view;
      if (view instanceof MetricsFileView) {
        view.refreshView();
      }
    });
  }
  suppressAutoOpenForPath(path) {
    this.suppressedAutoOpenPaths.add(path);
  }
  isMetricsFile(file) {
    return Boolean(
      file && this.settings.supportedExtensions.some((extension) => file.path.endsWith(extension))
    );
  }
  async openFileInMetricsView(file, leaf) {
    if (!leaf) {
      new import_obsidian3.Notice("No active pane is available.");
      return;
    }
    await leaf.setViewState({
      type: METRICS_VIEW_TYPE,
      state: { file: file.path },
      active: true
    });
  }
  async maybeAutoOpenFile(file, leaf) {
    if (!file || !this.isMetricsFile(file)) {
      return;
    }
    if (this.suppressedAutoOpenPaths.has(file.path)) {
      this.suppressedAutoOpenPaths.delete(file.path);
      return;
    }
    const targetLeaf = leaf ?? this.findLeafShowingFile(file) ?? this.app.workspace.activeLeaf;
    if (!targetLeaf || targetLeaf.view.getViewType() === METRICS_VIEW_TYPE) {
      return;
    }
    const visibleFile = this.fileForLeaf(targetLeaf);
    if (!visibleFile || visibleFile.path !== file.path) {
      return;
    }
    await this.openFileInMetricsView(file, targetLeaf);
  }
  queueAutoOpen(file, leaf) {
    window.setTimeout(() => {
      void this.maybeAutoOpenFile(file, leaf ?? null);
    }, 0);
  }
  findLeafShowingFile(file) {
    let matchedLeaf = null;
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (matchedLeaf) {
        return;
      }
      const visibleFile = this.fileForLeaf(leaf);
      if (visibleFile?.path === file.path) {
        matchedLeaf = leaf;
      }
    });
    return matchedLeaf;
  }
  fileForLeaf(leaf) {
    if (!leaf) {
      return null;
    }
    const view = leaf.view;
    if ("file" in view) {
      return view.file ?? null;
    }
    return null;
  }
};
