#!/usr/bin/env python3
"""Phase 4 monitoring: check for errors, manual actions, coverage"""
import warnings; warnings.filterwarnings("ignore")
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from pathlib import Path

TOKEN = Path(__file__).parent / "gsc_token.json"
creds = Credentials.from_authorized_user_file(str(TOKEN), [
    "https://www.googleapis.com/auth/webmasters.readonly",
    "https://www.googleapis.com/auth/webmasters",
])
if creds.expired and creds.refresh_token:
    creds.refresh(Request())
    with open(TOKEN, "w") as f:
        f.write(creds.to_json())

webmasters = build("webmasters", "v3", credentials=creds)
property_url = "sc-domain:maazulhaque.qd.je"

# Check search analytics with every possible dimension
print("SEARCH ANALYTICS — by query (last 28 days):")
try:
    result = webmasters.searchanalytics().query(
        siteUrl=property_url,
        body={"startDate": "2026-08-13", "endDate": "2026-09-10", "dimensions": ["query"], "rowLimit": 25}
    ).execute()
    rows = result.get("rows", [])
    print(f"  Queries found: {len(rows)}")
    for r in rows:
        print(f"    {r['keys'][0]}: clicks={r.get('clicks',0)} impr={r.get('impressions',0)} ctr={r.get('ctr',0)*100:.1f}% pos={r.get('position',0):.1f}")
except Exception as e:
    print(f"  Error: {e}")

print("\nSEARCH ANALYTICS — by page (last 28 days):")
try:
    result = webmasters.searchanalytics().query(
        siteUrl=property_url,
        body={"startDate": "2026-08-13", "endDate": "2026-09-10", "dimensions": ["page"], "rowLimit": 25}
    ).execute()
    rows = result.get("rows", [])
    print(f"  Pages found: {len(rows)}")
    for r in rows:
        print(f"    {r['keys'][0]}: clicks={r.get('clicks',0)} impr={r.get('impressions',0)}")
except Exception as e:
    print(f"  Error: {e}")

# Try dataState=final for most accurate data
print("\nSEARCH ANALYTICS — dataState=final (last 28 days):")
try:
    result = webmasters.searchanalytics().query(
        siteUrl=property_url,
        body={"startDate": "2026-08-13", "endDate": "2026-09-10", "dataState": "final"}
    ).execute()
    rows = result.get("rows", [])
    if rows:
        r = rows[0]
        print(f"  Clicks: {r.get('clicks', 0)}")
        print(f"  Impressions: {r.get('impressions', 0)}")
        print(f"  CTR: {r.get('ctr', 0)*100:.2f}%")
        print(f"  Position: {r.get('position', 0):.1f}")
    else:
        print("  NO DATA")
except Exception as e:
    print(f"  Error: {e}")

# Check sitemap status
print("\nSITEMAP STATUS:")
try:
    sitemaps = webmasters.sitemaps().list(siteUrl=property_url).execute()
    for sm in sitemaps.get("sitemap", []):
        print(f"  URL: {sm.get('path','?')}")
        print(f"  isPending: {sm.get('isPending')}")
        print(f"  lastSubmitted: {sm.get('lastSubmitted','never')}")
        print(f"  lastDownloaded: {sm.get('lastDownloaded','never')}")
        print(f"  errors: {sm.get('errors', [])}")
        print(f"  warnings: {sm.get('warnings', [])}")
        contents = sm.get("contents", [])
        for c in contents:
            print(f"  submitted: {c.get('submitted', '?')}, indexed: {c.get('indexed', '?')}")
except Exception as e:
    print(f"  Error: {e}")

# Try to get any available error/coverage data
print("\nCHECKING FOR AVAILABILITY OF ADDITIONAL APIS:")
try:
    # Try searchAnalytics with searchAppearance dimension
    result = webmasters.searchanalytics().query(
        siteUrl=property_url,
        body={"startDate": "2026-08-13", "endDate": "2026-09-10", "dimensions": ["searchAppearance"], "rowLimit": 10}
    ).execute()
    rows = result.get("rows", [])
    print(f"  searchAppearance data: {len(rows)} rows")
except Exception as e:
    print(f"  searchAppearance: {type(e).__name__}: {e}")

try:
    # Try with device dimension
    result = webmasters.searchanalytics().query(
        siteUrl=property_url,
        body={"startDate": "2026-08-13", "endDate": "2026-09-10", "dimensions": ["device"]}
    ).execute()
    rows = result.get("rows", [])
    print(f"  device data: {len(rows)} rows")
    for r in rows:
        print(f"    {r['keys'][0]}: clicks={r.get('clicks',0)} impr={r.get('impressions',0)}")
except Exception as e:
    print(f"  device: {type(e).__name__}: {e}")

try:
    # Try with country dimension
    result = webmasters.searchanalytics().query(
        siteUrl=property_url,
        body={"startDate": "2026-08-13", "endDate": "2026-09-10", "dimensions": ["country"], "rowLimit": 10}
    ).execute()
    rows = result.get("rows", [])
    print(f"  country data: {len(rows)} rows")
    for r in rows:
        print(f"    {r['keys'][0]}: clicks={r.get('clicks',0)} impr={r.get('impressions',0)}")
except Exception as e:
    print(f"  country: {type(e).__name__}: {e}")
