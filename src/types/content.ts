export type Difficulty = "junior" | "mid" | "senior";
export type ChoiceKey = "A" | "B" | "C" | "D";

export type Choice = {
  key: ChoiceKey;
  /** English answer option — this is what you type */
  text: string;
  /** Fixed Indonesian translation of the English option */
  textId: string;
};

export type ExerciseItem = {
  id: string;
  moduleId: string;
  difficulty: Difficulty;
  /** English workplace scenario */
  scenario: string;
  /** Fixed Indonesian translation of scenario */
  scenarioId: string;
  /** English question / prompt */
  prompt: string;
  /** Fixed Indonesian translation of prompt */
  promptId: string;
  choices: Choice[];
  correctKey: ChoiceKey;
  /** Learning guide in Indonesian: why the answer is correct */
  explanation: string;
  tags: string[];
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
