import { getIconIds, type IconName } from "obsidian";

import { getMetricIconCandidates } from "./metric-catalog";

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

export function metricIconForKey(metricKey: string): IconName | null {
  const candidates = getMetricIconCandidates(metricKey) as IconName[];
  const available = availableIconIds();

  for (const candidate of candidates) {
    if (available.has(candidate)) {
      return candidate;
    }
  }

  return candidates[0] ?? null;
}
