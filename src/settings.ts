import { App, PluginSettingTab, Setting, normalizePath } from "obsidian";

import {
  createEmptyCustomMetricCatalog,
  customMetricCatalogIssues,
  displayMetricName,
  displayMetricUnitOption,
  normalizeCustomMetricCatalog,
  type CustomMetricCatalogDefinition,
  type MetricNameDisplayMode,
} from "./metric-catalog";
import type MetricsPlugin from "./main";
import {
  DEFAULT_TIME_BOUNDARY_CONFIG,
  normalizeDayStartHour,
  normalizeWeekStartsOn,
  type MetricsWeekStartDay,
} from "./time-boundaries";
import {
  normalizePersistedMetricsViewState,
  type PersistedMetricsViewState,
} from "./view-state";

export interface MetricsPluginSettings {
  customCatalog: CustomMetricCatalogDefinition;
  dayStartHour: number;
  defaultWriteFile: string;
  metricNameDisplayMode: MetricNameDisplayMode;
  metricsRoot: string;
  persistedViewStateByPath: Record<string, PersistedMetricsViewState>;
  recordReferencePrefix: string;
  showMetricIcons: boolean;
  supportedExtensions: string[];
  weekStartsOn: MetricsWeekStartDay;
}

export const DEFAULT_SETTINGS: MetricsPluginSettings = {
  customCatalog: createEmptyCustomMetricCatalog(),
  dayStartHour: DEFAULT_TIME_BOUNDARY_CONFIG.dayStartHour,
  defaultWriteFile: "Metrics/All.metrics.ndjson",
  metricNameDisplayMode: "friendly",
  metricsRoot: "Metrics",
  persistedViewStateByPath: {},
  recordReferencePrefix: "metric:",
  showMetricIcons: true,
  supportedExtensions: [".metrics.ndjson"],
  weekStartsOn: DEFAULT_TIME_BOUNDARY_CONFIG.weekStartsOn,
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
    customCatalog: normalizeCustomMetricCatalog(settings.customCatalog),
    dayStartHour: normalizeDayStartHour(settings.dayStartHour),
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
    weekStartsOn: normalizeWeekStartsOn(settings.weekStartsOn),
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

function formatCustomCatalog(catalog: CustomMetricCatalogDefinition): string {
  return JSON.stringify(normalizeCustomMetricCatalog(catalog), null, 2);
}

function cloneCustomCatalog(catalog: CustomMetricCatalogDefinition): CustomMetricCatalogDefinition {
  return normalizeCustomMetricCatalog(JSON.parse(JSON.stringify(catalog)) as unknown);
}

function parseCustomCatalog(value: string): { catalog: CustomMetricCatalogDefinition | null; issues: string[] } {
  const trimmed = value.trim();
  let parsedValue: unknown;

  if (!trimmed) {
    parsedValue = createEmptyCustomMetricCatalog();
  } else {
    try {
      parsedValue = JSON.parse(trimmed);
    } catch {
      return {
        catalog: null,
        issues: ["Custom catalog JSON must be valid JSON."],
      };
    }
  }

  const catalog = normalizeCustomMetricCatalog(parsedValue);
  const issues = customMetricCatalogIssues(catalog);
  return {
    catalog: issues.length === 0 ? catalog : null,
    issues,
  };
}

function hourLabel(hour: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2000, 0, 1, hour));
}

const WEEKDAY_OPTIONS: Array<{ label: string; value: MetricsWeekStartDay }> = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
];

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
          this.plugin.queueFileExplorerLabelSync();
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
          this.plugin.queueFileExplorerLabelSync();
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

    new Setting(containerEl).setName("Time boundaries").setHeading();

    new Setting(containerEl)
      .setName("Week starts on")
      .setDesc("Controls week grouping and the “this week” range.")
      .addDropdown((dropdown) => {
        WEEKDAY_OPTIONS.forEach((option) => {
          dropdown.addOption(String(option.value), option.label);
        });
        dropdown.setValue(String(this.plugin.settings.weekStartsOn));
        dropdown.onChange(async (value) => {
          this.plugin.settings.weekStartsOn = normalizeWeekStartsOn(value);
          await this.plugin.saveSettings();
          this.plugin.refreshOpenMetricsViews();
        });
      });

    new Setting(containerEl)
      .setName("Day starts at")
      .setDesc(
        "Rows without an explicit date roll over to the next day at this local time for grouping and time ranges.",
      )
      .addDropdown((dropdown) => {
        Array.from({ length: 24 }, (_, hour) => hour).forEach((hour) => {
          dropdown.addOption(String(hour), hourLabel(hour));
        });
        dropdown.setValue(String(this.plugin.settings.dayStartHour));
        dropdown.onChange(async (value) => {
          this.plugin.settings.dayStartHour = normalizeDayStartHour(value);
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
      .setDesc("Choose whether lists and selectors show friendly metric names or canonical keys.")
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

    new Setting(containerEl).setName("Metric catalog").setHeading();

    const catalogStatusEl = containerEl.createDiv({ cls: "metrics-lens-settings-status" });
    catalogStatusEl.setAttribute("aria-live", "polite");
    catalogStatusEl.setAttribute("role", "status");

    const setCatalogStatus = (message: string, isError: boolean): void => {
      catalogStatusEl.setText(message);
      catalogStatusEl.toggleClass("is-error", isError);
    };

    const initialCatalogIssues = customMetricCatalogIssues(this.plugin.settings.customCatalog);
    setCatalogStatus(
      initialCatalogIssues.length > 0
        ? initialCatalogIssues.join(" ")
        : "Custom catalog JSON is valid.",
      initialCatalogIssues.length > 0,
    );

    const refreshSettings = (): void => {
      this.display();
    };

    const saveCatalog = async (catalog: CustomMetricCatalogDefinition): Promise<boolean> => {
      const issues = customMetricCatalogIssues(catalog);
      if (issues.length > 0) {
        setCatalogStatus(issues.join(" "), true);
        return false;
      }

      this.plugin.settings.customCatalog = catalog;
      await this.plugin.saveSettings();
      this.plugin.refreshOpenMetricsViews();
      setCatalogStatus("Custom catalog JSON is valid.", false);
      return true;
    };

    const metricKeys = Object.keys(this.plugin.settings.customCatalog.metrics).sort((left, right) =>
      left.localeCompare(right),
    );
    const metricsCatalogSection = containerEl.createDiv({ cls: "metrics-lens-settings-catalog-section" });
    new Setting(metricsCatalogSection)
      .setName("Custom metrics")
      .setDesc("Add labels, units, default units, decimals, and icons for custom metric keys.")
      .setHeading()
      .addButton((button) => {
        button.setButtonText("Add metric");
        button.buttonEl.type = "button";
        button.onClick(() => {
          this.plugin.openMetricCatalogMetricEditor({ onSaved: refreshSettings });
        });
      });

    if (metricKeys.length === 0) {
      metricsCatalogSection.createDiv({
        cls: "metrics-lens-settings-empty",
        text: "No custom metrics yet.",
      });
    }

    metricKeys.forEach((key) => {
      const metric = this.plugin.settings.customCatalog.metrics[key];
      const units = metric.allowedUnits?.join(", ") ?? "No units";
      new Setting(metricsCatalogSection)
        .setName(metric.label ?? displayMetricName(key, this.plugin.settings.metricNameDisplayMode))
        .setDesc(`${key} · ${units}`)
        .setClass("metrics-lens-settings-catalog-row")
        .addButton((button) => {
          button.setButtonText("Edit");
          button.buttonEl.type = "button";
          button.onClick(() => {
            this.plugin.openMetricCatalogMetricEditor({
              initialKey: key,
              onSaved: refreshSettings,
            });
          });
        })
        .addButton((button) => {
          button.setButtonText("Remove");
          button.buttonEl.type = "button";
          button.onClick(async () => {
            const nextCatalog = cloneCustomCatalog(this.plugin.settings.customCatalog);
            delete nextCatalog.metrics[key];
            if (await saveCatalog(nextCatalog)) {
              refreshSettings();
            }
          });
        });
    });

    const unitKeys = Object.keys(this.plugin.settings.customCatalog.units).sort((left, right) =>
      left.localeCompare(right),
    );
    const unitsCatalogSection = containerEl.createDiv({ cls: "metrics-lens-settings-catalog-section" });
    new Setting(unitsCatalogSection)
      .setName("Custom units")
      .setDesc("Add labels, display text, aliases, decimal places, and duration formatting.")
      .setHeading()
      .addButton((button) => {
        button.setButtonText("Add unit");
        button.buttonEl.type = "button";
        button.onClick(() => {
          this.plugin.openMetricCatalogUnitEditor({ onSaved: refreshSettings });
        });
      });

    if (unitKeys.length === 0) {
      unitsCatalogSection.createDiv({
        cls: "metrics-lens-settings-empty",
        text: "No custom units yet.",
      });
    }

    unitKeys.forEach((key) => {
      const unit = this.plugin.settings.customCatalog.units[key];
      const aliases = unit.aliases && unit.aliases.length > 0 ? ` · Aliases: ${unit.aliases.join(", ")}` : "";
      new Setting(unitsCatalogSection)
        .setName(unit.label ?? displayMetricUnitOption(key))
        .setDesc(`${key}${aliases}`)
        .setClass("metrics-lens-settings-catalog-row")
        .addButton((button) => {
          button.setButtonText("Edit");
          button.buttonEl.type = "button";
          button.onClick(() => {
            this.plugin.openMetricCatalogUnitEditor({
              initialUnit: key,
              onSaved: refreshSettings,
            });
          });
        })
        .addButton((button) => {
          button.setButtonText("Remove");
          button.buttonEl.type = "button";
          button.onClick(async () => {
            const nextCatalog = cloneCustomCatalog(this.plugin.settings.customCatalog);
            delete nextCatalog.units[key];
            if (await saveCatalog(nextCatalog)) {
              refreshSettings();
            }
          });
        });
    });

    const advancedCatalogEl = containerEl.createEl("details", {
      cls: "metrics-lens-settings-catalog-json",
    });
    advancedCatalogEl.createEl("summary", { text: "Advanced catalog JSON" });

    let catalogValue = formatCustomCatalog(this.plugin.settings.customCatalog);
    let catalogTextAreaEl: HTMLTextAreaElement | null = null;

    new Setting(advancedCatalogEl)
      .setName("Custom catalog JSON")
      .setDesc("Direct editor for the custom catalog stored in this plugin's settings.")
      .setClass("metrics-lens-settings-catalog")
      .addTextArea((textArea) => {
        catalogTextAreaEl = textArea.inputEl;
        textArea.setValue(catalogValue);
        textArea.inputEl.rows = 14;
        textArea.inputEl.spellcheck = false;
        textArea.onChange((value) => {
          catalogValue = value;
        });
      })
      .addButton((button) => {
        button.setButtonText("Save catalog");
        button.buttonEl.type = "button";
        button.onClick(async () => {
          const result = parseCustomCatalog(catalogValue);
          if (!result.catalog) {
            setCatalogStatus(result.issues.join(" "), true);
            catalogTextAreaEl?.focus();
            return;
          }

          if (!(await saveCatalog(result.catalog))) {
            return;
          }

          catalogValue = formatCustomCatalog(result.catalog);
          if (catalogTextAreaEl) {
            catalogTextAreaEl.value = catalogValue;
          }
          refreshSettings();
        });
      })
      .addButton((button) => {
        button.setButtonText("Reset");
        button.buttonEl.type = "button";
        button.onClick(async () => {
          const emptyCatalog = createEmptyCustomMetricCatalog();
          this.plugin.settings.customCatalog = emptyCatalog;
          catalogValue = formatCustomCatalog(emptyCatalog);
          if (catalogTextAreaEl) {
            catalogTextAreaEl.value = catalogValue;
            catalogTextAreaEl.focus();
          }
          if (await saveCatalog(emptyCatalog)) {
            refreshSettings();
          }
        });
      });
  }
}
