# Current Project Status - Who Is Wrong

This file is the handoff note for continuing the Who Is Wrong project from the clean Blain project folder:

`C:\Users\blain\Documents\Codex\who-is-wrong`

Do not use the old `C:\Users\All\Documents\Codex\who-is-wrong` folder as the active working folder anymore. Treat it as an old backup only.

## Big Picture Goal

Who Is Wrong is the first small website/app in a larger plan to build a series of unique, useful, low-maintenance websites that can attract traffic over time and create passive income.

The owner prefers a low-key approach:

- no phone number collection
- no email list as a primary strategy
- no personal influencer/social media presence
- viral/self-sharing product design over public personal promotion
- low budget, high leverage marketing

Important documents:

- `PROJECT_PURPOSE.md`
- `BIG_PICTURE_STRATEGY.md`
- `MARKETING_PLAN.md`

## Current Website Structure

Main files and folders:

- `index.html` - main app
- `api/settle.js` - serverless verdict generator
- `relationship-debates/`
- `family-arguments/`
- `workplace-nonsense/`
- `friend-group-drama/`
- `household-disputes/`
- `everyday-arguments/`
- `settle-an-argument/`
- `privacy/`
- `terms/`
- `contact/`
- `gavel-hit.mp3`
- `gavel-web.svg`
- `header-gavel.png`
- `justice-scales.png`
- `og-image.png`
- `robots.txt`
- `sitemap.xml`
- `vercel.json`
- `package.json`

## Confirmed UX Fixes

The Android gavel timing is currently considered correct. Do not change it casually.

Backup file:

- `ANDROID_GAVEL_TIMING_BACKUP.md`

Known good timing details:

- Android hit times: `[120, 620, 1120]`
- mobile gavel strike animation: `0.28s`
- mobile impact flash animation: `0.22s`

Certificate layout is now self-sizing. The generator measures the actual rendered text and places the footer below it instead of guessing from word counts.

Known certificate layout details:

- function: `measureCertificateContentHeight(record)`
- footer gap: `footerGap: 44`
- certificate footer is placed after the final rendered sentence
- certificate text must stay inside the gold border
- lower "Certificate Ready" instructions should remain visible enough for users to understand what to do

History page behavior:

- `Return to Judge` appears above `Clear History`
- bottom of history page has a `Back to Top` button
- previous/next buttons only appear where they make sense
- first case does not need previous
- last case does not need next

Certificate preview page:

- only needs `Return to Judge` and `History Page`
- do not add previous/next buttons there; those belong on the history page

## Deployment Workflow

User expectation: after every website code change, redeploy to Vercel and verify live.

Vercel project:

- `blainechansons-projects/who-is-wrong`
- public launch domain: `https://whoiswrong.ai`
- Vercel fallback alias: `https://who-is-wrong.vercel.app`

GitHub repo:

- `https://github.com/blainechanson/who-is-wrong`

PowerShell note:

- plain `npx` is blocked by PowerShell script policy on this machine
- use `npx.cmd` instead when needed

Known working form:

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
& 'C:\Program Files\nodejs\npx.cmd' vercel --prod
```

The new Blain folder has been given the project files, Git link, and Vercel repo link. Private `.env.local` was intentionally not copied.

## Sandbox Issue Fixed

There was a Windows sandbox encryption error:

`windows sandbox: CryptUnprotectData failed: 2148073483`

This was fixed by renaming only the Codex sandbox folders:

- `C:\Users\blain\.codex\.sandbox.backup-20260701-121959`
- `C:\Users\blain\.codex\.sandbox-secrets.backup-20260701-121959`

Codex recreated fresh sandbox state and sandboxed read/write tests passed afterward.

## Marketing Direction

Marketing should be quiet, low-cost, and based on the website being inherently shareable.

Primary direction:

- optimize certificate sharing
- make each result funny and visual enough to send to someone
- seed lightly in relevant places
- avoid building a public personality around the owner

Small paid test idea:

- `$50-$100` Reddit ads test
- target relationship humor, family humor, and workplace humor

Avoid:

- email capture as the core plan
- phone capture
- heavy social posting by the owner
- anything that makes the owner publicly visible

## Working Rule Going Forward

Use this folder as the active project:

`C:\Users\blain\Documents\Codex\who-is-wrong`

If anything looks odd, compare against this file and the key docs before changing working behavior that was already confirmed.
