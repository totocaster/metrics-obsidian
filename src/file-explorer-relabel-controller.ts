export interface ScopedFileExplorerRelabelControllerOptions {
  formatLabel: (fileName: string) => string;
  isMetricsPath: (path: string) => boolean;
}

const FILE_TITLE_SELECTOR = ".nav-file-title[data-path]";
const FILE_TITLE_CONTENT_SELECTOR = ".nav-file-title-content";
const FILE_TITLE_FALLBACK_CONTENT_SELECTOR = ".tree-item-inner";
const ORIGINAL_LABEL_KEY = "metricsOriginalLabel";

export class ScopedFileExplorerRelabelController {
  private readonly formatLabel: (fileName: string) => string;
  private readonly isMetricsPath: (path: string) => boolean;
  private readonly observers = new Map<HTMLElement, MutationObserver>();
  private syncQueued = false;
  private syncFrameId: number | null = null;

  constructor(options: ScopedFileExplorerRelabelControllerOptions) {
    this.formatLabel = options.formatLabel;
    this.isMetricsPath = options.isMetricsPath;
  }

  observe(root: HTMLElement | null): void {
    this.observeRoots(root ? [root] : []);
  }

  observeRoots(roots: Iterable<HTMLElement>): void {
    const nextRoots = new Set<HTMLElement>();
    for (const root of roots) {
      nextRoots.add(root);
      if (this.observers.has(root)) {
        continue;
      }

      const observer = new MutationObserver(() => {
        this.queueSync();
      });
      observer.observe(root, {
        childList: true,
        subtree: true,
      });
      this.observers.set(root, observer);
    }

    for (const [root, observer] of this.observers.entries()) {
      if (nextRoots.has(root)) {
        continue;
      }

      observer.disconnect();
      this.observers.delete(root);
      this.restoreFileExplorerLabels(root);
    }

    if (this.observers.size === 0) {
      if (this.syncFrameId !== null) {
        window.cancelAnimationFrame(this.syncFrameId);
        this.syncFrameId = null;
      }
      this.syncQueued = false;
      return;
    }

    this.queueSync();
  }

  queueSync(): void {
    if (this.observers.size === 0 || this.syncQueued) {
      return;
    }

    this.syncQueued = true;
    this.syncFrameId = window.requestAnimationFrame(() => {
      this.syncQueued = false;
      this.syncFrameId = null;
      this.observers.forEach((_observer, root) => {
        this.syncFileExplorerLabels(root);
      });
    });
  }

  disconnect(): void {
    if (this.syncFrameId !== null) {
      window.cancelAnimationFrame(this.syncFrameId);
      this.syncFrameId = null;
    }

    this.syncQueued = false;
    for (const [root, observer] of this.observers.entries()) {
      observer.disconnect();
      this.restoreFileExplorerLabels(root);
    }
    this.observers.clear();
  }

  private syncFileExplorerLabels(root: HTMLElement): void {
    const titleEls = root.querySelectorAll<HTMLElement>(FILE_TITLE_SELECTOR);

    titleEls.forEach((titleEl) => {
      const path = titleEl.getAttribute("data-path");
      const contentEl =
        titleEl.querySelector<HTMLElement>(FILE_TITLE_CONTENT_SELECTOR) ??
        titleEl.querySelector<HTMLElement>(FILE_TITLE_FALLBACK_CONTENT_SELECTOR);

      if (!path || !contentEl || titleEl.querySelector("input")) {
        return;
      }

      if (!this.isMetricsPath(path)) {
        if (contentEl.dataset[ORIGINAL_LABEL_KEY] !== undefined) {
          contentEl.textContent = contentEl.dataset[ORIGINAL_LABEL_KEY];
          delete contentEl.dataset[ORIGINAL_LABEL_KEY];
        }
        return;
      }

      if (contentEl.dataset[ORIGINAL_LABEL_KEY] === undefined) {
        contentEl.dataset[ORIGINAL_LABEL_KEY] = contentEl.textContent ?? "";
      }

      const fileName = path.split("/").pop() ?? path;
      contentEl.textContent = this.formatLabel(fileName);
    });
  }

  private restoreFileExplorerLabels(root: HTMLElement): void {
    const titleEls = root.querySelectorAll<HTMLElement>(FILE_TITLE_SELECTOR);

    titleEls.forEach((titleEl) => {
      const contentEl =
        titleEl.querySelector<HTMLElement>(FILE_TITLE_CONTENT_SELECTOR) ??
        titleEl.querySelector<HTMLElement>(FILE_TITLE_FALLBACK_CONTENT_SELECTOR);

      if (!contentEl || contentEl.dataset[ORIGINAL_LABEL_KEY] === undefined) {
        return;
      }

      contentEl.textContent = contentEl.dataset[ORIGINAL_LABEL_KEY];
      delete contentEl.dataset[ORIGINAL_LABEL_KEY];
    });
  }
}
