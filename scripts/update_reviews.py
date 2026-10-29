#!/usr/bin/env python3
"""Update the Google review count shown on the Belle Allure website.

Reads the live Google Business Profile review count and five-star count,
then updates the site text and the review count in the structured data.
Runs in GitHub Actions. If the Google secrets are not set, it exits
without changing anything.
"""

import json
import os
import pathlib
import re
import sys
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
SKIP_DIRS = {".git", "scripts", ".github"}
REQUIRED = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REFRESH_TOKEN",
    "GOOGLE_ACCOUNT_ID",
    "GOOGLE_LOCATION_ID",
]


def get_access_token(client_id, client_secret, refresh_token):
    data = urllib.parse.urlencode({
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=data)
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)["access_token"]


def get_review_counts(token, account_id, location_id):
    """Return (total_reviews, five_star_reviews) for the location."""
    base = (
        "https://mybusiness.googleapis.com/v4/accounts/"
        f"{account_id}/locations/{location_id}/reviews"
    )
    total = None
    five_star = 0
    page_token = None
    while True:
        url = f"{base}?pageSize=50"
        if page_token:
            url += "&pageToken=" + urllib.parse.quote(page_token)
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
        with urllib.request.urlopen(req) as resp:
            body = json.load(resp)
        if total is None and "totalReviewCount" in body:
            total = int(body["totalReviewCount"])
        for review in body.get("reviews", []):
            if review.get("starRating") == "FIVE":
                five_star += 1
        page_token = body.get("nextPageToken")
        if not page_token:
            break
    if total is None:
        total = five_star
    return total, five_star


def update_files(total, five_star):
    text_pattern = re.compile(r"\d+( five-star reviews on )")
    json_pattern = re.compile(r'("reviewCount": )\d+')
    changed = []
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix not in {".html", ".js"}:
            continue
        if SKIP_DIRS & set(path.relative_to(ROOT).parts):
            continue
        original = path.read_text(encoding="utf-8")
        updated = text_pattern.sub(rf"{five_star}\1", original)
        updated = json_pattern.sub(rf"\g<1>{total}", updated)
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            changed.append(str(path.relative_to(ROOT)))
    return changed


def main():
    missing = [name for name in REQUIRED if not os.environ.get(name)]
    if missing:
        print("Google secrets not set, skipping review update: " + ", ".join(missing))
        return 0

    token = get_access_token(
        os.environ["GOOGLE_CLIENT_ID"],
        os.environ["GOOGLE_CLIENT_SECRET"],
        os.environ["GOOGLE_REFRESH_TOKEN"],
    )
    total, five_star = get_review_counts(
        token, os.environ["GOOGLE_ACCOUNT_ID"], os.environ["GOOGLE_LOCATION_ID"]
    )
    print(f"Google reviews: {total} total, {five_star} five-star")

    if five_star == 0:
        print("No five-star reviews returned. Leaving the site unchanged.")
        return 1

    changed = update_files(total, five_star)
    if changed:
        print("Updated: " + ", ".join(changed))
    else:
        print("Counts already up to date.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
