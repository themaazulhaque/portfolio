#!/usr/bin/env python3
"""Run a local, secret-free Google Search Console audit."""

import argparse
import html.parser
import json
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import date, timedelta
from pathlib import Path
from urllib.parse import urljoin

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/webmasters"]
ROOT = Path(__file__).resolve().parent.parent
TOKEN_PATH = ROOT / "scripts" / "gsc_token.json"
REPORT_PATH = ROOT / "SEO_SEARCH_CONSOLE_REPORT.md"
SITE_URL = "https://maazulhaque.qd.je"
DOMAIN_PROPERTY = "sc-domain:maazulhaque.qd.je"
SITEMAP_URL = f"{SITE_URL}/sitemap.xml"


def find_credentials(explicit_path=None):
    candidates = [Path(explicit_path)] if explicit_path else []
    candidates += sorted(Path.home().joinpath("Downloads").glob("*.json"))
    candidates += [ROOT / "scripts" / "oauth_credentials.json"]
    for path in candidates:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if "installed" in data and "web" not in data:
            return path
    raise FileNotFoundError("No Desktop/Installed OAuth client JSON was found.")


def get_credentials(credentials_path, force_reauth=False):
    if force_reauth and TOKEN_PATH.exists():
        TOKEN_PATH.unlink()
    credentials = None
    if TOKEN_PATH.exists():
        credentials = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
    if not credentials or not credentials.valid:
        if credentials and credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(credentials_path), SCOPES)
            credentials = flow.run_local_server(port=0, access_type="offline", prompt="consent")
        TOKEN_PATH.write_text(credentials.to_json(), encoding="utf-8")
    return credentials


class SEOParser(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self.in_title = False
        self.meta = {}
        self.links = {}
        self.json_ld = []
        self._json_ld = None

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "title":
            self.in_title = True
        if tag == "meta":
            key = values.get("name") or values.get("property")
            if key and values.get("content") is not None:
                self.meta[key.lower()] = values["content"]
        if tag == "link" and values.get("rel") and values.get("href"):
            self.links[values["rel"].lower()] = values["href"]
        if tag == "script" and values.get("type") == "application/ld+json":
            self._json_ld = []

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        if self._json_ld is not None:
            self._json_ld.append(data)

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag == "script" and self._json_ld is not None:
            try:
                self.json_ld.append(json.loads("".join(self._json_ld)))
            except json.JSONDecodeError:
                pass
            self._json_ld = None


def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": "portfolio-gsc-audit/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return {"status": response.status, "content_type": response.headers.get_content_type(), "url": response.geturl(), "body": response.read()}
    except urllib.error.HTTPError as error:
        return {"status": error.code, "content_type": error.headers.get_content_type(), "url": error.geturl(), "body": error.read()}
    except Exception as error:
        return {"status": None, "content_type": None, "url": url, "body": b"", "error": f"{type(error).__name__}: {error}"}


def validate_sitemap():
    result = fetch(SITEMAP_URL)
    urls = []
    errors = []
    if result["status"] != 200:
        errors.append(f"HTTP status {result['status']}")
    try:
        root = ET.fromstring(result["body"])
        if not root.tag.endswith("urlset"):
            errors.append("root element is not urlset")
        urls = [node.text.strip() for node in root.iter() if node.tag.endswith("loc") and node.text]
        if not urls:
            errors.append("contains no URL entries")
        for url in urls:
            if not url.startswith(SITE_URL + "/") and url != SITE_URL:
                errors.append(f"unexpected URL: {url}")
    except ET.ParseError as error:
        errors.append(f"invalid XML: {error}")
    return result, urls, errors


def inspect_seo(urls):
    checks = []
    for url in urls:
        result = fetch(url)
        parser = SEOParser()
        if result["body"]:
            parser.feed(result["body"].decode("utf-8", errors="replace"))
        types = {item.get("@type") for item in parser.json_ld if isinstance(item, dict)}
        checks.append({
            "url": url,
            "status": result["status"],
            "content_type": result["content_type"],
            "title": parser.title.strip(),
            "description": bool(parser.meta.get("description")),
            "canonical": parser.links.get("canonical"),
            "robots": parser.meta.get("robots", "default index/follow"),
            "og": bool(parser.meta.get("og:title")),
            "twitter": bool(parser.meta.get("twitter:card")),
            "json_ld": sorted(str(value) for value in types if value),
            "error": result.get("error"),
        })
    return checks


def query_analytics(service, property_url):
    end = date.today() - timedelta(days=2)
    start = end - timedelta(days=28)
    payload = {"startDate": start.isoformat(), "endDate": end.isoformat(), "dimensions": ["query"], "rowLimit": 25}
    result = service.searchanalytics().query(siteUrl=property_url, body=payload).execute()
    return {"range": f"{start} to {end}", "rows": result.get("rows", [])}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--credentials", help="Path to Desktop/Installed client JSON")
    parser.add_argument("--reauth", action="store_true", help="Discard the local OAuth token and authorize again")
    parser.add_argument("--no-submit", action="store_true", help="Validate but do not submit the sitemap")
    args = parser.parse_args()
    credentials_path = find_credentials(args.credentials)
    credentials = get_credentials(credentials_path, args.reauth)
    webmasters = build("webmasters", "v3", credentials=credentials)
    inspection_api = build("searchconsole", "v1", credentials=credentials)
    sites = webmasters.sites().list().execute().get("siteEntry", [])
    site_map = {entry["siteUrl"]: entry.get("permissionLevel", "unknown") for entry in sites}
    property_url = next((value for value in (DOMAIN_PROPERTY, SITE_URL, SITE_URL + "/") if value in site_map), None)
    sitemap_result, sitemap_urls, sitemap_errors = validate_sitemap()
    public_urls = [SITE_URL, f"{SITE_URL}/work/"] + [url for url in sitemap_urls if url not in (SITE_URL,)]
    seo = inspect_seo(dict.fromkeys(public_urls))
    submission = "Skipped: property unavailable or sitemap invalid"
    sitemap_status = []
    if property_url and not sitemap_errors:
        if not args.no_submit:
            webmasters.sitemaps().submit(siteUrl=property_url, feedpath=SITEMAP_URL).execute()
            submission = "Submitted once through Search Console API"
        sitemap_status = webmasters.sitemaps().list(siteUrl=property_url).execute().get("sitemap", [])
    inspections = []
    if property_url:
        for url in dict.fromkeys(public_urls):
            try:
                body = inspection_api.urlInspection().index().inspect(body={"inspectionUrl": url, "siteUrl": property_url}).execute()
                status = body.get("inspectionResult", {}).get("indexStatusResult", {})
                inspections.append({"url": url, "verdict": status.get("verdict"), "coverage": status.get("coverageState"), "indexing": status.get("indexingState"), "robots": status.get("robotsTxtState"), "fetch": status.get("pageFetchState")})
            except Exception as error:
                inspections.append({"url": url, "error": f"{type(error).__name__}: {error}"})
    analytics = {"range": "unavailable", "rows": []}
    if property_url:
        try:
            analytics = query_analytics(webmasters, property_url)
        except Exception as error:
            analytics["error"] = f"{type(error).__name__}: {error}"
    report = {
        "credentials": "Desktop/Installed OAuth client",
        "scope": SCOPES[0],
        "property": property_url or "Not found",
        "access": site_map.get(property_url, "No access listed") if property_url else "No access listed",
        "routes": {path: {key: value for key, value in fetch(url).items() if key != "body"} for path, url in {"/": SITE_URL, "/robots.txt": f"{SITE_URL}/robots.txt", "/sitemap.xml": SITEMAP_URL, "/manifest.json": f"{SITE_URL}/manifest.json"}.items()},
        "sitemap_urls": sitemap_urls,
        "sitemap_errors": sitemap_errors,
        "submission": submission,
        "sitemap_status": sitemap_status,
        "seo": seo,
        "inspections": inspections,
        "analytics": analytics,
    }
    lines = ["# Google Search Console Report", "", f"- Checked: {date.today().isoformat()}", "- Authentication: successful", f"- OAuth client: {report['credentials']}", f"- Scope: `{report['scope']}`", f"- Property: `{report['property']}` ({report['access']})", "- API: successful", "", "## Website", ""]
    for path, result in report["routes"].items():
        lines.append(f"- `{path}`: HTTP {result.get('status')}, {result.get('content_type')}, final URL `{result.get('url')}`")
    lines += ["", "## Sitemap", "", f"- URLs: {len(sitemap_urls)}", f"- Validation: {'valid' if not sitemap_errors else '; '.join(sitemap_errors)}", f"- Submission: {submission}", "", "## URL Inspection", ""]
    lines += [f"- `{item['url']}`: {item.get('verdict', item.get('error', 'unavailable'))}" for item in inspections] or ["- Not run: property unavailable"]
    lines += ["", "## Search Analytics", "", f"- Date range: {analytics.get('range')}", f"- Rows returned: {len(analytics.get('rows', []))}"]
    if analytics.get("error"):
        lines.append(f"- Query: {analytics['error']}")
    lines += ["", "## SEO Checks", ""]
    for item in seo:
        lines.append(f"- `{item['url']}`: HTTP {item['status']}; title={'yes' if item['title'] else 'no'}; description={'yes' if item['description'] else 'no'}; canonical={item['canonical'] or 'missing'}; JSON-LD={','.join(item['json_ld']) or 'none'}")
    lines += ["", "## Next Steps", "", "- Add the authenticated Google account as a Search Console user or verify the property if it is not listed.", "- Re-run this script after Search Console has collected data; no indexing requests are submitted by this tool."]
    REPORT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Authenticated successfully; report written to {REPORT_PATH}")
    print(f"Property: {report['property']} | sitemap: {submission} | analytics rows: {len(analytics.get('rows', []))}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"ERROR: {type(error).__name__}: {error}", file=sys.stderr)
        sys.exit(1)
