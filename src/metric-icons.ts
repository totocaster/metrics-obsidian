import { getIconIds, type IconName } from "obsidian";

let cachedIconIds: Set<string> | null = null;
let cachedIconCount = -1;

function availableIconIds(): Set<string> {
  const iconIds = getIconIds();

  if (!cachedIconIds || cachedIconCount !== iconIds.length) {
    cachedIconIds = new Set(iconIds);
    cachedIconCount = iconIds.length;
  }

  return cachedIconIds;
}

function metricIconCandidates(metricKey: string): IconName[] {
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

export function metricIconForKey(metricKey: string): IconName | null {
  const candidates = metricIconCandidates(metricKey);
  const available = availableIconIds();

  for (const candidate of candidates) {
    if (available.has(candidate)) {
      return candidate;
    }
  }

  return candidates[0] ?? null;
}
