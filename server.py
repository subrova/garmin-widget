#!/usr/bin/env python3
"""Small server for the Garmin widget: serves the web page and runs fetch_garmin.py on POST /refresh.

    python server.py [--port 8080] [--host 0.0.0.0]

Only a whitelist of files is served (seen.json, raw_challenges.json, tokens ... stay hidden).
Environment:
    REFRESH_KEY       optional; if set, /refresh requires ?key=... (the key is injected into the served
                      index.html, so it does not have to be stored in the repository)
    REFRESH_MIN_GAP   minimum seconds between two downloads (default 60)
    CORS_ORIGIN       optional, e.g. https://your.site  (when embedding the widget on another site)
"""
import argparse, hmac, json, os, subprocess, sys, threading, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs, quote

HERE = Path(__file__).parent
PUBLIC = {"index.html": "text/html; charset=utf-8", "garmin-widget.js": "application/javascript; charset=utf-8",
          "data.json": "application/json; charset=utf-8", "manifest.json": "application/manifest+json",
          "icon.svg": "image/svg+xml"}
KEY = os.getenv("REFRESH_KEY")
GAP = int(os.getenv("REFRESH_MIN_GAP", "60"))
CORS = os.getenv("CORS_ORIGIN")
PY = sys.executable
lock = threading.Lock()
last = {"t": 0.0, "ok": None, "msg": ""}


def run_fetch():
    """Runs the download; returns (ok, message). Only one at a time and not more often than GAP."""
    if not lock.acquire(blocking=False):
        return True, "download already in progress"
    try:
        if time.time() - last["t"] < GAP:
            return last["ok"], f"recently updated ({last['msg']})"
        r = subprocess.run([PY, str(HERE / "fetch_garmin.py")], capture_output=True, text=True, timeout=240)
        last.update(t=time.time(), ok=r.returncode == 0, msg=(r.stdout or r.stderr).strip().splitlines()[-1:][0] if (r.stdout or r.stderr).strip() else "")
        return last["ok"], last["msg"]
    except subprocess.TimeoutExpired:
        return False, "timeout"
    finally:
        lock.release()


class H(BaseHTTPRequestHandler):
    def _send(self, code, body=b"", ctype="text/plain; charset=utf-8", extra=None):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        if CORS:
            self.send_header("Access-Control-Allow-Origin", CORS)
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send(204)

    def do_GET(self):
        p = urlparse(self.path).path.lstrip("/") or "index.html"
        if p not in PUBLIC or not (HERE / p).is_file():
            return self._send(404, b"not found")
        body = (HERE / p).read_bytes()
        if p == "index.html" and KEY:  # keep the key out of git: inject it into the served page
            body = body.replace(b'data-refresh-url="refresh"', b'data-refresh-url="refresh?key=' + quote(KEY).encode() + b'"')
        self._send(200, body, PUBLIC[p])

    def do_POST(self):
        u = urlparse(self.path)
        if u.path != "/refresh":
            return self._send(404, b"not found")
        if KEY and not hmac.compare_digest(parse_qs(u.query).get("key", [""])[0], KEY):
            return self._send(403, b"forbidden")
        ok, msg = run_fetch()
        self._send(200 if ok else 500, json.dumps({"ok": ok, "msg": msg}, ensure_ascii=False).encode(), "application/json; charset=utf-8")

    def log_message(self, fmt, *a):
        sys.stderr.write("%s %s\n" % (self.address_string(), fmt % a))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default="0.0.0.0")
    ap.add_argument("--port", type=int, default=8080)
    a = ap.parse_args()
    print(f"http://{a.host}:{a.port}/  (refresh {'with key' if KEY else 'no key'})")
    ThreadingHTTPServer((a.host, a.port), H).serve_forever()
