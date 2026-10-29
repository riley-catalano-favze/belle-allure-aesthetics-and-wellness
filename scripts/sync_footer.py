#!/usr/bin/env python3
"""Copy the shared footer from assets/partials/footer.html into every page.

Edit the footer once in assets/partials/footer.html, then run:
    python3 scripts/sync_footer.py
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
PARTIAL = (ROOT / "assets/partials/footer.html").read_text(encoding="utf-8").strip()
FOOTER = re.compile(r"<footer\b.*?</footer>", re.S)

changed = 0
pages = list(ROOT.glob("*.html")) + list((ROOT / "services").glob("*.html"))
for page in pages:
    text = page.read_text(encoding="utf-8")
    if not FOOTER.search(text):
        continue
    updated = FOOTER.sub(lambda _: PARTIAL, text, count=1)
    if updated != text:
        page.write_text(updated, encoding="utf-8")
        changed += 1
print(f"Footer synced on {changed} page(s).")
