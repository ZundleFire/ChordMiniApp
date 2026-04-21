#!/usr/bin/env bash
set -euo pipefail

# Installs lyrics-sync into a dedicated Python virtualenv for Linux servers.
# Usage:
#   bash scripts/install_lyrics_sync_linux.sh
# Then set:
#   LYRICS_SYNC_ENABLED=true
#   LYRICS_SYNC_PYTHON_BIN=/opt/chordmini-lyrics-sync/bin/python

VENV_DIR="/opt/chordmini-lyrics-sync"

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
python -m pip install --no-cache-dir git+https://github.com/mikezzb/lyrics-sync.git

echo "lyrics-sync installed successfully."
echo "Set LYRICS_SYNC_ENABLED=true and LYRICS_SYNC_PYTHON_BIN=${VENV_DIR}/bin/python"
