import { App, FuzzySuggestModal, TFile, type FuzzyMatch } from "obsidian";

export interface MetricsSearchResult {
  file: TFile;
  lineNumber: number;
  metricId: string | null;
  primaryText: string;
  secondaryText: string | null;
  searchText: string;
  tertiaryText: string;
}

interface MetricsSearchModalOptions {
  results: MetricsSearchResult[];
}

export class MetricsSearchModal extends FuzzySuggestModal<MetricsSearchResult> {
  private readonly items: MetricsSearchResult[];
  private readonly onChooseResult: (result: MetricsSearchResult) => void;

  constructor(
    app: App,
    options: MetricsSearchModalOptions,
    onChooseResult: (result: MetricsSearchResult) => void,
  ) {
    super(app);
    this.items = options.results;
    this.onChooseResult = onChooseResult;
    this.emptyStateText = "No matching measurements.";
    this.limit = 100;
    this.setPlaceholder("Search measurements");
    this.setInstructions([
      { command: "↑↓", purpose: "Choose measurement" },
      { command: "Enter", purpose: "Open measurement" },
      { command: "Esc", purpose: "Close" },
    ]);
  }

  getItems(): MetricsSearchResult[] {
    return this.items;
  }

  getItemText(item: MetricsSearchResult): string {
    return item.searchText;
  }

  renderSuggestion(match: FuzzyMatch<MetricsSearchResult>, el: HTMLElement): void {
    const { item } = match;
    el.createDiv({ text: item.primaryText });

    if (item.secondaryText) {
      const secondaryEl = el.createDiv();
      secondaryEl.createEl("small", { text: item.secondaryText });
    }

    const tertiaryEl = el.createDiv();
    tertiaryEl.createEl("small", { text: item.tertiaryText });
  }

  onChooseItem(item: MetricsSearchResult, _evt: MouseEvent | KeyboardEvent): void {
    this.onChooseResult(item);
  }
}
