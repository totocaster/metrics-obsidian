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
export const METRIC_ID_LENGTH = 26;

const ULID_TEXT_RE = /[0-9A-HJKMNP-TV-Z]{26}/i;

export function toMetricReference(id: string, prefix = METRIC_REFERENCE_PREFIX): string {
  return `${prefix}${id}`;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeMetricId(value: string): string | null {
  const trimmed = value.trim();
  if (!ULID_TEXT_RE.test(trimmed) || trimmed.length !== METRIC_ID_LENGTH) {
    return null;
  }

  return trimmed.toUpperCase();
}

export function extractMetricIdFromText(
  value: string,
  prefix = METRIC_REFERENCE_PREFIX,
): string | null {
  const directId = normalizeMetricId(value);
  if (directId) {
    return directId;
  }

  const trimmed = value.trim();
  const escapedPrefix = escapeRegex(prefix);
  const match = new RegExp(`${escapedPrefix}([0-9A-HJKMNP-TV-Z]{26})`, "i").exec(trimmed);
  return match ? match[1].toUpperCase() : null;
}

export function findMetricIdAtOffset(
  value: string,
  offset: number,
  prefix = METRIC_REFERENCE_PREFIX,
): string | null {
  const escapedPrefix = escapeRegex(prefix);
  const candidates = [
    new RegExp(`${escapedPrefix}([0-9A-HJKMNP-TV-Z]{26})`, "ig"),
    /[0-9A-HJKMNP-TV-Z]{26}/ig,
  ];

  for (const candidate of candidates) {
    let match: RegExpExecArray | null;
    while ((match = candidate.exec(value)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (offset >= start && offset <= end) {
        return (match[1] ?? match[0]).toUpperCase();
      }
    }
  }

  return null;
}
