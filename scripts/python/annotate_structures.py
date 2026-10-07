#!/usr/bin/env python3
"""Annotate sentence-structure formulas on all bilingual content modules."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MODULES_DIR = ROOT / "content" / "modules"
MANIFEST_PATH = ROOT / "content" / "manifest.json"

WH = re.compile(
    r"^(how|what|why|when|where|which|who|whom|whose)\b", re.I
)
AUX_Q = re.compile(
    r"^(do|does|did|is|are|was|were|can|could|will|would|should|have|has|had|may|might)\b",
    re.I,
)
IMPERATIVE = re.compile(
    r"^(please\s+)?(don't|do not|let's|let us|try|use|add|fix|send|share|check|"
    r"update|open|close|fix|review|merge|ship|write|read|explain|describe|"
    r"summarize|confirm|escalate|page|reboot|rollback|deploy|fix|keep|"
    r"avoid|stop|start|run|make|give|take|put|set|get|ask|tell|say|call|"
    r"bring|follow|include|remove|fix|prioritize|schedule|document)\b",
    re.I,
)
MODAL = re.compile(
    r"\b(can|could|will|would|should|must|may|might|need to|have to|going to)\b",
    re.I,
)
COND = re.compile(r"\bif\b", re.I)
PASSIVE = re.compile(
    r"\b(is|are|was|were|be|been|being)\s+\w+ed\b|\b(is|are|was|were)\s+(being\s+)?\w+ed\b",
    re.I,
)
TIME_ADV = re.compile(
    r"^(yesterday|today|tomorrow|currently|now|later|after|before|during|"
    r"this (morning|afternoon|week|sprint)|last (night|week|month)|"
    r"once|when|while|as soon as)\b",
    re.I,
)
LABEL_COLON = re.compile(
    r"^(yesterday|today|blocker|impact|status|update|risk|next|action|owner|"
    r"eta|context|ask|decision|summary)\s*:",
    re.I,
)
FIXED_SHORT = {
    "same as usual.",
    "no updates.",
    "everything is fine.",
    "nothing.",
    "ok.",
    "okay.",
    "sure.",
    "got it.",
    "sounds good.",
    "no.",
    "yes.",
    "n/a.",
    "none.",
}


def _clauses(text: str) -> list[str]:
    t = text.strip()
    parts = re.split(r"(?<=[.!?])\s+|;\s+| — | – ", t)
    return [p.strip() for p in parts if p.strip()]


def _primary_clause(text: str) -> str:
    """Prefer the first substantive clause (skip tiny scene labels)."""
    clauses = _clauses(text)
    if not clauses:
        return text.strip()
    for c in clauses:
        if len(c.split()) >= 4 or "?" in c or LABEL_COLON.match(c):
            return c
    # longest clause wins
    return max(clauses, key=lambda c: len(c.split()))


PROMPT_TASK = re.compile(
    r"^(complete|choose|pick|select|write|rewrite|give|provide|say|respond|"
    r"reply|practice|finish|fill|type|match|identify|best|most|least)\b",
    re.I,
)


def analyze(text: str, *, prefer_question: bool = False) -> tuple[str, str]:
    raw = text.strip()
    t = raw
    first = _primary_clause(t)
    words = first.split()
    n = len(words)
    lower = first.lower().rstrip("?.!")

    # Multi-label standup style (check full text first)
    labels = re.findall(
        r"\b(Yesterday|Today|Blocker|Impact|Status|Risk|Next|Action|Owner|ETA|Ask|Decision)\s*:",
        t,
        flags=re.I,
    )
    if len(labels) >= 2:
        return (
            "Labeled updates: Time/Status label + Verb phrase (×N)",
            "Update berlabel: Label waktu/status + frasa kerja (×N)",
        )

    if lower in FIXED_SHORT or (
        n <= 3 and not prefer_question and "?" not in first and len(_clauses(t)) == 1
    ):
        if n <= 2:
            return (
                "Fixed phrase / elliptical clause",
                "Frasa tetap / klausa eliptis (bukan S+V+O penuh)",
            )
        return (
            "Short phrase (elliptical)",
            "Frasa pendek (eliptis — subjek/kata kerja tersirat)",
        )

    if LABEL_COLON.match(first):
        return (
            "Label + Verb phrase / clause",
            "Label + frasa kerja / klausa",
        )

    # Prompt like "Best standup update?" / "Complete the bridge..."
    if prefer_question:
        if PROMPT_TASK.match(t) and not WH.match(first) and not AUX_Q.match(first):
            if t.rstrip().endswith("?") and n <= 6:
                return (
                    "Elliptical question: (Which is the) + Noun phrase + ?",
                    "Pertanyaan eliptis: (Which is the) + Frasa nomina + ?",
                )
            if IMPERATIVE.match(t) or PROMPT_TASK.match(t):
                return (
                    "Task prompt: Imperative / instruction + Object",
                    "Prompt tugas: Imperatif / instruksi + Objek",
                )

    ends_q = first.endswith("?") or ("?" in t and (WH.search(t) or AUX_Q.match(first)))
    if ends_q or WH.match(first) or (AUX_Q.match(first) and "?" in t):
        # Prefer analyzing the question clause inside multi-sentence lines
        q_clause = next((c for c in _clauses(t) if "?" in c), first)
        if WH.match(q_clause):
            return (
                "Wh-question: Wh-word + Auxiliary + Subject + Verb (+ Object)",
                "Pertanyaan Wh: Wh-word + Auxiliary + Subjek + Kata kerja (+ Objek)",
            )
        if AUX_Q.match(q_clause):
            return (
                "Yes/No question: Auxiliary + Subject + Verb (+ Object)",
                "Pertanyaan Ya/Tidak: Auxiliary + Subjek + Kata kerja (+ Objek)",
            )
        if n <= 6 and not WH.match(q_clause) and not AUX_Q.match(q_clause):
            return (
                "Elliptical question: (Which/What is) + Noun phrase + ?",
                "Pertanyaan eliptis: (Which/What is) + Frasa nomina + ?",
            )
        return (
            "Question: Auxiliary/Wh + Subject + Verb (+ Object)",
            "Pertanyaan: Auxiliary/Wh + Subjek + Kata kerja (+ Objek)",
        )

    if COND.search(first) or COND.search(t[:80]):
        return (
            "Conditional: If-clause + result clause (Modal/will + Verb)",
            "Kondisional: Klausa If + klausa hasil (Modal/will + Kata kerja)",
        )

    if IMPERATIVE.match(first) and n >= 2:
        if first.lower().startswith("please"):
            return (
                "Polite imperative: Please + Verb + Object (+ Adverbial)",
                "Imperatif sopan: Please + Kata kerja + Objek (+ Keterangan)",
            )
        if first.lower().startswith(("don't", "do not")):
            return (
                "Negative imperative: Don't + Verb + Object",
                "Imperatif negatif: Don't + Kata kerja + Objek",
            )
        if first.lower().startswith(("let's", "let us")):
            return (
                "Suggestive imperative: Let's + Verb + Object",
                "Imperatif usulan: Let's + Kata kerja + Objek",
            )
        return (
            "Imperative: Verb + Object (+ Adverbial)",
            "Imperatif: Kata kerja + Objek (+ Keterangan)",
        )

    if PASSIVE.search(first):
        return (
            "Passive: Subject + be + past participle (+ by/Adverbial)",
            "Pasif: Subjek + be + past participle (+ by/Keterangan)",
        )

    if MODAL.search(first):
        if TIME_ADV.match(first):
            return (
                "Adverbial + Subject + Modal + base Verb + Object (S + Modal + V + O)",
                "Keterangan + Subjek + Modal + Kata kerja dasar + Objek",
            )
        return (
            "Subject + Modal + base Verb + Object (S + Modal + V + O)",
            "Subjek + Modal + Kata kerja dasar + Objek (S + Modal + V + O)",
        )

    if TIME_ADV.match(first) or first.lower().startswith(
        ("in the ", "on the ", "at the ", "for the ", "with ", "without ", "due to ")
    ):
        return (
            "Adverbial Phrase + Subject + Verb + Object (S + V + O)",
            "Frasa keterangan + Subjek + Kata kerja + Objek (S + V + O)",
        )

    # Compound / multi-sentence workplace answers
    sentence_count = len(re.findall(r"[.!?]+", t)) or 1
    if sentence_count >= 2 or " and " in lower and n > 14:
        if "because" in lower or " so " in f" {lower} ":
            return (
                "Compound: Cause clause + Result clause (S + V + O × 2)",
                "Majemuk: Klausa sebab + Klausa akibat (S + V + O × 2)",
            )
        return (
            "Multi-clause: Subject + Verb + Object + connector + clause",
            "Multi-klausa: Subjek + Kata kerja + Objek + konektor + klausa",
        )

    # Default declarative
    if n <= 5:
        return (
            "Subject + Verb (+ Complement) — short declarative",
            "Subjek + Kata kerja (+ Pelengkap) — deklaratif pendek",
        )

    return (
        "Subject + Verb + Object (+ Adverbial) (S + V + O)",
        "Subjek + Kata kerja + Objek (+ Keterangan) (S + V + O)",
    )


def annotate_choice(choice: dict) -> dict:
    structure, structure_id = analyze(choice["text"])
    out = dict(choice)
    out["structure"] = structure
    out["structureId"] = structure_id
    # Keep key order: key, text, textId, structure, structureId — rebuild
    return {
        "key": out["key"],
        "text": out["text"],
        "textId": out["textId"],
        "structure": structure,
        "structureId": structure_id,
    }


def annotate_turn(turn: dict) -> dict:
    structure, structure_id = analyze(turn["text"])
    out = {
        "id": turn["id"],
        "speaker": turn["speaker"],
        "roleLabel": turn["roleLabel"],
        "roleLabelId": turn["roleLabelId"],
        "text": turn["text"],
        "textId": turn["textId"],
        "structure": structure,
        "structureId": structure_id,
    }
    if "choices" in turn:
        out["choices"] = [annotate_choice(c) for c in turn["choices"]]
    if "correctKey" in turn:
        out["correctKey"] = turn["correctKey"]
    return out


def annotate_item(item: dict) -> dict:
    scen_s, scen_id = analyze(item["scenario"])
    prompt_s, prompt_id = analyze(item["prompt"], prefer_question=True)

    out: dict = {
        "id": item["id"],
        "moduleId": item["moduleId"],
        "difficulty": item["difficulty"],
    }
    if "kind" in item:
        out["kind"] = item["kind"]
    out.update(
        {
            "scenario": item["scenario"],
            "scenarioId": item["scenarioId"],
            "scenarioStructure": scen_s,
            "scenarioStructureId": scen_id,
            "prompt": item["prompt"],
            "promptId": item["promptId"],
            "promptStructure": prompt_s,
            "promptStructureId": prompt_id,
            "choices": [annotate_choice(c) for c in item["choices"]],
            "correctKey": item["correctKey"],
            "explanation": item["explanation"],
            "tags": item["tags"],
        }
    )
    if "turns" in item:
        out["turns"] = [annotate_turn(t) for t in item["turns"]]
    if "tts" in item:
        out["tts"] = item["tts"]
    return out


def annotate_module(path: Path) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    data["items"] = [annotate_item(it) for it in data["items"]]
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    for path in sorted(MODULES_DIR.glob("*.json")):
        annotate_module(path)
        print(f"annotated {path.name}")

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    # bump patch version if semver-like
    # Feature bump for structure annotations
    manifest["version"] = "2.3.0"
    MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"manifest version → {manifest['version']}")


if __name__ == "__main__":
    main()
