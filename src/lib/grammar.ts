import { readFileSync } from "fs";
import path from "path";
import type { GrammarBook } from "@/types/grammar";

export function getGrammarBook(): GrammarBook {
  const filePath = path.join(process.cwd(), "content", "grammar", "laws.json");
  return JSON.parse(readFileSync(filePath, "utf-8")) as GrammarBook;
}
