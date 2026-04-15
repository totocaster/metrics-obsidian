import { App, Modal, Setting } from "obsidian";

import type { MetricRecord } from "./contract";
import {
  allMetricKeys,
  allUnitKeys,
  displayMetricOption,
  type MetricNameDisplayMode,
  displayMetricUnitOption,
  getDefaultUnitForMetric,
  getSupportedUnitsForMetric,
} from "./metric-catalog";
import type { MetricRecordInput } from "./metrics-file-mutation";

interface MetricRecordModalOptions {
  initialRecord?: Partial<MetricRecord>;
  metricNameDisplayMode: MetricNameDisplayMode;
  submitLabel: string;
  title: string;
}

function currentIsoTimestamp(): string {
  return new Date().toISOString();
}

function timestampDatePart(timestamp: string): string | null {
  const normalized = timestamp.trim();
  const match = normalized.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function trimOrUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function populateDatalist(
  datalist: HTMLDataListElement,
  values: string[],
  labelForValue: (value: string) => string,
): void {
  datalist.empty();
  values.forEach((value) => {
    const option = datalist.createEl("option");
    option.value = value;
    option.label = labelForValue(value);
  });
}

export class MetricRecordModal extends Modal {
  private readonly options: MetricRecordModalOptions;
  private readonly onSubmitValue: (value: MetricRecordInput) => void;
  private readonly modalClass = "metrics-lens-record-modal-dialog";

  constructor(
    app: App,
    options: MetricRecordModalOptions,
    onSubmitValue: (value: MetricRecordInput) => void,
  ) {
    super(app);
    this.options = options;
    this.onSubmitValue = onSubmitValue;
  }

  onOpen(): void {
    const { contentEl } = this;
    this.modalEl.addClass(this.modalClass);
    contentEl.empty();

    const formEl = contentEl.createEl("form", { cls: "metrics-lens-record-modal" });
    formEl.noValidate = true;

    formEl.createEl("h2", { text: this.options.title });

    const initial = this.options.initialRecord;

    let ts = initial?.ts ?? currentIsoTimestamp();
    let date = initial?.date ?? "";
    let key = initial?.key ?? "";
    let value = typeof initial?.value === "number" ? String(initial.value) : "";
    let unit = initial?.unit ?? "";
    let source = initial?.source ?? "manual";
    let originId = initial?.origin_id ?? "";
    let note = initial?.note ?? "";
    let tags = initial?.tags?.join(", ") ?? "";
    let context = initial?.context ? JSON.stringify(initial.context, null, 2) : "";
    const inputIdSuffix = Math.random().toString(36).slice(2, 8);
    const keySuggestionsId = `metrics-lens-key-suggestions-${inputIdSuffix}`;
    const unitSuggestionsId = `metrics-lens-unit-suggestions-${inputIdSuffix}`;
    const invalidSettingClass = "is-invalid";
    let activeStatusMessage = "";
    let primaryFocusInput: HTMLInputElement | HTMLTextAreaElement | null = null;
    let unitInputEl: HTMLInputElement | null = null;
    let timestampInputEl: HTMLInputElement | null = null;
    let dateInputEl: HTMLInputElement | null = null;
    let keyInputEl: HTMLInputElement | null = null;
    let valueInputEl: HTMLInputElement | null = null;
    let sourceInputEl: HTMLInputElement | null = null;
    let originIdInputEl: HTMLInputElement | null = null;
    let noteTextareaEl: HTMLTextAreaElement | null = null;
    let tagsInputEl: HTMLInputElement | null = null;
    let contextTextareaEl: HTMLTextAreaElement | null = null;
    let timestampSettingEl: HTMLElement | null = null;
    let dateSettingEl: HTMLElement | null = null;
    let keySettingEl: HTMLElement | null = null;
    let valueSettingEl: HTMLElement | null = null;
    let unitSettingEl: HTMLElement | null = null;
    let sourceSettingEl: HTMLElement | null = null;
    let originIdSettingEl: HTMLElement | null = null;
    let noteSettingEl: HTMLElement | null = null;
    let tagsSettingEl: HTMLElement | null = null;
    let contextSettingEl: HTMLElement | null = null;

    const keySuggestions = formEl.createEl("datalist");
    keySuggestions.id = keySuggestionsId;
    populateDatalist(
      keySuggestions,
      allMetricKeys(),
      (value) => displayMetricOption(value, this.options.metricNameDisplayMode),
    );

    const unitSuggestions = formEl.createEl("datalist");
    unitSuggestions.id = unitSuggestionsId;

    const syncUnitSuggestions = (): void => {
      const supportedUnits = getSupportedUnitsForMetric(key.trim());
      populateDatalist(
        unitSuggestions,
        supportedUnits.length > 0 ? supportedUnits : allUnitKeys(),
        displayMetricUnitOption,
      );

      if (unitInputEl) {
        unitInputEl.placeholder = getDefaultUnitForMetric(key.trim()) ?? "kg";
      }
    };

    const statusEl = formEl.createDiv({ cls: "metrics-lens-record-modal-status" });
    statusEl.setAttribute("aria-live", "polite");
    statusEl.setAttribute("role", "status");

    formEl.createEl("h3", {
      cls: "metrics-lens-record-modal-section-title is-first",
      text: "Required fields",
    });

    const coreGrid = formEl.createDiv({ cls: "metrics-lens-record-modal-grid" });

    const clearFieldState = (settingEl: HTMLElement | null, inputEl: HTMLInputElement | HTMLTextAreaElement | null): void => {
      settingEl?.classList.remove(invalidSettingClass);
      inputEl?.removeAttribute("aria-invalid");
      if (statusEl.innerText === activeStatusMessage) {
        statusEl.classList.remove("is-error");
        statusEl.setText("");
        activeStatusMessage = "";
      }
    };

    const markFieldInvalid = (
      settingEl: HTMLElement | null,
      inputEl: HTMLInputElement | HTMLTextAreaElement | null,
      message: string,
      focusableEl: HTMLInputElement | HTMLTextAreaElement | null,
    ): void => {
      settingEl?.classList.add(invalidSettingClass);
      inputEl?.setAttribute("aria-invalid", "true");
      if (activeStatusMessage.length === 0) {
        statusEl.setText(message);
        statusEl.classList.add("is-error");
        activeStatusMessage = message;
      }
      if (!primaryFocusInput) {
        primaryFocusInput = focusableEl;
      }
    };

    const wireSingleLineInput = (
      inputEl: HTMLInputElement,
      onChange: (nextValue: string) => void,
      onSubmit: () => void,
    ): void => {
      inputEl.addEventListener("input", () => {
        onChange(inputEl.value);
        if (statusEl.innerText.length > 0) {
          clearFieldState(inputEl.closest(".setting-item") as HTMLElement | null, inputEl);
        }
      });

      inputEl.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" || event.isComposing) {
          return;
        }

        event.preventDefault();
        onSubmit();
      });
    };

    const wireTextareaInput = (
      inputEl: HTMLTextAreaElement,
      onChange: (nextValue: string) => void,
      onSubmit: () => void,
    ): void => {
      inputEl.addEventListener("input", () => {
        onChange(inputEl.value);
        if (statusEl.innerText.length > 0) {
          clearFieldState(inputEl.closest(".setting-item") as HTMLElement | null, inputEl);
        }
      });

      inputEl.addEventListener("keydown", (event) => {
        if (!event.key || event.key !== "Enter" || !(event.metaKey || event.ctrlKey)) {
          return;
        }

        event.preventDefault();
        onSubmit();
      });
    };

    const submit = (): void => {
      const parsedValueText = trimOrUndefined(value);
      const parsedValue = parsedValueText ? Number(parsedValueText) : Number.NaN;
      const normalizedTimestamp = trimOrUndefined(ts);
      const normalizedKey = trimOrUndefined(key);
      const normalizedSource = trimOrUndefined(source);

      const resetValidation = (): void => {
        [
          timestampSettingEl,
          dateSettingEl,
          keySettingEl,
          valueSettingEl,
          unitSettingEl,
          sourceSettingEl,
          originIdSettingEl,
          noteSettingEl,
          tagsSettingEl,
          contextSettingEl,
        ].forEach((settingEl) => {
          settingEl?.classList.remove(invalidSettingClass);
        });
        [
          timestampInputEl,
          dateInputEl,
          keyInputEl,
          valueInputEl,
          unitInputEl,
          sourceInputEl,
          originIdInputEl,
          noteTextareaEl,
          tagsInputEl,
          contextTextareaEl,
        ].forEach((inputEl) => {
          inputEl?.removeAttribute("aria-invalid");
        });
      };

      resetValidation();
      statusEl.classList.remove("is-error");
      statusEl.setText("");
      activeStatusMessage = "";
      primaryFocusInput = null;

      if (!normalizedTimestamp) {
        markFieldInvalid(timestampSettingEl, timestampInputEl, "Timestamp is required.", timestampInputEl);
      }

      if (!normalizedKey) {
        markFieldInvalid(keySettingEl, keyInputEl, "Key is required.", keyInputEl);
      }

      if (!normalizedSource) {
        markFieldInvalid(sourceSettingEl, sourceInputEl, "Source is required.", sourceInputEl);
      }

      if (!parsedValueText || !Number.isFinite(parsedValue)) {
        markFieldInvalid(valueSettingEl, valueInputEl, "Value must be a finite number.", valueInputEl);
      }

      let parsedContext: Record<string, unknown> | undefined;
      const normalizedContext = trimOrUndefined(context);
      if (normalizedContext) {
        let contextValue: unknown = undefined;
        try {
          contextValue = JSON.parse(normalizedContext);
        } catch {
          markFieldInvalid(contextSettingEl, contextTextareaEl, "Context JSON must be valid JSON.", contextTextareaEl);
        }

        if (statusEl.innerText.length === 0 && typeof contextValue === "object" && contextValue !== null && !Array.isArray(contextValue)) {
          parsedContext = contextValue as Record<string, unknown>;
        } else if (statusEl.innerText.length === 0) {
          markFieldInvalid(contextSettingEl, contextTextareaEl, "Context JSON must be a JSON object.", contextTextareaEl);
        }
      }

      if (statusEl.innerText.length > 0) {
        const focusTarget = primaryFocusInput as HTMLInputElement | HTMLTextAreaElement | null;
        focusTarget?.focus();
        focusTarget?.select();
        return;
      }

      const parsedTags = trimOrUndefined(tags)
        ?.split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      this.onSubmitValue({
        context: parsedContext,
        date: trimOrUndefined(date),
        id: initial?.id,
        key: normalizedKey as string,
        note: trimOrUndefined(note),
        origin_id: trimOrUndefined(originId),
        source: normalizedSource as string,
        tags: parsedTags,
        ts: normalizedTimestamp as string,
        unit: trimOrUndefined(unit),
        value: parsedValue,
      });
      this.close();
    };

    formEl.addEventListener("submit", (event) => {
      event.preventDefault();
      submit();
    });

    const timestampSetting = new Setting(coreGrid)
      .setName("Timestamp")
      .setDesc("ISO-8601 timestamp with timezone.")
      .setClass("metrics-lens-record-modal-setting");
    timestampSettingEl = timestampSetting.settingEl;
    timestampSetting.addText((text) => {
      timestampInputEl = text.inputEl;
      text.setPlaceholder("2026-04-14T09:30:00+04:00");
      text.setValue(ts);
      text.inputEl.autocomplete = "off";
      text.inputEl.spellcheck = false;
      wireSingleLineInput(text.inputEl, (nextValue) => {
        ts = nextValue;
      }, submit);
    });
    timestampSetting.addButton((button) => {
      button.setButtonText("Use now");
      button.buttonEl.type = "button";
      button.setTooltip("Set the timestamp to the current time.");
      button.onClick(() => {
        ts = currentIsoTimestamp();
        if (timestampInputEl) {
          timestampInputEl.value = ts;
          timestampInputEl.focus();
          timestampInputEl.select();
        }
      });
    });

    const dateSetting = new Setting(coreGrid)
      .setName("Date")
      .setDesc("Optional local date in YYYY-MM-DD format.")
      .setClass("metrics-lens-record-modal-setting");
    dateSettingEl = dateSetting.settingEl;
    dateSetting.addText((text) => {
      dateInputEl = text.inputEl;
      text.setPlaceholder("2026-04-14");
      text.setValue(date);
      text.inputEl.autocomplete = "off";
      text.inputEl.spellcheck = false;
      wireSingleLineInput(text.inputEl, (nextValue) => {
        date = nextValue;
      }, submit);
    });
    dateSetting.addButton((button) => {
      button.setButtonText("Use timestamp date");
      button.buttonEl.type = "button";
      button.setTooltip("Copy the date portion from the timestamp.");
      button.onClick(() => {
        const derivedDate = timestampDatePart(ts);
        if (!derivedDate || !dateInputEl) {
          return;
        }

        date = derivedDate;
        dateInputEl.value = derivedDate;
        dateInputEl.focus();
        dateInputEl.select();
      });
    });

    const keySetting = new Setting(coreGrid)
      .setName("Key")
      .setDesc("Canonical metric key. Known keys are suggested from the built-in catalog.")
      .setClass("metrics-lens-record-modal-setting");
    keySettingEl = keySetting.settingEl;
    keySetting.addText((text) => {
      keyInputEl = text.inputEl;
      text.setPlaceholder("body.weight");
      text.setValue(key);
      text.inputEl.setAttribute("list", keySuggestionsId);
      text.inputEl.autocomplete = "off";
      text.inputEl.spellcheck = false;
      wireSingleLineInput(text.inputEl, (nextValue) => {
        key = nextValue;
        syncUnitSuggestions();
      }, submit);
    });

    const valueSetting = new Setting(coreGrid)
      .setName("Value")
      .setDesc("Numeric metric value.")
      .setClass("metrics-lens-record-modal-setting");
    valueSettingEl = valueSetting.settingEl;
    valueSetting.addText((text) => {
      valueInputEl = text.inputEl;
      text.inputEl.type = "number";
      text.inputEl.step = "any";
      text.inputEl.inputMode = "decimal";
      text.setPlaceholder("104.4");
      text.setValue(value);
      text.inputEl.autocomplete = "off";
      text.inputEl.spellcheck = false;
      wireSingleLineInput(text.inputEl, (nextValue) => {
        value = nextValue;
      }, submit);
    });

    const unitSetting = new Setting(coreGrid)
      .setName("Unit")
      .setDesc("Optional canonical unit code. Catalog-backed suggestions follow the current key.")
      .setClass("metrics-lens-record-modal-setting");
    unitSettingEl = unitSetting.settingEl;
    unitSetting.addText((text) => {
      unitInputEl = text.inputEl;
      text.inputEl.setAttribute("list", unitSuggestionsId);
      text.setPlaceholder(getDefaultUnitForMetric(key.trim()) ?? "kg");
      text.setValue(unit);
      text.inputEl.autocomplete = "off";
      text.inputEl.spellcheck = false;
      wireSingleLineInput(text.inputEl, (nextValue) => {
        unit = nextValue;
      }, submit);
    });

    const sourceSetting = new Setting(coreGrid)
      .setName("Source")
      .setDesc("Origin system for this record.")
      .setClass("metrics-lens-record-modal-setting");
    sourceSettingEl = sourceSetting.settingEl;
    sourceSetting.addText((text) => {
      sourceInputEl = text.inputEl;
      text.setPlaceholder("manual");
      text.setValue(source);
      text.inputEl.autocomplete = "off";
      text.inputEl.spellcheck = false;
      wireSingleLineInput(text.inputEl, (nextValue) => {
        source = nextValue;
      }, submit);
    });

    formEl.createEl("h3", {
      cls: "metrics-lens-record-modal-section-title",
      text: "Optional fields",
    });

    const optionalGrid = formEl.createDiv({ cls: "metrics-lens-record-modal-optional" });

    const originIdSetting = new Setting(optionalGrid)
      .setName("Origin id")
      .setDesc("Optional external provenance id.")
      .setClass("metrics-lens-record-modal-setting");
    originIdSettingEl = originIdSetting.settingEl;
    originIdSetting.addText((text) => {
      originIdInputEl = text.inputEl;
      text.setPlaceholder("withings:2026-04-14:body.weight");
      text.setValue(originId);
      text.inputEl.autocomplete = "off";
      text.inputEl.spellcheck = false;
      wireSingleLineInput(text.inputEl, (nextValue) => {
        originId = nextValue;
      }, submit);
    });

    const noteSetting = new Setting(optionalGrid)
      .setName("Note")
      .setDesc("Optional human-readable note.")
      .setClass("metrics-lens-record-modal-setting");
    noteSettingEl = noteSetting.settingEl;
    noteTextareaEl = noteSetting.controlEl.createEl("textarea");
    noteTextareaEl.rows = 3;
    noteTextareaEl.value = note;
    noteTextareaEl.spellcheck = true;
    noteTextareaEl.placeholder = "Add a short note";
    wireTextareaInput(noteTextareaEl, (nextValue) => {
      note = nextValue;
    }, submit);

    const tagsSetting = new Setting(optionalGrid)
      .setName("Tags")
      .setDesc("Optional comma-separated tags.")
      .setClass("metrics-lens-record-modal-setting");
    tagsSettingEl = tagsSetting.settingEl;
    tagsInputEl = tagsSetting.controlEl.createEl("input", { type: "text" });
    tagsInputEl.value = tags;
    tagsInputEl.placeholder = "food, lunch";
    tagsInputEl.autocomplete = "off";
    tagsInputEl.spellcheck = false;
    wireSingleLineInput(tagsInputEl, (nextValue) => {
      tags = nextValue;
    }, submit);

    const contextSetting = new Setting(optionalGrid)
      .setName("Context JSON")
      .setDesc("Optional JSON object stored as structured context.")
      .setClass("metrics-lens-record-modal-setting");
    contextSettingEl = contextSetting.settingEl;
    contextTextareaEl = contextSetting.controlEl.createEl("textarea");
    contextTextareaEl.rows = 5;
    contextTextareaEl.value = context;
    contextTextareaEl.placeholder = '{"precision":"date"}';
    contextTextareaEl.spellcheck = false;
    wireTextareaInput(contextTextareaEl, (nextValue) => {
      context = nextValue;
    }, submit);

    syncUnitSuggestions();

    const buttonRow = formEl.createDiv({ cls: "metrics-lens-actions metrics-lens-record-modal-actions" });
    const cancelButton = buttonRow.createEl("button", { text: "Cancel" });
    cancelButton.type = "button";
    cancelButton.addEventListener("click", () => {
      this.close();
    });

    const submitButton = buttonRow.createEl("button", {
      cls: "mod-cta",
      text: this.options.submitLabel,
    });
    submitButton.type = "submit";
    submitButton.setAttribute("aria-label", this.options.submitLabel);

    window.setTimeout(() => {
      const focusTarget = initial?.id ? valueInputEl : keyInputEl;
      if (focusTarget) {
        focusTarget.focus();
        focusTarget.select();
      }
    }, 0);
  }

  onClose(): void {
    this.modalEl.removeClass(this.modalClass);
    this.contentEl.empty();
    super.onClose();
  }
}
