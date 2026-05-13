import type { MetricsChartModel, MetricsChartPanel } from "./chart-model";
import {
  appendBarChartGuideOverlay,
  appendXAxisLabels,
  appendYAxis,
  attachHoverTargets,
  chartPanelTitle,
  colorClassBySeriesKey,
  displayPanel,
  lineHoverTargets,
  barHoverTargets,
  renderLegend,
  xAxisLayout as buildXAxisLayout,
  type MetricsChartSelection,
  type PanelInteractionState,
} from "./chart-renderer-helpers";

const CHART_WIDTH = 640;
const PLOT_LEFT = 40;

function createSvgEl<K extends keyof SVGElementTagNameMap>(
  svg: SVGSVGElement,
  tagName: K,
): SVGElementTagNameMap[K] {
  return svg.ownerDocument.createElementNS("http://www.w3.org/2000/svg", tagName);
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
      const path = createSvgEl(svg, "path");
      path.setAttribute("class", `metrics-lens-chart-line metrics-lens-chart-series-${index % 6}`);
      path.setAttribute("d", pathData);
      svg.appendChild(path);
    }

    series.points.forEach((point) => {
      if (point.timestamp === null) {
        return;
      }
      const circle = createSvgEl(svg, "circle");
      circle.setAttribute("class", `metrics-lens-chart-point metrics-lens-chart-series-${index % 6}`);
      circle.setAttribute("cx", String(xForTimestamp(point.timestamp)));
      circle.setAttribute("cy", String(yForValue(point.value)));
      circle.setAttribute("r", "3");
      svg.appendChild(circle);
    });
  });

  const layout = buildXAxisLayout(panel, panelWidth, (bucket) => xForTimestamp(bucket.timestamp!));
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
        const rect = createSvgEl(svg, "rect");
        rect.setAttribute("class", `metrics-lens-chart-bar is-stacked ${colorClasses.get(segment.key) ?? "metrics-lens-chart-series-0"}`);
        rect.setAttribute("height", String(Math.abs(startY - endY)));
        rect.setAttribute("rx", "2");
        rect.setAttribute("ry", "2");
        rect.setAttribute("width", String(groupWidth));
        rect.setAttribute("x", String(groupStart));
        rect.setAttribute("y", String(Math.min(startY, endY)));
        svg.appendChild(rect);
      });
      return;
    }

    panel.series.forEach((series, seriesIndex) => {
      const point = series.points.find((entry) => entry.bucketKey === bucket.key);
      if (!point) {
        return;
      }

      const y = yForValue(point.value);
      const rect = createSvgEl(svg, "rect");
      rect.setAttribute("class", `metrics-lens-chart-bar metrics-lens-chart-series-${seriesIndex % 6}`);
      rect.setAttribute("height", String(Math.abs(zeroY - y)));
      rect.setAttribute("rx", "2");
      rect.setAttribute("ry", "2");
      rect.setAttribute("width", String(barWidth));
      rect.setAttribute("x", String(groupStart + seriesIndex * barWidth));
      rect.setAttribute("y", String(Math.min(y, zeroY)));
      svg.appendChild(rect);
    });
  });

  appendBarChartGuideOverlay(svg, panel, plotWidth, yForValue, baselineValue);
  const layout = buildXAxisLayout(panel, panelWidth, (_bucket, index) => PLOT_LEFT + index * bucketWidth + bucketWidth / 2);
  appendXAxisLabels(svg, layout, panel.axisKind);
  const targets = barHoverTargets(panel, bucketWidth, visibleKeys, colorClasses);
  attachHoverTargets(svg.parentElement as HTMLElement, svg, panel, targets, onSelect);
}

function renderPanel(
  container: HTMLElement,
  panel: MetricsChartPanel,
  model: MetricsChartModel,
  options?: { onSelect?: (selection: MetricsChartSelection) => void },
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

    const svg = panelEl.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "metrics-lens-chart-svg");
    svg.setAttribute("viewBox", `0 0 ${CHART_WIDTH} 248`);
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
  options?: { onSelect?: (selection: MetricsChartSelection) => void },
): void {
  const chartSection = container.createDiv({ cls: ["metrics-lens-section", "metrics-lens-chart"] });
  const panels = chartSection.createDiv({ cls: "metrics-lens-chart-panels" });
  model.panels.forEach((panel) => {
    renderPanel(panels, panel, model, options);
  });
}

export type { MetricsChartSelection } from "./chart-renderer-helpers";
