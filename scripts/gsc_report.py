#!/usr/bin/env python3
"""Search Console: discover properties, baseline data, sitemap status"""
import warnings; warnings.filterwarnings("ignore")
import json, sys
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

print("=" * 60)
print("SEARCH CONSOLE PROPERTIES")
print("=" * 60)
sites = webmasters.sites().list().execute()
site_list = sites.get("siteEntry", [])
for s in site_list:
    print(f"  {s['siteUrl']} — {s.get('permissionLevel','?')}")

target = "sc-domain:maazulhaque.qd.je"
found = any(s["siteUrl"] == target for s in site_list)
alt = "https://maazulhaque.qd.je/"
found_alt = any(s["siteUrl"] == alt for s in site_list)

if found:
    property_url = target
elif found_alt:
    property_url = alt
    target = alt
else:
    print(f"\n  Neither {target} nor {alt} found.")
    property_url = None

if property_url:
    print(f"\nUsing property: {property_url}")

    # Sitemap status
    print("\n" + "=" * 60)
    print("SITEMAP STATUS")
    print("=" * 60)
    try:
        sitemaps = webmasters.sitemaps().list(siteUrl=property_url).execute()
        sm_list = sitemaps.get("sitemap", [])
        if sm_list:
            for sm in sm_list:
                print(f"  {sm.get('path','?')}")
                print(f"    isPending: {sm.get('isPending')}")
                print(f"    lastSubmitted: {sm.get('lastSubmitted','never')}")
                print(f"    lastDownloaded: {sm.get('lastDownloaded','never')}")
                print(f"    isSitemapsIndex: {sm.get('isSitemapsIndex')}")
                errors = sm.get('errors', [])
                if errors:
                    for e in errors:
                        print(f"    ERROR: {e}")
        else:
            print("  No sitemaps submitted yet.")
    except Exception as e:
        print(f"  Error: {e}")

    # Search Analytics baseline
    print("\n" + "=" * 60)
    print("SEARCH ANALYTICS BASELINE (last 3 months)")
    print("=" * 60)
    try:
        request_body = {
            "startDate": "2026-06-10",
            "endDate": "2026-09-10",
            "dimensions": ["query"],
            "rowLimit": 25,
        }
        result = webmasters.searchanalytics().query(siteUrl=property_url, body=request_body).execute()
        rows = result.get("rows", [])
        if rows:
            print(f"  Total queries: {len(rows)}")
            print(f"\n  {'Query':<45} {'Clicks':>8} {'Impr':>8} {'CTR':>8} {'Pos':>8}")
            print(f"  {'-'*45} {'-'*8} {'-'*8} {'-'*8} {'-'*8}")
            for r in rows:
                q = r["keys"][0]
                clicks = r.get("clicks", 0)
                impr = r.get("impressions", 0)
                ctr = r.get("ctr", 0) * 100
                pos = r.get("position", 0)
                print(f"  {q:<45} {clicks:>8} {impr:>8} {ctr:>7.1f}% {pos:>8.1f}")
        else:
            print("  NO DATA YET")
    except Exception as e:
        print(f"  Error: {e}")

    # Top pages
    print("\n" + "=" * 60)
    print("TOP PAGES (last 3 months)")
    print("=" * 60)
    try:
        request_body = {
            "startDate": "2026-06-10",
            "endDate": "2026-09-10",
            "dimensions": ["page"],
            "rowLimit": 15,
        }
        result = webmasters.searchanalytics().query(siteUrl=property_url, body=request_body).execute()
        rows = result.get("rows", [])
        if rows:
            for r in rows:
                page = r["keys"][0]
                clicks = r.get("clicks", 0)
                impr = r.get("impressions", 0)
                ctr = r.get("ctr", 0) * 100
                pos = r.get("position", 0)
                print(f"  {page}")
                print(f"    clicks={clicks} impr={impr} ctr={ctr:.1f}% pos={pos:.1f}")
        else:
            print("  NO DATA YET")
    except Exception as e:
        print(f"  Error: {e}")

    # Devices
    print("\n" + "=" * 60)
    print("DEVICES (last 3 months)")
    print("=" * 60)
    try:
        request_body = {
            "startDate": "2026-06-10",
            "endDate": "2026-09-10",
            "dimensions": ["device"],
        }
        result = webmasters.searchanalytics().query(siteUrl=property_url, body=request_body).execute()
        rows = result.get("rows", [])
        for r in rows:
            print(f"  {r['keys'][0]}: clicks={r.get('clicks',0)} impr={r.get('impressions',0)}")
    except Exception as e:
        print(f"  Error: {e}")

    # Countries
    print("\n" + "=" * 60)
    print("COUNTRIES (last 3 months)")
    print("=" * 60)
    try:
        request_body = {
            "startDate": "2026-06-10",
            "endDate": "2026-09-10",
            "dimensions": ["country"],
            "rowLimit": 10,
        }
        result = webmasters.searchanalytics().query(siteUrl=property_url, body=request_body).execute()
        rows = result.get("rows", [])
        for r in rows:
            print(f"  {r['keys'][0]}: clicks={r.get('clicks',0)} impr={r.get('impressions',0)}")
    except Exception as e:
        print(f"  Error: {e}")

    # URL Inspection for key pages
    print("\n" + "=" * 60)
    print("URL INSPECTION")
    print("=" * 60)
    key_urls = [
        "https://maazulhaque.qd.je/",
        "https://maazulhaque.qd.je/work/orbit-android-app",
        "https://maazulhaque.qd.je/work/halal-pizza-fun",
        "https://maazulhaque.qd.je/work/acumen-ai",
    ]
    for url in key_urls:
        try:
            req_body = {"inspectionUrl": url, "siteUrl": property_url}
            result = webmasters.urlInspection().inspect(indexRequest=req_body).execute()
            idx = result.get("inspectionResult", {}).get("indexStatusResult", {})
            print(f"\n  {url}")
            print(f"    verdict: {idx.get('verdict', '?')}")
            print(f"    coverageState: {idx.get('coverageState', '?')}")
            print(f"    robotsTxtState: {idx.get('robotsTxtState', '?')}")
            print(f"    indexingState: {idx.get('indexingState', '?')}")
            print(f"    pageFetchState: {idx.get('pageFetchState', '?')}")
            canonical = idx.get("verdict", "?")
            google_canonical = idx.get("googleCanonical", "?")
            print(f"    googleCanonical: {google_canonical}")
        except Exception as e:
            print(f"\n  {url}")
            print(f"    Inspection error: {e}")

    # Submit sitemap if not already submitted
    sitemap_url = "https://maazulhaque.qd.je/sitemap.xml"
    already_submitted = False
    try:
        sitemaps = webmasters.sitemaps().list(siteUrl=property_url).execute()
        for sm in sitemaps.get("sitemap", []):
            if sm.get("path") == sitemap_url:
                already_submitted = True
    except:
        pass

    if not already_submitted:
        print("\n" + "=" * 60)
        print("SUBMITTING SITEMAP")
        print("=" * 60)
        try:
            webmasters.sitemaps().submit(siteUrl=property_url, feedpath=sitemap_url).execute()
            print(f"  Submitted: {sitemap_url}")
        except Exception as e:
            print(f"  Submit error: {e}")
    else:
        print(f"\n  Sitemap already submitted: {sitemap_url}")

print("\nDone.")
