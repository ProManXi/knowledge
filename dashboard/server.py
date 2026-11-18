"""Dashboard server: serves the UI and rebuilds data.json whenever vault docs change."""
import http.server, os, subprocess, sys, threading

HERE = os.path.dirname(os.path.abspath(__file__))
VAULT = os.path.dirname(HERE)
DATA = os.path.join(HERE, "data.json")
lock = threading.Lock()

def newest_md():
    newest = 0
    for root, _, files in os.walk(os.path.join(VAULT, "projects")):
        for f in files:
            if f.endswith(".md"):
                newest = max(newest, os.path.getmtime(os.path.join(root, f)))
    return newest

def refresh():
    with lock:
        if not os.path.exists(DATA) or newest_md() > os.path.getmtime(DATA):
            subprocess.run([sys.executable, os.path.join(HERE, "build_data.py")], cwd=HERE)

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=HERE, **k)
    def do_GET(self):
        if self.path.split("?")[0] == "/data.json":
            refresh()
        super().do_GET()
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

if __name__ == "__main__":
    refresh()
    print("Dashboard on http://localhost:3000")
    http.server.ThreadingHTTPServer(("", 3000), H).serve_forever()
