# Who Is Wrong - Project Purpose

## What This Project Is

Who Is Wrong is a funny, entertainment-only web app that helps people settle harmless everyday arguments with a mock-serious AI judge.

Users enter two names and two sides of a low-stakes dispute. The site sends the case to a serverless API, receives a short parody courtroom judgement, and presents a clear winner with a silly harmless punishment for the loser.

The project is not meant to provide real advice, mediation, counselling, legal judgement, or serious dispute resolution. It is a playful shareable experience for petty debates, silly conflicts, and social laughs.

## Core Product Promise

Give people a quick, funny, screenshot-worthy answer to:

> Who is wrong here?

The answer should feel decisive, theatrical, and unserious in the best way.

## Target Use Cases

- Couples debating harmless relationship habits.
- Roommates arguing about chores, snacks, dishes, laundry, or shared spaces.
- Friends settling group chat drama, late arrivals, plans, photos, or tiny social crimes.
- Families arguing about leftovers, traditions, TV choices, or sibling nonsense.
- Coworkers joking about meetings, coffee, reply-all emails, or office etiquette.
- Anyone who wants a funny third-party verdict without making the issue serious.

## What The Site Should Feel Like

- A tiny online courthouse for petty arguments.
- Mock-serious, dramatic, and playful.
- Fast enough to use casually on a phone.
- Safe, non-cruel, and clearly unofficial.
- Designed for sharing a verdict image or screenshot.

The tone should be funny without being mean. The judge can be dramatic, but the product should never punch down or encourage bullying.

## Main User Flow

1. User lands on the homepage.
2. User enters Party A name and argument.
3. User enters Party B name and counter-argument.
4. User clicks "Slam the Gavel".
5. The gavel animation and sound play while the API generates a judgement.
6. The verdict appears as an "Official Decree" with three sections:
   - I. The Indictment
   - II. The Judicial Opinion
   - III. The Absolute Decree
7. User can share or download a generated certificate image.
8. User can view recent case history stored only in the current browser session.

## Important Product Boundaries

Who Is Wrong should only handle harmless, low-stakes disputes.

It should avoid:

- Real legal, medical, financial, mental-health, or counselling advice.
- Serious accusations or harmful conflict.
- Private, sensitive, identifying, defamatory, bullying, or unsafe content.
- Cruel insults or protected-class jokes.
- Politics, religion, sexual content, or niche references that make the joke feel risky or less universal.

The product must continue to communicate that it is for entertainment only.

## Current Technical Structure

This is a static HTML project deployed in a Vercel-style structure.

- `index.html` is the main app experience.
- `api/settle.js` is the serverless API endpoint that validates input, checks rate limits, calls OpenAI, sanitizes returned HTML, and returns the verdict.
- `vercel.json` configures security headers and rewrites `/api/settle` to `/api/settle.js`.
- `package.json` defines the runtime dependencies.
- SEO/support pages live in their own folders with `index.html` files.
- Image and audio assets live at the project root.

## Key Features

- Two-sided argument form.
- Character limits and client-side validation.
- Gavel animation and sound while waiting.
- OpenAI-generated parody verdict.
- Sanitized HTML response before rendering.
- Upstash Redis rate limiting.
- Browser-session case history for the last 8 verdicts.
- Shareable/downloadable certificate image generated on the client.
- SEO landing pages for common argument categories.
- Privacy, terms, and contact pages.
- Sponsor spaces at the top and bottom of the homepage.
- Vercel Analytics script on the homepage.

## API Behavior

The `/api/settle` endpoint:

- Accepts `POST` requests with `nameA`, `argA`, `nameB`, and `argB`.
- Rejects missing, too-short, too-simple, or identical arguments.
- Uses hashed IP-based rate limiting with Upstash Redis.
- Requires `OPENAI_API_KEY`.
- Uses a mock courtroom system prompt.
- Requires one clear winner.
- Returns clean sanitized HTML with only the expected verdict sections.

## SEO Content Strategy

The project includes category pages that help users find the site through common argument-related searches and also provide harmless case ideas.

Current SEO/support page groups:

- `settle-an-argument`
- `relationship-debates`
- `friend-group-drama`
- `household-disputes`
- `family-arguments`
- `workplace-nonsense`
- `everyday-arguments`
- `privacy`
- `terms`
- `contact`

These pages should stay aligned with the main promise: funny, harmless, low-stakes argument settlement.

## Brand Voice

Use language like:

- "petty disputes"
- "silly debates"
- "mock-serious courtroom"
- "completely unofficial verdict"
- "the court"
- "slam the gavel"
- "official decree"
- "judgement quota"

Avoid language that makes the product sound like:

- Real arbitration.
- Therapy or counselling.
- Legal judgement.
- Conflict mediation.
- A serious truth-finding tool.

## Development Notes

When changing the project, preserve these priorities:

1. Keep the experience fast and easy on mobile.
2. Keep the verdict funny, decisive, and harmless.
3. Keep the safety boundaries obvious.
4. Keep generated HTML sanitized.
5. Keep API usage protected by rate limits.
6. Keep SEO pages useful but not bloated.
7. Keep the project simple: static pages plus one serverless endpoint.


## Larger Context

Who Is Wrong is the first project in a broader plan to build a portfolio of unique, useful, or entertaining websites and apps that can grow audiences and create passive income over time. See `BIG_PICTURE_STRATEGY.md` for that higher-level goal.

## One-Sentence North Star

Who Is Wrong turns harmless everyday arguments into funny, shareable parody court verdicts, while staying clearly entertainment-only and safe for casual use.
