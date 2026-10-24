#!/usr/bin/env bash
# Usage: scripts/install_into_repo.sh /path/to/cloned/BrandLedger
# Copies the module into backend/ without overwriting existing files.
set -e
R="$1"; [ -d "$R/.git" ] || { echo "Pass the cloned repo path"; exit 1; }
S="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$R/backend/app/services/extraction" "$R/backend/tests/extraction_data"
cp -n "$S"/brandledger_extraction/*.py "$R/backend/app/services/extraction/"
cp -n "$S"/tests/test_extraction.py "$R/backend/tests/test_extraction_module.py"
cp -Rn "$S"/dataset "$S"/logo_library "$R/backend/tests/extraction_data/"
echo "Copied. Fix test imports/paths if needed, then: git checkout -b feat/file-processing && git add . && git commit && git push -u origin feat/file-processing"
