import { prisma } from "@/lib/db";
import { getItem, getModule, getModules } from "@/lib/content";
import { getBuildDrill, getBuildDrills } from "@/lib/build";
import { getSpeakItem, getAllSpeakItems } from "@/lib/speak-content";
import { listDue } from "@/lib/memory";
import type { PersonaId } from "@/lib/persona";
import type { BuildDrill } from "@/types/build";
import type { ExerciseItem } from "@/types/content";
import type { SpeakItem } from "@/types/speak";

export type DueTask = {
  source: "module" | "build" | "speak";
  itemId: string;
  moduleId: string;
  meaningId: string;
  structureId: string;
  promptId: string;
};

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function toDueTask(
  source: "module" | "build" | "speak",
  itemId: string,
  persona: PersonaId,
  moduleId = "",
): DueTask | null {
  if (source === "module") {
    const item = getItem(moduleId, itemId, persona);
    const choice = item?.choices.find((entry) => entry.key === item.correctKey);
    if (!item || !choice) return null;
    return {
      source,
      itemId,
      moduleId,
      meaningId: choice.textId,
      structureId: choice.structureId,
      promptId: item.promptId,
    };
  }
  if (source === "build") {
    const drill = getBuildDrill(itemId, persona);
    if (!drill) return null;
    return {
      source,
      itemId,
      moduleId: "",
      meaningId: drill.transform.sentenceId,
      structureId: drill.transform.pattern,
      promptId: drill.transform.commandId ?? "Ubah kalimat",
    };
  }
  const speak = getSpeakItem(itemId, persona);
  if (!speak) return null;
  return {
    source,
    itemId,
    moduleId: "",
    meaningId: speak.targetId,
    structureId: speak.grammarPatterns[0] ?? "",
    promptId: speak.scenarioId,
  };
}

export async function buildPracticePlan(userId: string, persona: PersonaId) {
  const dueRows = await listDue(userId, persona, 8);
  const due: DueTask[] = [];
  for (const row of dueRows) {
    if (due.length >= 2) break;
    const source = row.source === "build" || row.source === "speak" ? row.source : "module";
    const task = toDueTask(source, row.itemId, persona, row.moduleId);
    if (task) due.push(task);
  }

  const progress = await prisma.progress.findMany({
    where: { userId },
    select: { moduleId: true, completedItemIds: true },
  });
  const done = new Map(progress.map((row) => [row.moduleId, new Set(row.completedItemIds)]));

  let moduleItem: ExerciseItem | null = null;
  let moduleId = "";
  for (const meta of getModules(persona)) {
    if (meta.status !== "ready") continue;
    const mod = getModule(meta.id, persona);
    if (!mod) continue;
    const finished = done.get(mod.id) ?? new Set<string>();
    const next = mod.items.find((item) => item.kind !== "dialogue" && !finished.has(item.id));
    if (next) {
      moduleItem = next;
      moduleId = mod.id;
      break;
    }
  }

  if (due.length < 2 && moduleItem) {
    const filler = toDueTask("module", moduleItem.id, persona, moduleId);
    if (filler && !due.some((task) => task.itemId === filler.itemId)) {
      due.push(filler);
      moduleItem = null;
    }
  }

  const drills = shuffle(getBuildDrills(persona).filter((drill) => drill.theme === "dasar"));
  const build: BuildDrill | null = drills[0] ?? null;
  const speakPool = shuffle(getAllSpeakItems(persona));
  const speak: SpeakItem | null = speakPool[0] ?? null;

  return {
    due,
    build: build
      ? {
          id: build.id,
          meaningId: build.meaningId,
          commandId: build.transform.commandId ?? "Ubah kalimat",
          tokens: build.transform.tokens,
          distractors: build.transform.distractors,
        }
      : null,
    speak,
    module: moduleItem,
    moduleId,
    transfer: speak
      ? {
          itemId: speak.id,
          scenario: speak.scenario,
          scenarioId: speak.scenarioId,
          meaningId: speak.targetId,
        }
      : null,
  };
}
