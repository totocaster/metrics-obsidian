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

// src/metric-record-modal.ts
var import_obsidian = require("obsidian");

// src/metric-catalog.json
var metric_catalog_default = {
  version: 1,
  categories: {
    activity: {
      iconCandidates: ["gauge", "activity", "zap"],
      label: "Activity"
    },
    body: {
      iconCandidates: ["scale", "dumbbell", "activity"],
      label: "Body"
    },
    medication: {
      iconCandidates: ["syringe", "pill"],
      label: "Medication"
    },
    nutrition: {
      iconCandidates: ["flame", "utensils"],
      label: "Nutrition"
    },
    recovery: {
      iconCandidates: ["battery-full", "battery", "heart", "activity"],
      label: "Recovery"
    },
    sleep: {
      iconCandidates: ["moon-star", "moon", "bed"],
      label: "Sleep"
    }
  },
  metrics: {
    "activity.strain": {
      allowedUnits: ["score"],
      category: "activity",
      defaultUnit: "score",
      fractionDigits: 0,
      label: "Activity strain"
    },
    "body.body_fat_pct": {
      allowedUnits: ["percent"],
      category: "body",
      defaultUnit: "percent",
      fractionDigits: 1,
      iconCandidates: ["percent", "activity"],
      label: "Body fat"
    },
    "body.weight": {
      allowedUnits: ["kg"],
      category: "body",
      defaultUnit: "kg",
      fractionDigits: 1,
      iconCandidates: ["scale", "dumbbell", "activity"],
      label: "Body weight"
    },
    "medication.semaglutide_dose": {
      allowedUnits: ["mg"],
      category: "medication",
      defaultUnit: "mg",
      fractionDigits: 2,
      iconCandidates: ["syringe", "pill"],
      label: "Semaglutide dose"
    },
    "nutrition.calories": {
      allowedUnits: ["kcal"],
      category: "nutrition",
      defaultUnit: "kcal",
      fractionDigits: 0,
      iconCandidates: ["flame", "utensils"],
      label: "Calories"
    },
    "recovery.resting_hr": {
      allowedUnits: ["bpm"],
      category: "recovery",
      defaultUnit: "bpm",
      fractionDigits: 0,
      iconCandidates: ["heart-pulse", "heart", "activity"],
      label: "Resting heart rate"
    },
    "recovery.score": {
      allowedUnits: ["score", "percent"],
      category: "recovery",
      defaultUnit: "score",
      fractionDigits: 0,
      iconCandidates: ["battery-full", "battery", "heart", "activity"],
      label: "Recovery score"
    },
    "sleep.duration": {
      allowedUnits: ["hours", "min", "sec"],
      category: "sleep",
      defaultUnit: "min",
      fractionDigits: 0,
      iconCandidates: ["moon-star", "moon", "bed"],
      label: "Sleep duration"
    },
    "sleep.performance": {
      allowedUnits: ["score", "percent"],
      category: "sleep",
      defaultUnit: "score",
      fractionDigits: 0,
      iconCandidates: ["bed", "moon", "activity"],
      label: "Sleep performance"
    }
  },
  units: {
    C: {
      aliases: ["c", "celsius"],
      display: "\xB0C",
      fractionDigits: 1,
      label: "Celsius"
    },
    F: {
      aliases: ["f", "fahrenheit"],
      display: "\xB0F",
      fractionDigits: 1,
      label: "Fahrenheit"
    },
    bpm: {
      aliases: [],
      display: "bpm",
      fractionDigits: 0,
      label: "Beats per minute"
    },
    "br/min": {
      aliases: [],
      display: "br/min",
      fractionDigits: 0,
      label: "Breaths per minute"
    },
    count: {
      aliases: [],
      display: "count",
      fractionDigits: 0,
      label: "Count"
    },
    g: {
      aliases: ["gram", "grams"],
      display: "g",
      fractionDigits: 0,
      label: "Grams"
    },
    hours: {
      aliases: ["hour", "hr", "hrs"],
      display: "hr",
      durationUnit: "hours",
      label: "Hours"
    },
    kcal: {
      aliases: [],
      display: "kcal",
      fractionDigits: 0,
      label: "Kilocalories"
    },
    kg: {
      aliases: ["kilogram", "kilograms"],
      display: "kg",
      fractionDigits: 1,
      label: "Kilograms"
    },
    km: {
      aliases: ["kilometer", "kilometers"],
      display: "km",
      fractionDigits: 2,
      label: "Kilometers"
    },
    mg: {
      aliases: ["milligram", "milligrams"],
      display: "mg",
      fractionDigits: 2,
      label: "Milligrams"
    },
    min: {
      aliases: ["minute", "minutes"],
      display: "min",
      durationUnit: "min",
      label: "Minutes"
    },
    ml: {
      aliases: ["milliliter", "milliliters"],
      display: "ml",
      fractionDigits: 0,
      label: "Milliliters"
    },
    mmHg: {
      aliases: ["mmhg"],
      display: "mmHg",
      fractionDigits: 0,
      label: "Millimeters of mercury"
    },
    ms: {
      aliases: ["millisecond", "milliseconds"],
      display: "ms",
      fractionDigits: 0,
      label: "Milliseconds"
    },
    percent: {
      aliases: ["%", "pct"],
      display: "%",
      fractionDigits: 1,
      label: "Percent"
    },
    score: {
      aliases: [],
      display: "score",
      fractionDigits: 0,
      label: "Score"
    },
    sec: {
      aliases: ["s", "second", "seconds"],
      display: "sec",
      durationUnit: "sec",
      label: "Seconds"
    }
  }
};

// src/metric-catalog.ts
var DEFAULT_ICON_CANDIDATES = ["activity"];
function trimToNull(value) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
function normalizeLookupValue(value) {
  return value.trim().toLowerCase();
}
function validateMetricCatalog(data) {
  const categories = new Set(Object.keys(data.categories));
  const units = new Set(Object.keys(data.units));
  const seenAliases = /* @__PURE__ */ new Map();
  Object.entries(data.units).forEach(([unitKey, unit]) => {
    const aliases = [unitKey, ...unit.aliases ?? []];
    aliases.forEach((alias) => {
      const normalizedAlias = normalizeLookupValue(alias);
      const existing = seenAliases.get(normalizedAlias);
      if (existing && existing !== unitKey) {
        throw new Error(`Metric catalog unit alias conflict: ${alias} maps to both ${existing} and ${unitKey}.`);
      }
      seenAliases.set(normalizedAlias, unitKey);
    });
  });
  Object.entries(data.metrics).forEach(([metricKey, metric]) => {
    if (!categories.has(metric.category)) {
      throw new Error(`Metric catalog category missing for ${metricKey}: ${metric.category}.`);
    }
    metric.allowedUnits.forEach((unitKey) => {
      if (!units.has(unitKey)) {
        throw new Error(`Metric catalog unit missing for ${metricKey}: ${unitKey}.`);
      }
    });
    if (metric.defaultUnit && !metric.allowedUnits.includes(metric.defaultUnit)) {
      throw new Error(`Metric catalog default unit for ${metricKey} must be part of allowedUnits.`);
    }
  });
  return data;
}
var metricCatalog = validateMetricCatalog(metric_catalog_default);
var metricKeys = Object.keys(metricCatalog.metrics).sort((left, right) => left.localeCompare(right));
var unitKeys = Object.keys(metricCatalog.units).sort((left, right) => left.localeCompare(right));
var unitKeysByAlias = /* @__PURE__ */ new Map();
unitKeys.forEach((unitKey) => {
  const unit = metricCatalog.units[unitKey];
  [unitKey, ...unit.aliases ?? []].forEach((alias) => {
    unitKeysByAlias.set(normalizeLookupValue(alias), unitKey);
  });
});
function categoryKeyForMetric(metricKey) {
  const explicitCategory = metricCatalog.metrics[metricKey]?.category;
  if (explicitCategory) {
    return explicitCategory;
  }
  const [prefix] = metricKey.split(".", 1);
  return prefix && metricCatalog.categories[prefix] ? prefix : null;
}
function allMetricKeys() {
  return [...metricKeys];
}
function allUnitKeys() {
  return [...unitKeys];
}
function canonicalMetricUnit(unit) {
  const trimmed = trimToNull(unit);
  if (!trimmed) {
    return null;
  }
  return unitKeysByAlias.get(normalizeLookupValue(trimmed)) ?? null;
}
function displayMetricKey(metricKey) {
  const trimmed = trimToNull(metricKey);
  if (!trimmed) {
    return "Invalid row";
  }
  return metricCatalog.metrics[trimmed]?.label ?? trimmed;
}
function displayMetricOption(metricKey) {
  const label = displayMetricKey(metricKey);
  return label === metricKey ? metricKey : `${label} (${metricKey})`;
}
function displayMetricUnit(unit) {
  const normalizedUnitKey = normalizeMetricUnitKey(unit);
  if (!normalizedUnitKey) {
    return null;
  }
  return metricCatalog.units[normalizedUnitKey]?.display ?? normalizedUnitKey;
}
function displayMetricUnitLabel(unit) {
  const normalizedUnitKey = normalizeMetricUnitKey(unit);
  if (!normalizedUnitKey) {
    return null;
  }
  return metricCatalog.units[normalizedUnitKey]?.label ?? normalizedUnitKey;
}
function displayMetricUnitOption(unitKey) {
  const display = displayMetricUnit(unitKey) ?? unitKey;
  const label = displayMetricUnitLabel(unitKey) ?? unitKey;
  return display === label ? display : `${display} (${label})`;
}
function getMetricCategory(metricKey) {
  const trimmed = trimToNull(metricKey);
  if (!trimmed) {
    return null;
  }
  const categoryKey = categoryKeyForMetric(trimmed);
  return categoryKey ? metricCatalog.categories[categoryKey] ?? null : null;
}
function getMetricDefinition(metricKey) {
  const trimmed = trimToNull(metricKey);
  if (!trimmed) {
    return null;
  }
  return metricCatalog.metrics[trimmed] ?? null;
}
function getMetricIconCandidates(metricKey) {
  const trimmed = trimToNull(metricKey);
  if (!trimmed) {
    return [...DEFAULT_ICON_CANDIDATES];
  }
  return getMetricDefinition(trimmed)?.iconCandidates ?? getMetricCategory(trimmed)?.iconCandidates ?? DEFAULT_ICON_CANDIDATES;
}
function getMetricUnitDefinition(unit) {
  const canonicalUnitKey = canonicalMetricUnit(unit);
  return canonicalUnitKey ? metricCatalog.units[canonicalUnitKey] ?? null : null;
}
function getMetricFractionDigits(metricKey, unit) {
  const metricDefinition = getMetricDefinition(metricKey);
  if (typeof metricDefinition?.fractionDigits === "number") {
    return metricDefinition.fractionDigits;
  }
  const unitDefinition = getMetricUnitDefinition(unit);
  if (typeof unitDefinition?.fractionDigits === "number") {
    return unitDefinition.fractionDigits;
  }
  return null;
}
function getMetricDurationUnit(unit) {
  return getMetricUnitDefinition(unit)?.durationUnit ?? null;
}
function getSupportedUnitsForMetric(metricKey) {
  return getMetricDefinition(metricKey)?.allowedUnits ?? [];
}
function getDefaultUnitForMetric(metricKey) {
  return getMetricDefinition(metricKey)?.defaultUnit ?? null;
}
function hasKnownMetricKey(metricKey) {
  return getMetricDefinition(metricKey) !== null;
}
function hasKnownMetricUnit(unit) {
  return canonicalMetricUnit(unit) !== null;
}
function isUnitAllowedForMetric(metricKey, unit) {
  const metricDefinition = getMetricDefinition(metricKey);
  if (!metricDefinition) {
    return null;
  }
  const canonicalUnitKey = canonicalMetricUnit(unit);
  if (!canonicalUnitKey) {
    return null;
  }
  return metricDefinition.allowedUnits.includes(canonicalUnitKey);
}
function normalizeMetricUnitKey(unit) {
  const canonicalUnitKey = canonicalMetricUnit(unit);
  if (canonicalUnitKey) {
    return canonicalUnitKey;
  }
  return trimToNull(unit);
}
function compareMetricKeys(left, right) {
  const leftLabel = displayMetricKey(left);
  const rightLabel = displayMetricKey(right);
  const labelComparison = leftLabel.localeCompare(rightLabel);
  return labelComparison !== 0 ? labelComparison : left.localeCompare(right);
}

// src/metric-record-modal.ts
function currentIsoTimestamp() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function trimOrUndefined(value) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : void 0;
}
function populateDatalist(datalist, values, labelForValue) {
  datalist.empty();
  values.forEach((value) => {
    const option = datalist.createEl("option");
    option.value = value;
    option.label = labelForValue(value);
  });
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
    const inputIdSuffix = Math.random().toString(36).slice(2, 8);
    const keySuggestionsId = `metrics-lens-key-suggestions-${inputIdSuffix}`;
    const unitSuggestionsId = `metrics-lens-unit-suggestions-${inputIdSuffix}`;
    let unitInputEl = null;
    const keySuggestions = contentEl.createEl("datalist");
    keySuggestions.id = keySuggestionsId;
    populateDatalist(keySuggestions, allMetricKeys(), displayMetricKey);
    const unitSuggestions = contentEl.createEl("datalist");
    unitSuggestions.id = unitSuggestionsId;
    const syncUnitSuggestions = () => {
      const supportedUnits = getSupportedUnitsForMetric(key.trim());
      populateDatalist(
        unitSuggestions,
        supportedUnits.length > 0 ? supportedUnits : allUnitKeys(),
        displayMetricUnitOption
      );
      if (unitInputEl) {
        unitInputEl.placeholder = getDefaultUnitForMetric(key.trim()) ?? "kg";
      }
    };
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
    new import_obsidian.Setting(contentEl).setName("Key").setDesc("Canonical metric key. Known keys are suggested from the built-in catalog.").addText((text) => {
      text.setPlaceholder("body.weight");
      text.setValue(key);
      text.inputEl.setAttribute("list", keySuggestionsId);
      text.onChange((nextValue) => {
        key = nextValue;
        syncUnitSuggestions();
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
    new import_obsidian.Setting(contentEl).setName("Unit").setDesc("Optional display unit. Catalog-backed suggestions follow the current key.").addText((text) => {
      unitInputEl = text.inputEl;
      text.inputEl.setAttribute("list", unitSuggestionsId);
      text.setPlaceholder(getDefaultUnitForMetric(key.trim()) ?? "kg");
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
    syncUnitSuggestions();
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

// src/metrics-file-modal.ts
var import_obsidian2 = require("obsidian");
var MetricsFileModal = class extends import_obsidian2.Modal {
  onSubmitValue;
  options;
  constructor(app, options, onSubmitValue) {
    super(app);
    this.options = options;
    this.onSubmitValue = onSubmitValue;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: this.options.title });
    contentEl.createEl("p", {
      text: this.options.description
    });
    let value = this.options.initialValue ?? "";
    const inputSetting = new import_obsidian2.Setting(contentEl).setName(this.options.fieldLabel);
    let submit = null;
    inputSetting.addText((text) => {
      text.setPlaceholder(this.options.placeholder);
      text.setValue(value);
      text.onChange((nextValue) => {
        value = nextValue;
      });
      text.inputEl.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") {
          return;
        }
        event.preventDefault();
        submit?.();
      });
      window.setTimeout(() => {
        text.inputEl.focus();
        text.inputEl.select();
      }, 0);
    });
    const actions = contentEl.createDiv({ cls: "metrics-lens-actions" });
    const cancelButton = actions.createEl("button", { text: "Cancel" });
    cancelButton.type = "button";
    cancelButton.addEventListener("click", () => {
      this.close();
    });
    const submitButton = actions.createEl("button", {
      cls: "mod-cta",
      text: this.options.submitLabel
    });
    submitButton.type = "button";
    submitButton.setAttribute("aria-label", this.options.submitLabel);
    submit = () => {
      const normalizedValue = value.trim();
      if (normalizedValue.length === 0) {
        new import_obsidian2.Notice(`${this.options.fieldLabel} is required.`);
        return;
      }
      this.onSubmitValue(normalizedValue);
      this.close();
    };
    submitButton.addEventListener("click", () => {
      submit?.();
    });
  }
};

// src/settings.ts
var import_obsidian3 = require("obsidian");

// src/view-state.ts
var DEFAULT_VIEW_STATE = {
  fromDate: "",
  groupBy: "none",
  key: "",
  searchText: "",
  showChart: false,
  showFilters: true,
  sortOrder: "newest",
  source: "",
  status: "all",
  timeRange: "all",
  toDate: ""
};
function createDefaultViewState() {
  return { ...DEFAULT_VIEW_STATE };
}
function normalizeSortOrder(value) {
  return value === "oldest" || value === "value-desc" || value === "value-asc" ? value : "newest";
}
function normalizeGroupBy(value) {
  return value === "day" || value === "key" || value === "source" ? value : "none";
}
function normalizeStatus(value) {
  return value === "valid" || value === "warning" || value === "error" ? value : "all";
}
function normalizeTimeRange(value) {
  return value === "today" || value === "this-week" || value === "past-7-days" || value === "past-30-days" || value === "past-3-months" || value === "past-6-months" || value === "past-1-year" || value === "this-month" || value === "custom" ? value : "all";
}
function normalizeString(value) {
  return typeof value === "string" ? value : "";
}
function normalizeMetricsViewState(value) {
  return {
    fromDate: normalizeString(value?.fromDate),
    groupBy: normalizeGroupBy(value?.groupBy),
    key: normalizeString(value?.key),
    searchText: normalizeString(value?.searchText),
    showChart: value?.showChart === true,
    showFilters: value?.showFilters !== false,
    sortOrder: normalizeSortOrder(value?.sortOrder),
    source: normalizeString(value?.source),
    status: normalizeStatus(value?.status),
    timeRange: normalizeTimeRange(value?.timeRange),
    toDate: normalizeString(value?.toDate)
  };
}
function normalizePersistedMetricsViewState(value) {
  return {
    advancedControlsExpanded: value?.advancedControlsExpanded === true,
    viewState: normalizeMetricsViewState(value?.viewState)
  };
}

// src/settings.ts
var DEFAULT_SETTINGS = {
  defaultWriteFile: "Metrics/All.metrics.ndjson",
  metricsRoot: "Metrics",
  persistedViewStateByPath: {},
  recordReferencePrefix: "metric:",
  showMetricIcons: true,
  supportedExtensions: [".metrics.ndjson"]
};
function normalizeMetricsSettings(settings) {
  const supportedExtensions = settings.supportedExtensions?.length ? settings.supportedExtensions : DEFAULT_SETTINGS.supportedExtensions;
  const persistedViewStateByPath = Object.fromEntries(
    Object.entries(settings.persistedViewStateByPath ?? {}).map(([path, value]) => [
      (0, import_obsidian3.normalizePath)(path),
      normalizePersistedMetricsViewState(value)
    ])
  );
  return {
    defaultWriteFile: (0, import_obsidian3.normalizePath)(settings.defaultWriteFile ?? DEFAULT_SETTINGS.defaultWriteFile),
    metricsRoot: (0, import_obsidian3.normalizePath)(settings.metricsRoot ?? DEFAULT_SETTINGS.metricsRoot),
    persistedViewStateByPath,
    recordReferencePrefix: settings.recordReferencePrefix?.trim() || DEFAULT_SETTINGS.recordReferencePrefix,
    showMetricIcons: settings.showMetricIcons ?? DEFAULT_SETTINGS.showMetricIcons,
    supportedExtensions: Array.from(
      new Set(
        supportedExtensions.map((value) => value.trim()).filter((value) => value.length > 0)
      )
    )
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

// src/metric-value-format.ts
function normalizeDurationUnit(unit) {
  return getMetricDurationUnit(unit);
}
var MAX_AUTO_FRACTION_DIGITS = 2;
var MAX_RAW_FRACTION_DIGITS = 6;
function clampFractionDigits(value) {
  return Math.max(0, Math.min(MAX_RAW_FRACTION_DIGITS, value));
}
function fixedFractionDigits(digits) {
  const normalized = clampFractionDigits(digits);
  return {
    maximumFractionDigits: normalized,
    minimumFractionDigits: normalized
  };
}
function normalizeMetricKey(metricKey) {
  return typeof metricKey === "string" ? metricKey.trim().toLowerCase() : "";
}
function normalizeUnit(unit) {
  return typeof unit === "string" ? unit.trim().toLowerCase() : "";
}
function defaultFractionDigits(rawPrecision) {
  if (typeof rawPrecision === "number") {
    return fixedFractionDigits(
      rawPrecision > 0 ? Math.min(rawPrecision, MAX_AUTO_FRACTION_DIGITS) : 0
    );
  }
  return {
    maximumFractionDigits: clampFractionDigits(MAX_AUTO_FRACTION_DIGITS),
    minimumFractionDigits: 0
  };
}
function rawValuePrecision(rawLine) {
  const match = /"value"\s*:\s*-?\d+(?:\.(\d+))?(?:[eE][+-]?\d+)?/.exec(rawLine);
  return clampFractionDigits(match?.[1]?.length ?? 0);
}
function resolveMetricFractionDigits(metricKey, unit, options) {
  const normalizedMetricKey = normalizeMetricKey(metricKey);
  const normalizedUnit = normalizeUnit(unit);
  const canonicalUnit = canonicalMetricUnit(unit);
  const catalogFractionDigits = getMetricFractionDigits(metricKey, unit);
  if (typeof catalogFractionDigits === "number") {
    return fixedFractionDigits(catalogFractionDigits);
  }
  if (normalizedMetricKey.endsWith("_pct") || canonicalUnit === "percent" || normalizedUnit === "%" || normalizedUnit === "percent") {
    return fixedFractionDigits(1);
  }
  if (normalizedMetricKey.includes("temperature") || canonicalUnit === "C" || canonicalUnit === "F" || normalizedUnit === "c" || normalizedUnit === "f") {
    return fixedFractionDigits(1);
  }
  if (canonicalUnit === "bpm" || canonicalUnit === "br/min" || canonicalUnit === "count" || canonicalUnit === "kcal" || canonicalUnit === "mmHg" || canonicalUnit === "score") {
    return fixedFractionDigits(0);
  }
  return defaultFractionDigits(options?.rawPrecision);
}
function formatDurationValue(value, durationUnit) {
  const sign = value < 0 ? "-" : "";
  const totalSeconds = Math.round(
    Math.abs(
      durationUnit === "hours" ? value * 3600 : durationUnit === "min" ? value * 60 : value
    )
  );
  if (totalSeconds === 0) {
    return "0s";
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds % 3600 / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds}s`);
  }
  return `${sign}${parts.join(" ")}`;
}
function formatMetricDisplayValue(value, unit, options) {
  const durationUnit = normalizeDurationUnit(unit);
  if (durationUnit) {
    return formatDurationValue(value, durationUnit);
  }
  const digits = typeof options?.decimals === "number" ? fixedFractionDigits(options.decimals) : typeof options?.minimumFractionDigits === "number" || typeof options?.maximumFractionDigits === "number" ? {
    maximumFractionDigits: clampFractionDigits(
      Math.max(
        options.maximumFractionDigits ?? options.minimumFractionDigits ?? 0,
        options.minimumFractionDigits ?? 0
      )
    ),
    minimumFractionDigits: clampFractionDigits(options.minimumFractionDigits ?? 0)
  } : resolveMetricFractionDigits(options?.metricKey, unit, {
    rawPrecision: options?.rawPrecision
  });
  const formattedValue = value.toLocaleString(void 0, {
    maximumFractionDigits: digits.maximumFractionDigits,
    minimumFractionDigits: digits.minimumFractionDigits
  });
  const unitDisplay = displayMetricUnit(unit) ?? (typeof unit === "string" && unit.trim().length > 0 ? unit.trim() : null);
  if (options?.includeUnit && unitDisplay) {
    return `${formattedValue} ${unitDisplay}`;
  }
  return formattedValue;
}

// src/chart-model.ts
var NO_UNIT_KEY = "__no_unit__";
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
function startOfDayTimestamp(day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return null;
  }
  const timestamp = Date.parse(`${day}T00:00:00Z`);
  return Number.isNaN(timestamp) ? null : timestamp;
}
function uniqueStrings(values) {
  return Array.from(new Set(values));
}
function appendUniqueLineNumber(lineNumbers, lineNumber) {
  return lineNumbers.includes(lineNumber) ? lineNumbers : [...lineNumbers, lineNumber];
}
function rawRowValuePrecision(row) {
  return rawValuePrecision(row.rawLine);
}
function preferredPrecisionForRows(rows) {
  return rows.reduce(
    (current, row) => {
      const digits = resolveMetricFractionDigits(row.metric?.key, row.metric?.unit, {
        rawPrecision: rawRowValuePrecision(row)
      });
      return {
        maximumFractionDigits: Math.max(current.maximumFractionDigits, digits.maximumFractionDigits),
        minimumFractionDigits: Math.max(current.minimumFractionDigits, digits.minimumFractionDigits)
      };
    },
    {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }
  );
}
function formatFixed(value, decimals) {
  return value.toLocaleString(void 0, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  });
}
function resolveAxisPrecision(minValue, maxValue, minimumPrecision, maximumPrecision) {
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
function hasPlottableValue(row) {
  return typeof row.metric?.key === "string" && row.metric.key.length > 0 && typeof row.metric?.value === "number" && Number.isFinite(row.metric.value);
}
function collectValueRange(series) {
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
function collectStackedValueRange(stackSegments) {
  const totals = /* @__PURE__ */ new Map();
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
    const padding2 = Math.max(maxValue * 0.06, maxValue === 0 ? 1 : 0);
    return {
      minValue: 0,
      maxValue: maxValue + padding2
    };
  }
  if (maxValue <= 0) {
    const padding2 = Math.max(Math.abs(minValue) * 0.06, minValue === 0 ? 1 : 0);
    return {
      minValue: minValue - padding2,
      maxValue: 0
    };
  }
  const range = maxValue - minValue || 1;
  const padding = range * 0.06;
  return {
    minValue: minValue - padding,
    maxValue: maxValue + padding
  };
}
function buildDailyPanel(rows, unitKey, unitLabel) {
  const valuePrecision = preferredPrecisionForRows(rows);
  const seriesOrder = uniqueStrings(
    rows.map((row) => row.metric?.key).filter((value) => typeof value === "string" && value.length > 0)
  );
  const bucketLineNumbers = /* @__PURE__ */ new Map();
  const bucketTimestamps = /* @__PURE__ */ new Map();
  const stackSegments = /* @__PURE__ */ new Map();
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
      appendUniqueLineNumber(bucketLineNumbers.get(bucketKey) ?? [], row.lineNumber)
    );
    const segments = stackSegments.get(bucketKey) ?? [];
    segments.push({
      bucketKey,
      key,
      label: displayMetricKey(key),
      lineNumbers: [row.lineNumber],
      precision: rawRowValuePrecision(row),
      timestamp: rowTimestamp(row) ?? bucketTimestamp,
      value
    });
    stackSegments.set(bucketKey, segments);
  });
  const buckets = Array.from(bucketTimestamps.entries()).sort((left, right) => (left[1] ?? Number.NEGATIVE_INFINITY) - (right[1] ?? Number.NEGATIVE_INFINITY)).map(([key, timestamp]) => ({
    key,
    label: key,
    lineNumbers: bucketLineNumbers.get(key) ?? [],
    timestamp
  }));
  if (buckets.length === 0) {
    return null;
  }
  stackSegments.forEach((segments) => {
    segments.sort((left, right) => {
      if (left.timestamp !== null && right.timestamp !== null && left.timestamp !== right.timestamp) {
        return left.timestamp - right.timestamp;
      }
      return compareMetricKeys(left.key, right.key);
    });
  });
  const series = seriesOrder.map((key) => ({
    key,
    label: displayMetricKey(key),
    points: []
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
      valuePrecision.maximumFractionDigits
    ),
    buckets,
    kind: "bar",
    maxValue: valueRange.maxValue,
    minValue: valueRange.minValue,
    series,
    stackSegments,
    stacked: true,
    unitKey,
    unitLabel
  };
}
function buildTemporalPanel(rows, unitKey, unitLabel, bucketByDay) {
  const valuePrecision = preferredPrecisionForRows(rows);
  const seriesOrder = uniqueStrings(
    rows.map((row) => row.metric?.key).filter((value) => typeof value === "string" && value.length > 0)
  );
  const bucketLineNumbers = /* @__PURE__ */ new Map();
  const bucketTimestamps = /* @__PURE__ */ new Map();
  const seriesPointMaps = /* @__PURE__ */ new Map();
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
      appendUniqueLineNumber(bucketLineNumbers.get(bucketKey) ?? [], row.lineNumber)
    );
    const pointMap = seriesPointMaps.get(key) ?? /* @__PURE__ */ new Map();
    const existing = pointMap.get(bucketKey);
    if (!existing || (timestamp ?? bucketTimestamp) > (existing.timestamp ?? Number.NEGATIVE_INFINITY)) {
      pointMap.set(bucketKey, {
        bucketKey,
        lineNumbers: appendUniqueLineNumber(existing?.lineNumbers ?? [], row.lineNumber),
        precision: rawRowValuePrecision(row),
        timestamp: bucketTimestamp,
        value
      });
    } else {
      existing.lineNumbers = appendUniqueLineNumber(existing.lineNumbers, row.lineNumber);
    }
    seriesPointMaps.set(key, pointMap);
  });
  const buckets = Array.from(bucketTimestamps.entries()).sort((left, right) => (left[1] ?? Number.NEGATIVE_INFINITY) - (right[1] ?? Number.NEGATIVE_INFINITY)).map(([key, timestamp]) => ({
    key,
    label: key,
    lineNumbers: bucketLineNumbers.get(key) ?? [],
    timestamp
  }));
  if (buckets.length === 0) {
    return null;
  }
  const series = seriesOrder.map((key) => {
    const pointMap = seriesPointMaps.get(key);
    if (!pointMap || pointMap.size === 0) {
      return null;
    }
    return {
      key,
      label: displayMetricKey(key),
      points: buckets.map((bucket) => pointMap.get(bucket.key)).filter((point) => point !== void 0)
    };
  }).filter((entry) => entry !== null);
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
      valuePrecision.maximumFractionDigits
    ),
    buckets,
    kind: buckets.length >= 2 ? "line" : "bar",
    maxValue: valueRange.maxValue,
    minValue: valueRange.minValue,
    series,
    stackSegments: void 0,
    stacked: false,
    unitKey,
    unitLabel
  };
}
function buildSourcePanel(rows, unitKey, unitLabel) {
  const valuePrecision = preferredPrecisionForRows(rows);
  const bucketLineNumbers = /* @__PURE__ */ new Map();
  const bucketKeys = uniqueStrings(
    rows.map((row) => {
      const source = row.metric?.source;
      return typeof source === "string" && source.length > 0 ? source : "No source";
    })
  );
  const seriesOrder = uniqueStrings(
    rows.map((row) => row.metric?.key).filter((value) => typeof value === "string" && value.length > 0)
  );
  const pointMaps = /* @__PURE__ */ new Map();
  rows.forEach((row) => {
    const key = row.metric?.key;
    const value = row.metric?.value;
    if (typeof key !== "string" || typeof value !== "number" || !Number.isFinite(value)) {
      return;
    }
    const source = typeof row.metric?.source === "string" && row.metric.source.length > 0 ? row.metric.source : "No source";
    bucketLineNumbers.set(
      source,
      appendUniqueLineNumber(bucketLineNumbers.get(source) ?? [], row.lineNumber)
    );
    const pointMap = pointMaps.get(key) ?? /* @__PURE__ */ new Map();
    const existing = pointMap.get(source);
    if (!existing) {
      pointMap.set(source, {
        bucketKey: source,
        lineNumbers: [row.lineNumber],
        precision: rawRowValuePrecision(row),
        timestamp: rowTimestamp(row),
        value
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
    timestamp: null
  }));
  const series = seriesOrder.map((key) => {
    const pointMap = pointMaps.get(key);
    if (!pointMap || pointMap.size === 0) {
      return null;
    }
    return {
      key,
      label: displayMetricKey(key),
      points: buckets.map((bucket) => pointMap.get(bucket.key)).filter((point) => point !== void 0)
    };
  }).filter((entry) => entry !== null);
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
      valuePrecision.maximumFractionDigits
    ),
    buckets,
    kind: "bar",
    maxValue: valueRange.maxValue,
    minValue: valueRange.minValue,
    series,
    stackSegments: void 0,
    stacked: false,
    unitKey,
    unitLabel
  };
}
function buildKeyPanel(rows, unitKey, unitLabel) {
  const valuePrecision = preferredPrecisionForRows(rows);
  const buckets = uniqueStrings(
    rows.map((row) => {
      const key = row.metric?.key;
      return typeof key === "string" && key.length > 0 ? key : "No metric";
    })
  );
  const bucketLineNumbers = /* @__PURE__ */ new Map();
  const bucketDefs = buckets.map((key) => ({
    key,
    label: key === "No metric" ? key : displayMetricKey(key),
    lineNumbers: bucketLineNumbers.get(key) ?? [],
    timestamp: null
  }));
  const pointMap = /* @__PURE__ */ new Map();
  rows.forEach((row) => {
    const key = row.metric?.key;
    const value = row.metric?.value;
    if (typeof key !== "string" || typeof value !== "number" || !Number.isFinite(value)) {
      return;
    }
    bucketLineNumbers.set(
      key,
      appendUniqueLineNumber(bucketLineNumbers.get(key) ?? [], row.lineNumber)
    );
    if (!pointMap.has(key)) {
      pointMap.set(key, {
        bucketKey: key,
        lineNumbers: [row.lineNumber],
        precision: rawRowValuePrecision(row),
        timestamp: rowTimestamp(row),
        value
      });
      return;
    }
    const existing = pointMap.get(key);
    if (existing) {
      existing.lineNumbers = appendUniqueLineNumber(existing.lineNumbers, row.lineNumber);
    }
  });
  const series = [
    {
      key: "value",
      label: "Value",
      points: bucketDefs.map((bucket) => pointMap.get(bucket.key)).filter((point) => point !== void 0)
    }
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
      valuePrecision.maximumFractionDigits
    ),
    buckets: bucketDefs.map((bucket) => ({
      ...bucket,
      lineNumbers: bucketLineNumbers.get(bucket.key) ?? []
    })),
    kind: "bar",
    maxValue: valueRange.maxValue,
    minValue: valueRange.minValue,
    series,
    stackSegments: void 0,
    stacked: false,
    unitKey,
    unitLabel
  };
}
function buildMetricsChartModel(rows, groupBy) {
  const plottableRows = rows.filter(hasPlottableValue);
  if (plottableRows.length === 0) {
    return null;
  }
  const unitOrder = uniqueStrings(
    plottableRows.map((row) => {
      return normalizeMetricUnitKey(row.metric?.unit) ?? NO_UNIT_KEY;
    })
  );
  const panels = unitOrder.map((unitKey) => {
    const unitRows = plottableRows.filter((row) => {
      return (normalizeMetricUnitKey(row.metric?.unit) ?? NO_UNIT_KEY) === unitKey;
    });
    const unitLabel = unitKey === NO_UNIT_KEY ? null : displayMetricUnit(unitKey) ?? unitKey;
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
  }).filter((panel) => panel !== null);
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
    }, 0)
  };
}

// src/chart-renderer.ts
var SVG_NS = "http://www.w3.org/2000/svg";
var CHART_WIDTH = 640;
var CHART_HEIGHT = 248;
var PLOT_LEFT = 40;
var PLOT_RIGHT = 12;
var PLOT_TOP = 16;
var PLOT_BOTTOM = 44;
function createSvgEl(tagName, attributes) {
  const element = document.createElementNS(SVG_NS, tagName);
  if (attributes) {
    Object.entries(attributes).forEach(([name, value]) => {
      element.setAttribute(name, String(value));
    });
  }
  return element;
}
function formatChartAxisValue(value, decimals, unit) {
  return formatMetricDisplayValue(value, unit, {
    decimals,
    includeUnit: false
  });
}
function formatChartTooltipValue(value, metricKey, rawPrecision, unit) {
  return formatMetricDisplayValue(value, unit, {
    includeUnit: false,
    metricKey,
    rawPrecision
  });
}
function formatBucketLabel(bucket, axisKind) {
  if (axisKind === "time" && bucket.timestamp !== null) {
    return bucket.label.length === 10 ? bucket.label : new Intl.DateTimeFormat(void 0, {
      month: "short",
      day: "numeric"
    }).format(bucket.timestamp);
  }
  return bucket.label;
}
function formatBucketHeading(bucket, axisKind) {
  if (axisKind !== "time" || bucket.timestamp === null) {
    return bucket.label;
  }
  if (bucket.label.length === 10) {
    return new Intl.DateTimeFormat(void 0, {
      dateStyle: "full"
    }).format(bucket.timestamp);
  }
  return new Intl.DateTimeFormat(void 0, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(bucket.timestamp);
}
function formatSegmentTime(timestamp) {
  if (timestamp === null) {
    return null;
  }
  return new Intl.DateTimeFormat(void 0, {
    hour: "2-digit",
    minute: "2-digit"
  }).format(timestamp);
}
function uniqueLineNumbers(lineNumbers) {
  return Array.from(new Set(lineNumbers));
}
function colorClass(index) {
  return `metrics-lens-chart-series-${index % 6}`;
}
function nearlyEqual(left, right) {
  return Math.abs(left - right) <= Math.max(1e-6, Math.abs(left), Math.abs(right)) * 1e-6;
}
function gridGuideValues(panel) {
  const range = panel.maxValue - panel.minValue || 1;
  return [panel.maxValue, 0.75, 0.5, 0.25, panel.minValue].map(
    (value) => value > 0 && value < 1 ? panel.minValue + range * value : value
  );
}
function visibleSeriesKeys(panel, state) {
  if (state.isolatedSeriesKey) {
    return panel.series.some((series) => series.key === state.isolatedSeriesKey) ? [state.isolatedSeriesKey] : [];
  }
  return panel.series.map((series) => series.key).filter((key) => !state.mutedSeriesKeys.has(key));
}
function visibleSeriesCount(panel, state) {
  return visibleSeriesKeys(panel, state).length;
}
function filteredStackSegments(panel, visibleKeys) {
  if (!panel.stackSegments) {
    return void 0;
  }
  const filtered = /* @__PURE__ */ new Map();
  panel.stackSegments.forEach((segments, bucketKey) => {
    const visibleSegments = segments.filter((segment) => visibleKeys.has(segment.key));
    if (visibleSegments.length > 0) {
      filtered.set(bucketKey, visibleSegments);
    }
  });
  return filtered;
}
function computeVisibleRange(panel, series, stackSegments) {
  if (panel.stacked && stackSegments) {
    const totals = Array.from(stackSegments.values()).map(
      (segments) => segments.reduce(
        (current, segment) => {
          if (segment.value >= 0) {
            current.positive += segment.value;
          } else {
            current.negative += segment.value;
          }
          return current;
        },
        { negative: 0, positive: 0 }
      )
    );
    let minValue2 = Math.min(...totals.map((entry) => entry.negative), 0);
    let maxValue2 = Math.max(...totals.map((entry) => entry.positive), 0);
    const range2 = maxValue2 - minValue2 || 1;
    if (minValue2 >= 0) {
      minValue2 = 0;
      maxValue2 += Math.max(maxValue2 * 0.06, maxValue2 === 0 ? 1 : 0);
    } else if (maxValue2 <= 0) {
      maxValue2 = 0;
      minValue2 -= Math.max(Math.abs(minValue2) * 0.06, minValue2 === 0 ? 1 : 0);
    } else {
      const padding = range2 * 0.06;
      minValue2 -= padding;
      maxValue2 += padding;
    }
    return { maxValue: maxValue2, minValue: minValue2 };
  }
  const values = series.flatMap((entry) => entry.points.map((point) => point.value));
  if (values.length === 0) {
    return {
      maxValue: panel.maxValue,
      minValue: panel.minValue
    };
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
function displayPanel(panel, state) {
  const visibleKeys = new Set(visibleSeriesKeys(panel, state));
  const series = panel.series.filter((entry) => visibleKeys.has(entry.key));
  const stackSegments = filteredStackSegments(panel, visibleKeys);
  const range = computeVisibleRange(panel, series, stackSegments);
  return {
    ...panel,
    maxValue: range.maxValue,
    minValue: range.minValue,
    series,
    stackSegments
  };
}
function colorClassBySeriesKey(panel) {
  return new Map(panel.series.map((series, index) => [series.key, colorClass(index)]));
}
function selectXAxisLabels(buckets, maxLabels, xForBucket) {
  if (buckets.length <= maxLabels) {
    return buckets.map((bucket, index) => ({ bucket, index, x: xForBucket(bucket, index) }));
  }
  const selections = [];
  const span = Math.max(1, maxLabels - 1);
  const step = Math.ceil((buckets.length - 1) / span);
  buckets.forEach((bucket, index) => {
    if (index === 0 || index === buckets.length - 1 || index % step === 0) {
      selections.push({ bucket, index, x: xForBucket(bucket, index) });
    }
  });
  return selections;
}
function xAxisLayout(panel, panelWidth, xForBucket) {
  const availableWidth = Math.max(180, panelWidth - 52);
  const targetSpacing = panel.axisKind === "time" ? 88 : 72;
  const maxLabels = Math.max(2, Math.floor(availableWidth / targetSpacing));
  return {
    labels: selectXAxisLabels(panel.buckets, maxLabels, xForBucket),
    rotate: false
  };
}
function appendYAxis(svg, panel) {
  const plotWidth = CHART_WIDTH - PLOT_LEFT - PLOT_RIGHT;
  const plotHeight = CHART_HEIGHT - PLOT_TOP - PLOT_BOTTOM;
  const domainMin = panel.minValue;
  const domainMax = panel.maxValue;
  const range = domainMax - domainMin || 1;
  const yForValue = (value) => {
    const ratio = (value - domainMin) / range;
    return PLOT_TOP + plotHeight - ratio * plotHeight;
  };
  const baselineValue = domainMin <= 0 && domainMax >= 0 ? 0 : domainMin > 0 ? domainMin : domainMax;
  const gridValues = gridGuideValues(panel);
  let baselineRendered = false;
  gridValues.forEach((value, index) => {
    const y = yForValue(value);
    const isMinor = index !== 0 && index !== gridValues.length - 1;
    const isBaseline = nearlyEqual(value, baselineValue);
    if (isBaseline) {
      baselineRendered = true;
    }
    svg.appendChild(
      createSvgEl("line", {
        class: [
          "metrics-lens-chart-grid",
          isMinor ? "is-minor" : "",
          isBaseline ? "metrics-lens-chart-baseline" : ""
        ].filter((value2) => value2.length > 0).join(" "),
        x1: PLOT_LEFT,
        x2: PLOT_LEFT + plotWidth,
        y1: y,
        y2: y
      })
    );
    const label = createSvgEl("text", {
      class: ["metrics-lens-chart-axis-label", isMinor ? "is-minor" : ""].filter((entry) => entry.length > 0).join(" "),
      x: PLOT_LEFT - 8,
      y: y + 4
    });
    label.textContent = formatChartAxisValue(
      value,
      panel.axisPrecision,
      panel.unitKey === NO_UNIT_KEY ? null : panel.unitKey
    );
    svg.appendChild(label);
  });
  const zeroY = yForValue(baselineValue);
  if (!baselineRendered) {
    svg.appendChild(
      createSvgEl("line", {
        class: "metrics-lens-chart-baseline",
        x1: PLOT_LEFT,
        x2: PLOT_LEFT + plotWidth,
        y1: zeroY,
        y2: zeroY
      })
    );
  }
  return { baselineValue, plotHeight, plotWidth, zeroY, yForValue };
}
function appendBarChartGuideOverlay(svg, panel, plotWidth, yForValue, baselineValue) {
  gridGuideValues(panel).forEach((value, index, allValues) => {
    const isMinor = index !== 0 && index !== allValues.length - 1;
    if (isMinor) {
      return;
    }
    const isBaseline = nearlyEqual(value, baselineValue);
    svg.appendChild(
      createSvgEl("line", {
        class: [
          "metrics-lens-chart-grid",
          "is-overlay",
          isBaseline ? "metrics-lens-chart-baseline" : ""
        ].filter((entry) => entry.length > 0).join(" "),
        x1: PLOT_LEFT,
        x2: PLOT_LEFT + plotWidth,
        y1: yForValue(value),
        y2: yForValue(value)
      })
    );
  });
}
function appendXAxisLabels(svg, layout, axisKind) {
  layout.labels.forEach(({ bucket, x }) => {
    const y = CHART_HEIGHT - 10;
    const label = createSvgEl("text", {
      class: ["metrics-lens-chart-axis-label", "is-bottom"].join(" "),
      x,
      y
    });
    label.textContent = formatBucketLabel(bucket, axisKind);
    svg.appendChild(label);
  });
}
function lineHoverTargets(panel, xForTimestamp, visibleKeys, colorClasses) {
  const positions = panel.buckets.map((bucket) => xForTimestamp(bucket.timestamp));
  return panel.buckets.map((bucket, index) => {
    const entries = panel.series.filter((series) => visibleKeys.has(series.key)).map((series) => {
      const point = series.points.find((entry) => entry.bucketKey === bucket.key);
      if (!point) {
        return null;
      }
      return {
        colorClass: colorClasses.get(series.key) ?? colorClass(0),
        label: series.label,
        lineNumbers: point.lineNumbers,
        metricKey: series.key,
        precision: point.precision,
        value: point.value
      };
    }).filter((entry) => entry !== null);
    if (entries.length === 0) {
      return null;
    }
    const x = positions[index];
    const xStart = index === 0 ? PLOT_LEFT : (positions[index - 1] + x) / 2;
    const xEnd = index === positions.length - 1 ? PLOT_LEFT + (CHART_WIDTH - PLOT_LEFT - PLOT_RIGHT) : (x + positions[index + 1]) / 2;
    return {
      bucket,
      entries,
      lineNumbers: uniqueLineNumbers(entries.flatMap((entry) => entry.lineNumbers)),
      x,
      xEnd,
      xStart
    };
  }).filter((entry) => entry !== null);
}
function barHoverTargets(panel, bucketWidth, visibleKeys, colorClasses) {
  return panel.buckets.map((bucket, index) => {
    const xStart = PLOT_LEFT + index * bucketWidth;
    const xEnd = xStart + bucketWidth;
    const x = xStart + bucketWidth / 2;
    if (panel.stacked && panel.stackSegments) {
      const segments = (panel.stackSegments.get(bucket.key) ?? []).filter((segment) => visibleKeys.has(segment.key));
      if (segments.length === 0) {
        return null;
      }
      const duplicateCounts = /* @__PURE__ */ new Map();
      segments.forEach((segment) => {
        duplicateCounts.set(segment.key, (duplicateCounts.get(segment.key) ?? 0) + 1);
      });
      return {
        bucket,
        entries: segments.map((segment) => {
          const timeLabel = duplicateCounts.get(segment.key) > 1 ? formatSegmentTime(segment.timestamp) : null;
          return {
            colorClass: colorClasses.get(segment.key) ?? colorClass(0),
            label: timeLabel ? `${segment.label} ${timeLabel}` : segment.label,
            lineNumbers: segment.lineNumbers,
            metricKey: segment.key,
            precision: segment.precision,
            value: segment.value
          };
        }),
        lineNumbers: uniqueLineNumbers(segments.flatMap((segment) => segment.lineNumbers)),
        x,
        xEnd,
        xStart
      };
    }
    const entries = panel.series.filter((series) => visibleKeys.has(series.key)).map((series) => {
      const point = series.points.find((entry) => entry.bucketKey === bucket.key);
      if (!point) {
        return null;
      }
      return {
        colorClass: colorClasses.get(series.key) ?? colorClass(0),
        label: series.label,
        lineNumbers: point.lineNumbers,
        metricKey: series.key,
        precision: point.precision,
        value: point.value
      };
    }).filter((entry) => entry !== null);
    if (entries.length === 0) {
      return null;
    }
    return {
      bucket,
      entries,
      lineNumbers: uniqueLineNumbers(entries.flatMap((entry) => entry.lineNumbers)),
      x,
      xEnd,
      xStart
    };
  }).filter((entry) => entry !== null);
}
function renderTooltip(tooltipEl, panel, target) {
  tooltipEl.empty();
  if (!target) {
    tooltipEl.removeClass("is-visible");
    return;
  }
  tooltipEl.addClass("is-visible");
  tooltipEl.createDiv({
    cls: "metrics-lens-chart-tooltip-title",
    text: formatBucketHeading(target.bucket, panel.axisKind)
  });
  target.entries.forEach((entry) => {
    const row = tooltipEl.createDiv({ cls: "metrics-lens-chart-tooltip-row" });
    row.createSpan({
      cls: ["metrics-lens-chart-tooltip-swatch", entry.colorClass]
    });
    row.createSpan({
      cls: "metrics-lens-chart-tooltip-label",
      text: entry.label
    });
    row.createSpan({
      cls: "metrics-lens-chart-tooltip-value",
      text: formatChartTooltipValue(
        entry.value,
        entry.metricKey,
        entry.precision,
        panel.unitKey === NO_UNIT_KEY ? null : panel.unitKey
      )
    });
  });
}
function attachHoverTargets(panelEl, svg, panel, targets, onSelect) {
  if (targets.length === 0) {
    return;
  }
  const tooltipEl = panelEl.createDiv({ cls: "metrics-lens-chart-tooltip" });
  const crosshair = createSvgEl("line", {
    class: "metrics-lens-chart-crosshair",
    x1: 0,
    x2: 0,
    y1: PLOT_TOP,
    y2: CHART_HEIGHT - PLOT_BOTTOM
  });
  svg.appendChild(crosshair);
  const overlay = createSvgEl("g");
  const showTarget = (target) => {
    crosshair.setAttribute("x1", String(target.x));
    crosshair.setAttribute("x2", String(target.x));
    crosshair.addClass("is-visible");
    renderTooltip(tooltipEl, panel, target);
    const panelBounds = panelEl.getBoundingClientRect();
    const svgBounds = svg.getBoundingClientRect();
    const tooltipWidth = tooltipEl.getBoundingClientRect().width || 180;
    const panelWidth = panelBounds.width || CHART_WIDTH;
    const svgWidth = svgBounds.width || panelWidth;
    const targetPx = target.x / CHART_WIDTH * svgWidth + (svgBounds.left - panelBounds.left);
    const anchorGap = -4;
    const preferredLeft = targetPx > panelWidth / 2 ? targetPx - tooltipWidth - anchorGap : targetPx + anchorGap;
    const clampedLeft = Math.max(0, Math.min(panelWidth - tooltipWidth, preferredLeft));
    tooltipEl.style.left = `${clampedLeft}px`;
  };
  const hideTarget = () => {
    crosshair.removeClass("is-visible");
    renderTooltip(tooltipEl, panel, null);
  };
  targets.forEach((target) => {
    const region = createSvgEl("rect", {
      class: "metrics-lens-chart-hover-region",
      height: CHART_HEIGHT - PLOT_BOTTOM - PLOT_TOP,
      width: target.xEnd - target.xStart,
      x: target.xStart,
      y: PLOT_TOP
    });
    region.setAttribute("aria-label", `Focus ${formatBucketHeading(target.bucket, panel.axisKind)} in timeline`);
    region.setAttribute("role", "button");
    region.setAttribute("tabindex", "0");
    region.addEventListener("mouseenter", () => {
      showTarget(target);
    });
    region.addEventListener("mousemove", () => {
      showTarget(target);
    });
    region.addEventListener("focus", () => {
      showTarget(target);
    });
    region.addEventListener("mouseleave", () => {
      hideTarget();
    });
    region.addEventListener("blur", () => {
      hideTarget();
    });
    region.addEventListener("click", () => {
      onSelect?.({
        bucketKey: target.bucket.key,
        bucketLabel: formatBucketHeading(target.bucket, panel.axisKind),
        lineNumbers: target.lineNumbers.length > 0 ? target.lineNumbers : uniqueLineNumbers(target.bucket.lineNumbers)
      });
    });
    region.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      event.preventDefault();
      onSelect?.({
        bucketKey: target.bucket.key,
        bucketLabel: formatBucketHeading(target.bucket, panel.axisKind),
        lineNumbers: target.lineNumbers.length > 0 ? target.lineNumbers : uniqueLineNumbers(target.bucket.lineNumbers)
      });
    });
    overlay.appendChild(region);
  });
  svg.appendChild(overlay);
  panelEl.onmouseleave = () => {
    hideTarget();
  };
}
function renderLineChart(svg, panel, panelWidth, onSelect) {
  const { plotWidth, yForValue } = appendYAxis(svg, panel);
  const timestamps = panel.buckets.map((bucket) => bucket.timestamp).filter((value) => typeof value === "number");
  const minTimestamp = Math.min(...timestamps);
  const maxTimestamp = Math.max(...timestamps);
  const timeRange = maxTimestamp - minTimestamp || 1;
  const xForTimestamp = (timestamp) => PLOT_LEFT + (timestamp - minTimestamp) / timeRange * plotWidth;
  const colorClasses = colorClassBySeriesKey(panel);
  const visibleKeys = new Set(panel.series.map((series) => series.key));
  panel.series.forEach((series, index) => {
    if (series.points.length === 0) {
      return;
    }
    const pathData = series.points.filter((point) => point.timestamp !== null).map((point, pointIndex) => {
      const x = xForTimestamp(point.timestamp);
      const y = yForValue(point.value);
      return `${pointIndex === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
    if (pathData.length > 0) {
      svg.appendChild(
        createSvgEl("path", {
          class: `metrics-lens-chart-line ${colorClass(index)}`,
          d: pathData
        })
      );
    }
    series.points.forEach((point) => {
      if (point.timestamp === null) {
        return;
      }
      svg.appendChild(
        createSvgEl("circle", {
          class: `metrics-lens-chart-point ${colorClass(index)}`,
          cx: xForTimestamp(point.timestamp),
          cy: yForValue(point.value),
          r: 3
        })
      );
    });
  });
  const layout = xAxisLayout(panel, panelWidth, (bucket) => xForTimestamp(bucket.timestamp));
  appendXAxisLabels(svg, layout, panel.axisKind);
  const targets = lineHoverTargets(panel, xForTimestamp, visibleKeys, colorClasses);
  attachHoverTargets(svg.parentElement, svg, panel, targets, onSelect);
}
function renderBarChart(svg, panel, panelWidth, onSelect) {
  const { baselineValue, plotWidth, zeroY, yForValue } = appendYAxis(svg, panel);
  const seriesCount = Math.max(panel.series.length, 1);
  const bucketWidth = plotWidth / Math.max(panel.buckets.length, 1);
  const groupWidth = bucketWidth * 0.7;
  const barWidth = Math.max(groupWidth / seriesCount, 8);
  const colorClasses = colorClassBySeriesKey(panel);
  const visibleKeys = new Set(panel.series.map((series) => series.key));
  panel.buckets.forEach((bucket, bucketIndex) => {
    const groupStart = PLOT_LEFT + bucketIndex * bucketWidth + (bucketWidth - groupWidth) / 2;
    if (panel.stacked) {
      const segments = panel.stackSegments?.get(bucket.key) ?? [];
      let positiveTotal = 0;
      let negativeTotal = 0;
      segments.forEach((segment) => {
        const startValue = segment.value >= 0 ? positiveTotal : negativeTotal;
        const endValue = startValue + segment.value;
        if (segment.value >= 0) {
          positiveTotal = endValue;
        } else {
          negativeTotal = endValue;
        }
        const startY = yForValue(startValue);
        const endY = yForValue(endValue);
        svg.appendChild(
          createSvgEl("rect", {
            class: `metrics-lens-chart-bar is-stacked ${colorClasses.get(segment.key) ?? colorClass(0)}`,
            height: Math.abs(startY - endY),
            rx: 2,
            ry: 2,
            width: groupWidth,
            x: groupStart,
            y: Math.min(startY, endY)
          })
        );
      });
      return;
    }
    panel.series.forEach((series, seriesIndex) => {
      const point = series.points.find((entry) => entry.bucketKey === bucket.key);
      if (!point) {
        return;
      }
      const y = yForValue(point.value);
      svg.appendChild(
        createSvgEl("rect", {
          class: `metrics-lens-chart-bar ${colorClass(seriesIndex)}`,
          height: Math.abs(zeroY - y),
          rx: 2,
          ry: 2,
          width: barWidth,
          x: groupStart + seriesIndex * barWidth,
          y: Math.min(y, zeroY)
        })
      );
    });
  });
  appendBarChartGuideOverlay(svg, panel, plotWidth, yForValue, baselineValue);
  const layout = xAxisLayout(panel, panelWidth, (_bucket, index) => PLOT_LEFT + index * bucketWidth + bucketWidth / 2);
  appendXAxisLabels(svg, layout, panel.axisKind);
  const targets = barHoverTargets(panel, bucketWidth, visibleKeys, colorClasses);
  attachHoverTargets(svg.parentElement, svg, panel, targets, onSelect);
}
function renderLegend(container, panel, state, onChange) {
  container.empty();
  if (panel.series.length <= 1) {
    return;
  }
  panel.series.forEach((entry, index) => {
    const item = container.createDiv({ cls: "metrics-lens-chart-legend-item" });
    const isMuted = state.mutedSeriesKeys.has(entry.key);
    const isIsolated = state.isolatedSeriesKey === entry.key;
    const hasIsolation = state.isolatedSeriesKey !== null;
    item.toggleClass("is-muted", isMuted);
    item.toggleClass("is-isolated", isIsolated);
    item.toggleClass("is-dimmed", hasIsolation && !isIsolated);
    item.setAttribute("role", "button");
    item.tabIndex = 0;
    item.ariaLabel = "Click to isolate. Shift-click to mute.";
    item.createSpan({
      cls: ["metrics-lens-chart-legend-swatch", colorClass(index)]
    });
    item.createSpan({
      cls: "metrics-lens-chart-legend-label",
      text: entry.label
    });
    const toggleMute = () => {
      if (state.mutedSeriesKeys.has(entry.key)) {
        state.mutedSeriesKeys.delete(entry.key);
        onChange();
        return;
      }
      if (visibleSeriesCount(panel, state) <= 1) {
        return;
      }
      state.mutedSeriesKeys.add(entry.key);
      if (state.isolatedSeriesKey === entry.key) {
        state.isolatedSeriesKey = null;
      }
      onChange();
    };
    item.addEventListener("click", (event) => {
      if (event.shiftKey) {
        toggleMute();
        return;
      }
      if (state.isolatedSeriesKey === entry.key) {
        state.isolatedSeriesKey = null;
      } else {
        state.isolatedSeriesKey = entry.key;
        state.mutedSeriesKeys.delete(entry.key);
      }
      onChange();
    });
    item.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      event.preventDefault();
      if (event.shiftKey) {
        toggleMute();
        return;
      }
      if (state.isolatedSeriesKey === entry.key) {
        state.isolatedSeriesKey = null;
      } else {
        state.isolatedSeriesKey = entry.key;
        state.mutedSeriesKeys.delete(entry.key);
      }
      onChange();
    });
  });
}
function chartPanelTitle(panel) {
  const seriesLabels = panel.series.map((entry) => entry.label);
  const hasValueSeriesOnly = seriesLabels.length === 1 && seriesLabels[0] === "Value";
  if (panel.unitLabel && hasValueSeriesOnly) {
    return panel.unitLabel;
  }
  if (panel.unitLabel && seriesLabels.length === 1) {
    return `${seriesLabels[0]} (${panel.unitLabel})`;
  }
  if (panel.unitLabel && seriesLabels.length > 1) {
    return `${panel.unitLabel}: ${seriesLabels.join(", ")}`;
  }
  if (seriesLabels.length === 1) {
    return seriesLabels[0];
  }
  return seriesLabels.join(", ");
}
function renderPanel(container, panel, model, options) {
  const panelEl = container.createDiv({ cls: "metrics-lens-chart-panel" });
  if (model.panelCount > 1) {
    panelEl.createEl("p", {
      cls: "metrics-lens-chart-panel-title",
      text: chartPanelTitle(panel)
    });
  }
  const legendEl = panelEl.createDiv({ cls: "metrics-lens-chart-legend" });
  const state = {
    isolatedSeriesKey: null,
    mutedSeriesKeys: /* @__PURE__ */ new Set()
  };
  const renderCurrentPanel = () => {
    const current = displayPanel(panel, state);
    legendEl.empty();
    renderLegend(legendEl, panel, state, renderCurrentPanel);
    const existingSvg = panelEl.querySelector(".metrics-lens-chart-svg");
    const existingTooltip = panelEl.querySelector(".metrics-lens-chart-tooltip");
    existingSvg?.remove();
    existingTooltip?.remove();
    const svg = createSvgEl("svg", {
      class: "metrics-lens-chart-svg",
      viewBox: `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`
    });
    svg.setAttribute("aria-label", "Metrics chart");
    svg.setAttribute("role", "img");
    panelEl.appendChild(svg);
    const panelWidth = panelEl.getBoundingClientRect().width || CHART_WIDTH;
    if (current.kind === "line") {
      renderLineChart(svg, current, panelWidth, options?.onSelect);
    } else {
      renderBarChart(svg, current, panelWidth, options?.onSelect);
    }
  };
  renderCurrentPanel();
}
function renderMetricsChart(container, model, options) {
  const chartSection = container.createDiv({ cls: ["metrics-lens-section", "metrics-lens-chart"] });
  const panels = chartSection.createDiv({ cls: "metrics-lens-chart-panels" });
  model.panels.forEach((panel) => {
    renderPanel(panels, panel, model, options);
  });
}

// src/contract.ts
var METRIC_REFERENCE_PREFIX = "metric:";
function toMetricReference(id, prefix = METRIC_REFERENCE_PREFIX) {
  return `${prefix}${id}`;
}

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
function metricIconForKey(metricKey) {
  const candidates = getMetricIconCandidates(metricKey);
  const available = availableIconIds();
  for (const candidate of candidates) {
    if (available.has(candidate)) {
      return candidate;
    }
  }
  return candidates[0] ?? null;
}

// src/metrics-file-model.ts
var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
var ISO_TS_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;
var ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;
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
function formatAllowedUnits(units) {
  return units.map((unit) => `\`${unit}\``).join(", ");
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
    if (!hasKnownMetricKey(key)) {
      addIssue(row, {
        code: "unknown_key",
        field: "key",
        message: `Unknown metric key \`${key}\`.`,
        severity: "warning"
      });
    }
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
      if (!hasKnownMetricUnit(unit)) {
        addIssue(row, {
          code: "unknown_unit",
          field: "unit",
          message: `Unknown unit \`${unit}\`.`,
          severity: "warning"
        });
      } else {
        const keyValue = typeof row.metric?.key === "string" ? row.metric.key : null;
        const unitAllowed = isUnitAllowedForMetric(keyValue, unit);
        if (unitAllowed === false) {
          addIssue(row, {
            code: "unsupported_unit_for_key",
            field: "unit",
            message: `Metric key \`${keyValue}\` does not support unit \`${canonicalMetricUnit(unit) ?? unit}\`. Allowed units: ${formatAllowedUnits(getSupportedUnitsForMetric(keyValue))}.`,
            severity: "warning"
          });
        }
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
    const unit = normalizeMetricUnitKey(row.metric?.unit);
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
function formatMetricValue(row) {
  const value = row.metric?.value;
  const unit = row.metric?.unit;
  if (typeof value !== "number") {
    return null;
  }
  return formatMetricDisplayValue(value, unit, {
    includeUnit: true,
    metricKey: row.metric?.key,
    rawPrecision: rawValuePrecision(row.rawLine)
  });
}
function rowTimestamp2(row) {
  const ts = row.metric?.ts;
  if (typeof ts !== "string") {
    return null;
  }
  const parsed = Date.parse(ts);
  return Number.isNaN(parsed) ? null : parsed;
}
function rowDateValue2(row) {
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
  next.setHours(0, 0, 0, 0);
  return next;
}
function addMonths(date, months) {
  const next = new Date(date);
  const originalDay = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDayOfMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(originalDay, lastDayOfMonth));
  next.setHours(0, 0, 0, 0);
  return next;
}
function addYears(date, years) {
  return addMonths(date, years * 12);
}
function startOfMonth(date) {
  const next = new Date(date);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
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
    case "past-3-months":
      return {
        fromDate: toLocalDateString(addMonths(today, -3)),
        toDate: toLocalDateString(today)
      };
    case "past-6-months":
      return {
        fromDate: toLocalDateString(addMonths(today, -6)),
        toDate: toLocalDateString(today)
      };
    case "past-1-year":
      return {
        fromDate: toLocalDateString(addYears(today, -1)),
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
    displayMetricKey(row.metric?.key),
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
  const values = Array.from(
    new Set(
      rows.map((row) => row.metric?.[field]).filter((value) => typeof value === "string" && value.length > 0)
    )
  );
  return values.sort(
    (left, right) => field === "key" ? compareMetricKeys(left, right) : left.localeCompare(right)
  );
}
function withSelectedFilterValue(options, selected) {
  if (selected.length === 0 || options.includes(selected)) {
    return options;
  }
  return [selected, ...options];
}
function uniqueLineNumbers2(lineNumbers) {
  return Array.from(new Set(lineNumbers));
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
    const rowDate = rowDateValue2(row);
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
      const leftTimestamp = rowTimestamp2(left);
      const rightTimestamp = rowTimestamp2(right);
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
      const leftTimestamp = rowTimestamp2(left);
      const rightTimestamp = rowTimestamp2(right);
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
  return filterBarControlCount(viewState) > 0 || viewState.showChart !== DEFAULT_VIEW_STATE.showChart || viewState.sortOrder !== DEFAULT_VIEW_STATE.sortOrder;
}
function filterBarControlCount(viewState) {
  let count = 0;
  if (hasActiveTimeRange(viewState)) {
    count += 1;
  }
  if (viewState.key.length > 0) {
    count += 1;
  }
  if (viewState.searchText.trim().length > 0) {
    count += 1;
  }
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
function hasActiveTimeRange(viewState) {
  if (viewState.timeRange === "all") {
    return false;
  }
  if (viewState.timeRange === "custom") {
    return viewState.fromDate.length > 0 || viewState.toDate.length > 0;
  }
  return true;
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
    const day = rowDateValue2(row);
    const key = day ?? "__no_date__";
    const current = groups.get(key) ?? [];
    current.push(row);
    groups.set(key, current);
  });
  return Array.from(groups.entries()).map(([key, groupedRows2]) => ({
    heading: key === "__no_date__" ? "No date" : key,
    key,
    linkTarget: key === "__no_date__" ? void 0 : key,
    rows: groupedRows2
  }));
}
function groupRowsByField(rows, field) {
  const groups = /* @__PURE__ */ new Map();
  rows.forEach((row) => {
    const value = row.metric?.[field];
    const key = typeof value === "string" && value.length > 0 ? value : "__empty__";
    const current = groups.get(key) ?? [];
    current.push(row);
    groups.set(key, current);
  });
  return Array.from(groups.entries()).map(([key, groupedRows2]) => ({
    heading: key === "__empty__" ? field === "key" ? "No metric" : "No source" : field === "key" ? displayMetricKey(key) : key,
    key,
    rows: groupedRows2
  }));
}
function groupedRows(rows, groupBy) {
  switch (groupBy) {
    case "day":
      return groupRowsByDay(rows);
    case "key":
      return groupRowsByField(rows, "key");
    case "source":
      return groupRowsByField(rows, "source");
    case "none":
    default:
      return [];
  }
}
function groupBySummaryLabel(groupBy) {
  switch (groupBy) {
    case "day":
      return "grouped by day";
    case "key":
      return "grouped by metric";
    case "source":
      return "grouped by source";
    case "none":
    default:
      return null;
  }
}
function renderGroupHeading(container, group, plugin, sourcePath) {
  const heading = container.createEl("h2");
  if (!group.linkTarget) {
    heading.setText(group.heading);
    return;
  }
  const linkTarget = group.linkTarget;
  const link = heading.createEl("a", {
    cls: "internal-link",
    href: linkTarget,
    text: group.heading
  });
  link.dataset.href = linkTarget;
  link.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    void plugin.app.workspace.openLinkText(linkTarget, sourcePath);
  });
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
  rowEl.dataset.metricsLineNumber = String(row.lineNumber);
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
  const metricKeyLabel = displayMetricKey(row.metric?.key);
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
  const metricKeyEl = main.createSpan({
    cls: "metrics-lens-record-key",
    text: metricKeyLabel
  });
  if (typeof row.metric?.key === "string" && row.metric.key !== metricKeyLabel) {
    metricKeyEl.setAttribute("title", row.metric.key);
  }
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
  menuButton.setAttribute("aria-label", `More actions for ${metricKeyLabel}`);
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
  addRecordActionEl = null;
  actionsSeparatorEl = null;
  chartActionEl = null;
  clearTargetedRecordTimeout = null;
  fileActionsActionEl = null;
  filterActionEl = null;
  pendingControlFocus = null;
  pendingMetricIdFocus = null;
  sortActionEl = null;
  viewState = createDefaultViewState();
  viewActionSeparatorEl = null;
  viewStateFilePath = null;
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
    this.ensureHeaderActions();
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
    if (this.file) {
      this.viewStateFilePath = this.file.path;
    }
    const { showChart, showFilters } = this.viewState;
    this.viewState = createDefaultViewState();
    this.viewState.showChart = showChart;
    this.viewState.showFilters = showFilters;
    this.advancedControlsExpanded = false;
    this.pendingMetricIdFocus = metricId;
    this.render();
  }
  ensureHeaderActions() {
    if (!this.fileActionsActionEl) {
      this.fileActionsActionEl = this.addAction("files", "Metrics file actions", () => {
        const actionEl = this.fileActionsActionEl;
        const rect = actionEl?.getBoundingClientRect();
        this.plugin.openMetricsFileActionsMenu(this.file, rect ?? void 0);
      });
    }
    if (!this.sortActionEl) {
      this.sortActionEl = this.addAction("arrow-up-down", "Sort metrics", () => {
        if (!this.file) {
          new import_obsidian5.Notice("Open a metrics file first.");
          return;
        }
        this.openSortMenu(this.sortActionEl);
      });
    }
    if (!this.filterActionEl) {
      this.filterActionEl = this.addAction("filter", "Hide filters", () => {
        if (!this.file) {
          new import_obsidian5.Notice("Open a metrics file first.");
          return;
        }
        this.viewState.showFilters = !this.viewState.showFilters;
        this.persistCurrentViewState();
        this.render();
      });
    }
    if (!this.chartActionEl) {
      this.chartActionEl = this.addAction("chart-line", "Show chart", () => {
        if (!this.file) {
          new import_obsidian5.Notice("Open a metrics file first.");
          return;
        }
        this.viewState.showChart = !this.viewState.showChart;
        this.persistCurrentViewState();
        this.render();
      });
    }
    if (!this.addRecordActionEl) {
      this.addRecordActionEl = this.addAction("plus", "Add record", () => {
        if (!this.file) {
          new import_obsidian5.Notice("Open a metrics file first.");
          return;
        }
        this.plugin.openCreateRecordModal(this.file);
      });
    }
    if (this.addRecordActionEl && this.chartActionEl && this.filterActionEl && this.sortActionEl && this.fileActionsActionEl && this.addRecordActionEl.parentElement) {
      const actionsContainer = this.addRecordActionEl.parentElement;
      if (!this.viewActionSeparatorEl) {
        this.viewActionSeparatorEl = actionsContainer.createDiv({
          cls: "metrics-lens-view-action-separator"
        });
      }
      if (!this.actionsSeparatorEl) {
        this.actionsSeparatorEl = actionsContainer.createDiv({
          cls: "metrics-lens-view-action-separator"
        });
      }
      [
        this.addRecordActionEl,
        this.viewActionSeparatorEl,
        this.chartActionEl,
        this.filterActionEl,
        this.sortActionEl,
        this.actionsSeparatorEl,
        this.fileActionsActionEl
      ].forEach((element) => {
        actionsContainer.appendChild(element);
      });
    }
    this.syncHeaderActions();
  }
  syncHeaderActions() {
    const activeFilterBarControls = filterBarControlCount(this.viewState);
    const filtersAriaLabel = this.viewState.showFilters ? activeFilterBarControls > 0 ? `Hide filters (${activeFilterBarControls} active)` : "Hide filters" : activeFilterBarControls > 0 ? `Show filters (${activeFilterBarControls} active)` : "Show filters";
    if (this.fileActionsActionEl) {
      this.fileActionsActionEl.setAttribute("aria-label", "Metrics file actions");
      this.fileActionsActionEl.setAttribute("data-tooltip-position", "bottom");
    }
    if (this.chartActionEl) {
      this.chartActionEl.toggleClass("is-active", this.viewState.showChart);
      this.chartActionEl.setAttribute(
        "aria-label",
        this.viewState.showChart ? "Hide chart" : "Show chart"
      );
      this.chartActionEl.setAttribute("data-tooltip-position", "bottom");
    }
    if (this.filterActionEl) {
      this.filterActionEl.toggleClass("is-active", this.viewState.showFilters);
      (0, import_obsidian5.setIcon)(this.filterActionEl, activeFilterBarControls > 0 ? "list-filter" : "filter");
      this.filterActionEl.setAttribute("aria-label", filtersAriaLabel);
      this.filterActionEl.setAttribute("data-tooltip-position", "bottom");
    }
    if (this.sortActionEl) {
      this.sortActionEl.toggleClass(
        "is-active",
        this.viewState.sortOrder !== DEFAULT_VIEW_STATE.sortOrder
      );
      this.sortActionEl.setAttribute(
        "aria-label",
        `Sort metrics: ${this.sortOrderLabel(this.viewState.sortOrder)}`
      );
      this.sortActionEl.setAttribute("data-tooltip-position", "bottom");
    }
    if (this.addRecordActionEl) {
      this.addRecordActionEl.setAttribute("aria-label", "Add record");
      this.addRecordActionEl.setAttribute("data-tooltip-position", "bottom");
    }
  }
  openSortMenu(anchorEl) {
    const menu = new import_obsidian5.Menu();
    [
      { label: "Newest first", value: "newest" },
      { label: "Oldest first", value: "oldest" },
      { label: "Value high-low", value: "value-desc" },
      { label: "Value low-high", value: "value-asc" }
    ].forEach((option) => {
      menu.addItem((item) => {
        item.setTitle(option.label).setChecked(this.viewState.sortOrder === option.value).onClick(() => {
          this.viewState.sortOrder = option.value;
          this.persistCurrentViewState();
          this.render();
        });
      });
    });
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      menu.showAtPosition({
        overlap: true,
        width: rect.width,
        x: rect.left,
        y: rect.bottom
      });
      return;
    }
    menu.showAtPosition({
      x: window.innerWidth / 2,
      y: 80
    });
  }
  persistCurrentViewState() {
    this.plugin.persistViewState(this.viewStateFilePath, this.viewState, this.advancedControlsExpanded);
  }
  resetCurrentViewState() {
    this.viewState = createDefaultViewState();
    this.advancedControlsExpanded = false;
    this.plugin.resetPersistedViewState(this.viewStateFilePath);
  }
  renderChart(container, visibleRows) {
    if (!this.viewState.showChart || visibleRows.length === 0) {
      return;
    }
    const chartModel = buildMetricsChartModel(visibleRows, this.viewState.groupBy);
    if (!chartModel) {
      return;
    }
    renderMetricsChart(container, chartModel, {
      onSelect: (selection) => {
        this.focusChartSelection(selection);
      }
    });
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
    const currentFile = this.file;
    if (this.viewStateFilePath !== currentFile.path) {
      const persistedViewState = this.plugin.getPersistedViewState(currentFile.path);
      this.advancedControlsExpanded = persistedViewState.advancedControlsExpanded;
      this.viewState = persistedViewState.viewState;
      this.viewStateFilePath = currentFile.path;
    }
    const analysis = analyzeMetricsData(this.data ?? "");
    const availableKeys = withSelectedFilterValue(
      collectFilterValues(analysis.rows, "key"),
      this.viewState.key
    );
    const availableSources = withSelectedFilterValue(
      collectFilterValues(analysis.rows, "source"),
      this.viewState.source
    );
    const normalizedViewState = this.normalizeViewState();
    if (normalizedViewState) {
      this.persistCurrentViewState();
    }
    const visibleRows = applyMetricsViewState(analysis.rows, this.viewState);
    const hasActiveControls = hasActiveViewControls(this.viewState);
    this.syncHeaderActions();
    this.renderChart(container, visibleRows);
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
    } else {
      const recordsSection = container.createDiv({ cls: "metrics-lens-section" });
      if (this.viewState.groupBy !== "none") {
        groupedRows(visibleRows, this.viewState.groupBy).forEach((group) => {
          const groupSection = recordsSection.createDiv({ cls: "metrics-lens-group" });
          const headingContainer = groupSection.createDiv({
            cls: ["metrics-lens-group-heading", "markdown-reading-view"]
          });
          renderGroupHeading(headingContainer, group, this.plugin, currentFile.path);
          const recordsList = groupSection.createDiv({ cls: "metrics-lens-records" });
          group.rows.forEach((row, index) => {
            renderRecord(
              recordsList,
              row,
              this.plugin,
              currentFile,
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
            currentFile,
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
    const groupingLabel = groupBySummaryLabel(this.viewState.groupBy);
    if (groupingLabel) {
      summaryParts.push(groupingLabel);
    }
    const footer = container.createDiv({ cls: "metrics-lens-footer" });
    footer.createSpan({
      cls: "metrics-lens-file-meta",
      text: `${currentFile.path} \xB7 ${summaryParts.join(" \xB7 ")}`
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
    if (!this.viewState.showFilters) {
      return;
    }
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
      { label: "Past 3 months", value: "past-3-months" },
      { label: "Past 6 months", value: "past-6-months" },
      { label: "Past 1 year", value: "past-1-year" },
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
      this.persistCurrentViewState();
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
        this.persistCurrentViewState();
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
        this.persistCurrentViewState();
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
      const option = keySelect.createEl("option", {
        text: displayMetricOption(key),
        value: key
      });
      option.title = key;
    });
    keySelect.value = this.viewState.key;
    keySelect.addEventListener("change", () => {
      this.pendingControlFocus = { name: "key" };
      this.viewState.key = keySelect.value;
      this.persistCurrentViewState();
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
      this.persistCurrentViewState();
      this.render();
    });
    if (hasActiveViewControls(this.viewState)) {
      const resetButton = primaryControls.createEl("button", {
        cls: ["clickable-icon", "metrics-lens-icon-button", "metrics-lens-reset-view-button"]
      });
      resetButton.type = "button";
      resetButton.dataset.metricsControl = "reset";
      resetButton.setAttribute("aria-label", "Reset current filters and sorting");
      resetButton.setAttribute("data-tooltip-position", "top");
      (0, import_obsidian5.setIcon)(resetButton, "filter-x");
      resetButton.addEventListener("click", () => {
        this.resetCurrentViewState();
        this.render();
      });
    }
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
      this.persistCurrentViewState();
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
        this.persistCurrentViewState();
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
        this.persistCurrentViewState();
        this.render();
      });
      const groupBySelect = advancedControls.createEl("select", { cls: "metrics-lens-control" });
      groupBySelect.dataset.metricsControl = "groupBy";
      groupBySelect.setAttribute("aria-label", "Group metrics");
      [
        { label: "No grouping", value: "none" },
        { label: "Group by day", value: "day" },
        { label: "Group by metric", value: "key" },
        { label: "Group by source", value: "source" }
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
        this.persistCurrentViewState();
        this.render();
      });
    }
  }
  normalizeViewState() {
    let changed = false;
    if (this.viewState.timeRange === "custom" && this.viewState.fromDate && this.viewState.toDate && this.viewState.fromDate > this.viewState.toDate) {
      const nextFromDate = this.viewState.toDate;
      this.viewState.toDate = this.viewState.fromDate;
      this.viewState.fromDate = nextFromDate;
      changed = true;
    }
    return changed;
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
    this.highlightRecordElements([targetEl]);
  }
  focusChartSelection(selection) {
    const targetElements = uniqueLineNumbers2(selection.lineNumbers).map(
      (lineNumber) => this.contentEl.querySelector(`[data-metrics-line-number="${lineNumber}"]`)
    ).filter((element) => element !== null);
    if (targetElements.length === 0) {
      new import_obsidian5.Notice(`No visible rows matched ${selection.bucketLabel}.`);
      return;
    }
    this.highlightRecordElements(targetElements);
  }
  highlightRecordElements(targetElements) {
    if (targetElements.length === 0) {
      return;
    }
    if (this.clearTargetedRecordTimeout !== null) {
      window.clearTimeout(this.clearTargetedRecordTimeout);
      this.clearTargetedRecordTimeout = null;
    }
    this.contentEl.querySelectorAll(".metrics-lens-record.is-targeted").forEach((element) => element.removeClass("is-targeted"));
    targetElements.forEach((element) => {
      element.addClass("is-targeted");
    });
    const firstTarget = targetElements[0];
    if (!firstTarget) {
      return;
    }
    firstTarget.scrollIntoView({
      block: "center",
      behavior: "smooth"
    });
    firstTarget.focus({ preventScroll: true });
    this.clearTargetedRecordTimeout = window.setTimeout(() => {
      targetElements.forEach((element) => {
        element.removeClass("is-targeted");
      });
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
  persistViewStateTimer = null;
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
      id: "new-file",
      name: "New metrics file",
      callback: () => {
        this.openCreateMetricsFileModal();
      }
    });
    this.addCommand({
      id: "rename-current-file",
      name: "Rename current metrics file",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || !this.isMetricsFile(file)) {
          return false;
        }
        if (!checking) {
          this.openRenameMetricsFileModal(file);
        }
        return true;
      }
    });
    this.addCommand({
      id: "delete-current-file",
      name: "Delete current metrics file",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || !this.isMetricsFile(file)) {
          return false;
        }
        if (!checking) {
          this.confirmDeleteMetricsFile(file);
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
    this.registerEvent(this.app.vault.on("create", () => this.refreshOpenMetricsViews()));
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        this.forgetPersistedViewStateForPath(file.path);
        void this.resetDeletedMetricsLeaves(file.path);
        this.refreshOpenMetricsViews();
      })
    );
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        if (file instanceof import_obsidian6.TFile) {
          this.handleMetricsFileRename(file, oldPath);
        } else if (this.isMetricsPath((0, import_obsidian6.normalizePath)(oldPath))) {
          this.forgetPersistedViewStateForPath(oldPath);
        }
        this.refreshOpenMetricsViews();
      })
    );
    this.app.workspace.onLayoutReady(() => {
      const activeFile = this.app.workspace.getActiveFile();
      this.queueAutoOpen(activeFile, this.app.workspace.activeLeaf);
      this.installFileExplorerObserver();
      this.queueFileExplorerLabelSync();
    });
  }
  async onunload() {
    if (this.persistViewStateTimer !== null) {
      window.clearTimeout(this.persistViewStateTimer);
      this.persistViewStateTimer = null;
      await this.saveSettings();
    }
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
  getPersistedViewState(filePath) {
    if (!filePath) {
      return {
        advancedControlsExpanded: false,
        viewState: createDefaultViewState()
      };
    }
    const persistedViewState = this.settings.persistedViewStateByPath[filePath];
    if (!persistedViewState) {
      return {
        advancedControlsExpanded: false,
        viewState: createDefaultViewState()
      };
    }
    const { advancedControlsExpanded, viewState } = persistedViewState;
    return {
      advancedControlsExpanded,
      viewState: normalizeMetricsViewState(viewState)
    };
  }
  persistViewState(filePath, viewState, advancedControlsExpanded) {
    if (!filePath) {
      return;
    }
    this.settings.persistedViewStateByPath[filePath] = {
      advancedControlsExpanded,
      viewState: normalizeMetricsViewState(viewState)
    };
    this.queuePersistedViewStateSave();
  }
  resetPersistedViewState(filePath) {
    if (!filePath) {
      return;
    }
    delete this.settings.persistedViewStateByPath[filePath];
    this.queuePersistedViewStateSave();
  }
  forgetPersistedViewStateForPath(filePath) {
    if (!filePath || !(filePath in this.settings.persistedViewStateByPath)) {
      return;
    }
    delete this.settings.persistedViewStateByPath[filePath];
    this.queuePersistedViewStateSave();
  }
  movePersistedViewState(oldPath, newPath) {
    const persisted = this.settings.persistedViewStateByPath[oldPath];
    if (!persisted) {
      return;
    }
    this.settings.persistedViewStateByPath[newPath] = persisted;
    delete this.settings.persistedViewStateByPath[oldPath];
    this.queuePersistedViewStateSave();
  }
  queuePersistedViewStateSave() {
    if (this.persistViewStateTimer !== null) {
      window.clearTimeout(this.persistViewStateTimer);
    }
    this.persistViewStateTimer = window.setTimeout(() => {
      this.persistViewStateTimer = null;
      void this.saveSettings();
    }, 200);
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
  openCreateMetricsFileModal(initialValue = "") {
    const modal = new MetricsFileModal(
      this.app,
      {
        description: `Create a metrics file under ${this.settings.metricsRoot}. You can enter a nested relative path, and ${this.primaryMetricsExtension()} will be added when missing.`,
        fieldLabel: "Path",
        initialValue,
        placeholder: `All${this.primaryMetricsExtension()}`,
        submitLabel: "Create file",
        title: "New metrics file"
      },
      (value) => {
        void this.createMetricsFile(value);
      }
    );
    modal.open();
  }
  openRenameMetricsFileModal(file) {
    const modal = new MetricsFileModal(
      this.app,
      {
        description: `Rename this metrics file within ${this.settings.metricsRoot}. You can enter a nested relative path, and ${this.primaryMetricsExtension()} will be added when missing.`,
        fieldLabel: "Path",
        initialValue: this.relativeMetricsPath(file.path, { stripExtension: true }),
        placeholder: logicalMetricsBaseName(file.name, this.settings.supportedExtensions),
        submitLabel: "Rename file",
        title: `Rename ${logicalMetricsBaseName(file.name, this.settings.supportedExtensions)}`
      },
      (value) => {
        void this.renameMetricsFile(file, value);
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
  openMetricsFileActionsMenu(file, position) {
    const menu = new import_obsidian6.Menu();
    menu.addItem((item) => {
      item.setTitle("New metrics file").setIcon("file-plus").onClick(() => {
        const initialValue = file && this.isMetricsFile(file) ? this.relativeMetricsFolderPath(file.path) : "";
        this.openCreateMetricsFileModal(initialValue);
      });
    });
    menu.addSeparator();
    menu.addItem((item) => {
      item.setTitle("Rename current file").setIcon("pencil").setDisabled(!file).onClick(() => {
        if (!file) {
          return;
        }
        this.openRenameMetricsFileModal(file);
      });
    });
    menu.addItem((item) => {
      item.setTitle("Delete current file").setIcon("trash").setDisabled(!file).setWarning(true).onClick(() => {
        if (!file) {
          return;
        }
        this.confirmDeleteMetricsFile(file);
      });
    });
    if (position) {
      menu.showAtPosition({
        overlap: true,
        width: position.width,
        x: position.left,
        y: position.bottom
      });
      return;
    }
    menu.showAtPosition({
      x: window.innerWidth / 2,
      y: 80
    });
  }
  async createMetricsFile(input) {
    try {
      const path = this.resolveMetricsFilePath(input);
      const existing = this.app.vault.getAbstractFileByPath(path);
      if (existing) {
        new import_obsidian6.Notice(`A file already exists at ${path}.`);
        return;
      }
      await this.ensureParentFolder(path);
      const file = await this.app.vault.create(path, "");
      new import_obsidian6.Notice(`Created ${file.path}.`);
      const targetLeaf = this.app.workspace.getLeavesOfType(METRICS_VIEW_TYPE)[0] ?? this.app.workspace.getRightLeaf(false) ?? this.app.workspace.activeLeaf;
      await this.openMetricsFile(
        file,
        targetLeaf
      );
      this.refreshOpenMetricsViews();
    } catch (error) {
      this.handleMutationError(error);
    }
  }
  async renameMetricsFile(file, input) {
    try {
      const nextPath = this.resolveMetricsFilePath(input, {
        baseFolderPath: file.parent?.path ?? this.settings.metricsRoot
      });
      if (nextPath === file.path) {
        return;
      }
      const existing = this.app.vault.getAbstractFileByPath(nextPath);
      if (existing && existing !== file) {
        new import_obsidian6.Notice(`A file already exists at ${nextPath}.`);
        return;
      }
      await this.ensureParentFolder(nextPath);
      const previousPath = file.path;
      await this.app.fileManager.renameFile(file, nextPath);
      this.movePersistedViewState(previousPath, nextPath);
      new import_obsidian6.Notice(`Renamed metrics file to ${nextPath}.`);
    } catch (error) {
      this.handleMutationError(error);
    }
  }
  confirmDeleteMetricsFile(file) {
    if (!window.confirm(`Delete ${file.name}?`)) {
      return;
    }
    void this.deleteMetricsFile(file);
  }
  async deleteMetricsFile(file) {
    try {
      const path = file.path;
      await this.app.vault.trash(file, true);
      this.forgetPersistedViewStateForPath(path);
      await this.resetDeletedMetricsLeaves(path);
      new import_obsidian6.Notice(`Deleted ${path}.`);
      this.refreshOpenMetricsViews();
    } catch (error) {
      this.handleMutationError(error);
    }
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
  handleMetricsFileRename(file, oldPath) {
    const normalizedOldPath = (0, import_obsidian6.normalizePath)(oldPath);
    if (this.isMetricsPath(normalizedOldPath)) {
      if (this.isMetricsFile(file)) {
        this.movePersistedViewState(normalizedOldPath, file.path);
      } else {
        this.forgetPersistedViewStateForPath(normalizedOldPath);
      }
    }
  }
  primaryMetricsExtension() {
    return this.settings.supportedExtensions[0] ?? DEFAULT_SETTINGS.supportedExtensions[0] ?? ".metrics.ndjson";
  }
  hasSupportedExtension(path) {
    return this.settings.supportedExtensions.some((extension) => path.endsWith(extension));
  }
  isWithinMetricsRoot(path) {
    const metricsRoot = (0, import_obsidian6.normalizePath)(this.settings.metricsRoot);
    return path === metricsRoot || path.startsWith(`${metricsRoot}/`);
  }
  resolveMetricsFilePath(input, options) {
    const normalizedInput = (0, import_obsidian6.normalizePath)(input.trim());
    let path = normalizedInput;
    if (!this.hasSupportedExtension(path)) {
      path = `${path}${this.primaryMetricsExtension()}`;
    }
    if (!this.isWithinMetricsRoot(path)) {
      const baseFolder = (0, import_obsidian6.normalizePath)(options?.baseFolderPath ?? this.settings.metricsRoot);
      path = (0, import_obsidian6.normalizePath)(`${baseFolder}/${path}`);
    }
    if (!this.isWithinMetricsRoot(path) || path === (0, import_obsidian6.normalizePath)(this.settings.metricsRoot)) {
      throw new MetricsMutationError(
        `Metrics files must stay inside ${this.settings.metricsRoot}.`,
        "invalid_metrics_path"
      );
    }
    return path;
  }
  relativeMetricsPath(path, options) {
    const metricsRoot = (0, import_obsidian6.normalizePath)(this.settings.metricsRoot);
    let relativePath = path.startsWith(`${metricsRoot}/`) ? path.slice(metricsRoot.length + 1) : path;
    if (options?.stripExtension) {
      const matchingExtension = this.settings.supportedExtensions.find(
        (extension) => relativePath.endsWith(extension)
      );
      if (matchingExtension) {
        relativePath = relativePath.slice(0, -matchingExtension.length);
      }
    }
    return relativePath;
  }
  relativeMetricsFolderPath(path) {
    const relativePath = this.relativeMetricsPath(path);
    const separatorIndex = relativePath.lastIndexOf("/");
    if (separatorIndex === -1) {
      return "";
    }
    return relativePath.slice(0, separatorIndex + 1);
  }
  async ensureParentFolder(path) {
    const parentPath = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
    if (parentPath.length === 0) {
      return;
    }
    await this.ensureFolderPath(parentPath);
  }
  async ensureFolderPath(path) {
    const normalizedPath = (0, import_obsidian6.normalizePath)(path);
    if (normalizedPath.length === 0) {
      return;
    }
    const existing = this.app.vault.getAbstractFileByPath(normalizedPath);
    if (existing instanceof import_obsidian6.TFolder) {
      return;
    }
    if (existing instanceof import_obsidian6.TFile) {
      throw new MetricsMutationError(`${normalizedPath} already exists as a file.`, "path_conflict");
    }
    const parentPath = normalizedPath.includes("/") ? normalizedPath.slice(0, normalizedPath.lastIndexOf("/")) : "";
    if (parentPath.length > 0) {
      await this.ensureFolderPath(parentPath);
    }
    await this.app.vault.createFolder(normalizedPath);
  }
  async resetDeletedMetricsLeaves(path) {
    const leaves = this.app.workspace.getLeavesOfType(METRICS_VIEW_TYPE);
    for (const leaf of leaves) {
      const view = leaf.view;
      if (!(view instanceof MetricsFileView) || view.file?.path !== path) {
        continue;
      }
      await leaf.setViewState({
        active: leaf === this.app.workspace.activeLeaf,
        type: METRICS_VIEW_TYPE
      });
    }
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
