#!/usr/bin/env python3
"""Build the public YouTube RSS/oEmbed inventory requested for Robweb."""

from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import UTC, datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "content" / "videos.json"
EVIDENCE = Path("/home/ianc/brains/codex/work/robweb-08dff276-content-inventory/evidence")
CHANNEL_ID = "UCrgxh4FbbI4j0prD_KkIqfA"  # Extracted from public robc.co.uk/youtube/ markup.
RSS_URL = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"
USER_AGENT = "Mozilla/5.0 (compatible; RobwebContentInventory/1.0; +https://robc.co.uk/)"


def get(url: str) -> bytes:
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": USER_AGENT}), timeout=30).read()


def topic(title: str) -> str:
    value = title.lower()
    rules = [
        ("roofing", ("roof", "loft", "tile", "cladding")),
        ("carpentry", ("door", "architrave", "skirting", "plywood", "shelf", "joinery", "latch")),
        ("tools", ("tool", "mudmixer", "mud-mixer", "mixer")),
        ("building", ("concrete", "sealant", "deck", "refurb", "installation", "hot water")),
    ]
    for label, words in rules:
        if any(word in value for word in words):
            return label
    return "site-life"


def main() -> int:
    rss = get(RSS_URL)
    root = ET.fromstring(rss)
    atom = "http://www.w3.org/2005/Atom"
    yt = "http://www.youtube.com/xml/schemas/2015"
    media = "http://search.yahoo.com/mrss/"
    records = []
    oembed_failures = []
    for entry in root.findall(f"{{{atom}}}entry"):
        video_id = entry.findtext(f"{{{yt}}}videoId") or ""
        published = entry.findtext(f"{{{atom}}}published") or ""
        link = next((candidate.attrib.get("href", "") for candidate in entry.findall(f"{{{atom}}}link") if candidate.attrib.get("rel") == "alternate"), f"https://www.youtube.com/watch?v={video_id}")
        thumbnail = ""
        thumbnail_element = entry.find(f"{{{media}}}group/{{{media}}}thumbnail")
        if thumbnail_element is not None:
            thumbnail = thumbnail_element.attrib.get("url", "")
        oembed_url = "https://www.youtube.com/oembed?" + urllib.parse.urlencode({"url": link, "format": "json"})
        rss_title = entry.findtext(f"{{{atom}}}title") or ""
        try:
            title = json.loads(get(oembed_url).decode("utf-8"))["title"]
        except Exception as error:  # Keep the RSS title if the public oEmbed endpoint has a transient failure.
            title = rss_title
            oembed_failures.append({"id": video_id, "error": str(error)})
        records.append({
            "id": video_id,
            "title": title,
            "published": published,
            "thumbnailUrl": thumbnail,
            "url": link,
            "suggestedTopicTag": topic(title),
        })
        time.sleep(0.5)
    fetched_at = datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps({"channelId": CHANNEL_ID, "channelUrl": f"https://www.youtube.com/channel/{CHANNEL_ID}", "rssUrl": RSS_URL, "fetchedAt": fetched_at, "titlesSource": "YouTube oEmbed (falling back to RSS only if noted)", "videos": records}, indent=2) + "\n", encoding="utf-8")
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    (EVIDENCE / "youtube-summary.json").write_text(json.dumps({"fetchedAt": fetched_at, "channelId": CHANNEL_ID, "rssEntries": len(records), "oembedFailures": oembed_failures}, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"channelId": CHANNEL_ID, "rssEntries": len(records), "oembedFailures": len(oembed_failures)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
