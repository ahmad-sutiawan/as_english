import { modulesPart1 } from "@/lib/governance/content/modules-1-3";
import { modulesPart2 } from "@/lib/governance/content/modules-4-6";
import { governanceFinalExam } from "@/lib/governance/content/exam";
import type { GovExam, GovModule } from "@/types/governance";

const allModules: GovModule[] = [...modulesPart1, ...modulesPart2].sort(
  (a, b) => a.order - b.order,
);

export function getGovModules(): GovModule[] {
  return allModules;
}

export function getGovModuleBySlug(slug: string): GovModule | undefined {
  return allModules.find((mod) => mod.slug === slug);
}

export function getGovModuleById(id: string): GovModule | undefined {
  return allModules.find((mod) => mod.id === id);
}

export function getGovExam(): GovExam {
  return governanceFinalExam;
}

export function neighborGovModules(slug: string): {
  previous?: GovModule;
  next?: GovModule;
} {
  const index = allModules.findIndex((mod) => mod.slug === slug);
  if (index < 0) return {};
  return {
    previous: allModules[index - 1],
    next: allModules[index + 1],
  };
}
