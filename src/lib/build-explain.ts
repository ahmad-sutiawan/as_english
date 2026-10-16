import type { BuildSlot, BuildStep } from "@/types/build";

export type SlotReason = {
  roleId: string;
  text: string;
  becauseId: string;
};

const BE_NOW = new Set(["am", "is", "are", "'m", "'s", "'re"]);
const BE_PAST = new Set(["was", "were"]);
const BE_FORMS = new Set([
  ...BE_NOW,
  ...BE_PAST,
  "isn't",
  "aren't",
  "wasn't",
  "weren't",
]);
const DO_FORMS = new Set(["do", "does", "did", "don't", "doesn't", "didn't"]);
const MODALS = new Set([
  "will",
  "won't",
  "can",
  "can't",
  "could",
  "should",
  "must",
  "might",
  "would",
  "may",
  "'ll",
]);

function bare(text: string): string {
  return text.trim().toLowerCase().replace(/[.?!]+$/g, "");
}

function subjectGroup(text: string): "i" | "you" | "he" | "plural" | "singular" {
  const value = bare(text);
  if (value === "i") return "i";
  if (value === "you" || value === "we" || value === "they") return "you";
  if (value === "he" || value === "she" || value === "it") return "he";
  const last = value.split(/\s+/).pop() ?? value;
  if (/(s|es)$/.test(last) && !/(ss|us|is|ness|ics)$/.test(last)) return "plural";
  return "singular";
}

function subjectBecause(text: string): string {
  const group = subjectGroup(text);
  if (group === "i") {
    return "Subjek I. To be sekarang memakai am. To be lampau memakai was.";
  }
  if (group === "you") {
    return "Subjek you, we, atau they. To be sekarang memakai are. To be lampau memakai were.";
  }
  if (group === "he") {
    return "Subjek he, she, atau it. To be sekarang memakai is. To be lampau memakai was.";
  }
  if (group === "plural") {
    return "Subjek jamak. To be sekarang memakai are. To be lampau memakai were.";
  }
  return "Subjek benda tunggal. To be sekarang memakai is. To be lampau memakai was.";
}

function beBecause(text: string, question: boolean): string {
  const form = bare(text);
  const law: Record<string, string> = {
    am: "am hanya untuk subjek I, waktu sekarang.",
    is: "is untuk he, she, it, atau benda tunggal, waktu sekarang.",
    are: "are untuk you, we, they, atau benda jamak, waktu sekarang.",
    was: "was untuk I, he, she, it, atau benda tunggal, waktu lampau.",
    were: "were untuk you, we, they, atau benda jamak, waktu lampau.",
    "isn't": "isn't adalah is + not. Subjeknya he, she, it, atau benda tunggal.",
    "aren't": "aren't adalah are + not. Subjeknya you, we, they, atau benda jamak.",
    "wasn't": "wasn't adalah was + not, untuk I atau benda tunggal di waktu lampau.",
    "weren't": "weren't adalah were + not, untuk you, we, they, atau benda jamak di waktu lampau.",
    "'m": "'m adalah am. Hanya subjek I yang memakainya.",
    "'s": "'s di sini adalah is, untuk subjek tunggal.",
    "'re": "'re adalah are, untuk you, we, they, atau benda jamak.",
  };
  const base = law[form] ?? `${text} adalah bentuk to be yang mengikuti subjek dan waktunya.`;
  if (!question) return base;
  return `${base} Pada pertanyaan, to be berdiri di depan subjek.`;
}

function doBecause(text: string, question: boolean): string {
  const form = bare(text);
  const law: Record<string, string> = {
    do: "do untuk I, you, we, they. Kata kerja sesudahnya tetap bentuk dasar.",
    does: "does untuk he, she, it, atau benda tunggal. Kata kerja sesudahnya tetap bentuk dasar, tanpa -s.",
    did: "did untuk semua subjek di waktu lampau. Kata kerja sesudahnya kembali ke bentuk dasar.",
    "don't": "don't untuk I, you, we, they. Kata kerja sesudahnya tetap bentuk dasar.",
    "doesn't": "doesn't untuk he, she, it, atau benda tunggal. Kata kerja sesudahnya tetap bentuk dasar, tanpa -s.",
    "didn't": "didn't untuk semua subjek di waktu lampau. Kata kerja sesudahnya kembali ke bentuk dasar, jadi ship bukan shipped.",
  };
  const base = law[form] ?? `${text} adalah bentuk do yang mengikuti subjek.`;
  if (!question) return base;
  return `${base} Pada pertanyaan, do, does, atau did berdiri di depan subjek.`;
}

function helperForms(step: BuildStep): Set<string> {
  const forms = new Set<string>();
  for (const slot of step.slots) {
    const form = bare(slot.text);
    if (BE_FORMS.has(form) || DO_FORMS.has(form) || MODALS.has(form)) forms.add(form);
  }
  return forms;
}

function verbBecause(text: string, step: BuildStep): string {
  const helpers = helperForms(step);
  const helped = [...helpers].some(
    (form) => DO_FORMS.has(form) || MODALS.has(form) || form === "to",
  );
  if (helped) {
    return "Setelah do, does, did, atau modal, kata kerja tetap bentuk dasar. Akhiran -s atau -ed tidak dipakai di sini.";
  }
  if ([...helpers].some((form) => BE_FORMS.has(form))) {
    return "Kata ini mengikuti to be. To be yang menyesuaikan subjek, bukan kata ini.";
  }
  const group = subjectGroup(
    step.slots.find((slot) => slot.role === "Subject")?.text ?? "",
  );
  const form = bare(text);
  if (group === "he" || group === "singular") {
    if (form.endsWith("s") && !form.endsWith("ss")) {
      return "Tanpa kata bantu, he, she, it, atau benda tunggal sekarang memakai kata kerja berakhiran -s.";
    }
  }
  if (step.command === "PAST" || /ed$/.test(form)) {
    return "Tanpa did, waktu lampau memakai bentuk lampau kata kerja itu sendiri.";
  }
  return "I, you, we, atau they sekarang memakai kata kerja dasar, tanpa -s.";
}

function becauseFor(slot: BuildSlot, step: BuildStep, question: boolean): string {
  const form = bare(slot.text);
  if (slot.role === "Subject") return subjectBecause(slot.text);
  if (slot.role === "Be" || BE_FORMS.has(form)) return beBecause(slot.text, question);
  if (DO_FORMS.has(form) || slot.role === "Auxiliary" && DO_FORMS.has(form)) {
    return doBecause(slot.text, question);
  }
  if (MODALS.has(form)) {
    const front = question ? " Pada pertanyaan, modal berdiri di depan subjek." : "";
    return `Modal diikuti kata kerja dasar, tanpa to dan tanpa -s.${front}`;
  }
  if (slot.role === "Auxiliary") return doBecause(slot.text, question);
  if (slot.role === "Verb") return verbBecause(slot.text, step);
  if (slot.role === "Negative" || form === "not") {
    return "not menempel pada to be atau kata bantu. Bentuk to be tetap mengikuti subjek.";
  }
  if (slot.role === "Object") return "Objek langsung mengikuti kata kerja.";
  if (slot.role === "Adverbial") return "Keterangan waktu atau tempat duduk di akhir kalimat.";
  if (slot.role === "Adjective" || slot.role === "Complement") {
    return "Kata ini mengikuti to be. To be menghubungkan subjek dengan keadaannya.";
  }
  return "Bagian ini duduk di urutan subjek, kata bantu, kata kerja, objek, lalu keterangan.";
}

export function explainStep(step: BuildStep): SlotReason[] {
  const question =
    step.command === "QUESTION" ||
    (step.slots[0]?.role === "Be" && step.slots[1]?.role === "Subject") ||
    (step.slots[0]?.role === "Auxiliary" && step.slots[1]?.role === "Subject");
  return step.slots.map((slot) => ({
    roleId: slot.roleId,
    text: slot.text,
    becauseId: becauseFor(slot, step, question),
  }));
}
