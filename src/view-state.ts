import type { MetricRowStatus } from "./metrics-file-model";

export type MetricsSortOrder = "newest" | "oldest" | "value-desc" | "value-asc";
export type MetricsGroupBy = "none" | "day" | "key" | "source";
export type MetricsStatusFilter = "all" | MetricRowStatus;
export type MetricsTimeRange =
  | "all"
  | "today"
  | "this-week"
  | "past-7-days"
  | "past-30-days"
  | "this-month"
  | "custom";

export interface MetricsViewState {
  fromDate: string;
  groupBy: MetricsGroupBy;
  key: string;
  searchText: string;
  showChart: boolean;
  sortOrder: MetricsSortOrder;
  source: string;
  status: MetricsStatusFilter;
  timeRange: MetricsTimeRange;
  toDate: string;
}

export interface PersistedMetricsViewState {
  advancedControlsExpanded: boolean;
  viewState: MetricsViewState;
}

export const DEFAULT_VIEW_STATE: MetricsViewState = {
  fromDate: "",
  groupBy: "none",
  key: "",
  searchText: "",
  showChart: false,
  sortOrder: "newest",
  source: "",
  status: "all",
  timeRange: "all",
  toDate: "",
};

export const DEFAULT_PERSISTED_VIEW_STATE: PersistedMetricsViewState = {
  advancedControlsExpanded: false,
  viewState: DEFAULT_VIEW_STATE,
};

export function createDefaultViewState(): MetricsViewState {
  return { ...DEFAULT_VIEW_STATE };
}

function normalizeSortOrder(value: unknown): MetricsSortOrder {
  return value === "oldest" || value === "value-desc" || value === "value-asc" ? value : "newest";
}

function normalizeGroupBy(value: unknown): MetricsGroupBy {
  return value === "day" || value === "key" || value === "source" ? value : "none";
}

function normalizeStatus(value: unknown): MetricsStatusFilter {
  return value === "valid" || value === "warning" || value === "error" ? value : "all";
}

function normalizeTimeRange(value: unknown): MetricsTimeRange {
  return value === "today" ||
    value === "this-week" ||
    value === "past-7-days" ||
    value === "past-30-days" ||
    value === "this-month" ||
    value === "custom"
    ? value
    : "all";
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function normalizeMetricsViewState(
  value: Partial<MetricsViewState> | null | undefined,
): MetricsViewState {
  return {
    fromDate: normalizeString(value?.fromDate),
    groupBy: normalizeGroupBy(value?.groupBy),
    key: normalizeString(value?.key),
    searchText: normalizeString(value?.searchText),
    showChart: value?.showChart === true,
    sortOrder: normalizeSortOrder(value?.sortOrder),
    source: normalizeString(value?.source),
    status: normalizeStatus(value?.status),
    timeRange: normalizeTimeRange(value?.timeRange),
    toDate: normalizeString(value?.toDate),
  };
}

export function normalizePersistedMetricsViewState(
  value: Partial<PersistedMetricsViewState> | null | undefined,
): PersistedMetricsViewState {
  return {
    advancedControlsExpanded: value?.advancedControlsExpanded === true,
    viewState: normalizeMetricsViewState(value?.viewState),
  };
}
