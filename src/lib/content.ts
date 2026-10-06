import { readFileSync } from "fs";
import path from "path";
import type {
  ContentManifest,
  ExerciseItem,
  ModuleContent,
  ModuleMeta,
} from "@/types/content";

const contentRoot = path.join(process.cwd(), "content");

function readJson<T>(filePath: string): T {
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

export function getManifest(): ContentManifest {
  return readJson<ContentManifest>(path.join(contentRoot, "manifest.json"));
}

export function getModules(): ModuleMeta[] {
  return getManifest().modules;
}

export function getModule(moduleId: string): ModuleContent | null {
  try {
    return readJson<ModuleContent>(
      path.join(contentRoot, "modules", `${moduleId}.json`),
    );
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
