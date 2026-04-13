import { generateUlid } from "./ulid";

export interface AssignMissingIdsResult {
  assigned: number;
  content: string;
  skipped: number;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function assignMissingIdsToMetricsData(data: string): AssignMissingIdsResult {
  let assigned = 0;
  let skipped = 0;

  const hasTrailingNewline = data.endsWith("\n");
  const rewrittenLines = data.split("\n").map((line) => {
    if (line.trim().length === 0) {
      return line;
    }

    let parsedValue: unknown;
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
      ...parsedValue,
    });
  });

  const content = rewrittenLines.join("\n");
  return {
    assigned,
    content: hasTrailingNewline && !content.endsWith("\n") ? `${content}\n` : content,
    skipped,
  };
}
