export type Difficulty = "junior" | "mid" | "senior";
export type ChoiceKey = "A" | "B" | "C" | "D";

export type Choice = {
  key: ChoiceKey;
  /** English answer option — this is what you type */
  text: string;
  /** Fixed Indonesian translation of the English option */
  textId: string;
  /** Sentence-structure formula, e.g. Subject + Verb + Object */
  structure: string;
  /** Indonesian gloss of the structure formula */
  structureId: string;
};

export type DialogueSpeaker = "them" | "you";

export type DialogueTurn = {
  id: string;
  speaker: DialogueSpeaker;
  /** English display name: Manager, On-call, You */
  roleLabel: string;
  roleLabelId: string;
  /** For them: their line. For you: correct spoken line (same as correct choice). */
  text: string;
  textId: string;
  /** Sentence-structure formula for this turn's English line */
  structure: string;
  /** Indonesian gloss of the structure formula */
  structureId: string;
  /** Present on your turns */
  choices?: Choice[];
  correctKey?: ChoiceKey;
};

export type ExerciseItem = {
  id: string;
  moduleId: string;
  difficulty: Difficulty;
  /** mcq (default) or multi-turn dialogue */
  kind?: "mcq" | "dialogue";
  /** English workplace scenario */
  scenario: string;
  /** Fixed Indonesian translation of scenario */
  scenarioId: string;
  /** Sentence-structure formula for the scenario */
  scenarioStructure: string;
  /** Indonesian gloss of scenario structure */
  scenarioStructureId: string;
  /** English question / prompt */
  prompt: string;
  /** Fixed Indonesian translation of prompt */
  promptId: string;
  /** Sentence-structure formula for the prompt */
  promptStructure: string;
  /** Indonesian gloss of prompt structure */
  promptStructureId: string;
  choices: Choice[];
  correctKey: ChoiceKey;
  /** Learning guide in Indonesian: why the answer is correct */
  explanation: string;
  tags: string[];
  /** Dialogue turns when kind === "dialogue" */
  turns?: DialogueTurn[];
  tts?: {
    scenario?: boolean;
    prompt?: boolean;
    answer?: boolean;
  };
};

export type DifficultyMix = Record<Difficulty, number>;

export type ModuleMeta = {
  id: string;
  /** Short English module label */
  title: string;
  /** Indonesian module title for guidance */
  titleId: string;
  /** Indonesian description of what you will practice */
  description: string;
  persona: string[];
  status: "ready" | "stub";
  itemCount: number;
  /** Dominant difficulty derived from items (optional in JSON; computed at runtime) */
  level?: Difficulty;
  /** Count of items per difficulty (computed at runtime) */
  levelMix?: DifficultyMix;
};

export type ModuleContent = ModuleMeta & {
  items: ExerciseItem[];
};

export type ContentManifest = {
  version: string;
  modules: ModuleMeta[];
};

export const DIFFICULTY_ORDER: Record<Difficulty, number> = {
  junior: 1,
  mid: 2,
  senior: 3,
};

export const DIFFICULTY_LABEL_ID: Record<Difficulty, string> = {
  junior: "Pemula",
  mid: "Menengah",
  senior: "Senior",
};
