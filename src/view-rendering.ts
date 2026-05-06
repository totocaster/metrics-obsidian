import { Menu, Notice, setIcon, TFile } from "obsidian";

import { toMetricReference, type MetricRecord } from "./contract";
import type MetricsPlugin from "./main";
import { displayMetricName } from "./metric-catalog";
import { metricIconForKey } from "./metric-icons";
import {
  formatMetricDisplayValue,
  rawValuePrecision,
  resolveMetricFractionDigits,
} from "./metric-value-format";
import type { ParsedMetricRow } from "./metrics-file-model";
import {
  type MetricsRowGroup,
  type MetricsSummaryRow,
  type MetricsTimelineItem,
  formatMetricValue,
  alternateMetricLabel,
  summaryComputationLabel,
} from "./view-data";

function isEditableRecord(metric: Partial<MetricRecord> | null): metric is MetricRecord {
  return Boolean(
    metric &&
      typeof metric.id === "string" &&
      typeof metric.ts === "string" &&
      typeof metric.key === "string" &&
      typeof metric.value === "number" &&
      Number.isFinite(metric.value) &&
      typeof metric.source === "string",
  );
}

export function renderGroupHeading(
  container: HTMLElement,
  group: MetricsRowGroup,
  plugin: MetricsPlugin,
  sourcePath: string,
): void {
  const heading = container.createEl("h2");

  if (group.headingParts && group.headingParts.length > 0) {
    group.headingParts.forEach((part) => {
      if (!part.linkTarget) {
        heading.createSpan({ text: part.text });
        return;
      }

      const link = heading.createEl("a", {
        cls: "internal-link",
        href: part.linkTarget,
        text: part.text,
      });
      link.dataset.href = part.linkTarget;
      link.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void plugin.app.workspace.openLinkText(part.linkTarget!, sourcePath);
      });
    });
    return;
  }

  if (!group.linkTarget) {
    heading.setText(group.heading);
    return;
  }

  const linkTarget = group.linkTarget;
  const link = heading.createEl("a", {
    cls: "internal-link",
    href: linkTarget,
    text: group.heading,
  });
  link.dataset.href = linkTarget;
  link.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    void plugin.app.workspace.openLinkText(linkTarget, sourcePath);
  });
}

export function renderIssueList(container: HTMLElement, row: ParsedMetricRow): void {
  if (row.issues.length === 0) {
    return;
  }

  const issuesList = container.createEl("ul", { cls: "metrics-lens-issues" });
  row.issues.forEach((issue) => {
    issuesList.createEl("li", {
      cls: `is-${issue.severity}`,
      text: `${issue.severity === "warning" ? "Warning" : "Error"}: ${issue.message}`,
    });
  });
}

async function copyText(label: string, value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    new Notice(`Copied ${label}.`);
  } catch {
    new Notice(`Could not copy ${label}.`);
  }
}

function openRecordMenu(
  event: MouseEvent,
  row: ParsedMetricRow,
  plugin: MetricsPlugin,
  file: TFile,
  referencePrefix: string,
): void {
  const menu = new Menu();
  let hasItems = false;

  if (typeof row.metric?.id === "string") {
    hasItems = true;
    menu.addItem((item) => {
      item.setTitle("Copy metric reference").setIcon("copy").onClick(() => {
        void copyText("metric reference", toMetricReference(row.metric!.id!, referencePrefix));
      });
    });

    menu.addItem((item) => {
      item.setTitle("Copy id").setIcon("copy").onClick(() => {
        void copyText("id", row.metric!.id!);
      });
    });
  }

  if (typeof row.metric?.origin_id === "string") {
    hasItems = true;
    menu.addItem((item) => {
      item.setTitle("Copy origin id").setIcon("copy").onClick(() => {
        void copyText("origin id", row.metric!.origin_id!);
      });
    });
  }

  if (typeof row.metric?.source === "string") {
    hasItems = true;
    menu.addItem((item) => {
      item.setTitle("Copy source").setIcon("copy").onClick(() => {
        void copyText("source", row.metric!.source!);
      });
    });
  }

  if (row.rawLine.trim().length > 0) {
    hasItems = true;
    menu.addItem((item) => {
      item.setTitle("Copy raw line").setIcon("copy").onClick(() => {
        void copyText("raw line", row.rawLine);
      });
    });
  }

  const metricKey = typeof row.metric?.key === "string" && row.metric.key.length > 0 ? row.metric.key : null;
  const metricUnit = typeof row.metric?.unit === "string" && row.metric.unit.length > 0 ? row.metric.unit : null;
  const hasUnknownKey = row.issues.some((issue) => issue.code === "unknown_key");
  const hasUnknownUnit = row.issues.some((issue) => issue.code === "unknown_unit");
  const hasMetricCatalogIssue = row.issues.some((issue) =>
    issue.code === "unknown_key" ||
    issue.code === "unsupported_unit_for_key" ||
    issue.code === "mixed_key_unit",
  );
  if (metricKey && (hasMetricCatalogIssue || (hasUnknownUnit && metricUnit))) {
    if (hasItems) {
      menu.addSeparator();
    }

    if (hasMetricCatalogIssue) {
      hasItems = true;
      menu.addItem((item) => {
        item
          .setTitle(hasUnknownKey ? "Add metric to catalog" : "Edit metric catalog entry")
          .setIcon(hasUnknownKey ? "plus" : "settings")
          .onClick(() => {
            plugin.openMetricCatalogMetricEditor({
              initialKey: metricKey,
              initialUnit: metricUnit,
            });
          });
      });
    }

    if (hasUnknownUnit && metricUnit) {
      hasItems = true;
      menu.addItem((item) => {
        item
          .setTitle("Add unit to catalog")
          .setIcon("plus")
          .onClick(() => {
            plugin.openMetricCatalogUnitEditor({
              initialUnit: metricUnit,
            });
          });
      });
    }
  }

  if (isEditableRecord(row.metric)) {
    const metric = row.metric;

    if (hasItems) {
      menu.addSeparator();
    }

    menu.addItem((item) => {
      item.setTitle("Edit").setIcon("pencil").onClick(() => {
        plugin.openEditRecordModal(file, metric);
      });
    });

    menu.addItem((item) => {
      item.setTitle("Delete").setIcon("trash").onClick(() => {
        plugin.confirmDeleteRecord(file, metric);
      });
    });
    hasItems = true;
  }

  if (!hasItems) {
    return;
  }

  menu.showAtMouseEvent(event);
}

function formatTimelineTime(row: ParsedMetricRow): string {
  const ts = row.metric?.ts;
  if (typeof ts !== "string") {
    return "--:--";
  }

  const parsed = Date.parse(ts);
  if (Number.isNaN(parsed)) {
    return "--:--";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function formatTimelineDate(row: ParsedMetricRow): string {
  if (typeof row.metric?.date === "string") {
    return row.metric.date;
  }

  const ts = row.metric?.ts;
  if (typeof ts !== "string") {
    return "";
  }

  const parsed = Date.parse(ts);
  if (Number.isNaN(parsed)) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(parsed);
}

function formatSummaryValue(summary: MetricsSummaryRow): string {
  if (summary.computation === "count") {
    return summary.value.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    });
  }

  const digits = resolveMetricFractionDigits(summary.metricKey, summary.unit, {
    rawPrecision: summary.rawPrecision,
  });
  const maximumFractionDigits =
    (summary.computation === "avg" || summary.computation === "median") &&
    !Number.isInteger(summary.value)
      ? Math.max(digits.maximumFractionDigits, 1)
      : digits.maximumFractionDigits;

  return formatMetricDisplayValue(summary.value, summary.unit, {
    includeUnit: true,
    maximumFractionDigits,
    metricKey: summary.metricKey,
    minimumFractionDigits: Math.min(digits.minimumFractionDigits, maximumFractionDigits),
    rawPrecision: summary.rawPrecision,
  });
}

export function renderRecord(
  container: HTMLElement,
  row: ParsedMetricRow,
  plugin: MetricsPlugin,
  file: TFile,
  referencePrefix: string,
  options: {
    isFirst: boolean;
    isLast: boolean;
  },
): void {
  const rowEl = container.createDiv({
    cls: row.status === "valid" ? "metrics-lens-record" : ["metrics-lens-record", `is-${row.status}`],
  });
  rowEl.dataset.metricsLineNumber = String(row.lineNumber);
  rowEl.tabIndex = -1;
  if (typeof row.metric?.id === "string") {
    rowEl.dataset.metricId = row.metric.id;
  }
  if (options.isFirst) {
    rowEl.addClass("is-first");
  }
  if (options.isLast) {
    rowEl.addClass("is-last");
  }
  rowEl.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openRecordMenu(event, row, plugin, file, referencePrefix);
  });

  const timeEl = rowEl.createDiv({ cls: "metrics-lens-record-time" });
  timeEl.createSpan({
    cls: "metrics-lens-record-time-primary",
    text: formatTimelineTime(row),
  });

  const secondaryTime = formatTimelineDate(row);
  if (secondaryTime.length > 0) {
    timeEl.createSpan({
      cls: "metrics-lens-record-time-secondary",
      text: secondaryTime,
    });
  }

  const body = rowEl.createDiv({ cls: "metrics-lens-record-body" });
  const marker = body.createSpan({ cls: "metrics-lens-record-marker" });
  const metricDisplayMode = plugin.settings.metricNameDisplayMode;
  const metricKeyLabel = displayMetricName(row.metric?.key, metricDisplayMode);
  const iconId =
    plugin.settings.showMetricIcons && typeof row.metric?.key === "string"
      ? metricIconForKey(row.metric.key)
      : null;
  if (iconId) {
    marker.setAttribute("aria-hidden", "true");
    try {
      setIcon(marker, iconId);
      if (marker.querySelector("svg")) {
        marker.addClass("has-icon");
        body.addClass("has-icon-marker");
      }
    } catch {
      marker.empty();
    }
  }

  const main = body.createDiv({ cls: "metrics-lens-record-main" });
  const metricKeyEl = main.createSpan({
    cls: "metrics-lens-record-key",
    text: metricKeyLabel,
  });
  if (typeof row.metric?.key === "string") {
    const alternateLabel = alternateMetricLabel(row.metric.key, metricDisplayMode);
    if (alternateLabel) {
      metricKeyEl.setAttribute("title", alternateLabel);
    }
  }

  const metricValue = formatMetricValue(row);
  if (metricValue) {
    main.createSpan({
      cls: "metrics-lens-record-value",
      text: metricValue,
    });
  }

  if (typeof row.metric?.note === "string" && row.metric.note.length > 0) {
    body.createDiv({
      cls: "metrics-lens-record-note",
      text: row.metric.note,
    });
  }

  renderIssueList(body, row);

  if (!row.metric?.key) {
    body.createEl("pre", {
      cls: "metrics-lens-record-raw",
      text: row.rawLine,
    });
  }

  const menuButton = rowEl.createEl("button", {
    cls: ["clickable-icon", "metrics-lens-more-button"],
  });
  menuButton.type = "button";
  menuButton.setAttribute("aria-label", `More actions for ${metricKeyLabel}`);
  menuButton.setAttribute("data-tooltip-position", "left");
  setIcon(menuButton, "more-horizontal");
  menuButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openRecordMenu(event, row, plugin, file, referencePrefix);
  });
}

export function renderSummaryRecord(
  container: HTMLElement,
  summary: MetricsSummaryRow,
  options: {
    isFirst: boolean;
    isLast: boolean;
  },
): void {
  const rowEl = container.createDiv({ cls: ["metrics-lens-record", "is-summary"] });
  if (options.isFirst) {
    rowEl.addClass("is-first");
  }
  if (options.isLast) {
    rowEl.addClass("is-last");
  }

  const timeEl = rowEl.createDiv({ cls: "metrics-lens-record-time" });
  timeEl.createSpan({
    cls: "metrics-lens-record-time-primary",
    text: summaryComputationLabel(summary.computation),
  });

  const body = rowEl.createDiv({ cls: "metrics-lens-record-body" });
  const marker = body.createSpan({ cls: "metrics-lens-record-marker" });
  marker.setAttribute("aria-hidden", "true");
  try {
    setIcon(marker, "calculator");
    if (marker.querySelector("svg")) {
      marker.addClass("has-icon");
      body.addClass("has-icon-marker");
    }
  } catch {
    marker.empty();
  }

  const main = body.createDiv({ cls: "metrics-lens-record-main" });
  main.createSpan({
    cls: "metrics-lens-record-key",
    text: summary.label,
  });
  if (summary.unitLabel) {
    main.createSpan({
      cls: "metrics-lens-record-summary-context",
      text: summary.unitLabel,
    });
  }
  main.createSpan({
    cls: "metrics-lens-record-value",
    text: formatSummaryValue(summary),
  });

  if (summary.note) {
    body.createDiv({
      cls: "metrics-lens-record-note",
      text: summary.note,
    });
  }

  rowEl.createDiv({ cls: "metrics-lens-record-actions-spacer" });
}

export function renderTimelineItems(
  container: HTMLElement,
  items: MetricsTimelineItem[],
  plugin: MetricsPlugin,
  file: TFile,
  referencePrefix: string,
): void {
  items.forEach((item, index) => {
    const options = {
      isFirst: index === 0,
      isLast: index === items.length - 1,
    };

    if (item.kind === "record") {
      renderRecord(container, item.row, plugin, file, referencePrefix, options);
      return;
    }

    renderSummaryRecord(container, item.summary, options);
  });
}
