#!/usr/bin/env python3
"""Align plain lyrics to audio using lyrics-sync (lsync).

Outputs JSON to stdout in this shape:
{
  "lines": [
    {"startTime": 12.34, "endTime": 15.67, "text": "..."}
  ]
}
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from typing import List, Dict, Any, Tuple


def parse_lrc_timestamp(raw: str) -> float | None:
    # Accept [mm:ss.xx], [m:ss], [hh:mm:ss.xx]
    raw = raw.strip()
    parts = raw.split(":")
    try:
        if len(parts) == 2:
            minutes = int(parts[0])
            seconds = float(parts[1])
            return minutes * 60.0 + seconds
        if len(parts) == 3:
            hours = int(parts[0])
            minutes = int(parts[1])
            seconds = float(parts[2])
            return hours * 3600.0 + minutes * 60.0 + seconds
    except ValueError:
        return None
    return None


def parse_lrc_lines(lrc: str) -> List[Tuple[float, str]]:
    lines: List[Tuple[float, str]] = []
    for raw_line in lrc.splitlines():
        match = re.match(r"^\[(.*?)\](.*)$", raw_line)
        if not match:
            continue
        ts = parse_lrc_timestamp(match.group(1))
        text = match.group(2).strip()
        if ts is None:
            continue
        if not text:
            continue
        lines.append((ts, text))
    lines.sort(key=lambda item: item[0])
    return lines


def build_output_lines(ts_lines: List[Tuple[float, str]]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for idx, (start, text) in enumerate(ts_lines):
        if idx + 1 < len(ts_lines):
            next_start = ts_lines[idx + 1][0]
            end = max(start + 0.2, next_start - 0.02)
        else:
            end = start + 2.0
        out.append({
            "startTime": float(start),
            "endTime": float(end),
            "text": text,
            "chords": [],
        })
    return out


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio", required=True)
    parser.add_argument("--lyrics", required=True)
    args = parser.parse_args()

    try:
        from lsync import LyricsSync  # type: ignore
    except Exception as exc:
        print(json.dumps({"error": f"Failed to import lsync: {exc}"}))
        return 2

    try:
        syncer = LyricsSync()
        _words, lrc = syncer.sync(args.audio, args.lyrics)

        if isinstance(lrc, str):
            parsed = parse_lrc_lines(lrc)
        elif isinstance(lrc, list):
            # Some versions may return list-like structures; best effort normalize.
            parsed = []
            for item in lrc:
                if isinstance(item, dict) and "time" in item and "text" in item:
                    try:
                        ts = float(item["time"])
                    except Exception:
                        continue
                    text = str(item["text"]).strip()
                    if text:
                        parsed.append((ts, text))
            parsed.sort(key=lambda item: item[0])
        else:
            print(json.dumps({"error": "Unexpected lsync output format"}))
            return 3

        if not parsed:
            print(json.dumps({"error": "No aligned lines produced"}))
            return 4

        print(json.dumps({"lines": build_output_lines(parsed)}))
        return 0
    except Exception as exc:
        print(json.dumps({"error": f"lyrics-sync alignment failed: {exc}"}))
        return 5


if __name__ == "__main__":
    raise SystemExit(main())
