#!/usr/bin/env bash
set -euo pipefail

# Installs lyrics-sync into a dedicated Python virtualenv for Linux servers.
# Usage:
#   bash scripts/install_lyrics_sync_linux.sh
# Then set:
#   LYRICS_SYNC_ENABLED=true
#   LYRICS_SYNC_PYTHON_BIN=/opt/chordmini-lyrics-sync/bin/python
#   PYTHONPATH=/opt/chordmini-lyrics-sync/src

VENV_DIR="/opt/chordmini-lyrics-sync"
SRC_DIR="${VENV_DIR}/src"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required but not found."
  exit 1
fi

if ! command -v pip3 >/dev/null 2>&1; then
  echo "pip3 is required but not found."
  exit 1
fi

echo "Creating virtualenv at ${VENV_DIR} ..."
python3 -m venv "${VENV_DIR}"

# shellcheck disable=SC1091
source "${VENV_DIR}/bin/activate"

python -m pip install --upgrade pip setuptools wheel

if ! command -v git >/dev/null 2>&1; then
  echo "git is required but not found."
  exit 1
fi

echo "Cloning lyrics-sync source into ${SRC_DIR} ..."
rm -rf "${SRC_DIR}"
git clone --depth=1 https://github.com/mikezzb/lyrics-sync.git "${SRC_DIR}"

echo "lyrics-sync source checkout completed."
echo "Set LYRICS_SYNC_ENABLED=true"
echo "Set LYRICS_SYNC_PYTHON_BIN=${VENV_DIR}/bin/python"
echo "Set PYTHONPATH=${SRC_DIR}"
echo "Note: the upstream project is not pip-installable and has substantial extra dependencies."
echo "If imports fail at runtime, provision the upstream environment separately or disable LYRICS_SYNC_ENABLED."
