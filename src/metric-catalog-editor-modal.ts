import { App, Modal, Notice, Setting } from "obsidian";

import type MetricsPlugin from "./main";
import {
  allUnitKeys,
  canonicalMetricUnit,
  customMetricCatalogIssues,
  displayMetricUnitOption,
  getMetricCategory,
  getMetricDefinition,
  getMetricUnitDefinition,
  hasKnownMetricUnit,
  type CustomMetricCatalogDefinition,
  type MetricCatalogMetric,
  type MetricCatalogUnit,
} from "./metric-catalog";

interface MetricCatalogMetricEditorOptions {
  initialKey?: string;
  initialUnit?: string | null;
  onSaved?: () => void;
}

interface MetricCatalogUnitEditorOptions {
  initialUnit?: string;
  onSaved?: () => void;
}

function cloneCustomCatalog(catalog: CustomMetricCatalogDefinition): CustomMetricCatalogDefinition {
  return {
    categories: Object.fromEntries(
      Object.entries(catalog.categories).map(([key, value]) => [
        key,
        {
          ...value,
          iconCandidates: value.iconCandidates ? [...value.iconCandidates] : undefined,
        },
      ]),
    ),
    metrics: Object.fromEntries(
      Object.entries(catalog.metrics).map(([key, value]) => [
        key,
        {
          ...value,
          allowedUnits: value.allowedUnits ? [...value.allowedUnits] : undefined,
          iconCandidates: value.iconCandidates ? [...value.iconCandidates] : undefined,
        },
      ]),
    ),
    schemaVersion: 1,
    units: Object.fromEntries(
      Object.entries(catalog.units).map(([key, value]) => [
        key,
        {
          ...value,
          aliases: value.aliases ? [...value.aliases] : undefined,
        },
      ]),
    ),
  };
}

function trimOrUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function csvToArray(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ),
  );
}

function normalizeUnitCode(value: string): string {
  return canonicalMetricUnit(value) ?? value.trim();
}

function arrayToCsv(values: string[] | undefined): string {
  return values?.join(", ") ?? "";
}

function sentenceLabelFromKey(value: string): string {
  const lastSegment = value.trim().split(".").filter((segment) => segment.length > 0).pop() ?? value;
  const words = lastSegment
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();

  return words.length > 0 ? words.charAt(0).toUpperCase() + words.slice(1) : value.trim();
}

function categoryKeyFromMetricKey(metricKey: string): string {
  const [prefix] = metricKey.split(".", 1);
  return prefix?.trim() || "custom";
}

function normalizeFractionDigits(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : undefined;
}

async function saveCustomCatalog(
  plugin: MetricsPlugin,
  catalog: CustomMetricCatalogDefinition,
  onSaved: (() => void) | undefined,
): Promise<string[]> {
  const issues = customMetricCatalogIssues(catalog);
  if (issues.length > 0) {
    return issues;
  }

  plugin.settings.customCatalog = catalog;
  await plugin.saveSettings();
  plugin.refreshOpenMetricsViews();
  onSaved?.();
  return [];
}

export class MetricCatalogMetricEditorModal extends Modal {
  private readonly modalClass = "metrics-lens-catalog-modal-dialog";

  constructor(
    app: App,
    private readonly plugin: MetricsPlugin,
    private readonly options: MetricCatalogMetricEditorOptions = {},
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    this.modalEl.addClass(this.modalClass);
    contentEl.empty();

    const initialKey = this.options.initialKey?.trim() ?? "";
    const existingMetric = initialKey ? getMetricDefinition(initialKey) : null;
    const existingCustomMetric = initialKey ? this.plugin.settings.customCatalog.metrics[initialKey] : null;
    const existingCategory = getMetricCategory(initialKey);
    const initialUnit = this.options.initialUnit?.trim();

    let metricKey = initialKey;
    let label = existingCustomMetric?.label ?? existingMetric?.label ?? (initialKey ? sentenceLabelFromKey(initialKey) : "");
    let category = existingCustomMetric?.category ?? existingMetric?.category ?? (initialKey ? categoryKeyFromMetricKey(initialKey) : "");
    let categoryLabel = this.plugin.settings.customCatalog.categories[category]?.label ?? existingCategory?.label ?? sentenceLabelFromKey(category);
    let allowedUnits = arrayToCsv(existingCustomMetric?.allowedUnits ?? existingMetric?.allowedUnits ?? (initialUnit ? [initialUnit] : []));
    let defaultUnit = existingCustomMetric?.defaultUnit ?? existingMetric?.defaultUnit ?? initialUnit ?? "";
    let fractionDigits = typeof existingCustomMetric?.fractionDigits === "number"
      ? String(existingCustomMetric.fractionDigits)
      : typeof existingMetric?.fractionDigits === "number"
        ? String(existingMetric.fractionDigits)
        : "";
    let iconCandidates = arrayToCsv(existingCustomMetric?.iconCandidates ?? existingMetric?.iconCandidates);

    const formEl = contentEl.createEl("form", { cls: "metrics-lens-catalog-modal" });
    formEl.noValidate = true;
    formEl.createEl("h2", { text: initialKey ? "Edit custom metric" : "Add custom metric" });

    const statusEl = formEl.createDiv({ cls: "metrics-lens-record-modal-status" });
    statusEl.setAttribute("aria-live", "polite");
    statusEl.setAttribute("role", "status");

    const unitSuggestionsId = `metrics-lens-catalog-units-${Math.random().toString(36).slice(2, 8)}`;
    const unitSuggestions = formEl.createEl("datalist");
    unitSuggestions.id = unitSuggestionsId;
    allUnitKeys().forEach((unit) => {
      const option = unitSuggestions.createEl("option");
      option.value = unit;
      option.label = displayMetricUnitOption(unit);
    });

    const grid = formEl.createDiv({ cls: "metrics-lens-catalog-modal-grid" });

    new Setting(grid)
      .setName("Metric key")
      .setDesc("Canonical key saved in metric records.")
      .setClass("metrics-lens-record-modal-setting")
      .addText((text) => {
        text.setPlaceholder("training.run_distance");
        text.setValue(metricKey);
        text.inputEl.autocomplete = "off";
        text.inputEl.spellcheck = false;
        text.onChange((value) => {
          metricKey = value;
          if (!label.trim()) {
            label = sentenceLabelFromKey(value);
          }
        });
      });

    new Setting(grid)
      .setName("Label")
      .setDesc("Friendly label shown in rows, filters, and charts.")
      .setClass("metrics-lens-record-modal-setting")
      .addText((text) => {
        text.setPlaceholder("Run distance");
        text.setValue(label);
        text.onChange((value) => {
          label = value;
        });
      });

    new Setting(grid)
      .setName("Category key")
      .setDesc("Catalog category used for icon fallback and grouping metadata.")
      .setClass("metrics-lens-record-modal-setting")
      .addText((text) => {
        text.setPlaceholder("training");
        text.setValue(category);
        text.inputEl.autocomplete = "off";
        text.inputEl.spellcheck = false;
        text.onChange((value) => {
          category = value;
        });
      });

    new Setting(grid)
      .setName("Category label")
      .setDesc("Friendly category label.")
      .setClass("metrics-lens-record-modal-setting")
      .addText((text) => {
        text.setPlaceholder("Training");
        text.setValue(categoryLabel);
        text.onChange((value) => {
          categoryLabel = value;
        });
      });

    new Setting(grid)
      .setName("Allowed units")
      .setDesc("Comma-separated unit codes. Missing units are added with matching labels.")
      .setClass("metrics-lens-record-modal-setting")
      .addText((text) => {
        text.setPlaceholder("km");
        text.setValue(allowedUnits);
        text.inputEl.setAttribute("list", unitSuggestionsId);
        text.inputEl.autocomplete = "off";
        text.inputEl.spellcheck = false;
        text.onChange((value) => {
          allowedUnits = value;
        });
      });

    new Setting(grid)
      .setName("Default unit")
      .setDesc("Suggested unit when adding this metric.")
      .setClass("metrics-lens-record-modal-setting")
      .addText((text) => {
        text.setPlaceholder("km");
        text.setValue(defaultUnit);
        text.inputEl.setAttribute("list", unitSuggestionsId);
        text.inputEl.autocomplete = "off";
        text.inputEl.spellcheck = false;
        text.onChange((value) => {
          defaultUnit = value;
        });
      });

    new Setting(grid)
      .setName("Fraction digits")
      .setDesc("Optional fixed decimal places.")
      .setClass("metrics-lens-record-modal-setting")
      .addText((text) => {
        text.setPlaceholder("2");
        text.setValue(fractionDigits);
        text.inputEl.type = "number";
        text.inputEl.min = "0";
        text.inputEl.step = "1";
        text.onChange((value) => {
          fractionDigits = value;
        });
      });

    new Setting(grid)
      .setName("Icon candidates")
      .setDesc("Comma-separated Lucide icon names.")
      .setClass("metrics-lens-record-modal-setting")
      .addText((text) => {
        text.setPlaceholder("activity");
        text.setValue(iconCandidates);
        text.inputEl.autocomplete = "off";
        text.inputEl.spellcheck = false;
        text.onChange((value) => {
          iconCandidates = value;
        });
      });

    const actions = formEl.createDiv({ cls: "metrics-lens-actions" });
    const cancelButton = actions.createEl("button", { text: "Cancel" });
    cancelButton.type = "button";
    cancelButton.addEventListener("click", () => {
      this.close();
    });

    const saveButton = actions.createEl("button", { text: "Save metric" });
    saveButton.type = "submit";
    saveButton.addClass("mod-cta");

    const submit = async (): Promise<void> => {
      statusEl.removeClass("is-error");
      statusEl.setText("");

      const normalizedKey = trimOrUndefined(metricKey);
      const normalizedLabel = trimOrUndefined(label);
      const normalizedCategory = trimOrUndefined(category);
      const normalizedCategoryLabel = trimOrUndefined(categoryLabel);
      const normalizedAllowedUnits = Array.from(new Set(csvToArray(allowedUnits).map(normalizeUnitCode)));
      const normalizedDefaultUnit = trimOrUndefined(defaultUnit)
        ? normalizeUnitCode(defaultUnit)
        : undefined;
      const normalizedFractionDigits = normalizeFractionDigits(fractionDigits);
      const normalizedIconCandidates = csvToArray(iconCandidates);

      if (!normalizedKey) {
        statusEl.addClass("is-error");
        statusEl.setText("Metric key is required.");
        return;
      }
      if (!normalizedLabel) {
        statusEl.addClass("is-error");
        statusEl.setText("Label is required.");
        return;
      }
      if (!normalizedCategory) {
        statusEl.addClass("is-error");
        statusEl.setText("Category key is required.");
        return;
      }
      if (normalizedAllowedUnits.length === 0) {
        statusEl.addClass("is-error");
        statusEl.setText("At least one allowed unit is required.");
        return;
      }
      if (normalizedDefaultUnit && !normalizedAllowedUnits.includes(normalizedDefaultUnit)) {
        statusEl.addClass("is-error");
        statusEl.setText("Default unit must be included in allowed units.");
        return;
      }
      if (fractionDigits.trim() && typeof normalizedFractionDigits !== "number") {
        statusEl.addClass("is-error");
        statusEl.setText("Fraction digits must be a non-negative number.");
        return;
      }

      const nextCatalog = cloneCustomCatalog(this.plugin.settings.customCatalog);
      if (initialKey && initialKey !== normalizedKey) {
        delete nextCatalog.metrics[initialKey];
      }
      nextCatalog.categories[normalizedCategory] = {
        ...(nextCatalog.categories[normalizedCategory] ?? {}),
        label: normalizedCategoryLabel ?? sentenceLabelFromKey(normalizedCategory),
      };

      normalizedAllowedUnits.forEach((unit) => {
        if (!hasKnownMetricUnit(unit) && !nextCatalog.units[unit]) {
          nextCatalog.units[unit] = {
            display: unit,
            label: sentenceLabelFromKey(unit),
          };
        }
      });

      const metric: MetricCatalogMetric = {
        allowedUnits: normalizedAllowedUnits,
        category: normalizedCategory,
        label: normalizedLabel,
      };
      if (normalizedDefaultUnit) {
        metric.defaultUnit = normalizedDefaultUnit;
      }
      if (typeof normalizedFractionDigits === "number") {
        metric.fractionDigits = normalizedFractionDigits;
      }
      if (normalizedIconCandidates.length > 0) {
        metric.iconCandidates = normalizedIconCandidates;
      }
      nextCatalog.metrics[normalizedKey] = metric;

      const issues = await saveCustomCatalog(this.plugin, nextCatalog, this.options.onSaved);
      if (issues.length > 0) {
        statusEl.addClass("is-error");
        statusEl.setText(issues.join(" "));
        return;
      }

      new Notice(`Saved ${normalizedKey}.`);
      this.close();
    };

    formEl.addEventListener("submit", (event) => {
      event.preventDefault();
      void submit();
    });
  }
}

export class MetricCatalogUnitEditorModal extends Modal {
  private readonly modalClass = "metrics-lens-catalog-modal-dialog";

  constructor(
    app: App,
    private readonly plugin: MetricsPlugin,
    private readonly options: MetricCatalogUnitEditorOptions = {},
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    this.modalEl.addClass(this.modalClass);
    contentEl.empty();

    const initialUnit = this.options.initialUnit?.trim() ?? "";
    const existingUnit = initialUnit ? getMetricUnitDefinition(initialUnit) : null;
    const existingCustomUnit = initialUnit ? this.plugin.settings.customCatalog.units[initialUnit] : null;

    let unitKey = initialUnit;
    let label = existingCustomUnit?.label ?? existingUnit?.label ?? (initialUnit ? sentenceLabelFromKey(initialUnit) : "");
    let display = existingCustomUnit?.display ?? existingUnit?.display ?? initialUnit;
    let aliases = arrayToCsv(existingCustomUnit?.aliases ?? existingUnit?.aliases);
    let fractionDigits = typeof existingCustomUnit?.fractionDigits === "number"
      ? String(existingCustomUnit.fractionDigits)
      : typeof existingUnit?.fractionDigits === "number"
        ? String(existingUnit.fractionDigits)
        : "";
    let durationUnit = existingCustomUnit?.durationUnit ?? existingUnit?.durationUnit ?? "";

    const formEl = contentEl.createEl("form", { cls: "metrics-lens-catalog-modal" });
    formEl.noValidate = true;
    formEl.createEl("h2", { text: initialUnit ? "Edit custom unit" : "Add custom unit" });

    const statusEl = formEl.createDiv({ cls: "metrics-lens-record-modal-status" });
    statusEl.setAttribute("aria-live", "polite");
    statusEl.setAttribute("role", "status");

    const grid = formEl.createDiv({ cls: "metrics-lens-catalog-modal-grid" });

    new Setting(grid)
      .setName("Unit code")
      .setDesc("Canonical unit code saved in metric records.")
      .setClass("metrics-lens-record-modal-setting")
      .addText((text) => {
        text.setPlaceholder("km");
        text.setValue(unitKey);
        text.inputEl.autocomplete = "off";
        text.inputEl.spellcheck = false;
        text.onChange((value) => {
          unitKey = value;
        });
      });

    new Setting(grid)
      .setName("Label")
      .setDesc("Friendly unit label.")
      .setClass("metrics-lens-record-modal-setting")
      .addText((text) => {
        text.setPlaceholder("Kilometers");
        text.setValue(label);
        text.onChange((value) => {
          label = value;
        });
      });

    new Setting(grid)
      .setName("Display")
      .setDesc("Short display text shown next to values.")
      .setClass("metrics-lens-record-modal-setting")
      .addText((text) => {
        text.setPlaceholder("km");
        text.setValue(display);
        text.onChange((value) => {
          display = value;
        });
      });

    new Setting(grid)
      .setName("Aliases")
      .setDesc("Comma-separated input aliases.")
      .setClass("metrics-lens-record-modal-setting")
      .addText((text) => {
        text.setPlaceholder("kilometer, kilometers");
        text.setValue(aliases);
        text.inputEl.autocomplete = "off";
        text.inputEl.spellcheck = false;
        text.onChange((value) => {
          aliases = value;
        });
      });

    new Setting(grid)
      .setName("Fraction digits")
      .setDesc("Optional fixed decimal places.")
      .setClass("metrics-lens-record-modal-setting")
      .addText((text) => {
        text.setPlaceholder("2");
        text.setValue(fractionDigits);
        text.inputEl.type = "number";
        text.inputEl.min = "0";
        text.inputEl.step = "1";
        text.onChange((value) => {
          fractionDigits = value;
        });
      });

    new Setting(grid)
      .setName("Duration unit")
      .setDesc("Optional duration formatter base unit.")
      .setClass("metrics-lens-record-modal-setting")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("", "None")
          .addOption("h", "Hours")
          .addOption("min", "Minutes")
          .addOption("s", "Seconds")
          .setValue(durationUnit)
          .onChange((value) => {
            durationUnit = value;
          });
      });

    const actions = formEl.createDiv({ cls: "metrics-lens-actions" });
    const cancelButton = actions.createEl("button", { text: "Cancel" });
    cancelButton.type = "button";
    cancelButton.addEventListener("click", () => {
      this.close();
    });

    const saveButton = actions.createEl("button", { text: "Save unit" });
    saveButton.type = "submit";
    saveButton.addClass("mod-cta");

    const submit = async (): Promise<void> => {
      statusEl.removeClass("is-error");
      statusEl.setText("");

      const normalizedKey = trimOrUndefined(unitKey);
      const normalizedLabel = trimOrUndefined(label);
      const normalizedDisplay = trimOrUndefined(display);
      const normalizedAliases = csvToArray(aliases);
      const normalizedFractionDigits = normalizeFractionDigits(fractionDigits);

      if (!normalizedKey) {
        statusEl.addClass("is-error");
        statusEl.setText("Unit code is required.");
        return;
      }
      if (!normalizedLabel) {
        statusEl.addClass("is-error");
        statusEl.setText("Label is required.");
        return;
      }
      if (fractionDigits.trim() && typeof normalizedFractionDigits !== "number") {
        statusEl.addClass("is-error");
        statusEl.setText("Fraction digits must be a non-negative number.");
        return;
      }

      const nextCatalog = cloneCustomCatalog(this.plugin.settings.customCatalog);
      if (initialUnit && initialUnit !== normalizedKey) {
        delete nextCatalog.units[initialUnit];
      }
      const unit: MetricCatalogUnit = {
        label: normalizedLabel,
      };
      if (normalizedDisplay) {
        unit.display = normalizedDisplay;
      }
      if (normalizedAliases.length > 0) {
        unit.aliases = normalizedAliases;
      }
      if (typeof normalizedFractionDigits === "number") {
        unit.fractionDigits = normalizedFractionDigits;
      }
      if (durationUnit === "h" || durationUnit === "min" || durationUnit === "s") {
        unit.durationUnit = durationUnit;
      }
      nextCatalog.units[normalizedKey] = unit;

      const issues = await saveCustomCatalog(this.plugin, nextCatalog, this.options.onSaved);
      if (issues.length > 0) {
        statusEl.addClass("is-error");
        statusEl.setText(issues.join(" "));
        return;
      }

      new Notice(`Saved ${normalizedKey}.`);
      this.close();
    };

    formEl.addEventListener("submit", (event) => {
      event.preventDefault();
      void submit();
    });
  }
}
