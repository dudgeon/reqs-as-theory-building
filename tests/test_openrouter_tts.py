#!/usr/bin/env python3
"""Offline check of the OpenRouter TTS path: a local mock of /api/v1/audio/speech records the
request and returns MP3 audio, then we confirm tts.py sends the right payload and decodes the reply.

  .venv/bin/python tests/test_openrouter_tts.py
"""
import json
import os
import subprocess
import sys
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "pipeline"))

seen = []
with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
    MP3 = f.name
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "sine=frequency=220:duration=1.2",
                "-af", "volume=0.5", "-ar", "24000", "-ac", "1", MP3], check=True)


class Mock(BaseHTTPRequestHandler):
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        seen.append((self.path, dict(self.headers), body))
        data = open(MP3, "rb").read()
        self.send_response(200)
        self.send_header("Content-Type", "audio/mpeg")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *a):
        pass


srv = HTTPServer(("127.0.0.1", 0), Mock)
threading.Thread(target=srv.serve_forever, daemon=True).start()
os.environ["OPENROUTER_BASE_URL"] = f"http://127.0.0.1:{srv.server_address[1]}/api/v1"
os.environ["OPENROUTER_API_KEY"] = "test-key"

import tts  # noqa: E402  (reads OPENROUTER_BASE_URL at import)

cfg = dict(tts.DEFAULTS["openrouter"])
audio = tts.trim_and_level(tts.synth_openrouter("In 1985, Peter Naur's surprising answer: not the code.", cfg))
path, headers, body = seen[0]
assert path == "/api/v1/audio/speech", path
assert headers["Authorization"] == "Bearer test-key"
assert body["model"] == "google/gemini-3.8-flash-tts" and body["voice"] == "Charon" and body["response_format"] == "mp3"
assert "Naur" in body["input"] and "Now-er" not in body["input"], body["input"]
assert body["provider"]["options"]["google-ai-studio"]["speech_metadata"]["style"].startswith("a warm")
assert 1.0 < len(audio) / tts.SR < 1.4, len(audio) / tts.SR
print("ok: payload", json.dumps({k: body[k] for k in ("model", "voice", "response_format")}),
      f"-> decoded {len(audio) / tts.SR:.2f}s of audio")
