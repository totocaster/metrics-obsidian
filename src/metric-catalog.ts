import metricCatalogData from "./metric-catalog.json";

export interface MetricCatalogCategory {
  iconCandidates?: string[];
  label: string;
}

export interface MetricCatalogMetric {
  allowedUnits: string[];
  category: string;
  defaultUnit?: string;
  fractionDigits?: number;
  iconCandidates?: string[];
  label: string;
}

export interface MetricCatalogUnit {
  aliases?: string[];
  display?: string;
  durationUnit?: "h" | "min" | "s";
  fractionDigits?: number;
  label: string;
}

export interface MetricCatalogDefinition {
  categories: Record<string, MetricCatalogCategory>;
  metrics: Record<string, MetricCatalogMetric>;
  units: Record<string, MetricCatalogUnit>;
  version: number;
}

export interface CustomMetricCatalogDefinition {
  categories: Record<string, Partial<MetricCatalogCategory>>;
  metrics: Record<string, Partial<MetricCatalogMetric>>;
  schemaVersion: 1;
  units: Record<string, Partial<MetricCatalogUnit>>;
}

export type MetricNameDisplayMode = "friendly" | "key";

const DEFAULT_ICON_CANDIDATES = ["activity"];
const CUSTOM_CATALOG_SCHEMA_VERSION = 1;

interface MetricCatalogState {
  catalog: MetricCatalogDefinition;
  metricKeys: string[];
  unitKeys: string[];
  unitKeysByAlias: Map<string, string>;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trimToNull(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeLookupValue(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ),
  );
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeFractionDigits(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return undefined;
  }

  return Math.round(value);
}

function normalizeDurationUnit(value: unknown): "h" | "min" | "s" | undefined {
  return value === "h" || value === "min" || value === "s" ? value : undefined;
}

function cloneCategory(category: MetricCatalogCategory): MetricCatalogCategory {
  const cloned: MetricCatalogCategory = { label: category.label };
  if (category.iconCandidates) {
    cloned.iconCandidates = [...category.iconCandidates];
  }
  return cloned;
}

function cloneMetric(metric: MetricCatalogMetric): MetricCatalogMetric {
  const cloned: MetricCatalogMetric = {
    allowedUnits: [...metric.allowedUnits],
    category: metric.category,
    label: metric.label,
  };

  if (metric.defaultUnit) {
    cloned.defaultUnit = metric.defaultUnit;
  }
  if (typeof metric.fractionDigits === "number") {
    cloned.fractionDigits = metric.fractionDigits;
  }
  if (metric.iconCandidates) {
    cloned.iconCandidates = [...metric.iconCandidates];
  }

  return cloned;
}

function cloneUnit(unit: MetricCatalogUnit): MetricCatalogUnit {
  const cloned: MetricCatalogUnit = { label: unit.label };
  if (unit.aliases) {
    cloned.aliases = [...unit.aliases];
  }
  if (unit.display) {
    cloned.display = unit.display;
  }
  if (unit.durationUnit) {
    cloned.durationUnit = unit.durationUnit;
  }
  if (typeof unit.fractionDigits === "number") {
    cloned.fractionDigits = unit.fractionDigits;
  }

  return cloned;
}

function cloneCatalogDefinition(catalog: MetricCatalogDefinition): MetricCatalogDefinition {
  return {
    categories: Object.fromEntries(
      Object.entries(catalog.categories).map(([key, category]) => [key, cloneCategory(category)]),
    ),
    metrics: Object.fromEntries(
      Object.entries(catalog.metrics).map(([key, metric]) => [key, cloneMetric(metric)]),
    ),
    units: Object.fromEntries(
      Object.entries(catalog.units).map(([key, unit]) => [key, cloneUnit(unit)]),
    ),
    version: catalog.version,
  };
}

function normalizeCustomCategories(value: unknown): Record<string, Partial<MetricCatalogCategory>> {
  if (!isObjectRecord(value)) {
    return {};
  }

  const categories: Record<string, Partial<MetricCatalogCategory>> = {};
  Object.entries(value).forEach(([rawKey, rawCategory]) => {
    if (!isObjectRecord(rawCategory)) {
      return;
    }

    const key = rawKey.trim();
    if (!key) {
      return;
    }

    const category: Partial<MetricCatalogCategory> = {};
    const label = normalizeOptionalString(rawCategory.label);
    const iconCandidates = normalizeStringArray(rawCategory.iconCandidates);
    if (label) {
      category.label = label;
    }
    if (iconCandidates) {
      category.iconCandidates = iconCandidates;
    }

    if (Object.keys(category).length > 0) {
      categories[key] = category;
    }
  });

  return categories;
}

function normalizeCustomMetrics(value: unknown): Record<string, Partial<MetricCatalogMetric>> {
  if (!isObjectRecord(value)) {
    return {};
  }

  const metrics: Record<string, Partial<MetricCatalogMetric>> = {};
  Object.entries(value).forEach(([rawKey, rawMetric]) => {
    if (!isObjectRecord(rawMetric)) {
      return;
    }

    const key = rawKey.trim();
    if (!key) {
      return;
    }

    const metric: Partial<MetricCatalogMetric> = {};
    const allowedUnits = normalizeStringArray(rawMetric.allowedUnits);
    const category = normalizeOptionalString(rawMetric.category);
    const defaultUnit = normalizeOptionalString(rawMetric.defaultUnit);
    const fractionDigits = normalizeFractionDigits(rawMetric.fractionDigits);
    const iconCandidates = normalizeStringArray(rawMetric.iconCandidates);
    const label = normalizeOptionalString(rawMetric.label);

    if (allowedUnits) {
      metric.allowedUnits = allowedUnits;
    }
    if (category) {
      metric.category = category;
    }
    if (defaultUnit) {
      metric.defaultUnit = defaultUnit;
    }
    if (typeof fractionDigits === "number") {
      metric.fractionDigits = fractionDigits;
    }
    if (iconCandidates) {
      metric.iconCandidates = iconCandidates;
    }
    if (label) {
      metric.label = label;
    }

    if (Object.keys(metric).length > 0) {
      metrics[key] = metric;
    }
  });

  return metrics;
}

function normalizeCustomUnits(value: unknown): Record<string, Partial<MetricCatalogUnit>> {
  if (!isObjectRecord(value)) {
    return {};
  }

  const units: Record<string, Partial<MetricCatalogUnit>> = {};
  Object.entries(value).forEach(([rawKey, rawUnit]) => {
    if (!isObjectRecord(rawUnit)) {
      return;
    }

    const key = rawKey.trim();
    if (!key) {
      return;
    }

    const unit: Partial<MetricCatalogUnit> = {};
    const aliases = normalizeStringArray(rawUnit.aliases);
    const display = normalizeOptionalString(rawUnit.display);
    const durationUnit = normalizeDurationUnit(rawUnit.durationUnit);
    const fractionDigits = normalizeFractionDigits(rawUnit.fractionDigits);
    const label = normalizeOptionalString(rawUnit.label);

    if (aliases) {
      unit.aliases = aliases;
    }
    if (display) {
      unit.display = display;
    }
    if (durationUnit) {
      unit.durationUnit = durationUnit;
    }
    if (typeof fractionDigits === "number") {
      unit.fractionDigits = fractionDigits;
    }
    if (label) {
      unit.label = label;
    }

    if (Object.keys(unit).length > 0) {
      units[key] = unit;
    }
  });

  return units;
}

function ensureCategory(key: string, category: Partial<MetricCatalogCategory>): MetricCatalogCategory {
  if (!category.label) {
    throw new Error(`Custom catalog category \`${key}\` requires a non-empty label.`);
  }

  const normalized: MetricCatalogCategory = { label: category.label };
  if (category.iconCandidates) {
    normalized.iconCandidates = [...category.iconCandidates];
  }

  return normalized;
}

function ensureMetric(key: string, metric: Partial<MetricCatalogMetric>): MetricCatalogMetric {
  if (!metric.label) {
    throw new Error(`Custom catalog metric \`${key}\` requires a non-empty label.`);
  }
  if (!metric.category) {
    throw new Error(`Custom catalog metric \`${key}\` requires a category.`);
  }
  if (!metric.allowedUnits || metric.allowedUnits.length === 0) {
    throw new Error(`Custom catalog metric \`${key}\` requires at least one allowed unit.`);
  }

  const normalized: MetricCatalogMetric = {
    allowedUnits: [...metric.allowedUnits],
    category: metric.category,
    label: metric.label,
  };

  if (metric.defaultUnit) {
    normalized.defaultUnit = metric.defaultUnit;
  }
  if (typeof metric.fractionDigits === "number") {
    normalized.fractionDigits = metric.fractionDigits;
  }
  if (metric.iconCandidates) {
    normalized.iconCandidates = [...metric.iconCandidates];
  }

  return normalized;
}

function ensureUnit(key: string, unit: Partial<MetricCatalogUnit>): MetricCatalogUnit {
  if (!unit.label) {
    throw new Error(`Custom catalog unit \`${key}\` requires a non-empty label.`);
  }

  const normalized: MetricCatalogUnit = { label: unit.label };
  if (unit.aliases) {
    normalized.aliases = [...unit.aliases];
  }
  if (unit.display) {
    normalized.display = unit.display;
  }
  if (unit.durationUnit) {
    normalized.durationUnit = unit.durationUnit;
  }
  if (typeof unit.fractionDigits === "number") {
    normalized.fractionDigits = unit.fractionDigits;
  }

  return normalized;
}

function validateMetricCatalog(data: MetricCatalogDefinition): MetricCatalogDefinition {
  const categories = new Set(Object.keys(data.categories));
  const units = new Set(Object.keys(data.units));
  const seenAliases = new Map<string, string>();

  Object.entries(data.categories).forEach(([categoryKey, category]) => {
    if (!category.label?.trim()) {
      throw new Error(`Metric catalog category \`${categoryKey}\` must have a non-empty label.`);
    }
  });

  Object.entries(data.units).forEach(([unitKey, unit]) => {
    if (!unit.label?.trim()) {
      throw new Error(`Metric catalog unit \`${unitKey}\` must have a non-empty label.`);
    }

    const aliases = [unitKey, ...(unit.aliases ?? [])];
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
    if (!metric.label?.trim()) {
      throw new Error(`Metric catalog metric \`${metricKey}\` must have a non-empty label.`);
    }

    if (!categories.has(metric.category)) {
      throw new Error(`Metric catalog category missing for ${metricKey}: ${metric.category}.`);
    }

    if (metric.allowedUnits.length === 0) {
      throw new Error(`Metric catalog metric \`${metricKey}\` must have at least one allowed unit.`);
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

function createCatalogState(catalog: MetricCatalogDefinition): MetricCatalogState {
  const metricKeys = Object.keys(catalog.metrics).sort((left, right) => left.localeCompare(right));
  const unitKeys = Object.keys(catalog.units).sort((left, right) => left.localeCompare(right));
  const unitKeysByAlias = new Map<string, string>();

  unitKeys.forEach((unitKey) => {
    const unit = catalog.units[unitKey];
    [unitKey, ...(unit.aliases ?? [])].forEach((alias) => {
      unitKeysByAlias.set(normalizeLookupValue(alias), unitKey);
    });
  });

  return {
    catalog,
    metricKeys,
    unitKeys,
    unitKeysByAlias,
  };
}

function mergeCustomMetricCatalog(
  baseCatalog: MetricCatalogDefinition,
  customCatalog: CustomMetricCatalogDefinition,
): MetricCatalogDefinition {
  const merged = cloneCatalogDefinition(baseCatalog);

  Object.entries(customCatalog.categories).forEach(([key, customCategory]) => {
    const current = merged.categories[key];
    merged.categories[key] = current
      ? ensureCategory(key, { ...cloneCategory(current), ...customCategory })
      : ensureCategory(key, customCategory);
  });

  Object.entries(customCatalog.units).forEach(([key, customUnit]) => {
    const current = merged.units[key];
    merged.units[key] = current
      ? ensureUnit(key, { ...cloneUnit(current), ...customUnit })
      : ensureUnit(key, customUnit);
  });

  Object.entries(customCatalog.metrics).forEach(([key, customMetric]) => {
    const current = merged.metrics[key];
    merged.metrics[key] = current
      ? ensureMetric(key, { ...cloneMetric(current), ...customMetric })
      : ensureMetric(key, customMetric);
  });

  return validateMetricCatalog(merged);
}

const builtInMetricCatalog = validateMetricCatalog(metricCatalogData as MetricCatalogDefinition);
let activeMetricCatalogState = createCatalogState(builtInMetricCatalog);

function metricCatalog(): MetricCatalogDefinition {
  return activeMetricCatalogState.catalog;
}

export function createEmptyCustomMetricCatalog(): CustomMetricCatalogDefinition {
  return {
    categories: {},
    metrics: {},
    schemaVersion: CUSTOM_CATALOG_SCHEMA_VERSION,
    units: {},
  };
}

export function normalizeCustomMetricCatalog(value: unknown): CustomMetricCatalogDefinition {
  if (!isObjectRecord(value)) {
    return createEmptyCustomMetricCatalog();
  }

  return {
    categories: normalizeCustomCategories(value.categories),
    metrics: normalizeCustomMetrics(value.metrics),
    schemaVersion: CUSTOM_CATALOG_SCHEMA_VERSION,
    units: normalizeCustomUnits(value.units),
  };
}

export function customMetricCatalogIssues(value: unknown): string[] {
  const customCatalog = normalizeCustomMetricCatalog(value);

  try {
    mergeCustomMetricCatalog(builtInMetricCatalog, customCatalog);
  } catch (error) {
    return [error instanceof Error ? error.message : "Custom metric catalog is invalid."];
  }

  return [];
}

export function applyCustomMetricCatalog(value: unknown): string[] {
  const customCatalog = normalizeCustomMetricCatalog(value);
  const issues = customMetricCatalogIssues(customCatalog);
  if (issues.length > 0) {
    activeMetricCatalogState = createCatalogState(builtInMetricCatalog);
    return issues;
  }

  activeMetricCatalogState = createCatalogState(
    mergeCustomMetricCatalog(builtInMetricCatalog, customCatalog),
  );
  return [];
}

function categoryKeyForMetric(metricKey: string): string | null {
  const explicitCategory = metricCatalog().metrics[metricKey]?.category;
  if (explicitCategory) {
    return explicitCategory;
  }

  const [prefix] = metricKey.split(".", 1);
  return prefix && metricCatalog().categories[prefix] ? prefix : null;
}

export function allMetricKeys(): string[] {
  return [...activeMetricCatalogState.metricKeys];
}

export function allUnitKeys(): string[] {
  return [...activeMetricCatalogState.unitKeys];
}

export function canonicalMetricUnit(unit: string | null | undefined): string | null {
  const trimmed = trimToNull(unit);
  if (!trimmed) {
    return null;
  }

  return activeMetricCatalogState.unitKeysByAlias.get(normalizeLookupValue(trimmed)) ?? null;
}

export function displayMetricKey(metricKey: string | null | undefined): string {
  const trimmed = trimToNull(metricKey);
  if (!trimmed) {
    return "Invalid row";
  }

  return metricCatalog().metrics[trimmed]?.label ?? trimmed;
}

export function displayMetricName(
  metricKey: string | null | undefined,
  mode: MetricNameDisplayMode = "friendly",
): string {
  const trimmed = trimToNull(metricKey);
  if (!trimmed) {
    return "Invalid row";
  }

  return mode === "key" ? trimmed : displayMetricKey(trimmed);
}

export function displayMetricOption(
  metricKey: string,
  mode: MetricNameDisplayMode = "friendly",
): string {
  return displayMetricName(metricKey, mode);
}

export function displayMetricUnit(unit: string | null | undefined): string | null {
  const normalizedUnitKey = normalizeMetricUnitKey(unit);
  if (!normalizedUnitKey) {
    return null;
  }

  return metricCatalog().units[normalizedUnitKey]?.display ?? normalizedUnitKey;
}

export function displayMetricUnitLabel(unit: string | null | undefined): string | null {
  const normalizedUnitKey = normalizeMetricUnitKey(unit);
  if (!normalizedUnitKey) {
    return null;
  }

  return metricCatalog().units[normalizedUnitKey]?.label ?? normalizedUnitKey;
}

export function displayMetricUnitOption(unitKey: string): string {
  const display = displayMetricUnit(unitKey) ?? unitKey;
  const label = displayMetricUnitLabel(unitKey) ?? unitKey;
  return display === label ? display : `${display} (${label})`;
}

export function getMetricCategory(metricKey: string | null | undefined): MetricCatalogCategory | null {
  const trimmed = trimToNull(metricKey);
  if (!trimmed) {
    return null;
  }

  const categoryKey = categoryKeyForMetric(trimmed);
  return categoryKey ? metricCatalog().categories[categoryKey] ?? null : null;
}

export function getMetricDefinition(metricKey: string | null | undefined): MetricCatalogMetric | null {
  const trimmed = trimToNull(metricKey);
  if (!trimmed) {
    return null;
  }

  return metricCatalog().metrics[trimmed] ?? null;
}

export function getMetricIconCandidates(metricKey: string | null | undefined): string[] {
  const trimmed = trimToNull(metricKey);
  if (!trimmed) {
    return [...DEFAULT_ICON_CANDIDATES];
  }

  return (
    getMetricDefinition(trimmed)?.iconCandidates ??
    getMetricCategory(trimmed)?.iconCandidates ??
    DEFAULT_ICON_CANDIDATES
  );
}

export function getMetricUnitDefinition(unit: string | null | undefined): MetricCatalogUnit | null {
  const canonicalUnitKey = canonicalMetricUnit(unit);
  return canonicalUnitKey ? metricCatalog().units[canonicalUnitKey] ?? null : null;
}

export function getMetricFractionDigits(
  metricKey: string | null | undefined,
  unit: string | null | undefined,
): number | null {
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

export function getMetricDurationUnit(
  unit: string | null | undefined,
): "h" | "min" | "s" | null {
  return getMetricUnitDefinition(unit)?.durationUnit ?? null;
}

export function getSupportedUnitsForMetric(metricKey: string | null | undefined): string[] {
  return getMetricDefinition(metricKey)?.allowedUnits ?? [];
}

export function getDefaultUnitForMetric(metricKey: string | null | undefined): string | null {
  return getMetricDefinition(metricKey)?.defaultUnit ?? null;
}

export function hasKnownMetricKey(metricKey: string | null | undefined): boolean {
  return getMetricDefinition(metricKey) !== null;
}

export function hasKnownMetricUnit(unit: string | null | undefined): boolean {
  return canonicalMetricUnit(unit) !== null;
}

export function isUnitAllowedForMetric(
  metricKey: string | null | undefined,
  unit: string | null | undefined,
): boolean | null {
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

export function normalizeMetricUnitKey(unit: string | null | undefined): string | null {
  const canonicalUnitKey = canonicalMetricUnit(unit);
  if (canonicalUnitKey) {
    return canonicalUnitKey;
  }

  return trimToNull(unit);
}

export function compareMetricKeys(
  left: string,
  right: string,
  mode: MetricNameDisplayMode = "friendly",
): number {
  const leftLabel = displayMetricName(left, mode);
  const rightLabel = displayMetricName(right, mode);
  const labelComparison = leftLabel.localeCompare(rightLabel);
  return labelComparison !== 0 ? labelComparison : left.localeCompare(right);
}

export function metricCatalogDefinition(): MetricCatalogDefinition {
  return cloneCatalogDefinition(metricCatalog());
}
