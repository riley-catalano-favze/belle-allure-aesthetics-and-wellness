#!/usr/bin/env python3
"""Copy the shared header into every page.

Source files (edit these, then run this script):
  assets/partials/header.html   header markup
  assets/css/header.css         header styles
  assets/js/header.js           header behaviour

Run: python3 scripts/sync_header.py
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _css_filter import remove_css, HDR  # noqa: E402

HEADER_PARTIAL = (ROOT / "assets/partials/header.html").read_text(encoding="utf-8").strip()
def site_header_span(text):
    """Span of the outermost <header> that holds the site navigation (nesting-aware)."""
    for m in re.finditer(r"<header\b", text):
        depth = 0
        for t in re.finditer(r"<header\b|</header>", text[m.start():]):
            depth += 1 if t.group(0).startswith("<header") else -1
            if depth == 0:
                a, b = m.start(), m.start() + t.end()
                if 'id="site-nav"' in text[a:b]:
                    return a, b
                break
    return None
STYLE = re.compile(r"(<style[^>]*>)(.*?)(</style>)", re.S)
SCRIPT = re.compile(r"<script(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>.*?</script>", re.S)
HEADER_SCRIPT_MARKERS = ("#site-nav a", "nav-toggle", "services-dropdown", "menu-final-js", "One Services dropdown")
CSS_LINK = '<link rel="stylesheet" href="/assets/css/header.css">'
JS_TAG = '<script src="/assets/js/header.js" defer></script>'

changed = 0
pages = list(ROOT.glob("*.html")) + list((ROOT / "services").glob("*.html"))
for page in pages:
    text = page.read_text(encoding="utf-8")
    span = site_header_span(text)
    if span is None:
        continue
    new = text[:span[0]] + HEADER_PARTIAL + text[span[1]:]
    new = STYLE.sub(lambda m: m.group(1) + remove_css(m.group(2), lambda sel: bool(HDR.search(sel)) and "split-head" not in sel) + m.group(3), new)

    def drop_header_script(m):
        block = m.group(0)
        return "" if any(k in block for k in HEADER_SCRIPT_MARKERS) else block
    new = SCRIPT.sub(drop_header_script, new)

    if CSS_LINK not in new:
        new = new.replace("</head>", CSS_LINK + "\n</head>", 1)
    if JS_TAG not in new:
        new = new.replace("</body>", JS_TAG + "\n</body>", 1)
    if new != text:
        page.write_text(new, encoding="utf-8")
        changed += 1
print(f"Header synced on {changed} page(s).")
