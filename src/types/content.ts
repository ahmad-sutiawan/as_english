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
};

export type ModuleContent = ModuleMeta & {
  items: ExerciseItem[];
};

export type ContentManifest = {
  version: string;
  modules: ModuleMeta[];
};
