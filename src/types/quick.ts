import type { ChoiceKey, Difficulty } from "@/types/content";

export type QuickCard = {
  moduleId: string;
  moduleTitle: string;
  moduleTitleId: string;
  itemId: string;
  difficulty: Difficulty;
  scenario: string;
  scenarioId: string;
  scenarioStructure: string;
  scenarioStructureId: string;
  prompt: string;
  promptId: string;
  promptStructure: string;
  promptStructureId: string;
  choices: {
    key: ChoiceKey;
    text: string;
    textId: string;
    structure: string;
    structureId: string;
  }[];
};
