import {
  canonicalMetricUnit,
  displayMetricUnit,
  getMetricDurationUnit,
  getMetricFractionDigits,
} from "./metric-catalog";

function normalizeDurationUnit(unit: string | null | undefined): "h" | "min" | "s" | null {
  return getMetricDurationUnit(unit);
}

const MAX_AUTO_FRACTION_DIGITS = 2;
const MAX_RAW_FRACTION_DIGITS = 6;

export interface MetricFractionDigits {
  maximumFractionDigits: number;
  minimumFractionDigits: number;
}

function clampFractionDigits(value: number): number {
  return Math.max(0, Math.min(MAX_RAW_FRACTION_DIGITS, value));
}

function fixedFractionDigits(digits: number): MetricFractionDigits {
  const normalized = clampFractionDigits(digits);
  return {
    maximumFractionDigits: normalized,
    minimumFractionDigits: normalized,
  };
}

function normalizeMetricKey(metricKey: string | null | undefined): string {
  return typeof metricKey === "string" ? metricKey.trim().toLowerCase() : "";
}

function normalizeUnit(unit: string | null | undefined): string {
  return typeof unit === "string" ? unit.trim().toLowerCase() : "";
}

function defaultFractionDigits(rawPrecision?: number): MetricFractionDigits {
  if (typeof rawPrecision === "number") {
    return fixedFractionDigits(
      rawPrecision > 0
        ? Math.min(rawPrecision, MAX_AUTO_FRACTION_DIGITS)
        : 0,
    );
  }

  return {
    maximumFractionDigits: clampFractionDigits(MAX_AUTO_FRACTION_DIGITS),
    minimumFractionDigits: 0,
  };
}

export function rawValuePrecision(rawLine: string): number {
  const match = /"value"\s*:\s*-?\d+(?:\.(\d+))?(?:[eE][+-]?\d+)?/.exec(rawLine);
  return clampFractionDigits(match?.[1]?.length ?? 0);
}

export function resolveMetricFractionDigits(
  metricKey: string | null | undefined,
  unit: string | null | undefined,
  options?: {
    rawPrecision?: number;
  },
): MetricFractionDigits {
  const normalizedMetricKey = normalizeMetricKey(metricKey);
  const normalizedUnit = normalizeUnit(unit);
  const canonicalUnit = canonicalMetricUnit(unit);
  const catalogFractionDigits = getMetricFractionDigits(metricKey, unit);

  if (typeof catalogFractionDigits === "number") {
    return fixedFractionDigits(catalogFractionDigits);
  }

  if (
    normalizedMetricKey.endsWith("_percentage") ||
    canonicalUnit === "%" ||
    normalizedUnit === "%" ||
    normalizedUnit === "percent" ||
    normalizedUnit === "pct"
  ) {
    return fixedFractionDigits(1);
  }

  if (
    normalizedMetricKey.includes("temperature") ||
    canonicalUnit === "Cel" ||
    canonicalUnit === "[degF]" ||
    normalizedUnit === "c" ||
    normalizedUnit === "f" ||
    normalizedUnit === "celsius" ||
    normalizedUnit === "fahrenheit"
  ) {
    return fixedFractionDigits(1);
  }

  if (
    canonicalUnit === "bpm" ||
    canonicalUnit === "br/min" ||
    canonicalUnit === "count" ||
    canonicalUnit === "kcal" ||
    canonicalUnit === "mm[Hg]" ||
    canonicalUnit === "score"
  ) {
    return fixedFractionDigits(0);
  }

  return defaultFractionDigits(options?.rawPrecision);
}

function formatDurationValue(value: number, durationUnit: "h" | "min" | "s"): string {
  const sign = value < 0 ? "-" : "";
  const totalSeconds = Math.round(
    Math.abs(
      durationUnit === "h"
        ? value * 3600
        : durationUnit === "min"
          ? value * 60
          : value,
    ),
  );

  if (totalSeconds === 0) {
    return "0s";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];

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

export function formatMetricDisplayValue(
  value: number,
  unit: string | null | undefined,
  options?: {
    decimals?: number;
    includeUnit?: boolean;
    maximumFractionDigits?: number;
    metricKey?: string | null;
    minimumFractionDigits?: number;
    rawPrecision?: number;
  },
): string {
  const durationUnit = normalizeDurationUnit(unit);
  if (durationUnit) {
    return formatDurationValue(value, durationUnit);
  }

  const digits = typeof options?.decimals === "number"
    ? fixedFractionDigits(options.decimals)
    : typeof options?.minimumFractionDigits === "number" || typeof options?.maximumFractionDigits === "number"
      ? {
          maximumFractionDigits: clampFractionDigits(
            Math.max(
              options.maximumFractionDigits ?? options.minimumFractionDigits ?? 0,
              options.minimumFractionDigits ?? 0,
            ),
          ),
          minimumFractionDigits: clampFractionDigits(options.minimumFractionDigits ?? 0),
        }
      : resolveMetricFractionDigits(options?.metricKey, unit, {
          rawPrecision: options?.rawPrecision,
        });
  const formattedValue = value.toLocaleString(undefined, {
    maximumFractionDigits: digits.maximumFractionDigits,
    minimumFractionDigits: digits.minimumFractionDigits,
  });

  const unitDisplay = displayMetricUnit(unit) ?? (typeof unit === "string" && unit.trim().length > 0 ? unit.trim() : null);
  if (options?.includeUnit && unitDisplay) {
    return `${formattedValue} ${unitDisplay}`;
  }

  return formattedValue;
}
