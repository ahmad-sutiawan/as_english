#!/usr/bin/env python3
"""Validate AS English bilingual content modules."""

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
CONTENT = ROOT / "content"
MANIFEST_PATH = CONTENT / "manifest.json"
MODULES_DIR = CONTENT / "modules"

CHOICE_KEY = {"type": "string", "enum": ["A", "B", "C", "D"]}

ITEM_SCHEMA = {
    "type": "object",
    "required": [
        "id",
        "moduleId",
        "difficulty",
        "scenario",
        "scenarioId",
        "prompt",
        "promptId",
        "choices",
        "correctKey",
        "explanation",
        "tags",
    ],
    "additionalProperties": False,
    "properties": {
        "id": {"type": "string", "minLength": 1},
        "moduleId": {"type": "string", "minLength": 1},
        "difficulty": {"type": "string", "enum": ["junior", "mid", "senior"]},
        "scenario": {"type": "string", "minLength": 1},
        "scenarioId": {"type": "string", "minLength": 1},
        "prompt": {"type": "string", "minLength": 1},
        "promptId": {"type": "string", "minLength": 1},
        "choices": {
            "type": "array",
            "minItems": 4,
            "maxItems": 4,
            "items": {
                "type": "object",
                "required": ["key", "text", "textId"],
                "additionalProperties": False,
                "properties": {
                    "key": CHOICE_KEY,
                    "text": {"type": "string", "minLength": 1},
                    "textId": {"type": "string", "minLength": 1},
                },
            },
        },
        "correctKey": CHOICE_KEY,
        "explanation": {"type": "string", "minLength": 1},
        "tags": {"type": "array", "items": {"type": "string"}},
        "tts": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "scenario": {"type": "boolean"},
                "prompt": {"type": "boolean"},
                "answer": {"type": "boolean"},
            },
        },
    },
}

MODULE_SCHEMA = {
    "type": "object",
    "required": [
        "id",
        "title",
        "titleId",
        "description",
        "persona",
        "status",
        "itemCount",
        "items",
    ],
    "additionalProperties": False,
    "properties": {
        "id": {"type": "string"},
        "title": {"type": "string"},
        "titleId": {"type": "string"},
        "description": {"type": "string"},
        "persona": {"type": "array", "items": {"type": "string"}},
        "status": {"type": "string", "enum": ["ready", "stub"]},
        "itemCount": {"type": "integer", "minimum": 0},
        "items": {"type": "array", "items": ITEM_SCHEMA},
    },
}

MANIFEST_SCHEMA = {
    "type": "object",
    "required": ["version", "modules"],
    "additionalProperties": False,
    "properties": {
        "version": {"type": "string"},
        "modules": {
            "type": "array",
            "items": {
                "type": "object",
                "required": [
                    "id",
                    "title",
                    "titleId",
                    "description",
                    "persona",
                    "status",
                    "itemCount",
                ],
                "additionalProperties": False,
                "properties": {
                    "id": {"type": "string"},
                    "title": {"type": "string"},
                    "titleId": {"type": "string"},
                    "description": {"type": "string"},
                    "persona": {"type": "array", "items": {"type": "string"}},
                    "status": {"type": "string", "enum": ["ready", "stub"]},
                    "itemCount": {"type": "integer", "minimum": 0},
                },
            },
        },
    },
}


def main() -> int:
    errors: list[str] = []

    if not MANIFEST_PATH.exists():
        print(f"Missing manifest: {MANIFEST_PATH}", file=sys.stderr)
        return 1

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    try:
        jsonschema.validate(manifest, MANIFEST_SCHEMA)
    except jsonschema.ValidationError as exc:
        errors.append(f"manifest.json: {exc.message}")

    module_ids = {m["id"] for m in manifest.get("modules", [])}

    for module_meta in manifest.get("modules", []):
        module_path = MODULES_DIR / f"{module_meta['id']}.json"
        if not module_path.exists():
            errors.append(f"Missing module file for {module_meta['id']}")
            continue

        data = json.loads(module_path.read_text(encoding="utf-8"))
        try:
            jsonschema.validate(data, MODULE_SCHEMA)
        except jsonschema.ValidationError as exc:
            errors.append(f"{module_path.name}: {exc.message}")
            continue

        if data["id"] != module_meta["id"]:
            errors.append(
                f"{module_path.name}: id mismatch with manifest ({data['id']})"
            )

        if data["itemCount"] != len(data["items"]):
            errors.append(
                f"{module_path.name}: itemCount {data['itemCount']} != len(items) {len(data['items'])}"
            )

        keys_seen: set[str] = set()
        for item in data["items"]:
            if item["id"] in keys_seen:
                errors.append(f"{module_path.name}: duplicate item id {item['id']}")
            keys_seen.add(item["id"])

            if item["moduleId"] != data["id"]:
                errors.append(
                    f"{module_path.name}/{item['id']}: moduleId mismatch"
                )

            choice_keys = [c["key"] for c in item["choices"]]
            if sorted(choice_keys) != ["A", "B", "C", "D"]:
                errors.append(
                    f"{module_path.name}/{item['id']}: choices must be A-D uniquely"
                )

            if item["correctKey"] not in choice_keys:
                errors.append(
                    f"{module_path.name}/{item['id']}: correctKey not in choices"
                )

    for path in sorted(MODULES_DIR.glob("*.json")):
        if path.stem not in module_ids:
            errors.append(f"Orphan module file not in manifest: {path.name}")

    if errors:
        print("Content validation FAILED:", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        return 1

    ready = sum(1 for m in manifest["modules"] if m["status"] == "ready")
    print(
        f"OK — {len(manifest['modules'])} modules ({ready} ready), bilingual schema valid."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
