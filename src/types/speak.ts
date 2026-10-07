export type SpeakLevel = "junior" | "mid" | "senior";

export type SpeakItem = {
  id: string;
  category: string;
  level: SpeakLevel;
  target: string;
  targetId: string;
  chunks: string[];
  scrambled: string[];
  keywords: string[];
  grammarPatterns: string[];
  commonErrors: string[];
  scenario: string;
  scenarioId: string;
  modelAnswers: string[];
  audio: string | null;
};

export type SpeakPackMeta = {
  id: string;
  title: string;
  titleId: string;
  itemCount: number;
};

export type SpeakPack = SpeakPackMeta & {
  items: SpeakItem[];
};

export type SpeakManifest = {
  version: string;
  itemCount: number;
  packs: SpeakPackMeta[];
};

export type SpeakPhase =
  | "listen"
  | "retrieve"
  | "construct"
  | "speak_target"
  | "scenario"
  | "say_again"
  | "done";

export type SpeakEvalResult = {
  meaningOk: boolean;
  grammarScore: number;
  pronunciationProxy: number;
  corrections: string[];
  suggestion: string;
  headline: string;
  bestModel: string;
};
