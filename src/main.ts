import {
  FileView,
  Modal,
  Notice,
  Plugin,
  TFile,
  TFolder,
  WorkspaceLeaf,
  normalizePath,
} from "obsidian";

import {
  type MetricRecord,
} from "./contract";
import { ScopedFileExplorerRelabelController } from "./file-explorer-relabel-controller";
import {
  MetricCatalogMetricEditorModal,
  MetricCatalogUnitEditorModal,
} from "./metric-catalog-editor-modal";
import { applyCustomMetricCatalog, displayMetricName } from "./metric-catalog";
import { MetricRecordModal } from "./metric-record-modal";
import { formatMetricDisplayValue, rawValuePrecision } from "./metric-value-format";
import {
  appendMetricRecordToMetricsData,
  assignMissingIdsToMetricsData,
  deleteMetricRecordFromMetricsData,
  MetricsMutationError,
  type MetricRecordInput,
  updateMetricRecordInMetricsData,
} from "./metrics-file-mutation";
import { analyzeMetricsData, type ParsedMetricRow } from "./metrics-file-model";
import { MetricsFileModal } from "./metrics-file-modal";
import {
  collectOpenMetricsViewPaths,
  refreshableMetricsViewPathsForVaultChange,
  type MetricsVaultChange,
} from "./metrics-refresh-scope";
import { MetricsSearchModal, type MetricsSearchResult } from "./metrics-search-modal";
import { DEFAULT_SETTINGS, MetricsPluginSettings, MetricsSettingTab, normalizeMetricsSettings } from "./settings";
import { logicalMetricsBaseName, METRICS_VIEW_TYPE, MetricsFileView } from "./view";
import {
  createDefaultViewState,
  normalizeMetricsViewState,
  type MetricsViewState,
  type PersistedMetricsViewState,
} from "./view-state";

function normalizeMetricsSearchContent(content: string): string {
  return content.replace(/\s+/g, " ").trim();
}

function relativeMetricsSearchPath(path: string, metricsRoot: string, supportedExtensions: string[]): string {
  const normalizedRoot = normalizePath(metricsRoot);
  let relativePath = path.startsWith(`${normalizedRoot}/`) ? path.slice(normalizedRoot.length + 1) : path;
  const matchingExtension = supportedExtensions.find((extension) => relativePath.endsWith(extension));
  if (matchingExtension) {
    relativePath = relativePath.slice(0, -matchingExtension.length);
  }
  return relativePath;
}

function searchResultValueLabel(row: ParsedMetricRow): string | null {
  const value = row.metric?.value;
  if (typeof value !== "number") {
    return null;
  }

  return formatMetricDisplayValue(value, row.metric?.unit, {
    includeUnit: true,
    metricKey: row.metric?.key,
    rawPrecision: rawValuePrecision(row.rawLine),
  });
}

function searchResultTimestampLabel(row: ParsedMetricRow): string | null {
  if (typeof row.metric?.date === "string" && row.metric.date.length > 0) {
    return row.metric.date;
  }

  if (typeof row.metric?.ts === "string" && row.metric.ts.length > 0) {
    return row.metric.ts;
  }

  return null;
}

function buildMetricsSearchResult(
  file: TFile,
  row: ParsedMetricRow,
  metricsRoot: string,
  supportedExtensions: string[],
  metricNameDisplayMode: MetricsPluginSettings["metricNameDisplayMode"],
): MetricsSearchResult {
  const metricLabel = displayMetricName(row.metric?.key, metricNameDisplayMode);
  const valueLabel = searchResultValueLabel(row);
  const timestampLabel = searchResultTimestampLabel(row);
  const sourceLabel =
    typeof row.metric?.source === "string" && row.metric.source.length > 0 ? row.metric.source : null;
  const noteLabel =
    typeof row.metric?.note === "string" && row.metric.note.length > 0 ? row.metric.note : null;
  const primaryText = valueLabel ? `${metricLabel} ${valueLabel}` : metricLabel;
  const secondaryParts = [timestampLabel, sourceLabel].filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
  if (noteLabel) {
    secondaryParts.push(noteLabel);
  }
  const displayPath = relativeMetricsSearchPath(file.path, metricsRoot, supportedExtensions);

  return {
    file,
    lineNumber: row.lineNumber,
    metricId: typeof row.metric?.id === "string" && row.metric.id.length > 0 ? row.metric.id : null,
    primaryText,
    secondaryText: secondaryParts.length > 0 ? secondaryParts.join(" · ") : null,
    searchText: normalizeMetricsSearchContent(
      [displayPath, metricLabel, row.rawLine].filter((value) => value.length > 0).join(" "),
    ),
    tertiaryText: `${displayPath} · line ${row.lineNumber}`,
  };
}

class ConfirmDeleteMetricRecordModal extends Modal {
  constructor(
    plugin: MetricsPlugin,
    private readonly file: TFile,
    private readonly record: MetricRecord,
  ) {
    super(plugin.app);
    this.onConfirm = () => {
      void plugin.deleteRecord(this.file, this.record.id);
    };
  }

  private readonly onConfirm: () => void;

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: "Delete record" });
    contentEl.createEl("p", {
      text: `Delete ${this.record.key} (${this.record.id}) from ${this.file.name}?`,
    });

    const actions = contentEl.createDiv({ cls: "metrics-lens-actions" });
    const cancelButton = actions.createEl("button", { text: "Cancel" });
    cancelButton.type = "button";
    cancelButton.addEventListener("click", () => {
      this.close();
    });

    const deleteButton = actions.createEl("button", {
      cls: "mod-warning",
      text: "Delete",
    });
    deleteButton.type = "button";
    deleteButton.addEventListener("click", () => {
      this.onConfirm();
      this.close();
    });
  }
}

export default class MetricsPlugin extends Plugin {
  settings: MetricsPluginSettings = DEFAULT_SETTINGS;
  private readonly suppressedAutoOpenPaths = new Set<string>();
  private readonly fileExplorerRelabelController = new ScopedFileExplorerRelabelController({
    formatLabel: (fileName) => logicalMetricsBaseName(fileName, this.settings.supportedExtensions),
    isMetricsPath: (path) => this.isMetricsPath(path),
  });
  private persistViewStateTimer: number | null = null;

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
      name: "Open current file",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || !this.isMetricsFile(file)) {
          return false;
        }

        if (!checking) {
          void this.openMetricsFile(file, this.navigationLeaf());
        }

        return true;
      },
    });

    this.addCommand({
      id: "assign-missing-ids-current-file",
      name: "Assign missing ids in current file",
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
      name: "Add record to current file",
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
      id: "search",
      name: "Search",
      callback: () => {
        void this.openMetricsSearchModal();
      },
    });

    this.addCommand({
      id: "new-file",
      name: "New file",
      callback: () => {
        this.openCreateMetricsFileModal();
      },
    });

    this.addCommand({
      id: "rename-current-file",
      name: "Rename current file",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || !this.isMetricsFile(file)) {
          return false;
        }

        if (!checking) {
          this.openRenameMetricsFileModal(file);
        }

        return true;
      },
    });

    this.addCommand({
      id: "delete-current-file",
      name: "Delete current file",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || !this.isMetricsFile(file)) {
          return false;
        }

        if (!checking) {
          this.confirmDeleteMetricsFile(file);
        }

        return true;
      },
    });

    this.addCommand({
      id: "open-view",
      name: "Open view",
      callback: () => {
        void this.activateView();
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
        this.queueAutoOpen(file, this.activeFileLeaf());
        this.refreshFileExplorerObservers();
        this.queueFileExplorerLabelSync();
      }),
    );

    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        this.refreshMetricsViewsForVaultChange({
          kind: "modify",
          path: file.path,
        });
      }),
    );
    this.registerEvent(
      this.app.vault.on("create", (file) => {
        const change: MetricsVaultChange = {
          kind: "create",
          path: file.path,
        };
        this.refreshMetricsViewsForVaultChange(change);
        this.queueFileExplorerLabelSyncForChange(change);
      }),
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        const deletedPath = normalizePath(file.path);
        const change: MetricsVaultChange = {
          kind: "delete",
          path: deletedPath,
        };

        if (this.isMetricsPath(deletedPath)) {
          this.forgetPersistedViewStateForPath(deletedPath);
          void this.resetDeletedMetricsLeaves(deletedPath);
        }

        this.queueFileExplorerLabelSyncForChange(change);
      }),
    );
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        const change: MetricsVaultChange = {
          kind: "rename",
          oldPath,
          path: file.path,
        };

        if (file instanceof TFile) {
          this.handleMetricsFileRename(file, oldPath);
        } else if (this.isMetricsPath(normalizePath(oldPath))) {
          this.forgetPersistedViewStateForPath(oldPath);
        }
        this.refreshMetricsViewsForVaultChange(change);
        this.queueFileExplorerLabelSyncForChange(change);
      }),
    );

    this.app.workspace.onLayoutReady(() => {
      const activeFile = this.app.workspace.getActiveFile();
      this.queueAutoOpen(activeFile, this.activeFileLeaf());
      this.refreshFileExplorerObservers();
      this.queueFileExplorerLabelSync();
    });
  }

  onunload(): void {
    if (this.persistViewStateTimer !== null) {
      window.clearTimeout(this.persistViewStateTimer);
      this.persistViewStateTimer = null;
      void this.saveSettings();
    }

    this.fileExplorerRelabelController.disconnect();
    void this.restoreMetricsLeavesOnUnload();
  }

  private async restoreMetricsLeavesOnUnload(): Promise<void> {
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
    applyCustomMetricCatalog(this.settings.customCatalog);
  }

  async saveSettings(): Promise<void> {
    this.settings = normalizeMetricsSettings(this.settings);
    applyCustomMetricCatalog(this.settings.customCatalog);
    await this.saveData(this.settings);
  }

  openMetricCatalogMetricEditor(options?: {
    initialKey?: string;
    initialUnit?: string | null;
    onSaved?: () => void;
  }): void {
    new MetricCatalogMetricEditorModal(this.app, this, options).open();
  }

  openMetricCatalogUnitEditor(options?: {
    initialUnit?: string;
    onSaved?: () => void;
  }): void {
    new MetricCatalogUnitEditorModal(this.app, this, options).open();
  }

  getPersistedViewState(filePath: string | null): PersistedMetricsViewState {
    if (!filePath) {
      return {
        advancedControlsExpanded: false,
        viewState: createDefaultViewState(),
      };
    }

    const persistedViewState = this.settings.persistedViewStateByPath[filePath];
    if (!persistedViewState) {
      return {
        advancedControlsExpanded: false,
        viewState: createDefaultViewState(),
      };
    }

    const { advancedControlsExpanded, viewState } = persistedViewState;
    return {
      advancedControlsExpanded,
      viewState: normalizeMetricsViewState(viewState),
    };
  }

  persistViewState(
    filePath: string | null,
    viewState: MetricsViewState,
    advancedControlsExpanded: boolean,
  ): void {
    if (!filePath) {
      return;
    }

    this.settings.persistedViewStateByPath[filePath] = {
      advancedControlsExpanded,
      viewState: normalizeMetricsViewState(viewState),
    };
    this.queuePersistedViewStateSave();
  }

  resetPersistedViewState(filePath: string | null): void {
    if (!filePath) {
      return;
    }

    delete this.settings.persistedViewStateByPath[filePath];
    this.queuePersistedViewStateSave();
  }

  forgetPersistedViewStateForPath(filePath: string | null): void {
    if (!filePath || !(filePath in this.settings.persistedViewStateByPath)) {
      return;
    }

    delete this.settings.persistedViewStateByPath[filePath];
    this.queuePersistedViewStateSave();
  }

  movePersistedViewState(oldPath: string, newPath: string): void {
    const persisted = this.settings.persistedViewStateByPath[oldPath];
    if (!persisted) {
      return;
    }

    this.settings.persistedViewStateByPath[newPath] = persisted;
    delete this.settings.persistedViewStateByPath[oldPath];
    this.queuePersistedViewStateSave();
  }

  private queuePersistedViewStateSave(): void {
    if (this.persistViewStateTimer !== null) {
      window.clearTimeout(this.persistViewStateTimer);
    }

    this.persistViewStateTimer = window.setTimeout(() => {
      this.persistViewStateTimer = null;
      void this.saveSettings();
    }, 200);
  }

  async activateView(): Promise<void> {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile && this.isMetricsFile(activeFile)) {
      await this.openMetricsFile(activeFile, this.navigationLeaf());
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

    await this.app.workspace.revealLeaf(leaf);
  }

  refreshOpenMetricsViews(filePaths?: readonly string[]): void {
    const targetPaths = filePaths ? new Set(filePaths.map((path) => normalizePath(path))) : null;

    this.app.workspace.getLeavesOfType(METRICS_VIEW_TYPE).forEach((leaf) => {
      const view = leaf.view;
      if (!(view instanceof MetricsFileView)) {
        return;
      }

      if (targetPaths && (!view.file || !targetPaths.has(normalizePath(view.file.path)))) {
        return;
      }

      view.refreshView();
    });
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
        metricNameDisplayMode: this.settings.metricNameDisplayMode,
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
        metricNameDisplayMode: this.settings.metricNameDisplayMode,
        submitLabel: "Save record",
        title: `Edit ${displayMetricName(record.key, this.settings.metricNameDisplayMode)}`,
      },
      (recordInput) => {
        void this.updateRecord(file, record.id, recordInput);
      },
    );
    modal.open();
  }

  openCreateMetricsFileModal(initialValue = ""): void {
    const modal = new MetricsFileModal(
      this.app,
      {
        description: `Create a metrics file under ${this.settings.metricsRoot}. You can enter a nested relative path, and ${this.primaryMetricsExtension()} will be added when missing.`,
        fieldLabel: "Path",
        initialValue,
        placeholder: `All${this.primaryMetricsExtension()}`,
        submitLabel: "Create file",
        title: "New metrics file",
      },
      (value) => {
        void this.createMetricsFile(value);
      },
    );
    modal.open();
  }

  openRenameMetricsFileModal(file: TFile): void {
    const modal = new MetricsFileModal(
      this.app,
      {
        description: `Rename this metrics file within ${this.settings.metricsRoot}. You can enter a nested relative path, and ${this.primaryMetricsExtension()} will be added when missing.`,
        fieldLabel: "Path",
        initialValue: this.relativeMetricsPath(file.path, { stripExtension: true }),
        placeholder: logicalMetricsBaseName(file.name, this.settings.supportedExtensions),
        submitLabel: "Rename file",
        title: `Rename ${logicalMetricsBaseName(file.name, this.settings.supportedExtensions)}`,
      },
      (value) => {
        void this.renameMetricsFile(file, value);
      },
    );
    modal.open();
  }

  async openMetricsSearchModal(): Promise<void> {
    const files = this.metricsFilesInScope();
    if (files.length === 0) {
      new Notice(`No metrics files were found under ${this.settings.metricsRoot}.`);
      return;
    }
    const results = (
      await Promise.all(
        files.map(async (file) => {
          try {
            const content = await this.app.vault.cachedRead(file);
            return analyzeMetricsData(content).rows.map((row) =>
              buildMetricsSearchResult(
                file,
                row,
                this.settings.metricsRoot,
                this.settings.supportedExtensions,
                this.settings.metricNameDisplayMode,
              ),
            );
          } catch {
            return [] as MetricsSearchResult[];
          }
        }),
      )
    ).flat();

    if (results.length === 0) {
      new Notice(`No searchable measurements were found under ${this.settings.metricsRoot}.`);
      return;
    }

    const modal = new MetricsSearchModal(
      this.app,
      {
        results,
      },
      (result) => {
        void this.openMetricsSearchResult(result);
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
    new ConfirmDeleteMetricRecordModal(this, file, record).open();
  }

  async createMetricsFile(input: string): Promise<void> {
    try {
      const path = this.resolveMetricsFilePath(input);
      const existing = this.app.vault.getAbstractFileByPath(path);
      if (existing) {
        new Notice(`A file already exists at ${path}.`);
        return;
      }

      await this.ensureParentFolder(path);
      const file = await this.app.vault.create(path, "");
      new Notice(`Created ${file.path}.`);
      const targetLeaf =
        this.app.workspace.getLeavesOfType(METRICS_VIEW_TYPE)[0] ??
        this.app.workspace.getRightLeaf(false) ??
        this.app.workspace.getLeaf(false);
      await this.openMetricsFile(
        file,
        targetLeaf,
      );
      this.refreshOpenMetricsViews();
    } catch (error) {
      this.handleMutationError(error);
    }
  }

  async renameMetricsFile(file: TFile, input: string): Promise<void> {
    try {
      const nextPath = this.resolveMetricsFilePath(input, {
        baseFolderPath: file.parent?.path ?? this.settings.metricsRoot,
      });
      if (nextPath === file.path) {
        return;
      }

      const existing = this.app.vault.getAbstractFileByPath(nextPath);
      if (existing && existing !== file) {
        new Notice(`A file already exists at ${nextPath}.`);
        return;
      }

      await this.ensureParentFolder(nextPath);
      const previousPath = file.path;
      await this.app.fileManager.renameFile(file, nextPath);
      this.movePersistedViewState(previousPath, nextPath);
      new Notice(`Renamed metrics file to ${nextPath}.`);
    } catch (error) {
      this.handleMutationError(error);
    }
  }

  confirmDeleteMetricsFile(file: TFile): void {
    void this.confirmAndDeleteMetricsFile(file);
  }

  private async confirmAndDeleteMetricsFile(file: TFile): Promise<void> {
    if (!(await this.app.fileManager.promptForDeletion(file))) {
      return;
    }

    await this.deleteMetricsFile(file);
  }

  async deleteMetricsFile(file: TFile): Promise<void> {
    try {
      const path = file.path;
      await this.app.fileManager.trashFile(file);
      this.forgetPersistedViewStateForPath(path);
      await this.resetDeletedMetricsLeaves(path);
      new Notice(`Deleted ${path}.`);
      this.refreshOpenMetricsViews();
    } catch (error) {
      this.handleMutationError(error);
    }
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

  private async openMetricsSearchResult(result: MetricsSearchResult): Promise<void> {
    const leaf = this.metricReferenceLeaf(result.file);
    await this.openMetricsFile(result.file, leaf);
    if (!leaf) {
      return;
    }

    if (leaf.view instanceof MetricsFileView) {
      if (result.metricId) {
        leaf.view.focusMetricRecord(result.metricId);
      } else {
        leaf.view.focusMetricLineNumber(result.lineNumber);
      }
    }

    await this.app.workspace.revealLeaf(leaf);
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

  private handleMetricsFileRename(file: TFile, oldPath: string): void {
    const normalizedOldPath = normalizePath(oldPath);
    if (this.isMetricsPath(normalizedOldPath)) {
      if (this.isMetricsFile(file)) {
        this.movePersistedViewState(normalizedOldPath, file.path);
      } else {
        this.forgetPersistedViewStateForPath(normalizedOldPath);
      }
    }
  }

  private primaryMetricsExtension(): string {
    return this.settings.supportedExtensions[0] ?? DEFAULT_SETTINGS.supportedExtensions[0] ?? ".metrics.ndjson";
  }

  private hasSupportedExtension(path: string): boolean {
    return this.settings.supportedExtensions.some((extension) => path.endsWith(extension));
  }

  private isWithinMetricsRoot(path: string): boolean {
    const metricsRoot = normalizePath(this.settings.metricsRoot);
    return path === metricsRoot || path.startsWith(`${metricsRoot}/`);
  }

  private resolveMetricsFilePath(
    input: string,
    options?: {
      baseFolderPath?: string;
    },
  ): string {
    const normalizedInput = normalizePath(input.trim());
    let path = normalizedInput;

    if (!this.hasSupportedExtension(path)) {
      path = `${path}${this.primaryMetricsExtension()}`;
    }

    if (!this.isWithinMetricsRoot(path)) {
      const baseFolder = normalizePath(options?.baseFolderPath ?? this.settings.metricsRoot);
      path = normalizePath(`${baseFolder}/${path}`);
    }

    if (!this.isWithinMetricsRoot(path) || path === normalizePath(this.settings.metricsRoot)) {
      throw new MetricsMutationError(
        `Metrics files must stay inside ${this.settings.metricsRoot}.`,
        "invalid_metrics_path",
      );
    }

    return path;
  }

  private relativeMetricsPath(path: string, options?: { stripExtension?: boolean }): string {
    const metricsRoot = normalizePath(this.settings.metricsRoot);
    let relativePath = path.startsWith(`${metricsRoot}/`) ? path.slice(metricsRoot.length + 1) : path;
    if (options?.stripExtension) {
      const matchingExtension = this.settings.supportedExtensions.find((extension) =>
        relativePath.endsWith(extension),
      );
      if (matchingExtension) {
        relativePath = relativePath.slice(0, -matchingExtension.length);
      }
    }
    return relativePath;
  }

  private async ensureParentFolder(path: string): Promise<void> {
    const parentPath = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
    if (parentPath.length === 0) {
      return;
    }

    await this.ensureFolderPath(parentPath);
  }

  private async ensureFolderPath(path: string): Promise<void> {
    const normalizedPath = normalizePath(path);
    if (normalizedPath.length === 0) {
      return;
    }

    const existing = this.app.vault.getAbstractFileByPath(normalizedPath);
    if (existing instanceof TFolder) {
      return;
    }

    if (existing instanceof TFile) {
      throw new MetricsMutationError(`${normalizedPath} already exists as a file.`, "path_conflict");
    }

    const parentPath = normalizedPath.includes("/")
      ? normalizedPath.slice(0, normalizedPath.lastIndexOf("/"))
      : "";
    if (parentPath.length > 0) {
      await this.ensureFolderPath(parentPath);
    }

    await this.app.vault.createFolder(normalizedPath);
  }

  private async resetDeletedMetricsLeaves(path: string): Promise<void> {
    const activeLeaf = this.activeFileLeaf();
    const leaves = this.app.workspace.getLeavesOfType(METRICS_VIEW_TYPE);
    for (const leaf of leaves) {
      const view = leaf.view;
      if (!(view instanceof MetricsFileView) || view.file?.path !== path) {
        continue;
      }

      await leaf.setViewState({
        active: leaf === activeLeaf,
        type: METRICS_VIEW_TYPE,
      });
    }
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

    return this.app.workspace.getRightLeaf(false) ?? this.app.workspace.getLeaf(false);
  }

  private async maybeAutoOpenFile(file: TFile | null, leaf: WorkspaceLeaf | null): Promise<void> {
    if (!file || !this.isMetricsFile(file)) {
      return;
    }

    if (this.suppressedAutoOpenPaths.has(file.path)) {
      this.suppressedAutoOpenPaths.delete(file.path);
      return;
    }

    const targetLeaf = leaf ?? this.findLeafShowingFile(file) ?? this.activeFileLeaf();
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

    return leaf.view instanceof FileView ? leaf.view.file ?? null : null;
  }

  private activeFileLeaf(): WorkspaceLeaf | null {
    return this.app.workspace.getActiveViewOfType(FileView)?.leaf ?? null;
  }

  private navigationLeaf(): WorkspaceLeaf {
    return this.activeFileLeaf() ?? this.app.workspace.getLeaf(false);
  }

  private refreshMetricsViewsForVaultChange(change: MetricsVaultChange): void {
    const openMetricsViewPaths = collectOpenMetricsViewPaths(
      this.app.workspace.getLeavesOfType(METRICS_VIEW_TYPE),
    );
    const affectedPaths = refreshableMetricsViewPathsForVaultChange(
      change,
      openMetricsViewPaths,
      this.settings.supportedExtensions,
    );
    if (affectedPaths.length === 0) {
      return;
    }

    this.refreshOpenMetricsViews(affectedPaths);
  }

  private refreshFileExplorerObservers(): void {
    this.fileExplorerRelabelController.observeRoots(
      activeDocument.querySelectorAll<HTMLElement>(".nav-files-container"),
    );
  }

  queueFileExplorerLabelSync(): void {
    this.fileExplorerRelabelController.queueSync();
  }

  private queueFileExplorerLabelSyncForChange(change: MetricsVaultChange): void {
    const candidatePaths = [change.path, change.oldPath];
    if (candidatePaths.some((path) => this.isMetricsPath(path ? normalizePath(path) : null))) {
      this.queueFileExplorerLabelSync();
    }
  }

}
