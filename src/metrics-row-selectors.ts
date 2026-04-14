import type { ParsedMetricRow } from "./metrics-file-model";

export function rowTimestamp(row: ParsedMetricRow): number | null {
  const ts = row.metric?.ts;
  if (typeof ts !== "string") {
    return null;
  }

  const parsed = Date.parse(ts);
  return Number.isNaN(parsed) ? null : parsed;
}

export function rowDateValue(row: ParsedMetricRow): string | null {
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
