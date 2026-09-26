#!/usr/bin/env bash
# One-time setup on Debian/Ubuntu: ffmpeg, espeak-ng, Python deps, Playwright's Chromium.
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v ffmpeg >/dev/null || ! command -v espeak-ng >/dev/null; then
  sudo_cmd=$([ "$(id -u)" = 0 ] && echo "" || echo sudo)
  $sudo_cmd apt-get update -qq && $sudo_cmd apt-get install -y -qq ffmpeg espeak-ng
fi
python3 -m venv .venv
.venv/bin/pip install -q --upgrade pip
.venv/bin/pip install -q torch --index-url https://download.pytorch.org/whl/cpu   # CPU-only, for the local stand-in voice
.venv/bin/pip install -q -r requirements.txt
# spaCy English model (used by Kokoro's phonemiser), fetched from Hugging Face
if ! .venv/bin/python -c "import en_core_web_sm" 2>/dev/null; then
  tmp=$(mktemp -d)
  curl -sSL -o "$tmp/en_core_web_sm-3.7.1-py3-none-any.whl" \
    https://huggingface.co/spacy/en_core_web_sm/resolve/main/en_core_web_sm-any-py3-none-any.whl
  .venv/bin/pip install -q "$tmp/en_core_web_sm-3.7.1-py3-none-any.whl"
fi
# Playwright drives headless Chromium to render frames. video/render.js accepts a local or a global
# install; reuse whichever exists so a preinstalled browser build is not orphaned by an upgrade.
if ! node -e "try{require('playwright')}catch(e){require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright')}" 2>/dev/null; then
  npm install -g playwright@1.56.1
  npx -y playwright@1.56.1 install chromium
fi
echo "setup done"
