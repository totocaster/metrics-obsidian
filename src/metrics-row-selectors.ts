import type { ParsedMetricRow } from "./metrics-file-model";
import {
  addDays,
  boundaryStartTimestampForDate,
  effectiveDateStringFromTimestamp,
  parseLocalDateString,
  startOfMonth,
  startOfWeek,
  startOfYear,
  toLocalDateString,
  DEFAULT_TIME_BOUNDARY_CONFIG,
  type MetricsTemporalGrouping,
  type MetricsTimeBoundaryConfig,
} from "./time-boundaries";

export interface MetricsTemporalBucket {
  heading: string;
  headingParts?: MetricsHeadingPart[];
  key: string;
  label: string;
  linkTarget?: string;
  startTimestamp: number | null;
}

export interface MetricsHeadingPart {
  text: string;
  linkTarget?: string;
}

function rowExplicitDateValue(row: ParsedMetricRow): string | null {
  if (typeof row.metric?.date !== "string") {
    return null;
  }

  return parseLocalDateString(row.metric.date) ? row.metric.date : null;
}

function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatMonthHeading(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatWeekLabel(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function rowTimestamp(row: ParsedMetricRow): number | null {
  const ts = row.metric?.ts;
  if (typeof ts !== "string") {
    return null;
  }

  const parsed = Date.parse(ts);
  return Number.isNaN(parsed) ? null : parsed;
}

export function rowDateValue(
  row: ParsedMetricRow,
  config: MetricsTimeBoundaryConfig = DEFAULT_TIME_BOUNDARY_CONFIG,
): string | null {
  const explicitDate = rowExplicitDateValue(row);
  if (explicitDate) {
    return explicitDate;
  }

  const timestamp = rowTimestamp(row);
  if (timestamp === null) {
    return null;
  }

  return effectiveDateStringFromTimestamp(timestamp, config);
}

export function rowTemporalBucket(
  row: ParsedMetricRow,
  grouping: MetricsTemporalGrouping,
  config: MetricsTimeBoundaryConfig = DEFAULT_TIME_BOUNDARY_CONFIG,
): MetricsTemporalBucket | null {
  const dayValue = rowDateValue(row, config);
  if (!dayValue) {
    return null;
  }

  const dayDate = parseLocalDateString(dayValue);
  if (!dayDate) {
    return null;
  }

  switch (grouping) {
    case "day":
      return {
        heading: dayValue,
        key: dayValue,
        label: dayValue,
        linkTarget: dayValue,
        startTimestamp: boundaryStartTimestampForDate(dayDate, config),
      };
    case "week": {
      const weekStart = startOfWeek(dayDate, config.weekStartsOn);
      const weekEnd = addDays(weekStart, 6);
      const weekStartValue = toLocalDateString(weekStart);
      const weekEndValue = toLocalDateString(weekEnd);
      return {
        heading: `${weekStartValue} to ${weekEndValue}`,
        headingParts: [
          { text: weekStartValue, linkTarget: weekStartValue },
          { text: " to " },
          { text: weekEndValue, linkTarget: weekEndValue },
        ],
        key: weekStartValue,
        label: formatWeekLabel(weekStart),
        startTimestamp: boundaryStartTimestampForDate(weekStart, config),
      };
    }
    case "month": {
      const monthStart = startOfMonth(dayDate);
      return {
        heading: formatMonthHeading(monthStart),
        key: toLocalDateString(monthStart).slice(0, 7),
        label: formatMonthLabel(monthStart),
        startTimestamp: boundaryStartTimestampForDate(monthStart, config),
      };
    }
    case "year": {
      const yearStart = startOfYear(dayDate);
      const yearLabel = String(yearStart.getFullYear());
      return {
        heading: yearLabel,
        key: yearLabel,
        label: yearLabel,
        startTimestamp: boundaryStartTimestampForDate(yearStart, config),
      };
    }
  }
}
