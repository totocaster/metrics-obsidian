import { App, Modal, Notice, Setting } from "obsidian";

interface MetricsFileModalOptions {
  description: string;
  fieldLabel: string;
  initialValue?: string;
  placeholder: string;
  submitLabel: string;
  title: string;
}

export class MetricsFileModal extends Modal {
  private readonly onSubmitValue: (value: string) => void;
  private readonly options: MetricsFileModalOptions;

  constructor(
    app: App,
    options: MetricsFileModalOptions,
    onSubmitValue: (value: string) => void,
  ) {
    super(app);
    this.options = options;
    this.onSubmitValue = onSubmitValue;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: this.options.title });
    contentEl.createEl("p", {
      text: this.options.description,
    });

    let value = this.options.initialValue ?? "";

    const inputSetting = new Setting(contentEl).setName(this.options.fieldLabel);
    let submit: (() => void) | null = null;
    inputSetting.addText((text) => {
      text.setPlaceholder(this.options.placeholder);
      text.setValue(value);
      text.onChange((nextValue) => {
        value = nextValue;
      });
      text.inputEl.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") {
          return;
        }

        event.preventDefault();
        submit?.();
      });

      window.setTimeout(() => {
        text.inputEl.focus();
        text.inputEl.select();
      }, 0);
    });

    const actions = contentEl.createDiv({ cls: "metrics-lens-actions" });
    const cancelButton = actions.createEl("button", { text: "Cancel" });
    cancelButton.type = "button";
    cancelButton.addEventListener("click", () => {
      this.close();
    });

    const submitButton = actions.createEl("button", {
      cls: "mod-cta",
      text: this.options.submitLabel,
    });
    submitButton.type = "button";
    submitButton.setAttribute("aria-label", this.options.submitLabel);
    submit = () => {
      const normalizedValue = value.trim();
      if (normalizedValue.length === 0) {
        new Notice(`${this.options.fieldLabel} is required.`);
        return;
      }

      this.onSubmitValue(normalizedValue);
      this.close();
    };
    submitButton.addEventListener("click", () => {
      submit?.();
    });
  }
}
