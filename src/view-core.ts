import { Menu, Notice, setIcon, TFile, TextFileView, WorkspaceLeaf } from "obsidian";

import { buildMetricsChartModel } from "./chart-model";
import { renderMetricsChart, type MetricsChartSelection } from "./chart-renderer";
import type MetricsPlugin from "./main";
import { displayMetricName, displayMetricOption } from "./metric-catalog";
import { metricIconForKey } from "./metric-icons";
import {
  analyzeMetricsData,
  type MetricsFileAnalysis,
  type ParsedMetricRow,
} from "./metrics-file-model";
import {
  applyMetricsViewState,
  advancedControlCount,
  buildMetricsSummaryRows,
  capitalizeDisplayName,
  collectFilterValues,
  filterBarControlCount,
  groupedRows,
  groupBySummaryLabel,
  hasActiveViewControls,
  logicalMetricsBaseName,
  metricFilterAriaLabel,
  metricFilterLabel,
  metricFilterTitle,
  summaryComputationSummaryLabel,
  toggleSelectedFilterValue,
  type MetricsTimelineItem,
  uniqueLineNumbers,
  withSelectedFilterValue,
  withSelectedFilterValues,
} from "./view-data";
import { renderGroupHeading, renderTimelineItems } from "./view-rendering";
import {
  createDefaultViewState,
  DEFAULT_VIEW_STATE,
  type MetricsGroupBy,
  type MetricsSortOrder,
  type MetricsStatusFilter,
  type MetricsSummaryComputation,
  type MetricsTimeRange,
  type MetricsViewState,
} from "./view-state";

export const METRICS_VIEW_TYPE = "metrics-file-view";

interface ControlFocusState {
  name: string;
  selectionEnd?: number;
  selectionStart?: number;
}

export class MetricsFileView extends TextFileView {
  allowNoFile = true;
  private advancedControlsExpanded = false;
  private addRecordActionEl: HTMLElement | null = null;
  private chartActionEl: HTMLElement | null = null;
  private clearTargetedRecordTimeout: number | null = null;
  private filterActionEl: HTMLElement | null = null;
  private metricsAnalysisCache: { data: string; analysis: MetricsFileAnalysis } | null = null;
  private pendingControlFocus: ControlFocusState | null = null;
  private pendingMetricLineNumberFocus: number | null = null;
  private pendingMetricIdFocus: string | null = null;
  private searchRenderTimeout: number | null = null;
  private sortActionEl: HTMLElement | null = null;
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

    this.clearSearchRenderTimeout();
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
    const { showChart, showFilters } = this.viewState;
    this.viewState = createDefaultViewState();
    this.viewState.showChart = showChart;
    this.viewState.showFilters = showFilters;
    this.advancedControlsExpanded = false;
    this.pendingMetricLineNumberFocus = null;
    this.pendingMetricIdFocus = metricId;
    this.render();
  }

  focusMetricLineNumber(lineNumber: number): void {
    if (this.file) {
      this.viewStateFilePath = this.file.path;
    }
    const { showChart, showFilters } = this.viewState;
    this.viewState = createDefaultViewState();
    this.viewState.showChart = showChart;
    this.viewState.showFilters = showFilters;
    this.advancedControlsExpanded = false;
    this.pendingMetricIdFocus = null;
    this.pendingMetricLineNumberFocus = lineNumber;
    this.render();
  }

  private ensureHeaderActions(): void {
    if (!this.sortActionEl) {
      this.sortActionEl = this.addAction("arrow-up-down", "Sort metrics", () => {
        if (!this.file) {
          new Notice("Open a metrics file first.");
          return;
        }

        this.openSortMenu(this.sortActionEl);
      });
    }

    if (!this.filterActionEl) {
      this.filterActionEl = this.addAction("filter", "Hide filters", () => {
        if (!this.file) {
          new Notice("Open a metrics file first.");
          return;
        }

        this.viewState.showFilters = !this.viewState.showFilters;
        this.persistCurrentViewState();
        this.render();
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
      this.addRecordActionEl &&
      this.chartActionEl &&
      this.filterActionEl &&
      this.sortActionEl &&
      this.addRecordActionEl.parentElement
    ) {
      const actionsContainer = this.addRecordActionEl.parentElement;

      if (!this.viewActionSeparatorEl) {
        this.viewActionSeparatorEl = actionsContainer.createDiv({
          cls: "metrics-lens-view-action-separator",
        });
      }

      [
        this.addRecordActionEl,
        this.viewActionSeparatorEl,
        this.chartActionEl,
        this.filterActionEl,
        this.sortActionEl,
      ].forEach((element) => {
        actionsContainer.appendChild(element);
      });
    }

    this.syncHeaderActions();
  }

  private syncHeaderActions(): void {
    const activeFilterBarControls = filterBarControlCount(this.viewState);
    const filtersAriaLabel = this.viewState.showFilters
      ? activeFilterBarControls > 0
        ? `Hide filters (${activeFilterBarControls} active)`
        : "Hide filters"
      : activeFilterBarControls > 0
        ? `Show filters (${activeFilterBarControls} active)`
        : "Show filters";

    if (this.chartActionEl) {
      this.chartActionEl.toggleClass("is-active", this.viewState.showChart);
      this.chartActionEl.setAttribute(
        "aria-label",
        this.viewState.showChart ? "Hide chart" : "Show chart",
      );
      this.chartActionEl.setAttribute("data-tooltip-position", "bottom");
    }

    if (this.filterActionEl) {
      this.filterActionEl.classList.add("metrics-lens-view-action");
      this.filterActionEl.toggleClass("is-active", this.viewState.showFilters);
      setIcon(this.filterActionEl, activeFilterBarControls > 0 ? "list-filter" : "filter");
      this.filterActionEl.setAttribute("aria-label", filtersAriaLabel);
      this.filterActionEl.setAttribute("data-tooltip-position", "bottom");
    }

    if (this.sortActionEl) {
      this.sortActionEl.classList.add("metrics-lens-view-action");
      this.sortActionEl.toggleClass(
        "is-active",
        this.viewState.sortOrder !== DEFAULT_VIEW_STATE.sortOrder,
      );
      this.sortActionEl.setAttribute(
        "aria-label",
        `Sort metrics: ${this.sortOrderLabel(this.viewState.sortOrder)}`,
      );
      this.sortActionEl.setAttribute("data-tooltip-position", "bottom");
    }

    if (this.addRecordActionEl) {
      this.addRecordActionEl.setAttribute("aria-label", "Add record");
      this.addRecordActionEl.setAttribute("data-tooltip-position", "bottom");
    }
  }

  private openSortMenu(anchorEl: HTMLElement | null): void {
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
            this.viewState.sortOrder = option.value;
            this.persistCurrentViewState();
            this.render();
          });
      });
    });

    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      menu.showAtPosition({
        overlap: true,
        width: rect.width,
        x: rect.left,
        y: rect.bottom,
      });
      return;
    }

    menu.showAtPosition({
      x: window.innerWidth / 2,
      y: 80,
    });
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

    const chartModel = buildMetricsChartModel(visibleRows, this.viewState.groupBy, {
      dayStartHour: this.plugin.settings.dayStartHour,
      weekStartsOn: this.plugin.settings.weekStartsOn,
    });
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
    this.clearSearchRenderTimeout();
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

    const analysis = this.getMetricsAnalysis();
    const availableKeys = withSelectedFilterValues(
      collectFilterValues(analysis.rows, "key", this.plugin.settings.metricNameDisplayMode),
      this.viewState.keys,
    );
    const availableSources = withSelectedFilterValue(
      collectFilterValues(analysis.rows, "source", this.plugin.settings.metricNameDisplayMode),
      this.viewState.source,
    );
    const normalizedViewState = this.normalizeViewState();
    if (normalizedViewState) {
      this.persistCurrentViewState();
    }
    const visibleRows = applyMetricsViewState(analysis.rows, this.viewState, {
      dayStartHour: this.plugin.settings.dayStartHour,
      weekStartsOn: this.plugin.settings.weekStartsOn,
    });
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
        groupedRows(
          visibleRows,
          this.viewState.groupBy,
          this.plugin.settings.metricNameDisplayMode,
          {
            dayStartHour: this.plugin.settings.dayStartHour,
            weekStartsOn: this.plugin.settings.weekStartsOn,
          },
        ).forEach((group) => {
          const groupSection = recordsSection.createDiv({ cls: "metrics-lens-group" });
          const headingContainer = groupSection.createDiv({
            cls: ["metrics-lens-group-heading", "markdown-reading-view"],
          });
          renderGroupHeading(headingContainer, group, this.plugin, currentFile.path);

          const recordsList = groupSection.createDiv({ cls: "metrics-lens-records" });
          const timelineItems: MetricsTimelineItem[] = [
            ...group.rows.map((row) => ({ kind: "record" as const, row })),
            ...buildMetricsSummaryRows(
              group.rows,
              this.viewState.summaryComputation,
              this.plugin.settings.metricNameDisplayMode,
            ).map((summary) => ({
              kind: "summary" as const,
              summary,
            })),
          ];
          renderTimelineItems(
            recordsList,
            timelineItems,
            this.plugin,
            currentFile,
            this.plugin.settings.recordReferencePrefix,
          );
        });
      } else {
        const recordsList = recordsSection.createDiv({ cls: "metrics-lens-records" });
        const timelineItems: MetricsTimelineItem[] = [
          ...visibleRows.map((row) => ({ kind: "record" as const, row })),
          ...buildMetricsSummaryRows(
            visibleRows,
            this.viewState.summaryComputation,
            this.plugin.settings.metricNameDisplayMode,
          ).map((summary) => ({
            kind: "summary" as const,
            summary,
          })),
        ];
        renderTimelineItems(
          recordsList,
          timelineItems,
          this.plugin,
          currentFile,
          this.plugin.settings.recordReferencePrefix,
        );
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
    const summaryLabel = summaryComputationSummaryLabel(this.viewState.summaryComputation);
    if (summaryLabel) {
      summaryParts.push(summaryLabel);
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
    if (!this.viewState.showFilters) {
      return;
    }

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

    const keyFilterButton = primaryControls.createEl("button", {
      cls: ["metrics-lens-control", "metrics-lens-select-button"],
    });
    keyFilterButton.type = "button";
    keyFilterButton.dataset.metricsControl = "keys";
    keyFilterButton.setAttribute("aria-haspopup", "menu");
    keyFilterButton.setAttribute(
      "aria-label",
      metricFilterAriaLabel(this.viewState.keys, this.plugin.settings.metricNameDisplayMode),
    );
    keyFilterButton.setAttribute(
      "title",
      metricFilterTitle(this.viewState.keys, this.plugin.settings.metricNameDisplayMode),
    );
    keyFilterButton.createSpan({
      cls: "metrics-lens-select-button-label",
      text: metricFilterLabel(this.viewState.keys, this.plugin.settings.metricNameDisplayMode),
    });
    const keyFilterIcon = keyFilterButton.createSpan({ cls: "metrics-lens-select-button-icon" });
    setIcon(keyFilterIcon, "chevron-down");
    keyFilterButton.addEventListener("click", () => {
      this.pendingControlFocus = { name: "keys" };
      this.openMetricFilterMenu(keyFilterButton, availableKeys);
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
      this.scheduleSearchRender();
    });

    if (hasActiveViewControls(this.viewState)) {
      const resetButton = primaryControls.createEl("button", {
        cls: ["clickable-icon", "metrics-lens-icon-button", "metrics-lens-reset-view-button"],
      });
      resetButton.type = "button";
      resetButton.dataset.metricsControl = "reset";
      resetButton.setAttribute("aria-label", "Reset current filters and sorting");
      resetButton.setAttribute("data-tooltip-position", "top");
      setIcon(resetButton, "filter-x");
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
        { label: "Group by week", value: "week" },
        { label: "Group by month", value: "month" },
        { label: "Group by year", value: "year" },
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

      const summarySelect = advancedControls.createEl("select", { cls: "metrics-lens-control" });
      summarySelect.dataset.metricsControl = "summaryComputation";
      summarySelect.setAttribute("aria-label", "Show summary rows");
      [
        { label: "No summary", value: "none" },
        { label: "Average", value: "avg" },
        { label: "Median", value: "median" },
        { label: "Minimum", value: "min" },
        { label: "Maximum", value: "max" },
        { label: "Sum", value: "sum" },
        { label: "Count", value: "count" },
      ].forEach((option) => {
        summarySelect.createEl("option", {
          text: option.label,
          value: option.value,
        });
      });
      summarySelect.value = this.viewState.summaryComputation;
      summarySelect.addEventListener("change", () => {
        this.pendingControlFocus = { name: "summaryComputation" };
        this.viewState.summaryComputation = summarySelect.value as MetricsSummaryComputation;
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

  private openMetricFilterMenu(anchorEl: HTMLElement | null, availableKeys: string[]): void {
    const menu = new Menu();
    const metricNameDisplayMode = this.plugin.settings.metricNameDisplayMode;

    menu.addItem((item) => {
      item
        .setTitle("All metrics")
        .setChecked(this.viewState.keys.length === 0)
        .onClick(() => {
          if (this.viewState.keys.length === 0) {
            return;
          }

          this.pendingControlFocus = { name: "keys" };
          this.viewState.keys = [];
          this.persistCurrentViewState();
          this.render();
        });
    });

    if (availableKeys.length > 0) {
      menu.addSeparator();
    }

    availableKeys.forEach((key) => {
      menu.addItem((item) => {
        item
          .setTitle(displayMetricOption(key, metricNameDisplayMode))
          .setChecked(this.viewState.keys.includes(key))
          .onClick(() => {
            this.pendingControlFocus = { name: "keys" };
            this.viewState.keys = toggleSelectedFilterValue(this.viewState.keys, key);
            this.persistCurrentViewState();
            this.render();
          });
      });
    });

    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      menu.showAtPosition({
        overlap: true,
        width: rect.width,
        x: rect.left,
        y: rect.bottom,
      });
      return;
    }

    menu.showAtPosition({
      x: window.innerWidth / 2,
      y: 80,
    });
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
    if (this.pendingMetricIdFocus) {
      const targetId = this.pendingMetricIdFocus;
      const targetEl = this.contentEl.querySelector<HTMLElement>(`[data-metric-id="${targetId}"]`);
      if (!targetEl) {
        return;
      }

      this.pendingMetricIdFocus = null;
      this.pendingMetricLineNumberFocus = null;
      this.highlightRecordElements([targetEl]);
      return;
    }

    if (this.pendingMetricLineNumberFocus === null) {
      return;
    }

    const targetEl = this.contentEl.querySelector<HTMLElement>(
      `[data-metrics-line-number="${this.pendingMetricLineNumberFocus}"]`,
    );
    if (!targetEl) {
      return;
    }

    this.pendingMetricLineNumberFocus = null;
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

  private getMetricsAnalysis(): MetricsFileAnalysis {
    const data = this.data ?? "";

    if (this.metricsAnalysisCache?.data === data) {
      return this.metricsAnalysisCache.analysis;
    }

    const analysis = analyzeMetricsData(data);
    this.metricsAnalysisCache = { data, analysis };
    return analysis;
  }

  private scheduleSearchRender(): void {
    this.clearSearchRenderTimeout();
    this.searchRenderTimeout = window.setTimeout(() => {
      this.searchRenderTimeout = null;
      this.render();
    }, 150);
  }

  private clearSearchRenderTimeout(): void {
    if (this.searchRenderTimeout === null) {
      return;
    }

    window.clearTimeout(this.searchRenderTimeout);
    this.searchRenderTimeout = null;
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
