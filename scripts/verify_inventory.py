#!/usr/bin/env python3
"""Offline integrity checks for the committed Robweb source inventory."""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = Path("/home/ianc/brains/codex/work/robweb-08dff276-content-inventory/evidence")
EXPECTED_PAGES = {
    "home", "projects", "about-robin-clevett-listed-and-new-build", "our-services",
    "contact-robin-clevett", "disclaimer", "terms-and-conditions", "youtube",
    "instagram", "robin-recommends", "shop", "cart", "checkout", "my-account",
    "privacy-policy-2", "terms-conditions", "register-your-interest", "calculator-app",
    "calculator-app-privacy", "calculator-app-terms", "landing-cladding-php",
}
EMAIL = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.I)


def main() -> int:
    failures: list[str] = []
    pages = {path.stem for path in (ROOT / "content/pages").glob("*.md")}
    if pages != EXPECTED_PAGES:
        failures.append(f"page set differs: missing={sorted(EXPECTED_PAGES - pages)} extra={sorted(pages - EXPECTED_PAGES)}")
    for page in (ROOT / "content/pages").glob("*.md"):
        text = page.read_text(encoding="utf-8")
        if not text.startswith("# ") or "Original URL:" not in text:
            failures.append(f"page metadata incomplete: {page.relative_to(ROOT)}")
        if EMAIL.search(text):
            failures.append(f"unredacted email found: {page.relative_to(ROOT)}")

    assets = json.loads((ROOT / "content/assets.json").read_text(encoding="utf-8"))
    if assets["downloadedBytes"] > assets["downloadCapBytes"]:
        failures.append("asset download cap exceeded")
    required_asset_keys = {"id", "localPath", "originalUrl", "page", "width", "height", "bytes", "rights", "notes"}
    for asset in assets["assets"]:
        missing = required_asset_keys - set(asset)
        if missing:
            failures.append(f"asset {asset.get('id')} missing {sorted(missing)}")
        if asset["rights"] == "robin-own-site":
            if not asset["localPath"] or not (ROOT / asset["localPath"]).is_file():
                failures.append(f"missing local Robin asset {asset['id']}")
            elif asset["bytes"] != (ROOT / asset["localPath"]).stat().st_size:
                failures.append(f"byte count mismatch for {asset['id']}")
            if asset["width"] is None or asset["height"] is None:
                failures.append(f"missing dimensions for {asset['id']}")

    videos = json.loads((ROOT / "content/videos.json").read_text(encoding="utf-8"))
    video_keys = {"id", "title", "published", "thumbnailUrl", "url", "suggestedTopicTag"}
    if not videos["videos"]:
        failures.append("no YouTube RSS videos recorded")
    for video in videos["videos"]:
        missing = video_keys - set(video)
        if missing:
            failures.append(f"video {video.get('id')} missing {sorted(missing)}")

    for name, key in (("shop-products.json", "products"), ("shop-collections.json", "collections")):
        shop = json.loads((ROOT / "content" / name).read_text(encoding="utf-8"))
        if key not in shop or not isinstance(shop[key], list):
            failures.append(f"{name} lacks a {key} list")

    result = {
        "ok": not failures,
        "pageCount": len(pages),
        "assetCount": len(assets["assets"]),
        "downloadedAssetCount": sum(asset["localPath"] is not None for asset in assets["assets"]),
        "downloadedBytes": assets["downloadedBytes"],
        "videoCount": len(videos["videos"]),
        "failures": failures,
    }
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    (EVIDENCE / "validation.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result))
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
