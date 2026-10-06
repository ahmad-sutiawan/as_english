export type Difficulty = "junior" | "mid" | "senior";
export type ChoiceKey = "A" | "B" | "C" | "D";

export type Choice = {
  key: ChoiceKey;
  text: string;
};

export type ExerciseItem = {
  id: string;
  moduleId: string;
  difficulty: Difficulty;
  scenario: string;
  prompt: string;
  choices: Choice[];
  correctKey: ChoiceKey;
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
  title: string;
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
