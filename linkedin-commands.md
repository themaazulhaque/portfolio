# LinkedIn Command Reference

> Quick reference for all LinkedIn commands available in OpenCode.

---

## Profile Commands

### /linkedin-profile
Audit and optimize your LinkedIn profile.
- Reads brand context for positioning
- Scores 9 profile components
- Rewrites headline, About, Featured, Experience
- Returns before/after diff

### /linkedin-profile-rewrite
Full profile rewrite (alias for /linkedin-profile with rewrite mode).

---

## Content Creation Commands

### /linkedin-post "topic"
Draft a LinkedIn post about a specific topic.
- Reads brand context for voice and positioning
- Picks best hook formula for the topic
- Runs humanizer pass
- Returns: draft, hook explanation, CTA, hashtags

### /linkedin-post-build "project name"
Draft a build-in-public post about a project.

### /linkedin-post-learn "technology"
Draft a technical education post about a technology.

### /linkedin-post-career "lesson"
Draft a career journey post about a lesson learned.

---

## Engagement Commands

### /linkedin-comment "post-url"
Draft a comment on a LinkedIn post.
- Reads brand context for voice
- Produces 2-3 comment variants
- Returns: drafts with template labels

### /linkedin-reply "comment-url"
Draft a reply to a LinkedIn comment.
- Handles thread flattening
- Returns: draft with thread context

### /linkedin-reshare "post-url"
Draft a reshare with commentary.

---

## Strategy Commands

### /linkedin-plan
Generate this week's content plan.
- Reads brand context for pillars
- Returns: 7-day calendar with topics, formulas, times

### /linkedin-plan-30
Generate 30-day content strategy.

### /linkedin-audit "post-text"
Audit a draft post before publishing.
- Checks for AI tells
- Checks hook quality
- Checks readability
- Returns: pass/fail + specific fixes

### /linkedin-humanize "text"
Rewrite text to remove AI tells.
- Runs forensic + strict scrub
- Returns: rewritten text + diff

### /linkedin-hooks "post-url"
Extract the hook formula from a viral post.
- Returns: formula, structure, template

---

## Analytics Commands

### /linkedin-threads
Check which comments need follow-up.

### /linkedin-engagers "post-url"
Analyze who engaged with a post.

### /linkedin-audit-weekly
Weekly performance review.

---

## Repurposing Commands

### /linkedin-repurpose "content"
Repurpose content from another platform.
- Takes tweet, thread, video, blog, newsletter
- Returns: native LinkedIn post

---

## System Commands

### /linkedin-voice
Show the current voice rules.

### /linkedin-brand
Show the current brand context.

### /linkedin-brand-edit
Edit the brand context file.

### /linkedin-strategy
Show the 30-day content strategy.

### /linkedin-cadence
Show the weekly content cadence.

---

## Publishing Status

**Publishing is DISABLED by default.**

To enable auto-publishing:
1. Get a Publora API key from https://app.publora.com/signup
2. Add to `.env`:
   ```
   PUBLORA_API_KEY=sk_your_key_here
   LINKEDIN_PLATFORM_ID=linkedin-your_id_here
   ```
3. All posts still require your explicit approval before publishing

---

## Quick Start

1. Read brand context: open `C:\projects\portfolio\linkedin-brand-context.md`
2. Generate a post: `/linkedin-post "What I learned deploying Next.js"`
3. Audit it: `/linkedin-audit "[paste the draft]"`
4. Humanize it: `/linkedin-humanize "[paste the draft]"`
5. Post it manually to LinkedIn (publishing is disabled)

---

## Files

- Brand context: `C:\projects\portfolio\linkedin-brand-context.md`
- Voice system: `C:\Users\hp\.config\opencode\skills\linkedin-voice-system\SKILL.md`
- 30-day strategy: `C:\projects\portfolio\linkedin-30day-strategy.md`
- LinkedIn skills repo: `C:\projects\portfolio\linkedin-skills\`
