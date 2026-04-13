import { App, Modal, Notice, Setting } from "obsidian";

import type { MetricRecord } from "./contract";
import type { MetricRecordInput } from "./metrics-file-mutation";

interface MetricRecordModalOptions {
  initialRecord?: Partial<MetricRecord>;
  submitLabel: string;
  title: string;
}

function currentIsoTimestamp(): string {
  return new Date().toISOString();
}

function trimOrUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export class MetricRecordModal extends Modal {
  private readonly options: MetricRecordModalOptions;
  private readonly onSubmitValue: (value: MetricRecordInput) => void;

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
    contentEl.empty();

    contentEl.createEl("h2", { text: this.options.title });

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

    new Setting(contentEl)
      .setName("Timestamp")
      .setDesc("ISO-8601 timestamp with timezone.")
      .addText((text) => {
        text.setPlaceholder("2026-04-14T09:30:00+04:00");
        text.setValue(ts);
        text.onChange((nextValue) => {
          ts = nextValue;
        });
      });

    new Setting(contentEl)
      .setName("Date")
      .setDesc("Optional local date in YYYY-MM-DD format.")
      .addText((text) => {
        text.setPlaceholder("2026-04-14");
        text.setValue(date);
        text.onChange((nextValue) => {
          date = nextValue;
        });
      });

    new Setting(contentEl)
      .setName("Key")
      .setDesc("Canonical metric key.")
      .addText((text) => {
        text.setPlaceholder("body.weight");
        text.setValue(key);
        text.onChange((nextValue) => {
          key = nextValue;
        });
      });

    new Setting(contentEl)
      .setName("Value")
      .setDesc("Numeric metric value.")
      .addText((text) => {
        text.inputEl.type = "number";
        text.inputEl.step = "any";
        text.setPlaceholder("104.4");
        text.setValue(value);
        text.onChange((nextValue) => {
          value = nextValue;
        });
      });

    new Setting(contentEl)
      .setName("Unit")
      .setDesc("Optional display unit.")
      .addText((text) => {
        text.setPlaceholder("kg");
        text.setValue(unit);
        text.onChange((nextValue) => {
          unit = nextValue;
        });
      });

    new Setting(contentEl)
      .setName("Source")
      .setDesc("Origin system for this record.")
      .addText((text) => {
        text.setPlaceholder("manual");
        text.setValue(source);
        text.onChange((nextValue) => {
          source = nextValue;
        });
      });

    new Setting(contentEl)
      .setName("Origin id")
      .setDesc("Optional external provenance id.")
      .addText((text) => {
        text.setPlaceholder("withings:2026-04-14:body.weight");
        text.setValue(originId);
        text.onChange((nextValue) => {
          originId = nextValue;
        });
      });

    const noteSetting = new Setting(contentEl).setName("Note").setDesc("Optional human-readable note.");
    const noteTextarea = noteSetting.controlEl.createEl("textarea");
    noteTextarea.rows = 3;
    noteTextarea.value = note;
    noteTextarea.addEventListener("input", () => {
      note = noteTextarea.value;
    });

    const tagsSetting = new Setting(contentEl).setName("Tags").setDesc("Optional comma-separated tags.");
    const tagsInput = tagsSetting.controlEl.createEl("input", { type: "text" });
    tagsInput.value = tags;
    tagsInput.placeholder = "food, lunch";
    tagsInput.addEventListener("input", () => {
      tags = tagsInput.value;
    });

    const contextSetting = new Setting(contentEl)
      .setName("Context JSON")
      .setDesc("Optional JSON object stored as structured context.");
    const contextTextarea = contextSetting.controlEl.createEl("textarea");
    contextTextarea.rows = 5;
    contextTextarea.value = context;
    contextTextarea.placeholder = '{"precision":"date"}';
    contextTextarea.addEventListener("input", () => {
      context = contextTextarea.value;
    });

    const buttonRow = contentEl.createDiv({ cls: "metrics-lens-actions" });
    const cancelButton = buttonRow.createEl("button", { text: "Cancel" });
    cancelButton.addEventListener("click", () => {
      this.close();
    });

    const submitButton = buttonRow.createEl("button", {
      cls: "mod-cta",
      text: this.options.submitLabel,
    });
    submitButton.setAttribute("aria-label", this.options.submitLabel);
    submitButton.addEventListener("click", () => {
      const parsedValue = Number(value);
      if (!Number.isFinite(parsedValue)) {
        new Notice("Value must be a finite number.");
        return;
      }

      if (ts.trim().length === 0 || key.trim().length === 0 || source.trim().length === 0) {
        new Notice("Timestamp, key, and source are required.");
        return;
      }

      let parsedContext: Record<string, unknown> | undefined;
      const normalizedContext = trimOrUndefined(context);
      if (normalizedContext) {
        let contextValue: unknown;
        try {
          contextValue = JSON.parse(normalizedContext);
        } catch {
          new Notice("Context JSON must be valid JSON.");
          return;
        }

        if (typeof contextValue === "object" && contextValue !== null && !Array.isArray(contextValue)) {
          parsedContext = contextValue as Record<string, unknown>;
        } else {
          new Notice("Context JSON must be a JSON object.");
          return;
        }
      }

      const parsedTags = trimOrUndefined(tags)
        ?.split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      this.onSubmitValue({
        context: parsedContext,
        date: trimOrUndefined(date),
        id: initial?.id,
        key: key.trim(),
        note: trimOrUndefined(note),
        origin_id: trimOrUndefined(originId),
        source: source.trim(),
        tags: parsedTags,
        ts: ts.trim(),
        unit: trimOrUndefined(unit),
        value: parsedValue,
      });
      this.close();
    });
  }
}
