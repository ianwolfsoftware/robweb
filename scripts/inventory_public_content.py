#!/usr/bin/env python3
"""Create a low-rate, robots-aware inventory of Rob Clevett's public pages.

This deliberately stores no raw HTML.  It redacts contact identifiers from the
derived markdown and collects only image metadata plus Robin-owned media files.
"""

from __future__ import annotations

import hashlib
import html
import json
import re
import shutil
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from datetime import UTC, datetime
from html.parser import HTMLParser
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content"
PAGES = CONTENT / "pages"
SOURCE = ROOT / "assets" / "source"
EVIDENCE = Path("/home/ianc/brains/codex/work/robweb-08dff276-content-inventory/evidence")
SITE = "https://robc.co.uk"
SITEMAP = f"{SITE}/wp-sitemap-posts-page-1.xml"
ROBOTS = f"{SITE}/robots.txt"
USER_AGENT = "Mozilla/5.0 (compatible; RobwebContentInventory/1.0; +https://robc.co.uk/)"
PAUSE_SECONDS = 0.75
MAX_DOWNLOAD_BYTES = 150 * 1024 * 1024
EMAIL = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.I)
PHONE = re.compile(r"(?<!\w)(?:\+?\d[\d .()\-]{7,}\d)(?!\w)")


def redact(value: str) -> str:
    value = EMAIL.sub("[email address redacted]", value)
    return PHONE.sub("[phone number redacted]", value)


def collapse(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def request(url: str, *, binary: bool = False) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"})
    with urllib.request.urlopen(req, timeout=30) as response:
        return response.read()


def absolute(value: str, page_url: str) -> str:
    return urllib.parse.urljoin(page_url, html.unescape(value.strip()))


def canonical_upload_url(url: str) -> str:
    """Turn Jetpack's public proxy URLs back into Rob's source URL when safe."""
    parsed = urllib.parse.urlparse(url)
    if "wp.com" in parsed.netloc and "robc.co.uk/wp-content/uploads/" in url:
        match = re.search(r"(https?://robc\.co\.uk/wp-content/uploads/[^?&#]+)", url)
        if match:
            return match.group(1)
    return url


def is_robin_owned_image(url: str) -> bool:
    parsed = urllib.parse.urlparse(canonical_upload_url(url))
    return parsed.netloc == "robc.co.uk" and (
        parsed.path.startswith("/wp-content/uploads/") or parsed.path.startswith("/landing/")
    )


@dataclass
class ExtractedPage:
    url: str
    title: str = ""
    description: str = ""
    canonical: str = ""
    body: list[tuple[str, str]] = field(default_factory=list)
    links: list[tuple[str, str]] = field(default_factory=list)
    images: list[tuple[str, str]] = field(default_factory=list)


class PageParser(HTMLParser):
    """A deliberately small extractor that limits copy to <main> / <article>."""

    def __init__(self, url: str):
        super().__init__(convert_charrefs=True)
        self.page = ExtractedPage(url=url)
        self.in_title = False
        self.main_depth = 0
        self.article_depth = 0
        self.depth = 0
        self.ignore_depth = 0
        self.text_tag: str | None = None
        self.text_parts: list[str] = []
        self.current_link: str | None = None
        self.link_parts: list[str] = []

    @property
    def in_content(self) -> bool:
        return self.main_depth > 0 or self.article_depth > 0

    def handle_starttag(self, tag: str, attrs_list: list[tuple[str, str | None]]):
        attrs = {key.lower(): value or "" for key, value in attrs_list}
        self.depth += 1
        if tag in {"script", "style", "noscript", "svg", "template"}:
            self.ignore_depth += 1
        if tag == "title":
            self.in_title = True
            self.text_parts = []
        if tag == "meta" and attrs.get("name", "").lower() == "description":
            self.page.description = collapse(attrs.get("content", ""))
        if tag == "link" and attrs.get("rel", "").lower() == "canonical":
            self.page.canonical = absolute(attrs.get("href", ""), self.page.url)
        if tag == "main":
            self.main_depth = self.depth
        if tag == "article" and not self.main_depth:
            self.article_depth = self.depth
        if tag == "img":
            source = attrs.get("data-lazy-src") or attrs.get("data-src") or attrs.get("src")
            if source:
                self.page.images.append((canonical_upload_url(absolute(source, self.page.url)), collapse(attrs.get("alt", ""))))
        if self.in_content and tag in {"h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "blockquote"}:
            self.text_tag = tag
            self.text_parts = []
        if self.in_content and tag == "a" and attrs.get("href"):
            self.current_link = absolute(attrs["href"], self.page.url)
            self.link_parts = []
        if self.in_content:
            style = attrs.get("style", "")
            for url in re.findall(r"url\(\s*['\"]?([^'\")]+)", style, flags=re.I):
                self.page.images.append((canonical_upload_url(absolute(url, self.page.url)), ""))

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]):
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_data(self, data: str):
        if self.in_title or (self.in_content and self.text_tag):
            self.text_parts.append(data)
        if self.in_content and self.current_link:
            self.link_parts.append(data)

    def handle_endtag(self, tag: str):
        if tag == "title" and self.in_title:
            self.page.title = collapse("".join(self.text_parts))
            self.in_title = False
            self.text_parts = []
        if self.in_content and self.text_tag == tag:
            text = collapse("".join(self.text_parts))
            if text:
                self.page.body.append((tag, redact(text)))
            self.text_tag = None
            self.text_parts = []
        if self.in_content and tag == "a" and self.current_link:
            label = redact(collapse("".join(self.link_parts)))
            href = self.current_link
            if href.startswith(("mailto:", "tel:")):
                href = "[contact link redacted]"
            self.page.links.append((label, href))
            self.current_link = None
            self.link_parts = []
        if tag == "main" and self.main_depth == self.depth:
            self.main_depth = 0
        if tag == "article" and self.article_depth == self.depth:
            self.article_depth = 0
        if tag in {"script", "style", "noscript", "svg", "template"} and self.ignore_depth:
            self.ignore_depth -= 1
        self.depth -= 1


def page_slug(url: str) -> str:
    path = urllib.parse.urlparse(url).path.strip("/")
    if not path:
        return "home"
    return re.sub(r"[^a-z0-9]+", "-", path.lower()).strip("-")


def allowed_by_robots(url: str) -> tuple[bool, str]:
    """The site's explicit patterns block its privacy and disclaimer pages."""
    path = urllib.parse.urlparse(url).path
    if path.startswith("/privacy-policy"):
        return False, "robots.txt: Disallow: /privacy-policy"
    if "/disclaimer/" in path:
        return False, "robots.txt: Disallow: */disclaimer/*"
    return True, ""


def write_markdown(page: ExtractedPage, lastmod: str, blocked_reason: str | None = None) -> None:
    slug = page_slug(page.url)
    lines = [f"# {page.title or slug.replace('-', ' ').title()}", "", f"- Original URL: {page.url}", f"- Canonical: {page.canonical or page.url}", f"- Last modified (sitemap): {lastmod or 'not listed'}", f"- Meta description: {redact(page.description) or 'not present'}", ""]
    if blocked_reason:
        lines.extend(["## Retrieval note", "", f"Content was not fetched because {blocked_reason}. The old URL is retained in the redirect and page-decision inventory.", ""])
    else:
        lines.extend(["## Extracted copy", ""])
        for tag, text in page.body:
            if tag.startswith("h"):
                lines.extend(["#" * min(int(tag[1]), 6) + " " + text, ""])
            elif tag == "li":
                lines.append(f"- {text}")
            elif tag == "blockquote":
                lines.extend([f"> {text}", ""])
            else:
                lines.extend([text, ""])
        lines.extend(["## Links", ""])
        if page.links:
            for label, href in dict.fromkeys(page.links):
                lines.append(f"- [{label or href}]({href})")
        else:
            lines.append("- None extracted from main content.")
        lines.extend(["", "## Image references", ""])
        if page.images:
            for image_url, alt in dict.fromkeys(page.images):
                lines.append(f"- ![{redact(alt)}]({image_url})")
        else:
            lines.append("- None extracted from main content.")
        lines.append("")
    (PAGES / f"{slug}.md").write_text("\n".join(lines), encoding="utf-8")


def dimensions(path: Path) -> tuple[int | None, int | None]:
    try:
        with Image.open(path) as image:
            return image.width, image.height
    except Exception:
        return None, None


def local_destination(url: str) -> Path:
    path = urllib.parse.urlparse(canonical_upload_url(url)).path
    marker = "/wp-content/uploads/"
    if marker in path:
        remainder = path.split(marker, 1)[1]
    else:
        remainder = path.lstrip("/")
    return SOURCE / remainder


def download_asset(url: str, used_bytes: int) -> tuple[Path | None, int, str | None]:
    destination = local_destination(url)
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        size = destination.stat().st_size
        return destination, used_bytes + size, None
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "image/avif,image/webp,image/*,*/*;q=0.8"})
        with urllib.request.urlopen(req, timeout=30) as response:
            stated = int(response.headers.get("Content-Length", "0") or 0)
            if stated and used_bytes + stated > MAX_DOWNLOAD_BYTES:
                return None, used_bytes, "150 MiB download cap reached"
            with destination.open("wb") as handle:
                shutil.copyfileobj(response, handle)
        size = destination.stat().st_size
        if used_bytes + size > MAX_DOWNLOAD_BYTES:
            destination.unlink(missing_ok=True)
            return None, used_bytes, "150 MiB download cap reached"
        return destination, used_bytes + size, None
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as error:
        destination.unlink(missing_ok=True)
        return None, used_bytes, f"download failed: {error}"


def main() -> int:
    PAGES.mkdir(parents=True, exist_ok=True)
    SOURCE.mkdir(parents=True, exist_ok=True)
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    run_at = datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    robots = request(ROBOTS).decode("utf-8", errors="replace")
    sitemap_xml = request(SITEMAP).decode("utf-8", errors="replace")
    root = ET.fromstring(sitemap_xml)
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    sitemap_pages = [(entry.findtext("s:loc", namespaces=ns), entry.findtext("s:lastmod", namespaces=ns) or "") for entry in root.findall("s:url", ns)]
    extras = [(f"{SITE}/landing/cladding.php", "not in sitemap; checked at task request")]
    pages = sitemap_pages + extras
    all_images: dict[str, dict] = {}
    results: list[dict] = []
    for index, (url, lastmod) in enumerate(pages, start=1):
        allowed, reason = allowed_by_robots(url)
        page = ExtractedPage(url=url)
        if not allowed:
            write_markdown(page, lastmod, reason)
            results.append({"url": url, "lastModified": lastmod, "status": "not fetched", "reason": reason})
            continue
        try:
            raw = request(url).decode("utf-8", errors="replace")
            parser = PageParser(url)
            parser.feed(raw)
            page = parser.page
            write_markdown(page, lastmod)
            results.append({"url": url, "lastModified": lastmod, "status": "fetched", "title": page.title, "images": len(page.images)})
            for image_url, alt in page.images:
                record = all_images.setdefault(image_url, {"alt": alt, "pages": []})
                if alt and not record["alt"]:
                    record["alt"] = alt
                if url not in record["pages"]:
                    record["pages"].append(url)
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as error:
            write_markdown(page, lastmod, f"the public request failed ({error})")
            results.append({"url": url, "lastModified": lastmod, "status": "failed", "reason": str(error)})
        if index < len(pages):
            time.sleep(PAUSE_SECONDS)

    assets: list[dict] = []
    used_bytes = 0
    for number, (url, source) in enumerate(sorted(all_images.items()), start=1):
        local_path: Path | None = None
        note = "External image reference; not downloaded until rights are confirmed."
        error = None
        if is_robin_owned_image(url):
            local_path, used_bytes, error = download_asset(url, used_bytes)
            time.sleep(PAUSE_SECONDS)
            note = error or "Downloaded from Robin's public WordPress uploads."
        width, height = dimensions(local_path) if local_path else (None, None)
        assets.append({
            "id": f"robc-{number:03d}",
            "localPath": str(local_path.relative_to(ROOT)) if local_path else None,
            "originalUrl": url,
            "page": source["pages"][0],
            "usedOn": source["pages"],
            "alt": redact(source["alt"]),
            "width": width,
            "height": height,
            "bytes": local_path.stat().st_size if local_path else None,
            "rights": "robin-own-site" if is_robin_owned_image(url) else "needs-approval",
            "notes": note,
        })
    CONTENT.mkdir(exist_ok=True)
    (CONTENT / "assets.json").write_text(json.dumps({"source": SITE, "fetchedAt": run_at, "downloadCapBytes": MAX_DOWNLOAD_BYTES, "downloadedBytes": used_bytes, "assets": assets}, indent=2) + "\n", encoding="utf-8")
    summary = {
        "fetchedAt": run_at,
        "robotsUrl": ROBOTS,
        "sitemapUrl": SITEMAP,
        "pageResults": results,
        "assetsFound": len(assets),
        "assetsDownloaded": sum(asset["localPath"] is not None for asset in assets),
        "downloadedBytes": used_bytes,
    }
    (EVIDENCE / "crawl-summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"pages": len(pages), "fetched": sum(result["status"] == "fetched" for result in results), "blocked": sum(result["status"] == "not fetched" for result in results), "assets": len(assets), "downloaded": sum(asset["localPath"] is not None for asset in assets), "bytes": used_bytes}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
