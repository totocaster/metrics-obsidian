import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(rootDir, "src", "metric-catalog.json");
const outputPath = path.join(rootDir, "docs", "metric-catalog.md");

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

function sortEntries(record) {
  return Object.entries(record).sort(([left], [right]) => left.localeCompare(right));
}

function code(value) {
  return `\`${String(value)}\``;
}

function escapeCell(value) {
  return String(value).replace(/\|/g, "\\|");
}

function joinCode(values) {
  if (!values || values.length === 0) {
    return "None";
  }

  return values.map((value) => code(value)).join(", ");
}

function unitDisplay(unitKey, unit) {
  return unit.display ?? unitKey;
}

const lines = [
  "# Metric catalog",
  "",
  "> Generated from `src/metric-catalog.json`. Edit the JSON source, then run `npm run generate:metric-catalog-doc`.",
  "",
  "## Status",
  "",
  "- Source of truth for first-party supported metrics, units, labels, icons, and formatting hints.",
  "- Used directly by runtime validation, row rendering, chart labels, and authoring suggestions.",
  "- Unknown keys remain allowed by the file contract, but they are treated as outside this built-in catalog.",
  "",
  "## Categories",
  "",
  "| Category | Label | Icon candidates |",
  "| --- | --- | --- |",
  ...sortEntries(catalog.categories).map(([categoryKey, category]) =>
    `| ${code(categoryKey)} | ${escapeCell(category.label)} | ${escapeCell(joinCode(category.iconCandidates ?? []))} |`
  ),
  "",
  "## Units",
  "",
  "| Unit | Display | Label | Aliases | Fraction digits | Duration kind |",
  "| --- | --- | --- | --- | --- | --- |",
  ...sortEntries(catalog.units).map(([unitKey, unit]) =>
    `| ${code(unitKey)} | ${escapeCell(code(unitDisplay(unitKey, unit)))} | ${escapeCell(unit.label)} | ${escapeCell(joinCode(unit.aliases ?? []))} | ${typeof unit.fractionDigits === "number" ? unit.fractionDigits : "Auto"} | ${unit.durationUnit ? code(unit.durationUnit) : "No"} |`
  ),
  "",
  "## Metrics",
  "",
  "| Key | Label | Category | Allowed units | Default unit | Fraction digits | Icon candidates |",
  "| --- | --- | --- | --- | --- | --- | --- |",
  ...sortEntries(catalog.metrics).map(([metricKey, metric]) =>
    `| ${code(metricKey)} | ${escapeCell(metric.label)} | ${escapeCell(code(metric.category))} | ${escapeCell(joinCode(metric.allowedUnits ?? []))} | ${metric.defaultUnit ? escapeCell(code(metric.defaultUnit)) : "None"} | ${typeof metric.fractionDigits === "number" ? metric.fractionDigits : "Auto"} | ${escapeCell(joinCode(metric.iconCandidates ?? []))} |`
  ),
  "",
];

writeFileSync(outputPath, `${lines.join("\n")}\n`);
