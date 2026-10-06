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

const contentRoot = path.join(process.cwd(), "content");

function readJson<T>(filePath: string): T {
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

export function getManifest(): ContentManifest {
  return readJson<ContentManifest>(path.join(contentRoot, "manifest.json"));
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

export function getModules(): ModuleMeta[] {
  return getManifest().modules.map((meta) => {
    const full = getModule(meta.id);
    if (!full) return { ...meta, level: meta.level ?? "mid", levelMix: meta.levelMix };
    return withLevelFields(meta, full.items);
  });
}

export function getModule(moduleId: string): ModuleContent | null {
  try {
    const data = readJson<ModuleContent>(
      path.join(contentRoot, "modules", `${moduleId}.json`),
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
): ExerciseItem | null {
  const mod = getModule(moduleId);
  if (!mod) return null;
  return mod.items.find((item) => item.id === itemId) ?? null;
}

export function getCorrectAnswerText(item: ExerciseItem): string {
  const choice = item.choices.find((c) => c.key === item.correctKey);
  return choice?.text ?? "";
}

export function getNextItemId(
  moduleId: string,
  currentItemId: string,
): string | null {
  const mod = getModule(moduleId);
  if (!mod || !mod.items.length) return null;
  const idx = mod.items.findIndex((i) => i.id === currentItemId);
  if (idx < 0 || idx >= mod.items.length - 1) return null;
  return mod.items[idx + 1].id;
}

/** Next item respecting optional difficulty filter (for progressive practice). */
export function getNextItemIdFiltered(
  moduleId: string,
  currentItemId: string,
  difficulty?: Difficulty | "all",
): string | null {
  const mod = getModule(moduleId);
  if (!mod || !mod.items.length) return null;
  const pool =
    !difficulty || difficulty === "all"
      ? mod.items
      : mod.items.filter((i) => i.difficulty === difficulty);
  const idx = pool.findIndex((i) => i.id === currentItemId);
  if (idx < 0 || idx >= pool.length - 1) return null;
  return pool[idx + 1].id;
}
