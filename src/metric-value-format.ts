function normalizeDurationUnit(unit: string | null | undefined): "min" | "sec" | null {
  if (!unit) {
    return null;
  }

  const normalizedUnit = unit.trim().toLowerCase();
  if (normalizedUnit === "min") {
    return "min";
  }

  if (normalizedUnit === "sec") {
    return "sec";
  }

  return null;
}

function formatDurationValue(value: number, durationUnit: "min" | "sec"): string {
  const sign = value < 0 ? "-" : "";
  const totalSeconds = Math.round(Math.abs(durationUnit === "min" ? value * 60 : value));

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
  },
): string {
  const durationUnit = normalizeDurationUnit(unit);
  if (durationUnit) {
    return formatDurationValue(value, durationUnit);
  }

  const decimals = options?.decimals ?? 0;
  const formattedValue = value.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });

  if (options?.includeUnit && typeof unit === "string" && unit.length > 0) {
    return `${formattedValue} ${unit}`;
  }

  return formattedValue;
}
