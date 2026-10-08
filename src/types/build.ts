export type BuildLevel = "junior" | "mid";

export type BuildSlot = {
  role: string;
  roleId: string;
  text: string;
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
  level: BuildLevel;
  meaningId: string;
  pattern: string;
  assemble: BuildStep;
  transform: BuildStep;
};
