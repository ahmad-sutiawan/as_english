export type ExerciseType =
  | "mcq"
  | "blank"
  | "correction"
  | "transform"
  | "translate_id_en"
  | "translate_en_id"
  | "arrange"
  | "dialogue"
  | "choose"
  | "writing";

export type Competency = "concept" | "construction" | "communication" | "writing";

export type Difficulty = "basic" | "core" | "advanced";

export type LessonStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "mastered"
  | "needs_review";

export type Example = {
  en: string;
  id: string;
  note?: string;
};

export type Exercise = {
  id: string;
  type: ExerciseType;
  prompt: string;
  promptId?: string;
  context?: string;
  options?: { key: string; text: string }[];
  words?: string[];
  acceptable: string[];
  explanation: string;
  difficulty: Difficulty;
  points: number;
  competency: Competency;
  rubric?: { label: string; pattern: string }[];
  forbidden?: string[];
  reference?: string;
};

export type PublicExercise = {
  id: string;
  type: ExerciseType;
  prompt: string;
  promptId?: string;
  context?: string;
  options?: { key: string; text: string }[];
  words?: string[];
  points: number;
  competency: Competency;
  rubricLabels?: string[];
};

export type Lesson = {
  id: string;
  moduleId: string;
  slug: string;
  title: string;
  level: string;
  estimatedMinutes: number;
  prerequisites: string;
  practicalBenefit: string;
  objectives: string[];
  concept: string[];
  whenNot: string[];
  contrast: string;
  formulas: { label: string; pattern: string; note: string }[];
  examples: {
    basic: Example[];
    daily: Example[];
    office: Example[];
    social: Example[];
    negative: Example[];
    question: Example[];
  };
  transformations: { label: string; sentence: string; note: string }[];
  dialogues: {
    situation: string;
    lines: { speaker: string; en: string; id: string }[];
    grammar: string;
    why: string;
    variation: string;
  }[];
  mistakes: { incorrect: string; correct: string; explanation: string }[];
  summary: { concept: string; formula: string; avoid: string[]; keyExample: string };
  practice: Exercise[];
  mastery: Exercise[];
  masteryThreshold: number;
  published: boolean;
};

export type GrammarModule = {
  id: string;
  phaseId: string;
  slug: string;
  title: string;
  description: string;
  objectives: string[];
  order: number;
  estimatedMinutes: number;
};

export type GrammarPhase = {
  id: string;
  slug: string;
  title: string;
  description: string;
  weeks: string;
  order: number;
};

export type ExamQuestion = Exercise & { lessonId: string };

export type ExamDef = {
  id: "foundation" | "final";
  title: string;
  description: string;
  passingScore: number;
  questions: ExamQuestion[];
};
