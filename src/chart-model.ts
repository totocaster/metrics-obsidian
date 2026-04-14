import type { ParsedMetricRow } from "./metrics-file-model";
import {
  rawValuePrecision,
  resolveMetricFractionDigits,
} from "./metric-value-format";
import type { MetricsGroupBy } from "./view-state";

export type MetricsChartKind = "bar" | "line";
export type MetricsChartAxisKind = "category" | "time";

export interface MetricsChartSeriesPoint {
  bucketKey: string;
  lineNumbers: number[];
  precision: number;
  timestamp: number | null;
  value: number;
}

export interface MetricsChartSeries {
  key: string;
  label: string;
  points: MetricsChartSeriesPoint[];
}

export interface MetricsChartStackSegment {
  bucketKey: string;
  key: string;
  label: string;
  lineNumbers: number[];
  precision: number;
  timestamp: number | null;
  value: number;
}

export interface MetricsChartBucket {
  key: string;
  label: string;
  lineNumbers: number[];
  timestamp: number | null;
}

export interface MetricsChartPanel {
  axisKind: MetricsChartAxisKind;
  axisPrecision: number;
  buckets: MetricsChartBucket[];
  kind: MetricsChartKind;
  maxValue: number;
  minValue: number;
  series: MetricsChartSeries[];
  stackSegments?: Map<string, MetricsChartStackSegment[]>;
  stacked: boolean;
  unitKey: string;
  unitLabel: string | null;
}

export interface MetricsChartModel {
  panelCount: number;
  panels: MetricsChartPanel[];
  pointCount: number;
}

const NO_UNIT_KEY = "__no_unit__";

function rowTimestamp(row: ParsedMetricRow): number | null {
  const ts = row.metric?.ts;
  if (typeof ts !== "string") {
    return null;
  }

  const parsed = Date.parse(ts);
  return Number.isNaN(parsed) ? null : parsed;
}

function rowDateValue(row: ParsedMetricRow): string | null {
  if (typeof row.metric?.date === "string" && row.metric.date.length === 10) {
    return row.metric.date;
  }

  const ts = row.metric?.ts;
  if (typeof ts !== "string" || ts.length < 10) {
    return null;
  }

  const parsed = Date.parse(ts);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return ts.slice(0, 10);
}

function startOfDayTimestamp(day: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return null;
  }

  const timestamp = Date.parse(`${day}T00:00:00Z`);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function appendUniqueLineNumber(lineNumbers: number[], lineNumber: number): number[] {
  return lineNumbers.includes(lineNumber) ? lineNumbers : [...lineNumbers, lineNumber];
}

function rawRowValuePrecision(row: ParsedMetricRow): number {
  return rawValuePrecision(row.rawLine);
}

function preferredPrecisionForRows(rows: ParsedMetricRow[]): {
  maximumFractionDigits: number;
  minimumFractionDigits: number;
} {
  return rows.reduce(
    (current, row) => {
      const digits = resolveMetricFractionDigits(row.metric?.key, row.metric?.unit, {
        rawPrecision: rawRowValuePrecision(row),
      });

      return {
        maximumFractionDigits: Math.max(current.maximumFractionDigits, digits.maximumFractionDigits),
        minimumFractionDigits: Math.max(current.minimumFractionDigits, digits.minimumFractionDigits),
      };
    },
    {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    },
  );
}

function formatFixed(value: number, decimals: number): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
}

function resolveAxisPrecision(
  minValue: number,
  maxValue: number,
  minimumPrecision: number,
  maximumPrecision: number,
): number {
  const range = maxValue - minValue || 1;
  const guideValues = [maxValue, minValue + range * 0.75, minValue + range * 0.5, minValue + range * 0.25, minValue];
  const lowerBound = Math.max(0, minimumPrecision);
  const upperBound = Math.max(lowerBound, maximumPrecision);

  for (let decimals = lowerBound; decimals <= upperBound; decimals += 1) {
    const labels = guideValues.map((value) => formatFixed(value, decimals));
    let unique = true;
    for (let index = 1; index < labels.length; index += 1) {
      if (labels[index] === labels[index - 1]) {
        unique = false;
        break;
      }
    }
    if (unique) {
      return decimals;
    }
  }

  return upperBound;
}

function hasPlottableValue(row: ParsedMetricRow): boolean {
  return (
    typeof row.metric?.key === "string" &&
    row.metric.key.length > 0 &&
    typeof row.metric?.value === "number" &&
    Number.isFinite(row.metric.value)
  );
}

function collectValueRange(series: MetricsChartSeries[]): {
  maxValue: number;
  minValue: number;
} | null {
  const values = series.flatMap((entry) => entry.points.map((point) => point.value));
  if (values.length === 0) {
    return null;
  }

  let minValue = Math.min(...values);
  let maxValue = Math.max(...values);
  const range = maxValue - minValue;

  if (range === 0) {
    if (maxValue === 0) {
      minValue = -1;
      maxValue = 1;
    } else {
      const padding = Math.abs(maxValue) * 0.1;
      minValue -= padding;
      maxValue += padding;
    }
  } else {
    const padding = range * 0.06;
    if (minValue === 0) {
      maxValue += padding;
    } else if (maxValue === 0) {
      minValue -= padding;
    } else {
      minValue -= padding;
      maxValue += padding;
    }
  }

  return { maxValue, minValue };
}

function collectStackedValueRange(stackSegments: Map<string, MetricsChartStackSegment[]>): {
  maxValue: number;
  minValue: number;
} | null {
  const totals = new Map<string, { negative: number; positive: number }>();

  stackSegments.forEach((segments, bucketKey) => {
    segments.forEach((point) => {
      const current = totals.get(point.bucketKey) ?? { negative: 0, positive: 0 };
      if (point.value >= 0) {
        current.positive += point.value;
      } else {
        current.negative += point.value;
      }
      totals.set(point.bucketKey, current);
    });
  });

  if (totals.size === 0) {
    return null;
  }

  let minValue = Math.min(...Array.from(totals.values(), (value) => value.negative));
  let maxValue = Math.max(...Array.from(totals.values(), (value) => value.positive));

  if (minValue >= 0) {
    const padding = Math.max(maxValue * 0.06, maxValue === 0 ? 1 : 0);
    return {
      minValue: 0,
      maxValue: maxValue + padding,
    };
  }

  if (maxValue <= 0) {
    const padding = Math.max(Math.abs(minValue) * 0.06, minValue === 0 ? 1 : 0);
    return {
      minValue: minValue - padding,
      maxValue: 0,
    };
  }

  const range = maxValue - minValue || 1;
  const padding = range * 0.06;
  return {
    minValue: minValue - padding,
    maxValue: maxValue + padding,
  };
}

function buildDailyPanel(
  rows: ParsedMetricRow[],
  unitKey: string,
  unitLabel: string | null,
): MetricsChartPanel | null {
  const valuePrecision = preferredPrecisionForRows(rows);
  const seriesOrder = uniqueStrings(
    rows
      .map((row) => row.metric?.key)
      .filter((value): value is string => typeof value === "string" && value.length > 0),
  );

  const bucketLineNumbers = new Map<string, number[]>();
  const bucketTimestamps = new Map<string, number | null>();
  const stackSegments = new Map<string, MetricsChartStackSegment[]>();

  rows.forEach((row) => {
    const key = row.metric?.key;
    const value = row.metric?.value;
    if (typeof key !== "string" || typeof value !== "number" || !Number.isFinite(value)) {
      return;
    }

    const bucketKey = rowDateValue(row);
    if (typeof bucketKey !== "string" || bucketKey.length === 0) {
      return;
    }

    const bucketTimestamp = startOfDayTimestamp(bucketKey);
    if (bucketTimestamp === null) {
      return;
    }

    bucketTimestamps.set(bucketKey, bucketTimestamp);
    bucketLineNumbers.set(
      bucketKey,
      appendUniqueLineNumber(bucketLineNumbers.get(bucketKey) ?? [], row.lineNumber),
    );

    const segments = stackSegments.get(bucketKey) ?? [];
    segments.push({
      bucketKey,
      key,
      label: key,
      lineNumbers: [row.lineNumber],
      precision: rawRowValuePrecision(row),
      timestamp: rowTimestamp(row) ?? bucketTimestamp,
      value,
    });
    stackSegments.set(bucketKey, segments);
  });

  const buckets = Array.from(bucketTimestamps.entries())
    .sort((left, right) => (left[1] ?? Number.NEGATIVE_INFINITY) - (right[1] ?? Number.NEGATIVE_INFINITY))
    .map(([key, timestamp]) => ({
      key,
      label: key,
      lineNumbers: bucketLineNumbers.get(key) ?? [],
      timestamp,
    }));

  if (buckets.length === 0) {
    return null;
  }

  stackSegments.forEach((segments) => {
    segments.sort((left, right) => {
      if (left.timestamp !== null && right.timestamp !== null && left.timestamp !== right.timestamp) {
        return left.timestamp - right.timestamp;
      }
      return left.key.localeCompare(right.key);
    });
  });

  const series = seriesOrder.map((key) => ({
    key,
    label: key,
    points: [],
  }));

  const valueRange = collectStackedValueRange(stackSegments);
  if (!valueRange) {
    return null;
  }

  return {
    axisKind: "time",
    axisPrecision: resolveAxisPrecision(
      valueRange.minValue,
      valueRange.maxValue,
      valuePrecision.minimumFractionDigits,
      valuePrecision.maximumFractionDigits,
    ),
    buckets,
    kind: "bar",
    maxValue: valueRange.maxValue,
    minValue: valueRange.minValue,
    series,
    stackSegments,
    stacked: true,
    unitKey,
    unitLabel,
  };
}

function buildTemporalPanel(
  rows: ParsedMetricRow[],
  unitKey: string,
  unitLabel: string | null,
  bucketByDay: boolean,
): MetricsChartPanel | null {
  const valuePrecision = preferredPrecisionForRows(rows);
  const seriesOrder = uniqueStrings(
    rows
      .map((row) => row.metric?.key)
      .filter((value): value is string => typeof value === "string" && value.length > 0),
  );

  const bucketLineNumbers = new Map<string, number[]>();
  const bucketTimestamps = new Map<string, number | null>();
  const seriesPointMaps = new Map<string, Map<string, MetricsChartSeriesPoint>>();

  rows.forEach((row) => {
    const key = row.metric?.key;
    const value = row.metric?.value;
    if (typeof key !== "string" || typeof value !== "number" || !Number.isFinite(value)) {
      return;
    }

    const timestamp = rowTimestamp(row);
    const bucketKey = bucketByDay ? rowDateValue(row) : row.metric?.ts;
    if (typeof bucketKey !== "string" || bucketKey.length === 0) {
      return;
    }

    const bucketTimestamp = bucketByDay ? startOfDayTimestamp(bucketKey) : timestamp;
    if (bucketTimestamp === null) {
      return;
    }

    bucketTimestamps.set(bucketKey, bucketTimestamp);
    bucketLineNumbers.set(
      bucketKey,
      appendUniqueLineNumber(bucketLineNumbers.get(bucketKey) ?? [], row.lineNumber),
    );

    const pointMap = seriesPointMaps.get(key) ?? new Map<string, MetricsChartSeriesPoint>();
    const existing = pointMap.get(bucketKey);
    if (!existing || (timestamp ?? bucketTimestamp) > (existing.timestamp ?? Number.NEGATIVE_INFINITY)) {
      pointMap.set(bucketKey, {
        bucketKey,
        lineNumbers: appendUniqueLineNumber(existing?.lineNumbers ?? [], row.lineNumber),
        precision: rawRowValuePrecision(row),
        timestamp: bucketTimestamp,
        value,
      });
    } else {
      existing.lineNumbers = appendUniqueLineNumber(existing.lineNumbers, row.lineNumber);
    }
    seriesPointMaps.set(key, pointMap);
  });

  const buckets = Array.from(bucketTimestamps.entries())
    .sort((left, right) => (left[1] ?? Number.NEGATIVE_INFINITY) - (right[1] ?? Number.NEGATIVE_INFINITY))
    .map(([key, timestamp]) => ({
      key,
      label: key,
      lineNumbers: bucketLineNumbers.get(key) ?? [],
      timestamp,
    }));

  if (buckets.length === 0) {
    return null;
  }

  const series = seriesOrder
    .map((key) => {
      const pointMap = seriesPointMaps.get(key);
      if (!pointMap || pointMap.size === 0) {
        return null;
      }

      return {
        key,
        label: key,
        points: buckets
          .map((bucket) => pointMap.get(bucket.key))
          .filter((point): point is MetricsChartSeriesPoint => point !== undefined),
      };
    })
    .filter((entry): entry is MetricsChartSeries => entry !== null);

  const valueRange = collectValueRange(series);
  if (!valueRange) {
    return null;
  }

  return {
    axisKind: "time",
    axisPrecision: resolveAxisPrecision(
      valueRange.minValue,
      valueRange.maxValue,
      valuePrecision.minimumFractionDigits,
      valuePrecision.maximumFractionDigits,
    ),
    buckets,
    kind: buckets.length >= 2 ? "line" : "bar",
    maxValue: valueRange.maxValue,
    minValue: valueRange.minValue,
    series,
    stackSegments: undefined,
    stacked: false,
    unitKey,
    unitLabel,
  };
}

function buildSourcePanel(
  rows: ParsedMetricRow[],
  unitKey: string,
  unitLabel: string | null,
): MetricsChartPanel | null {
  const valuePrecision = preferredPrecisionForRows(rows);
  const bucketLineNumbers = new Map<string, number[]>();
  const bucketKeys = uniqueStrings(
    rows.map((row) => {
      const source = row.metric?.source;
      return typeof source === "string" && source.length > 0 ? source : "No source";
    }),
  );

  const seriesOrder = uniqueStrings(
    rows
      .map((row) => row.metric?.key)
      .filter((value): value is string => typeof value === "string" && value.length > 0),
  );

  const pointMaps = new Map<string, Map<string, MetricsChartSeriesPoint>>();

  rows.forEach((row) => {
    const key = row.metric?.key;
    const value = row.metric?.value;
    if (typeof key !== "string" || typeof value !== "number" || !Number.isFinite(value)) {
      return;
    }

    const source = typeof row.metric?.source === "string" && row.metric.source.length > 0
      ? row.metric.source
      : "No source";
    bucketLineNumbers.set(
      source,
      appendUniqueLineNumber(bucketLineNumbers.get(source) ?? [], row.lineNumber),
    );
    const pointMap = pointMaps.get(key) ?? new Map<string, MetricsChartSeriesPoint>();
    const existing = pointMap.get(source);
    if (!existing) {
      pointMap.set(source, {
        bucketKey: source,
        lineNumbers: [row.lineNumber],
        precision: rawRowValuePrecision(row),
        timestamp: rowTimestamp(row),
        value,
      });
    } else {
      existing.lineNumbers = appendUniqueLineNumber(existing.lineNumbers, row.lineNumber);
    }
    pointMaps.set(key, pointMap);
  });

  const buckets = bucketKeys.map((key) => ({
    key,
    label: key,
    lineNumbers: bucketLineNumbers.get(key) ?? [],
    timestamp: null,
  }));

  const series = seriesOrder
    .map((key) => {
      const pointMap = pointMaps.get(key);
      if (!pointMap || pointMap.size === 0) {
        return null;
      }

      return {
        key,
        label: key,
        points: buckets
          .map((bucket) => pointMap.get(bucket.key))
          .filter((point): point is MetricsChartSeriesPoint => point !== undefined),
      };
    })
    .filter((entry): entry is MetricsChartSeries => entry !== null);

  const valueRange = collectValueRange(series);
  if (!valueRange) {
    return null;
  }

  return {
    axisKind: "category",
    axisPrecision: resolveAxisPrecision(
      valueRange.minValue,
      valueRange.maxValue,
      valuePrecision.minimumFractionDigits,
      valuePrecision.maximumFractionDigits,
    ),
    buckets,
    kind: "bar",
    maxValue: valueRange.maxValue,
    minValue: valueRange.minValue,
    series,
    stackSegments: undefined,
    stacked: false,
    unitKey,
    unitLabel,
  };
}

function buildKeyPanel(
  rows: ParsedMetricRow[],
  unitKey: string,
  unitLabel: string | null,
): MetricsChartPanel | null {
  const valuePrecision = preferredPrecisionForRows(rows);
  const buckets = uniqueStrings(
    rows.map((row) => {
      const key = row.metric?.key;
      return typeof key === "string" && key.length > 0 ? key : "No metric";
    }),
  );

  const bucketLineNumbers = new Map<string, number[]>();
  const bucketDefs = buckets.map((key) => ({
    key,
    label: key,
    lineNumbers: bucketLineNumbers.get(key) ?? [],
    timestamp: null,
  }));
  const pointMap = new Map<string, MetricsChartSeriesPoint>();
  rows.forEach((row) => {
    const key = row.metric?.key;
    const value = row.metric?.value;
    if (typeof key !== "string" || typeof value !== "number" || !Number.isFinite(value)) {
      return;
    }

    bucketLineNumbers.set(
      key,
      appendUniqueLineNumber(bucketLineNumbers.get(key) ?? [], row.lineNumber),
    );

    if (!pointMap.has(key)) {
      pointMap.set(key, {
        bucketKey: key,
        lineNumbers: [row.lineNumber],
        precision: rawRowValuePrecision(row),
        timestamp: rowTimestamp(row),
        value,
      });
      return;
    }

    const existing = pointMap.get(key);
    if (existing) {
      existing.lineNumbers = appendUniqueLineNumber(existing.lineNumbers, row.lineNumber);
    }
  });

  const series: MetricsChartSeries[] = [
    {
      key: "value",
      label: unitLabel ?? "Value",
      points: bucketDefs
        .map((bucket) => pointMap.get(bucket.key))
        .filter((point): point is MetricsChartSeriesPoint => point !== undefined),
    },
  ];

  const valueRange = collectValueRange(series);
  if (!valueRange || series[0].points.length === 0) {
    return null;
  }

  return {
    axisKind: "category",
    axisPrecision: resolveAxisPrecision(
      valueRange.minValue,
      valueRange.maxValue,
      valuePrecision.minimumFractionDigits,
      valuePrecision.maximumFractionDigits,
    ),
    buckets: bucketDefs.map((bucket) => ({
      ...bucket,
      lineNumbers: bucketLineNumbers.get(bucket.key) ?? [],
    })),
    kind: "bar",
    maxValue: valueRange.maxValue,
    minValue: valueRange.minValue,
    series,
    stackSegments: undefined,
    stacked: false,
    unitKey,
    unitLabel,
  };
}

export function buildMetricsChartModel(
  rows: ParsedMetricRow[],
  groupBy: MetricsGroupBy,
): MetricsChartModel | null {
  const plottableRows = rows.filter(hasPlottableValue);
  if (plottableRows.length === 0) {
    return null;
  }

  const unitOrder = uniqueStrings(
    plottableRows.map((row) => {
      const unit = row.metric?.unit;
      return typeof unit === "string" && unit.length > 0 ? unit : NO_UNIT_KEY;
    }),
  );

  const panels = unitOrder
    .map((unitKey) => {
      const unitRows = plottableRows.filter((row) => {
        const unit = row.metric?.unit;
        return (typeof unit === "string" && unit.length > 0 ? unit : NO_UNIT_KEY) === unitKey;
      });
      const unitLabel = unitKey === NO_UNIT_KEY ? null : unitKey;

      if (groupBy === "day") {
        return buildDailyPanel(unitRows, unitKey, unitLabel);
      }

      if (groupBy === "source") {
        return buildSourcePanel(unitRows, unitKey, unitLabel);
      }

      if (groupBy === "key") {
        return buildKeyPanel(unitRows, unitKey, unitLabel);
      }

      const temporalPanel = buildTemporalPanel(unitRows, unitKey, unitLabel, false);
      if (temporalPanel) {
        return temporalPanel;
      }

      return buildKeyPanel(unitRows, unitKey, unitLabel);
    })
    .filter((panel): panel is MetricsChartPanel => panel !== null);

  if (panels.length === 0) {
    return null;
  }

  return {
    panelCount: panels.length,
    panels,
    pointCount: panels.reduce((total, panel) => {
      if (panel.stacked && panel.stackSegments) {
        return total + Array.from(panel.stackSegments.values()).reduce((count, segments) => count + segments.length, 0);
      }
      return total + panel.series.reduce((count, series) => count + series.points.length, 0);
    }, 0),
  };
}
