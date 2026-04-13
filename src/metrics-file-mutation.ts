import type { MetricRecord } from "./contract";
import { generateUlid } from "./ulid";

export interface MetricRecordInput {
  context?: Record<string, unknown>;
  date?: string;
  id?: string;
  key: string;
  note?: string;
  origin_id?: string;
  source: string;
  tags?: string[];
  ts: string;
  unit?: string;
  value: number;
}

export interface AssignMissingIdsResult {
  assigned: number;
  content: string;
  skipped: number;
}

export class MetricsMutationError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "MetricsMutationError";
  }
}

export interface MetricsMutationResult {
  content: string;
  record: MetricRecord;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeOptionalString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function normalizeRecordInput(input: MetricRecordInput): MetricRecord {
  const record: MetricRecord = {
    id: normalizeOptionalString(input.id) ?? generateUlid(),
    key: input.key.trim(),
    source: input.source.trim(),
    ts: input.ts.trim(),
    value: input.value,
  };

  const date = normalizeOptionalString(input.date);
  if (date) {
    record.date = date;
  }

  const unit = normalizeOptionalString(input.unit);
  if (unit) {
    record.unit = unit;
  }

  const originId = normalizeOptionalString(input.origin_id);
  if (originId) {
    record.origin_id = originId;
  }

  const note = normalizeOptionalString(input.note);
  if (note) {
    record.note = note;
  }

  if (input.context && Object.keys(input.context).length > 0) {
    record.context = input.context;
  }

  if (input.tags && input.tags.length > 0) {
    record.tags = input.tags;
  }

  return record;
}

function serializeMetricRecord(record: MetricRecord): string {
  const serialized: Record<string, unknown> = {
    id: record.id,
    ts: record.ts,
  };

  if (record.date) {
    serialized.date = record.date;
  }

  serialized.key = record.key;
  serialized.value = record.value;

  if (record.unit) {
    serialized.unit = record.unit;
  }

  serialized.source = record.source;

  if (record.origin_id) {
    serialized.origin_id = record.origin_id;
  }

  if (record.note) {
    serialized.note = record.note;
  }

  if (record.context) {
    serialized.context = record.context;
  }

  if (record.tags) {
    serialized.tags = record.tags;
  }

  return JSON.stringify(serialized);
}

function normalizeTrailingNewline(original: string, content: string): string {
  if (original.endsWith("\n") && !content.endsWith("\n")) {
    return `${content}\n`;
  }

  return content;
}

function parseRecordAtLine(line: string): Record<string, unknown> | null {
  if (line.trim().length === 0) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(line);
    return isObjectRecord(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

export function assignMissingIdsToMetricsData(data: string): AssignMissingIdsResult {
  let assigned = 0;
  let skipped = 0;

  const hasTrailingNewline = data.endsWith("\n");
  const rewrittenLines = data.split("\n").map((line) => {
    if (line.trim().length === 0) {
      return line;
    }

    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(line);
    } catch {
      skipped += 1;
      return line;
    }

    if (!isObjectRecord(parsedValue)) {
      skipped += 1;
      return line;
    }

    if (typeof parsedValue.id === "string" && parsedValue.id.trim().length > 0) {
      return line;
    }

    assigned += 1;
    return JSON.stringify({
      id: generateUlid(),
      ...parsedValue,
    });
  });

  const content = rewrittenLines.join("\n");
  return {
    assigned,
    content: hasTrailingNewline && !content.endsWith("\n") ? `${content}\n` : content,
    skipped,
  };
}

export function appendMetricRecordToMetricsData(
  data: string,
  input: MetricRecordInput,
): MetricsMutationResult {
  const record = normalizeRecordInput(input);
  const serializedRecord = serializeMetricRecord(record);
  const prefix = data.length === 0 || data.endsWith("\n") ? "" : "\n";

  return {
    content: `${data}${prefix}${serializedRecord}\n`,
    record,
  };
}

export function updateMetricRecordInMetricsData(
  data: string,
  targetId: string,
  input: MetricRecordInput,
): MetricsMutationResult {
  const normalizedTargetId = targetId.trim();
  const record = normalizeRecordInput({
    ...input,
    id: normalizedTargetId,
  });

  const lines = data.split("\n");
  let targetIndex = -1;

  lines.forEach((line, index) => {
    const parsedRecord = parseRecordAtLine(line);
    if (!parsedRecord) {
      return;
    }

    if (parsedRecord.id === normalizedTargetId) {
      if (targetIndex !== -1) {
        throw new MetricsMutationError(
          `Cannot update \`${normalizedTargetId}\` because it is duplicated in this file.`,
          "duplicate_id",
        );
      }

      targetIndex = index;
    }
  });

  if (targetIndex === -1) {
    throw new MetricsMutationError(
      `Could not find metrics record \`${normalizedTargetId}\`.`,
      "record_not_found",
    );
  }

  lines[targetIndex] = serializeMetricRecord(record);
  return {
    content: normalizeTrailingNewline(data, lines.join("\n")),
    record,
  };
}

export function deleteMetricRecordFromMetricsData(
  data: string,
  targetId: string,
): { content: string } {
  const normalizedTargetId = targetId.trim();
  const lines = data.split("\n");
  let targetIndex = -1;

  lines.forEach((line, index) => {
    const parsedRecord = parseRecordAtLine(line);
    if (!parsedRecord) {
      return;
    }

    if (parsedRecord.id === normalizedTargetId) {
      if (targetIndex !== -1) {
        throw new MetricsMutationError(
          `Cannot delete \`${normalizedTargetId}\` because it is duplicated in this file.`,
          "duplicate_id",
        );
      }

      targetIndex = index;
    }
  });

  if (targetIndex === -1) {
    throw new MetricsMutationError(
      `Could not find metrics record \`${normalizedTargetId}\`.`,
      "record_not_found",
    );
  }

  lines.splice(targetIndex, 1);
  const content = lines.join("\n");
  return {
    content: normalizeTrailingNewline(data, content),
  };
}
