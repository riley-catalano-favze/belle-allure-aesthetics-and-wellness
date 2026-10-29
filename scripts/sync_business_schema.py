#!/usr/bin/env python3
"""Add the same local business markup to every page, inside <head>.

Edit BUSINESS below, then run: python3 scripts/sync_business_schema.py
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
SITE = "https://belleallureaestheticsandwellness.com"
MARK_START = "<!-- business-schema:start -->"
MARK_END = "<!-- business-schema:end -->"

BUSINESS = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    "@id": f"{SITE}/#business",
    "name": "Belle Allure Aesthetics and Wellness",
    "url": f"{SITE}/",
    "logo": f"{SITE}/apple-touch-icon.png",
    "image": f"{SITE}/assets/social-preview.jpg",
    "telephone": "+1-574-735-1528",
    "address": {
        "@type": "PostalAddress",
        "streetAddress": "320 West Bristol Street",
        "addressLocality": "Elkhart",
        "addressRegion": "IN",
        "postalCode": "46514",
        "addressCountry": "US",
    },
    "geo": {"@type": "GeoCoordinates", "latitude": 41.70298, "longitude": -85.98049},
    "openingHoursSpecification": [
        {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday"], "opens": "08:30", "closes": "17:00"},
        {"@type": "OpeningHoursSpecification", "dayOfWeek": "Thursday", "opens": "08:30", "closes": "15:00"},
        {"@type": "OpeningHoursSpecification", "dayOfWeek": "Friday", "opens": "10:00", "closes": "14:00"},
    ],
    "areaServed": [
        {"@type": "City", "name": "Elkhart", "containedInPlace": {"@type": "State", "name": "Indiana"}},
        {"@type": "City", "name": "Goshen", "containedInPlace": {"@type": "State", "name": "Indiana"}},
        {"@type": "City", "name": "Middlebury", "containedInPlace": {"@type": "State", "name": "Indiana"}},
        {"@type": "City", "name": "Bristol", "containedInPlace": {"@type": "State", "name": "Indiana"}},
        {"@type": "City", "name": "Mishawaka", "containedInPlace": {"@type": "State", "name": "Indiana"}},
        {"@type": "City", "name": "South Bend", "containedInPlace": {"@type": "State", "name": "Indiana"}},
        {"@type": "City", "name": "Nappanee", "containedInPlace": {"@type": "State", "name": "Indiana"}},
        {"@type": "City", "name": "Wakarusa", "containedInPlace": {"@type": "State", "name": "Indiana"}},
    ],
    "sameAs": [
        "https://www.facebook.com/p/Belle-Allure-Aesthetics-and-Wellness-61578410480099/",
        "https://www.instagram.com/katiebelleallureaesthetics/",
    ],
    "priceRange": "$$",
}

BLOCK = (
    f"{MARK_START}\n"
    '<script type="application/ld+json">'
    + json.dumps(BUSINESS, ensure_ascii=False, indent=1)
    + "</script>\n"
    f"{MARK_END}"
)
PATTERN = re.compile(re.escape(MARK_START) + r".*?" + re.escape(MARK_END), re.S)

changed = 0
pages = list(ROOT.glob("*.html")) + list((ROOT / "services").glob("*.html"))
for page in pages:
    text = page.read_text(encoding="utf-8")
    if PATTERN.search(text):
        new = PATTERN.sub(lambda _: BLOCK, text, count=1)
    else:
        new = text.replace("</head>", BLOCK + "\n</head>", 1)
    if new != text:
        page.write_text(new, encoding="utf-8")
        changed += 1
print(f"Business markup on {changed} page(s).")
