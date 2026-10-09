import { readFileSync } from "fs";
import path from "path";
import type {
  ContentManifest,
  Difficulty,
  DifficultyMix,
  ExerciseItem,
  ModuleContent,
  ModuleMeta,
} from "@/types/content";
import { DIFFICULTY_ORDER } from "@/types/content";
import type { BuildSlot } from "@/types/build";
import type { PersonaId } from "@/lib/persona";
import { deriveChunks, deriveSlots } from "@/lib/form-eval";

function contentBase(persona: PersonaId) {
  const root = path.join(process.cwd(), "content");
  return persona === "home" ? path.join(root, "home") : root;
}

function readJson<T>(filePath: string): T {
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

export function getManifest(persona: PersonaId): ContentManifest {
  return readJson<ContentManifest>(path.join(contentBase(persona), "manifest.json"));
}

export function countDifficultyMix(items: ExerciseItem[]): DifficultyMix {
  const counts: DifficultyMix = { junior: 0, mid: 0, senior: 0 };
  for (const item of items) {
    counts[item.difficulty] += 1;
  }
  return counts;
}

/** Dominant difficulty from item mix (majority, ties → higher). */
export function deriveModuleLevel(items: ExerciseItem[]): Difficulty {
  if (!items.length) return "mid";
  const counts = countDifficultyMix(items);
  let best: Difficulty = "mid";
  let bestCount = -1;
  for (const d of ["junior", "mid", "senior"] as Difficulty[]) {
    if (
      counts[d] > bestCount ||
      (counts[d] === bestCount && DIFFICULTY_ORDER[d] > DIFFICULTY_ORDER[best])
    ) {
      best = d;
      bestCount = counts[d];
    }
  }
  return best;
}

function withLevelFields(meta: ModuleMeta, items: ExerciseItem[]): ModuleMeta {
  return {
    ...meta,
    level: meta.level ?? deriveModuleLevel(items),
    levelMix: meta.levelMix ?? countDifficultyMix(items),
  };
}

export function getModules(persona: PersonaId): ModuleMeta[] {
  return getManifest(persona).modules.map((meta) => {
    const full = getModule(meta.id, persona);
    if (!full) return { ...meta, level: meta.level ?? "mid", levelMix: meta.levelMix };
    return withLevelFields(meta, full.items);
  });
}

export function getModule(moduleId: string, persona: PersonaId): ModuleContent | null {
  try {
    const data = readJson<ModuleContent>(
      path.join(contentBase(persona), "modules", `${moduleId}.json`),
    );
    const levelFields = withLevelFields(data, data.items);
    return {
      ...data,
      ...levelFields,
    };
  } catch {
    return null;
  }
}

export function getItem(
  moduleId: string,
  itemId: string,
  persona: PersonaId,
): ExerciseItem | null {
  const mod = getModule(moduleId, persona);
  if (!mod) return null;
  return mod.items.find((item) => item.id === itemId) ?? null;
}

export function getItemForm(item: ExerciseItem): {
  expected: string;
  expectedId: string;
  models: string[];
  chunks: string[];
  slots: BuildSlot[];
  commonErrors: ExerciseItem["commonErrors"];
} {
  const expected = getCorrectAnswerText(item);
  const choice = item.choices.find((c) => c.key === item.correctKey);
  const chunks = item.chunks?.length ? item.chunks : deriveChunks(expected);
  return {
    expected,
    expectedId: choice?.textId ?? "",
    models: item.modelAnswers?.length ? item.modelAnswers : [expected],
    chunks,
    slots: item.slots?.length ? item.slots : deriveSlots(chunks),
    commonErrors: item.commonErrors ?? [],
  };
}

export function getCorrectAnswerText(item: ExerciseItem): string {
  if (item.kind === "dialogue" && item.turns?.length) {
    const youTurns = item.turns.filter((t) => t.speaker === "you");
    const last = youTurns.at(-1);
    if (last?.text) return last.text;
  }
  const choice = item.choices.find((c) => c.key === item.correctKey);
  return choice?.text ?? "";
}

export function getNextItemId(
  moduleId: string,
  currentItemId: string,
  persona: PersonaId,
): string | null {
  const mod = getModule(moduleId, persona);
  if (!mod || !mod.items.length) return null;
  const idx = mod.items.findIndex((i) => i.id === currentItemId);
  if (idx < 0 || idx >= mod.items.length - 1) return null;
  return mod.items[idx + 1].id;
}

/** Next item respecting optional difficulty filter (for progressive practice). */
export function getNextItemIdFiltered(
  moduleId: string,
  currentItemId: string,
  persona: PersonaId,
  difficulty?: Difficulty | "all",
): string | null {
  const mod = getModule(moduleId, persona);
  if (!mod || !mod.items.length) return null;
  const pool =
    !difficulty || difficulty === "all"
      ? mod.items
      : mod.items.filter((i) => i.difficulty === difficulty);
  const idx = pool.findIndex((i) => i.id === currentItemId);
  if (idx < 0 || idx >= pool.length - 1) return null;
  return pool[idx + 1].id;
}
