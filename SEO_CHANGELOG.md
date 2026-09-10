# SEO Changelog

## 2026-09-10 — Phase 3: Search Console Baseline + Entity Signal Enhancement

### Search Console Findings

| Metric | Value |
|--------|-------|
| Property | `sc-domain:maazulhaque.qd.je` |
| Access Level | siteOwner |
| Sitemap Submitted | ✓ `https://maazulhaque.qd.je/sitemap.xml` |
| Sitemap Downloaded | ✓ 2026-09-10T18:19:22 |
| URLs Submitted | 4 |
| URLs Indexed | 0 |
| Search Analytics (28 days) | NO DATA |
| Search Analytics (90 days) | NO DATA |
| URL Inspection API | Not available for this property |

**Analysis**: The site is new and Google has discovered the sitemap but hasn't indexed any pages yet. This is normal for new domains. The site is fully crawlable with server-rendered HTML, proper metadata, and structured data.

### Changes Made

| File | Change | Purpose |
|------|--------|---------|
| `app/layout.tsx` | Enhanced homepage title with technology keywords | Better entity keyword targeting for "Maazul Haque developer" queries |
| `app/layout.tsx` | Enhanced meta description with location and case studies | More descriptive for search snippets |
| `app/layout.tsx` | Improved Person schema with Delhi, 8 years, AI products | Richer entity understanding |
| `app/layout.tsx` | Enhanced WebSite schema description | Better site purpose signaling |
| `app/work/[slug]/page.tsx` | Improved case study fallback descriptions | More descriptive meta for thin pages |

### Build Status
- `npm run build`: ✓ Compiled successfully

### Deployment
- Commit: `5dc17d9`
- Deploy: `dep-dahfcaijnfac738mjh4g` — LIVE
- Production URL: https://maazulhaque.qd.je

### Post-Deploy Verification
| Route | Status | Title | Canonical |
|-------|--------|-------|-----------|
| `/` | 200 | Maazul Haque — Software Engineer | ✓ |
| `/work/orbit-android-app` | 200 | Case Study by Maazul Haque | ✓ |
| `/work/halal-pizza-fun` | 200 | Case Study by Maazul Haque | ✓ |
| `/work/acumen-ai` | 200 | Case Study by Maazul Haque | ✓ |

---

## 2026-09-10 — Phase 2: Enhanced Structured Data & Entity Optimization

### Changes Made

| File | Change | Purpose |
|------|--------|---------|
| `app/layout.tsx` | Enhanced Person schema: added MongoDB, PostgreSQL, Software Engineering to `knowsAbout` | More accurate entity representation |
| `app/layout.tsx` | Added WebSite schema alongside Person schema | Helps Google understand site structure |
| `app/layout.tsx` | Improved default title to "Software Developer & Full-Stack Engineer" | Better entity keyword targeting |
| `app/layout.tsx` | Improved default meta description with Node.js, MongoDB | More accurate technology list |
| `app/layout.tsx` | Added `apple-touch-icon` link tag | iOS home screen support |
| `app/work/[slug]/page.tsx` | Added BreadcrumbList schema to case studies | Navigation structured data |
| `app/work/[slug]/page.tsx` | Added Article schema to case studies | Content type signaling |
| `app/work/[slug]/page.tsx` | Title pattern: "Case Study by Maazul Haque" | Entity association in SERPs |
| `app/work/[slug]/page.tsx` | Fallback description includes project category | Prevents thin content signals |
| `app/not-found.tsx` | Created custom 404 page | Proper 404 handling for crawlers |

### Build Status
- `npm run build`: ✓ Compiled successfully
- `npm run lint`: ✓ Passed

### Deployment
- Commit: `e34a6d1`
- Deploy: `dep-dahf3nmk1f9s73f79k6g` — LIVE
- Production URL: https://maazulhaque.qd.je

### Post-Deploy Verification
| Route | Status | Content-Type |
|-------|--------|-------------|
| `/` | 200 | text/html |
| `/robots.txt` | 200 | text/plain |
| `/sitemap.xml` | 200 | application/xml |
| `/manifest.json` | 200 | application/json |
| `/work/orbit-android-app` | 200 | text/html |
| `/work/halal-pizza-fun` | 200 | text/html |
| `/work/acumen-ai` | 200 | text/html |
| `/nonexistent-page` | 404 | Correct |

### Structured Data Verified
- Homepage: Person + WebSite schema present
- Case studies: Person + WebSite + BreadcrumbList + Article schema present
- Canonical URLs: Correct on all pages
- OG/Twitter tags: Present and correct

---

## Audit Summary (Phase 1)

### What Was Already Good
- Canonical URLs present and correct
- robots.txt allows crawling, disallows admin/api
- sitemap.xml valid with correct URLs
- JSON-LD Person schema with `sameAs`, `knowsAbout`
- Open Graph and Twitter cards present
- Single H1 on homepage
- Admin routes properly noindexed
- Case study pages have individual metadata
- OG images configured
- Responsive viewport meta

### What Was Improved
- WebSite schema added
- BreadcrumbList + Article schema added to case studies
- `knowsAbout` expanded with MongoDB, PostgreSQL
- Custom 404 page created
- Apple touch icon added
- Case study titles now include entity name
- Meta descriptions improved

### What Needs Search Console Data
- Baseline impressions/clicks/CTR
- Top queries and pages
- Indexing status
- URL inspection
- Sitemap submission status
- Ranking opportunity analysis
