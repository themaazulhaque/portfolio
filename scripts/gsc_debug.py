#!/usr/bin/env python3
"""Check why Search Console has no data"""
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

# Full sitemap details
print("SITEMAP DETAILS:")
sitemaps = webmasters.sitemaps().list(siteUrl=property_url).execute()
for sm in sitemaps.get("sitemap", []):
    for k, v in sm.items():
        print(f"  {k}: {v}")

# Try the very last 3 days
print("\nSEARCH ANALYTICS - last 3 days:")
try:
    result = webmasters.searchanalytics().query(
        siteUrl=property_url,
        body={"startDate": "2026-09-07", "endDate": "2026-09-10"}
    ).execute()
    rows = result.get("rows", [])
    print(f"  rows: {len(rows)}")
    if rows:
        for r in rows:
            print(f"  clicks={r.get('clicks',0)} impr={r.get('impressions',0)}")
except Exception as e:
    print(f"  Error: {e}")

# Try with dataState=final
print("\nSEARCH ANALYTICS - with dataState=final, last 28 days:")
try:
    result = webmasters.searchanalytics().query(
        siteUrl=property_url,
        body={
            "startDate": "2026-08-11",
            "endDate": "2026-09-10",
            "dataState": "final"
        }
    ).execute()
    rows = result.get("rows", [])
    print(f"  rows: {len(rows)}")
    if rows:
        for r in rows:
            print(f"  clicks={r.get('clicks',0)} impr={r.get('impressions',0)}")
except Exception as e:
    print(f"  Error: {e}")

# Check if the property type is correct
print("\nALL PROPERTIES:")
sites = webmasters.sites().list().execute()
for s in sites.get("siteEntry", []):
    print(f"  {s['siteUrl']} - permission: {s.get('permissionLevel','?')}")

# Check if there's a URL prefix version too
print("\nTrying URL prefix property:")
try:
    result = webmasters.searchanalytics().query(
        siteUrl="https://maazulhaque.qd.je/",
        body={"startDate": "2026-08-11", "endDate": "2026-09-10"}
    ).execute()
    rows = result.get("rows", [])
    print(f"  rows: {len(rows)}")
except Exception as e:
    print(f"  Error: {e}")
