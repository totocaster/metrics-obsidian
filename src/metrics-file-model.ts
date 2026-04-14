import type { MetricRecord } from "./contract";
import {
  canonicalMetricUnit,
  getSupportedUnitsForMetric,
  hasKnownMetricKey,
  hasKnownMetricUnit,
  isUnitAllowedForMetric,
  normalizeMetricUnitKey,
} from "./metric-catalog";

export type MetricIssueSeverity = "error" | "warning";
export type MetricRowStatus = "valid" | "warning" | "error";

export interface MetricIssue {
  code: string;
  field?: string;
  message: string;
  severity: MetricIssueSeverity;
}

export interface ParsedMetricRow {
  issues: MetricIssue[];
  lineNumber: number;
  metric: Partial<MetricRecord> | null;
  rawLine: string;
  rowKey: string;
  status: MetricRowStatus;
}

export interface MetricIssueSummary {
  code: string;
  count: number;
  message: string;
  severity: MetricIssueSeverity;
}

export interface MetricsFileAnalysis {
  errorRows: number;
  issueSummary: MetricIssueSummary[];
  legacyRows: number;
  rows: ParsedMetricRow[];
  totalRows: number;
  validRows: number;
  warningRows: number;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TS_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;
const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;

function addIssue(row: ParsedMetricRow, issue: MetricIssue): void {
  const exists = row.issues.some(
    (existing) =>
      existing.code === issue.code &&
      existing.field === issue.field &&
      existing.message === issue.message &&
      existing.severity === issue.severity,
  );

  if (!exists) {
    row.issues.push(issue);
  }
}

function classifyRowStatus(issues: MetricIssue[]): MetricRowStatus {
  if (issues.some((issue) => issue.severity === "error")) {
    return "error";
  }

  if (issues.length > 0) {
    return "warning";
  }

  return "valid";
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function formatAllowedUnits(units: string[]): string {
  return units.map((unit) => `\`${unit}\``).join(", ");
}

function validateObjectShape(row: ParsedMetricRow, parsed: Record<string, unknown>): void {
  const id = parsed.id;
  if (typeof id !== "string" || id.trim().length === 0) {
    addIssue(row, {
      code: "missing_id",
      field: "id",
      message: "Missing required field `id`.",
      severity: "error",
    });
  } else {
    row.metric = {
      ...row.metric,
      id,
    };

    if (!ULID_RE.test(id)) {
      addIssue(row, {
        code: "invalid_id",
        field: "id",
        message: "`id` must be a ULID string.",
        severity: "error",
      });
    }
  }

  const ts = parsed.ts;
  if (typeof ts !== "string" || ts.trim().length === 0) {
    addIssue(row, {
      code: "missing_ts",
      field: "ts",
      message: "Missing required field `ts`.",
      severity: "error",
    });
  } else {
    row.metric = {
      ...row.metric,
      ts,
    };

    if (!ISO_TS_RE.test(ts) || Number.isNaN(Date.parse(ts))) {
      addIssue(row, {
        code: "invalid_ts",
        field: "ts",
        message: "`ts` must be an ISO-8601 timestamp with timezone.",
        severity: "error",
      });
    }
  }

  const key = parsed.key;
  if (typeof key !== "string" || key.trim().length === 0) {
    addIssue(row, {
      code: "missing_key",
      field: "key",
      message: "Missing required field `key`.",
      severity: "error",
    });
  } else {
    row.metric = {
      ...row.metric,
      key,
    };

    if (!hasKnownMetricKey(key)) {
      addIssue(row, {
        code: "unknown_key",
        field: "key",
        message: `Unknown metric key \`${key}\`.`,
        severity: "warning",
      });
    }
  }

  const value = parsed.value;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    addIssue(row, {
      code: "invalid_value",
      field: "value",
      message: "`value` must be a finite number.",
      severity: "error",
    });
  } else {
    row.metric = {
      ...row.metric,
      value,
    };
  }

  const source = parsed.source;
  if (typeof source !== "string" || source.trim().length === 0) {
    addIssue(row, {
      code: "missing_source",
      field: "source",
      message: "Missing required field `source`.",
      severity: "error",
    });
  } else {
    row.metric = {
      ...row.metric,
      source,
    };
  }

  const date = parsed.date;
  if (date !== undefined) {
    if (typeof date !== "string" || !DATE_RE.test(date)) {
      addIssue(row, {
        code: "invalid_date",
        field: "date",
        message: "`date` must use `YYYY-MM-DD` format.",
        severity: "error",
      });
    } else {
      row.metric = {
        ...row.metric,
        date,
      };
    }
  }

  const unit = parsed.unit;
  if (unit !== undefined) {
    if (typeof unit !== "string" || unit.trim().length === 0) {
      addIssue(row, {
        code: "invalid_unit",
        field: "unit",
        message: "`unit` must be a non-empty string when present.",
        severity: "error",
      });
    } else {
      row.metric = {
        ...row.metric,
        unit,
      };

      if (!hasKnownMetricUnit(unit)) {
        addIssue(row, {
          code: "unknown_unit",
          field: "unit",
          message: `Unknown unit \`${unit}\`.`,
          severity: "warning",
        });
      } else {
        const keyValue = typeof row.metric?.key === "string" ? row.metric.key : null;
        const unitAllowed = isUnitAllowedForMetric(keyValue, unit);
        if (unitAllowed === false) {
          addIssue(row, {
            code: "unsupported_unit_for_key",
            field: "unit",
            message:
              `Metric key \`${keyValue}\` does not support unit \`${canonicalMetricUnit(unit) ?? unit}\`.` +
              ` Allowed units: ${formatAllowedUnits(getSupportedUnitsForMetric(keyValue))}.`,
            severity: "warning",
          });
        }
      }
    }
  }

  const originId = parsed.origin_id;
  if (originId !== undefined) {
    if (typeof originId !== "string" || originId.trim().length === 0) {
      addIssue(row, {
        code: "invalid_origin_id",
        field: "origin_id",
        message: "`origin_id` must be a non-empty string when present.",
        severity: "error",
      });
    } else {
      row.metric = {
        ...row.metric,
        origin_id: originId,
      };
    }
  }

  const note = parsed.note;
  if (note !== undefined) {
    if (typeof note !== "string") {
      addIssue(row, {
        code: "invalid_note",
        field: "note",
        message: "`note` must be a string when present.",
        severity: "error",
      });
    } else {
      row.metric = {
        ...row.metric,
        note,
      };
    }
  }

  const context = parsed.context;
  if (context !== undefined) {
    if (!isObjectRecord(context)) {
      addIssue(row, {
        code: "invalid_context",
        field: "context",
        message: "`context` must be an object when present.",
        severity: "error",
      });
    } else {
      row.metric = {
        ...row.metric,
        context,
      };
    }
  }

  const tags = parsed.tags;
  if (tags !== undefined) {
    if (!isStringArray(tags)) {
      addIssue(row, {
        code: "invalid_tags",
        field: "tags",
        message: "`tags` must be an array of strings when present.",
        severity: "error",
      });
    } else {
      row.metric = {
        ...row.metric,
        tags,
      };
    }
  }
}

function collectDuplicateRows(rows: ParsedMetricRow[], field: "id" | "origin_id"): Map<string, ParsedMetricRow[]> {
  const grouped = new Map<string, ParsedMetricRow[]>();

  rows.forEach((row) => {
    const value = row.metric?.[field];
    if (typeof value !== "string" || value.length === 0) {
      return;
    }

    const current = grouped.get(value) ?? [];
    current.push(row);
    grouped.set(value, current);
  });

  const duplicates = new Map<string, ParsedMetricRow[]>();
  grouped.forEach((group, value) => {
    if (group.length > 1) {
      duplicates.set(value, group);
    }
  });

  return duplicates;
}

function collectUnitsByKey(rows: ParsedMetricRow[]): Map<string, Set<string>> {
  const unitsByKey = new Map<string, Set<string>>();

  rows.forEach((row) => {
    const key = row.metric?.key;
    const unit = normalizeMetricUnitKey(row.metric?.unit);
    if (typeof key !== "string" || typeof unit !== "string") {
      return;
    }

    const units = unitsByKey.get(key) ?? new Set<string>();
    units.add(unit);
    unitsByKey.set(key, units);
  });

  return unitsByKey;
}

export function analyzeMetricsData(data: string): MetricsFileAnalysis {
  const rows: ParsedMetricRow[] = [];

  data.split("\n").forEach((rawLine, index) => {
    if (rawLine.trim().length === 0) {
      return;
    }

    const row: ParsedMetricRow = {
      issues: [],
      lineNumber: index + 1,
      metric: null,
      rawLine,
      rowKey: `line-${index + 1}`,
      status: "valid",
    };

    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(rawLine);
    } catch {
      addIssue(row, {
        code: "invalid_json",
        message: "Invalid JSON line.",
        severity: "error",
      });
      row.status = classifyRowStatus(row.issues);
      rows.push(row);
      return;
    }

    if (!isObjectRecord(parsedValue)) {
      addIssue(row, {
        code: "invalid_shape",
        message: "Each metrics line must be a JSON object.",
        severity: "error",
      });
      row.status = classifyRowStatus(row.issues);
      rows.push(row);
      return;
    }

    row.metric = {};
    validateObjectShape(row, parsedValue);
    row.status = classifyRowStatus(row.issues);
    rows.push(row);
  });

  collectDuplicateRows(rows, "id").forEach((group, duplicateId) => {
    group.forEach((row) => {
      addIssue(row, {
        code: "duplicate_id",
        field: "id",
        message: `Duplicate \`id\` detected: \`${duplicateId}\`.`,
        severity: "error",
      });
      row.status = classifyRowStatus(row.issues);
    });
  });

  collectDuplicateRows(rows, "origin_id").forEach((group, duplicateOriginId) => {
    group.forEach((row) => {
      addIssue(row, {
        code: "duplicate_origin_id",
        field: "origin_id",
        message: `Duplicate \`origin_id\` detected: \`${duplicateOriginId}\`.`,
        severity: "warning",
      });
      row.status = classifyRowStatus(row.issues);
    });
  });

  const unitsByKey = collectUnitsByKey(rows);
  rows.forEach((row) => {
    const key = row.metric?.key;
    const unit = row.metric?.unit;
    if (typeof key !== "string" || typeof unit !== "string") {
      return;
    }

    if ((unitsByKey.get(key)?.size ?? 0) > 1) {
      addIssue(row, {
        code: "mixed_key_unit",
        field: "unit",
        message: `Metric key \`${key}\` appears with multiple units.`,
        severity: "warning",
      });
      row.status = classifyRowStatus(row.issues);
    }
  });

  const issueSummaryMap = new Map<string, MetricIssueSummary>();
  rows.forEach((row) => {
    row.issues.forEach((issue) => {
      const summaryKey = `${issue.severity}:${issue.code}:${issue.message}`;
      const current = issueSummaryMap.get(summaryKey);
      if (current) {
        current.count += 1;
        return;
      }

      issueSummaryMap.set(summaryKey, {
        code: issue.code,
        count: 1,
        message: issue.message,
        severity: issue.severity,
      });
    });
  });

  const issueSummary = Array.from(issueSummaryMap.values()).sort((left, right) => {
    if (left.severity !== right.severity) {
      return left.severity === "error" ? -1 : 1;
    }

    if (left.count !== right.count) {
      return right.count - left.count;
    }

    return left.message.localeCompare(right.message);
  });

  const validRows = rows.filter((row) => row.status === "valid").length;
  const warningRows = rows.filter((row) => row.status === "warning").length;
  const errorRows = rows.filter((row) => row.status === "error").length;
  const legacyRows = rows.filter((row) =>
    row.issues.some((issue) => issue.code === "missing_id"),
  ).length;

  return {
    errorRows,
    issueSummary,
    legacyRows,
    rows,
    totalRows: rows.length,
    validRows,
    warningRows,
  };
}
