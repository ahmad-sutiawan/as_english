#!/usr/bin/env python3
"""Validate offline speak-trainer content packs."""

from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    import jsonschema
except ImportError:
    print("Install dependency: pip install jsonschema", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[2]
SPEAK = ROOT / "content" / "speak"
MANIFEST = SPEAK / "manifest.json"

ITEM_SCHEMA = {
    "type": "object",
    "required": [
        "id",
        "category",
        "level",
        "target",
        "targetId",
        "chunks",
        "scrambled",
        "keywords",
        "grammarPatterns",
        "commonErrors",
        "scenario",
        "scenarioId",
        "modelAnswers",
    ],
    "additionalProperties": False,
    "properties": {
        "id": {"type": "string", "minLength": 1},
        "category": {"type": "string", "minLength": 1},
        "level": {"type": "string", "enum": ["junior", "mid", "senior"]},
        "target": {"type": "string", "minLength": 1},
        "targetId": {"type": "string", "minLength": 1},
        "chunks": {"type": "array", "minItems": 2, "items": {"type": "string", "minLength": 1}},
        "scrambled": {"type": "array", "minItems": 3, "items": {"type": "string", "minLength": 1}},
        "keywords": {"type": "array", "minItems": 1, "items": {"type": "string"}},
        "grammarPatterns": {"type": "array", "items": {"type": "string"}},
        "commonErrors": {"type": "array", "items": {"type": "string"}},
        "scenario": {"type": "string", "minLength": 1},
        "scenarioId": {"type": "string", "minLength": 1},
        "modelAnswers": {"type": "array", "minItems": 1, "items": {"type": "string", "minLength": 1}},
        "audio": {"type": ["string", "null"]},
    },
}

PACK_SCHEMA = {
    "type": "object",
    "required": ["id", "title", "titleId", "itemCount", "items"],
    "additionalProperties": False,
    "properties": {
        "id": {"type": "string"},
        "title": {"type": "string"},
        "titleId": {"type": "string"},
        "itemCount": {"type": "integer", "minimum": 0},
        "items": {"type": "array", "items": ITEM_SCHEMA},
    },
}


def main() -> int:
    errors: list[str] = []
    if not MANIFEST.exists():
        print(f"Missing {MANIFEST}", file=sys.stderr)
        return 1

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    pack_ids = {p["id"] for p in manifest.get("packs", [])}
    seen_items: set[str] = set()
    total = 0

    for pack_meta in manifest.get("packs", []):
        path = SPEAK / f"{pack_meta['id']}.json"
        if not path.exists():
            errors.append(f"Missing pack {path.name}")
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        try:
            jsonschema.validate(data, PACK_SCHEMA)
        except jsonschema.ValidationError as exc:
            errors.append(f"{path.name}: {exc.message}")
            continue
        if data["itemCount"] != len(data["items"]):
            errors.append(
                f"{path.name}: itemCount {data['itemCount']} != {len(data['items'])}"
            )
        for it in data["items"]:
            if it["id"] in seen_items:
                errors.append(f"duplicate item id {it['id']}")
            seen_items.add(it["id"])
            total += 1

    for path in sorted(SPEAK.glob("*.json")):
        if path.name == "manifest.json":
            continue
        if path.stem not in pack_ids:
            errors.append(f"Orphan pack not in manifest: {path.name}")

    expected = manifest.get("itemCount")
    if expected is not None and expected != total and not errors:
        errors.append(f"manifest itemCount {expected} != actual {total}")

    if errors:
        print("Speak content validation FAILED:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1

    print(f"OK — speak packs {len(pack_ids)}, items {total}, offline schema valid.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
