export type GrammarExample = {
  en: string;
  id: string;
};

export type GrammarMistake = {
  wrong: string;
  right: string;
  whyId: string;
};

export type GrammarLaw = {
  id: string;
  titleId: string;
  whenId: string;
  formula: string;
  examples: GrammarExample[];
  mistake: GrammarMistake;
};

export type GrammarChapter = {
  id: string;
  titleId: string;
  laws: GrammarLaw[];
};

export type GrammarDecision = {
  id: string;
  titleId: string;
  formula: string;
  lawId: string;
};

export type GrammarStep = {
  titleId: string;
  bodyId: string;
};

export type GrammarChartTable = {
  titleId: string;
  headers: string[];
  rows: { subject: string; cells: string[] }[];
};

export type GrammarChart = {
  id: string;
  titleId: string;
  noteId: string;
  tables: GrammarChartTable[];
};

export type GrammarBook = {
  steps: GrammarStep[];
  decisions: GrammarDecision[];
  charts: GrammarChart[];
  chapters: GrammarChapter[];
};
