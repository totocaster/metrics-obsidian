import { App, Modal, Notice, Setting } from "obsidian";

interface MetricReferenceModalOptions {
  initialValue?: string;
}

export class MetricReferenceModal extends Modal {
  private value: string;

  constructor(
    app: App,
    options: MetricReferenceModalOptions,
    private readonly onSubmitValue: (value: string) => void,
  ) {
    super(app);
    this.value = options.initialValue ?? "";
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: "Open metric reference" });

    let referenceInput: HTMLInputElement | null = null;

    new Setting(contentEl)
      .setName("Reference")
      .setDesc("Paste `metric:<id>` or a raw metric id.")
      .addText((text) => {
        referenceInput = text.inputEl;
        text.setPlaceholder("metric:01JRX9Y7T9TQ8Q3A91F1M7A4AA");
        text.setValue(this.value);
        text.onChange((value) => {
          this.value = value;
        });
        text.inputEl.addEventListener("keydown", (event) => {
          if (event.key !== "Enter") {
            return;
          }

          event.preventDefault();
          this.submit();
        });
      });

    const actions = contentEl.createDiv({ cls: "metrics-lens-actions" });

    const cancelButton = actions.createEl("button", { text: "Cancel" });
    cancelButton.type = "button";
    cancelButton.addEventListener("click", () => {
      this.close();
    });

    const submitButton = actions.createEl("button", {
      cls: "mod-cta",
      text: "Open",
    });
    submitButton.type = "button";
    submitButton.setAttribute("aria-label", "Open metric reference");
    submitButton.addEventListener("click", () => {
      this.submit();
    });

    window.setTimeout(() => {
      referenceInput?.focus();
      referenceInput?.select();
    }, 0);
  }

  private submit(): void {
    if (this.value.trim().length === 0) {
      new Notice("Enter a metric reference or id.");
      return;
    }

    this.onSubmitValue(this.value);
    this.close();
  }
}
