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
var import_obsidian4 = require("obsidian");

// src/metric-record-modal.ts
var import_obsidian = require("obsidian");
function currentIsoTimestamp() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function trimOrUndefined(value) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : void 0;
}
var MetricRecordModal = class extends import_obsidian.Modal {
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
    new import_obsidian.Setting(contentEl).setName("Timestamp").setDesc("ISO-8601 timestamp with timezone.").addText((text) => {
      text.setPlaceholder("2026-04-14T09:30:00+04:00");
      text.setValue(ts);
      text.onChange((nextValue) => {
        ts = nextValue;
      });
    });
    new import_obsidian.Setting(contentEl).setName("Date").setDesc("Optional local date in YYYY-MM-DD format.").addText((text) => {
      text.setPlaceholder("2026-04-14");
      text.setValue(date);
      text.onChange((nextValue) => {
        date = nextValue;
      });
    });
    new import_obsidian.Setting(contentEl).setName("Key").setDesc("Canonical metric key.").addText((text) => {
      text.setPlaceholder("body.weight");
      text.setValue(key);
      text.onChange((nextValue) => {
        key = nextValue;
      });
    });
    new import_obsidian.Setting(contentEl).setName("Value").setDesc("Numeric metric value.").addText((text) => {
      text.inputEl.type = "number";
      text.inputEl.step = "any";
      text.setPlaceholder("104.4");
      text.setValue(value);
      text.onChange((nextValue) => {
        value = nextValue;
      });
    });
    new import_obsidian.Setting(contentEl).setName("Unit").setDesc("Optional display unit.").addText((text) => {
      text.setPlaceholder("kg");
      text.setValue(unit);
      text.onChange((nextValue) => {
        unit = nextValue;
      });
    });
    new import_obsidian.Setting(contentEl).setName("Source").setDesc("Origin system for this record.").addText((text) => {
      text.setPlaceholder("manual");
      text.setValue(source);
      text.onChange((nextValue) => {
        source = nextValue;
      });
    });
    new import_obsidian.Setting(contentEl).setName("Origin id").setDesc("Optional external provenance id.").addText((text) => {
      text.setPlaceholder("withings:2026-04-14:body.weight");
      text.setValue(originId);
      text.onChange((nextValue) => {
        originId = nextValue;
      });
    });
    const noteSetting = new import_obsidian.Setting(contentEl).setName("Note").setDesc("Optional human-readable note.");
    const noteTextarea = noteSetting.controlEl.createEl("textarea");
    noteTextarea.rows = 3;
    noteTextarea.value = note;
    noteTextarea.addEventListener("input", () => {
      note = noteTextarea.value;
    });
    const tagsSetting = new import_obsidian.Setting(contentEl).setName("Tags").setDesc("Optional comma-separated tags.");
    const tagsInput = tagsSetting.controlEl.createEl("input", { type: "text" });
    tagsInput.value = tags;
    tagsInput.placeholder = "food, lunch";
    tagsInput.addEventListener("input", () => {
      tags = tagsInput.value;
    });
    const contextSetting = new import_obsidian.Setting(contentEl).setName("Context JSON").setDesc("Optional JSON object stored as structured context.");
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
        new import_obsidian.Notice("Value must be a finite number.");
        return;
      }
      if (ts.trim().length === 0 || key.trim().length === 0 || source.trim().length === 0) {
        new import_obsidian.Notice("Timestamp, key, and source are required.");
        return;
      }
      let parsedContext;
      const normalizedContext = trimOrUndefined(context);
      if (normalizedContext) {
        let contextValue;
        try {
          contextValue = JSON.parse(normalizedContext);
        } catch {
          new import_obsidian.Notice("Context JSON must be valid JSON.");
          return;
        }
        if (typeof contextValue === "object" && contextValue !== null && !Array.isArray(contextValue)) {
          parsedContext = contextValue;
        } else {
          new import_obsidian.Notice("Context JSON must be a JSON object.");
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
function isObjectRecord(value) {
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
    return isObjectRecord(parsedValue) ? parsedValue : null;
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
var import_obsidian2 = require("obsidian");
var DEFAULT_SETTINGS = {
  metricsRoot: "Metrics",
  supportedExtensions: [".metrics.ndjson"],
  defaultWriteFile: "Metrics/All.metrics.ndjson",
  recordReferencePrefix: "metric:"
};
function normalizeMetricsSettings(settings) {
  const supportedExtensions = settings.supportedExtensions?.length ? settings.supportedExtensions : DEFAULT_SETTINGS.supportedExtensions;
  return {
    metricsRoot: (0, import_obsidian2.normalizePath)(settings.metricsRoot ?? DEFAULT_SETTINGS.metricsRoot),
    supportedExtensions: Array.from(
      new Set(
        supportedExtensions.map((value) => value.trim()).filter((value) => value.length > 0)
      )
    ),
    defaultWriteFile: (0, import_obsidian2.normalizePath)(settings.defaultWriteFile ?? DEFAULT_SETTINGS.defaultWriteFile),
    recordReferencePrefix: settings.recordReferencePrefix?.trim() || DEFAULT_SETTINGS.recordReferencePrefix
  };
}
function formatExtensions(extensions) {
  return extensions.join(", ");
}
function parseExtensions(value) {
  return value.split(",").map((item) => item.trim()).filter((item) => item.length > 0);
}
var MetricsSettingTab = class extends import_obsidian2.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  plugin;
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian2.Setting(containerEl).setName("Storage").setHeading();
    new import_obsidian2.Setting(containerEl).setName("Metrics root folder").setDesc("Folder scanned for canonical metrics files.").addText((text) => {
      text.setPlaceholder(DEFAULT_SETTINGS.metricsRoot);
      text.setValue(this.plugin.settings.metricsRoot);
      text.onChange(async (value) => {
        this.plugin.settings.metricsRoot = (0, import_obsidian2.normalizePath)(value || DEFAULT_SETTINGS.metricsRoot);
        await this.plugin.saveSettings();
        this.plugin.refreshOpenMetricsViews();
      });
    });
    new import_obsidian2.Setting(containerEl).setName("Supported extensions").setDesc("Comma-separated list of file suffixes treated as metrics files.").addText((text) => {
      text.setPlaceholder(formatExtensions(DEFAULT_SETTINGS.supportedExtensions));
      text.setValue(formatExtensions(this.plugin.settings.supportedExtensions));
      text.onChange(async (value) => {
        this.plugin.settings.supportedExtensions = parseExtensions(value);
        await this.plugin.saveSettings();
        this.plugin.refreshOpenMetricsViews();
      });
    });
    new import_obsidian2.Setting(containerEl).setName("Default write file").setDesc("Default target file used by future create and append actions.").addText((text) => {
      text.setPlaceholder(DEFAULT_SETTINGS.defaultWriteFile);
      text.setValue(this.plugin.settings.defaultWriteFile);
      text.onChange(async (value) => {
        this.plugin.settings.defaultWriteFile = (0, import_obsidian2.normalizePath)(
          value || DEFAULT_SETTINGS.defaultWriteFile
        );
        await this.plugin.saveSettings();
        this.plugin.refreshOpenMetricsViews();
      });
    });
    new import_obsidian2.Setting(containerEl).setName("Record reference prefix").setDesc("Plain-text prefix used for stable metric references in Markdown.").addText((text) => {
      text.setPlaceholder(DEFAULT_SETTINGS.recordReferencePrefix);
      text.setValue(this.plugin.settings.recordReferencePrefix);
      text.onChange(async (value) => {
        this.plugin.settings.recordReferencePrefix = value.trim() || DEFAULT_SETTINGS.recordReferencePrefix;
        await this.plugin.saveSettings();
        this.plugin.refreshOpenMetricsViews();
      });
    });
  }
};

// src/view.ts
var import_obsidian3 = require("obsidian");

// src/contract.ts
var METRIC_REFERENCE_PREFIX = "metric:";
function toMetricReference(id, prefix = METRIC_REFERENCE_PREFIX) {
  return `${prefix}${id}`;
}

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
function isObjectRecord2(value) {
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
    if (!isObjectRecord2(context)) {
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
    if (!isObjectRecord2(parsedValue)) {
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
    rows,
    totalRows: rows.length,
    validRows,
    warningRows
  };
}

// src/view.ts
var METRICS_VIEW_TYPE = "metrics-file-view";
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
function createStatusBadge(container, text, status) {
  container.createSpan({
    cls: ["metrics-lens-badge", `is-${status}`],
    text
  });
}
function formatMetricValue(row) {
  const value = row.metric?.value;
  const unit = row.metric?.unit;
  if (typeof value !== "number") {
    return "Unknown value";
  }
  return typeof unit === "string" ? `${value} ${unit}` : `${value}`;
}
function renderIssueList(container, row) {
  if (row.issues.length === 0) {
    return;
  }
  const issuesList = container.createEl("ul", { cls: "metrics-lens-issues" });
  row.issues.forEach((issue) => {
    const item = issuesList.createEl("li");
    createStatusBadge(item, issue.severity, issue.severity);
    item.createSpan({ text: issue.message });
  });
}
function renderRecord(container, row, plugin, file, referencePrefix) {
  const rowEl = container.createDiv({ cls: ["metrics-lens-record", `is-${row.status}`] });
  const header = rowEl.createDiv({ cls: "metrics-lens-record-header" });
  header.createSpan({ cls: "metrics-lens-record-line", text: `Line ${row.lineNumber}` });
  createStatusBadge(header, row.status, row.status);
  const title = row.metric?.key ?? "Invalid metrics row";
  rowEl.createEl("h3", { cls: "metrics-lens-record-title", text: title });
  const facts = rowEl.createDiv({ cls: "metrics-lens-record-facts" });
  facts.createSpan({ text: row.metric?.date ?? row.metric?.ts ?? "Unknown timestamp" });
  facts.createSpan({ text: formatMetricValue(row) });
  facts.createSpan({ text: row.metric?.source ?? "Unknown source" });
  const references = rowEl.createDiv({ cls: "metrics-lens-record-references" });
  if (typeof row.metric?.id === "string") {
    references.createSpan({
      text: toMetricReference(row.metric.id, referencePrefix)
    });
  } else {
    references.createSpan({ text: "No metric:id reference yet" });
  }
  if (typeof row.metric?.origin_id === "string") {
    references.createSpan({ text: `origin_id: ${row.metric.origin_id}` });
  }
  if (typeof row.metric?.note === "string" && row.metric.note.length > 0) {
    rowEl.createDiv({ cls: "metrics-lens-record-note", text: row.metric.note });
  }
  if (row.metric?.id && row.metric.ts && row.metric.key && typeof row.metric.value === "number" && row.metric.source) {
    const actions = rowEl.createDiv({ cls: "metrics-lens-actions" });
    const editButton = actions.createEl("button", { text: "Edit" });
    editButton.setAttribute("aria-label", `Edit ${row.metric.key}`);
    editButton.addEventListener("click", () => {
      plugin.openEditRecordModal(file, row.metric);
    });
    const deleteButton = actions.createEl("button", {
      cls: "mod-warning",
      text: "Delete"
    });
    deleteButton.setAttribute("aria-label", `Delete ${row.metric.key}`);
    deleteButton.addEventListener("click", () => {
      plugin.confirmDeleteRecord(file, row.metric);
    });
  }
  renderIssueList(rowEl, row);
  if (!row.metric?.key) {
    rowEl.createEl("pre", { cls: "metrics-lens-record-raw", text: row.rawLine });
  }
}
var MetricsFileView = class extends import_obsidian3.TextFileView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }
  plugin;
  allowNoFile = true;
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
    this.render();
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
  render() {
    this.contentEl.empty();
    const container = this.contentEl.createDiv({ cls: "metrics-lens-view" });
    const analysis = analyzeMetricsData(this.data ?? "");
    const status = container.createDiv({ cls: "metrics-lens-status" });
    status.setText(
      this.file ? "Metrics file view is active. Full CRUD lens is the next implementation step." : "No metrics file is open. Open a .metrics.ndjson file from the file browser."
    );
    if (!this.file) {
      const emptyPanel = container.createDiv({ cls: "metrics-lens-panel" });
      emptyPanel.createEl("h2", { text: "File browser integration" });
      const emptyList = emptyPanel.createEl("ul");
      emptyList.createEl("li", { text: "Compound extension registered: metrics.ndjson" });
      emptyList.createEl("li", { text: "File browser should show logical file names without the suffix" });
      emptyList.createEl("li", { text: "Capitalization in the sidebar follows the actual file name on disk" });
      return;
    }
    const filePanel = container.createDiv({ cls: "metrics-lens-panel" });
    filePanel.createEl("h2", { text: "File" });
    const fileList = filePanel.createEl("ul");
    fileList.createEl("li", {
      text: `Display name: ${capitalizeDisplayName(logicalMetricsBaseName(this.file.name, this.plugin.settings.supportedExtensions))}`
    });
    fileList.createEl("li", {
      text: `Path: ${this.file.path}`
    });
    fileList.createEl("li", {
      text: `Rows: ${analysis.totalRows}`
    });
    fileList.createEl("li", {
      text: `Valid rows: ${analysis.validRows}`
    });
    fileList.createEl("li", {
      text: `Warning rows: ${analysis.warningRows}`
    });
    fileList.createEl("li", {
      text: `Error rows: ${analysis.errorRows}`
    });
    fileList.createEl("li", {
      text: `Legacy rows missing id: ${analysis.legacyRows}`
    });
    fileList.createEl("li", {
      text: `Reference example: ${toMetricReference("01JRX9Y7T9TQ8Q3A91F1M7A4AA", this.plugin.settings.recordReferencePrefix)}`
    });
    const createRow = filePanel.createDiv({ cls: "metrics-lens-actions" });
    const createButton = createRow.createEl("button", {
      cls: "mod-cta",
      text: "Add record"
    });
    createButton.setAttribute("aria-label", "Add a metrics record to this file");
    createButton.addEventListener("click", () => {
      if (!this.file) {
        return;
      }
      this.plugin.openCreateRecordModal(this.file);
    });
    if (analysis.legacyRows > 0) {
      const legacyPanel = container.createDiv({ cls: "metrics-lens-panel" });
      legacyPanel.createEl("h2", { text: "Legacy ids" });
      legacyPanel.createEl("p", {
        text: "This file still uses legacy rows without `id`. Stable CRUD and markdown references require an `id` on every row."
      });
      const actionRow = legacyPanel.createDiv({ cls: "metrics-lens-actions" });
      const assignButton = actionRow.createEl("button", {
        cls: "mod-cta",
        text: "Assign missing ids"
      });
      assignButton.setAttribute("aria-label", "Assign missing ids in this metrics file");
      assignButton.addEventListener("click", () => {
        if (!this.file) {
          return;
        }
        void this.plugin.assignMissingIds(this.file);
      });
    }
    const validationPanel = container.createDiv({ cls: "metrics-lens-panel" });
    validationPanel.createEl("h2", { text: "Validation" });
    if (analysis.issueSummary.length === 0) {
      validationPanel.createSpan({ text: "No issues detected." });
    } else {
      const validationList = validationPanel.createEl("ul");
      analysis.issueSummary.slice(0, 8).forEach((summary) => {
        const item = validationList.createEl("li");
        createStatusBadge(item, summary.severity, summary.severity);
        item.createSpan({ text: `${summary.message} (${summary.count})` });
      });
    }
    const scopePanel = container.createDiv({ cls: "metrics-lens-panel" });
    scopePanel.createEl("h2", { text: "Current scope" });
    const scopeList = scopePanel.createEl("ul");
    scopeList.createEl("li", { text: "Contract" });
    scopeList.createEl("li", { text: "Scaffold" });
    scopeList.createEl("li", { text: "Lens over metrics files with CRUD next" });
    const deferredPanel = container.createDiv({ cls: "metrics-lens-panel" });
    deferredPanel.createEl("h2", { text: "Deferred" });
    const deferredList = deferredPanel.createEl("ul");
    deferredList.createEl("li", { text: "Ingestion and provider pipelines" });
    deferredList.createEl("li", { text: "Caching and hidden databases" });
    deferredList.createEl("li", { text: "Charts, filters, and saved views" });
    deferredList.createEl("li", { text: "Notes and documents beyond metric references" });
    const recordsPanel = container.createDiv({ cls: "metrics-lens-panel" });
    recordsPanel.createEl("h2", { text: "Records" });
    if (analysis.rows.length === 0) {
      recordsPanel.createSpan({ text: "This file has no metrics rows yet." });
      return;
    }
    const recordsList = recordsPanel.createDiv({ cls: "metrics-lens-records" });
    analysis.rows.forEach((row) => {
      renderRecord(recordsList, row, this.plugin, this.file, this.plugin.settings.recordReferencePrefix);
    });
  }
};

// src/main.ts
var MetricsPlugin = class extends import_obsidian4.Plugin {
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
          void this.openFileInMetricsView(file, this.app.workspace.activeLeaf);
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
      await this.openFileInMetricsView(activeFile, this.app.workspace.activeLeaf);
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
      new import_obsidian4.Notice(
        skipped > 0 ? "No missing ids were assigned. Some rows were skipped because they are invalid." : "No missing ids were found in this metrics file."
      );
      return;
    }
    new import_obsidian4.Notice(
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
      new import_obsidian4.Notice(`Added metrics record ${createdId}.`);
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
      new import_obsidian4.Notice(`Updated metrics record ${recordId}.`);
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
      new import_obsidian4.Notice(`Deleted metrics record ${recordId}.`);
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
  handleMutationError(error) {
    if (error instanceof MetricsMutationError) {
      new import_obsidian4.Notice(error.message);
      return;
    }
    if (error instanceof Error) {
      new import_obsidian4.Notice(error.message);
      return;
    }
    new import_obsidian4.Notice("Metrics mutation failed.");
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
  async openFileInMetricsView(file, leaf) {
    if (!leaf) {
      new import_obsidian4.Notice("No active pane is available.");
      return;
    }
    await leaf.setViewState({
      type: METRICS_VIEW_TYPE,
      state: { file: file.path },
      active: true
    });
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
    await this.openFileInMetricsView(file, targetLeaf);
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
