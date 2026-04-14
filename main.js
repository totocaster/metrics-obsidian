"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => MetricsPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian6 = require("obsidian");

// src/contract.ts
var METRIC_REFERENCE_PREFIX = "metric:";
var METRIC_ID_LENGTH = 26;
var ULID_TEXT_RE = /[0-9A-HJKMNP-TV-Z]{26}/i;
function toMetricReference(id, prefix = METRIC_REFERENCE_PREFIX) {
  return `${prefix}${id}`;
}
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function normalizeMetricId(value) {
  const trimmed = value.trim();
  if (!ULID_TEXT_RE.test(trimmed) || trimmed.length !== METRIC_ID_LENGTH) {
    return null;
  }
  return trimmed.toUpperCase();
}
function extractMetricIdFromText(value, prefix = METRIC_REFERENCE_PREFIX) {
  const directId = normalizeMetricId(value);
  if (directId) {
    return directId;
  }
  const trimmed = value.trim();
  const escapedPrefix = escapeRegex(prefix);
  const match = new RegExp(`${escapedPrefix}([0-9A-HJKMNP-TV-Z]{26})`, "i").exec(trimmed);
  return match ? match[1].toUpperCase() : null;
}
function findMetricIdAtOffset(value, offset, prefix = METRIC_REFERENCE_PREFIX) {
  const escapedPrefix = escapeRegex(prefix);
  const candidates = [
    new RegExp(`${escapedPrefix}([0-9A-HJKMNP-TV-Z]{26})`, "ig"),
    /[0-9A-HJKMNP-TV-Z]{26}/ig
  ];
  for (const candidate of candidates) {
    let match;
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

// src/metric-reference-modal.ts
var import_obsidian = require("obsidian");
var MetricReferenceModal = class extends import_obsidian.Modal {
  constructor(app, options, onSubmitValue) {
    super(app);
    this.onSubmitValue = onSubmitValue;
    this.value = options.initialValue ?? "";
  }
  onSubmitValue;
  value;
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Open metric reference" });
    let referenceInput = null;
    new import_obsidian.Setting(contentEl).setName("Reference").setDesc("Paste `metric:<id>` or a raw metric id.").addText((text) => {
      referenceInput = text.inputEl;
      text.setPlaceholder("metric:01JRX9Y7T9TQ8Q3A91F1M7A4AA");
      text.setValue(this.value);
      text.onChange((value) => {
        this.value = value;
      });
      text.inputEl.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") {
          return;
        }
        event.preventDefault();
        this.submit();
      });
    });
    const actions = contentEl.createDiv({ cls: "metrics-lens-actions" });
    const cancelButton = actions.createEl("button", { text: "Cancel" });
    cancelButton.type = "button";
    cancelButton.addEventListener("click", () => {
      this.close();
    });
    const submitButton = actions.createEl("button", {
      cls: "mod-cta",
      text: "Open"
    });
    submitButton.type = "button";
    submitButton.setAttribute("aria-label", "Open metric reference");
    submitButton.addEventListener("click", () => {
      this.submit();
    });
    window.setTimeout(() => {
      referenceInput?.focus();
      referenceInput?.select();
    }, 0);
  }
  submit() {
    if (this.value.trim().length === 0) {
      new import_obsidian.Notice("Enter a metric reference or id.");
      return;
    }
    this.onSubmitValue(this.value);
    this.close();
  }
};

// src/metric-record-modal.ts
var import_obsidian2 = require("obsidian");
function currentIsoTimestamp() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function trimOrUndefined(value) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : void 0;
}
var MetricRecordModal = class extends import_obsidian2.Modal {
  options;
  onSubmitValue;
  constructor(app, options, onSubmitValue) {
    super(app);
    this.options = options;
    this.onSubmitValue = onSubmitValue;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: this.options.title });
    const initial = this.options.initialRecord;
    let ts = initial?.ts ?? currentIsoTimestamp();
    let date = initial?.date ?? "";
    let key = initial?.key ?? "";
    let value = typeof initial?.value === "number" ? String(initial.value) : "";
    let unit = initial?.unit ?? "";
    let source = initial?.source ?? "manual";
    let originId = initial?.origin_id ?? "";
    let note = initial?.note ?? "";
    let tags = initial?.tags?.join(", ") ?? "";
    let context = initial?.context ? JSON.stringify(initial.context, null, 2) : "";
    new import_obsidian2.Setting(contentEl).setName("Timestamp").setDesc("ISO-8601 timestamp with timezone.").addText((text) => {
      text.setPlaceholder("2026-04-14T09:30:00+04:00");
      text.setValue(ts);
      text.onChange((nextValue) => {
        ts = nextValue;
      });
    });
    new import_obsidian2.Setting(contentEl).setName("Date").setDesc("Optional local date in YYYY-MM-DD format.").addText((text) => {
      text.setPlaceholder("2026-04-14");
      text.setValue(date);
      text.onChange((nextValue) => {
        date = nextValue;
      });
    });
    new import_obsidian2.Setting(contentEl).setName("Key").setDesc("Canonical metric key.").addText((text) => {
      text.setPlaceholder("body.weight");
      text.setValue(key);
      text.onChange((nextValue) => {
        key = nextValue;
      });
    });
    new import_obsidian2.Setting(contentEl).setName("Value").setDesc("Numeric metric value.").addText((text) => {
      text.inputEl.type = "number";
      text.inputEl.step = "any";
      text.setPlaceholder("104.4");
      text.setValue(value);
      text.onChange((nextValue) => {
        value = nextValue;
      });
    });
    new import_obsidian2.Setting(contentEl).setName("Unit").setDesc("Optional display unit.").addText((text) => {
      text.setPlaceholder("kg");
      text.setValue(unit);
      text.onChange((nextValue) => {
        unit = nextValue;
      });
    });
    new import_obsidian2.Setting(contentEl).setName("Source").setDesc("Origin system for this record.").addText((text) => {
      text.setPlaceholder("manual");
      text.setValue(source);
      text.onChange((nextValue) => {
        source = nextValue;
      });
    });
    new import_obsidian2.Setting(contentEl).setName("Origin id").setDesc("Optional external provenance id.").addText((text) => {
      text.setPlaceholder("withings:2026-04-14:body.weight");
      text.setValue(originId);
      text.onChange((nextValue) => {
        originId = nextValue;
      });
    });
    const noteSetting = new import_obsidian2.Setting(contentEl).setName("Note").setDesc("Optional human-readable note.");
    const noteTextarea = noteSetting.controlEl.createEl("textarea");
    noteTextarea.rows = 3;
    noteTextarea.value = note;
    noteTextarea.addEventListener("input", () => {
      note = noteTextarea.value;
    });
    const tagsSetting = new import_obsidian2.Setting(contentEl).setName("Tags").setDesc("Optional comma-separated tags.");
    const tagsInput = tagsSetting.controlEl.createEl("input", { type: "text" });
    tagsInput.value = tags;
    tagsInput.placeholder = "food, lunch";
    tagsInput.addEventListener("input", () => {
      tags = tagsInput.value;
    });
    const contextSetting = new import_obsidian2.Setting(contentEl).setName("Context JSON").setDesc("Optional JSON object stored as structured context.");
    const contextTextarea = contextSetting.controlEl.createEl("textarea");
    contextTextarea.rows = 5;
    contextTextarea.value = context;
    contextTextarea.placeholder = '{"precision":"date"}';
    contextTextarea.addEventListener("input", () => {
      context = contextTextarea.value;
    });
    const buttonRow = contentEl.createDiv({ cls: "metrics-lens-actions" });
    const cancelButton = buttonRow.createEl("button", { text: "Cancel" });
    cancelButton.addEventListener("click", () => {
      this.close();
    });
    const submitButton = buttonRow.createEl("button", {
      cls: "mod-cta",
      text: this.options.submitLabel
    });
    submitButton.setAttribute("aria-label", this.options.submitLabel);
    submitButton.addEventListener("click", () => {
      const parsedValue = Number(value);
      if (!Number.isFinite(parsedValue)) {
        new import_obsidian2.Notice("Value must be a finite number.");
        return;
      }
      if (ts.trim().length === 0 || key.trim().length === 0 || source.trim().length === 0) {
        new import_obsidian2.Notice("Timestamp, key, and source are required.");
        return;
      }
      let parsedContext;
      const normalizedContext = trimOrUndefined(context);
      if (normalizedContext) {
        let contextValue;
        try {
          contextValue = JSON.parse(normalizedContext);
        } catch {
          new import_obsidian2.Notice("Context JSON must be valid JSON.");
          return;
        }
        if (typeof contextValue === "object" && contextValue !== null && !Array.isArray(contextValue)) {
          parsedContext = contextValue;
        } else {
          new import_obsidian2.Notice("Context JSON must be a JSON object.");
          return;
        }
      }
      const parsedTags = trimOrUndefined(tags)?.split(",").map((tag) => tag.trim()).filter((tag) => tag.length > 0);
      this.onSubmitValue({
        context: parsedContext,
        date: trimOrUndefined(date),
        id: initial?.id,
        key: key.trim(),
        note: trimOrUndefined(note),
        origin_id: trimOrUndefined(originId),
        source: source.trim(),
        tags: parsedTags,
        ts: ts.trim(),
        unit: trimOrUndefined(unit),
        value: parsedValue
      });
      this.close();
    });
  }
};

// src/metrics-file-model.ts
var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
var ISO_TS_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;
var ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;
var KNOWN_UNITS = /* @__PURE__ */ new Set([
  "bpm",
  "br/min",
  "C",
  "count",
  "g",
  "hours",
  "kcal",
  "kg",
  "km",
  "min",
  "ml",
  "mmHg",
  "ms",
  "percent",
  "score"
]);
function addIssue(row, issue) {
  const exists = row.issues.some(
    (existing) => existing.code === issue.code && existing.field === issue.field && existing.message === issue.message && existing.severity === issue.severity
  );
  if (!exists) {
    row.issues.push(issue);
  }
}
function classifyRowStatus(issues) {
  if (issues.some((issue) => issue.severity === "error")) {
    return "error";
  }
  if (issues.length > 0) {
    return "warning";
  }
  return "valid";
}
function isObjectRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}
function validateObjectShape(row, parsed) {
  const id = parsed.id;
  if (typeof id !== "string" || id.trim().length === 0) {
    addIssue(row, {
      code: "missing_id",
      field: "id",
      message: "Missing required field `id`.",
      severity: "error"
    });
  } else {
    row.metric = {
      ...row.metric,
      id
    };
    if (!ULID_RE.test(id)) {
      addIssue(row, {
        code: "invalid_id",
        field: "id",
        message: "`id` must be a ULID string.",
        severity: "error"
      });
    }
  }
  const ts = parsed.ts;
  if (typeof ts !== "string" || ts.trim().length === 0) {
    addIssue(row, {
      code: "missing_ts",
      field: "ts",
      message: "Missing required field `ts`.",
      severity: "error"
    });
  } else {
    row.metric = {
      ...row.metric,
      ts
    };
    if (!ISO_TS_RE.test(ts) || Number.isNaN(Date.parse(ts))) {
      addIssue(row, {
        code: "invalid_ts",
        field: "ts",
        message: "`ts` must be an ISO-8601 timestamp with timezone.",
        severity: "error"
      });
    }
  }
  const key = parsed.key;
  if (typeof key !== "string" || key.trim().length === 0) {
    addIssue(row, {
      code: "missing_key",
      field: "key",
      message: "Missing required field `key`.",
      severity: "error"
    });
  } else {
    row.metric = {
      ...row.metric,
      key
    };
  }
  const value = parsed.value;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    addIssue(row, {
      code: "invalid_value",
      field: "value",
      message: "`value` must be a finite number.",
      severity: "error"
    });
  } else {
    row.metric = {
      ...row.metric,
      value
    };
  }
  const source = parsed.source;
  if (typeof source !== "string" || source.trim().length === 0) {
    addIssue(row, {
      code: "missing_source",
      field: "source",
      message: "Missing required field `source`.",
      severity: "error"
    });
  } else {
    row.metric = {
      ...row.metric,
      source
    };
  }
  const date = parsed.date;
  if (date !== void 0) {
    if (typeof date !== "string" || !DATE_RE.test(date)) {
      addIssue(row, {
        code: "invalid_date",
        field: "date",
        message: "`date` must use `YYYY-MM-DD` format.",
        severity: "error"
      });
    } else {
      row.metric = {
        ...row.metric,
        date
      };
    }
  }
  const unit = parsed.unit;
  if (unit !== void 0) {
    if (typeof unit !== "string" || unit.trim().length === 0) {
      addIssue(row, {
        code: "invalid_unit",
        field: "unit",
        message: "`unit` must be a non-empty string when present.",
        severity: "error"
      });
    } else {
      row.metric = {
        ...row.metric,
        unit
      };
      if (!KNOWN_UNITS.has(unit)) {
        addIssue(row, {
          code: "unknown_unit",
          field: "unit",
          message: `Unknown unit \`${unit}\`.`,
          severity: "warning"
        });
      }
    }
  }
  const originId = parsed.origin_id;
  if (originId !== void 0) {
    if (typeof originId !== "string" || originId.trim().length === 0) {
      addIssue(row, {
        code: "invalid_origin_id",
        field: "origin_id",
        message: "`origin_id` must be a non-empty string when present.",
        severity: "error"
      });
    } else {
      row.metric = {
        ...row.metric,
        origin_id: originId
      };
    }
  }
  const note = parsed.note;
  if (note !== void 0) {
    if (typeof note !== "string") {
      addIssue(row, {
        code: "invalid_note",
        field: "note",
        message: "`note` must be a string when present.",
        severity: "error"
      });
    } else {
      row.metric = {
        ...row.metric,
        note
      };
    }
  }
  const context = parsed.context;
  if (context !== void 0) {
    if (!isObjectRecord(context)) {
      addIssue(row, {
        code: "invalid_context",
        field: "context",
        message: "`context` must be an object when present.",
        severity: "error"
      });
    } else {
      row.metric = {
        ...row.metric,
        context
      };
    }
  }
  const tags = parsed.tags;
  if (tags !== void 0) {
    if (!isStringArray(tags)) {
      addIssue(row, {
        code: "invalid_tags",
        field: "tags",
        message: "`tags` must be an array of strings when present.",
        severity: "error"
      });
    } else {
      row.metric = {
        ...row.metric,
        tags
      };
    }
  }
}
function collectDuplicateRows(rows, field) {
  const grouped = /* @__PURE__ */ new Map();
  rows.forEach((row) => {
    const value = row.metric?.[field];
    if (typeof value !== "string" || value.length === 0) {
      return;
    }
    const current = grouped.get(value) ?? [];
    current.push(row);
    grouped.set(value, current);
  });
  const duplicates = /* @__PURE__ */ new Map();
  grouped.forEach((group, value) => {
    if (group.length > 1) {
      duplicates.set(value, group);
    }
  });
  return duplicates;
}
function collectUnitsByKey(rows) {
  const unitsByKey = /* @__PURE__ */ new Map();
  rows.forEach((row) => {
    const key = row.metric?.key;
    const unit = row.metric?.unit;
    if (typeof key !== "string" || typeof unit !== "string") {
      return;
    }
    const units = unitsByKey.get(key) ?? /* @__PURE__ */ new Set();
    units.add(unit);
    unitsByKey.set(key, units);
  });
  return unitsByKey;
}
function sortableRowTimestamp(row) {
  const ts = row.metric?.ts;
  if (typeof ts !== "string") {
    return null;
  }
  const parsed = Date.parse(ts);
  return Number.isNaN(parsed) ? null : parsed;
}
function analyzeMetricsData(data) {
  const rows = [];
  data.split("\n").forEach((rawLine, index) => {
    if (rawLine.trim().length === 0) {
      return;
    }
    const row = {
      issues: [],
      lineNumber: index + 1,
      metric: null,
      rawLine,
      rowKey: `line-${index + 1}`,
      status: "valid"
    };
    let parsedValue;
    try {
      parsedValue = JSON.parse(rawLine);
    } catch {
      addIssue(row, {
        code: "invalid_json",
        message: "Invalid JSON line.",
        severity: "error"
      });
      row.status = classifyRowStatus(row.issues);
      rows.push(row);
      return;
    }
    if (!isObjectRecord(parsedValue)) {
      addIssue(row, {
        code: "invalid_shape",
        message: "Each metrics line must be a JSON object.",
        severity: "error"
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
        severity: "error"
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
        severity: "warning"
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
        severity: "warning"
      });
      row.status = classifyRowStatus(row.issues);
    }
  });
  const issueSummaryMap = /* @__PURE__ */ new Map();
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
        severity: issue.severity
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
  const sortedRows = [...rows].sort((left, right) => {
    const leftTimestamp = sortableRowTimestamp(left);
    const rightTimestamp = sortableRowTimestamp(right);
    if (leftTimestamp !== null && rightTimestamp !== null && leftTimestamp !== rightTimestamp) {
      return rightTimestamp - leftTimestamp;
    }
    if (leftTimestamp !== null) {
      return -1;
    }
    if (rightTimestamp !== null) {
      return 1;
    }
    return right.lineNumber - left.lineNumber;
  });
  const validRows = rows.filter((row) => row.status === "valid").length;
  const warningRows = rows.filter((row) => row.status === "warning").length;
  const errorRows = rows.filter((row) => row.status === "error").length;
  const legacyRows = rows.filter(
    (row) => row.issues.some((issue) => issue.code === "missing_id")
  ).length;
  return {
    errorRows,
    issueSummary,
    legacyRows,
    rows: sortedRows,
    totalRows: rows.length,
    validRows,
    warningRows
  };
}

// src/ulid.ts
var CROCKFORD_BASE32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function encodeBase32(value, length) {
  let remaining = value;
  let result = "";
  for (let index = 0; index < length; index += 1) {
    const characterIndex = remaining % 32;
    result = `${CROCKFORD_BASE32[characterIndex]}${result}`;
    remaining = Math.floor(remaining / 32);
  }
  return result;
}
function randomBase32(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let result = "";
  bytes.forEach((byte) => {
    result += CROCKFORD_BASE32[byte % 32];
  });
  return result;
}
function generateUlid(timestamp = Date.now()) {
  return `${encodeBase32(timestamp, 10)}${randomBase32(16)}`;
}

// src/metrics-file-mutation.ts
var MetricsMutationError = class extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
    this.name = "MetricsMutationError";
  }
  code;
};
function isObjectRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function normalizeOptionalString(value) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : void 0;
}
function normalizeRecordInput(input) {
  const record = {
    id: normalizeOptionalString(input.id) ?? generateUlid(),
    key: input.key.trim(),
    source: input.source.trim(),
    ts: input.ts.trim(),
    value: input.value
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
function serializeMetricRecord(record) {
  const serialized = {
    id: record.id,
    ts: record.ts
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
function normalizeTrailingNewline(original, content) {
  if (original.endsWith("\n") && !content.endsWith("\n")) {
    return `${content}
`;
  }
  return content;
}
function parseRecordAtLine(line) {
  if (line.trim().length === 0) {
    return null;
  }
  try {
    const parsedValue = JSON.parse(line);
    return isObjectRecord2(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}
function assignMissingIdsToMetricsData(data) {
  let assigned = 0;
  let skipped = 0;
  const hasTrailingNewline = data.endsWith("\n");
  const rewrittenLines = data.split("\n").map((line) => {
    if (line.trim().length === 0) {
      return line;
    }
    let parsedValue;
    try {
      parsedValue = JSON.parse(line);
    } catch {
      skipped += 1;
      return line;
    }
    if (!isObjectRecord2(parsedValue)) {
      skipped += 1;
      return line;
    }
    if (typeof parsedValue.id === "string" && parsedValue.id.trim().length > 0) {
      return line;
    }
    assigned += 1;
    return JSON.stringify({
      id: generateUlid(),
      ...parsedValue
    });
  });
  const content = rewrittenLines.join("\n");
  return {
    assigned,
    content: hasTrailingNewline && !content.endsWith("\n") ? `${content}
` : content,
    skipped
  };
}
function appendMetricRecordToMetricsData(data, input) {
  const record = normalizeRecordInput(input);
  const serializedRecord = serializeMetricRecord(record);
  const prefix = data.length === 0 || data.endsWith("\n") ? "" : "\n";
  return {
    content: `${data}${prefix}${serializedRecord}
`,
    record
  };
}
function updateMetricRecordInMetricsData(data, targetId, input) {
  const normalizedTargetId = targetId.trim();
  const record = normalizeRecordInput({
    ...input,
    id: normalizedTargetId
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
          "duplicate_id"
        );
      }
      targetIndex = index;
    }
  });
  if (targetIndex === -1) {
    throw new MetricsMutationError(
      `Could not find metrics record \`${normalizedTargetId}\`.`,
      "record_not_found"
    );
  }
  lines[targetIndex] = serializeMetricRecord(record);
  return {
    content: normalizeTrailingNewline(data, lines.join("\n")),
    record
  };
}
function deleteMetricRecordFromMetricsData(data, targetId) {
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
          "duplicate_id"
        );
      }
      targetIndex = index;
    }
  });
  if (targetIndex === -1) {
    throw new MetricsMutationError(
      `Could not find metrics record \`${normalizedTargetId}\`.`,
      "record_not_found"
    );
  }
  lines.splice(targetIndex, 1);
  const content = lines.join("\n");
  return {
    content: normalizeTrailingNewline(data, content)
  };
}

// src/settings.ts
var import_obsidian3 = require("obsidian");
var DEFAULT_SETTINGS = {
  metricsRoot: "Metrics",
  supportedExtensions: [".metrics.ndjson"],
  defaultWriteFile: "Metrics/All.metrics.ndjson",
  recordReferencePrefix: "metric:",
  showMetricIcons: true
};
function normalizeMetricsSettings(settings) {
  const supportedExtensions = settings.supportedExtensions?.length ? settings.supportedExtensions : DEFAULT_SETTINGS.supportedExtensions;
  return {
    metricsRoot: (0, import_obsidian3.normalizePath)(settings.metricsRoot ?? DEFAULT_SETTINGS.metricsRoot),
    supportedExtensions: Array.from(
      new Set(
        supportedExtensions.map((value) => value.trim()).filter((value) => value.length > 0)
      )
    ),
    defaultWriteFile: (0, import_obsidian3.normalizePath)(settings.defaultWriteFile ?? DEFAULT_SETTINGS.defaultWriteFile),
    recordReferencePrefix: settings.recordReferencePrefix?.trim() || DEFAULT_SETTINGS.recordReferencePrefix,
    showMetricIcons: settings.showMetricIcons ?? DEFAULT_SETTINGS.showMetricIcons
  };
}
function formatExtensions(extensions) {
  return extensions.join(", ");
}
function parseExtensions(value) {
  return value.split(",").map((item) => item.trim()).filter((item) => item.length > 0);
}
var MetricsSettingTab = class extends import_obsidian3.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  plugin;
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian3.Setting(containerEl).setName("Storage").setHeading();
    new import_obsidian3.Setting(containerEl).setName("Metrics root folder").setDesc("Folder scanned for canonical metrics files.").addText((text) => {
      text.setPlaceholder(DEFAULT_SETTINGS.metricsRoot);
      text.setValue(this.plugin.settings.metricsRoot);
      text.onChange(async (value) => {
        this.plugin.settings.metricsRoot = (0, import_obsidian3.normalizePath)(value || DEFAULT_SETTINGS.metricsRoot);
        await this.plugin.saveSettings();
        this.plugin.refreshOpenMetricsViews();
      });
    });
    new import_obsidian3.Setting(containerEl).setName("Supported extensions").setDesc("Comma-separated list of file suffixes treated as metrics files.").addText((text) => {
      text.setPlaceholder(formatExtensions(DEFAULT_SETTINGS.supportedExtensions));
      text.setValue(formatExtensions(this.plugin.settings.supportedExtensions));
      text.onChange(async (value) => {
        this.plugin.settings.supportedExtensions = parseExtensions(value);
        await this.plugin.saveSettings();
        this.plugin.refreshOpenMetricsViews();
      });
    });
    new import_obsidian3.Setting(containerEl).setName("Default write file").setDesc("Default target file used by future create and append actions.").addText((text) => {
      text.setPlaceholder(DEFAULT_SETTINGS.defaultWriteFile);
      text.setValue(this.plugin.settings.defaultWriteFile);
      text.onChange(async (value) => {
        this.plugin.settings.defaultWriteFile = (0, import_obsidian3.normalizePath)(
          value || DEFAULT_SETTINGS.defaultWriteFile
        );
        await this.plugin.saveSettings();
        this.plugin.refreshOpenMetricsViews();
      });
    });
    new import_obsidian3.Setting(containerEl).setName("Record reference prefix").setDesc("Plain-text prefix used for stable metric references in Markdown.").addText((text) => {
      text.setPlaceholder(DEFAULT_SETTINGS.recordReferencePrefix);
      text.setValue(this.plugin.settings.recordReferencePrefix);
      text.onChange(async (value) => {
        this.plugin.settings.recordReferencePrefix = value.trim() || DEFAULT_SETTINGS.recordReferencePrefix;
        await this.plugin.saveSettings();
        this.plugin.refreshOpenMetricsViews();
      });
    });
    new import_obsidian3.Setting(containerEl).setName("Appearance").setHeading();
    new import_obsidian3.Setting(containerEl).setName("Show metric icons").setDesc("Show mapped Lucide icons next to metrics when the icon exists in Obsidian.").addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.showMetricIcons);
      toggle.onChange(async (value) => {
        this.plugin.settings.showMetricIcons = value;
        await this.plugin.saveSettings();
        this.plugin.refreshOpenMetricsViews();
      });
    });
  }
};

// src/view.ts
var import_obsidian5 = require("obsidian");

// src/metric-icons.ts
var import_obsidian4 = require("obsidian");
var cachedIconIds = null;
var cachedIconCount = -1;
function availableIconIds() {
  const iconIds = (0, import_obsidian4.getIconIds)();
  if (!cachedIconIds || cachedIconCount !== iconIds.length) {
    cachedIconIds = new Set(iconIds);
    cachedIconCount = iconIds.length;
  }
  return cachedIconIds;
}
function metricIconCandidates(metricKey) {
  switch (metricKey) {
    case "body.weight":
      return ["scale", "dumbbell", "activity"];
    case "body.body_fat_pct":
      return ["percent", "activity"];
    case "nutrition.calories":
      return ["flame", "utensils"];
    case "sleep.duration":
      return ["moon-star", "moon", "bed"];
    case "sleep.performance":
      return ["bed", "moon", "activity"];
    case "recovery.score":
      return ["battery-full", "battery", "heart", "activity"];
    case "recovery.resting_hr":
      return ["heart-pulse", "heart", "activity"];
    case "activity.strain":
      return ["gauge", "activity", "zap"];
    case "medication.semaglutide_dose":
      return ["syringe", "pill"];
  }
  if (metricKey.startsWith("body.")) {
    return ["scale", "dumbbell", "activity"];
  }
  if (metricKey.startsWith("nutrition.")) {
    return ["flame", "utensils"];
  }
  if (metricKey.startsWith("sleep.")) {
    return ["moon-star", "moon", "bed"];
  }
  if (metricKey.startsWith("recovery.")) {
    return ["battery-full", "battery", "heart", "activity"];
  }
  if (metricKey.startsWith("activity.")) {
    return ["gauge", "activity", "zap"];
  }
  if (metricKey.startsWith("medication.")) {
    return ["syringe", "pill"];
  }
  return ["activity"];
}
function metricIconForKey(metricKey) {
  const candidates = metricIconCandidates(metricKey);
  const available = availableIconIds();
  for (const candidate of candidates) {
    if (available.has(candidate)) {
      return candidate;
    }
  }
  return candidates[0] ?? null;
}

// src/view.ts
var METRICS_VIEW_TYPE = "metrics-file-view";
var DEFAULT_VIEW_STATE = {
  fromDate: "",
  groupBy: "none",
  key: "",
  searchText: "",
  sortOrder: "newest",
  source: "",
  status: "all",
  timeRange: "all",
  toDate: ""
};
function createDefaultViewState() {
  return { ...DEFAULT_VIEW_STATE };
}
function logicalMetricsBaseName(fileName, extensions) {
  const matchingExtension = extensions.find((extension) => fileName.endsWith(extension));
  if (matchingExtension) {
    return fileName.slice(0, -matchingExtension.length);
  }
  return fileName;
}
function capitalizeDisplayName(value) {
  if (value.length === 0) {
    return "Metrics";
  }
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
function formatMetricValue(row) {
  const value = row.metric?.value;
  const unit = row.metric?.unit;
  if (typeof value !== "number") {
    return null;
  }
  return typeof unit === "string" ? `${value} ${unit}` : `${value}`;
}
function rowTimestamp(row) {
  const ts = row.metric?.ts;
  if (typeof ts !== "string") {
    return null;
  }
  const parsed = Date.parse(ts);
  return Number.isNaN(parsed) ? null : parsed;
}
function rowDateValue(row) {
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
function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function startOfToday() {
  const date = /* @__PURE__ */ new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}
function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
function startOfWeek(date) {
  const next = new Date(date);
  const day = next.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + offset);
  next.setHours(0, 0, 0, 0);
  return next;
}
function startOfMonth(date) {
  const next = new Date(date);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next;
}
function resolvedTimeRange(viewState) {
  const today = startOfToday();
  switch (viewState.timeRange) {
    case "today":
      return {
        fromDate: toLocalDateString(today),
        toDate: toLocalDateString(today)
      };
    case "this-week":
      return {
        fromDate: toLocalDateString(startOfWeek(today)),
        toDate: toLocalDateString(today)
      };
    case "past-7-days":
      return {
        fromDate: toLocalDateString(addDays(today, -6)),
        toDate: toLocalDateString(today)
      };
    case "past-30-days":
      return {
        fromDate: toLocalDateString(addDays(today, -29)),
        toDate: toLocalDateString(today)
      };
    case "this-month":
      return {
        fromDate: toLocalDateString(startOfMonth(today)),
        toDate: toLocalDateString(today)
      };
    case "custom":
      return {
        fromDate: viewState.fromDate,
        toDate: viewState.toDate
      };
    case "all":
    default:
      return {
        fromDate: "",
        toDate: ""
      };
  }
}
function rowSearchText(row) {
  const parts = [
    row.metric?.id,
    row.metric?.key,
    row.metric?.source,
    row.metric?.origin_id,
    row.metric?.note,
    row.metric?.unit,
    row.metric?.date,
    row.rawLine
  ];
  if (Array.isArray(row.metric?.tags)) {
    parts.push(row.metric.tags.join(" "));
  }
  return parts.filter((value) => typeof value === "string" && value.length > 0).join(" ").toLowerCase();
}
function collectFilterValues(rows, field) {
  return Array.from(
    new Set(
      rows.map((row) => row.metric?.[field]).filter((value) => typeof value === "string" && value.length > 0)
    )
  ).sort((left, right) => left.localeCompare(right));
}
function applyMetricsViewState(rows, viewState) {
  const normalizedSearch = viewState.searchText.trim().toLowerCase();
  const { fromDate, toDate } = resolvedTimeRange(viewState);
  const filteredRows = rows.filter((row) => {
    if (viewState.key && row.metric?.key !== viewState.key) {
      return false;
    }
    if (viewState.source && row.metric?.source !== viewState.source) {
      return false;
    }
    if (viewState.status !== "all" && row.status !== viewState.status) {
      return false;
    }
    const rowDate = rowDateValue(row);
    if (fromDate && (!rowDate || rowDate < fromDate)) {
      return false;
    }
    if (toDate && (!rowDate || rowDate > toDate)) {
      return false;
    }
    if (normalizedSearch.length > 0 && !rowSearchText(row).includes(normalizedSearch)) {
      return false;
    }
    return true;
  });
  return [...filteredRows].sort((left, right) => {
    if (viewState.sortOrder === "newest") {
      const leftTimestamp = rowTimestamp(left);
      const rightTimestamp = rowTimestamp(right);
      if (leftTimestamp !== null && rightTimestamp !== null && leftTimestamp !== rightTimestamp) {
        return rightTimestamp - leftTimestamp;
      }
      if (leftTimestamp !== null) {
        return -1;
      }
      if (rightTimestamp !== null) {
        return 1;
      }
      return right.lineNumber - left.lineNumber;
    }
    if (viewState.sortOrder === "oldest") {
      const leftTimestamp = rowTimestamp(left);
      const rightTimestamp = rowTimestamp(right);
      if (leftTimestamp !== null && rightTimestamp !== null && leftTimestamp !== rightTimestamp) {
        return leftTimestamp - rightTimestamp;
      }
      if (leftTimestamp !== null) {
        return -1;
      }
      if (rightTimestamp !== null) {
        return 1;
      }
      return left.lineNumber - right.lineNumber;
    }
    if (viewState.sortOrder === "value-desc" || viewState.sortOrder === "value-asc") {
      const leftValue = left.metric?.value;
      const rightValue = right.metric?.value;
      const leftIsNumber = typeof leftValue === "number" && Number.isFinite(leftValue);
      const rightIsNumber = typeof rightValue === "number" && Number.isFinite(rightValue);
      if (leftIsNumber && rightIsNumber && leftValue !== rightValue) {
        return viewState.sortOrder === "value-desc" ? rightValue - leftValue : leftValue - rightValue;
      }
      if (leftIsNumber) {
        return -1;
      }
      if (rightIsNumber) {
        return 1;
      }
    }
    return right.lineNumber - left.lineNumber;
  });
}
function hasActiveViewControls(viewState) {
  return hasActivePrimaryControls(viewState) || advancedControlCount(viewState) > 0;
}
function hasActivePrimaryControls(viewState) {
  return viewState.key.length > 0 || viewState.searchText.trim().length > 0 || viewState.sortOrder !== DEFAULT_VIEW_STATE.sortOrder;
}
function advancedControlCount(viewState) {
  let count = 0;
  if (viewState.source.length > 0) {
    count += 1;
  }
  if (viewState.status !== "all") {
    count += 1;
  }
  if (viewState.groupBy !== "none") {
    count += 1;
  }
  return count;
}
function groupRowsByDay(rows) {
  const groups = /* @__PURE__ */ new Map();
  rows.forEach((row) => {
    const day = rowDateValue(row);
    const key = day ?? "__no_date__";
    const current = groups.get(key) ?? [];
    current.push(row);
    groups.set(key, current);
  });
  return Array.from(groups.entries()).map(([key, groupedRows]) => ({
    heading: key === "__no_date__" ? "No date" : `[[${key}]]`,
    key,
    rows: groupedRows
  }));
}
function isEditableRecord(metric) {
  return Boolean(
    metric && typeof metric.id === "string" && typeof metric.ts === "string" && typeof metric.key === "string" && typeof metric.value === "number" && Number.isFinite(metric.value) && typeof metric.source === "string"
  );
}
function formatTimelineTime(row) {
  const ts = row.metric?.ts;
  if (typeof ts !== "string") {
    return "--:--";
  }
  const parsed = Date.parse(ts);
  if (Number.isNaN(parsed)) {
    return "--:--";
  }
  return new Intl.DateTimeFormat(void 0, {
    hour: "2-digit",
    minute: "2-digit"
  }).format(parsed);
}
function formatTimelineDate(row) {
  if (typeof row.metric?.date === "string") {
    return row.metric.date;
  }
  const ts = row.metric?.ts;
  if (typeof ts !== "string") {
    return "";
  }
  const parsed = Date.parse(ts);
  if (Number.isNaN(parsed)) {
    return "";
  }
  return new Intl.DateTimeFormat(void 0, {
    month: "short",
    day: "numeric"
  }).format(parsed);
}
async function copyText(label, value) {
  try {
    await navigator.clipboard.writeText(value);
    new import_obsidian5.Notice(`Copied ${label}.`);
  } catch {
    new import_obsidian5.Notice(`Could not copy ${label}.`);
  }
}
function renderIssueList(container, row) {
  if (row.issues.length === 0) {
    return;
  }
  const issuesList = container.createEl("ul", { cls: "metrics-lens-issues" });
  row.issues.forEach((issue) => {
    issuesList.createEl("li", {
      cls: `is-${issue.severity}`,
      text: `${issue.severity === "warning" ? "Warning" : "Error"}: ${issue.message}`
    });
  });
}
function openRecordMenu(event, row, plugin, file, referencePrefix) {
  const menu = new import_obsidian5.Menu();
  let hasItems = false;
  if (typeof row.metric?.id === "string") {
    hasItems = true;
    menu.addItem((item) => {
      item.setTitle("Copy metric reference").setIcon("copy").onClick(() => {
        void copyText("metric reference", toMetricReference(row.metric.id, referencePrefix));
      });
    });
    menu.addItem((item) => {
      item.setTitle("Copy id").setIcon("copy").onClick(() => {
        void copyText("id", row.metric.id);
      });
    });
  }
  if (typeof row.metric?.origin_id === "string") {
    hasItems = true;
    menu.addItem((item) => {
      item.setTitle("Copy origin id").setIcon("copy").onClick(() => {
        void copyText("origin id", row.metric.origin_id);
      });
    });
  }
  if (typeof row.metric?.source === "string") {
    hasItems = true;
    menu.addItem((item) => {
      item.setTitle("Copy source").setIcon("copy").onClick(() => {
        void copyText("source", row.metric.source);
      });
    });
  }
  if (row.rawLine.trim().length > 0) {
    hasItems = true;
    menu.addItem((item) => {
      item.setTitle("Copy raw line").setIcon("copy").onClick(() => {
        void copyText("raw line", row.rawLine);
      });
    });
  }
  if (isEditableRecord(row.metric)) {
    const metric = row.metric;
    if (hasItems) {
      menu.addSeparator();
    }
    menu.addItem((item) => {
      item.setTitle("Edit").setIcon("pencil").onClick(() => {
        plugin.openEditRecordModal(file, metric);
      });
    });
    menu.addItem((item) => {
      item.setTitle("Delete").setIcon("trash").onClick(() => {
        plugin.confirmDeleteRecord(file, metric);
      });
    });
    hasItems = true;
  }
  if (!hasItems) {
    return;
  }
  menu.showAtMouseEvent(event);
}
function renderRecord(container, row, plugin, file, referencePrefix, options) {
  const rowEl = container.createDiv({
    cls: row.status === "valid" ? "metrics-lens-record" : ["metrics-lens-record", `is-${row.status}`]
  });
  rowEl.tabIndex = -1;
  if (typeof row.metric?.id === "string") {
    rowEl.dataset.metricId = row.metric.id;
  }
  if (options.isFirst) {
    rowEl.addClass("is-first");
  }
  if (options.isLast) {
    rowEl.addClass("is-last");
  }
  const timeEl = rowEl.createDiv({ cls: "metrics-lens-record-time" });
  timeEl.createSpan({
    cls: "metrics-lens-record-time-primary",
    text: formatTimelineTime(row)
  });
  const secondaryTime = formatTimelineDate(row);
  if (secondaryTime.length > 0) {
    timeEl.createSpan({
      cls: "metrics-lens-record-time-secondary",
      text: secondaryTime
    });
  }
  const body = rowEl.createDiv({ cls: "metrics-lens-record-body" });
  const marker = body.createSpan({ cls: "metrics-lens-record-marker" });
  const iconId = plugin.settings.showMetricIcons && typeof row.metric?.key === "string" ? metricIconForKey(row.metric.key) : null;
  if (iconId) {
    marker.setAttribute("aria-hidden", "true");
    try {
      (0, import_obsidian5.setIcon)(marker, iconId);
      if (marker.querySelector("svg")) {
        marker.addClass("has-icon");
        body.addClass("has-icon-marker");
      }
    } catch {
      marker.empty();
    }
  }
  const main = body.createDiv({ cls: "metrics-lens-record-main" });
  main.createSpan({
    cls: "metrics-lens-record-key",
    text: row.metric?.key ?? "Invalid row"
  });
  const metricValue = formatMetricValue(row);
  if (metricValue) {
    main.createSpan({
      cls: "metrics-lens-record-value",
      text: metricValue
    });
  }
  if (typeof row.metric?.note === "string" && row.metric.note.length > 0) {
    body.createDiv({
      cls: "metrics-lens-record-note",
      text: row.metric.note
    });
  }
  renderIssueList(body, row);
  if (!row.metric?.key) {
    body.createEl("pre", {
      cls: "metrics-lens-record-raw",
      text: row.rawLine
    });
  }
  const menuButton = rowEl.createEl("button", {
    cls: ["clickable-icon", "metrics-lens-more-button"]
  });
  menuButton.type = "button";
  menuButton.setAttribute("aria-label", `More actions for ${row.metric?.key ?? "record"}`);
  menuButton.setAttribute("data-tooltip-position", "left");
  (0, import_obsidian5.setIcon)(menuButton, "more-horizontal");
  menuButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openRecordMenu(event, row, plugin, file, referencePrefix);
  });
}
var MetricsFileView = class extends import_obsidian5.TextFileView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }
  plugin;
  allowNoFile = true;
  advancedControlsExpanded = false;
  clearTargetedRecordTimeout = null;
  pendingControlFocus = null;
  pendingMetricIdFocus = null;
  viewState = createDefaultViewState();
  getViewType() {
    return METRICS_VIEW_TYPE;
  }
  getDisplayText() {
    if (!this.file) {
      return "Metrics";
    }
    const baseName = logicalMetricsBaseName(this.file.name, this.plugin.settings.supportedExtensions);
    return capitalizeDisplayName(baseName);
  }
  getIcon() {
    return "list";
  }
  async onOpen() {
    this.contentEl.classList.add("metrics-lens-view-root");
    this.addAction("plus", "Add record", () => {
      if (!this.file) {
        new import_obsidian5.Notice("Open a metrics file first.");
        return;
      }
      this.plugin.openCreateRecordModal(this.file);
    });
    this.render();
  }
  async onClose() {
    if (this.clearTargetedRecordTimeout !== null) {
      window.clearTimeout(this.clearTargetedRecordTimeout);
      this.clearTargetedRecordTimeout = null;
    }
  }
  clear() {
    this.data = "";
    this.render();
  }
  getViewData() {
    return this.data ?? "";
  }
  setViewData(data, clear) {
    this.data = data;
    if (clear) {
      this.clear();
      this.data = data;
    }
    this.render();
  }
  refreshView() {
    this.render();
  }
  focusMetricRecord(metricId) {
    this.viewState = createDefaultViewState();
    this.advancedControlsExpanded = false;
    this.pendingMetricIdFocus = metricId;
    this.render();
  }
  render() {
    this.contentEl.empty();
    const container = this.contentEl.createDiv({ cls: "metrics-lens-view" });
    if (!this.file) {
      container.createEl("p", {
        cls: "metrics-lens-empty",
        text: "Choose a `*.metrics.ndjson` file from the file browser."
      });
      return;
    }
    const analysis = analyzeMetricsData(this.data ?? "");
    const availableKeys = collectFilterValues(analysis.rows, "key");
    const availableSources = collectFilterValues(analysis.rows, "source");
    this.normalizeViewState(availableKeys, availableSources);
    const visibleRows = applyMetricsViewState(analysis.rows, this.viewState);
    const hasActiveControls = hasActiveViewControls(this.viewState);
    if (analysis.rows.length > 0 || hasActiveControls) {
      this.renderControls(container, availableKeys, availableSources);
    }
    if (analysis.issueSummary.length > 0) {
      const issuesSection = container.createDiv({ cls: "metrics-lens-section" });
      const issuesList = issuesSection.createEl("ul", { cls: "metrics-lens-validation" });
      analysis.issueSummary.slice(0, 8).forEach((summary) => {
        issuesList.createEl("li", {
          cls: `is-${summary.severity}`,
          text: `${summary.message} (${summary.count})`
        });
      });
    }
    if (analysis.rows.length === 0) {
      container.createEl("p", {
        cls: "metrics-lens-section",
        text: "No records in this file yet."
      });
    } else if (visibleRows.length === 0) {
      const emptyState = container.createDiv({ cls: "metrics-lens-section" });
      emptyState.createEl("p", {
        cls: "metrics-lens-empty",
        text: "No records match the current view."
      });
      if (hasActiveControls) {
        const resetButton = emptyState.createEl("button", { text: "Reset view" });
        resetButton.type = "button";
        resetButton.setAttribute("aria-label", "Reset current filters and sorting");
        resetButton.addEventListener("click", () => {
          this.viewState = createDefaultViewState();
          this.render();
        });
      }
    } else {
      const recordsSection = container.createDiv({ cls: "metrics-lens-section" });
      if (this.viewState.groupBy === "day") {
        groupRowsByDay(visibleRows).forEach((group) => {
          const groupSection = recordsSection.createDiv({ cls: "metrics-lens-group" });
          groupSection.createEl("h2", {
            cls: "metrics-lens-group-heading",
            text: group.heading
          });
          const recordsList = groupSection.createDiv({ cls: "metrics-lens-records" });
          group.rows.forEach((row, index) => {
            renderRecord(
              recordsList,
              row,
              this.plugin,
              this.file,
              this.plugin.settings.recordReferencePrefix,
              {
                isFirst: index === 0,
                isLast: index === group.rows.length - 1
              }
            );
          });
        });
      } else {
        const recordsList = recordsSection.createDiv({ cls: "metrics-lens-records" });
        visibleRows.forEach((row, index) => {
          renderRecord(
            recordsList,
            row,
            this.plugin,
            this.file,
            this.plugin.settings.recordReferencePrefix,
            {
              isFirst: index === 0,
              isLast: index === visibleRows.length - 1
            }
          );
        });
      }
    }
    const summaryParts = visibleRows.length === analysis.totalRows ? [`${analysis.totalRows} rows`] : [`${visibleRows.length} of ${analysis.totalRows} rows`];
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
    if (this.viewState.groupBy === "day") {
      summaryParts.push("grouped by day");
    }
    const footer = container.createDiv({ cls: "metrics-lens-footer" });
    footer.createSpan({
      cls: "metrics-lens-file-meta",
      text: `${this.file.path} \xB7 ${summaryParts.join(" \xB7 ")}`
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
  renderControls(container, availableKeys, availableSources) {
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
      { label: "This month", value: "this-month" },
      { label: "Custom range", value: "custom" }
    ].forEach((option) => {
      timeRangeSelect.createEl("option", {
        text: option.label,
        value: option.value
      });
    });
    timeRangeSelect.value = this.viewState.timeRange;
    timeRangeSelect.addEventListener("change", () => {
      this.pendingControlFocus = { name: "timeRange" };
      this.viewState.timeRange = timeRangeSelect.value;
      this.render();
    });
    if (this.viewState.timeRange === "custom") {
      const fromDateInput = primaryControls.createEl("input", {
        cls: "metrics-lens-control",
        type: "date"
      });
      fromDateInput.dataset.metricsControl = "fromDate";
      fromDateInput.value = this.viewState.fromDate;
      fromDateInput.setAttribute("aria-label", "Filter from date");
      fromDateInput.addEventListener("change", () => {
        this.pendingControlFocus = this.controlFocusState("fromDate", fromDateInput);
        this.viewState.fromDate = fromDateInput.value;
        this.render();
      });
      const toDateInput = primaryControls.createEl("input", {
        cls: "metrics-lens-control",
        type: "date"
      });
      toDateInput.dataset.metricsControl = "toDate";
      toDateInput.value = this.viewState.toDate;
      toDateInput.setAttribute("aria-label", "Filter to date");
      toDateInput.addEventListener("change", () => {
        this.pendingControlFocus = this.controlFocusState("toDate", toDateInput);
        this.viewState.toDate = toDateInput.value;
        this.render();
      });
    }
    const keySelect = primaryControls.createEl("select", { cls: "metrics-lens-control" });
    keySelect.dataset.metricsControl = "key";
    keySelect.setAttribute("aria-label", "Filter by metric");
    keySelect.createEl("option", {
      text: "All metrics",
      value: ""
    });
    availableKeys.forEach((key) => {
      keySelect.createEl("option", {
        text: key,
        value: key
      });
    });
    keySelect.value = this.viewState.key;
    keySelect.addEventListener("change", () => {
      this.pendingControlFocus = { name: "key" };
      this.viewState.key = keySelect.value;
      this.render();
    });
    const searchInput = primaryControls.createEl("input", {
      cls: "metrics-lens-control metrics-lens-search",
      type: "search"
    });
    searchInput.value = this.viewState.searchText;
    searchInput.placeholder = "Search";
    searchInput.setAttribute("aria-label", "Search metrics in the current file");
    searchInput.dataset.metricsControl = "search";
    searchInput.addEventListener("input", () => {
      this.pendingControlFocus = this.controlFocusState("search", searchInput);
      this.viewState.searchText = searchInput.value;
      this.render();
    });
    const sortButton = primaryControls.createEl("button", {
      cls: ["clickable-icon", "metrics-lens-icon-button"]
    });
    sortButton.type = "button";
    sortButton.dataset.metricsControl = "sort";
    sortButton.setAttribute("aria-label", `Sort metrics: ${this.sortOrderLabel(this.viewState.sortOrder)}`);
    sortButton.setAttribute("data-tooltip-position", "top");
    (0, import_obsidian5.setIcon)(sortButton, "arrow-up-down");
    sortButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const menu = new import_obsidian5.Menu();
      [
        { label: "Newest first", value: "newest" },
        { label: "Oldest first", value: "oldest" },
        { label: "Value high-low", value: "value-desc" },
        { label: "Value low-high", value: "value-asc" }
      ].forEach((option) => {
        menu.addItem((item) => {
          item.setTitle(option.label).setChecked(this.viewState.sortOrder === option.value).onClick(() => {
            this.pendingControlFocus = { name: "sort" };
            this.viewState.sortOrder = option.value;
            this.render();
          });
        });
      });
      menu.showAtMouseEvent(event);
    });
    const moreButton = primaryControls.createEl("button", {
      cls: ["clickable-icon", "metrics-lens-icon-button", "metrics-lens-more-controls-button"]
    });
    moreButton.type = "button";
    moreButton.dataset.metricsControl = "more";
    moreButton.setAttribute(
      "aria-label",
      showAdvancedControls ? "Hide more filters" : activeAdvancedControls > 0 ? `Show more filters (${activeAdvancedControls} active)` : "Show more filters"
    );
    moreButton.setAttribute("data-tooltip-position", "top");
    (0, import_obsidian5.setIcon)(moreButton, "sliders-horizontal");
    moreButton.toggleClass("is-active", showAdvancedControls || activeAdvancedControls > 0);
    moreButton.addEventListener("click", () => {
      this.pendingControlFocus = { name: "more" };
      this.advancedControlsExpanded = !this.advancedControlsExpanded;
      this.render();
    });
    if (showAdvancedControls) {
      const advancedControls = controls.createDiv({ cls: "metrics-lens-advanced-controls" });
      const sourceSelect = advancedControls.createEl("select", { cls: "metrics-lens-control" });
      sourceSelect.dataset.metricsControl = "source";
      sourceSelect.setAttribute("aria-label", "Filter by source");
      sourceSelect.createEl("option", {
        text: "All sources",
        value: ""
      });
      availableSources.forEach((source) => {
        sourceSelect.createEl("option", {
          text: source,
          value: source
        });
      });
      sourceSelect.value = this.viewState.source;
      sourceSelect.addEventListener("change", () => {
        this.pendingControlFocus = { name: "source" };
        this.viewState.source = sourceSelect.value;
        this.render();
      });
      const statusSelect = advancedControls.createEl("select", { cls: "metrics-lens-control" });
      statusSelect.dataset.metricsControl = "status";
      statusSelect.setAttribute("aria-label", "Filter by validation status");
      [
        { label: "All statuses", value: "all" },
        { label: "Valid", value: "valid" },
        { label: "Warnings", value: "warning" },
        { label: "Errors", value: "error" }
      ].forEach((option) => {
        statusSelect.createEl("option", {
          text: option.label,
          value: option.value
        });
      });
      statusSelect.value = this.viewState.status;
      statusSelect.addEventListener("change", () => {
        this.pendingControlFocus = { name: "status" };
        this.viewState.status = statusSelect.value;
        this.render();
      });
      const groupBySelect = advancedControls.createEl("select", { cls: "metrics-lens-control" });
      groupBySelect.dataset.metricsControl = "groupBy";
      groupBySelect.setAttribute("aria-label", "Group metrics");
      [
        { label: "No grouping", value: "none" },
        { label: "Group by day", value: "day" }
      ].forEach((option) => {
        groupBySelect.createEl("option", {
          text: option.label,
          value: option.value
        });
      });
      groupBySelect.value = this.viewState.groupBy;
      groupBySelect.addEventListener("change", () => {
        this.pendingControlFocus = { name: "groupBy" };
        this.viewState.groupBy = groupBySelect.value;
        this.render();
      });
    }
    if (hasActiveViewControls(this.viewState)) {
      const resetButton = primaryControls.createEl("button", {
        cls: "metrics-lens-reset-view-button",
        text: "Reset"
      });
      resetButton.type = "button";
      resetButton.setAttribute("aria-label", "Reset current filters and sorting");
      resetButton.addEventListener("click", () => {
        this.viewState = createDefaultViewState();
        this.advancedControlsExpanded = false;
        this.render();
      });
    }
  }
  normalizeViewState(availableKeys, availableSources) {
    if (this.viewState.key && !availableKeys.includes(this.viewState.key)) {
      this.viewState.key = "";
    }
    if (this.viewState.source && !availableSources.includes(this.viewState.source)) {
      this.viewState.source = "";
    }
    if (this.viewState.timeRange === "custom" && this.viewState.fromDate && this.viewState.toDate && this.viewState.fromDate > this.viewState.toDate) {
      const nextFromDate = this.viewState.toDate;
      this.viewState.toDate = this.viewState.fromDate;
      this.viewState.fromDate = nextFromDate;
    }
  }
  sortOrderLabel(sortOrder) {
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
  revealPendingMetricRecord() {
    if (!this.pendingMetricIdFocus) {
      return;
    }
    const targetId = this.pendingMetricIdFocus;
    const targetEl = this.contentEl.querySelector(`[data-metric-id="${targetId}"]`);
    if (!targetEl) {
      return;
    }
    this.pendingMetricIdFocus = null;
    targetEl.addClass("is-targeted");
    targetEl.scrollIntoView({
      block: "center",
      behavior: "smooth"
    });
    targetEl.focus({ preventScroll: true });
    if (this.clearTargetedRecordTimeout !== null) {
      window.clearTimeout(this.clearTargetedRecordTimeout);
    }
    this.clearTargetedRecordTimeout = window.setTimeout(() => {
      targetEl.removeClass("is-targeted");
      this.clearTargetedRecordTimeout = null;
    }, 1800);
  }
  restorePendingControlFocus() {
    if (!this.pendingControlFocus) {
      return;
    }
    const focusState = this.pendingControlFocus;
    this.pendingControlFocus = null;
    const targetEl = this.contentEl.querySelector(
      `[data-metrics-control="${focusState.name}"]`
    );
    if (!targetEl) {
      return;
    }
    targetEl.focus({ preventScroll: true });
    if (targetEl instanceof HTMLInputElement && typeof focusState.selectionStart === "number" && typeof focusState.selectionEnd === "number") {
      targetEl.setSelectionRange(focusState.selectionStart, focusState.selectionEnd);
    }
  }
  controlFocusState(name, element) {
    if (element instanceof HTMLInputElement) {
      return {
        name,
        selectionEnd: element.selectionEnd ?? void 0,
        selectionStart: element.selectionStart ?? void 0
      };
    }
    return { name };
  }
};

// src/main.ts
var MetricsPlugin = class extends import_obsidian6.Plugin {
  settings = DEFAULT_SETTINGS;
  suppressedAutoOpenPaths = /* @__PURE__ */ new Set();
  fileExplorerObserver = null;
  fileExplorerSyncQueued = false;
  async onload() {
    await this.loadSettings();
    this.registerView(
      METRICS_VIEW_TYPE,
      (leaf) => new MetricsFileView(leaf, this)
    );
    this.registerExtensions(this.metricsViewExtensions(), METRICS_VIEW_TYPE);
    this.registerExtensions(this.fileBrowserFallbackExtensions(), "markdown");
    this.addCommand({
      id: "open-current-file",
      name: "Open current metrics file",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || !this.isMetricsFile(file)) {
          return false;
        }
        if (!checking) {
          void this.openMetricsFile(file, this.app.workspace.activeLeaf);
        }
        return true;
      }
    });
    this.addCommand({
      id: "assign-missing-ids-current-file",
      name: "Assign missing ids in current metrics file",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || !this.isMetricsFile(file)) {
          return false;
        }
        if (!checking) {
          void this.assignMissingIds(file);
        }
        return true;
      }
    });
    this.addCommand({
      id: "add-record-current-file",
      name: "Add record to current metrics file",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || !this.isMetricsFile(file)) {
          return false;
        }
        if (!checking) {
          this.openCreateRecordModal(file);
        }
        return true;
      }
    });
    this.addCommand({
      id: "open-view",
      name: "Open metrics view",
      callback: async () => {
        await this.activateView();
      }
    });
    this.addCommand({
      id: "open-reference",
      name: "Open metric reference",
      callback: () => {
        this.openMetricReferenceModal();
      }
    });
    this.addCommand({
      id: "open-reference-under-cursor",
      name: "Open metric reference under cursor",
      editorCheckCallback: (checking, editor) => {
        const metricId = this.metricIdFromEditor(editor);
        if (!metricId) {
          return false;
        }
        if (!checking) {
          void this.openMetricReference(metricId);
        }
        return true;
      }
    });
    this.addSettingTab(new MetricsSettingTab(this.app, this));
    this.registerEvent(
      this.app.workspace.on("file-open", (file) => {
        this.queueAutoOpen(file);
      })
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        const file = this.fileForLeaf(leaf);
        this.queueAutoOpen(file, leaf);
      })
    );
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        const file = this.app.workspace.getActiveFile();
        this.queueAutoOpen(file, this.app.workspace.activeLeaf);
      })
    );
    this.registerEvent(this.app.vault.on("modify", () => this.refreshOpenMetricsViews()));
    this.registerEvent(this.app.vault.on("create", () => this.refreshOpenMetricsViews()));
    this.registerEvent(this.app.vault.on("delete", () => this.refreshOpenMetricsViews()));
    this.registerEvent(this.app.vault.on("rename", () => this.refreshOpenMetricsViews()));
    this.app.workspace.onLayoutReady(() => {
      const activeFile = this.app.workspace.getActiveFile();
      this.queueAutoOpen(activeFile, this.app.workspace.activeLeaf);
      this.installFileExplorerObserver();
      this.queueFileExplorerLabelSync();
    });
  }
  async onunload() {
    this.fileExplorerObserver?.disconnect();
    this.fileExplorerObserver = null;
    this.restoreFileExplorerLabels();
    for (const leaf of this.app.workspace.getLeavesOfType(METRICS_VIEW_TYPE)) {
      const view = leaf.view;
      if (!(view instanceof MetricsFileView) || !view.file) {
        continue;
      }
      this.suppressAutoOpenForPath(view.file.path);
      await leaf.setViewState({
        type: "markdown",
        state: { file: view.file.path },
        active: false
      });
    }
  }
  async loadSettings() {
    const loaded = await this.loadData();
    this.settings = normalizeMetricsSettings(loaded ?? DEFAULT_SETTINGS);
  }
  async saveSettings() {
    this.settings = normalizeMetricsSettings(this.settings);
    await this.saveData(this.settings);
  }
  async activateView() {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile && this.isMetricsFile(activeFile)) {
      await this.openMetricsFile(activeFile, this.app.workspace.activeLeaf);
      return;
    }
    const existingLeaf = this.app.workspace.getLeavesOfType(METRICS_VIEW_TYPE)[0];
    const leaf = existingLeaf ?? this.app.workspace.getRightLeaf(false);
    if (!leaf) {
      return;
    }
    await leaf.setViewState({
      type: METRICS_VIEW_TYPE,
      active: true
    });
    this.app.workspace.revealLeaf(leaf);
  }
  refreshOpenMetricsViews() {
    this.app.workspace.getLeavesOfType(METRICS_VIEW_TYPE).forEach((leaf) => {
      const view = leaf.view;
      if (view instanceof MetricsFileView) {
        view.refreshView();
      }
    });
    this.queueFileExplorerLabelSync();
  }
  async assignMissingIds(file) {
    let assigned = 0;
    let skipped = 0;
    await this.app.vault.process(file, (data) => {
      const result = assignMissingIdsToMetricsData(data);
      assigned = result.assigned;
      skipped = result.skipped;
      return result.content;
    });
    if (assigned === 0) {
      new import_obsidian6.Notice(
        skipped > 0 ? "No missing ids were assigned. Some rows were skipped because they are invalid." : "No missing ids were found in this metrics file."
      );
      return;
    }
    new import_obsidian6.Notice(
      skipped > 0 ? `Assigned ${assigned} ids. Skipped ${skipped} invalid rows.` : `Assigned ${assigned} ids.`
    );
    this.refreshOpenMetricsViews();
  }
  openCreateRecordModal(file) {
    const modal = new MetricRecordModal(
      this.app,
      {
        submitLabel: "Add record",
        title: `Add record to ${logicalMetricsBaseName(file.name, this.settings.supportedExtensions)}`
      },
      (recordInput) => {
        void this.createRecord(file, recordInput);
      }
    );
    modal.open();
  }
  openEditRecordModal(file, record) {
    const modal = new MetricRecordModal(
      this.app,
      {
        initialRecord: record,
        submitLabel: "Save record",
        title: `Edit ${record.key}`
      },
      (recordInput) => {
        void this.updateRecord(file, record.id, recordInput);
      }
    );
    modal.open();
  }
  async createRecord(file, recordInput) {
    try {
      let createdId = "";
      await this.app.vault.process(file, (data) => {
        const result = appendMetricRecordToMetricsData(data, recordInput);
        createdId = result.record.id;
        return result.content;
      });
      new import_obsidian6.Notice(`Added metrics record ${createdId}.`);
      this.refreshOpenMetricsViews();
    } catch (error) {
      this.handleMutationError(error);
    }
  }
  async updateRecord(file, recordId, recordInput) {
    try {
      await this.app.vault.process(file, (data) => {
        const result = updateMetricRecordInMetricsData(data, recordId, recordInput);
        return result.content;
      });
      new import_obsidian6.Notice(`Updated metrics record ${recordId}.`);
      this.refreshOpenMetricsViews();
    } catch (error) {
      this.handleMutationError(error);
    }
  }
  async deleteRecord(file, recordId) {
    try {
      await this.app.vault.process(file, (data) => {
        const result = deleteMetricRecordFromMetricsData(data, recordId);
        return result.content;
      });
      new import_obsidian6.Notice(`Deleted metrics record ${recordId}.`);
      this.refreshOpenMetricsViews();
    } catch (error) {
      this.handleMutationError(error);
    }
  }
  confirmDeleteRecord(file, record) {
    if (!window.confirm(`Delete ${record.key} (${record.id}) from ${file.name}?`)) {
      return;
    }
    void this.deleteRecord(file, record.id);
  }
  async openMetricsFile(file, leaf) {
    if (!leaf) {
      new import_obsidian6.Notice("No active pane is available.");
      return;
    }
    await leaf.setViewState({
      type: METRICS_VIEW_TYPE,
      state: { file: file.path },
      active: true
    });
  }
  openMetricReferenceModal(initialValue) {
    const selection = initialValue ?? this.selectedMetricReferenceText();
    const modal = new MetricReferenceModal(this.app, { initialValue: selection }, (value) => {
      void this.openMetricReference(value);
    });
    modal.open();
  }
  async openMetricReference(value) {
    const metricId = extractMetricIdFromText(value, this.settings.recordReferencePrefix);
    if (!metricId) {
      new import_obsidian6.Notice("Metric reference must look like `metric:<id>` or a raw ULID.");
      return;
    }
    const resolved = await this.resolveMetricReference(metricId);
    if (!resolved) {
      return;
    }
    const targetLeaf = this.metricReferenceLeaf(resolved.file);
    await this.openMetricsFile(resolved.file, targetLeaf);
    const view = targetLeaf?.view;
    if (view instanceof MetricsFileView) {
      view.focusMetricRecord(metricId);
    }
    if (targetLeaf) {
      this.app.workspace.revealLeaf(targetLeaf);
    }
  }
  handleMutationError(error) {
    if (error instanceof MetricsMutationError) {
      new import_obsidian6.Notice(error.message);
      return;
    }
    if (error instanceof Error) {
      new import_obsidian6.Notice(error.message);
      return;
    }
    new import_obsidian6.Notice("Metrics mutation failed.");
  }
  metricIdFromEditor(editor) {
    const selection = editor.getSelection();
    if (selection.trim().length > 0) {
      return extractMetricIdFromText(selection, this.settings.recordReferencePrefix);
    }
    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    return findMetricIdAtOffset(line, cursor.ch, this.settings.recordReferencePrefix);
  }
  selectedMetricReferenceText() {
    const markdownView = this.app.workspace.getActiveViewOfType(import_obsidian6.MarkdownView);
    if (!markdownView) {
      return "";
    }
    return markdownView.editor.getSelection().trim();
  }
  async resolveMetricReference(metricId) {
    const metricsFiles = this.metricsFilesInScope();
    if (metricsFiles.length === 0) {
      new import_obsidian6.Notice(`No metrics files were found under ${this.settings.metricsRoot}.`);
      return null;
    }
    const matches = [];
    for (const file of metricsFiles) {
      const data = await this.app.vault.cachedRead(file);
      const analysis = analyzeMetricsData(data);
      analysis.rows.forEach((row) => {
        if (row.metric?.id === metricId) {
          matches.push({ file, row });
        }
      });
    }
    if (matches.length === 0) {
      new import_obsidian6.Notice(`Metric reference ${metricId} was not found.`);
      return null;
    }
    if (matches.length > 1) {
      new import_obsidian6.Notice(
        `Metric reference ${metricId} matched ${matches.length} records. Resolve duplicate ids before using references.`
      );
      return null;
    }
    return matches[0] ?? null;
  }
  suppressAutoOpenForPath(path) {
    this.suppressedAutoOpenPaths.add(path);
  }
  metricsViewExtensions() {
    return this.settings.supportedExtensions.map((extension) => extension.replace(/^\./, "")).filter((extension) => extension.length > 0);
  }
  fileBrowserFallbackExtensions() {
    return Array.from(
      new Set(
        this.metricsViewExtensions().map((extension) => extension.split(".").pop() ?? "").filter((extension) => extension.length > 0)
      )
    );
  }
  isMetricsFile(file) {
    return Boolean(
      file && this.settings.supportedExtensions.some((extension) => file.path.endsWith(extension))
    );
  }
  isMetricsPath(path) {
    return Boolean(
      path && this.settings.supportedExtensions.some((extension) => path.endsWith(extension))
    );
  }
  metricsFilesInScope() {
    const root = this.app.vault.getAbstractFileByPath(this.settings.metricsRoot);
    if (!(root instanceof import_obsidian6.TFolder)) {
      return [];
    }
    return this.collectMetricsFiles(root);
  }
  collectMetricsFiles(folder) {
    const files = [];
    folder.children.forEach((child) => {
      if (child instanceof import_obsidian6.TFile) {
        if (this.isMetricsFile(child)) {
          files.push(child);
        }
        return;
      }
      if (child instanceof import_obsidian6.TFolder) {
        files.push(...this.collectMetricsFiles(child));
      }
    });
    return files;
  }
  metricReferenceLeaf(file) {
    const existingFileLeaf = this.findLeafShowingFile(file);
    if (existingFileLeaf) {
      return existingFileLeaf;
    }
    const existingMetricsLeaf = this.app.workspace.getLeavesOfType(METRICS_VIEW_TYPE)[0];
    if (existingMetricsLeaf) {
      return existingMetricsLeaf;
    }
    return this.app.workspace.getRightLeaf(false) ?? this.app.workspace.activeLeaf;
  }
  async maybeAutoOpenFile(file, leaf) {
    if (!file || !this.isMetricsFile(file)) {
      return;
    }
    if (this.suppressedAutoOpenPaths.has(file.path)) {
      this.suppressedAutoOpenPaths.delete(file.path);
      return;
    }
    const targetLeaf = leaf ?? this.findLeafShowingFile(file) ?? this.app.workspace.activeLeaf;
    if (!targetLeaf || targetLeaf.view.getViewType() === METRICS_VIEW_TYPE) {
      return;
    }
    const visibleFile = this.fileForLeaf(targetLeaf);
    if (!visibleFile || visibleFile.path !== file.path) {
      return;
    }
    await this.openMetricsFile(file, targetLeaf);
  }
  queueAutoOpen(file, leaf) {
    window.setTimeout(() => {
      void this.maybeAutoOpenFile(file, leaf ?? null);
    }, 0);
  }
  findLeafShowingFile(file) {
    let matchedLeaf = null;
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (matchedLeaf) {
        return;
      }
      const visibleFile = this.fileForLeaf(leaf);
      if (visibleFile?.path === file.path) {
        matchedLeaf = leaf;
      }
    });
    return matchedLeaf;
  }
  fileForLeaf(leaf) {
    if (!leaf) {
      return null;
    }
    const view = leaf.view;
    if ("file" in view) {
      return view.file ?? null;
    }
    return null;
  }
  installFileExplorerObserver() {
    if (this.fileExplorerObserver) {
      this.fileExplorerObserver.disconnect();
    }
    this.fileExplorerObserver = new MutationObserver(() => {
      this.queueFileExplorerLabelSync();
    });
    this.fileExplorerObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  queueFileExplorerLabelSync() {
    if (this.fileExplorerSyncQueued) {
      return;
    }
    this.fileExplorerSyncQueued = true;
    window.requestAnimationFrame(() => {
      this.fileExplorerSyncQueued = false;
      this.syncFileExplorerLabels();
    });
  }
  syncFileExplorerLabels() {
    const titleEls = document.querySelectorAll(".nav-file-title[data-path]");
    titleEls.forEach((titleEl) => {
      const path = titleEl.getAttribute("data-path");
      const contentEl = titleEl.querySelector(".nav-file-title-content") ?? titleEl.querySelector(".tree-item-inner");
      if (!path || !contentEl || titleEl.querySelector("input")) {
        return;
      }
      if (!this.isMetricsPath(path)) {
        if (contentEl.dataset.metricsOriginalLabel !== void 0) {
          contentEl.textContent = contentEl.dataset.metricsOriginalLabel;
          delete contentEl.dataset.metricsOriginalLabel;
        }
        return;
      }
      if (contentEl.dataset.metricsOriginalLabel === void 0) {
        contentEl.dataset.metricsOriginalLabel = contentEl.textContent ?? "";
      }
      const fileName = path.split("/").pop() ?? path;
      contentEl.textContent = logicalMetricsBaseName(fileName, this.settings.supportedExtensions);
    });
  }
  restoreFileExplorerLabels() {
    const titleEls = document.querySelectorAll(".nav-file-title[data-path]");
    titleEls.forEach((titleEl) => {
      const contentEl = titleEl.querySelector(".nav-file-title-content") ?? titleEl.querySelector(".tree-item-inner");
      if (!contentEl || contentEl.dataset.metricsOriginalLabel === void 0) {
        return;
      }
      contentEl.textContent = contentEl.dataset.metricsOriginalLabel;
      delete contentEl.dataset.metricsOriginalLabel;
    });
  }
};
