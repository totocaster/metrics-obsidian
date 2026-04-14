import { normalizePath } from "obsidian";

export type MetricsVaultChangeKind = "create" | "delete" | "modify" | "rename";

export interface MetricsVaultChange {
  kind: MetricsVaultChangeKind;
  path: string | null | undefined;
  oldPath?: string | null | undefined;
}

export interface MetricsOpenLeafLike {
  view?: unknown;
}

function normalizeVaultPath(path: string | null | undefined): string | null {
  if (typeof path !== "string") {
    return null;
  }

  const trimmed = path.trim();
  if (trimmed.length === 0) {
    return null;
  }

  return normalizePath(trimmed);
}

function normalizeUniquePaths(paths: readonly string[]): string[] {
  const normalized = new Set<string>();

  paths.forEach((path) => {
    const canonicalPath = normalizeVaultPath(path);
    if (canonicalPath) {
      normalized.add(canonicalPath);
    }
  });

  return Array.from(normalized);
}

function viewFilePath(view: unknown): string | null {
  if (typeof view !== "object" || view === null) {
    return null;
  }

  const file = (view as { file?: unknown }).file;
  if (typeof file !== "object" || file === null) {
    return null;
  }

  const path = (file as { path?: unknown }).path;
  return normalizeVaultPath(typeof path === "string" ? path : null);
}

export function isMetricsFilePath(
  path: string | null | undefined,
  supportedExtensions: readonly string[],
): boolean {
  const canonicalPath = normalizeVaultPath(path);
  if (!canonicalPath) {
    return false;
  }

  return supportedExtensions.some((extension) => canonicalPath.endsWith(extension));
}

export function collectOpenMetricsViewPaths(leaves: Iterable<MetricsOpenLeafLike>): string[] {
  const openPaths = new Set<string>();

  for (const leaf of leaves) {
    const path = viewFilePath(leaf.view);
    if (path) {
      openPaths.add(path);
    }
  }

  return Array.from(openPaths);
}

function relevantPathsForChange(change: MetricsVaultChange): string[] {
  switch (change.kind) {
    case "rename":
      return [change.path, change.oldPath].flatMap((path) => {
        const canonicalPath = normalizeVaultPath(path);
        return canonicalPath ? [canonicalPath] : [];
      });
    case "create":
    case "delete":
    case "modify":
    default: {
      const canonicalPath = normalizeVaultPath(change.path);
      return canonicalPath ? [canonicalPath] : [];
    }
  }
}

export function refreshableMetricsViewPathsForVaultChange(
  change: MetricsVaultChange,
  openMetricsViewPaths: readonly string[],
  supportedExtensions: readonly string[],
): string[] {
  const openPaths = new Set(normalizeUniquePaths(openMetricsViewPaths));
  if (openPaths.size === 0) {
    return [];
  }

  const affectedPaths = new Set<string>();
  relevantPathsForChange(change).forEach((path) => {
    if (isMetricsFilePath(path, supportedExtensions) && openPaths.has(path)) {
      affectedPaths.add(path);
    }
  });

  return Array.from(affectedPaths);
}

export function shouldRefreshMetricsViewsForVaultChange(
  change: MetricsVaultChange,
  openMetricsViewPaths: readonly string[],
  supportedExtensions: readonly string[],
): boolean {
  return refreshableMetricsViewPathsForVaultChange(
    change,
    openMetricsViewPaths,
    supportedExtensions,
  ).length > 0;
}
