import { App, PluginSettingTab, Setting, normalizePath } from "obsidian";

import type { MetricNameDisplayMode } from "./metric-catalog";
import type MetricsPlugin from "./main";
import {
  normalizePersistedMetricsViewState,
  type PersistedMetricsViewState,
} from "./view-state";

export interface MetricsPluginSettings {
  defaultWriteFile: string;
  metricNameDisplayMode: MetricNameDisplayMode;
  metricsRoot: string;
  persistedViewStateByPath: Record<string, PersistedMetricsViewState>;
  recordReferencePrefix: string;
  showMetricIcons: boolean;
  supportedExtensions: string[];
}

export const DEFAULT_SETTINGS: MetricsPluginSettings = {
  defaultWriteFile: "Metrics/All.metrics.ndjson",
  metricNameDisplayMode: "friendly",
  metricsRoot: "Metrics",
  persistedViewStateByPath: {},
  recordReferencePrefix: "metric:",
  showMetricIcons: true,
  supportedExtensions: [".metrics.ndjson"],
};

export function normalizeMetricsSettings(
  settings: Partial<MetricsPluginSettings>,
): MetricsPluginSettings {
  const supportedExtensions = settings.supportedExtensions?.length
    ? settings.supportedExtensions
    : DEFAULT_SETTINGS.supportedExtensions;
  const persistedViewStateByPath = Object.fromEntries(
    Object.entries(settings.persistedViewStateByPath ?? {}).map(([path, value]) => [
      normalizePath(path),
      normalizePersistedMetricsViewState(value),
    ]),
  );

  return {
    defaultWriteFile: normalizePath(settings.defaultWriteFile ?? DEFAULT_SETTINGS.defaultWriteFile),
    metricNameDisplayMode:
      settings.metricNameDisplayMode === "key" ? "key" : DEFAULT_SETTINGS.metricNameDisplayMode,
    metricsRoot: normalizePath(settings.metricsRoot ?? DEFAULT_SETTINGS.metricsRoot),
    persistedViewStateByPath,
    recordReferencePrefix:
      settings.recordReferencePrefix?.trim() || DEFAULT_SETTINGS.recordReferencePrefix,
    showMetricIcons: settings.showMetricIcons ?? DEFAULT_SETTINGS.showMetricIcons,
    supportedExtensions: Array.from(
      new Set(
        supportedExtensions
          .map((value) => value.trim())
          .filter((value) => value.length > 0),
      ),
    ),
  };
}

function formatExtensions(extensions: string[]): string {
  return extensions.join(", ");
}

function parseExtensions(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export class MetricsSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly plugin: MetricsPlugin,
  ) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setName("Storage").setHeading();

    new Setting(containerEl)
      .setName("Metrics root folder")
      .setDesc("Folder scanned for canonical metrics files.")
      .addText((text) => {
        text.setPlaceholder(DEFAULT_SETTINGS.metricsRoot);
        text.setValue(this.plugin.settings.metricsRoot);
        text.onChange(async (value) => {
          this.plugin.settings.metricsRoot = normalizePath(value || DEFAULT_SETTINGS.metricsRoot);
          await this.plugin.saveSettings();
          this.plugin.refreshOpenMetricsViews();
        });
      });

    new Setting(containerEl)
      .setName("Supported extensions")
      .setDesc("Comma-separated list of file suffixes treated as metrics files.")
      .addText((text) => {
        text.setPlaceholder(formatExtensions(DEFAULT_SETTINGS.supportedExtensions));
        text.setValue(formatExtensions(this.plugin.settings.supportedExtensions));
        text.onChange(async (value) => {
          this.plugin.settings.supportedExtensions = parseExtensions(value);
          await this.plugin.saveSettings();
          this.plugin.refreshOpenMetricsViews();
        });
      });

    new Setting(containerEl)
      .setName("Default write file")
      .setDesc("Default target file used by future create and append actions.")
      .addText((text) => {
        text.setPlaceholder(DEFAULT_SETTINGS.defaultWriteFile);
        text.setValue(this.plugin.settings.defaultWriteFile);
        text.onChange(async (value) => {
          this.plugin.settings.defaultWriteFile = normalizePath(
            value || DEFAULT_SETTINGS.defaultWriteFile,
          );
          await this.plugin.saveSettings();
          this.plugin.refreshOpenMetricsViews();
        });
      });

    new Setting(containerEl)
      .setName("Record reference prefix")
      .setDesc("Plain-text prefix used for stable metric references in Markdown.")
      .addText((text) => {
        text.setPlaceholder(DEFAULT_SETTINGS.recordReferencePrefix);
        text.setValue(this.plugin.settings.recordReferencePrefix);
        text.onChange(async (value) => {
          this.plugin.settings.recordReferencePrefix =
            value.trim() || DEFAULT_SETTINGS.recordReferencePrefix;
          await this.plugin.saveSettings();
          this.plugin.refreshOpenMetricsViews();
        });
      });

    new Setting(containerEl).setName("Appearance").setHeading();

    new Setting(containerEl)
      .setName("Show metric icons")
      .setDesc("Show mapped Lucide icons next to metrics when the icon exists in Obsidian.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.showMetricIcons);
        toggle.onChange(async (value) => {
          this.plugin.settings.showMetricIcons = value;
          await this.plugin.saveSettings();
          this.plugin.refreshOpenMetricsViews();
        });
      });

    new Setting(containerEl)
      .setName("Metric label display")
      .setDesc("Choose whether lists and dropdowns show friendly metric names or canonical keys.")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("friendly", "Friendly names")
          .addOption("key", "Canonical keys")
          .setValue(this.plugin.settings.metricNameDisplayMode)
          .onChange(async (value) => {
            this.plugin.settings.metricNameDisplayMode = value === "key" ? "key" : "friendly";
            await this.plugin.saveSettings();
            this.plugin.refreshOpenMetricsViews();
          });
      });
  }
}
