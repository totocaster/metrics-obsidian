import { FileView, Notice, Plugin, TFile, WorkspaceLeaf } from "obsidian";

import { DEFAULT_SETTINGS, MetricsPluginSettings, MetricsSettingTab, normalizeMetricsSettings } from "./settings";
import { logicalMetricsBaseName, METRICS_VIEW_TYPE, MetricsFileView } from "./view";

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
          void this.openFileInMetricsView(file, this.app.workspace.activeLeaf);
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

  private async openFileInMetricsView(file: TFile, leaf: WorkspaceLeaf | null): Promise<void> {
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

    await this.openFileInMetricsView(file, targetLeaf);
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
