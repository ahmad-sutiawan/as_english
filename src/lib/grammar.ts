import { readFileSync } from "fs";
import path from "path";
import type { GrammarBook } from "@/types/grammar";

export function getGrammarBook(): GrammarBook {
  const filePath = path.join(process.cwd(), "content", "grammar", "laws.json");
  return JSON.parse(readFileSync(filePath, "utf-8")) as GrammarBook;
}

export type GrammarPrompt = {
  itemId: string;
  meaningId: string;
  models: string[];
  label: string;
};

export function grammarLawItemId(lawId: string) {
  return `law:${lawId}`;
}

export function grammarChartItemId(chartId: string, tableIndex: number, rowIndex: number) {
  return `chart:${chartId}:${tableIndex}:${rowIndex}`;
}

export function grammarPrompt(itemId: string): GrammarPrompt | null {
  const book = getGrammarBook();
  if (itemId.startsWith("law:")) {
    const lawId = itemId.slice(4);
    for (const chapter of book.chapters) {
      const law = chapter.laws.find((entry) => entry.id === lawId);
      if (!law) continue;
      return {
        itemId,
        meaningId: law.examples[0]?.id ?? law.whenId,
        models: law.examples.map((example) => example.en),
        label: law.titleId,
      };
    }
    return null;
  }

  const match = /^chart:([^:]+):(\d+):(\d+)$/.exec(itemId);
  if (!match) return null;
  const chart = book.charts.find((entry) => entry.id === match[1]);
  const table = chart?.tables[Number(match[2])];
  const row = table?.rows[Number(match[3])];
  if (!chart || !table || !row || row.examples.length === 0) return null;
  return {
    itemId,
    meaningId: row.examples[0].id,
    models: row.examples.map((example) => example.en),
    label: `${chart.titleId} · ${row.subject}`,
  };
}
