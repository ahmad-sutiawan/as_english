#!/usr/bin/env python3
"""Write authored form packages onto the priority practice paths."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

NOTES = {
    "Subject": 'Subjek yang benar pada kalimat ini adalah "{text}".',
    "Auxiliary": 'Kata bantu yang benar adalah "{text}".',
    "Verb": 'Bentuk predikat yang benar adalah "{text}".',
    "Object": 'Objek yang harus disebut adalah "{text}".',
    "Adverbial": 'Keterangan yang harus ada adalah "{text}".',
}

# Second models that keep the same required phrases but change the wording around them.
HAND = {
    "sv-i-work": "I work at my job.",
    "sv-you-work": "You work at your job.",
    "sv-they-work": "They work at their jobs.",
    "sv-he-works": "He works at his job.",
    "sv-she-works": "She works here at this office.",
    "svo-use-sap": "I use SAP for my daily tasks.",
    "svo-manage-servers": "I manage servers on this team.",
    "be-i-busy": "I am busy with work right now.",
    "be-she-tired": "She is tired after the long day.",
    "be-they-ready": "They are ready to begin.",
    "place-office": "I work at the office with the team.",
    "place-bogor": "She lives in Bogor with her family.",
    "time-every-day": "I work every day of the week.",
    "place-time-office": "I work at the office every day of the week.",
    "place-jakarta": "I work in Jakarta with the local team.",
    "sva-manager-works": "My manager works here on this floor.",
    "sva-system-works": "The system works as expected.",
    "past-checked": "I checked the server before the meeting.",
    "past-studied": "I studied yesterday after work.",
    "future-work-here": "I work here with the platform team.",
    "past-from-present": "I work here with the platform team.",
    "frame-deadline": "We need to meet the deadline this week.",
    "frame-main-issue": "The main issue is network instability on the link.",
    "report-completed": "Yesterday, I completed the report for the team.",
    "day_004": "I am unavailable for a dentist appointment from two to three.",
    "day_006": "If you need any help with the ticket, let me know.",
    "day_007": "I am asking the security team for a second look.",
    "it_ops_002": "The issue is what I will investigate, and I will update you shortly.",
    "it_ops_003": "Error rates spiked, so we have rolled back the deployment.",
    "it_ops_006": "We will scale the workers horizontally if the queue keeps growing.",
    "it_ops_007": "After clearing the cache, please restart the service.",
    "it_ops_008": "A flaky probe caused the alert, so it was a false positive.",
    "it_ops_010": "If the disk fills above ninety percent, I will page the platform team.",
    "mtg_004": "With the latest metrics, I want to challenge that assumption.",
    "mtg_005": "What success looks like for this milestone — could you clarify that?",
    "mtg_006": "By Friday I will draft the proposal. That is the action item.",
    "prob_001": "A missing index on the orders table was the root cause.",
    "prob_002": "To protect the payment service, we should add a circuit breaker.",
    "prob_003": "With the same payload, I reproduced the bug on staging.",
    "prob_004": "We are routing traffic to the healthy region as a workaround.",
    "prob_005": "Redesigning the retry logic with jitter is the long-term fix.",
    "prob_006": "Any errors in the application logs — I have not found them yet.",
    "prob_008": "Let's validate the fix on canary before we change production.",
    "prob_010": "So the next on-call can follow them, I will document the steps.",
    "rep_002": "Flaky tests put us about half a day behind schedule.",
    "rep_003": "To investigate the root cause, I need more time.",
    "rep_007": "Missing staging credentials from the platform team are the blocker.",
    "rep_008": "Until the flake is quarantined, I recommend we postpone the release.",
}


def slot(role: str, text: str) -> dict:
    return {
        "role": role,
        "roleId": {
            "Subject": "Subjek",
            "Auxiliary": "Kata bantu",
            "Verb": "Predikat",
            "Object": "Objek",
            "Adverbial": "Keterangan",
        }[role],
        "text": text,
        "noteId": NOTES[role].format(text=text),
    }


def pick_slots(sentence: str) -> list[dict]:
    slots: list[dict] = []
    subject = re.match(r"^(I|We|You|They|He|She|It)\b", sentence)
    if subject:
        slots.append(slot("Subject", subject.group(1)))
    else:
        subject = re.match(r"^((?:The|Our|My) [A-Za-z]+(?: [A-Za-z]+)?)", sentence)
        if subject and len(subject.group(1).split()) <= 4:
            slots.append(slot("Subject", subject.group(1)))
    aux = re.search(
        r"\b(will|am|is|are|was|were|have|has|had|do|does|did|can|could|should|would)\b",
        sentence,
        re.I,
    )
    if aux and aux.group(1) not in {item["text"] for item in slots}:
        slots.append(slot("Auxiliary", aux.group(1)))
    verb = re.search(
        r"\b(work|works|use|manage|checked|studied|need|completed|seeing|investigating|share|confirm|identified|applying|mitigated|monitoring|finished|recommend|postpone|attached|move|park|mute|ship|challenge|clarify|draft|found|dropped|validate|fixed|document|restart|page|reproduced|redesign)\b",
        sentence,
        re.I,
    )
    if verb and verb.group(1) not in {item["text"] for item in slots}:
        slots.append(slot("Verb", verb.group(1)))
    adverb = re.search(
        r"\b(every day|at the office|in Bogor|in Jakarta|here|yesterday|in five minutes|right now|within two minutes|tomorrow afternoon|next week|by Friday|by the end of the day|on staging|on canary|in the ticket|in the EU region)\b",
        sentence,
        re.I,
    )
    if adverb and adverb.group(1) not in {item["text"] for item in slots}:
        slots.append(slot("Adverbial", adverb.group(1)))
    obj = re.search(
        r"\b((?:the|a|our|my) [a-z]+(?: (?!and\b|or\b|but\b)[a-z]+)?)\b",
        sentence,
        re.I,
    )
    if obj and obj.group(1) not in {item["text"] for item in slots}:
        slots.append(slot("Object", obj.group(1)))
    kept = []
    seen = set()
    for item in slots:
        if item["text"].lower() in sentence.lower() and item["text"] not in seen:
            kept.append(item)
            seen.add(item["text"])
    return kept[:4]


def alternate(sentence: str, item_id: str, slots: list[dict]) -> str | None:
    if item_id in HAND:
        return HAND[item_id]
    parts = [part.strip() for part in re.split(r"(?<=[.?!])\s+", sentence) if part.strip()]
    if len(parts) >= 2:
        candidate = " ".join(parts[1:] + parts[:1])
        if all(s["text"].lower() in candidate.lower() for s in slots):
            return candidate
    for sep in [", and ", " and ", " because ", ", but ", " so ", " after ", " before ", " when "]:
        index = sentence.lower().find(sep)
        if index <= 0:
            continue
        left = sentence[:index].strip(" ,")
        right = sentence[index + len(sep) :].strip()
        candidate = f"{right[:1].upper()}{right[1:]} {sep.strip()} {left[:1].lower()}{left[1:]}"
        if all(s["text"].lower() in candidate.lower() for s in slots):
            return candidate
    match = re.search(
        r"\b((?:within|by the end of the day|by Friday|tomorrow afternoon|next week|right now|on staging|on canary|in the EU region|in the ticket)\b.*)$",
        sentence,
        re.I,
    )
    if match and match.start() > 8:
        phrase = sentence[match.start() :].rstrip(".?")
        head = sentence[: match.start()].strip(" ,")
        candidate = f"{phrase[:1].upper()}{phrase[1:]}, {head[:1].lower()}{head[1:]}."
        if all(item["text"].lower() in candidate.lower() for item in slots):
            return candidate
    parts = [part.strip() for part in re.split(r"\s+[—–]\s+", sentence) if part.strip()]
    if len(parts) >= 2:
        candidate = f"{parts[1][0].upper()}{parts[1][1:]}. {parts[0]}"
        if all(item["text"].lower() in candidate.lower() for item in slots):
            return candidate
    parts = [part.strip() for part in sentence.split(";") if part.strip()]
    if len(parts) >= 2:
        candidate = "; ".join(parts[1:] + parts[:1])
        if all(item["text"].lower() in candidate.lower() for item in slots):
            return candidate
    return None


MISSING: list[str] = []


def package(sentence: str, item_id: str) -> dict:
    slots = pick_slots(sentence)
    second = alternate(sentence, item_id, slots)
    if not second:
        MISSING.append(f"{item_id}: {sentence}")
        second = "Noted. " + sentence
    slots = [
        item
        for item in slots
        if item["text"].lower() in sentence.lower() and item["text"].lower() in second.lower()
    ]
    extra_roles = ["Verb", "Object", "Adverbial"]
    if len(slots) < 2:
        used = {item["text"].lower() for item in slots}
        for word in re.findall(r"[A-Za-z']{5,}", sentence):
            if word.lower() in used or word.lower() not in second.lower():
                continue
            slots.append(slot(extra_roles[len(slots) % len(extra_roles)], word))
            used.add(word.lower())
            if len(slots) >= 2:
                break
    if len(slots) < 2:
        raise SystemExit(f"too few shared slots for {item_id}: {sentence}")
    verb = next((s["text"] for s in slots if s["role"] == "Verb"), "")
    if verb and verb in sentence:
        pattern = sentence.replace(verb, "X", 1)
        correction = f'Predikat yang benar adalah "{verb}", bukan bentuk lain di tempat itu.'
    else:
        pattern = sentence.split()[0] + " not-the-target"
        correction = "Pilihan kata pada predikat atau subjek belum sama dengan model."
    return {
        "modelAnswers": [sentence, second],
        "slots": slots,
        "commonErrors": [{"pattern": pattern, "correctionId": correction}],
    }


def main() -> None:
    drills_path = ROOT / "content" / "build" / "drills.json"
    drills = json.loads(drills_path.read_text())
    for drill in drills:
        if drill.get("theme") != "dasar":
            continue
        packed = package(drill["assemble"]["sentence"], drill["id"])
        drill["modelAnswers"] = packed["modelAnswers"]
        drill["slots"] = packed["slots"]
        drill["commonErrors"] = packed["commonErrors"]
    drills_path.write_text(json.dumps(drills, indent=2, ensure_ascii=False) + "\n")

    for name in ["standup-sync", "incident-oncall", "manager-updates"]:
        path = ROOT / "content" / "modules" / f"{name}.json"
        data = json.loads(path.read_text())
        for item in data["items"]:
            if item.get("kind") == "dialogue":
                continue
            choice = next(c for c in item["choices"] if c["key"] == item["correctKey"])
            packed = package(choice["text"], item["id"])
            item["modelAnswers"] = packed["modelAnswers"]
            item["slots"] = packed["slots"]
            item["commonErrors"] = packed["commonErrors"]
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")

    speak_dir = ROOT / "content" / "speak"
    for path in sorted(speak_dir.glob("*.json")):
        if path.name == "manifest.json":
            continue
        data = json.loads(path.read_text())
        for item in data["items"]:
            packed = package(item["target"], item["id"])
            item["modelAnswers"] = packed["modelAnswers"]
            item["slots"] = packed["slots"]
            item["commonErrors"] = packed["commonErrors"]
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")

    dialogue = ROOT / "content" / "modules" / "live-dialogue.json"
    data = json.loads(dialogue.read_text())
    for item in data["items"]:
        for turn in item.get("turns") or []:
            if turn.get("speaker") != "you":
                continue
            packed = package(turn["text"], f"{item['id']}-{turn['id']}")
            turn["modelAnswers"] = packed["modelAnswers"]
            turn["slots"] = packed["slots"]
            turn["commonErrors"] = packed["commonErrors"]
    dialogue.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    if MISSING:
        print("MISSING", len(MISSING))
        for row in MISSING:
            print(row)
        raise SystemExit(1)
    print("authored")


if __name__ == "__main__":
    main()
