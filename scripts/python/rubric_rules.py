"""Shared checks for authored form packages."""

from __future__ import annotations

import re

ROLES = {"Subject", "Auxiliary", "Verb", "Object", "Adverbial"}
GENERIC = "Bentuk itu belum tepat"

CONTRACTIONS = [
    (r"\bi'm\b", "i am"),
    (r"\bi've\b", "i have"),
    (r"\bi'll\b", "i will"),
    (r"\bi'd\b", "i would"),
    (r"\bdon't\b", "do not"),
    (r"\bdoesn't\b", "does not"),
    (r"\bdidn't\b", "did not"),
    (r"\bcan't\b", "cannot"),
    (r"\bwon't\b", "will not"),
    (r"\bisn't\b", "is not"),
    (r"\baren't\b", "are not"),
    (r"\bwasn't\b", "was not"),
    (r"\bweren't\b", "were not"),
    (r"\bwe're\b", "we are"),
    (r"\bwe've\b", "we have"),
    (r"\bwe'll\b", "we will"),
    (r"\bthey're\b", "they are"),
    (r"\bthey've\b", "they have"),
    (r"\blet's\b", "let us"),
    (r"\bit's\b", "it is"),
    (r"\bthat's\b", "that is"),
    (r"\bwhat's\b", "what is"),
    (r"\bthere's\b", "there is"),
    (r"\bhe's\b", "he is"),
    (r"\bshe's\b", "she is"),
    (r"\byou're\b", "you are"),
    (r"\byou've\b", "you have"),
    (r"\byou'll\b", "you will"),
]


def canonical(sentence: str) -> str:
    text = sentence.strip().lower()
    text = text.replace("'", "'")
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"^please\s+", "", text)
    for pattern, replacement in CONTRACTIONS:
        text = re.sub(pattern, replacement, text)
    text = re.sub(r"[^\w\s']", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def check_package(label: str, models: list, slots: list, errors: list) -> list[str]:
    problems: list[str] = []
    if not isinstance(models, list) or len(models) < 2:
        problems.append(f"{label}: needs at least two model answers")
        models = models or []
    keys = [canonical(m) for m in models if isinstance(m, str)]
    if len(keys) >= 2 and len(set(keys)) != len(keys):
        problems.append(f"{label}: model answers collapse to the same sentence")
    if not slots:
        problems.append(f"{label}: needs authored slots")
    for slot in slots or []:
        role = slot.get("role")
        if role not in ROLES:
            problems.append(f"{label}: slot role {role} is not allowed")
        note = (slot.get("noteId") or "").strip()
        if len(note) < 12 or GENERIC in note:
            problems.append(f"{label}: slot note is missing or generic")
        text = slot.get("text") or ""
        for model in models:
            if isinstance(model, str) and text and text.lower() not in model.lower():
                problems.append(f"{label}: slot '{text}' is missing from a model")
                break
    if not errors:
        problems.append(f"{label}: needs a common error")
    for err in errors or []:
        if isinstance(err, str) or not isinstance(err, dict):
            problems.append(f"{label}: common error must be pattern plus correction")
            continue
        correction = (err.get("correctionId") or "").strip()
        if len(correction) < 12 or GENERIC in correction:
            problems.append(f"{label}: correction is generic")
        if not (err.get("pattern") or "").strip():
            problems.append(f"{label}: error pattern is empty")
    return problems
