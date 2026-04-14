import metricCatalogData from "./metric-catalog.json";

interface MetricCatalogCategory {
  iconCandidates?: string[];
  label: string;
}

interface MetricCatalogMetric {
  allowedUnits: string[];
  category: string;
  defaultUnit?: string;
  fractionDigits?: number;
  iconCandidates?: string[];
  label: string;
}

interface MetricCatalogUnit {
  aliases?: string[];
  display?: string;
  durationUnit?: "h" | "min" | "s";
  fractionDigits?: number;
  label: string;
}

interface MetricCatalogDefinition {
  categories: Record<string, MetricCatalogCategory>;
  metrics: Record<string, MetricCatalogMetric>;
  units: Record<string, MetricCatalogUnit>;
  version: number;
}

export type MetricNameDisplayMode = "friendly" | "key";

const DEFAULT_ICON_CANDIDATES = ["activity"];

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

function validateMetricCatalog(data: MetricCatalogDefinition): MetricCatalogDefinition {
  const categories = new Set(Object.keys(data.categories));
  const units = new Set(Object.keys(data.units));
  const seenAliases = new Map<string, string>();

  Object.entries(data.units).forEach(([unitKey, unit]) => {
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

const metricCatalog = validateMetricCatalog(metricCatalogData as MetricCatalogDefinition);
const metricKeys = Object.keys(metricCatalog.metrics).sort((left, right) => left.localeCompare(right));
const unitKeys = Object.keys(metricCatalog.units).sort((left, right) => left.localeCompare(right));
const unitKeysByAlias = new Map<string, string>();

unitKeys.forEach((unitKey) => {
  const unit = metricCatalog.units[unitKey];
  [unitKey, ...(unit.aliases ?? [])].forEach((alias) => {
    unitKeysByAlias.set(normalizeLookupValue(alias), unitKey);
  });
});

function categoryKeyForMetric(metricKey: string): string | null {
  const explicitCategory = metricCatalog.metrics[metricKey]?.category;
  if (explicitCategory) {
    return explicitCategory;
  }

  const [prefix] = metricKey.split(".", 1);
  return prefix && metricCatalog.categories[prefix] ? prefix : null;
}

export function allMetricKeys(): string[] {
  return [...metricKeys];
}

export function allUnitKeys(): string[] {
  return [...unitKeys];
}

export function canonicalMetricUnit(unit: string | null | undefined): string | null {
  const trimmed = trimToNull(unit);
  if (!trimmed) {
    return null;
  }

  return unitKeysByAlias.get(normalizeLookupValue(trimmed)) ?? null;
}

export function displayMetricKey(metricKey: string | null | undefined): string {
  const trimmed = trimToNull(metricKey);
  if (!trimmed) {
    return "Invalid row";
  }

  return metricCatalog.metrics[trimmed]?.label ?? trimmed;
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

  return metricCatalog.units[normalizedUnitKey]?.display ?? normalizedUnitKey;
}

export function displayMetricUnitLabel(unit: string | null | undefined): string | null {
  const normalizedUnitKey = normalizeMetricUnitKey(unit);
  if (!normalizedUnitKey) {
    return null;
  }

  return metricCatalog.units[normalizedUnitKey]?.label ?? normalizedUnitKey;
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
  return categoryKey ? metricCatalog.categories[categoryKey] ?? null : null;
}

export function getMetricDefinition(metricKey: string | null | undefined): MetricCatalogMetric | null {
  const trimmed = trimToNull(metricKey);
  if (!trimmed) {
    return null;
  }

  return metricCatalog.metrics[trimmed] ?? null;
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
  return canonicalUnitKey ? metricCatalog.units[canonicalUnitKey] ?? null : null;
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
  return metricCatalog;
}
