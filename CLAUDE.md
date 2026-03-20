# Meetinghouse Bulletin

## Project Overview

An Astro static site that acts as a smart QR code redirect for three LDS (Church of Jesus Christ of Latter-day Saints) congregations sharing a meetinghouse in the Calgary Alberta West Stake, Canada.

When a QR code embedded in hymnals is scanned, the page detects the current time (Mountain Time / Calgary) and redirects to the appropriate ward's weekly announcement website. Outside of meeting windows, it shows a landing page with links to all three wards.

Ward data and special events are fetched from Google Sheets at **build time** and baked into the static output. No runtime fetch — the redirect fires instantly.

## Project Structure

```
src/
  lib/
    data.js           — fetchWardData() and fetchSpecialEvents(); both run at
                        build time; fall back gracefully if env vars are unset
  pages/
    index.astro       — single page; STAKE_NAME and PAGE_TITLE are constants
                        at the top of the frontmatter
scripts/
  trigger-deploy.gs   — Google Apps Script; paste into the Google Sheet to
                        trigger a site rebuild on every edit
.env.example          — documents all required environment variables
astro.config.mjs      — static output mode
```

## Redirect Priority (client-side, runs on page load)

1. **Active special event session** — is a special event session in progress right now? → redirect to its URL
2. **Conference day, between sessions** — is today a special event day but between sessions? → show conference card, hide ward cards
3. **Active ward window** — is it Sunday within a ward's time window? → redirect to that ward's URL
4. **Default** — show the ward landing page

## Ward Schedule

Configured in the Google Sheet (or in `src/lib/data.js` placeholder data):

| Ward | Meeting time | Auto-redirect window |
|------|-------------|----------------------|
| Rockyview Ward | 9:00 AM | 8:00 AM – 10:00 AM |
| Arbour Lake Ward | 10:30 AM | 10:00 AM – 11:30 AM |
| Bowness Ward | 12:00 PM | 11:30 AM – 1:00 PM |

Window start/end stored as **minutes since midnight** (480 = 8:00 AM).

## Google Sheet Structure

### Tab 1 — Ward data (`SHEET_CSV_URL`)

Row 1 must be a header with these exact column names:

| key | name | displayTime | windowStart | windowEnd | url |
|-----|------|-------------|-------------|-----------|-----|
| rockyview | Rockyview Ward | 9:00 AM | 480 | 600 | https://... |

### Tab 2 — Special events (`SPECIAL_EVENTS_CSV_URL`)

One row per session. Multiple sessions on the same date are supported.

| date | name | windowStart | windowEnd | url |
|------|------|-------------|-----------|-----|
| 2025-04-05 | General Conference | 540 | 660 | https://... |
| 2025-04-05 | General Conference | 780 | 900 | https://... |
| 2025-04-06 | General Conference | 540 | 660 | https://... |
| 2025-04-06 | General Conference | 780 | 900 | https://... |

`date` is `YYYY-MM-DD`. Publish each tab separately via **File → Share → Publish to web → CSV**.

## Special Events Behaviour

On a special event day, the landing page replaces the ward cards with a **conference card** showing:
- The event name
- All of today's session times
- A "Watch" button linking to the event URL

The ward schedule is hidden on special event days. During an active session window, the page auto-redirects to the event URL instead of a ward URL.

## Tech Stack

- **Astro 5** — static site generator; `output: 'static'`
- **Node.js ≥ 20**, **npm ≥ 10** (declared in `package.json` `engines` and `.tool-versions` for asdf)
- **Spectral** (Google Fonts) — serif display font; stands in for Church's McKay typeface
- **Source Sans 3** (Google Fonts) — sans-serif; stands in for Church's Zoram typeface
- Design follows the **Church of Jesus Christ GVSG** (Global Visual Style Guide):
  - Light Graphic: layered semi-transparent SVG polygons in brand teal, used in header and redirect screen
  - Colors: teal `#1A7FA0`, dark teal `#0D5468`, red `#B5202E`
  - "Now Meeting" shown in red italic — GVSG emphasis convention

## Key Implementation Details

- `src/lib/data.js` — `fetchWardData()` and `fetchSpecialEvents()` run at build time via `Promise.all()`; each returns placeholder/empty data if its env var is unset or the fetch fails
- `index.astro` frontmatter — transforms ward rows into `wardsConfig` and `windowsConfig`; transforms event rows into `specialEventsConfig`
- `define:vars={{ WARDS, WINDOWS, SPECIAL_EVENTS }}` — bakes all three configs into the page as inline JS; no runtime fetch needed
- `href` on ward cards is set in the Astro template at build time — only one place to update URLs (the sheet)
- Timezone: `America/Denver` (Mountain Time) for all time logic
- `getMountainDate()` returns `YYYY-MM-DD` for special event date matching

## Development

```bash
npm install
npm run dev       # local dev server (uses placeholder data if .env is absent)
npm run build     # static build → dist/
npm run preview   # preview the built site
```

Copy `.env.example` to `.env` and set `SHEET_CSV_URL` and `SPECIAL_EVENTS_CSV_URL` before building against live data.

## Deployment & Auto-Rebuild

Deploy `dist/` to any static host (Cloudflare Pages, Netlify, Vercel).

To auto-rebuild when either sheet tab is edited:
1. In the Google Sheet, open **Extensions → Apps Script**
2. Paste `scripts/trigger-deploy.gs`
3. Run `setWebhookUrl()` with your host's deploy hook URL
4. Add an **On edit** trigger pointing to `onSheetEdit`

The trigger fires on any edit to the first sheet tab. If you maintain ward data and special events in separate spreadsheets, install the script in both.
