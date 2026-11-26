import type { LessonStatus } from "@/types/mastery";

export type GovExerciseType = "mcq" | "scenario" | "short_answer" | "writing";

export type GovRubricItem = {
  label: string;
  keywords: string[];
};

export type GovExercise = {
  id: string;
  type: GovExerciseType;
  prompt: string;
  context?: string;
  options?: { key: string; text: string }[];
  acceptable: string[];
  rubric?: GovRubricItem[];
  modelAnswer?: string;
  explanation: string;
  points: number;
  topic: string;
};

export type PublicGovExercise = {
  id: string;
  type: GovExerciseType;
  prompt: string;
  context?: string;
  options?: { key: string; text: string }[];
  rubricLabels?: string[];
  points: number;
  topic: string;
};

export type GovFrameworkRow = {
  code: string;
  name: string;
  smbFocus: string;
  artifact: string;
};

export type GovExecutivePhrase = {
  situation: string;
  en: string;
  id: string;
};

export type GovModule = {
  id: string;
  slug: string;
  order: number;
  frameworkTag: string;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  level: string;
  objectives: string[];
  whySmbMatters: string;
  concepts: {
    heading: string;
    paragraphs: string[];
    bullets?: string[];
  }[];
  frameworkTable?: {
    title: string;
    columns: [string, string, string, string];
    rows: GovFrameworkRow[];
  };
  caseStudy: {
    title: string;
    companyProfile: string;
    problem: string;
    governanceAction: string[];
    outcome: string;
  };
  smbChecklist: string[];
  commonPitfalls: {
    pitfall: string;
    betterWay: string;
  }[];
  executiveEnglish: GovExecutivePhrase[];
  practice: GovExercise[];
  mastery: GovExercise[];
  masteryThreshold: number;
};

export type GovExamQuestion = GovExercise & { moduleId: string };

export type GovExam = {
  id: string;
  title: string;
  description: string;
  passingScore: number;
  questions: GovExamQuestion[];
};

export type GovProgressStatus = LessonStatus;
