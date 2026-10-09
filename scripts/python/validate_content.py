#!/usr/bin/env python3
"""Validate AS English bilingual content modules."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from rubric_rules import check_package

try:
    import jsonschema
except ImportError:
    print("Install dependency: pip install jsonschema", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[2]
CONTENT = ROOT / "content"
TREES = [
    (CONTENT / "manifest.json", CONTENT / "modules"),
    (CONTENT / "home" / "manifest.json", CONTENT / "home" / "modules"),
]

CHOICE_KEY = {"type": "string", "enum": ["A", "B", "C", "D"]}

CHOICE_SCHEMA = {
    "type": "object",
    "required": ["key", "text", "textId", "structure", "structureId"],
    "additionalProperties": False,
    "properties": {
        "key": CHOICE_KEY,
        "text": {"type": "string", "minLength": 1},
        "textId": {"type": "string", "minLength": 1},
        "structure": {"type": "string", "minLength": 1},
        "structureId": {"type": "string", "minLength": 1},
    },
}

ITEM_SCHEMA = {
    "type": "object",
    "required": [
        "id",
        "moduleId",
        "difficulty",
        "scenario",
        "scenarioId",
        "scenarioStructure",
        "scenarioStructureId",
        "prompt",
        "promptId",
        "promptStructure",
        "promptStructureId",
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
        "scenarioStructure": {"type": "string", "minLength": 1},
        "scenarioStructureId": {"type": "string", "minLength": 1},
        "prompt": {"type": "string", "minLength": 1},
        "promptId": {"type": "string", "minLength": 1},
        "promptStructure": {"type": "string", "minLength": 1},
        "promptStructureId": {"type": "string", "minLength": 1},
        "choices": {
            "type": "array",
            "minItems": 4,
            "maxItems": 4,
            "items": CHOICE_SCHEMA,
        },
        "correctKey": CHOICE_KEY,
        "explanation": {"type": "string", "minLength": 1},
        "tags": {"type": "array", "items": {"type": "string"}},
        "chunks": {"type": "array", "items": {"type": "string", "minLength": 1}},
        "modelAnswers": {
            "type": "array",
            "minItems": 1,
            "maxItems": 3,
            "items": {"type": "string", "minLength": 1},
        },
        "slots": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["role", "roleId", "text"],
                "additionalProperties": False,
                "properties": {
                    "role": {"type": "string"},
                    "roleId": {"type": "string"},
                    "text": {"type": "string"},
                    "noteId": {"type": "string"},
                },
            },
        },
        "commonErrors": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["pattern", "correctionId"],
                "additionalProperties": False,
                "properties": {
                    "pattern": {"type": "string"},
                    "correctionId": {"type": "string"},
                },
            },
        },
        "kind": {"type": "string", "enum": ["mcq", "dialogue"]},
        "turns": {
            "type": "array",
            "items": {
                "type": "object",
                "required": [
                    "id",
                    "speaker",
                    "roleLabel",
                    "roleLabelId",
                    "text",
                    "textId",
                    "structure",
                    "structureId",
                ],
                "additionalProperties": False,
                "properties": {
                    "id": {"type": "string"},
                    "speaker": {"type": "string", "enum": ["them", "you"]},
                    "roleLabel": {"type": "string"},
                    "roleLabelId": {"type": "string"},
                    "text": {"type": "string"},
                    "textId": {"type": "string"},
                    "structure": {"type": "string", "minLength": 1},
                    "structureId": {"type": "string", "minLength": 1},
                    "correctKey": CHOICE_KEY,
                    "choices": {
                        "type": "array",
                        "minItems": 4,
                        "maxItems": 4,
                        "items": CHOICE_SCHEMA,
                    },
                    "modelAnswers": {
                        "type": "array",
                        "minItems": 1,
                        "maxItems": 3,
                        "items": {"type": "string", "minLength": 1},
                    },
                    "slots": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["role", "roleId", "text", "noteId"],
                            "additionalProperties": False,
                            "properties": {
                                "role": {"type": "string"},
                                "roleId": {"type": "string"},
                                "text": {"type": "string"},
                                "noteId": {"type": "string"},
                            },
                        },
                    },
                    "commonErrors": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["pattern", "correctionId"],
                            "additionalProperties": False,
                            "properties": {
                                "pattern": {"type": "string"},
                                "correctionId": {"type": "string"},
                            },
                        },
                    },
                },
            },
        },
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


def validate_tree(manifest_path: Path, modules_dir: Path, errors: list[str]) -> tuple[int, int]:
    if not manifest_path.exists():
        errors.append(f"Missing manifest: {manifest_path}")
        return 0, 0

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    try:
        jsonschema.validate(manifest, MANIFEST_SCHEMA)
    except jsonschema.ValidationError as exc:
        errors.append(f"manifest.json: {exc.message}")

    module_ids = {m["id"] for m in manifest.get("modules", [])}

    for module_meta in manifest.get("modules", []):
        module_path = modules_dir / f"{module_meta['id']}.json"
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

            priority = {
                "standup-sync",
                "incident-oncall",
                "manager-updates",
                "live-dialogue",
            }
            if modules_dir.name == "modules" and data["id"] in priority:
                if item.get("kind") == "dialogue":
                    for turn in item.get("turns") or []:
                        if turn.get("speaker") != "you":
                            continue
                        errors.extend(
                            check_package(
                                f"{data['id']}/{turn['id']}",
                                turn.get("modelAnswers") or [],
                                turn.get("slots") or [],
                                turn.get("commonErrors") or [],
                            )
                        )
                else:
                    errors.extend(
                        check_package(
                            f"{data['id']}/{item['id']}",
                            item.get("modelAnswers") or [],
                            item.get("slots") or [],
                            item.get("commonErrors") or [],
                        )
                    )

    for path in sorted(modules_dir.glob("*.json")):
        if path.stem not in module_ids:
            errors.append(f"Orphan module file not in manifest: {path.name}")

    ready = sum(1 for m in manifest["modules"] if m["status"] == "ready")
    return len(manifest["modules"]), ready


def main() -> int:
    errors: list[str] = []
    summaries: list[str] = []

    for manifest_path, modules_dir in TREES:
        before = len(errors)
        count, ready = validate_tree(manifest_path, modules_dir, errors)
        if len(errors) == before:
            label = manifest_path.parent.name
            summaries.append(f"{label}: {count} modules ({ready} ready)")

    drills_path = CONTENT / "build" / "drills.json"
    if drills_path.exists():
        drills = json.loads(drills_path.read_text(encoding="utf-8"))
        for drill in drills:
            if drill.get("theme") != "dasar":
                continue
            errors.extend(
                check_package(
                    f"dasar/{drill['id']}",
                    drill.get("modelAnswers") or [],
                    drill.get("slots") or [],
                    drill.get("commonErrors") or [],
                )
            )

    if errors:
        print("Content validation FAILED:", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        return 1

    print("OK — " + "; ".join(summaries) + ", bilingual schema valid.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
