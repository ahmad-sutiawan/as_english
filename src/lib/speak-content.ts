import { readFileSync } from "fs";
import path from "path";
import type { SpeakItem, SpeakManifest, SpeakPack } from "@/types/speak";
import type { PersonaId } from "@/lib/persona";

function speakRoot(persona: PersonaId) {
  const base = path.join(process.cwd(), "content");
  return persona === "home" ? path.join(base, "home", "speak") : path.join(base, "speak");
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf-8")) as T;
}

export function getSpeakManifest(persona: PersonaId): SpeakManifest {
  return readJson<SpeakManifest>(path.join(speakRoot(persona), "manifest.json"));
}

export function getSpeakPack(packId: string, persona: PersonaId): SpeakPack | null {
  try {
    return readJson<SpeakPack>(path.join(speakRoot(persona), `${packId}.json`));
  } catch {
    return null;
  }
}

export function getAllSpeakItems(persona: PersonaId): SpeakItem[] {
  const manifest = getSpeakManifest(persona);
  const items: SpeakItem[] = [];
  for (const pack of manifest.packs) {
    const full = getSpeakPack(pack.id, persona);
    if (!full) continue;
    items.push(...full.items);
  }
  return items;
}

export function getSpeakItem(itemId: string, persona: PersonaId): SpeakItem | null {
  return getAllSpeakItems(persona).find((i) => i.id === itemId) ?? null;
}
