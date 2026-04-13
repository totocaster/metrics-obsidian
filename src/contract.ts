export interface MetricRecord {
  id: string;
  ts: string;
  key: string;
  value: number;
  source: string;
  date?: string;
  unit?: string;
  origin_id?: string;
  note?: string;
  context?: Record<string, unknown>;
  tags?: string[];
}

export const METRIC_REFERENCE_PREFIX = "metric:";

export function toMetricReference(id: string, prefix = METRIC_REFERENCE_PREFIX): string {
  return `${prefix}${id}`;
}
