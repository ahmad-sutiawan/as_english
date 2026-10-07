import { readFileSync } from "fs";
import path from "path";
import type { SpeakItem, SpeakManifest, SpeakPack } from "@/types/speak";

const speakRoot = path.join(process.cwd(), "content", "speak");

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf-8")) as T;
}

export function getSpeakManifest(): SpeakManifest {
  return readJson<SpeakManifest>(path.join(speakRoot, "manifest.json"));
}

export function getSpeakPack(packId: string): SpeakPack | null {
  try {
    return readJson<SpeakPack>(path.join(speakRoot, `${packId}.json`));
  } catch {
    return null;
  }
}

export function getAllSpeakItems(): SpeakItem[] {
  const manifest = getSpeakManifest();
  const items: SpeakItem[] = [];
  for (const pack of manifest.packs) {
    const full = getSpeakPack(pack.id);
    if (!full) continue;
    items.push(...full.items);
  }
  return items;
}

export function getSpeakItem(itemId: string): SpeakItem | null {
  return getAllSpeakItems().find((i) => i.id === itemId) ?? null;
}
