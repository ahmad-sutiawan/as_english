export type BuildLevel = "junior" | "mid";

export const SLOT_ROLES = [
  "Subject",
  "Auxiliary",
  "Verb",
  "Object",
  "Adverbial",
] as const;

export type SlotRole = (typeof SLOT_ROLES)[number];

export type BuildSlot = {
  role: string;
  roleId: string;
  text: string;
  /** Indonesian correction shown when this slot is missing. */
  noteId?: string;
};

export type BuildTransformCommand = "NEGATIVE" | "QUESTION" | "PAST" | "FUTURE";

export type BuildStep = {
  command?: BuildTransformCommand;
  commandId?: string;
  tokens: string[];
  distractors: string[];
  sentence: string;
  sentenceId: string;
  why: string;
  pattern: string;
  slots: BuildSlot[];
};

export type BuildDrill = {
  id: string;
  theme: string;
  level: BuildLevel;
  meaningId: string;
  pattern: string;
  assemble: BuildStep;
  transform: BuildStep;
  /** Accepted English forms for the assemble sentence. */
  modelAnswers?: string[];
  /** Role slots for the assemble sentence. */
  slots?: BuildSlot[];
  commonErrors?: Array<string | { pattern: string; correctionId: string }>;
};
