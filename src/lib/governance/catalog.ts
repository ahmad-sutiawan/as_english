import { cobitModule1 } from "@/lib/governance/content/cobit-1";
import { cobitModule2 } from "@/lib/governance/content/cobit-2";
import { fiveDomainsModule1 } from "@/lib/governance/content/five-domains-1";
import { fiveDomainsModule2 } from "@/lib/governance/content/five-domains-2";
import { itil4Module1 } from "@/lib/governance/content/itil4-1";
import { itil4Module2 } from "@/lib/governance/content/itil4-2";
import { modulesPart1 } from "@/lib/governance/content/modules-1-3";
import { modulesPart2 } from "@/lib/governance/content/modules-4-6";
import { unicornModule1 } from "@/lib/governance/content/unicorn-1";
import { unicornModule2 } from "@/lib/governance/content/unicorn-2";
import { governanceFinalExam } from "@/lib/governance/content/exam";
import type { GovExam, GovModule } from "@/types/governance";

const riskModule = modulesPart1.filter((mod) => mod.id === "gov:risk-security-smb");
const closingModules = modulesPart2
  .filter((mod) => mod.id !== "gov:itsm-change-itil4")
  .map((mod) => ({
    ...mod,
    order: mod.id === "gov:bcp-vendor-privacy" ? 8 : 9,
  }));

const allModules: GovModule[] = [
  cobitModule1,
  cobitModule2,
  ...riskModule,
  itil4Module1,
  itil4Module2,
  fiveDomainsModule1,
  fiveDomainsModule2,
  ...closingModules,
  unicornModule1,
  unicornModule2,
].sort((a, b) => a.order - b.order);

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
