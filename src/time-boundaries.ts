export type MetricsTemporalGrouping = "day" | "week" | "month" | "year";
export type MetricsWeekStartDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface MetricsTimeBoundaryConfig {
  dayStartHour: number;
  weekStartsOn: MetricsWeekStartDay;
}

export const DEFAULT_TIME_BOUNDARY_CONFIG: MetricsTimeBoundaryConfig = {
  dayStartHour: 0,
  weekStartsOn: 1,
};

export function normalizeDayStartHour(value: unknown): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 23) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 23) {
      return parsed;
    }
  }

  return DEFAULT_TIME_BOUNDARY_CONFIG.dayStartHour;
}

export function normalizeWeekStartsOn(value: unknown): MetricsWeekStartDay {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 6) {
    return value as MetricsWeekStartDay;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 6) {
      return parsed as MetricsWeekStartDay;
    }
  }

  return DEFAULT_TIME_BOUNDARY_CONFIG.weekStartsOn;
}

export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseLocalDateString(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  const parsed = new Date(year, month - 1, day);
  parsed.setHours(0, 0, 0, 0);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  const originalDay = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDayOfMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(originalDay, lastDayOfMonth));
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addYears(date: Date, years: number): Date {
  return addMonths(date, years * 12);
}

export function startOfMonth(date: Date): Date {
  const next = new Date(date);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function startOfWeek(date: Date, weekStartsOn: MetricsWeekStartDay): Date {
  const next = new Date(date);
  const offset = (next.getDay() - weekStartsOn + 7) % 7;
  next.setDate(next.getDate() - offset);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function startOfYear(date: Date): Date {
  const next = new Date(date);
  next.setMonth(0, 1);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function effectiveDateFromDate(
  date: Date,
  config: MetricsTimeBoundaryConfig,
): Date {
  const shifted = new Date(date);
  shifted.setHours(shifted.getHours() - config.dayStartHour);
  shifted.setHours(0, 0, 0, 0);
  return shifted;
}

export function effectiveDateStringFromTimestamp(
  timestamp: number,
  config: MetricsTimeBoundaryConfig,
): string {
  return toLocalDateString(effectiveDateFromDate(new Date(timestamp), config));
}

export function currentEffectiveDate(config: MetricsTimeBoundaryConfig): Date {
  return effectiveDateFromDate(new Date(), config);
}

export function boundaryStartForDate(
  date: Date,
  config: MetricsTimeBoundaryConfig,
): Date {
  const boundary = new Date(date);
  boundary.setHours(config.dayStartHour, 0, 0, 0);
  return boundary;
}

export function boundaryStartTimestampForDate(
  date: Date,
  config: MetricsTimeBoundaryConfig,
): number {
  return boundaryStartForDate(date, config).getTime();
}
