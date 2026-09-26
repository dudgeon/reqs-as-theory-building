#!/usr/bin/env bash
# Build "Specs as Theory Building" end to end.
#
#   VIDEO=specs-as-theory-building ./build.sh   # which folder in videos/ (optional when there is only one)
#   ./build.sh                    # voice: OpenRouter if OPENROUTER_API_KEY is set, else local Kokoro stand-in
#   VOICE=openrouter ./build.sh --voice Kore --model google/gemini-3.8-flash-tts
#   VOICE=kokoro ./build.sh
#
# Extra arguments are passed to pipeline/tts.py (see `python pipeline/tts.py --help`).
set -euo pipefail
cd "$(dirname "$0")"
PY=${PY:-.venv/bin/python}
VIDEOS=$(ls -d videos/*/narration.json 2>/dev/null | cut -d/ -f2)
if [ -z "${VIDEO:-}" ]; then
  if [ "$(echo "$VIDEOS" | wc -l)" -eq 1 ]; then VIDEO=$VIDEOS; else
    echo "Set VIDEO to one of:" $VIDEOS; echo "  e.g. VIDEO=$(echo "$VIDEOS" | head -1) ./build.sh"; exit 2; fi
fi
export VIDEO
echo "== video: $VIDEO"
VOICE=${VOICE:-$([ -n "${OPENROUTER_API_KEY:-}" ] && echo openrouter || echo kokoro)}

echo "== voice: $VOICE"
[ -f video/assets/paper.jpg ] || "$PY" pipeline/paper.py
"$PY" pipeline/tts.py --provider "$VOICE" "$@"
echo "== aligning words to the audio"
"$PY" pipeline/align.py
"$PY" pipeline/timeline.py
echo "== sound effects + mix"
node video/render.js --sfx
"$PY" pipeline/mix.py
echo "== rendering frames"
node video/render.js --frames --workers "${WORKERS:-4}"
echo "== encoding"
"$PY" pipeline/encode.py
echo "== storyboard"
"$PY" pipeline/storyboard.py
