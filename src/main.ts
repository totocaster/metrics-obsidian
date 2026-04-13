import { Editor, FileView, MarkdownView, Notice, Plugin, TFile, TFolder, WorkspaceLeaf } from "obsidian";

import {
  extractMetricIdFromText,
  findMetricIdAtOffset,
  type MetricRecord,
} from "./contract";
import { MetricReferenceModal } from "./metric-reference-modal";
import { MetricRecordModal } from "./metric-record-modal";
import { analyzeMetricsData, type ParsedMetricRow } from "./metrics-file-model";
import {
  appendMetricRecordToMetricsData,
  assignMissingIdsToMetricsData,
  deleteMetricRecordFromMetricsData,
  MetricsMutationError,
  type MetricRecordInput,
  updateMetricRecordInMetricsData,
} from "./metrics-file-mutation";
import { DEFAULT_SETTINGS, MetricsPluginSettings, MetricsSettingTab, normalizeMetricsSettings } from "./settings";
import { logicalMetricsBaseName, METRICS_VIEW_TYPE, MetricsFileView } from "./view";

interface ResolvedMetricReference {
  file: TFile;
  row: ParsedMetricRow;
}

export default class MetricsPlugin extends Plugin {
  settings: MetricsPluginSettings = DEFAULT_SETTINGS;
  private readonly suppressedAutoOpenPaths = new Set<string>();
  private fileExplorerObserver: MutationObserver | null = null;
  private fileExplorerSyncQueued = false;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.registerView(
      METRICS_VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new MetricsFileView(leaf, this),
    );

    this.registerExtensions(this.metricsViewExtensions(), METRICS_VIEW_TYPE);
    this.registerExtensions(this.fileBrowserFallbackExtensions(), "markdown");

    this.addCommand({
      id: "open-current-file",
      name: "Open current metrics file",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || !this.isMetricsFile(file)) {
          return false;
        }

        if (!checking) {
          void this.openMetricsFile(file, this.app.workspace.activeLeaf);
        }

        return true;
      },
    });

    this.addCommand({
      id: "assign-missing-ids-current-file",
      name: "Assign missing ids in current metrics file",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || !this.isMetricsFile(file)) {
          return false;
        }

        if (!checking) {
          void this.assignMissingIds(file);
        }

        return true;
      },
    });

    this.addCommand({
      id: "add-record-current-file",
      name: "Add record to current metrics file",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || !this.isMetricsFile(file)) {
          return false;
        }

        if (!checking) {
          this.openCreateRecordModal(file);
        }

        return true;
      },
    });

    this.addCommand({
      id: "open-view",
      name: "Open metrics view",
      callback: async () => {
        await this.activateView();
      },
    });

    this.addCommand({
      id: "open-reference",
      name: "Open metric reference",
      callback: () => {
        this.openMetricReferenceModal();
      },
    });

    this.addCommand({
      id: "open-reference-under-cursor",
      name: "Open metric reference under cursor",
      editorCheckCallback: (checking, editor) => {
        const metricId = this.metricIdFromEditor(editor);
        if (!metricId) {
          return false;
        }

        if (!checking) {
          void this.openMetricReference(metricId);
        }

        return true;
      },
    });

    this.addSettingTab(new MetricsSettingTab(this.app, this));

    this.registerEvent(
      this.app.workspace.on("file-open", (file) => {
        this.queueAutoOpen(file);
      }),
    );

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        const file = this.fileForLeaf(leaf);
        this.queueAutoOpen(file, leaf);
      }),
    );

    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        const file = this.app.workspace.getActiveFile();
        this.queueAutoOpen(file, this.app.workspace.activeLeaf);
      }),
    );

    this.registerEvent(this.app.vault.on("modify", () => this.refreshOpenMetricsViews()));
    this.registerEvent(this.app.vault.on("create", () => this.refreshOpenMetricsViews()));
    this.registerEvent(this.app.vault.on("delete", () => this.refreshOpenMetricsViews()));
    this.registerEvent(this.app.vault.on("rename", () => this.refreshOpenMetricsViews()));

    this.app.workspace.onLayoutReady(() => {
      const activeFile = this.app.workspace.getActiveFile();
      this.queueAutoOpen(activeFile, this.app.workspace.activeLeaf);
      this.installFileExplorerObserver();
      this.queueFileExplorerLabelSync();
    });
  }

  async onunload(): Promise<void> {
    this.fileExplorerObserver?.disconnect();
    this.fileExplorerObserver = null;
    this.restoreFileExplorerLabels();

    for (const leaf of this.app.workspace.getLeavesOfType(METRICS_VIEW_TYPE)) {
      const view = leaf.view;
      if (!(view instanceof MetricsFileView) || !view.file) {
        continue;
      }

      this.suppressAutoOpenForPath(view.file.path);
      await leaf.setViewState({
        type: "markdown",
        state: { file: view.file.path },
        active: false,
      });
    }
  }

  async loadSettings(): Promise<void> {
    const loaded = (await this.loadData()) as Partial<MetricsPluginSettings> | null;
    this.settings = normalizeMetricsSettings(loaded ?? DEFAULT_SETTINGS);
  }

  async saveSettings(): Promise<void> {
    this.settings = normalizeMetricsSettings(this.settings);
    await this.saveData(this.settings);
  }

  async activateView(): Promise<void> {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile && this.isMetricsFile(activeFile)) {
      await this.openMetricsFile(activeFile, this.app.workspace.activeLeaf);
      return;
    }

    const existingLeaf = this.app.workspace.getLeavesOfType(METRICS_VIEW_TYPE)[0];
    const leaf = existingLeaf ?? this.app.workspace.getRightLeaf(false);

    if (!leaf) {
      return;
    }

    await leaf.setViewState({
      type: METRICS_VIEW_TYPE,
      active: true,
    });

    this.app.workspace.revealLeaf(leaf);
  }

  refreshOpenMetricsViews(): void {
    this.app.workspace.getLeavesOfType(METRICS_VIEW_TYPE).forEach((leaf) => {
      const view = leaf.view;
      if (view instanceof MetricsFileView) {
        view.refreshView();
      }
    });

    this.queueFileExplorerLabelSync();
  }

  async assignMissingIds(file: TFile): Promise<void> {
    let assigned = 0;
    let skipped = 0;

    await this.app.vault.process(file, (data) => {
      const result = assignMissingIdsToMetricsData(data);
      assigned = result.assigned;
      skipped = result.skipped;
      return result.content;
    });

    if (assigned === 0) {
      new Notice(
        skipped > 0
          ? "No missing ids were assigned. Some rows were skipped because they are invalid."
          : "No missing ids were found in this metrics file.",
      );
      return;
    }

    new Notice(
      skipped > 0
        ? `Assigned ${assigned} ids. Skipped ${skipped} invalid rows.`
        : `Assigned ${assigned} ids.`,
    );
    this.refreshOpenMetricsViews();
  }

  openCreateRecordModal(file: TFile): void {
    const modal = new MetricRecordModal(
      this.app,
      {
        submitLabel: "Add record",
        title: `Add record to ${logicalMetricsBaseName(file.name, this.settings.supportedExtensions)}`,
      },
      (recordInput) => {
        void this.createRecord(file, recordInput);
      },
    );
    modal.open();
  }

  openEditRecordModal(file: TFile, record: MetricRecord): void {
    const modal = new MetricRecordModal(
      this.app,
      {
        initialRecord: record,
        submitLabel: "Save record",
        title: `Edit ${record.key}`,
      },
      (recordInput) => {
        void this.updateRecord(file, record.id, recordInput);
      },
    );
    modal.open();
  }

  async createRecord(file: TFile, recordInput: MetricRecordInput): Promise<void> {
    try {
      let createdId = "";

      await this.app.vault.process(file, (data) => {
        const result = appendMetricRecordToMetricsData(data, recordInput);
        createdId = result.record.id;
        return result.content;
      });

      new Notice(`Added metrics record ${createdId}.`);
      this.refreshOpenMetricsViews();
    } catch (error) {
      this.handleMutationError(error);
    }
  }

  async updateRecord(file: TFile, recordId: string, recordInput: MetricRecordInput): Promise<void> {
    try {
      await this.app.vault.process(file, (data) => {
        const result = updateMetricRecordInMetricsData(data, recordId, recordInput);
        return result.content;
      });

      new Notice(`Updated metrics record ${recordId}.`);
      this.refreshOpenMetricsViews();
    } catch (error) {
      this.handleMutationError(error);
    }
  }

  async deleteRecord(file: TFile, recordId: string): Promise<void> {
    try {
      await this.app.vault.process(file, (data) => {
        const result = deleteMetricRecordFromMetricsData(data, recordId);
        return result.content;
      });

      new Notice(`Deleted metrics record ${recordId}.`);
      this.refreshOpenMetricsViews();
    } catch (error) {
      this.handleMutationError(error);
    }
  }

  confirmDeleteRecord(file: TFile, record: MetricRecord): void {
    if (!window.confirm(`Delete ${record.key} (${record.id}) from ${file.name}?`)) {
      return;
    }

    void this.deleteRecord(file, record.id);
  }

  async openMetricsFile(file: TFile, leaf: WorkspaceLeaf | null): Promise<void> {
    if (!leaf) {
      new Notice("No active pane is available.");
      return;
    }

    await leaf.setViewState({
      type: METRICS_VIEW_TYPE,
      state: { file: file.path },
      active: true,
    });
  }

  openMetricReferenceModal(initialValue?: string): void {
    const selection = initialValue ?? this.selectedMetricReferenceText();
    const modal = new MetricReferenceModal(this.app, { initialValue: selection }, (value) => {
      void this.openMetricReference(value);
    });
    modal.open();
  }

  async openMetricReference(value: string): Promise<void> {
    const metricId = extractMetricIdFromText(value, this.settings.recordReferencePrefix);
    if (!metricId) {
      new Notice("Metric reference must look like `metric:<id>` or a raw ULID.");
      return;
    }

    const resolved = await this.resolveMetricReference(metricId);
    if (!resolved) {
      return;
    }

    const targetLeaf = this.metricReferenceLeaf(resolved.file);
    await this.openMetricsFile(resolved.file, targetLeaf);

    const view = targetLeaf?.view;
    if (view instanceof MetricsFileView) {
      view.focusMetricRecord(metricId);
    }

    if (targetLeaf) {
      this.app.workspace.revealLeaf(targetLeaf);
    }
  }

  private handleMutationError(error: unknown): void {
    if (error instanceof MetricsMutationError) {
      new Notice(error.message);
      return;
    }

    if (error instanceof Error) {
      new Notice(error.message);
      return;
    }

    new Notice("Metrics mutation failed.");
  }

  private metricIdFromEditor(editor: Editor): string | null {
    const selection = editor.getSelection();
    if (selection.trim().length > 0) {
      return extractMetricIdFromText(selection, this.settings.recordReferencePrefix);
    }

    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    return findMetricIdAtOffset(line, cursor.ch, this.settings.recordReferencePrefix);
  }

  private selectedMetricReferenceText(): string {
    const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!markdownView) {
      return "";
    }

    return markdownView.editor.getSelection().trim();
  }

  private async resolveMetricReference(metricId: string): Promise<ResolvedMetricReference | null> {
    const metricsFiles = this.metricsFilesInScope();
    if (metricsFiles.length === 0) {
      new Notice(`No metrics files were found under ${this.settings.metricsRoot}.`);
      return null;
    }

    const matches: ResolvedMetricReference[] = [];

    for (const file of metricsFiles) {
      const data = await this.app.vault.cachedRead(file);
      const analysis = analyzeMetricsData(data);

      analysis.rows.forEach((row) => {
        if (row.metric?.id === metricId) {
          matches.push({ file, row });
        }
      });
    }

    if (matches.length === 0) {
      new Notice(`Metric reference ${metricId} was not found.`);
      return null;
    }

    if (matches.length > 1) {
      new Notice(
        `Metric reference ${metricId} matched ${matches.length} records. Resolve duplicate ids before using references.`,
      );
      return null;
    }

    return matches[0] ?? null;
  }

  private suppressAutoOpenForPath(path: string): void {
    this.suppressedAutoOpenPaths.add(path);
  }

  private metricsViewExtensions(): string[] {
    return this.settings.supportedExtensions
      .map((extension) => extension.replace(/^\./, ""))
      .filter((extension) => extension.length > 0);
  }

  private fileBrowserFallbackExtensions(): string[] {
    return Array.from(
      new Set(
        this.metricsViewExtensions()
          .map((extension) => extension.split(".").pop() ?? "")
          .filter((extension) => extension.length > 0),
      ),
    );
  }

  private isMetricsFile(file: TFile | null): file is TFile {
    return Boolean(
      file &&
        this.settings.supportedExtensions.some((extension) => file.path.endsWith(extension)),
    );
  }

  private isMetricsPath(path: string | null): boolean {
    return Boolean(
      path &&
        this.settings.supportedExtensions.some((extension) => path.endsWith(extension)),
    );
  }

  private metricsFilesInScope(): TFile[] {
    const root = this.app.vault.getAbstractFileByPath(this.settings.metricsRoot);
    if (!(root instanceof TFolder)) {
      return [];
    }

    return this.collectMetricsFiles(root);
  }

  private collectMetricsFiles(folder: TFolder): TFile[] {
    const files: TFile[] = [];

    folder.children.forEach((child) => {
      if (child instanceof TFile) {
        if (this.isMetricsFile(child)) {
          files.push(child);
        }
        return;
      }

      if (child instanceof TFolder) {
        files.push(...this.collectMetricsFiles(child));
      }
    });

    return files;
  }

  private metricReferenceLeaf(file: TFile): WorkspaceLeaf | null {
    const existingFileLeaf = this.findLeafShowingFile(file);
    if (existingFileLeaf) {
      return existingFileLeaf;
    }

    const existingMetricsLeaf = this.app.workspace.getLeavesOfType(METRICS_VIEW_TYPE)[0];
    if (existingMetricsLeaf) {
      return existingMetricsLeaf;
    }

    return this.app.workspace.getRightLeaf(false) ?? this.app.workspace.activeLeaf;
  }

  private async maybeAutoOpenFile(file: TFile | null, leaf: WorkspaceLeaf | null): Promise<void> {
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

    await this.openMetricsFile(file, targetLeaf);
  }

  private queueAutoOpen(file: TFile | null, leaf?: WorkspaceLeaf | null): void {
    window.setTimeout(() => {
      void this.maybeAutoOpenFile(file, leaf ?? null);
    }, 0);
  }

  private findLeafShowingFile(file: TFile): WorkspaceLeaf | null {
    let matchedLeaf: WorkspaceLeaf | null = null;

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

  private fileForLeaf(leaf: WorkspaceLeaf | null): TFile | null {
    if (!leaf) {
      return null;
    }

    const view = leaf.view as FileView;
    if ("file" in view) {
      return view.file ?? null;
    }

    return null;
  }

  private installFileExplorerObserver(): void {
    if (this.fileExplorerObserver) {
      this.fileExplorerObserver.disconnect();
    }

    this.fileExplorerObserver = new MutationObserver(() => {
      this.queueFileExplorerLabelSync();
    });

    this.fileExplorerObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private queueFileExplorerLabelSync(): void {
    if (this.fileExplorerSyncQueued) {
      return;
    }

    this.fileExplorerSyncQueued = true;
    window.requestAnimationFrame(() => {
      this.fileExplorerSyncQueued = false;
      this.syncFileExplorerLabels();
    });
  }

  private syncFileExplorerLabels(): void {
    const titleEls = document.querySelectorAll<HTMLElement>(".nav-file-title[data-path]");

    titleEls.forEach((titleEl) => {
      const path = titleEl.getAttribute("data-path");
      const contentEl =
        titleEl.querySelector<HTMLElement>(".nav-file-title-content") ??
        titleEl.querySelector<HTMLElement>(".tree-item-inner");

      if (!path || !contentEl || titleEl.querySelector("input")) {
        return;
      }

      if (!this.isMetricsPath(path)) {
        if (contentEl.dataset.metricsOriginalLabel !== undefined) {
          contentEl.textContent = contentEl.dataset.metricsOriginalLabel;
          delete contentEl.dataset.metricsOriginalLabel;
        }
        return;
      }

      if (contentEl.dataset.metricsOriginalLabel === undefined) {
        contentEl.dataset.metricsOriginalLabel = contentEl.textContent ?? "";
      }

      const fileName = path.split("/").pop() ?? path;
      contentEl.textContent = logicalMetricsBaseName(fileName, this.settings.supportedExtensions);
    });
  }

  private restoreFileExplorerLabels(): void {
    const titleEls = document.querySelectorAll<HTMLElement>(".nav-file-title[data-path]");

    titleEls.forEach((titleEl) => {
      const contentEl =
        titleEl.querySelector<HTMLElement>(".nav-file-title-content") ??
        titleEl.querySelector<HTMLElement>(".tree-item-inner");

      if (!contentEl || contentEl.dataset.metricsOriginalLabel === undefined) {
        return;
      }

      contentEl.textContent = contentEl.dataset.metricsOriginalLabel;
      delete contentEl.dataset.metricsOriginalLabel;
    });
  }

}
