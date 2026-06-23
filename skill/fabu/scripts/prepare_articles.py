#!/usr/bin/env python3
"""Prepare local Markdown news articles for browser-based submission."""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path


SKIP_DIRS = {".git", ".serena", "已上传", "已完成"}


def choose_archive_dir(folder: Path) -> Path:
    for name in ("已上传", "已完成"):
        candidate = folder / name
        if candidate.exists() and candidate.is_dir():
            return candidate
    return folder / "已上传"


def read_article(path: Path, folder: Path) -> dict[str, str]:
    text = path.read_text(encoding="utf-8-sig").replace("\r\n", "\n").replace("\r", "\n")
    lines = [line.strip() for line in text.split("\n")]
    non_empty = [line for line in lines if line]
    title = non_empty[0] if non_empty else path.stem
    body_lines = non_empty[1:] if non_empty and non_empty[0] == title else non_empty
    body = "\n\n".join(body_lines).strip()
    summary = body_lines[0][:240] if body_lines else ""
    archive_dir = choose_archive_dir(folder)
    return {
        "path": str(path),
        "filename": path.name,
        "title": title,
        "body": body,
        "summary": summary,
        "archive_path": str(archive_dir / path.name),
    }


def iter_markdown(folder: Path) -> list[Path]:
    files: list[Path] = []
    for path in folder.rglob("*.md"):
        if path.name.startswith("."):
            continue
        if any(part in SKIP_DIRS for part in path.relative_to(folder).parts[:-1]):
            continue
        files.append(path)
    return sorted(files, key=lambda p: p.name)


def archive_file(folder: Path, article: Path) -> dict[str, str]:
    article = article.expanduser().resolve()
    if not article.exists():
        raise SystemExit(f"Article does not exist: {article}")
    archive_dir = choose_archive_dir(folder)
    archive_dir.mkdir(parents=True, exist_ok=True)
    target = archive_dir / article.name
    if target.exists():
        raise SystemExit(f"Archive target already exists: {target}")
    shutil.move(str(article), str(target))
    return {"moved": str(article), "archive_path": str(target)}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("folder", help="Folder containing Markdown article drafts")
    parser.add_argument("--archive", help="Move this article into the uploaded/completed folder")
    args = parser.parse_args()

    folder = Path(args.folder).expanduser().resolve()
    if not folder.is_dir():
        raise SystemExit(f"Folder does not exist: {folder}")

    if args.archive:
        result = archive_file(folder, Path(args.archive))
    else:
        result = {
            "folder": str(folder),
            "archive_dir": str(choose_archive_dir(folder)),
            "articles": [read_article(path, folder) for path in iter_markdown(folder)],
        }

    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
