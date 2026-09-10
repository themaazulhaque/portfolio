#!/usr/bin/env python3
"""Deep Search Console analytics check"""
import warnings; warnings.filterwarnings("ignore")
import json
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

# Try multiple date ranges
date_ranges = [
    ("2026-08-11", "2026-09-10"),  # last 30 days
    ("2026-07-12", "2026-09-10"),  # last 60 days
    ("2026-06-10", "2026-09-10"),  # last 90 days
    ("2026-03-01", "2026-09-10"),  # last 6 months
]

for start, end in date_ranges:
    print(f"\n{'='*60}")
    print(f"DATE RANGE: {start} to {end}")
    print(f"{'='*60}")

    # Overall metrics
    try:
        result = webmasters.searchanalytics().query(
            siteUrl=property_url,
            body={"startDate": start, "endDate": end}
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

    # Top queries
    try:
        result = webmasters.searchanalytics().query(
            siteUrl=property_url,
            body={"startDate": start, "endDate": end, "dimensions": ["query"], "rowLimit": 10}
        ).execute()
        rows = result.get("rows", [])
        if rows:
            print(f"\n  Top queries:")
            for r in rows:
                q = r["keys"][0]
                print(f"    {q}: clicks={r.get('clicks',0)} impr={r.get('impressions',0)} ctr={r.get('ctr',0)*100:.1f}% pos={r.get('position',0):.1f}")
    except Exception as e:
        print(f"  Query error: {e}")

    # Top pages
    try:
        result = webmasters.searchanalytics().query(
            siteUrl=property_url,
            body={"startDate": start, "endDate": end, "dimensions": ["page"], "rowLimit": 10}
        ).execute()
        rows = result.get("rows", [])
        if rows:
            print(f"\n  Top pages:")
            for r in rows:
                p = r["keys"][0]
                print(f"    {p}: clicks={r.get('clicks',0)} impr={r.get('impressions',0)} ctr={r.get('ctr',0)*100:.1f}% pos={r.get('position',0):.1f}")
    except Exception as e:
        print(f"  Page error: {e}")

# Check indexing status via searchanalytics with page dimension
print(f"\n{'='*60}")
print(f"INDEXING CHECK - All pages with any data")
print(f"{'='*60}")
try:
    result = webmasters.searchanalytics().query(
        siteUrl=property_url,
        body={
            "startDate": "2026-03-01",
            "endDate": "2026-09-10",
            "dimensions": ["page"],
            "rowLimit": 50,
        }
    ).execute()
    rows = result.get("rows", [])
    if rows:
        for r in rows:
            p = r["keys"][0]
            print(f"  {p}: clicks={r.get('clicks',0)} impr={r.get('impressions',0)}")
    else:
        print("  NO PAGES WITH DATA")
except Exception as e:
    print(f"  Error: {e}")

# Try to submit sitemap
print(f"\n{'='*60}")
print(f"SITEMAP STATUS")
print(f"{'='*60}")
try:
    sitemaps = webmasters.sitemaps().list(siteUrl=property_url).execute()
    for sm in sitemaps.get("sitemap", []):
        print(f"  {sm.get('path','?')}")
        print(f"    isPending: {sm.get('isPending')}")
        print(f"    lastSubmitted: {sm.get('lastSubmitted','never')}")
        print(f"    lastDownloaded: {sm.get('lastDownloaded','never')}")
except Exception as e:
    print(f"  Error: {e}")
