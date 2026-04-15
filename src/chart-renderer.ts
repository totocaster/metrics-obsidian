import type {
  MetricsChartBucket,
  MetricsChartModel,
  MetricsChartPanel,
  MetricsChartSeries,
  MetricsChartSeriesPoint,
  MetricsChartStackSegment,
} from "./chart-model";
import { NO_UNIT_KEY } from "./chart-model";
import { formatMetricDisplayValue } from "./metric-value-format";

const SVG_NS = "http://www.w3.org/2000/svg";
const CHART_WIDTH = 640;
const CHART_HEIGHT = 248;
const PLOT_LEFT = 40;
const PLOT_RIGHT = 12;
const PLOT_TOP = 16;
const PLOT_BOTTOM = 44;

interface PanelInteractionState {
  isolatedSeriesKey: string | null;
  mutedSeriesKeys: Set<string>;
}

interface HoverEntry {
  colorClass: string;
  label: string;
  lineNumbers: number[];
  metricKey: string;
  precision: number;
  value: number;
}

interface HoverTarget {
  bucket: MetricsChartBucket;
  entries: HoverEntry[];
  lineNumbers: number[];
  x: number;
  xEnd: number;
  xStart: number;
}

interface XAxisLabelSelection {
  bucket: MetricsChartBucket;
  index: number;
  x: number;
}

interface XAxisLabelLayout {
  labels: XAxisLabelSelection[];
  rotate: boolean;
}

export interface MetricsChartSelection {
  bucketKey: string;
  bucketLabel: string;
  lineNumbers: number[];
}

export interface RenderMetricsChartOptions {
  onSelect?: (selection: MetricsChartSelection) => void;
}

function createSvgEl<K extends keyof SVGElementTagNameMap>(
  tagName: K,
  attributes?: Record<string, number | string>,
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, tagName);
  if (attributes) {
    Object.entries(attributes).forEach(([name, value]) => {
      element.setAttribute(name, String(value));
    });
  }
  return element;
}

function formatChartAxisValue(
  value: number,
  decimals: number,
  unit: string | null | undefined,
): string {
  return formatMetricDisplayValue(value, unit, {
    decimals,
    includeUnit: false,
  });
}

function formatChartTooltipValue(
  value: number,
  metricKey: string,
  rawPrecision: number,
  unit: string | null | undefined,
): string {
  return formatMetricDisplayValue(value, unit, {
    includeUnit: false,
    metricKey,
    rawPrecision,
  });
}

function formatBucketLabel(bucket: MetricsChartBucket, axisKind: MetricsChartPanel["axisKind"]): string {
  if (bucket.headingLabel) {
    return bucket.label;
  }

  if (axisKind === "time" && bucket.timestamp !== null) {
    return bucket.label.length === 10
      ? bucket.label
      : new Intl.DateTimeFormat(undefined, {
          month: "short",
          day: "numeric",
        }).format(bucket.timestamp);
  }

  return bucket.label;
}

function formatBucketHeading(bucket: MetricsChartBucket, axisKind: MetricsChartPanel["axisKind"]): string {
  if (bucket.headingLabel) {
    return bucket.headingLabel;
  }

  if (axisKind !== "time" || bucket.timestamp === null) {
    return bucket.label;
  }

  if (bucket.label.length === 10) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "full",
    }).format(bucket.timestamp);
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(bucket.timestamp);
}

function formatSegmentTime(timestamp: number | null): string | null {
  if (timestamp === null) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function uniqueLineNumbers(lineNumbers: number[]): number[] {
  return Array.from(new Set(lineNumbers));
}

function colorClass(index: number): string {
  return `metrics-lens-chart-series-${index % 6}`;
}

function nearlyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= Math.max(1e-6, Math.abs(left), Math.abs(right)) * 1e-6;
}

function gridGuideValues(panel: MetricsChartPanel): number[] {
  const range = panel.maxValue - panel.minValue || 1;
  return [panel.maxValue, 0.75, 0.5, 0.25, panel.minValue].map((value) =>
    value > 0 && value < 1 ? panel.minValue + range * value : value,
  );
}

function visibleSeriesKeys(panel: MetricsChartPanel, state: PanelInteractionState): string[] {
  if (state.isolatedSeriesKey) {
    return panel.series.some((series) => series.key === state.isolatedSeriesKey) ? [state.isolatedSeriesKey] : [];
  }

  return panel.series
    .map((series) => series.key)
    .filter((key) => !state.mutedSeriesKeys.has(key));
}

function visibleSeriesCount(panel: MetricsChartPanel, state: PanelInteractionState): number {
  return visibleSeriesKeys(panel, state).length;
}

function filteredStackSegments(
  panel: MetricsChartPanel,
  visibleKeys: Set<string>,
): Map<string, MetricsChartStackSegment[]> | undefined {
  if (!panel.stackSegments) {
    return undefined;
  }

  const filtered = new Map<string, MetricsChartStackSegment[]>();
  panel.stackSegments.forEach((segments, bucketKey) => {
    const visibleSegments = segments.filter((segment) => visibleKeys.has(segment.key));
    if (visibleSegments.length > 0) {
      filtered.set(bucketKey, visibleSegments);
    }
  });
  return filtered;
}

function computeVisibleRange(
  panel: MetricsChartPanel,
  series: MetricsChartSeries[],
  stackSegments: Map<string, MetricsChartStackSegment[]> | undefined,
): {
  maxValue: number;
  minValue: number;
} {
  if (panel.stacked && stackSegments) {
    const totals = Array.from(stackSegments.values()).map((segments) =>
      segments.reduce(
        (current, segment) => {
          if (segment.value >= 0) {
            current.positive += segment.value;
          } else {
            current.negative += segment.value;
          }
          return current;
        },
        { negative: 0, positive: 0 },
      ),
    );

    let minValue = Math.min(...totals.map((entry) => entry.negative), 0);
    let maxValue = Math.max(...totals.map((entry) => entry.positive), 0);
    const range = maxValue - minValue || 1;
    if (minValue >= 0) {
      minValue = 0;
      maxValue += Math.max(maxValue * 0.06, maxValue === 0 ? 1 : 0);
    } else if (maxValue <= 0) {
      maxValue = 0;
      minValue -= Math.max(Math.abs(minValue) * 0.06, minValue === 0 ? 1 : 0);
    } else {
      const padding = range * 0.06;
      minValue -= padding;
      maxValue += padding;
    }
    return { maxValue, minValue };
  }

  const values = series.flatMap((entry) => entry.points.map((point) => point.value));
  if (values.length === 0) {
    return {
      maxValue: panel.maxValue,
      minValue: panel.minValue,
    };
  }

  let minValue = Math.min(...values);
  let maxValue = Math.max(...values);
  const range = maxValue - minValue;
  if (range === 0) {
    if (maxValue === 0) {
      minValue = -1;
      maxValue = 1;
    } else {
      const padding = Math.abs(maxValue) * 0.1;
      minValue -= padding;
      maxValue += padding;
    }
  } else {
    const padding = range * 0.06;
    if (minValue === 0) {
      maxValue += padding;
    } else if (maxValue === 0) {
      minValue -= padding;
    } else {
      minValue -= padding;
      maxValue += padding;
    }
  }

  return { maxValue, minValue };
}

function displayPanel(panel: MetricsChartPanel, state: PanelInteractionState): MetricsChartPanel {
  const visibleKeys = new Set(visibleSeriesKeys(panel, state));
  const series = panel.series.filter((entry) => visibleKeys.has(entry.key));
  const stackSegments = filteredStackSegments(panel, visibleKeys);
  const range = computeVisibleRange(panel, series, stackSegments);

  return {
    ...panel,
    maxValue: range.maxValue,
    minValue: range.minValue,
    series,
    stackSegments,
  };
}

function colorClassBySeriesKey(panel: MetricsChartPanel): Map<string, string> {
  return new Map(panel.series.map((series, index) => [series.key, colorClass(index)]));
}

function selectXAxisLabels(
  buckets: MetricsChartBucket[],
  maxLabels: number,
  xForBucket: (bucket: MetricsChartBucket, index: number) => number,
): XAxisLabelSelection[] {
  if (buckets.length <= maxLabels) {
    return buckets.map((bucket, index) => ({ bucket, index, x: xForBucket(bucket, index) }));
  }

  const selections: XAxisLabelSelection[] = [];
  const span = Math.max(1, maxLabels - 1);
  const step = Math.ceil((buckets.length - 1) / span);
  buckets.forEach((bucket, index) => {
    if (index === 0 || index === buckets.length - 1 || index % step === 0) {
      selections.push({ bucket, index, x: xForBucket(bucket, index) });
    }
  });
  return selections;
}

function xAxisLayout(
  panel: MetricsChartPanel,
  panelWidth: number,
  xForBucket: (bucket: MetricsChartBucket, index: number) => number,
): XAxisLabelLayout {
  const availableWidth = Math.max(180, panelWidth - 52);
  const targetSpacing = panel.axisKind === "time" ? 88 : 72;
  const maxLabels = Math.max(2, Math.floor(availableWidth / targetSpacing));
  return {
    labels: selectXAxisLabels(panel.buckets, maxLabels, xForBucket),
    rotate: false,
  };
}

function appendYAxis(
  svg: SVGSVGElement,
  panel: MetricsChartPanel,
): {
  plotHeight: number;
  plotWidth: number;
  zeroY: number;
  baselineValue: number;
  yForValue: (value: number) => number;
} {
  const plotWidth = CHART_WIDTH - PLOT_LEFT - PLOT_RIGHT;
  const plotHeight = CHART_HEIGHT - PLOT_TOP - PLOT_BOTTOM;
  const domainMin = panel.minValue;
  const domainMax = panel.maxValue;
  const range = domainMax - domainMin || 1;
  const yForValue = (value: number): number => {
    const ratio = (value - domainMin) / range;
    return PLOT_TOP + plotHeight - ratio * plotHeight;
  };

  const baselineValue =
    domainMin <= 0 && domainMax >= 0 ? 0 : domainMin > 0 ? domainMin : domainMax;
  const gridValues = gridGuideValues(panel);
  let baselineRendered = false;

  gridValues.forEach((value, index) => {
    const y = yForValue(value);
    const isMinor = index !== 0 && index !== gridValues.length - 1;
    const isBaseline = nearlyEqual(value, baselineValue);
    if (isBaseline) {
      baselineRendered = true;
    }

    svg.appendChild(
      createSvgEl("line", {
        class: [
          "metrics-lens-chart-grid",
          isMinor ? "is-minor" : "",
          isBaseline ? "metrics-lens-chart-baseline" : "",
        ]
          .filter((value) => value.length > 0)
          .join(" "),
        x1: PLOT_LEFT,
        x2: PLOT_LEFT + plotWidth,
        y1: y,
        y2: y,
      }),
    );

    const label = createSvgEl("text", {
      class: ["metrics-lens-chart-axis-label", isMinor ? "is-minor" : ""]
        .filter((entry) => entry.length > 0)
        .join(" "),
      x: PLOT_LEFT - 8,
      y: y + 4,
    });
    label.textContent = formatChartAxisValue(
      value,
      panel.axisPrecision,
      panel.unitKey === NO_UNIT_KEY ? null : panel.unitKey,
    );
    svg.appendChild(label);
  });

  const zeroY = yForValue(baselineValue);
  if (!baselineRendered) {
    svg.appendChild(
      createSvgEl("line", {
        class: "metrics-lens-chart-baseline",
        x1: PLOT_LEFT,
        x2: PLOT_LEFT + plotWidth,
        y1: zeroY,
        y2: zeroY,
      }),
    );
  }

  return { baselineValue, plotHeight, plotWidth, zeroY, yForValue };
}

function appendBarChartGuideOverlay(
  svg: SVGSVGElement,
  panel: MetricsChartPanel,
  plotWidth: number,
  yForValue: (value: number) => number,
  baselineValue: number,
): void {
  gridGuideValues(panel).forEach((value, index, allValues) => {
    const isMinor = index !== 0 && index !== allValues.length - 1;
    if (isMinor) {
      return;
    }
    const isBaseline = nearlyEqual(value, baselineValue);
    svg.appendChild(
      createSvgEl("line", {
        class: [
          "metrics-lens-chart-grid",
          "is-overlay",
          isBaseline ? "metrics-lens-chart-baseline" : "",
        ]
          .filter((entry) => entry.length > 0)
          .join(" "),
        x1: PLOT_LEFT,
        x2: PLOT_LEFT + plotWidth,
        y1: yForValue(value),
        y2: yForValue(value),
      }),
    );
  });
}

function appendXAxisLabels(
  svg: SVGSVGElement,
  layout: XAxisLabelLayout,
  axisKind: MetricsChartPanel["axisKind"],
): void {
  layout.labels.forEach(({ bucket, x }) => {
    const y = CHART_HEIGHT - 10;
    const label = createSvgEl("text", {
      class: ["metrics-lens-chart-axis-label", "is-bottom"].join(" "),
      x,
      y,
    });
    label.textContent = formatBucketLabel(bucket, axisKind);
    svg.appendChild(label);
  });
}

function lineHoverTargets(
  panel: MetricsChartPanel,
  xForTimestamp: (timestamp: number) => number,
  visibleKeys: Set<string>,
  colorClasses: Map<string, string>,
): HoverTarget[] {
  const positions = panel.buckets.map((bucket) => xForTimestamp(bucket.timestamp!));
  return panel.buckets
    .map((bucket, index) => {
      const entries = panel.series
        .filter((series) => visibleKeys.has(series.key))
        .map((series) => {
          const point = series.points.find((entry) => entry.bucketKey === bucket.key);
          if (!point) {
            return null;
          }

          return {
            colorClass: colorClasses.get(series.key) ?? colorClass(0),
            label: series.label,
            lineNumbers: point.lineNumbers,
            metricKey: series.key,
            precision: point.precision,
            value: point.value,
          };
        })
        .filter((entry): entry is HoverEntry => entry !== null);

      if (entries.length === 0) {
        return null;
      }

      const x = positions[index];
      const xStart = index === 0 ? PLOT_LEFT : (positions[index - 1] + x) / 2;
      const xEnd = index === positions.length - 1 ? PLOT_LEFT + (CHART_WIDTH - PLOT_LEFT - PLOT_RIGHT) : (x + positions[index + 1]) / 2;
      return {
        bucket,
        entries,
        lineNumbers: uniqueLineNumbers(entries.flatMap((entry) => entry.lineNumbers)),
        x,
        xEnd,
        xStart,
      };
    })
    .filter((entry): entry is HoverTarget => entry !== null);
}

function barHoverTargets(
  panel: MetricsChartPanel,
  bucketWidth: number,
  visibleKeys: Set<string>,
  colorClasses: Map<string, string>,
): HoverTarget[] {
  return panel.buckets
    .map((bucket, index) => {
      const xStart = PLOT_LEFT + index * bucketWidth;
      const xEnd = xStart + bucketWidth;
      const x = xStart + bucketWidth / 2;

      if (panel.stacked && panel.stackSegments) {
        const segments = (panel.stackSegments.get(bucket.key) ?? []).filter((segment) => visibleKeys.has(segment.key));
        if (segments.length === 0) {
          return null;
        }

        const duplicateCounts = new Map<string, number>();
        segments.forEach((segment) => {
          duplicateCounts.set(segment.key, (duplicateCounts.get(segment.key) ?? 0) + 1);
        });

        return {
          bucket,
          entries: segments.map((segment) => {
            const timeLabel = duplicateCounts.get(segment.key)! > 1 ? formatSegmentTime(segment.timestamp) : null;
            return {
              colorClass: colorClasses.get(segment.key) ?? colorClass(0),
              label: timeLabel ? `${segment.label} ${timeLabel}` : segment.label,
              lineNumbers: segment.lineNumbers,
              metricKey: segment.key,
              precision: segment.precision,
              value: segment.value,
            };
          }),
          lineNumbers: uniqueLineNumbers(segments.flatMap((segment) => segment.lineNumbers)),
          x,
          xEnd,
          xStart,
        };
      }

      const entries = panel.series
        .filter((series) => visibleKeys.has(series.key))
        .map((series) => {
          const point = series.points.find((entry) => entry.bucketKey === bucket.key);
          if (!point) {
            return null;
          }

          return {
            colorClass: colorClasses.get(series.key) ?? colorClass(0),
            label: series.label,
            lineNumbers: point.lineNumbers,
            metricKey: series.key,
            precision: point.precision,
            value: point.value,
          };
        })
        .filter((entry): entry is HoverEntry => entry !== null);

      if (entries.length === 0) {
        return null;
      }

      return {
        bucket,
        entries,
        lineNumbers: uniqueLineNumbers(entries.flatMap((entry) => entry.lineNumbers)),
        x,
        xEnd,
        xStart,
      };
    })
    .filter((entry): entry is HoverTarget => entry !== null);
}

function renderTooltip(
  tooltipEl: HTMLElement,
  panel: MetricsChartPanel,
  target: HoverTarget | null,
): void {
  tooltipEl.empty();
  if (!target) {
    tooltipEl.removeClass("is-visible");
    return;
  }

  tooltipEl.addClass("is-visible");
  tooltipEl.createDiv({
    cls: "metrics-lens-chart-tooltip-title",
    text: formatBucketHeading(target.bucket, panel.axisKind),
  });

  target.entries.forEach((entry) => {
    const row = tooltipEl.createDiv({ cls: "metrics-lens-chart-tooltip-row" });
    row.createSpan({
      cls: ["metrics-lens-chart-tooltip-swatch", entry.colorClass],
    });
    row.createSpan({
      cls: "metrics-lens-chart-tooltip-label",
      text: entry.label,
    });
    row.createSpan({
      cls: "metrics-lens-chart-tooltip-value",
      text: formatChartTooltipValue(
        entry.value,
        entry.metricKey,
        entry.precision,
        panel.unitKey === NO_UNIT_KEY ? null : panel.unitKey,
      ),
    });
  });
}

function attachHoverTargets(
  panelEl: HTMLElement,
  svg: SVGSVGElement,
  panel: MetricsChartPanel,
  targets: HoverTarget[],
  onSelect?: (selection: MetricsChartSelection) => void,
): void {
  if (targets.length === 0) {
    return;
  }

  const tooltipEl = panelEl.createDiv({ cls: "metrics-lens-chart-tooltip" });
  const crosshair = createSvgEl("line", {
    class: "metrics-lens-chart-crosshair",
    x1: 0,
    x2: 0,
    y1: PLOT_TOP,
    y2: CHART_HEIGHT - PLOT_BOTTOM,
  });
  svg.appendChild(crosshair);

  const overlay = createSvgEl("g");

  const showTarget = (target: HoverTarget): void => {
    crosshair.setAttribute("x1", String(target.x));
    crosshair.setAttribute("x2", String(target.x));
    crosshair.addClass("is-visible");
    renderTooltip(tooltipEl, panel, target);

    const panelBounds = panelEl.getBoundingClientRect();
    const svgBounds = svg.getBoundingClientRect();
    const tooltipWidth = tooltipEl.getBoundingClientRect().width || 180;
    const panelWidth = panelBounds.width || CHART_WIDTH;
    const svgWidth = svgBounds.width || panelWidth;
    const targetPx = (target.x / CHART_WIDTH) * svgWidth + (svgBounds.left - panelBounds.left);
    const anchorGap = -4;
    const preferredLeft =
      targetPx > panelWidth / 2 ? targetPx - tooltipWidth - anchorGap : targetPx + anchorGap;
    const clampedLeft = Math.max(0, Math.min(panelWidth - tooltipWidth, preferredLeft));
    tooltipEl.style.left = `${clampedLeft}px`;
  };

  const hideTarget = (): void => {
    crosshair.removeClass("is-visible");
    renderTooltip(tooltipEl, panel, null);
  };

  targets.forEach((target) => {
    const region = createSvgEl("rect", {
      class: "metrics-lens-chart-hover-region",
      height: CHART_HEIGHT - PLOT_BOTTOM - PLOT_TOP,
      width: target.xEnd - target.xStart,
      x: target.xStart,
      y: PLOT_TOP,
    });
    region.setAttribute("aria-label", `Focus ${formatBucketHeading(target.bucket, panel.axisKind)} in timeline`);
    region.setAttribute("role", "button");
    region.setAttribute("tabindex", "0");
    region.addEventListener("mouseenter", () => {
      showTarget(target);
    });
    region.addEventListener("mousemove", () => {
      showTarget(target);
    });
    region.addEventListener("focus", () => {
      showTarget(target);
    });
    region.addEventListener("mouseleave", () => {
      hideTarget();
    });
    region.addEventListener("blur", () => {
      hideTarget();
    });
    region.addEventListener("click", () => {
      onSelect?.({
        bucketKey: target.bucket.key,
        bucketLabel: formatBucketHeading(target.bucket, panel.axisKind),
        lineNumbers:
          target.lineNumbers.length > 0 ? target.lineNumbers : uniqueLineNumbers(target.bucket.lineNumbers),
      });
    });
    region.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      onSelect?.({
        bucketKey: target.bucket.key,
        bucketLabel: formatBucketHeading(target.bucket, panel.axisKind),
        lineNumbers:
          target.lineNumbers.length > 0 ? target.lineNumbers : uniqueLineNumbers(target.bucket.lineNumbers),
      });
    });
    overlay.appendChild(region);
  });

  svg.appendChild(overlay);
  panelEl.onmouseleave = () => {
    hideTarget();
  };
}

function renderLineChart(
  svg: SVGSVGElement,
  panel: MetricsChartPanel,
  panelWidth: number,
  onSelect?: (selection: MetricsChartSelection) => void,
): void {
  const { plotWidth, yForValue } = appendYAxis(svg, panel);
  const timestamps = panel.buckets
    .map((bucket) => bucket.timestamp)
    .filter((value): value is number => typeof value === "number");
  const minTimestamp = Math.min(...timestamps);
  const maxTimestamp = Math.max(...timestamps);
  const timeRange = maxTimestamp - minTimestamp || 1;
  const xForTimestamp = (timestamp: number): number =>
    PLOT_LEFT + ((timestamp - minTimestamp) / timeRange) * plotWidth;
  const colorClasses = colorClassBySeriesKey(panel);
  const visibleKeys = new Set(panel.series.map((series) => series.key));

  panel.series.forEach((series, index) => {
    if (series.points.length === 0) {
      return;
    }

    const pathData = series.points
      .filter((point) => point.timestamp !== null)
      .map((point, pointIndex) => {
        const x = xForTimestamp(point.timestamp!);
        const y = yForValue(point.value);
        return `${pointIndex === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

    if (pathData.length > 0) {
      svg.appendChild(
        createSvgEl("path", {
          class: `metrics-lens-chart-line ${colorClass(index)}`,
          d: pathData,
        }),
      );
    }

    series.points.forEach((point) => {
      if (point.timestamp === null) {
        return;
      }
      svg.appendChild(
        createSvgEl("circle", {
          class: `metrics-lens-chart-point ${colorClass(index)}`,
          cx: xForTimestamp(point.timestamp),
          cy: yForValue(point.value),
          r: 3,
        }),
      );
    });
  });

  const layout = xAxisLayout(panel, panelWidth, (bucket) => xForTimestamp(bucket.timestamp!));
  appendXAxisLabels(svg, layout, panel.axisKind);
  const targets = lineHoverTargets(panel, xForTimestamp, visibleKeys, colorClasses);
  attachHoverTargets(svg.parentElement as HTMLElement, svg, panel, targets, onSelect);
}

function renderBarChart(
  svg: SVGSVGElement,
  panel: MetricsChartPanel,
  panelWidth: number,
  onSelect?: (selection: MetricsChartSelection) => void,
): void {
  const { baselineValue, plotWidth, zeroY, yForValue } = appendYAxis(svg, panel);
  const seriesCount = Math.max(panel.series.length, 1);
  const bucketWidth = plotWidth / Math.max(panel.buckets.length, 1);
  const groupWidth = bucketWidth * 0.7;
  const barWidth = Math.max(groupWidth / seriesCount, 8);
  const colorClasses = colorClassBySeriesKey(panel);
  const visibleKeys = new Set(panel.series.map((series) => series.key));

  panel.buckets.forEach((bucket, bucketIndex) => {
    const groupStart = PLOT_LEFT + bucketIndex * bucketWidth + (bucketWidth - groupWidth) / 2;
    if (panel.stacked) {
      const segments = panel.stackSegments?.get(bucket.key) ?? [];
      let positiveTotal = 0;
      let negativeTotal = 0;

      segments.forEach((segment) => {
        const startValue = segment.value >= 0 ? positiveTotal : negativeTotal;
        const endValue = startValue + segment.value;
        if (segment.value >= 0) {
          positiveTotal = endValue;
        } else {
          negativeTotal = endValue;
        }

        const startY = yForValue(startValue);
        const endY = yForValue(endValue);
        svg.appendChild(
          createSvgEl("rect", {
            class: `metrics-lens-chart-bar is-stacked ${colorClasses.get(segment.key) ?? colorClass(0)}`,
            height: Math.abs(startY - endY),
            rx: 2,
            ry: 2,
            width: groupWidth,
            x: groupStart,
            y: Math.min(startY, endY),
          }),
        );
      });
      return;
    }

    panel.series.forEach((series, seriesIndex) => {
      const point = series.points.find((entry) => entry.bucketKey === bucket.key);
      if (!point) {
        return;
      }

      const y = yForValue(point.value);
      svg.appendChild(
        createSvgEl("rect", {
          class: `metrics-lens-chart-bar ${colorClass(seriesIndex)}`,
          height: Math.abs(zeroY - y),
          rx: 2,
          ry: 2,
          width: barWidth,
          x: groupStart + seriesIndex * barWidth,
          y: Math.min(y, zeroY),
        }),
      );
    });
  });

  appendBarChartGuideOverlay(svg, panel, plotWidth, yForValue, baselineValue);
  const layout = xAxisLayout(panel, panelWidth, (_bucket, index) => PLOT_LEFT + index * bucketWidth + bucketWidth / 2);
  appendXAxisLabels(svg, layout, panel.axisKind);
  const targets = barHoverTargets(panel, bucketWidth, visibleKeys, colorClasses);
  attachHoverTargets(svg.parentElement as HTMLElement, svg, panel, targets, onSelect);
}

function renderLegend(
  container: HTMLElement,
  panel: MetricsChartPanel,
  state: PanelInteractionState,
  onChange: () => void,
): void {
  container.empty();
  if (panel.series.length <= 1) {
    return;
  }

  panel.series.forEach((entry, index) => {
    const item = container.createDiv({ cls: "metrics-lens-chart-legend-item" });
    const isMuted = state.mutedSeriesKeys.has(entry.key);
    const isIsolated = state.isolatedSeriesKey === entry.key;
    const hasIsolation = state.isolatedSeriesKey !== null;
    item.toggleClass("is-muted", isMuted);
    item.toggleClass("is-isolated", isIsolated);
    item.toggleClass("is-dimmed", hasIsolation && !isIsolated);
    item.setAttribute("role", "button");
    item.tabIndex = 0;
    item.ariaLabel = "Click to isolate. Shift-click to mute.";
    item.createSpan({
      cls: ["metrics-lens-chart-legend-swatch", colorClass(index)],
    });
    item.createSpan({
      cls: "metrics-lens-chart-legend-label",
      text: entry.label,
    });

    const toggleMute = (): void => {
      if (state.mutedSeriesKeys.has(entry.key)) {
        state.mutedSeriesKeys.delete(entry.key);
        onChange();
        return;
      }

      if (visibleSeriesCount(panel, state) <= 1) {
        return;
      }

      state.mutedSeriesKeys.add(entry.key);
      if (state.isolatedSeriesKey === entry.key) {
        state.isolatedSeriesKey = null;
      }
      onChange();
    };

    item.addEventListener("click", (event) => {
      if (event.shiftKey) {
        toggleMute();
        return;
      }

      if (state.isolatedSeriesKey === entry.key) {
        state.isolatedSeriesKey = null;
      } else {
        state.isolatedSeriesKey = entry.key;
        state.mutedSeriesKeys.delete(entry.key);
      }
      onChange();
    });
    item.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      event.preventDefault();
      if (event.shiftKey) {
        toggleMute();
        return;
      }

      if (state.isolatedSeriesKey === entry.key) {
        state.isolatedSeriesKey = null;
      } else {
        state.isolatedSeriesKey = entry.key;
        state.mutedSeriesKeys.delete(entry.key);
      }
      onChange();
    });
  });
}

function chartPanelTitle(panel: MetricsChartPanel): string {
  const seriesLabels = panel.series.map((entry) => entry.label);
  const hasValueSeriesOnly = seriesLabels.length === 1 && seriesLabels[0] === "Value";

  if (panel.unitLabel && hasValueSeriesOnly) {
    return panel.unitLabel;
  }

  if (panel.unitLabel && seriesLabels.length === 1) {
    return `${seriesLabels[0]} (${panel.unitLabel})`;
  }

  if (panel.unitLabel && seriesLabels.length > 1) {
    return `${panel.unitLabel}: ${seriesLabels.join(", ")}`;
  }

  if (seriesLabels.length === 1) {
    return seriesLabels[0];
  }

  return seriesLabels.join(", ");
}

function renderPanel(
  container: HTMLElement,
  panel: MetricsChartPanel,
  model: MetricsChartModel,
  options?: RenderMetricsChartOptions,
): void {
  const panelEl = container.createDiv({ cls: "metrics-lens-chart-panel" });
  if (model.panelCount > 1) {
    panelEl.createEl("p", {
      cls: "metrics-lens-chart-panel-title",
      text: chartPanelTitle(panel),
    });
  }

  const legendEl = panelEl.createDiv({ cls: "metrics-lens-chart-legend" });
  const state: PanelInteractionState = {
    isolatedSeriesKey: null,
    mutedSeriesKeys: new Set<string>(),
  };

  const renderCurrentPanel = (): void => {
    const current = displayPanel(panel, state);
    legendEl.empty();
    renderLegend(legendEl, panel, state, renderCurrentPanel);
    const existingSvg = panelEl.querySelector(".metrics-lens-chart-svg");
    const existingTooltip = panelEl.querySelector(".metrics-lens-chart-tooltip");
    existingSvg?.remove();
    existingTooltip?.remove();

    const svg = createSvgEl("svg", {
      class: "metrics-lens-chart-svg",
      viewBox: `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`,
    });
    svg.setAttribute("aria-label", "Metrics chart");
    svg.setAttribute("role", "img");
    panelEl.appendChild(svg);

    const panelWidth = panelEl.getBoundingClientRect().width || CHART_WIDTH;
    if (current.kind === "line") {
      renderLineChart(svg, current, panelWidth, options?.onSelect);
    } else {
      renderBarChart(svg, current, panelWidth, options?.onSelect);
    }
  };

  renderCurrentPanel();
}

export function renderMetricsChart(
  container: HTMLElement,
  model: MetricsChartModel,
  options?: RenderMetricsChartOptions,
): void {
  const chartSection = container.createDiv({ cls: ["metrics-lens-section", "metrics-lens-chart"] });
  const panels = chartSection.createDiv({ cls: "metrics-lens-chart-panels" });
  model.panels.forEach((panel) => {
    renderPanel(panels, panel, model, options);
  });
}
